"use client";

import { useEffect } from "react";

export function IntegrityWarningModal({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timeout);
  }, [message, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
        <p className="font-medium text-red-600">{message}</p>
      </div>
    </div>
  );
}
