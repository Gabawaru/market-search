"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { pickCorrectMessage, pickIncorrectMessage } from "@/lib/progression/feedbackMessages";

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
}

async function fetchExercise(url: string): Promise<ExercisePayload> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Impossible de charger l'exercice");
  }
  return res.json();
}

export function PracticeSession({ skillId }: { skillId: string }) {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<AttemptResult | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const startedAtRef = useRef(0);

  const {
    data: exercise,
    error,
    isLoading,
  } = useSWR<ExercisePayload>(`/api/exercises/next?skillId=${skillId}&round=${round}`, fetchExercise, {
    revalidateOnFocus: false,
    onSuccess: () => {
      startedAtRef.current = Date.now();
    },
  });

  function handleNext() {
    setFeedback(null);
    setAnswer("");
    setRound((r) => r + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    setFeedback(result);
    setFeedbackMessage(
      result.isCorrect ? pickCorrectMessage() : pickIncorrectMessage(result.correctAnswer),
    );
  }

  if (isLoading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (error) return <p className="text-sm text-red-600">{(error as Error).message}</p>;
  if (!exercise) return null;

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
            onChange={(e) => setAnswer(e.target.value)}
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
