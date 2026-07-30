import { prisma } from "@/lib/db/prisma";
import { createExerciseInstance } from "@/lib/exercises/instance";
import { answersMatch } from "@/lib/exercises/answerMatching";
import {
  getOrCreateSkillProgress,
  recomputeMastery,
  isReadyForEvaluation,
} from "@/lib/progression/unlockRules";
import { awardPoints } from "@/lib/progression/points";
import { recordDailyActivity } from "@/lib/progression/streaks";
import { checkExerciseCountBadges } from "@/lib/progression/badges";
import {
  HELP_OFFER_CONSECUTIVE_INCORRECT,
  countTrailingIncorrect,
  shouldOfferHelp,
} from "@/lib/progression/helpRequests";

export async function getNextPracticeExercise(childId: string, skillId: string) {
  const progress = await getOrCreateSkillProgress(childId, skillId);
  if (!progress.currentLevelId) {
    throw new Error("Aucun niveau disponible pour cette compétence");
  }

  const level = await prisma.level.findUniqueOrThrow({ where: { id: progress.currentLevelId } });
  const exercises = await prisma.exercise.findMany({ where: { levelId: level.id } });
  if (exercises.length === 0) {
    throw new Error("Aucun exercice configuré pour ce niveau");
  }

  const exercise = exercises[Math.floor(Math.random() * exercises.length)];
  const instance = await createExerciseInstance(exercise);

  return { level, exercise, instance };
}

export interface RecordPracticeAttemptParams {
  childId: string;
  exerciseInstanceId: string;
  answerGiven: string;
  timeTakenMs: number;
}

export async function recordPracticeAttempt(params: RecordPracticeAttemptParams) {
  const instance = await prisma.exerciseInstance.findUniqueOrThrow({
    where: { id: params.exerciseInstanceId },
    include: { exercise: true },
  });

  const correctAnswer = instance.correctAnswer as { value: string };
  const isCorrect = answersMatch(params.answerGiven, correctAnswer.value);

  await prisma.exerciseAttempt.create({
    data: {
      childId: params.childId,
      exerciseInstanceId: instance.id,
      answerGiven: { value: params.answerGiven },
      isCorrect,
      timeTakenMs: params.timeTakenMs,
    },
  });

  const level = await prisma.level.findUniqueOrThrow({ where: { id: instance.exercise.levelId } });
  const masteryScore = await recomputeMastery(params.childId, level.id);

  await prisma.childSkillProgress.update({
    where: { childId_skillId: { childId: params.childId, skillId: level.skillId } },
    data: { masteryScore },
  });

  const attemptsCount = await prisma.exerciseAttempt.count({
    where: { childId: params.childId, exerciseInstance: { exercise: { levelId: level.id } } },
  });

  // Petits points même sur une erreur (participation) — l'effort compte, pas seulement le
  // résultat, cohérent avec l'esprit "encouragement" du produit.
  await awardPoints(
    params.childId,
    "EARNED_EXERCISE",
    isCorrect ? 3 : 1,
    isCorrect ? "Bonne réponse en entraînement" : "Exercice tenté en entraînement",
  );
  const { currentStreak } = await recordDailyActivity(params.childId);
  await checkExerciseCountBadges(params.childId);

  const recentAttempts = await prisma.exerciseAttempt.findMany({
    where: { childId: params.childId, exerciseInstance: { exercise: { levelId: level.id } } },
    orderBy: { createdAt: "desc" },
    take: HELP_OFFER_CONSECUTIVE_INCORRECT,
    select: { isCorrect: true },
  });

  return {
    isCorrect,
    correctAnswer: correctAnswer.value,
    masteryScore,
    readyForEvaluation: isReadyForEvaluation(masteryScore, attemptsCount, level),
    currentStreak,
    offerHelp: shouldOfferHelp(countTrailingIncorrect(recentAttempts)),
  };
}
