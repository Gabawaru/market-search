import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { ContentOriginBadge } from "@/components/ContentOriginBadge";

export default async function CuratedExercisesListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getChildSession();
  if (!session) redirect("/child/login");

  const exercises = await prisma.curatedExercise.findMany({
    where: { status: "APPROVED" },
    include: { level: { include: { skill: true } } },
    orderBy: [{ level: { skill: { order: "asc" } } }, { level: { order: "asc" } }],
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/app" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Exercices collège/lycée</h1>
      <p className="text-sm text-gray-500">
        Basés sur de vraies sources académiques, vérifiés avant publication.
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {exercises.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun exercice publié pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/app/curated-exercises/${exercise.id}`}
                className="block rounded-lg border p-3 hover:bg-gray-50"
              >
                <div className="font-medium">{exercise.promptText}</div>
                <div className="text-sm text-gray-500">
                  {exercise.level.skill.name} — {exercise.level.name}
                </div>
                <ContentOriginBadge origin="curated" className="mt-2" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
