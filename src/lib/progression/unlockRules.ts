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
