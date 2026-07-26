import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { checkEvaluationEligibility } from "@/lib/progression/unlockRules";
import { EvaluationGuard } from "@/components/evaluation/EvaluationGuard";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  const session = await getChildSession();
  if (!session) {
    redirect("/child/select-profile");
  }

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    redirect("/app/practice");
  }

  // Recalculé côté serveur (jamais fait confiance à un enfant qui arriverait directement
  // sur cette page) — si l'enfant n'est pas éligible, il est renvoyé au practice.
  const { eligible } = await checkEvaluationEligibility(session.childId, skillId);
  if (!eligible) {
    redirect(`/app/practice/${skillId}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href={`/app/practice/${skillId}`} className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <EvaluationGuard skillId={skill.id} skillName={skill.name} />
    </main>
  );
}
