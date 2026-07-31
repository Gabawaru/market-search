import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { checkEvaluationEligibility, canAttemptSkipEvaluation } from "@/lib/progression/unlockRules";
import { hasPendingHelpRequest } from "@/lib/progression/helpRequests";
import { PracticeSession } from "@/components/child/PracticeSession";

export default async function PracticeSkillPage({
  params,
  searchParams,
}: {
  params: Promise<{ skillId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { skillId } = await params;
  const { error } = await searchParams;
  const session = await getChildSession();
  if (!session) {
    redirect("/child/select-profile");
  }

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    redirect("/app/practice");
  }

  const { eligible } = await checkEvaluationEligibility(session.childId, skillId);

  let canSkip = false;
  if (!eligible) {
    const progress = await prisma.childSkillProgress.findUnique({
      where: { childId_skillId: { childId: session.childId, skillId } },
    });
    if (progress?.currentLevelId) {
      const level = await prisma.level.findUnique({ where: { id: progress.currentLevelId } });
      if (level) {
        const lastEvaluation = await prisma.evaluation.findFirst({
          where: { childId: session.childId, levelId: level.id },
          orderBy: { startedAt: "desc" },
        });
        canSkip = canAttemptSkipEvaluation(
          lastEvaluation?.startedAt ?? null,
          new Date(),
          level.retryCooldownHours,
        );
      }
    }
  }

  // Un enfant bloqué doit pouvoir joindre quelqu'un : son prof s'il en a déjà un, sinon ses
  // parents — qui eux ont accès au marketplace de cours particuliers.
  const [helpThread, helpRequestPending] = await Promise.all([
    prisma.chatThread.findFirst({
      where: { type: "CHILD_PARENT_TEACHER", childId: session.childId },
      include: { participants: { include: { teacher: true } } },
      orderBy: { createdAt: "desc" },
    }),
    hasPendingHelpRequest(session.parentId, session.childId, skillId),
  ]);
  const helpTeacher = helpThread?.participants.find((p) => p.role === "TEACHER")?.teacher ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href="/app/practice" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">{skill.name}</h1>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {eligible && (
        <Link
          href={`/app/evaluation/${skill.id}`}
          className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 text-center font-medium text-indigo-700 hover:bg-indigo-100"
        >
          Passer l&apos;évaluation de ce niveau
        </Link>
      )}

      {!eligible && canSkip && (
        <Link
          href={`/app/evaluation/${skill.id}?mode=skip`}
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-center font-medium text-amber-800 hover:bg-amber-100"
        >
          Je me sens prêt·e — tenter de passer directement
        </Link>
      )}

      <PracticeSession
        skillId={skill.id}
        childId={session.childId}
        help={{
          threadId: helpThread?.id ?? null,
          teacherName: helpTeacher?.name ?? null,
          requestPending: helpRequestPending,
        }}
      />
    </main>
  );
}
