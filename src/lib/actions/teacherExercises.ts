"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getChildSession } from "@/lib/auth/childSession";
import { checkTeacherExerciseAccess } from "@/lib/progression/teacherExercises";

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

// ---------------------------------------------------------------------------
// Prof : déposer, publier, corriger
// ---------------------------------------------------------------------------

export async function createTeacherExercise(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const levelId = getString(formData, "levelId");
  const title = getString(formData, "title");
  const promptText = getString(formData, "promptText");
  const referenceAnswer = getString(formData, "referenceAnswer");
  const pointsRequiredRaw = getString(formData, "pointsRequired");
  if (!levelId || !title || !promptText) {
    redirect("/teacher/dashboard/exercises?error=Titre, niveau et énoncé sont requis");
  }

  const pointsRequired = Math.max(0, Number(pointsRequiredRaw) || 0);

  await prisma.teacherExercise.create({
    data: {
      teacherId: session.user.id,
      levelId,
      title,
      promptText,
      referenceAnswer,
      pointsRequired,
    },
  });

  redirect("/teacher/dashboard/exercises");
}

async function requireOwnedTeacherExercise(teacherId: string, exerciseId: string) {
  const exercise = await prisma.teacherExercise.findFirst({
    where: { id: exerciseId, teacherId },
  });
  if (!exercise) redirect("/teacher/dashboard/exercises");
  return exercise;
}

export async function publishTeacherExercise(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const exerciseId = getString(formData, "exerciseId");
  if (!exerciseId) redirect("/teacher/dashboard/exercises");

  await requireOwnedTeacherExercise(session.user.id, exerciseId);
  await prisma.teacherExercise.update({ where: { id: exerciseId }, data: { status: "PUBLISHED" } });

  redirect("/teacher/dashboard/exercises");
}

export async function unpublishTeacherExercise(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const exerciseId = getString(formData, "exerciseId");
  if (!exerciseId) redirect("/teacher/dashboard/exercises");

  await requireOwnedTeacherExercise(session.user.id, exerciseId);
  await prisma.teacherExercise.update({ where: { id: exerciseId }, data: { status: "DRAFT" } });

  redirect("/teacher/dashboard/exercises");
}

export async function deleteTeacherExercise(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const exerciseId = getString(formData, "exerciseId");
  if (!exerciseId) redirect("/teacher/dashboard/exercises");

  await prisma.teacherExercise.deleteMany({ where: { id: exerciseId, teacherId: session.user.id } });

  redirect("/teacher/dashboard/exercises");
}

export async function gradeTeacherExerciseSubmission(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const submissionId = getString(formData, "submissionId");
  const exerciseId = getString(formData, "exerciseId");
  const isCorrect = formData.get("isCorrect") === "true";
  const feedback = getString(formData, "feedback");
  if (!submissionId || !exerciseId) redirect("/teacher/dashboard/exercises");

  // Vérifie que la soumission appartient bien à un exercice du prof connecté — jamais faire
  // confiance à l'ID de soumission seul.
  const submission = await prisma.teacherExerciseSubmission.findFirst({
    where: { id: submissionId, teacherExercise: { id: exerciseId, teacherId: session.user.id } },
  });
  if (!submission) redirect("/teacher/dashboard/exercises");

  await prisma.teacherExerciseSubmission.update({
    where: { id: submissionId },
    data: { status: "GRADED", isCorrect, feedback, gradedAt: new Date() },
  });

  redirect(`/teacher/dashboard/exercises/${exerciseId}`);
}

// ---------------------------------------------------------------------------
// Enfant : consulter, soumettre
// ---------------------------------------------------------------------------

export async function submitTeacherExerciseAnswer(formData: FormData) {
  const child = await getChildSession();
  if (!child) redirect("/child/login");

  const exerciseId = getString(formData, "exerciseId");
  const answerText = getString(formData, "answerText");
  if (!exerciseId || !answerText) {
    redirect(`/app/teacher-exercises/${exerciseId ?? ""}?error=Réponse requise`);
  }

  const { eligible, exercise } = await checkTeacherExerciseAccess(child.childId, exerciseId);
  if (!eligible || exercise.status !== "PUBLISHED") {
    redirect("/app/teacher-exercises?error=Cet exercice n'est pas (encore) accessible");
  }

  await prisma.teacherExerciseSubmission.create({
    data: { teacherExerciseId: exerciseId, childId: child.childId, answerText },
  });

  redirect(`/app/teacher-exercises/${exerciseId}`);
}
