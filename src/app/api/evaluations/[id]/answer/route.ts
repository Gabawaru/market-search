import { NextResponse } from "next/server";
import { z } from "zod";
import { getChildSession } from "@/lib/auth/childSession";
import { verifyEvaluationToken } from "@/lib/auth/evaluationToken";
import { submitEvaluationAnswer } from "@/lib/evaluation/flow";
import { recordIntegrityEvent } from "@/lib/integrity/scoring";

const bodySchema = z.object({
  token: z.string().min(1),
  attemptId: z.string().min(1),
  answerGiven: z.string().min(1),
  timeTakenMs: z.number().int().nonnegative(),
});

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

  // Le serveur est la seule source de vérité : sans jeton valide (donc sans heartbeat
  // récent), aucune réponse n'est acceptée — qu'un enfant reste bien dans le flux normal
  // ou tente d'appeler l'API directement ne change rien à cette exigence.
  const valid = await verifyEvaluationToken(parsed.data.token, {
    evaluationId,
    childId: session.childId,
  });
  if (!valid) {
    await recordIntegrityEvent({
      evaluationId,
      childId: session.childId,
      type: "SESSION_TOKEN_INVALID",
    }).catch(() => {});
    return NextResponse.json({ error: "Session expirée, en attente d'un heartbeat valide" }, { status: 401 });
  }

  try {
    const result = await submitEvaluationAnswer({
      evaluationId,
      childId: session.childId,
      attemptId: parsed.data.attemptId,
      answerGiven: parsed.data.answerGiven,
      timeTakenMs: parsed.data.timeTakenMs,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}
