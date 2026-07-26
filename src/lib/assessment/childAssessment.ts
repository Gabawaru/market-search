import { prisma } from "@/lib/db/prisma";
import { buildNarrative } from "@/lib/assessment/narrative";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Régularité (jours actifs / jours de la période) + volume (exercices vs attendu ~3/jour) —
 * l'effort compte autant que le résultat brut, jamais par favoritisme : uniquement des faits. */
export async function computeEffortScore(
  childId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  const totalDays = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / ONE_DAY_MS));
  const attempts = await prisma.exerciseAttempt.findMany({
    where: { childId, createdAt: { gte: periodStart, lte: periodEnd } },
    select: { createdAt: true },
  });

  const activeDays = new Set(attempts.map((a) => a.createdAt.toDateString())).size;
  const regularity = Math.min(1, activeDays / totalDays);
  const expectedVolume = totalDays * 3;
  const volume = Math.min(1, attempts.length / Math.max(1, expectedVolume));

  return clamp(regularity * 0.6 + volume * 0.4, 0, 1);
}

export async function computeObjectiveScore(
  childId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      childId,
      finishedAt: { gte: periodStart, lte: periodEnd },
      status: { in: ["COMPLETED", "INVALIDATED"] },
    },
  });

  if (evaluations.length > 0) {
    const sum = evaluations.reduce((acc, e) => acc + (e.totalScore ?? 0), 0);
    return sum / evaluations.length;
  }

  const progress = await prisma.childSkillProgress.findMany({ where: { childId } });
  if (progress.length === 0) return 0;
  return progress.reduce((acc, p) => acc + p.masteryScore, 0) / progress.length;
}

export async function generateChildAssessment(
  childId: string,
  periodStart: Date,
  periodEnd: Date,
  generatedBy: string = "manual",
) {
  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });

  const [objectiveScore, effortScore, exerciseCount, evaluations] = await Promise.all([
    computeObjectiveScore(childId, periodStart, periodEnd),
    computeEffortScore(childId, periodStart, periodEnd),
    prisma.exerciseAttempt.count({
      where: { childId, createdAt: { gte: periodStart, lte: periodEnd } },
    }),
    prisma.evaluation.findMany({
      where: {
        childId,
        finishedAt: { gte: periodStart, lte: periodEnd },
        status: { in: ["COMPLETED", "INVALIDATED"] },
      },
    }),
  ]);

  const passedCount = evaluations.filter((e) => e.passed).length;
  const narrative = buildNarrative({
    childName: child.name,
    objectiveScore,
    effortScore,
    exerciseCount,
    evaluationCount: evaluations.length,
    passedCount,
  });

  return prisma.childAssessment.create({
    data: { childId, periodStart, periodEnd, objectiveScore, effortScore, narrative, generatedBy },
  });
}
