import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateWallet } from "@/lib/progression/points";
import { redeemReward, openMysteryBox } from "@/lib/actions/rewards";
import { getStreakFreezeEligibility } from "@/lib/progression/streakFreezeEligibility";
import { getMysteryBoxStatus, MYSTERY_BOX_COST } from "@/lib/progression/mysteryBox";
import { MysteryBoxResult } from "@/components/child/MysteryBoxResult";

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    boxReward?: string;
    boxJackpot?: string;
  }>;
}) {
  const { error, success, boxReward, boxJackpot } = await searchParams;
  const session = await getChildSession();
  if (!session) {
    redirect("/child/select-profile");
  }

  const [
    wallet,
    streak,
    badges,
    catalog,
    availableStreakFreezes,
    streakFreezeEligibility,
    mysteryBox,
  ] = await Promise.all([
      getOrCreateWallet(session.childId),
      prisma.streak.findUnique({ where: { childId: session.childId } }),
      prisma.childBadge.findMany({
        where: { childId: session.childId },
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      }),
      prisma.rewardCatalogItem.findMany({ where: { active: true }, orderBy: { cost: "asc" } }),
      prisma.rewardRedemption.count({
        where: { childId: session.childId, consumedAt: null, item: { kind: "STREAK_FREEZE" } },
      }),
      getStreakFreezeEligibility(session.childId),
      getMysteryBoxStatus(session.childId),
    ]);

  const justOpenedReward = boxReward ? Number.parseInt(boxReward, 10) : null;
  const canAffordBox = wallet.balance >= MYSTERY_BOX_COST;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/app" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes points et récompenses</h1>

      <div className="flex gap-4">
        <div className="flex-1 rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600">{wallet.balance}</div>
          <div className="text-sm text-gray-500">points</div>
        </div>
        <div className="flex-1 rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold text-orange-500">{streak?.currentStreak ?? 0}🔥</div>
          <div className="text-sm text-gray-500">jours de suite</div>
        </div>
        <div className="flex-1 rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold text-emerald-600">{availableStreakFreezes}🌴</div>
          <div className="text-sm text-gray-500">jours de pause</div>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">🎁 Boîte surprise du jour</h2>
        {justOpenedReward !== null ? (
          <MysteryBoxResult rewardPoints={justOpenedReward} isJackpot={boxJackpot === "1"} />
        ) : mysteryBox.alreadyOpenedToday ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
            {mysteryBox.todayJackpot ? "🎉 " : "🎁 "}
            Tu as déjà ouvert la boîte aujourd&apos;hui
            {mysteryBox.todayReward !== null ? ` (+${mysteryBox.todayReward} points)` : ""}. Reviens
            demain !
          </div>
        ) : mysteryBox.eligible ? (
          <form
            action={openMysteryBox}
            className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4"
          >
            <p className="text-sm text-amber-800">
              Ouvre la boîte pour gagner des points — avec une chance rare de décrocher le{" "}
              <span className="font-semibold">gros jackpot de 500 points</span> !
            </p>
            <button
              type="submit"
              disabled={!canAffordBox}
              className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Ouvrir ({MYSTERY_BOX_COST} points)
            </button>
            {!canAffordBox && (
              <p className="text-xs text-amber-700">
                Il te faut {MYSTERY_BOX_COST} points pour ouvrir la boîte.
              </p>
            )}
          </form>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
            🔒 {mysteryBox.reason ?? "La boîte surprise n'est pas encore débloquée."}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Mes badges</h2>
        {badges.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore de badge — continue à t&apos;entraîner !</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {badges.map((cb) => (
              <div key={cb.id} className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
                <span className="text-2xl">{cb.badge.icon}</span>
                <span className="text-xs font-medium">{cb.badge.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Échanger mes points</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {catalog.map((item) => {
            const isStreakFreeze = item.kind === "STREAK_FREEZE";
            const blockedReason = isStreakFreeze ? streakFreezeEligibility.reason : undefined;
            const disabled = wallet.balance < item.cost || Boolean(blockedReason);
            return (
              <form
                key={item.id}
                action={redeemReward}
                className="flex flex-col gap-2 rounded-lg border p-4"
              >
                <input type="hidden" name="itemId" value={item.id} />
                <div className="text-2xl">{item.icon}</div>
                <div className="font-medium">{item.label}</div>
                <p className="text-sm text-gray-500">{item.description}</p>
                {blockedReason && <p className="text-xs text-amber-700">{blockedReason}</p>}
                <button
                  type="submit"
                  disabled={disabled}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {item.cost} points
                </button>
              </form>
            );
          })}
        </div>
      </section>
    </main>
  );
}
