"use client";

import { useEffect } from "react";

export function useFullscreenExitGuard(onExit: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;

    function handleFullscreenChange() {
      if (!document.fullscreenElement) onExit();
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [active, onExit]);
}
