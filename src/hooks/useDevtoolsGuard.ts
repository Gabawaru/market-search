"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 2000;
const THRESHOLD_PX = 160;

/** Détection best-effort (écart de taille de fenêtre) — jamais fiable à 100%, c'est un
 * signal de sévérité faible parmi d'autres, jamais une preuve à lui seul. */
export function useDevtoolsGuard(onSuspected: () => void, active: boolean) {
  const alreadyWarnedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const suspected = widthDiff > THRESHOLD_PX || heightDiff > THRESHOLD_PX;

      if (suspected && !alreadyWarnedRef.current) {
        alreadyWarnedRef.current = true;
        onSuspected();
      } else if (!suspected) {
        alreadyWarnedRef.current = false;
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [active, onSuspected]);
}
