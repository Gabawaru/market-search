import { prisma } from "@/lib/db/prisma";
import type { Level } from "@/generated/prisma/client";

export async function getOrCreateSkillProgress(childId: string, skillId: string) {
  const existing = await prisma.childSkillProgress.findUnique({
    where: { childId_skillId: { childId, skillId } },
  });
  if (existing) return existing;

  const firstLevel = await prisma.level.findFirst({
    where: { skillId },
    orderBy: { order: "asc" },
  });

  return prisma.childSkillProgress.create({
    data: { childId, skillId, currentLevelId: firstLevel?.id, masteryScore: 0 },
  });
}

/** Moyenne de réussite sur les `minExerciseCount` dernières tentatives du niveau
 * (ou moins si l'enfant n'a pas encore assez pratiqué). */
export async function recomputeMastery(childId: string, levelId: string): Promise<number> {
  const level = await prisma.level.findUniqueOrThrow({ where: { id: levelId } });
  const attempts = await prisma.exerciseAttempt.findMany({
    where: { childId, exerciseInstance: { exercise: { levelId } } },
    orderBy: { createdAt: "desc" },
    take: level.minExerciseCount,
  });

  if (attempts.length === 0) return 0;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  return correctCount / attempts.length;
}

export function isReadyForEvaluation(
  masteryScore: number,
  attemptsCount: number,
  level: Pick<Level, "unlockThreshold" | "minExerciseCount">,
): boolean {
  return attemptsCount >= level.minExerciseCount && masteryScore >= level.unlockThreshold;
}

/** "Test out" façon Duolingo : un enfant confiant peut tenter l'évaluation directement, sans
 * avoir fait le nombre d'exercices habituellement requis — l'évaluation elle-même reste tout
 * aussi exigeante (même unlockThreshold, mêmes garde-fous anti-triche), seul le pré-requis de
 * pratique est sauté. Level.retryCooldownHours (jusque-là jamais utilisé nulle part dans le
 * code) empêche de retenter un skip en boucle juste après un échec. */
export function canAttemptSkipEvaluation(
  lastEvaluationStartedAt: Date | null,
  now: Date,
  retryCooldownHours: number,
): boolean {
  if (!lastEvaluationStartedAt) return true;
  const elapsedHours = (now.getTime() - lastEvaluationStartedAt.getTime()) / (1000 * 60 * 60);
  return elapsedHours >= retryCooldownHours;
}

/** Signale qu'un enfant pratique beaucoup une compétence sans progresser — au-delà du double du
 * nombre d'exercices normalement nécessaire pour être prêt, sans avoir atteint le seuil. Sert à
 * suggérer un accompagnement par un vrai prof plutôt que de laisser l'enfant s'entraîner dans le
 * vide indéfiniment (voir src/app/(parent)/dashboard/[childId]/page.tsx). */
export function isStrugglingWithSkill(
  masteryScore: number,
  attemptsCount: number,
  level: Pick<Level, "unlockThreshold" | "minExerciseCount">,
): boolean {
  return attemptsCount >= level.minExerciseCount * 2 && masteryScore < level.unlockThreshold;
}

/** Recalcule l'éligibilité côté serveur pour une compétence donnée — ne jamais faire
 * confiance à un enfant qui déclencherait un démarrage d'évaluation directement via l'API. */
export async function checkEvaluationEligibility(childId: string, skillId: string) {
  const progress = await getOrCreateSkillProgress(childId, skillId);
  if (!progress.currentLevelId) {
    return { eligible: false, level: null as Level | null };
  }
  const level = await prisma.level.findUniqueOrThrow({ where: { id: progress.currentLevelId } });
  const masteryScore = await recomputeMastery(childId, level.id);
  const attemptsCount = await prisma.exerciseAttempt.count({
    where: { childId, exerciseInstance: { exercise: { levelId: level.id } } },
  });
  return { eligible: isReadyForEvaluation(masteryScore, attemptsCount, level), level };
}

/** Avance l'enfant au niveau suivant de la compétence après une évaluation réussie. */
export async function advanceToNextLevelIfPassed(childId: string, currentLevelId: string) {
  const currentLevel = await prisma.level.findUniqueOrThrow({ where: { id: currentLevelId } });
  const nextLevel = await prisma.level.findFirst({
    where: { skillId: currentLevel.skillId, order: currentLevel.order + 1 },
  });

  await prisma.childSkillProgress.update({
    where: { childId_skillId: { childId, skillId: currentLevel.skillId } },
    data: { currentLevelId: nextLevel?.id ?? currentLevelId, masteryScore: 0 },
  });
}
