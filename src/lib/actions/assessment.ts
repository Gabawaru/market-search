"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { generateChildAssessment } from "@/lib/assessment/childAssessment";

export async function generateWeeklyAssessment(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const childId = formData.get("childId");
  if (typeof childId !== "string") {
    redirect("/dashboard");
  }

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) {
    redirect("/dashboard");
  }

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  await generateChildAssessment(childId, periodStart, periodEnd, "manual");

  redirect(`/dashboard/${childId}/reports`);
}

// Corrige une réponse libre (FREE_TEXT) d'évaluation, jamais notée automatiquement (voir
// submitEvaluationAnswer dans lib/evaluation/flow.ts — seule la suspicion IA y est calculée).
// Le parent est le correcteur choisi ici (plus universel qu'un prof, puisque tous les enfants
// n'ont pas de cours particulier en cours). Met à jour le score affiché pour qu'il reflète la
// vraie correction, mais ne redéclenche volontairement jamais l'attribution de points,
// l'avancement de niveau ou les badges : ceux-ci ont déjà été décidés au moment où l'évaluation
// s'est terminée (traiter une réponse pas encore corrigée comme fausse est le choix prudent par
// défaut, cohérent avec le reste de la logique anti-triche).
export async function gradeEvaluationAttempt(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const attemptId = formData.get("attemptId");
  const childId = formData.get("childId");
  const isCorrect = formData.get("isCorrect") === "true";
  if (typeof attemptId !== "string" || typeof childId !== "string") {
    redirect("/dashboard");
  }

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) {
    redirect("/dashboard");
  }

  // scoreOverride: null exclut les tentatives déjà zérées par l'anti-triche (voir
  // lib/integrity/scoring.ts) — jamais écraser cette décision.
  const attempt = await prisma.evaluationAttempt.findFirst({
    where: {
      id: attemptId,
      isCorrect: null,
      scoreOverride: null,
      evaluation: { childId, status: "COMPLETED" },
      exerciseInstance: { exercise: { type: "FREE_TEXT" } },
    },
  });
  if (!attempt) {
    redirect(`/dashboard/${childId}`);
  }

  await prisma.evaluationAttempt.update({
    where: { id: attempt.id },
    data: { scoreOverride: isCorrect ? 1 : 0 },
  });

  const allAttempts = await prisma.evaluationAttempt.findMany({
    where: { evaluationId: attempt.evaluationId },
  });
  const total = allAttempts.length;
  const scored = allAttempts.reduce(
    (sum, a) => sum + (a.scoreOverride ?? (a.isCorrect ? 1 : 0)),
    0,
  );
  await prisma.evaluation.update({
    where: { id: attempt.evaluationId },
    data: { totalScore: total > 0 ? scored / total : 0 },
  });

  redirect(`/dashboard/${childId}`);
}
