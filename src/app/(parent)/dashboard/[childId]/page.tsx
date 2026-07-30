import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { gradeEvaluationAttempt } from "@/lib/actions/assessment";
import { isStrugglingWithSkill } from "@/lib/progression/unlockRules";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
  });
  if (!child) {
    redirect("/dashboard");
  }

  const [skillProgress, streak, badges, wallet, recentStories, unreadIntegrityCount, teacherSubmissions] =
    await Promise.all([
      prisma.childSkillProgress.findMany({
        where: { childId },
        include: { skill: true },
        orderBy: { skill: { order: "asc" } },
      }),
      prisma.streak.findUnique({ where: { childId } }),
      prisma.childBadge.count({ where: { childId } }),
      prisma.pointsWallet.findUnique({ where: { childId } }),
      prisma.lessonStoryEntry.findMany({
        where: { childId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.integrityEvent.count({ where: { childId, viewedByParentAt: null } }),
      prisma.teacherExerciseSubmission.findMany({
        where: { childId },
        include: { teacherExercise: { include: { teacher: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  // Réponses libres d'évaluation jamais notées automatiquement (voir submitEvaluationAnswer) —
  // scoreOverride: null exclut celles déjà zérées par l'anti-triche, à ne jamais réviser ici.
  const pendingFreeTextAttempts = await prisma.evaluationAttempt.findMany({
    where: {
      isCorrect: null,
      scoreOverride: null,
      evaluation: { childId, status: "COMPLETED" },
      exerciseInstance: { exercise: { type: "FREE_TEXT" } },
    },
    include: { exerciseInstance: true },
    orderBy: { presentedAt: "desc" },
  });

  // Compétences où l'enfant pratique beaucoup sans progresser — suggère un accompagnement par
  // un vrai prof plutôt que de le laisser s'entraîner dans le vide indéfiniment.
  const strugglingSkills: { skillId: string; skillName: string }[] = [];
  for (const progress of skillProgress) {
    if (!progress.currentLevelId) continue;
    const level = await prisma.level.findUnique({ where: { id: progress.currentLevelId } });
    if (!level) continue;
    const attemptsCount = await prisma.exerciseAttempt.count({
      where: { childId, exerciseInstance: { exercise: { levelId: level.id } } },
    });
    if (isStrugglingWithSkill(progress.masteryScore, attemptsCount, level)) {
      strugglingSkills.push({ skillId: progress.skillId, skillName: progress.skill.name });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/dashboard" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">
        {child.name}
        {child.gradeLevel && <span className="ml-2 text-base font-normal text-gray-500">({child.gradeLevel})</span>}
      </h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-indigo-600">{wallet?.balance ?? 0}</div>
          <div className="text-xs text-gray-500">points</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-orange-500">{streak?.currentStreak ?? 0}🔥</div>
          <div className="text-xs text-gray-500">jours de suite</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-emerald-600">{badges}</div>
          <div className="text-xs text-gray-500">badges</div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Progression par compétence</h2>
        {skillProgress.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore de pratique enregistrée.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {skillProgress.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.skill.name}</span>
                  <span className="text-gray-500">{Math.round(p.masteryScore * 100)}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.round(p.masteryScore * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ce qui s&apos;est passé récemment</h2>
          <Link href={`/dashboard/${child.id}/reports`} className="text-sm text-indigo-600 underline">
            Bilans →
          </Link>
        </div>
        {recentStories.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune évaluation passée pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentStories.map((story) => (
              <div key={story.id} className="rounded-lg border p-3">
                <div className="text-xs uppercase text-gray-400">{story.title}</div>
                <p className="text-sm text-gray-700">{story.narrative}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {strugglingSkills.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg border border-indigo-300 bg-indigo-50 p-4">
          <h2 className="text-lg font-semibold text-indigo-900">Besoin d&apos;un coup de main ?</h2>
          <p className="text-sm text-indigo-700">
            {child.name} s&apos;entraîne beaucoup en{" "}
            {strugglingSkills.map((s) => s.skillName).join(", ")} sans encore progresser. C&apos;est
            peut-être le moment de faire appel à un vrai prof particulier pour un accompagnement
            dédié.
          </p>
          <Link
            href={`/dashboard/${child.id}/tutoring`}
            className="self-start rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            Voir les profs disponibles
          </Link>
        </section>
      )}

      {pendingFreeTextAttempts.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-lg font-semibold">Réponses à corriger</h2>
          <p className="text-sm text-gray-600">
            Ces réponses libres d&apos;évaluation ne sont jamais notées automatiquement par
            l&apos;IA — elles comptent comme fausses tant que vous ne les corrigez pas.
          </p>
          <div className="flex flex-col gap-3">
            {pendingFreeTextAttempts.map((attempt) => {
              const answer = attempt.answerGiven as { value?: string } | null;
              return (
                <div key={attempt.id} className="rounded-lg border bg-white p-3">
                  <p className="text-sm text-gray-500">{attempt.exerciseInstance.promptText}</p>
                  <p className="mt-1 whitespace-pre-wrap font-medium">{answer?.value ?? ""}</p>
                  <form action={gradeEvaluationAttempt} className="mt-2 flex gap-3">
                    <input type="hidden" name="attemptId" value={attempt.id} />
                    <input type="hidden" name="childId" value={child.id} />
                    <button
                      type="submit"
                      name="isCorrect"
                      value="true"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                    >
                      Correct
                    </button>
                    <button
                      type="submit"
                      name="isCorrect"
                      value="false"
                      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Incorrect
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {teacherSubmissions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Exercices de profs</h2>
          <div className="flex flex-col gap-2">
            {teacherSubmissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{submission.teacherExercise.title}</div>
                <div className="text-gray-500">
                  {submission.teacherExercise.teacher.name} ·{" "}
                  {submission.status === "GRADED"
                    ? submission.isCorrect
                      ? "✅ Correct"
                      : "❌ À revoir"
                    : "En attente de correction"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link
        href={`/dashboard/${child.id}/integrity`}
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Journal d&apos;intégrité{unreadIntegrityCount > 0 ? ` (${unreadIntegrityCount} nouveau${unreadIntegrityCount > 1 ? "x" : ""})` : ""}
      </Link>
      <Link
        href={`/dashboard/${child.id}/messages`}
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Discussions avec un prof
      </Link>
      <Link
        href={`/dashboard/${child.id}/suggestions`}
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Idées et suggestions
      </Link>
      <Link
        href={`/dashboard/${child.id}/tutoring`}
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Cours particuliers
      </Link>
    </main>
  );
}
