import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { logoutChild } from "@/lib/actions/auth";
import { getOrCreateWallet } from "@/lib/progression/points";
import { getOrCreateDailyRecommendation } from "@/lib/progression/recommendation";
import { getStreakTimeline } from "@/lib/progression/streakTimeline";
import { StreakTimeline } from "@/components/child/StreakTimeline";
import { ContentOriginBadge } from "@/components/ContentOriginBadge";
import { prisma } from "@/lib/db/prisma";

export default async function ChildHomePage() {
  const childSession = await getChildSession();
  if (!childSession) {
    redirect("/child/select-profile");
  }

  const [wallet, streak, dailyRecommendation, streakTimeline] = await Promise.all([
    getOrCreateWallet(childSession.childId),
    prisma.streak.findUnique({ where: { childId: childSession.childId } }),
    getOrCreateDailyRecommendation(childSession.childId),
    getStreakTimeline(childSession.childId),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- petit SVG statique */}
          <img src="/mascot.svg" alt="" className="h-16 w-auto" />
          <h1 className="text-2xl font-bold">Salut {childSession.name} !</h1>
        </div>
        <form action={logoutChild}>
          <button type="submit" className="text-sm text-gray-500 underline">
            Changer de profil
          </button>
        </form>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-indigo-600">{wallet.balance}</div>
          <div className="text-xs text-gray-500">points</div>
        </div>
        <div className="flex-1 rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-orange-500">{streak?.currentStreak ?? 0}🔥</div>
          <div className="text-xs text-gray-500">jours de suite</div>
        </div>
      </div>

      <StreakTimeline days={streakTimeline} />

      {dailyRecommendation && (
        <Link
          href={`/app/practice/${dailyRecommendation.skillId}`}
          className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 hover:bg-indigo-100"
        >
          <div className="text-xs uppercase tracking-wide text-indigo-500">Cours du jour</div>
          <div className="text-lg font-semibold text-indigo-900">{dailyRecommendation.skill.name}</div>
          <div className="text-sm text-indigo-700">{dailyRecommendation.reason}</div>
        </Link>
      )}

      <Link
        href="/app/practice"
        className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        S&apos;entraîner
        <ContentOriginBadge origin="generated" />
      </Link>
      <Link
        href="/app/rewards"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Mes points et récompenses
      </Link>
      <Link
        href="/app/teacher-exercises"
        className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Exercices de mes profs
        <ContentOriginBadge origin="teacher" />
      </Link>
      <Link
        href="/app/messages"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Discuter avec mon prof
      </Link>
      <Link
        href="/app/suggestions"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Mes idées et suggestions
      </Link>
    </main>
  );
}
