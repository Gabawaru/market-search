import { prisma } from "@/lib/db/prisma";
import { createExerciseInstance } from "@/lib/exercises/instance";
import { answersMatch } from "@/lib/exercises/answerMatching";
import {
  getOrCreateSkillProgress,
  recomputeMastery,
  isReadyForEvaluation,
} from "@/lib/progression/unlockRules";

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

  return {
    isCorrect,
    correctAnswer: correctAnswer.value,
    masteryScore,
    readyForEvaluation: isReadyForEvaluation(masteryScore, attemptsCount, level),
  };
}
