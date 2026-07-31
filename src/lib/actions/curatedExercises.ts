"use server";

import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { answersMatch } from "@/lib/exercises/answerMatching";
import { awardPoints } from "@/lib/progression/points";

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/** Réponse toujours auto-corrigée : contrairement à TeacherExercise (correction manuelle par un
 * prof), un CuratedExercise n'est jamais publié sans une correctAnswer déterministe et
 * vérifiable (voir createCuratedExercise) — la même comparaison que le reste du moteur
 * d'exercices s'applique ici, jamais une IA qui devine si la réponse est juste. */
export async function submitCuratedExerciseAnswer(formData: FormData) {
  const session = await getChildSession();
  if (!session) redirect("/child/login");

  const exerciseId = getString(formData, "exerciseId");
  const answerGiven = getString(formData, "answerGiven");
  if (!exerciseId || !answerGiven) {
    redirect(`/app/curated-exercises/${exerciseId ?? ""}?error=Réponse requise`);
  }

  const exercise = await prisma.curatedExercise.findFirst({
    where: { id: exerciseId, status: "APPROVED" },
  });
  if (!exercise) {
    redirect("/app/curated-exercises?error=Cet exercice n'est pas (ou plus) disponible");
  }

  const isCorrect = answersMatch(answerGiven, exercise.correctAnswer);

  await prisma.curatedExerciseAttempt.create({
    data: {
      curatedExerciseId: exercise.id,
      childId: session.childId,
      answerGiven,
      isCorrect,
    },
  });

  if (isCorrect) {
    await awardPoints(session.childId, "EARNED_EXERCISE", 3, "Exercice collège/lycée réussi");
  } else {
    await awardPoints(session.childId, "EARNED_EXERCISE", 1, "Exercice collège/lycée tenté");
  }

  redirect(`/app/curated-exercises/${exercise.id}?result=${isCorrect ? "correct" : "incorrect"}`);
}
