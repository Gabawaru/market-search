import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  createTeacherExercise,
  publishTeacherExercise,
  unpublishTeacherExercise,
  deleteTeacherExercise,
} from "@/lib/actions/teacherExercises";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
};

export default async function TeacherExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const [exercises, levels] = await Promise.all([
    prisma.teacherExercise.findMany({
      where: { teacherId: session.user.id },
      include: { level: { include: { skill: true } }, submissions: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.level.findMany({
      include: { skill: true },
      orderBy: [{ skill: { order: "asc" } }, { order: "asc" }],
    }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes exercices</h1>
      <p className="text-sm text-gray-500">
        Ces exercices sont corrigés à la main par vous — jamais notés automatiquement.
        L&apos;accès pour un enfant dépend de son niveau et de ses points déjà accumulés.
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {exercises.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun exercice déposé pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((exercise) => {
            const pending = exercise.submissions.filter((s) => s.status === "PENDING").length;
            return (
              <li key={exercise.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{exercise.title}</div>
                    <div className="text-sm text-gray-500">
                      {exercise.level.skill.name} — {exercise.level.name} · {STATUS_LABELS[exercise.status]}
                      {exercise.pointsRequired > 0 && ` · ${exercise.pointsRequired} points requis`}
                    </div>
                  </div>
                  <Link
                    href={`/teacher/dashboard/exercises/${exercise.id}`}
                    className="text-sm text-emerald-600 underline"
                  >
                    {pending > 0 ? `${pending} à corriger` : "Voir les copies"}
                  </Link>
                </div>
                <div className="mt-2 flex gap-3 text-sm">
                  {exercise.status === "DRAFT" ? (
                    <form action={publishTeacherExercise}>
                      <input type="hidden" name="exerciseId" value={exercise.id} />
                      <button type="submit" className="text-emerald-600 underline">
                        Publier
                      </button>
                    </form>
                  ) : (
                    <form action={unpublishTeacherExercise}>
                      <input type="hidden" name="exerciseId" value={exercise.id} />
                      <button type="submit" className="text-gray-600 underline">
                        Repasser en brouillon
                      </button>
                    </form>
                  )}
                  <form action={deleteTeacherExercise}>
                    <input type="hidden" name="exerciseId" value={exercise.id} />
                    <button type="submit" className="text-red-600 underline">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Déposer un exercice</h2>
        <form action={createTeacherExercise} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Compétence et niveau
            <select name="levelId" required className="rounded-md border px-3 py-2">
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.skill.name} — {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Titre
            <input type="text" name="title" required className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Énoncé
            <textarea name="promptText" required rows={4} className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Corrigé de référence (pour vous seul, pas montré à l&apos;enfant)
            <textarea name="referenceAnswer" rows={2} className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Points requis pour y accéder
            <input
              type="number"
              name="pointsRequired"
              min={0}
              defaultValue={0}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
          >
            Enregistrer en brouillon
          </button>
        </form>
      </section>
    </main>
  );
}
