import { prisma } from "@/lib/db/prisma";
import { isStrugglingWithSkill } from "@/lib/progression/unlockRules";
import type { TutoringRequestStatus } from "@/generated/prisma/client";

/** Une demande PENDING n'est qu'une sollicitation que le prof n'a pas encore acceptée, et une
 * demande DECLINED a été refusée : ni l'une ni l'autre ne crée de lien avec l'enfant. Seul un
 * accompagnement réellement noué — accepté, en cours, ou terminé — ouvre la visibilité. */
const RELATIONSHIP_STATUSES: TutoringRequestStatus[] = ["ACCEPTED", "ACTIVE", "ENDED"];

export function grantsTeacherVisibility(status: TutoringRequestStatus): boolean {
  return RELATIONSHIP_STATUSES.includes(status);
}

/** Périmètre d'observation d'un prof : strictement les enfants avec qui il a déjà une relation
 * autorisée (accompagnement noué, ou fil de discussion partagé). Jamais "tous les enfants" —
 * un prof ne doit rien apprendre d'un enfant auquel rien ne le relie. */
export async function listChildIdsVisibleToTeacher(teacherId: string): Promise<string[]> {
  const [requests, childParticipants] = await Promise.all([
    prisma.tutoringRequest.findMany({
      where: { teacherId, status: { in: RELATIONSHIP_STATUSES } },
      select: { childId: true },
    }),
    prisma.chatThreadParticipant.findMany({
      where: {
        role: "CHILD",
        thread: { participants: { some: { role: "TEACHER", teacherId } } },
      },
      select: { childId: true },
    }),
  ]);

  const childIds = new Set<string>();
  for (const request of requests) childIds.add(request.childId);
  for (const participant of childParticipants) {
    if (participant.childId) childIds.add(participant.childId);
  }
  return [...childIds];
}

export interface StrugglingChildSignal {
  childId: string;
  childName: string;
  skillId: string;
  skillName: string;
  masteryPercent: number;
}

/** Même règle que le bandeau côté parent (isStrugglingWithSkill), mais restreinte au périmètre
 * du prof : il voit qu'un enfant qu'il suit déjà patine, pour pouvoir prendre les devants. */
export async function listStrugglingChildrenForTeacher(
  teacherId: string,
): Promise<StrugglingChildSignal[]> {
  const childIds = await listChildIdsVisibleToTeacher(teacherId);
  if (childIds.length === 0) return [];

  const progressEntries = await prisma.childSkillProgress.findMany({
    where: { childId: { in: childIds } },
    include: { child: true, skill: true },
    orderBy: { skill: { order: "asc" } },
  });

  const signals: StrugglingChildSignal[] = [];
  for (const progress of progressEntries) {
    if (!progress.currentLevelId) continue;
    const level = await prisma.level.findUnique({ where: { id: progress.currentLevelId } });
    if (!level) continue;
    const attemptsCount = await prisma.exerciseAttempt.count({
      where: {
        childId: progress.childId,
        exerciseInstance: { exercise: { levelId: level.id } },
      },
    });
    if (isStrugglingWithSkill(progress.masteryScore, attemptsCount, level)) {
      signals.push({
        childId: progress.childId,
        childName: progress.child.name,
        skillId: progress.skillId,
        skillName: progress.skill.name,
        masteryPercent: Math.round(progress.masteryScore * 100),
      });
    }
  }
  return signals;
}
