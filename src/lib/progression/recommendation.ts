import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isReadyForEvaluation } from "@/lib/progression/unlockRules";

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export interface SkillCandidate {
  skillId: string;
  order: number;
  masteryScore: number;
  attemptsCount: number;
  readyForEvaluation: boolean;
}

export interface PickedRecommendation {
  skillId: string;
  reason: string;
}

/** Pure : choisit "le cours du jour" façon Duolingo, sans base de données — toujours au moins un
 * résultat tant qu'il y a au moins une compétence candidate.
 *
 * 1. Une compétence déjà entamée et pas encore prête pour l'évaluation : celle où la maîtrise est
 *    la plus proche du seuil (le plus motivant à finir aujourd'hui).
 * 2. Sinon, une compétence prête pour l'évaluation : encourage à passer le cap.
 * 3. Sinon (rien de commencé) : la première compétence du programme, dans l'ordre. */
export function pickDailyRecommendation(candidates: SkillCandidate[]): PickedRecommendation | null {
  if (candidates.length === 0) return null;

  const inProgress = candidates.filter((c) => c.attemptsCount > 0 && !c.readyForEvaluation);
  if (inProgress.length > 0) {
    const best = inProgress.reduce((a, b) => (b.masteryScore > a.masteryScore ? b : a));
    return { skillId: best.skillId, reason: "Continue cette compétence, tu es sur le point de progresser." };
  }

  const readyOnes = candidates.filter((c) => c.readyForEvaluation);
  if (readyOnes.length > 0) {
    const best = readyOnes.reduce((a, b) => (b.order < a.order ? b : a));
    return { skillId: best.skillId, reason: "Tu es prêt·e pour l'évaluation de cette compétence !" };
  }

  const fresh = [...candidates].sort((a, b) => a.order - b.order)[0];
  return { skillId: fresh.skillId, reason: "Découvre une nouvelle compétence aujourd'hui." };
}

/** Calcule (et mémorise) la recommandation du jour pour un enfant. Un seul calcul par jour civil
 * grâce à l'index unique [childId, date] : revenir un autre jour déclenche naturellement un
 * nouveau calcul, sans tâche planifiée à maintenir. */
export async function getOrCreateDailyRecommendation(childId: string, now = new Date()) {
  const today = startOfDay(now);

  const existing = await prisma.dailyRecommendation.findUnique({
    where: { childId_date: { childId, date: today } },
    include: { skill: true },
  });
  if (existing) return existing;

  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });
  const age = now.getFullYear() - child.birthYear;

  const skills = await prisma.skill.findMany({
    where: { minAge: { lte: age } },
    orderBy: { order: "asc" },
  });
  if (skills.length === 0) return null;

  const progress = await prisma.childSkillProgress.findMany({ where: { childId } });

  const candidates: SkillCandidate[] = [];
  for (const skill of skills) {
    const skillProgress = progress.find((p) => p.skillId === skill.id);
    if (!skillProgress || !skillProgress.currentLevelId) {
      candidates.push({
        skillId: skill.id,
        order: skill.order,
        masteryScore: 0,
        attemptsCount: 0,
        readyForEvaluation: false,
      });
      continue;
    }

    const level = await prisma.level.findUniqueOrThrow({ where: { id: skillProgress.currentLevelId } });
    const attemptsCount = await prisma.exerciseAttempt.count({
      where: { childId, exerciseInstance: { exercise: { levelId: level.id } } },
    });
    candidates.push({
      skillId: skill.id,
      order: skill.order,
      masteryScore: skillProgress.masteryScore,
      attemptsCount,
      readyForEvaluation: isReadyForEvaluation(skillProgress.masteryScore, attemptsCount, level),
    });
  }

  const picked = pickDailyRecommendation(candidates);
  if (!picked) return null;

  try {
    return await prisma.dailyRecommendation.create({
      data: { childId, skillId: picked.skillId, date: today, reason: picked.reason },
      include: { skill: true },
    });
  } catch (error) {
    // Course rare (deux requêtes concurrentes le même jour) : l'index unique a déjà tranché,
    // on relit simplement l'enregistrement gagnant plutôt que de faire échouer la page.
    if (isUniqueConstraintError(error)) {
      return prisma.dailyRecommendation.findUniqueOrThrow({
        where: { childId_date: { childId, date: today } },
        include: { skill: true },
      });
    }
    throw error;
  }
}
