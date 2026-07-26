import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const SEVERITY_STYLES: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-red-100 text-red-700",
};

const ACTION_LABELS: Record<string, string> = {
  LOGGED_ONLY: "Journalisé",
  WARNED: "Avertissement",
  ZEROED_QUESTION: "Question zérotée",
  ZEROED_EVALUATION: "Évaluation invalidée",
};

const TYPE_LABELS: Record<string, string> = {
  FULLSCREEN_EXIT: "Sortie du plein écran",
  VISIBILITY_HIDDEN: "Onglet masqué / changé",
  WINDOW_BLUR: "Perte de focus de la fenêtre",
  DEVTOOLS_SUSPECTED: "Outils de développement suspectés",
  COPY_ATTEMPT: "Tentative de copier",
  PASTE_ATTEMPT: "Tentative de coller",
  AI_TEXT_SUSPECTED: "Réponse suspectée générée par IA",
  SESSION_TOKEN_INVALID: "Session invalide (heartbeat manquant)",
  HEARTBEAT_MISSED: "Heartbeat manqué",
  MULTI_TAB_DETECTED: "Onglets multiples détectés",
};

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

      {events.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun événement d&apos;intégrité pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{TYPE_LABELS[event.type] ?? event.type}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${SEVERITY_STYLES[event.severity] ?? "bg-gray-100"}`}
                >
                  {event.severity}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {event.evaluation.level.skill.name} — {event.evaluation.level.name}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                <span>{ACTION_LABELS[event.actionTaken] ?? event.actionTaken}</span>
                <span>{event.serverTimestamp.toLocaleString("fr-FR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
