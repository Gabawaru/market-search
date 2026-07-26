import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";
import { generateChildAssessment } from "../src/lib/assessment/childAssessment";
import { sendAdminDigest } from "../src/lib/notifications";
import type { Prisma } from "../src/generated/prisma/client";

// Partie mécanique du "scan IA" (voir plan produit) : agrège l'activité récente, génère les
// bilans honnêtes, compile la boîte à suggestions, et envoie le digest à l'admin. La partie
// "réflexion sur les améliorations à proposer" est faite par la Routine Claude qui invoque ce
// script puis lit son digest pour raisonner et créer des DevSuggestion via
// `lib/devscan/suggestions.ts` — ce script ne fabrique jamais de suggestion lui-même.
const SCAN_INTERVAL_HOURS = 8; // ~3 passages/jour

async function main() {
  const now = new Date();
  const periodStart = new Date(now.getTime() - SCAN_INTERVAL_HOURS * 60 * 60 * 1000);

  const children = await prisma.child.findMany();
  const assessmentSummaries: string[] = [];

  for (const child of children) {
    const [activityCount, evaluationCount] = await Promise.all([
      prisma.exerciseAttempt.count({ where: { childId: child.id, createdAt: { gte: periodStart } } }),
      prisma.evaluation.count({ where: { childId: child.id, finishedAt: { gte: periodStart } } }),
    ]);
    if (activityCount === 0 && evaluationCount === 0) continue;

    const assessment = await generateChildAssessment(child.id, periodStart, now, "ai-scan");
    assessmentSummaries.push(`- ${child.name} : ${assessment.narrative}`);
  }

  const unscannedSuggestions = await prisma.suggestionMessage.findMany({
    where: { scannedAt: null },
    include: { thread: { include: { child: true, parent: true } } },
  });

  const suggestionSummaries = unscannedSuggestions.map(
    (m) => `- [${m.authorRole}] ${m.thread.child?.name ?? m.thread.parent?.name ?? "?"} : "${m.body}"`,
  );

  if (unscannedSuggestions.length > 0) {
    await prisma.suggestionMessage.updateMany({
      where: { id: { in: unscannedSuggestions.map((m) => m.id) } },
      data: { scannedAt: now },
    });
  }

  const pendingDevSuggestions = await prisma.devSuggestion.count({ where: { status: "PENDING" } });

  const digestBody = [
    `Scan Oumno Éducation — ${now.toLocaleString("fr-FR")}`,
    "",
    `Bilans générés : ${assessmentSummaries.length}`,
    ...assessmentSummaries,
    "",
    `Nouvelles suggestions parent/enfant : ${unscannedSuggestions.length}`,
    ...suggestionSummaries,
    "",
    `Suggestions dev en attente de validation : ${pendingDevSuggestions}`,
  ].join("\n");

  const { emailSent, smsSent } = await sendAdminDigest("Scan Oumno Éducation", digestBody);

  await prisma.aiScanRun.create({
    data: {
      runAt: now,
      childrenScanned: assessmentSummaries.length,
      suggestionsCreated: 0,
      digestSentEmail: emailSent,
      digestSentSms: smsSent,
      summary: {
        assessmentsGenerated: assessmentSummaries.length,
        suggestionMessagesScanned: unscannedSuggestions.length,
        pendingDevSuggestions,
      } as Prisma.InputJsonObject,
    },
  });

  console.log(digestBody);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
