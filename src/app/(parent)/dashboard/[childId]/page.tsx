import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
  });
  if (!child) {
    redirect("/dashboard");
  }

  const [skillProgress, streak, badges, wallet, recentStories, unreadIntegrityCount] =
    await Promise.all([
      prisma.childSkillProgress.findMany({
        where: { childId },
        include: { skill: true },
        orderBy: { skill: { order: "asc" } },
      }),
      prisma.streak.findUnique({ where: { childId } }),
      prisma.childBadge.count({ where: { childId } }),
      prisma.pointsWallet.findUnique({ where: { childId } }),
      prisma.lessonStoryEntry.findMany({
        where: { childId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.integrityEvent.count({ where: { childId, viewedByParentAt: null } }),
    ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/dashboard" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">{child.name}</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-indigo-600">{wallet?.balance ?? 0}</div>
          <div className="text-xs text-gray-500">points</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-orange-500">{streak?.currentStreak ?? 0}🔥</div>
          <div className="text-xs text-gray-500">jours de suite</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-emerald-600">{badges}</div>
          <div className="text-xs text-gray-500">badges</div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Progression par compétence</h2>
        {skillProgress.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore de pratique enregistrée.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {skillProgress.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.skill.name}</span>
                  <span className="text-gray-500">{Math.round(p.masteryScore * 100)}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.round(p.masteryScore * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ce qui s&apos;est passé récemment</h2>
          <Link href={`/dashboard/${child.id}/reports`} className="text-sm text-indigo-600 underline">
            Bilans →
          </Link>
        </div>
        {recentStories.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune évaluation passée pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentStories.map((story) => (
              <div key={story.id} className="rounded-lg border p-3">
                <div className="text-xs uppercase text-gray-400">{story.title}</div>
                <p className="text-sm text-gray-700">{story.narrative}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        href={`/dashboard/${child.id}/integrity`}
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Journal d&apos;intégrité{unreadIntegrityCount > 0 ? ` (${unreadIntegrityCount} nouveau${unreadIntegrityCount > 1 ? "x" : ""})` : ""}
      </Link>
    </main>
  );
}
