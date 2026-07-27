import { NextResponse } from "next/server";
import { z } from "zod";
import { createDevSuggestion } from "@/lib/devscan/suggestions";
import type { Prisma } from "@/generated/prisma/client";

const bodySchema = z.object({
  category: z.enum(["CONTENT", "DIFFICULTY", "FEATURE", "CODE"]),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  sourceData: z.record(z.string(), z.unknown()).optional(),
});

// Appelée par la Routine Claude récurrente : après avoir lu le digest de /api/dev/scan et
// raisonné dessus, la Routine propose ici une amélioration — jamais appliquée automatiquement,
// toujours en attente de validation humaine dans l'espace développeur (/dev/console).
// Authentification par le même secret partagé que /api/dev/scan.
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

  const suggestion = await createDevSuggestion({
    category: parsed.data.category,
    title: parsed.data.title,
    description: parsed.data.description,
    sourceData: parsed.data.sourceData as Prisma.InputJsonObject | undefined,
  });

  return NextResponse.json(suggestion);
}
