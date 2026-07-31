import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { IntegrityEventList } from "@/components/IntegrityJournal";

export default async function IntegrityJournalPage({
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

  // Marque comme lu avant l'affichage — l'audit reste consultable, seul le badge "nouveau"
  // sur le dashboard disparaît.
  await prisma.integrityEvent.updateMany({
    where: { childId, viewedByParentAt: null },
    data: { viewedByParentAt: new Date() },
  });

  const events = await prisma.integrityEvent.findMany({
    where: { childId },
    orderBy: { serverTimestamp: "desc" },
    include: { evaluation: { include: { level: { include: { skill: true } } } } },
    take: 100,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href={`/dashboard/${child.id}`} className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Journal d&apos;intégrité — {child.name}</h1>
      <p className="text-sm text-gray-500">
        Tous les événements détectés pendant les évaluations, journalisés côté serveur pour audit.
      </p>

      <IntegrityEventList events={events} />
    </main>
  );
}
