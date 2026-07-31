import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";

export default async function PracticeHomePage() {
  const session = await getChildSession();
  if (!session) {
    redirect("/child/select-profile");
  }

  const skills = await prisma.skill.findMany({
    orderBy: { order: "asc" },
    include: {
      levels: { orderBy: { order: "asc" } },
      progress: { where: { childId: session.childId } },
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/app" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Choisis une compétence</h1>
      <p className="text-sm text-gray-500">
        Ces exercices sont générés automatiquement, à l&apos;infini : entraîne-toi autant que tu
        veux, ça ne s&apos;arrête jamais.
      </p>

      <div className="flex flex-col gap-4">
        {skills.map((skill) => {
          const progress = skill.progress[0];
          const currentLevel =
            skill.levels.find((l) => l.id === progress?.currentLevelId) ?? skill.levels[0];
          const currentOrder = currentLevel?.order ?? skill.levels[0]?.order ?? 0;
          const masteryPercent = Math.round((progress?.masteryScore ?? 0) * 100);

          return (
            <Link
              key={skill.id}
              href={`/app/practice/${skill.id}`}
              className="flex flex-col gap-3 rounded-lg border p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{skill.name}</span>
                <span className="text-sm text-gray-500">{currentLevel?.name ?? "Niveau à venir"}</span>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {skill.levels.map((level, index) => {
                  const isPast = level.order < currentOrder;
                  const isCurrent = level.order === currentOrder;

                  return (
                    <div key={level.id} className="flex items-center gap-1">
                      {index > 0 && (
                        <div
                          className={`h-0.5 w-3 shrink-0 ${isPast ? "bg-emerald-400" : "bg-gray-200"}`}
                        />
                      )}
                      <div
                        title={level.name}
                        className={
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                          (isPast
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                              ? "border-2 border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border border-gray-200 bg-gray-50 text-gray-400")
                        }
                      >
                        {isPast ? "✓" : isCurrent ? `${masteryPercent}%` : "🔒"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
