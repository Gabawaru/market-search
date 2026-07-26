import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { generateWeeklyAssessment } from "@/lib/actions/assessment";

export default async function ReportsPage({
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

  const assessments = await prisma.childAssessment.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href={`/dashboard/${child.id}`} className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Bilans — {child.name}</h1>
      <p className="text-sm text-gray-500">
        Une appréciation honnête, basée sur les résultats et la régularité — jamais de
        complaisance ni de sévérité injustifiée.
      </p>

      <form action={generateWeeklyAssessment}>
        <input type="hidden" name="childId" value={child.id} />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Générer le bilan des 7 derniers jours
        </button>
      </form>

      {assessments.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun bilan généré pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {assessments.map((a) => (
            <div key={a.id} className="rounded-lg border p-4">
              <div className="text-xs text-gray-400">
                {a.periodStart.toLocaleDateString("fr-FR")} → {a.periodEnd.toLocaleDateString("fr-FR")}
              </div>
              <p className="mt-1 text-sm text-gray-700">{a.narrative}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
