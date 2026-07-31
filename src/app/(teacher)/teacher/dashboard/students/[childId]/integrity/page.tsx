import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { canTeacherAccessChild } from "@/lib/progression/teacherInsights";
import { getStreakTimeline } from "@/lib/progression/streakTimeline";
import { StreakTimeline } from "@/components/child/StreakTimeline";
import { IntegrityEventList } from "@/components/IntegrityJournal";

export default async function TeacherStudentIntegrityPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  if (!(await canTeacherAccessChild(session.user.id, childId))) {
    redirect("/teacher/dashboard/students");
  }

  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });

  // Contrairement à la page parent équivalente, on ne marque jamais ces événements comme vus
  // ici (IntegrityEvent.viewedByParentAt) — cette consultation par un prof ne doit pas faire
  // disparaître le badge "nouveau" côté parent.
  const [streakDays, events] = await Promise.all([
    getStreakTimeline(childId),
    prisma.integrityEvent.findMany({
      where: { childId },
      orderBy: { serverTimestamp: "desc" },
      include: { evaluation: { include: { level: { include: { skill: true } } } } },
      take: 100,
    }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link
        href={`/teacher/dashboard/students/${child.id}`}
        className="text-sm text-emerald-600 underline"
      >
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Assiduité et intégrité — {child.name}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Assiduité</h2>
        <StreakTimeline days={streakDays} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Journal d&apos;intégrité</h2>
        <p className="text-sm text-gray-500">
          Tous les événements détectés pendant les évaluations, journalisés côté serveur pour
          audit.
        </p>
        <IntegrityEventList events={events} />
      </section>
    </main>
  );
}
