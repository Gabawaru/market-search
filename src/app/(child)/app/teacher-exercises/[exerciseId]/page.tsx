import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { checkTeacherExerciseAccess } from "@/lib/progression/teacherExercises";
import { submitTeacherExerciseAnswer } from "@/lib/actions/teacherExercises";
import { ContentOriginBadge } from "@/components/ContentOriginBadge";

export default async function TeacherExerciseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ exerciseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { exerciseId } = await params;
  const { error } = await searchParams;
  const session = await getChildSession();
  if (!session) redirect("/child/login");

  const { eligible, exercise } = await checkTeacherExerciseAccess(session.childId, exerciseId);
  if (!eligible || exercise.status !== "PUBLISHED") {
    redirect("/app/teacher-exercises?error=Cet exercice n'est pas (encore) accessible");
  }

  const level = await prisma.level.findUniqueOrThrow({
    where: { id: exercise.levelId },
    include: { skill: true },
  });

  const [teacher, submissions] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: exercise.teacherId } }),
    prisma.teacherExerciseSubmission.findMany({
      where: { teacherExerciseId: exerciseId, childId: session.childId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/app/teacher-exercises" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">{exercise.title}</h1>
      <p className="text-sm text-gray-500">
        {level.skill.name} — {level.name}
      </p>
      <ContentOriginBadge origin="teacher" authorName={teacher?.name} className="self-start" />
      <p className="whitespace-pre-wrap rounded-lg border p-4">{exercise.promptText}</p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form action={submitTeacherExerciseAnswer} className="flex flex-col gap-3">
        <input type="hidden" name="exerciseId" value={exercise.id} />
        <label className="flex flex-col gap-1 text-sm">
          Ta réponse
          <textarea name="answerText" required rows={4} className="rounded-md border px-3 py-2" />
        </label>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
        >
          Envoyer au prof
        </button>
      </form>

      {submissions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Mes réponses précédentes</h2>
          {submissions.map((submission) => (
            <div key={submission.id} className="rounded-lg border p-3 text-sm">
              <p className="whitespace-pre-wrap">{submission.answerText}</p>
              {submission.status === "GRADED" ? (
                <div className="mt-2 rounded-md bg-gray-50 p-2">
                  <p className="font-medium">
                    {submission.isCorrect ? "✅ Correct" : "❌ À revoir"}
                  </p>
                  {submission.feedback && <p className="mt-1">{submission.feedback}</p>}
                </div>
              ) : (
                <p className="mt-2 text-gray-500">En attente de correction par le prof.</p>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
