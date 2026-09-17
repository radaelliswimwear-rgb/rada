"use client";

import { useState } from "react";
import { deactivateInternalTrafficAction } from "lib/internal-traffic/activation-actions";

export function DeactivateInternalTrafficPanel() {
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDeactivate = async () => {
    setIsSubmitting(true);
    await deactivateInternalTrafficAction();
    setIsSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <p className="text-center text-sm text-neutral-700 dark:text-neutral-300">
        Listo. Este navegador ya no está marcado como tráfico interno.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Esto quita la marca de tráfico interno de este navegador. Si volvés
        a necesitarlo, pedí un enlace nuevo desde el panel de
        administración.
      </p>
      <button
        type="button"
        onClick={onDeactivate}
        disabled={isSubmitting}
        className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isSubmitting ? "Desactivando..." : "Desactivar en este navegador"}
      </button>
    </div>
  );
}
