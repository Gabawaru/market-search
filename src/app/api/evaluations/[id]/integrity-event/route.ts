import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getChildSession } from "@/lib/auth/childSession";
import { recordIntegrityEvent } from "@/lib/integrity/scoring";
import type { Prisma } from "@/generated/prisma/client";

const eventTypeSchema = z.enum([
  "FULLSCREEN_EXIT",
  "VISIBILITY_HIDDEN",
  "WINDOW_BLUR",
  "DEVTOOLS_SUSPECTED",
  "COPY_ATTEMPT",
  "PASTE_ATTEMPT",
  "AI_TEXT_SUSPECTED",
  "SESSION_TOKEN_INVALID",
  "HEARTBEAT_MISSED",
  "MULTI_TAB_DETECTED",
]);

const bodySchema = z.object({
  type: eventTypeSchema,
  evaluationAttemptId: z.string().optional(),
  clientTimestamp: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Volontairement pas de vérification du jeton de session ici : un signal d'intégrité doit
// pouvoir être journalisé même si le heartbeat vient tout juste d'expirer (c'est justement
// souvent le cas au moment d'une perte de focus). Seule l'appartenance de l'évaluation à
// l'enfant connecté est vérifiée.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: evaluationId } = await params;
  const session = await getChildSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
  if (!evaluation || evaluation.childId !== session.childId) {
    return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
  }

  const decision = await recordIntegrityEvent({
    evaluationId,
    childId: session.childId,
    evaluationAttemptId: parsed.data.evaluationAttemptId,
    type: parsed.data.type,
    clientTimestamp: parsed.data.clientTimestamp ? new Date(parsed.data.clientTimestamp) : undefined,
    metadata: parsed.data.metadata as Prisma.InputJsonObject | undefined,
  });

  return NextResponse.json(decision);
}
