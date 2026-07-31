import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { submitCuratedExerciseAnswer } from "@/lib/actions/curatedExercises";
import { ContentOriginBadge } from "@/components/ContentOriginBadge";

export default async function CuratedExerciseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ exerciseId: string }>;
  searchParams: Promise<{ error?: string; result?: string }>;
}) {
  const { exerciseId } = await params;
  const { error, result } = await searchParams;
  const session = await getChildSession();
  if (!session) redirect("/child/login");

  const exercise = await prisma.curatedExercise.findFirst({
    where: { id: exerciseId, status: "APPROVED" },
    include: { level: { include: { skill: true } } },
  });
  if (!exercise) {
    redirect("/app/curated-exercises?error=Cet exercice n'est pas (ou plus) disponible");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href="/app/curated-exercises" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <p className="text-sm text-gray-500">
        {exercise.level.skill.name} — {exercise.level.name}
      </p>
      <ContentOriginBadge origin="curated" className="self-start" />
      <div className="rounded-lg border p-6 text-center text-xl font-semibold">
        {exercise.promptText}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {result ? (
        <p
          className={
            result === "correct"
              ? "text-lg font-medium text-emerald-600"
              : "text-lg font-medium text-red-600"
          }
        >
          {result === "correct" ? "Bravo, bonne réponse !" : "Pas cette fois — réessaie un autre exercice."}
        </p>
      ) : (
        <form action={submitCuratedExerciseAnswer} className="flex flex-col gap-3">
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <input
            type="text"
            name="answerGiven"
            required
            autoFocus
            className="rounded-md border px-3 py-2 text-center text-lg"
          />
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
          >
            Valider
          </button>
        </form>
      )}
    </main>
  );
}
