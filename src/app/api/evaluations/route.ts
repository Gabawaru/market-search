import { NextResponse } from "next/server";
import { z } from "zod";
import { getChildSession } from "@/lib/auth/childSession";
import { startEvaluation, EvaluationEligibilityError } from "@/lib/evaluation/flow";

const bodySchema = z.object({ skillId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getChildSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  try {
    const result = await startEvaluation(session.childId, parsed.data.skillId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof EvaluationEligibilityError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}
