import { NextResponse } from "next/server";
import { z } from "zod";
import { createCuratedExercise } from "@/lib/devscan/curatedExercises";
import { prisma } from "@/lib/db/prisma";
import { gradeLevelSchema } from "@/lib/validation/schemas";

const bodySchema = z
  .object({
    // Ciblage du niveau : soit un levelId direct, soit skillCode + levelOrder (résolu côté
    // serveur — évite d'avoir à connaître les cuid internes des niveaux).
    levelId: z.string().min(1).optional(),
    skillCode: z.string().min(1).optional(),
    levelOrder: z.number().int().positive().optional(),
    promptText: z.string().trim().min(1).max(2000),
    correctAnswer: z.string().trim().min(1).max(500),
    sourceType: z.enum(["OFFICIAL_OPEN_SOURCE", "INSPIRED_BY_SOURCE"]),
    sourceUrl: z.string().trim().min(1).max(2000),
    sourceLicense: z.string().trim().min(1).max(200),
    // Classe scolaire ciblée (facultatif) — regroupement par classe dans l'espace cours.
    gradeLevel: gradeLevelSchema.optional(),
  })
  .refine(
    (d) => Boolean(d.levelId) !== Boolean(d.skillCode && d.levelOrder !== undefined),
    { message: "Fournir soit levelId, soit skillCode + levelOrder (pas les deux)" },
  );

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

  let levelId = parsed.data.levelId ?? null;
  if (!levelId) {
    const skill = await prisma.skill.findUnique({ where: { code: parsed.data.skillCode! } });
    if (!skill) {
      return NextResponse.json({ error: `Compétence inconnue : ${parsed.data.skillCode}` }, { status: 400 });
    }
    const level = await prisma.level.findUnique({
      where: { skillId_order: { skillId: skill.id, order: parsed.data.levelOrder! } },
    });
    if (!level) {
      return NextResponse.json(
        { error: `Niveau ${parsed.data.levelOrder} inconnu pour ${parsed.data.skillCode}` },
        { status: 400 },
      );
    }
    levelId = level.id;
  }

  const exercise = await createCuratedExercise({
    levelId,
    promptText: parsed.data.promptText,
    correctAnswer: parsed.data.correctAnswer,
    sourceType: parsed.data.sourceType,
    sourceUrl: parsed.data.sourceUrl,
    sourceLicense: parsed.data.sourceLicense,
    gradeLevel: parsed.data.gradeLevel,
  });
  return NextResponse.json(exercise);
}
