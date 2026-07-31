import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createLesson, deleteLesson, requestCurationBatch } from "@/lib/actions/lessons";

const TYPE_LABELS: Record<string, string> = {
  VIDEO: "Vidéo",
  DOCUMENT: "Document",
  AI_PAGE: "Page rédigée",
};

export default async function TeacherLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const [lessons, levels] = await Promise.all([
    prisma.lesson.findMany({
      include: { level: { include: { skill: true } } },
      orderBy: [{ level: { skill: { order: "asc" } } }, { level: { order: "asc" } }],
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
      <h1 className="text-2xl font-bold">Leçons</h1>
      <p className="text-sm text-gray-500">
        Explications de concept que les enfants peuvent consulter librement, à tout moment —
        distinctes des exercices générés à l&apos;infini.
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <section className="flex flex-col gap-3 rounded-lg border border-sky-300 bg-sky-50 p-4">
        <h2 className="text-lg font-semibold text-sky-900">Exercices collège/lycée</h2>
        <p className="text-sm text-sky-800">
          Manque un exercice sur un point précis ? Envoie une demande — un nouveau lot sera
          recherché sur de vraies sources académiques et vérifié avant publication.
        </p>
        <form action={requestCurationBatch} className="flex flex-col gap-2">
          <textarea
            name="note"
            rows={2}
            placeholder="Précise si besoin (ex. « trigonométrie en 1ère »)"
            className="rounded-md border bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="self-start rounded-md bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700"
          >
            Demander une nouvelle curation
          </button>
        </form>
      </section>

      {lessons.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune leçon déposée pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{lesson.title}</div>
                  <div className="text-sm text-gray-500">
                    {lesson.level.skill.name} — {lesson.level.name} · {TYPE_LABELS[lesson.type]}
                  </div>
                </div>
                <form action={deleteLesson}>
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <button type="submit" className="text-sm text-red-600 underline">
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Ajouter une leçon</h2>
        <form action={createLesson} encType="multipart/form-data" className="flex flex-col gap-3">
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
            Type
            <select name="type" required className="rounded-md border px-3 py-2">
              <option value="VIDEO">Vidéo YouTube</option>
              <option value="DOCUMENT">Document (image/PDF)</option>
              <option value="AI_PAGE">Page rédigée (basée sur une source)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Lien vidéo (si type Vidéo)
            <input type="url" name="videoUrl" className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Document (si type Document)
            <input
              type="file"
              name="document"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Contenu rédigé (si type Page rédigée)
            <textarea name="contentMarkdown" rows={4} className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Source de la page rédigée (si type Page rédigée)
            <input type="url" name="contentSourceUrl" className="rounded-md border px-3 py-2" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
          >
            Ajouter la leçon
          </button>
        </form>
      </section>
    </main>
  );
}
