import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { closeTutoringPeriod } from "@/lib/actions/tutoring";

export default async function TutoringRequestDetailPage({
  params,
}: {
  params: Promise<{ childId: string; requestId: string }>;
}) {
  const { childId, requestId } = await params;
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const request = await prisma.tutoringRequest.findFirst({
    where: { id: requestId, childId, parentId: session.user.id },
    include: { teacher: true, targetLevel: { include: { skill: true } } },
  });
  if (!request) redirect(`/dashboard/${childId}/tutoring`);

  const decisions = await prisma.tutoringPayoutDecision.findMany({
    where: { tutoringRequestId: requestId },
    orderBy: { decidedAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href={`/dashboard/${childId}/tutoring`} className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">
        {request.teacher.name} — {request.targetLevel.skill.name} ({request.targetLevel.name})
      </h1>
      <p className="text-sm text-gray-500">
        Objectif : {Math.round(request.targetScore * 100)}% — Tarif simulé : {request.proposedRate}€
      </p>

      {request.status === "ACTIVE" && request.periodEnd && (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-600">
            Période de suivi jusqu&apos;au {request.periodEnd.toLocaleDateString("fr-FR")}.
          </p>
          <form action={closeTutoringPeriod} className="mt-3">
            <input type="hidden" name="requestId" value={request.id} />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
            >
              Clôturer maintenant et calculer la décision
            </button>
          </form>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Décisions de rémunération (simulée)</h2>
        <p className="text-sm text-gray-500">
          Chaque décision est archivée de façon immuable et se base sur l&apos;ensemble de la
          période, jamais sur un seul contrôle — pour éviter toute contestation.
        </p>
        {decisions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune décision pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {decisions.map((d) => (
              <div key={d.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span
                    className={
                      d.status === "ELIGIBLE"
                        ? "font-medium text-emerald-600"
                        : "font-medium text-red-600"
                    }
                  >
                    {d.status === "ELIGIBLE" ? "Objectif atteint" : "Objectif non atteint"}
                  </span>
                  <span className="text-sm text-gray-500">{d.amountSimulated}€ (simulé)</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{d.explanation}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Décidé le {d.decidedAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
