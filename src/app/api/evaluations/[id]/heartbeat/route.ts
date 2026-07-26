import { NextResponse } from "next/server";
import { z } from "zod";
import { getChildSession } from "@/lib/auth/childSession";
import { verifyEvaluationToken } from "@/lib/auth/evaluationToken";
import { heartbeatEvaluation } from "@/lib/evaluation/flow";
import { recordIntegrityEvent } from "@/lib/integrity/scoring";

const bodySchema = z.object({ token: z.string().min(1) });

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
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  const newToken = await heartbeatEvaluation(evaluationId, session.childId);
  if (!newToken) {
    return NextResponse.json({ error: "Évaluation introuvable ou terminée" }, { status: 409 });
  }

  return NextResponse.json({ token: newToken });
}
