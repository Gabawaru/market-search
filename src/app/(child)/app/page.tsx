import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { logoutChild } from "@/lib/actions/auth";
import { getOrCreateWallet } from "@/lib/progression/points";
import { prisma } from "@/lib/db/prisma";

export default async function ChildHomePage() {
  const childSession = await getChildSession();
  if (!childSession) {
    redirect("/child/select-profile");
  }

  const [wallet, streak] = await Promise.all([
    getOrCreateWallet(childSession.childId),
    prisma.streak.findUnique({ where: { childId: childSession.childId } }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Salut {childSession.name} !</h1>
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

      <Link
        href="/app/practice"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        S&apos;entraîner
      </Link>
      <Link
        href="/app/rewards"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Mes points et récompenses
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
