import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { checkEvaluationEligibility } from "@/lib/progression/unlockRules";
import { PracticeSession } from "@/components/child/PracticeSession";

export default async function PracticeSkillPage({
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

  const { eligible } = await checkEvaluationEligibility(session.childId, skillId);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href="/app/practice" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">{skill.name}</h1>

      {eligible && (
        <Link
          href={`/app/evaluation/${skill.id}`}
          className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 text-center font-medium text-indigo-700 hover:bg-indigo-100"
        >
          Passer l&apos;évaluation de ce niveau
        </Link>
      )}

      <PracticeSession skillId={skill.id} />
    </main>
  );
}
