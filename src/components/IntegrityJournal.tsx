export const SEVERITY_STYLES: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-red-100 text-red-700",
};

export const ACTION_LABELS: Record<string, string> = {
  LOGGED_ONLY: "Journalisé",
  WARNED: "Avertissement",
  ZEROED_QUESTION: "Question zérotée",
  ZEROED_EVALUATION: "Évaluation invalidée",
};

export const TYPE_LABELS: Record<string, string> = {
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

export interface IntegrityJournalEvent {
  id: string;
  type: string;
  severity: string;
  actionTaken: string;
  serverTimestamp: Date;
  evaluation: { level: { name: string; skill: { name: string } } };
}

/** Liste factorisée entre le journal d'intégrité parent et prof — mêmes libellés, même mise en
 * forme, seule la page appelante décide qui a le droit de la voir (et si la consultation doit
 * marquer les événements comme lus, ce qui ne concerne que le parent — voir
 * IntegrityEvent.viewedByParentAt). */
export function IntegrityEventList({ events }: { events: IntegrityJournalEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500">Aucun événement d&apos;intégrité pour l&apos;instant.</p>;
  }

  return (
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
  );
}
