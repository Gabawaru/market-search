import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { getGenerator } from "@/lib/exercises/registry";
import type { Exercise } from "@/generated/prisma/client";

export async function createExerciseInstance(exercise: Exercise) {
  const generator = getGenerator(exercise.generatorKey);
  const seed = randomUUID();
  const params = (exercise.paramsSchema ?? {}) as Record<string, unknown>;
  const { promptText, correctAnswer } = generator(seed, params);

  return prisma.exerciseInstance.create({
    data: {
      exerciseId: exercise.id,
      seed,
      promptText,
      correctAnswer,
    },
  });
}
