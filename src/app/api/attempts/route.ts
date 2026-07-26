import { NextResponse } from "next/server";
import { z } from "zod";
import { getChildSession } from "@/lib/auth/childSession";
import { recordPracticeAttempt } from "@/lib/progression/practiceFlow";

const bodySchema = z.object({
  exerciseInstanceId: z.string().min(1),
  answerGiven: z.string().min(1),
  timeTakenMs: z.number().int().nonnegative(),
});

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
    const result = await recordPracticeAttempt({ childId: session.childId, ...parsed.data });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}
