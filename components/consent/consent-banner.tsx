"use client";

import { useState } from "react";
import {
  ACCEPT_ALL_CONSENT,
  REJECT_NON_ESSENTIAL_CONSENT,
} from "lib/consent/preferences";
import type { ConsentPreferences } from "lib/consent/preferences";
import { setConsentPreferencesAction } from "lib/consent/consent-actions";

// Fase 0 de analytics: banner de consentimiento de cookies. Hoy el sitio no
// tiene NINGÚN tracker instalado (sin GA4, sin GTM, sin Meta Pixel, sin
// Meta CAPI) -- esto solo guarda la preferencia de la clienta para que una
// fase futura decida si prende algo según lo que haya acá. El copy nunca
// debe insinuar que ya hay analítica o publicidad activa.
export function ConsentBanner({
  initialConsent,
}: {
  initialConsent: ConsentPreferences | null;
}) {
  // Ya hay una decisión guardada (leída en el server, ver app/layout.tsx) ->
  // no mostrar nada, ni siquiera un parpadeo antes de la hidratación.
  const [dismissed, setDismissed] = useState(initialConsent !== null);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (dismissed) return null;

  async function handleChoice(prefs: { analytics: boolean; marketing: boolean }) {
    setIsSaving(true);
    try {
      await setConsentPreferencesAction(prefs);
      setDismissed(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white/95 p-5 shadow-lg backdrop-blur-xl dark:border-neutral-800 dark:bg-black/95">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        Usamos cookies esenciales para que la tienda funcione (carrito,
        sesión, pagos). Con tu permiso, también podríamos usar cookies de
        análisis y de publicidad más adelante, para entender mejor tu
        experiencia de compra.
      </p>

      {expanded ? (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <span>
              Necesarias — siempre activas
              <span className="mt-0.5 block text-xs text-neutral-400 dark:text-neutral-500">
                Carrito, sesión y pagos. No se pueden desactivar.
              </span>
            </span>
            <input
              type="checkbox"
              checked
              disabled
              aria-label="Cookies necesarias, siempre activas"
              className="h-4 w-4 shrink-0 rounded border-neutral-300 text-neutral-400 dark:border-neutral-700"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-700 dark:border-neutral-800 dark:text-white">
            <span>
              Analíticas
              <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                Nos ayudarían a entender cómo se usa la tienda.
              </span>
            </span>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              aria-label="Cookies analíticas"
              className="h-4 w-4 shrink-0 rounded border-neutral-300 text-brand-coral focus:ring-brand-coral dark:border-neutral-700"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-700 dark:border-neutral-800 dark:text-white">
            <span>
              Marketing
              <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                Nos ayudarían a mostrarte publicidad más relevante.
              </span>
            </span>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              aria-label="Cookies de marketing"
              className="h-4 w-4 shrink-0 rounded border-neutral-300 text-brand-coral focus:ring-brand-coral dark:border-neutral-700"
            />
          </label>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleChoice({ analytics, marketing })}
            className="mt-1 rounded-full bg-brand-coral px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-crimson disabled:opacity-50"
          >
            Guardar preferencias
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleChoice(ACCEPT_ALL_CONSENT)}
            className="rounded-full bg-brand-coral px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-crimson disabled:opacity-50"
          >
            Aceptar todas
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleChoice(REJECT_NON_ESSENTIAL_CONSENT)}
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson disabled:opacity-50 dark:border-neutral-700 dark:text-white"
          >
            Rechazar no esenciales
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setExpanded(true)}
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm text-neutral-700 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson disabled:opacity-50 dark:border-neutral-700 dark:text-white"
          >
            Configurar
          </button>
        </div>
      )}
    </div>
  );
}
