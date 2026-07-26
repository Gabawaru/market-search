import { NextResponse } from "next/server";
import { runDevScan } from "@/lib/devscan/runScan";

// Appelée par la Routine Claude récurrente (scan IA, ~3x/jour) : la Routine n'a pas d'accès
// réseau direct à la base de données, donc c'est le serveur déployé (lui, connecté) qui
// exécute la partie mécanique du scan et renvoie le digest en réponse. Authentification par
// secret partagé (pas de session admin possible pour un appel machine-à-machine).
export async function POST(request: Request) {
  const secret = process.env.DEV_SCAN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "DEV_SCAN_SECRET non configuré" }, { status: 503 });
  }
  if (request.headers.get("x-scan-secret") !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await runDevScan();
  return NextResponse.json(result);
}
