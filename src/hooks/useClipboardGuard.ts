"use client";

import { useCallback } from "react";
import type { ClipboardEvent } from "react";

export function useClipboardGuard(onViolation: (type: "COPY_ATTEMPT" | "PASTE_ATTEMPT") => void) {
  const onCopy = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation("COPY_ATTEMPT");
    },
    [onViolation],
  );
  const onCut = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation("COPY_ATTEMPT");
    },
    [onViolation],
  );
  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation("PASTE_ATTEMPT");
    },
    [onViolation],
  );

  return { onCopy, onCut, onPaste };
}
