"use client";

import { useEffect } from "react";

export function useVisibilityGuard(
  onViolation: (type: "VISIBILITY_HIDDEN" | "WINDOW_BLUR") => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;

    function handleVisibilityChange() {
      if (document.hidden) onViolation("VISIBILITY_HIDDEN");
    }
    function handleBlur() {
      onViolation("WINDOW_BLUR");
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [active, onViolation]);
}
