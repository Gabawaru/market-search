import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  approveDevSuggestion,
  rejectDevSuggestion,
  approveTeacherApplication,
  rejectTeacherApplication,
  approveCuratedExercise,
  rejectCuratedExercise,
} from "@/lib/actions/devConsole";

const CATEGORY_LABELS: Record<string, string> = {
  CONTENT: "Contenu",
  DIFFICULTY: "Difficulté",
  FEATURE: "Fonctionnalité",
  CODE: "Code",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  OFFICIAL_OPEN_SOURCE: "Source ouverte officielle",
  INSPIRED_BY_SOURCE: "Inspiré d'une source réelle",
};

export default async function DevConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ tempPasswordEmail?: string; tempPassword?: string }>;
}) {
  const { tempPasswordEmail, tempPassword } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "DEV_ADMIN") {
    redirect("/dev/login");
  }

  const [pendingSuggestions, reviewedSuggestions, scanRuns, pendingApplications, pendingCuratedExercises] =
    await Promise.all([
      prisma.devSuggestion.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" } }),
      prisma.devSuggestion.findMany({
        where: { status: { in: ["APPROVED", "REJECTED", "APPLIED"] } },
        orderBy: { reviewedAt: "desc" },
        take: 10,
      }),
      prisma.aiScanRun.findMany({ orderBy: { runAt: "desc" }, take: 10 }),
      prisma.teacherApplication.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.curatedExercise.findMany({
        where: { status: "PENDING" },
        include: { level: { include: { skill: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <h1 className="text-2xl font-bold">Espace développeur</h1>

      {tempPasswordEmail && tempPassword && (
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">
            Compte créé pour {tempPasswordEmail} — mot de passe temporaire (affiché une seule
            fois, à relayer immédiatement de façon sécurisée) :
          </p>
          <code className="mt-2 block rounded bg-white px-3 py-2 text-lg font-bold">
            {tempPassword}
          </code>
          <p className="mt-2 text-sm text-amber-800">
            Le prof devra le changer dès sa première connexion sur <code>/teacher/login</code>.
          </p>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Candidatures profs en attente</h2>
        {pendingApplications.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune candidature en attente.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendingApplications.map((application) => (
              <li key={application.id} className="rounded-lg border p-3">
                <div className="font-medium">
                  {application.name} — {application.email}
                </div>
                {application.message && (
                  <p className="text-sm text-gray-600">{application.message}</p>
                )}
                <div className="mt-2 flex gap-2">
                  <form action={approveTeacherApplication}>
                    <input type="hidden" name="id" value={application.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                    >
                      Approuver et créer le compte
                    </button>
                  </form>
                  <form action={rejectTeacherApplication}>
                    <input type="hidden" name="id" value={application.id} />
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
        <h2 className="text-lg font-semibold">Exercices collège/lycée en attente de validation</h2>
        <p className="text-sm text-gray-500">
          Proposés par la Routine de curation périodique — jamais publiés sans validation ici.
        </p>
        {pendingCuratedExercises.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun exercice en attente pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendingCuratedExercises.map((e) => (
              <li key={e.id} className="rounded-lg border p-3">
                <div className="text-xs uppercase text-gray-400">
                  {e.level.skill.name} — {e.level.name} · {SOURCE_TYPE_LABELS[e.sourceType]}
                </div>
                <p className="font-medium">{e.promptText}</p>
                <p className="text-sm text-gray-600">Réponse attendue : {e.correctAnswer}</p>
                <p className="text-xs text-gray-400">
                  Source :{" "}
                  <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    {e.sourceUrl}
                  </a>{" "}
                  ({e.sourceLicense})
                </p>
                <div className="mt-2 flex gap-2">
                  <form action={approveCuratedExercise}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                    >
                      Valider
                    </button>
                  </form>
                  <form action={rejectCuratedExercise}>
                    <input type="hidden" name="id" value={e.id} />
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
