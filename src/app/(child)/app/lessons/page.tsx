import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { extractYouTubeVideoId } from "@/lib/content/youtube";

export default async function ChildLessonsPage() {
  const session = await getChildSession();
  if (!session) redirect("/child/login");

  const lessons = await prisma.lesson.findMany({
    include: { level: { include: { skill: true } } },
    orderBy: [{ level: { skill: { order: "asc" } } }, { level: { order: "asc" } }],
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/app" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes leçons</h1>
      <p className="text-sm text-gray-500">
        Des explications sur lesquelles tu peux revenir autant de fois que tu veux.
      </p>

      {lessons.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune leçon disponible pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {lessons.map((lesson) => {
            const videoId = lesson.type === "VIDEO" && lesson.videoUrl ? extractYouTubeVideoId(lesson.videoUrl) : null;
            return (
              <div key={lesson.id} className="flex flex-col gap-2 rounded-lg border p-4">
                <div className="text-xs uppercase text-gray-400">
                  {lesson.level.skill.name} — {lesson.level.name}
                </div>
                <div className="font-semibold">{lesson.title}</div>

                {lesson.type === "VIDEO" && lesson.videoUrl && (
                  videoId ? (
                    <div className="aspect-video w-full overflow-hidden rounded-md">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                        title={lesson.title}
                        className="h-full w-full"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a
                      href={lesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                      ▶️ Voir la vidéo
                    </a>
                  )
                )}

                {lesson.type === "DOCUMENT" && (
                  <a
                    href={`/api/lessons/${lesson.id}/document`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                  >
                    📄 Voir le document
                  </a>
                )}

                {lesson.type === "AI_PAGE" && lesson.contentMarkdown && (
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {lesson.contentMarkdown}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
