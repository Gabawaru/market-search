import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createTutoringRequest } from "@/lib/actions/tutoring";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de réponse du prof",
  ACCEPTED: "Acceptée",
  DECLINED: "Déclinée",
  ACTIVE: "En cours",
  ENDED: "Terminée",
};

export default async function TutoringPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) redirect("/dashboard");

  const [requests, teachers, levels] = await Promise.all([
    prisma.tutoringRequest.findMany({
      where: { childId },
      include: { teacher: true, targetLevel: { include: { skill: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.findMany({ orderBy: { name: "asc" } }),
    prisma.level.findMany({ include: { skill: true }, orderBy: [{ skill: { order: "asc" } }, { order: "asc" }] }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href={`/dashboard/${child.id}`} className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Cours particuliers — {child.name}</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune demande de cours particulier pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/${child.id}/tutoring/${r.id}`}
              className="rounded-lg border p-3 hover:bg-gray-50"
            >
              <div className="font-medium">
                {r.teacher.name} — {r.targetLevel.skill.name} ({r.targetLevel.name})
              </div>
              <div className="text-sm text-gray-500">
                Objectif {Math.round(r.targetScore * 100)}% — {STATUS_LABELS[r.status]}
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Demander un accompagnement</h2>
        {teachers.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun prof n&apos;est encore inscrit.</p>
        ) : (
          <form action={createTutoringRequest} className="flex flex-col gap-3">
            <input type="hidden" name="childId" value={child.id} />

            <label className="flex flex-col gap-1 text-sm">
              Prof
              <select name="teacherId" required className="rounded-md border px-3 py-2">
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.ratePerSession ? `(${t.ratePerSession}€/séance habituellement)` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Compétence et niveau visés
              <select name="targetLevelId" required className="rounded-md border px-3 py-2">
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.skill.name} — {l.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Objectif de note (%)
              <input
                type="number"
                name="targetScore"
                min={1}
                max={100}
                defaultValue={80}
                required
                className="rounded-md border px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Tarif proposé (€, simulé — pas de paiement réel pour l&apos;instant)
              <input
                type="number"
                name="proposedRate"
                min={0}
                step="0.5"
                required
                className="rounded-md border px-3 py-2"
              />
            </label>

            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
            >
              Envoyer la demande
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
