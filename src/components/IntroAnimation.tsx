"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { OumnoLogo } from "@/components/branding/OumnoLogo";

const SESSION_KEY = "oumno-intro-seen";
const STEP_DURATION_MS = 2200;

const STEPS = [
  { emoji: "🧮", text: "Apprends à ton rythme" },
  { emoji: "📈", text: "Progresse à ton niveau" },
  { emoji: "🔥", text: "Défie-toi chaque jour" },
];

// sessionStorage ne déclenche pas d'événement "storage" dans l'onglet qui écrit lui-même —
// on gère donc nous-mêmes un petit registre d'abonnés pour que useSyncExternalStore soit notifié
// dès que l'intro est marquée comme vue (même mécanisme que ThemeToggle pour le thème).
let listeners: Array<() => void> = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
  };
}

function getSnapshot() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return true;
  }
}

// Le serveur ne connaît pas sessionStorage : on suppose "déjà vue" pour que le premier rendu
// serveur ne montre jamais l'overlay (évite tout flash/mismatch d'hydratation), corrigé dès le
// premier rendu client si l'intro n'a en réalité pas encore été vue dans cette session.
function getServerSnapshot() {
  return true;
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Stockage indisponible (navigation privée...) : l'intro rejouera à chaque visite, sans
    // conséquence bloquante.
  }
  listeners.forEach((listener) => listener());
}

function IntroOverlay() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) {
      const timeout = setTimeout(markIntroSeen, STEP_DURATION_MS);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setStep((s) => s + 1), STEP_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white dark:bg-gray-950">
      <div className="animate-[intro-logo_0.6s_ease-out]">
        <OumnoLogo size={56} withWordmark />
      </div>
      <div key={step} className="animate-[intro-step_0.4s_ease-out] flex flex-col items-center gap-2">
        <span className="text-5xl">{STEPS[step].emoji}</span>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{STEPS[step].text}</p>
      </div>
      <button
        type="button"
        onClick={markIntroSeen}
        className="mt-4 text-sm text-gray-400 underline hover:text-gray-600 dark:hover:text-gray-200"
      >
        Passer
      </button>
    </div>
  );
}

export function IntroAnimation() {
  const seen = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (seen) return null;
  return <IntroOverlay />;
}
