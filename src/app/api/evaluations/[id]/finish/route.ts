import { NextResponse } from "next/server";
import { getChildSession } from "@/lib/auth/childSession";
import { finishEvaluation } from "@/lib/evaluation/flow";

// Volontairement tolérant sur le jeton (pas de vérification stricte ici) : l'enfant doit
// pouvoir voir son résultat même si le dernier heartbeat a expiré pile à la fin de
// l'évaluation. `finishEvaluation` vérifie déjà que l'évaluation appartient bien à l'enfant
// connecté ; le score final est calculé uniquement à partir des tentatives déjà enregistrées
// et des décisions d'intégrité déjà actées, donc rien de plus n'est «gagnable» ici.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: evaluationId } = await params;
  const session = await getChildSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const result = await finishEvaluation(evaluationId, session.childId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}
