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

      <div className="grid gap-4 sm:grid-cols-2">
        {skills.map((skill) => {
          const progress = skill.progress[0];
          const currentLevel =
            skill.levels.find((l) => l.id === progress?.currentLevelId) ?? skill.levels[0];
          const masteryPercent = Math.round((progress?.masteryScore ?? 0) * 100);

          return (
            <Link
              key={skill.id}
              href={`/app/practice/${skill.id}`}
              className="rounded-lg border p-4 hover:bg-gray-50"
            >
              <div className="font-semibold">{skill.name}</div>
              <div className="text-sm text-gray-500">
                {currentLevel?.name ?? "Niveau à venir"}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${masteryPercent}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
