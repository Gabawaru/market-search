import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { isStrugglingWithSkill } from "@/lib/progression/unlockRules";
import { getOrCreateDailyRecommendation } from "@/lib/progression/recommendation";

export default async function ChildCoursesPage() {
  const session = await getChildSession();
  if (!session) {
    redirect("/child/select-profile");
  }

  const [skills, dailyRecommendation, allLessons, allCurated] = await Promise.all([
    prisma.skill.findMany({
      orderBy: { order: "asc" },
      include: {
        levels: { orderBy: { order: "asc" } },
        progress: { where: { childId: session.childId } },
      },
    }),
    getOrCreateDailyRecommendation(session.childId),
    prisma.lesson.findMany({ select: { level: { select: { skillId: true } } } }),
    prisma.curatedExercise.findMany({
      where: { status: "APPROVED" },
      select: { level: { select: { skillId: true } } },
    }),
  ]);

  // Analyse par module (déterministe) : maîtrise, forces/faiblesses, et ce qui existe comme
  // contenu. attemptsCount du niveau courant nécessaire pour isStrugglingWithSkill.
  const modules = await Promise.all(
    skills.map(async (skill) => {
      const progress = skill.progress[0];
      const currentLevel =
        skill.levels.find((l) => l.id === progress?.currentLevelId) ?? skill.levels[0] ?? null;
      const masteryScore = progress?.masteryScore ?? 0;

      let attemptsCount = 0;
      let struggling = false;
      let mastered = false;
      if (currentLevel) {
        attemptsCount = await prisma.exerciseAttempt.count({
          where: { childId: session.childId, exerciseInstance: { exercise: { levelId: currentLevel.id } } },
        });
        struggling = isStrugglingWithSkill(masteryScore, attemptsCount, currentLevel);
        mastered = masteryScore >= currentLevel.unlockThreshold && attemptsCount >= currentLevel.minExerciseCount;
      }

      const lessonsCount = allLessons.filter((l) => l.level.skillId === skill.id).length;
      const curatedCount = allCurated.filter((c) => c.level.skillId === skill.id).length;

      return {
        skill,
        currentLevel,
        masteryPercent: Math.round(masteryScore * 100),
        attemptsCount,
        struggling,
        mastered,
        lessonsCount,
        curatedCount,
      };
    }),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/app" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes cours</h1>
      <p className="text-sm text-gray-500">
        Tout au même endroit, par matière : ta progression, tes leçons, et de quoi t&apos;entraîner.
      </p>

      {dailyRecommendation && (
        <Link
          href={`/app/practice/${dailyRecommendation.skillId}`}
          className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 hover:bg-indigo-100"
        >
          <div className="text-xs uppercase tracking-wide text-indigo-500">Prochaine étape</div>
          <div className="text-lg font-semibold text-indigo-900">{dailyRecommendation.skill.name}</div>
          <div className="text-sm text-indigo-700">{dailyRecommendation.reason}</div>
        </Link>
      )}

      <div className="flex flex-col gap-4">
        {modules.map((m) => (
          <section key={m.skill.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{m.skill.name}</h2>
              {m.struggling ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  Tu patines — une leçon peut aider
                </span>
              ) : m.mastered ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  Bien maîtrisé
                </span>
              ) : m.attemptsCount > 0 ? (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                  En cours
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  À découvrir
                </span>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {m.currentLevel?.name ?? "Niveau à venir"} · {m.masteryPercent}% de maîtrise
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${m.masteryPercent}%` }} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/app/practice/${m.skill.id}`}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
              >
                S&apos;entraîner
              </Link>
              <Link
                href="/app/lessons"
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Leçons{m.lessonsCount > 0 ? ` (${m.lessonsCount})` : ""}
              </Link>
              {m.curatedCount > 0 && (
                <Link
                  href="/app/curated-exercises"
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Exercices collège/lycée ({m.curatedCount})
                </Link>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
