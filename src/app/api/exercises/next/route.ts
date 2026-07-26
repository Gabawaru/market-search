import { NextResponse } from "next/server";
import { getChildSession } from "@/lib/auth/childSession";
import { getNextPracticeExercise } from "@/lib/progression/practiceFlow";

export async function GET(request: Request) {
  const session = await getChildSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get("skillId");
  if (!skillId) {
    return NextResponse.json({ error: "skillId requis" }, { status: 400 });
  }

  try {
    const { level, instance } = await getNextPracticeExercise(session.childId, skillId);
    return NextResponse.json({
      instanceId: instance.id,
      promptText: instance.promptText,
      levelName: level.name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}
