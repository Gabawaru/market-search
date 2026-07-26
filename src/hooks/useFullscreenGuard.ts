"use client";

import { useCallback } from "react";

export function useFullscreenGuard() {
  const requestFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch {
      // Best-effort : l'API Fullscreen n'est pas fiable partout (ex: iOS Safari) — on
      // continue quand même plutôt que de bloquer l'enfant, la limite est documentée.
      return false;
    }
  }, []);

  return { requestFullscreen };
}
