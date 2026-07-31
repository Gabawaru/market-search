import { NextResponse } from "next/server";
import { z } from "zod";
import { createCuratedExercise } from "@/lib/devscan/curatedExercises";

const bodySchema = z.object({
  levelId: z.string().min(1),
  promptText: z.string().trim().min(1).max(2000),
  correctAnswer: z.string().trim().min(1).max(500),
  sourceType: z.enum(["OFFICIAL_OPEN_SOURCE", "INSPIRED_BY_SOURCE"]),
  sourceUrl: z.string().trim().min(1).max(2000),
  sourceLicense: z.string().trim().min(1).max(200),
});

// Appelée par la Routine Claude de curation périodique (collège/lycée) : recherche de vraies
// sources académiques sous licence libre, propose un exercice fidèle (OFFICIAL_OPEN_SOURCE) ou
// réécrit/inspiré (INSPIRED_BY_SOURCE) — jamais publié automatiquement, toujours en attente de
// validation dans l'espace développeur (/dev/console). Même authentification par secret partagé
// que /api/dev/scan et /api/dev/suggestions.
export async function POST(request: Request) {
  const secret = process.env.DEV_SCAN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "DEV_SCAN_SECRET non configuré" }, { status: 503 });
  }
  if (request.headers.get("x-scan-secret") !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const exercise = await createCuratedExercise(parsed.data);
  return NextResponse.json(exercise);
}
