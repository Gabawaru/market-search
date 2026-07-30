import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { gradeTeacherExerciseSubmission } from "@/lib/actions/teacherExercises";

export default async function TeacherExerciseSubmissionsPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const exercise = await prisma.teacherExercise.findFirst({
    where: { id: exerciseId, teacherId: session.user.id },
    include: { level: { include: { skill: true } } },
  });
  if (!exercise) redirect("/teacher/dashboard/exercises");

  const submissions = await prisma.teacherExerciseSubmission.findMany({
    where: { teacherExerciseId: exerciseId },
    include: { child: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard/exercises" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">{exercise.title}</h1>
      <p className="text-sm text-gray-500">
        {exercise.level.skill.name} — {exercise.level.name}
      </p>

      {submissions.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune copie reçue pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {submissions.map((submission) => (
            <li key={submission.id} className="rounded-lg border p-4">
              <div className="font-medium">{submission.child.name}</div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{submission.answerText}</p>

              {submission.status === "GRADED" ? (
                <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
                  <p className="font-medium">
                    {submission.isCorrect ? "✅ Correct" : "❌ À revoir"}
                  </p>
                  {submission.feedback && <p className="mt-1">{submission.feedback}</p>}
                </div>
              ) : (
                <form action={gradeTeacherExerciseSubmission} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <input type="hidden" name="exerciseId" value={exerciseId} />
                  <label className="flex flex-col gap-1 text-sm">
                    Retour à l&apos;enfant
                    <textarea name="feedback" rows={2} className="rounded-md border px-3 py-2" />
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      name="isCorrect"
                      value="true"
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
                    >
                      Marquer correct
                    </button>
                    <button
                      type="submit"
                      name="isCorrect"
                      value="false"
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Marquer à revoir
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
