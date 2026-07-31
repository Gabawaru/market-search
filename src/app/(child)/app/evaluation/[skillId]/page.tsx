import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { checkEvaluationEligibility, canAttemptSkipEvaluation } from "@/lib/progression/unlockRules";
import { EvaluationGuard } from "@/components/evaluation/EvaluationGuard";

export default async function EvaluationPage({
  params,
  searchParams,
}: {
  params: Promise<{ skillId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { skillId } = await params;
  const { mode } = await searchParams;
  const session = await getChildSession();
  if (!session) {
    redirect("/child/select-profile");
  }

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    redirect("/app/practice");
  }

  const skipMode = mode === "skip";

  // Recalculé côté serveur (jamais fait confiance à un enfant qui arriverait directement
  // sur cette page) — si l'enfant n'est pas éligible, il est renvoyé au practice. En mode
  // "test out", le pré-requis de pratique est sauté mais le cooldown anti-abus s'applique.
  if (skipMode) {
    const progress = await prisma.childSkillProgress.findUnique({
      where: { childId_skillId: { childId: session.childId, skillId } },
    });
    const level = progress?.currentLevelId
      ? await prisma.level.findUnique({ where: { id: progress.currentLevelId } })
      : null;
    if (!level) {
      redirect(`/app/practice/${skillId}`);
    }
    const lastEvaluation = await prisma.evaluation.findFirst({
      where: { childId: session.childId, levelId: level.id },
      orderBy: { startedAt: "desc" },
    });
    if (!canAttemptSkipEvaluation(lastEvaluation?.startedAt ?? null, new Date(), level.retryCooldownHours)) {
      redirect(
        `/app/practice/${skillId}?error=${encodeURIComponent(`Réessaie de passer directement dans ${level.retryCooldownHours}h`)}`,
      );
    }
  } else {
    const { eligible } = await checkEvaluationEligibility(session.childId, skillId);
    if (!eligible) {
      redirect(`/app/practice/${skillId}`);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href={`/app/practice/${skillId}`} className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      {skipMode && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tu tentes de passer directement à l&apos;évaluation sans avoir fait tous les exercices —
          elle reste aussi exigeante que d&apos;habitude !
        </p>
      )}
      <EvaluationGuard skillId={skill.id} skillName={skill.name} skipMode={skipMode} />
    </main>
  );
}
