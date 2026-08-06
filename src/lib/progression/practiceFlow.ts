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

  // Peu de points pour un exercice (1 si juste, rien si faux) — l'entraînement rapporte peu, ce
  // sont les évaluations et la complétion d'une catégorie qui rapportent gros (cf. barème demandé).
  if (isCorrect) {
    await awardPoints(params.childId, "EARNED_EXERCISE", 1, "Bonne réponse en entraînement");
  }

  const readyForEvaluation = isReadyForEvaluation(masteryScore, attemptsCount, level);

  // Bonus "catégorie complétée" (+29), une seule fois par niveau : quand l'enfant atteint pour la
  // première fois le seuil de maîtrise du niveau. L'unicité [childId, levelId] rend l'opération
  // idempotente — une violation d'unicité signifie "déjà attribué", on l'ignore.
  if (readyForEvaluation) {
    try {
      await prisma.levelCompletionBonus.create({
        data: { childId: params.childId, levelId: level.id },
      });
      await awardPoints(params.childId, "EARNED_EXERCISE", 29, "Catégorie d'exercices complétée");
    } catch {
      // déjà attribué pour ce niveau — rien à faire
    }
  }

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
    readyForEvaluation,
    currentStreak,
    offerHelp: shouldOfferHelp(countTrailingIncorrect(recentAttempts)),
  };
}
