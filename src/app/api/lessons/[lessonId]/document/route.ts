import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;

  // Librement consultable une fois authentifié (enfant, parent, ou prof) — pas de gating par
  // points contrairement aux exercices de profs, cohérent avec l'esprit CNED (y revenir
  // librement). Toujours exiger une session pour ne pas exposer le document à quiconque devine
  // l'URL sans compte.
  const [childSession, session] = await Promise.all([getChildSession(), auth()]);
  if (!childSession && !session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || !lesson.documentData || !lesson.documentMimeType) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(lesson.documentData), {
    headers: { "Content-Type": lesson.documentMimeType },
  });
}
