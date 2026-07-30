import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { checkTeacherExerciseAccess } from "@/lib/progression/teacherExercises";
import { ContentOriginBadge } from "@/components/ContentOriginBadge";

export default async function TeacherExercisesListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getChildSession();
  if (!session) redirect("/child/login");

  const exercises = await prisma.teacherExercise.findMany({
    where: { status: "PUBLISHED" },
    include: { level: { include: { skill: true } }, teacher: true },
    orderBy: { createdAt: "desc" },
  });

  const withAccess = await Promise.all(
    exercises.map(async (exercise) => {
      const { eligible, wallet } = await checkTeacherExerciseAccess(session.childId, exercise.id);
      const pointsMissing = Math.max(0, exercise.pointsRequired - wallet.balance);
      return { exercise, eligible, pointsMissing };
    }),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/app" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Exercices de mes profs</h1>
      <p className="text-sm text-gray-500">
        Ces exercices sont écrits et corrigés à la main par un vrai prof.
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {withAccess.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun exercice publié pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {withAccess.map(({ exercise, eligible, pointsMissing }) => (
            <li
              key={exercise.id}
              className={`rounded-lg border p-3 ${eligible ? "hover:bg-gray-50" : "opacity-60"}`}
            >
              {eligible ? (
                <Link href={`/app/teacher-exercises/${exercise.id}`} className="block">
                  <div className="font-medium">{exercise.title}</div>
                  <div className="text-sm text-gray-500">
                    {exercise.level.skill.name} — {exercise.level.name}
                  </div>
                  <ContentOriginBadge
                    origin="teacher"
                    authorName={exercise.teacher.name}
                    className="mt-2"
                  />
                </Link>
              ) : (
                <div>
                  <div className="font-medium">🔒 {exercise.title}</div>
                  <div className="text-sm text-gray-500">
                    {exercise.level.skill.name} — {exercise.level.name}
                    {pointsMissing > 0 && ` · encore ${pointsMissing} points`}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
