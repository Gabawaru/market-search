"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pickCorrectMessage, pickIncorrectMessage } from "@/lib/progression/feedbackMessages";
import { requestHelpFromParent } from "@/lib/actions/help";

interface ExercisePayload {
  instanceId: string;
  promptText: string;
  levelName: string;
}

interface AttemptResult {
  isCorrect: boolean;
  correctAnswer: string;
  masteryScore: number;
  readyForEvaluation: boolean;
  currentStreak: number;
  offerHelp: boolean;
}

interface HelpOptions {
  threadId: string | null;
  teacherName: string | null;
  requestPending: boolean;
}

interface PersistedState {
  round: number;
  answer: string;
  exercise: ExercisePayload | null;
  feedback: AttemptResult | null;
  feedbackMessage: string;
}

const DEFAULT_STATE: PersistedState = {
  round: 0,
  answer: "",
  exercise: null,
  feedback: null,
  feedbackMessage: "",
};

// Session de practice persistée via localStorage (clé par enfant + compétence), pour ne rien
// perdre si l'app est rechargée ou relancée (ex. mise en arrière-plan sur mobile). Exposée via
// useSyncExternalStore plutôt qu'un simple useState+useEffect : la lecture de localStorage est
// une vraie source externe, et getServerSnapshot renvoie l'état par défaut côté serveur, ce qui
// évite tout écart d'hydratation entre le rendu serveur et le premier rendu client.
const storeCache = new Map<string, PersistedState>();
const storeListeners = new Map<string, Set<() => void>>();

function storageKey(childId: string, skillId: string) {
  return `oumno:practice-session:${childId}:${skillId}`;
}

function readFromLocalStorage(key: string): PersistedState {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PersistedState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function getSnapshot(key: string): PersistedState {
  let value = storeCache.get(key);
  if (!value) {
    value = readFromLocalStorage(key);
    storeCache.set(key, value);
  }
  return value;
}

function getServerSnapshot(): PersistedState {
  return DEFAULT_STATE;
}

function subscribe(key: string, callback: () => void) {
  if (!storeListeners.has(key)) storeListeners.set(key, new Set());
  const set = storeListeners.get(key)!;
  set.add(callback);
  return () => set.delete(callback);
}

function setPersisted(key: string, state: PersistedState) {
  storeCache.set(key, state);
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Stockage indisponible (navigation privée, quota dépassé...) : pas bloquant.
  }
  storeListeners.get(key)?.forEach((cb) => cb());
}

export function PracticeSession({
  skillId,
  childId,
  help,
}: {
  skillId: string;
  childId: string;
  help: HelpOptions;
}) {
  const key = storageKey(childId, skillId);
  const persisted = useSyncExternalStore(
    (callback) => subscribe(key, callback),
    () => getSnapshot(key),
    getServerSnapshot,
  );
  const [error, setError] = useState<string | null>(null);
  const startedAtRef = useRef(0);
  const initialFetchDone = useRef(false);

  async function loadExercise(currentRound: number, base: PersistedState) {
    setError(null);
    try {
      const res = await fetch(`/api/exercises/next?skillId=${skillId}&round=${currentRound}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Impossible de charger l'exercice");
      }
      const data: ExercisePayload = await res.json();
      startedAtRef.current = Date.now();
      setPersisted(key, { ...base, round: currentRound, exercise: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    if (persisted.exercise) {
      startedAtRef.current = Date.now();
      return;
    }
    // loadExercise ne met à jour l'état qu'après un fetch réseau (await) — un vrai effet de
    // bord asynchrone, pas une dérivation synchrone d'état ; le lint ne distingue pas les deux.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExercise(persisted.round, persisted);
    // Ne doit s'exécuter qu'une fois par montage (voir initialFetchDone) : ne pas relancer un
    // fetch à chaque changement de persisted/loadExercise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, skillId]);

  function handleAnswerChange(value: string) {
    setPersisted(key, { ...persisted, answer: value });
  }

  function handleNext() {
    const cleared = { ...persisted, feedback: null, feedbackMessage: "", answer: "", exercise: null };
    setPersisted(key, cleared);
    void loadExercise(persisted.round + 1, cleared);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { exercise, answer } = persisted;
    if (!exercise || !answer.trim()) return;

    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseInstanceId: exercise.instanceId,
        answerGiven: answer.trim(),
        timeTakenMs: Date.now() - startedAtRef.current,
      }),
    });
    if (!res.ok) return;
    const result: AttemptResult = await res.json();
    setPersisted(key, {
      ...persisted,
      feedback: result,
      feedbackMessage: result.isCorrect
        ? pickCorrectMessage()
        : pickIncorrectMessage(result.correctAnswer),
    });
  }

  const { exercise, answer, feedback, feedbackMessage } = persisted;

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!exercise) return <p className="text-sm text-gray-500">Chargement...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs uppercase text-gray-400">{exercise.levelName}</div>
      <div className="rounded-lg border p-6 text-center text-3xl font-semibold">
        {exercise.promptText}
      </div>

      {feedback ? (
        <div className="flex flex-col items-center gap-3">
          <p className={feedback.isCorrect ? "text-lg font-medium text-emerald-600" : "text-lg font-medium text-red-600"}>
            {feedbackMessage}
          </p>
          {feedback.readyForEvaluation && (
            <p className="text-sm text-indigo-600">
              Tu maîtrises bien ce niveau, une évaluation sera bientôt possible !
            </p>
          )}
          {feedback.offerHelp && (
            <div className="flex w-full flex-col gap-2 rounded-lg border border-sky-300 bg-sky-50 p-4 text-center">
              <p className="font-medium text-sky-900">Tu veux un coup de main ?</p>
              <p className="text-sm text-sky-800">
                Cette série est costaude — ça arrive à tout le monde ! Une vraie personne peut
                t&apos;expliquer autrement.
              </p>
              {help.threadId ? (
                <Link
                  href={`/app/messages/${help.threadId}`}
                  className="self-center rounded-md bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700"
                >
                  Écrire à {help.teacherName ?? "mon prof"}
                </Link>
              ) : help.requestPending ? (
                <p className="text-sm font-medium text-sky-900">
                  C&apos;est noté ! Tes parents sont prévenus, vous regarderez ça ensemble.
                </p>
              ) : (
                <form action={requestHelpFromParent} className="self-center">
                  <input type="hidden" name="skillId" value={skillId} />
                  <button
                    type="submit"
                    className="rounded-md bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700"
                  >
                    Prévenir mes parents
                  </button>
                </form>
              )}
            </div>
          )}
          <button
            onClick={handleNext}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Exercice suivant
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
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
      )}
    </div>
  );
}
