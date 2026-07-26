"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFullscreenGuard } from "@/hooks/useFullscreenGuard";
import { useFullscreenExitGuard } from "@/hooks/useFullscreenExitGuard";
import { useVisibilityGuard } from "@/hooks/useVisibilityGuard";
import { useClipboardGuard } from "@/hooks/useClipboardGuard";
import { useDevtoolsGuard } from "@/hooks/useDevtoolsGuard";
import { IntegrityWarningModal } from "@/components/evaluation/IntegrityWarningModal";

type ReportableEventType =
  | "FULLSCREEN_EXIT"
  | "VISIBILITY_HIDDEN"
  | "WINDOW_BLUR"
  | "DEVTOOLS_SUSPECTED"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT";

interface AttemptPayload {
  attemptId: string;
  order: number;
  promptText: string;
}

interface StartResponse {
  evaluationId: string;
  token: string;
  attempts: AttemptPayload[];
}

interface FinishResponse {
  totalScore: number;
  passed: boolean;
  invalidated: boolean;
}

const HEARTBEAT_INTERVAL_MS = 8000;

function integrityMessage(type: ReportableEventType): string {
  switch (type) {
    case "FULLSCREEN_EXIT":
      return "Tu as quitté le plein écran ! Reste en plein écran pendant toute l'évaluation.";
    case "VISIBILITY_HIDDEN":
    case "WINDOW_BLUR":
      return "Tu as changé d'onglet ou de fenêtre — reste concentré sur l'évaluation.";
    case "DEVTOOLS_SUSPECTED":
      return "Activité inhabituelle détectée.";
    case "COPY_ATTEMPT":
    case "PASTE_ATTEMPT":
      return "Le copier-coller n'est pas autorisé pendant l'évaluation.";
  }
}

export function EvaluationGuard({ skillId, skillName }: { skillId: string; skillName: string }) {
  const [phase, setPhase] = useState<"prompt" | "running" | "finished">("prompt");
  const [attempts, setAttempts] = useState<AttemptPayload[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [result, setResult] = useState<FinishResponse | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const evaluationIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { requestFullscreen } = useFullscreenGuard();
  const active = phase === "running";
  const currentAttempt = attempts[currentIndex];

  const reportIntegrityEvent = useCallback((type: ReportableEventType, attemptId?: string) => {
    if (!evaluationIdRef.current) return;
    setWarning(integrityMessage(type));
    fetch(`/api/evaluations/${evaluationIdRef.current}/integrity-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        evaluationAttemptId: attemptId,
        clientTimestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  useFullscreenExitGuard(
    () => reportIntegrityEvent("FULLSCREEN_EXIT", currentAttempt?.attemptId),
    active,
  );
  useVisibilityGuard(
    (type) => reportIntegrityEvent(type, currentAttempt?.attemptId),
    active,
  );
  useDevtoolsGuard(
    () => reportIntegrityEvent("DEVTOOLS_SUSPECTED", currentAttempt?.attemptId),
    active,
  );
  const clipboardHandlers = useClipboardGuard((type) =>
    reportIntegrityEvent(type, currentAttempt?.attemptId),
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(async () => {
      // Pas de heartbeat tant que l'onglet est caché : le jeton expirera naturellement,
      // ce qui bloquera les réponses suivantes côté serveur — cohérent avec la détection
      // de perte de focus.
      if (document.hidden || !evaluationIdRef.current || !tokenRef.current) return;
      const res = await fetch(`/api/evaluations/${evaluationIdRef.current}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        tokenRef.current = data.token;
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [stopHeartbeat]);

  useEffect(() => stopHeartbeat, [stopHeartbeat]);

  async function handleStart() {
    setStartError(null);
    await requestFullscreen();

    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStartError(body.error ?? "Impossible de démarrer l'évaluation");
      return;
    }

    const data: StartResponse = await res.json();
    evaluationIdRef.current = data.evaluationId;
    tokenRef.current = data.token;
    setAttempts(data.attempts);
    setCurrentIndex(0);
    startedAtRef.current = Date.now();
    setPhase("running");
    startHeartbeat();
  }

  const finishEvaluation = useCallback(async () => {
    stopHeartbeat();
    const res = await fetch(`/api/evaluations/${evaluationIdRef.current}/finish`, {
      method: "POST",
    });
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    if (res.ok) {
      const data: FinishResponse = await res.json();
      setResult(data);
    }
    setPhase("finished");
  }, [stopHeartbeat]);

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!currentAttempt || !answer.trim() || !evaluationIdRef.current || !tokenRef.current) return;

    await fetch(`/api/evaluations/${evaluationIdRef.current}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenRef.current,
        attemptId: currentAttempt.attemptId,
        answerGiven: answer.trim(),
        timeTakenMs: Date.now() - startedAtRef.current,
      }),
    });

    setAnswer("");
    startedAtRef.current = Date.now();

    if (currentIndex + 1 < attempts.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      await finishEvaluation();
    }
  }

  if (phase === "prompt") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border p-8 text-center">
        <h2 className="text-xl font-semibold">Évaluation : {skillName}</h2>
        <p className="text-sm text-gray-600">
          L&apos;évaluation se déroule en plein écran. Ne change pas d&apos;onglet et ne quitte
          pas le plein écran pendant l&apos;évaluation, sinon elle sera invalidée.
        </p>
        {startError && <p className="text-sm text-red-600">{startError}</p>}
        <button
          onClick={handleStart}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Commencer l&apos;évaluation en plein écran
        </button>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border p-8 text-center">
        {result?.invalidated ? (
          <>
            <h2 className="text-xl font-semibold text-red-600">Évaluation invalidée</h2>
            <p className="text-sm text-gray-600">
              Une anomalie a été détectée pendant l&apos;évaluation (sortie de plein écran ou
              changement d&apos;onglet répété). Retente une prochaine fois en restant bien sur la
              page.
            </p>
          </>
        ) : result?.passed ? (
          <>
            <h2 className="text-xl font-semibold text-emerald-600">Bravo, niveau validé !</h2>
            <p className="text-sm text-gray-600">
              Score : {Math.round((result?.totalScore ?? 0) * 100)}%
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Pas encore validé</h2>
            <p className="text-sm text-gray-600">
              Score : {Math.round((result?.totalScore ?? 0) * 100)}% — continue à
              t&apos;entraîner et retente l&apos;évaluation bientôt.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {warning && <IntegrityWarningModal message={warning} onDismiss={() => setWarning(null)} />}
      <div className="text-xs uppercase text-gray-400">
        Question {currentIndex + 1} / {attempts.length}
      </div>
      <div className="rounded-lg border p-6 text-center text-3xl font-semibold">
        {currentAttempt?.promptText}
      </div>
      <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-3">
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onCopy={clipboardHandlers.onCopy}
          onCut={clipboardHandlers.onCut}
          onPaste={clipboardHandlers.onPaste}
          className="rounded-md border px-3 py-2 text-center text-xl"
          placeholder="Ta réponse"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
        >
          Valider
        </button>
      </form>
    </div>
  );
}
