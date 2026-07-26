import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { respondTutoringRequest } from "@/lib/actions/tutoring";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de votre réponse",
  ACCEPTED: "Acceptée",
  DECLINED: "Déclinée",
  ACTIVE: "En cours",
  ENDED: "Terminée",
};

export default async function TeacherTutoringPage() {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const requests = await prisma.tutoringRequest.findMany({
    where: { teacherId: session.user.id },
    include: { child: true, targetLevel: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Demandes de cours particuliers</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune demande pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <Link href={`/teacher/dashboard/tutoring/${r.id}`} className="font-medium hover:underline">
                {r.child.name} — {r.targetLevel.skill.name} ({r.targetLevel.name})
              </Link>
              <div className="text-sm text-gray-500">
                Objectif {Math.round(r.targetScore * 100)}% — {r.proposedRate}€ (simulé) —{" "}
                {STATUS_LABELS[r.status]}
              </div>
              {r.status === "PENDING" && (
                <div className="mt-2 flex gap-2">
                  <form action={respondTutoringRequest}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                    >
                      Accepter
                    </button>
                  </form>
                  <form action={respondTutoringRequest}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <button
                      type="submit"
                      className="rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Décliner
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
