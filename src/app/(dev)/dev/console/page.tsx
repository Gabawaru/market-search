import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { approveDevSuggestion, rejectDevSuggestion } from "@/lib/actions/devConsole";

const CATEGORY_LABELS: Record<string, string> = {
  CONTENT: "Contenu",
  DIFFICULTY: "Difficulté",
  FEATURE: "Fonctionnalité",
  CODE: "Code",
};

export default async function DevConsolePage() {
  const session = await auth();
  if (session?.user.role !== "DEV_ADMIN") {
    redirect("/dev/login");
  }

  const [pendingSuggestions, reviewedSuggestions, scanRuns] = await Promise.all([
    prisma.devSuggestion.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" } }),
    prisma.devSuggestion.findMany({
      where: { status: { in: ["APPROVED", "REJECTED", "APPLIED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 10,
    }),
    prisma.aiScanRun.findMany({ orderBy: { runAt: "desc" }, take: 10 }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <h1 className="text-2xl font-bold">Espace développeur</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Suggestions en attente de validation</h2>
        {pendingSuggestions.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune suggestion en attente — le scan IA (Routine planifiée) en générera au fil de
            l&apos;activité et de la boîte à suggestions.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendingSuggestions.map((s) => (
              <li key={s.id} className="rounded-lg border p-3">
                <div className="text-xs uppercase text-gray-400">{CATEGORY_LABELS[s.category]}</div>
                <div className="font-medium">{s.title}</div>
                <p className="text-sm text-gray-600">{s.description}</p>
                <div className="mt-2 flex gap-2">
                  <form action={approveDevSuggestion}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                    >
                      Valider
                    </button>
                  </form>
                  <form action={rejectDevSuggestion}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Rejeter
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Historique des décisions</h2>
        {reviewedSuggestions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune décision pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reviewedSuggestions.map((s) => (
              <li key={s.id} className="rounded-lg border p-3 text-sm">
                <span
                  className={
                    s.status === "APPROVED" || s.status === "APPLIED"
                      ? "font-medium text-emerald-600"
                      : "font-medium text-red-600"
                  }
                >
                  {s.status}
                </span>{" "}
                — {s.title}
                {s.prUrl && (
                  <>
                    {" "}
                    —{" "}
                    <a href={s.prUrl} className="text-indigo-600 underline">
                      PR
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Historique des scans IA</h2>
        {scanRuns.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun scan encore exécuté — voir <code>npm run dev:scan</code> ou la Routine planifiée.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {scanRuns.map((run) => (
              <li key={run.id} className="rounded-lg border p-3 text-sm">
                <div className="text-xs text-gray-400">{run.runAt.toLocaleString("fr-FR")}</div>
                <div>
                  {run.childrenScanned} enfant{run.childrenScanned > 1 ? "s" : ""} scanné
                  {run.childrenScanned > 1 ? "s" : ""} — digest email:{" "}
                  {run.digestSentEmail ? "envoyé" : "non envoyé"}, SMS:{" "}
                  {run.digestSentSms ? "envoyé" : "non envoyé"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
