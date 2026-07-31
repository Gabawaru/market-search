import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { checkTeacherExerciseAccess } from "@/lib/progression/teacherExercises";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ exerciseId: string }> },
) {
  const { exerciseId } = await params;

  const exercise = await prisma.teacherExercise.findUnique({ where: { id: exerciseId } });
  if (!exercise || !exercise.documentData || !exercise.documentMimeType) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const teacherSession = await auth();
  if (teacherSession?.user.role === "TEACHER" && teacherSession.user.id === exercise.teacherId) {
    return new NextResponse(new Uint8Array(exercise.documentData), {
      headers: { "Content-Type": exercise.documentMimeType },
    });
  }

  // Sinon, ce doit être un enfant qui y a effectivement accès — mêmes règles que pour
  // consulter/soumettre l'exercice (jamais faire confiance à un enfant qui devinerait l'ID).
  const childSession = await getChildSession();
  if (!childSession) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { eligible } = await checkTeacherExerciseAccess(childSession.childId, exerciseId);
  if (!eligible || exercise.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  return new NextResponse(new Uint8Array(exercise.documentData), {
    headers: { "Content-Type": exercise.documentMimeType },
  });
}
