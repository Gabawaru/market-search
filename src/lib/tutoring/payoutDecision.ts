import { prisma } from "@/lib/db/prisma";
import { computeEffortScore } from "@/lib/assessment/childAssessment";
import type { Prisma } from "@/generated/prisma/client";

/** Pure : un enfant ne peut pas être éligible sans au moins une évaluation vérifiable sur la
 * période — évite qu'une absence totale de contrôle passe pour "objectif atteint". */
export function computePayoutStatus(
  achievedScore: number,
  targetScore: number,
  evaluationCount: number,
): "ELIGIBLE" | "NOT_ELIGIBLE" {
  return evaluationCount > 0 && achievedScore >= targetScore ? "ELIGIBLE" : "NOT_ELIGIBLE";
}

/**
 * Calcule la décision de rémunération sur la trajectoire complète de la période de suivi
 * (pas sur une seule évaluation) — un sabotage ponctuel de l'enfant ne suffit donc pas à
 * faire échouer artificiellement l'objectif. Décision archivée, immuable : toute correction
 * crée une nouvelle ligne référençant la précédente (`supersedesId`), jamais d'UPDATE.
 */
export async function decideTutoringPayout(tutoringRequestId: string) {
  const request = await prisma.tutoringRequest.findUniqueOrThrow({
    where: { id: tutoringRequestId },
    include: { child: true },
  });

  if (!request.periodStart || !request.periodEnd) {
    throw new Error("Période de suivi non définie pour cette demande");
  }

  const evaluations = await prisma.evaluation.findMany({
    where: {
      childId: request.childId,
      levelId: request.targetLevelId,
      finishedAt: { gte: request.periodStart, lte: request.periodEnd },
      status: { in: ["COMPLETED", "INVALIDATED"] },
    },
  });

  const achievedScore =
    evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / evaluations.length
      : 0;

  const effortScore = await computeEffortScore(
    request.childId,
    request.periodStart,
    request.periodEnd,
  );

  const status = computePayoutStatus(achievedScore, request.targetScore, evaluations.length);
  const objectiveMet = status === "ELIGIBLE";
  const amountSimulated = objectiveMet ? request.proposedRate : 0;

  const achievedPercent = Math.round(achievedScore * 100);
  const targetPercent = Math.round(request.targetScore * 100);
  const explanation =
    evaluations.length === 0
      ? `Aucune évaluation sur la compétence ciblée n'a été passée pendant la période — objectif non vérifiable, non éligible par précaution.`
      : objectiveMet
        ? `${request.child.name} a atteint l'objectif (${achievedPercent}% en moyenne sur ${evaluations.length} évaluation${evaluations.length > 1 ? "s" : ""} contre ${targetPercent}% visé), sur l'ensemble de la période de suivi.`
        : `${request.child.name} n'a pas encore atteint l'objectif (${achievedPercent}% en moyenne sur ${evaluations.length} évaluation${evaluations.length > 1 ? "s" : ""} contre ${targetPercent}% visé) sur l'ensemble de la période — la décision se base sur la trajectoire complète, pas sur un seul contrôle.`;

  const previous = await prisma.tutoringPayoutDecision.findFirst({
    where: { tutoringRequestId },
    orderBy: { decidedAt: "desc" },
  });

  return prisma.tutoringPayoutDecision.create({
    data: {
      tutoringRequestId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      status,
      achievedScore,
      effortScore,
      amountSimulated,
      explanation,
      assessmentSnapshot: {
        evaluationIds: evaluations.map((e) => e.id),
        evaluationScores: evaluations.map((e) => e.totalScore ?? 0),
      } as unknown as Prisma.InputJsonObject,
      supersedesId: previous?.id,
    },
  });
}
