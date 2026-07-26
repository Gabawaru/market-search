import { prisma } from "@/lib/db/prisma";
import { createExerciseInstance } from "@/lib/exercises/instance";
import { answersMatch } from "@/lib/exercises/answerMatching";
import { issueEvaluationToken } from "@/lib/auth/evaluationToken";
import { checkEvaluationEligibility, advanceToNextLevelIfPassed } from "@/lib/progression/unlockRules";
import { getAiTextDetector } from "@/lib/integrity/aiTextDetector";
import { recordIntegrityEvent } from "@/lib/integrity/scoring";
import { awardPoints } from "@/lib/progression/points";
import { recordDailyActivity } from "@/lib/progression/streaks";
import { maybeAwardBadge } from "@/lib/progression/badges";
import type { Prisma } from "@/generated/prisma/client";

export class EvaluationEligibilityError extends Error {}

export async function startEvaluation(childId: string, skillId: string) {
  const { eligible, level } = await checkEvaluationEligibility(childId, skillId);
  if (!eligible || !level) {
    throw new EvaluationEligibilityError(
      "Pas encore prêt pour l'évaluation sur cette compétence — continue à t'entraîner.",
    );
  }

  const exercises = await prisma.exercise.findMany({ where: { levelId: level.id } });
  if (exercises.length === 0) {
    throw new Error("Aucun exercice configuré pour ce niveau");
  }

  const evaluation = await prisma.evaluation.create({
    data: { childId, levelId: level.id, status: "IN_PROGRESS", startedAt: new Date() },
  });

  const attempts: { attemptId: string; order: number; promptText: string }[] = [];
  for (let i = 0; i < level.evaluationExerciseCount; i++) {
    const exercise = exercises[Math.floor(Math.random() * exercises.length)];
    const instance = await createExerciseInstance(exercise);
    const attempt = await prisma.evaluationAttempt.create({
      data: { evaluationId: evaluation.id, exerciseInstanceId: instance.id, order: i + 1 },
    });
    attempts.push({ attemptId: attempt.id, order: attempt.order, promptText: instance.promptText });
  }

  const token = await issueEvaluationToken({ evaluationId: evaluation.id, childId });
  await prisma.evaluation.update({
    where: { id: evaluation.id },
    data: { sessionToken: token, lastHeartbeatAt: new Date() },
  });

  return { evaluationId: evaluation.id, token, attempts };
}

export async function heartbeatEvaluation(evaluationId: string, childId: string) {
  const evaluation = await prisma.evaluation.findUniqueOrThrow({ where: { id: evaluationId } });
  if (evaluation.childId !== childId || evaluation.status !== "IN_PROGRESS") {
    return null;
  }

  const token = await issueEvaluationToken({ evaluationId, childId });
  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { sessionToken: token, lastHeartbeatAt: new Date() },
  });
  return token;
}

export interface SubmitAnswerParams {
  evaluationId: string;
  childId: string;
  attemptId: string;
  answerGiven: string;
  timeTakenMs: number;
}

export async function submitEvaluationAnswer(params: SubmitAnswerParams) {
  const attempt = await prisma.evaluationAttempt.findUniqueOrThrow({
    where: { id: params.attemptId },
    include: { exerciseInstance: { include: { exercise: true } }, evaluation: true },
  });

  if (attempt.evaluationId !== params.evaluationId || attempt.evaluation.childId !== params.childId) {
    throw new Error("Tentative invalide pour cette évaluation");
  }

  const correctAnswer = attempt.exerciseInstance.correctAnswer as { value: string };
  let isCorrect: boolean | null;
  let suspicionScore: number | null = null;

  if (attempt.exerciseInstance.exercise.type === "FREE_TEXT") {
    // Réponse libre : jamais auto-notée par simple correspondance de texte — le détecteur
    // heuristique évalue seulement la suspicion, la notation reste à réviser par le parent/prof.
    const detector = getAiTextDetector();
    const child = await prisma.child.findUniqueOrThrow({ where: { id: params.childId } });
    const writingProfile = await prisma.childWritingProfile.findUnique({
      where: { childId: params.childId },
    });
    const childAgeYears = new Date().getFullYear() - child.birthYear;

    const result = await detector.detect({
      text: params.answerGiven,
      childAgeYears,
      timeTakenMs: params.timeTakenMs,
      exercisePromptLength: attempt.exerciseInstance.promptText.length,
      writingProfile: writingProfile ?? undefined,
    });
    suspicionScore = result.suspicionScore;
    isCorrect = null;

    if (result.suspicionScore > 60) {
      await recordIntegrityEvent({
        evaluationId: params.evaluationId,
        childId: params.childId,
        evaluationAttemptId: attempt.id,
        type: "AI_TEXT_SUSPECTED",
        metadata: {
          suspicionScore: result.suspicionScore,
          signals: result.signals,
        } as unknown as Prisma.InputJsonObject,
      });
    }
  } else {
    isCorrect = answersMatch(params.answerGiven, correctAnswer.value);
  }

  await prisma.evaluationAttempt.update({
    where: { id: attempt.id },
    data: {
      answerGiven: { value: params.answerGiven },
      isCorrect,
      suspicionScore,
      timeTakenMs: params.timeTakenMs,
      answeredAt: new Date(),
    },
  });

  return { isCorrect };
}

export async function finishEvaluation(evaluationId: string, childId: string) {
  const evaluation = await prisma.evaluation.findUniqueOrThrow({
    where: { id: evaluationId },
    include: { level: true, attempts: true },
  });
  if (evaluation.childId !== childId) {
    throw new Error("Évaluation invalide pour cet enfant");
  }

  const alreadyInvalidated = evaluation.status === "INVALIDATED";
  const total = evaluation.attempts.length;
  const scored = evaluation.attempts.reduce((sum, attempt) => {
    if (attempt.scoreOverride !== null) return sum + attempt.scoreOverride;
    return sum + (attempt.isCorrect ? 1 : 0);
  }, 0);
  const totalScore = total > 0 ? scored / total : 0;
  const passed = !alreadyInvalidated && totalScore >= evaluation.level.unlockThreshold;

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      status: alreadyInvalidated ? "INVALIDATED" : "COMPLETED",
      finishedAt: new Date(),
      totalScore,
      passed,
    },
  });

  if (passed) {
    await advanceToNextLevelIfPassed(childId, evaluation.levelId);
  }

  // Aucun point sur une évaluation invalidée (anomalie d'intégrité détectée) ; participation
  // récompensée même en cas d'échec pour encourager à retenter, réussite largement récompensée.
  if (!alreadyInvalidated) {
    if (passed) {
      await awardPoints(childId, "EARNED_EVALUATION", 50, "Évaluation réussie");
      const passedCount = await prisma.evaluation.count({ where: { childId, passed: true } });
      if (passedCount === 1) {
        await maybeAwardBadge(childId, "first_evaluation_passed");
      }
    } else {
      await awardPoints(childId, "EARNED_EVALUATION", 10, "Évaluation tentée");
    }
  }
  await recordDailyActivity(childId);

  return { totalScore, passed, invalidated: alreadyInvalidated };
}
