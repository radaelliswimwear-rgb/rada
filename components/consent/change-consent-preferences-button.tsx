"use client";

import { useState } from "react";
import { resetConsentPreferencesAction } from "lib/consent/consent-actions";

// Borra la decisión guardada y recarga -- ConsentBanner (montado en
// app/layout.tsx) vuelve a mostrarse porque RootLayout relee
// getConsentPreferencesAction() en el próximo request y ahora da null.
export function ChangeConsentPreferencesButton() {
  const [isResetting, setIsResetting] = useState(false);

  const onClick = async () => {
    setIsResetting(true);
    await resetConsentPreferencesAction();
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isResetting}
      className="rounded-full border border-neutral-300 px-5 py-2 text-sm text-neutral-700 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson disabled:opacity-50 dark:border-neutral-700 dark:text-white"
    >
      {isResetting ? "Abriendo..." : "Cambiar mis preferencias de cookies"}
    </button>
  );
}
