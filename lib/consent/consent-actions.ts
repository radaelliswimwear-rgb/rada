"use server";

import { cookies } from "next/headers";
import {
  buildConsentCookieValue,
  CONSENT_COOKIE_NAME,
  parseConsentCookieValue,
} from "./preferences";
import type { ConsentPreferences } from "./preferences";
import { clearAttributionCookie } from "lib/attribution/cookie";
import { shouldClearAttributionOnConsentChange } from "lib/attribution/state";

const CONSENT_DURATION_SECONDS = 60 * 60 * 24 * 365; // 365 días

export async function getConsentPreferencesAction(): Promise<ConsentPreferences | null> {
  const store = await cookies();
  const raw = store.get(CONSENT_COOKIE_NAME)?.value;
  return parseConsentCookieValue(raw);
}

export async function setConsentPreferencesAction(prefs: {
  analytics: boolean;
  marketing: boolean;
}): Promise<void> {
  const value = buildConsentCookieValue(prefs);
  const store = await cookies();
  store.set(CONSENT_COOKIE_NAME, value, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CONSENT_DURATION_SECONDS,
  });

  // Fase 1 (lib/attribution): si la clienta guarda marketing=false (ya sea
  // "Rechazar no esenciales" o "Configurar" sin marcarlo), la atribución de
  // marketing futura se borra acá mismo -- un solo lugar que hace cumplir
  // "sin consentimiento de marketing, no hay cookie de atribución viva",
  // sin importar qué botón de la UI lo haya disparado. Nunca toca
  // Payments/Orders ya creados: esos snapshots ya están congelados aparte.
  if (shouldClearAttributionOnConsentChange(prefs)) {
    await clearAttributionCookie();
  }
}

// Borra la decisión guardada -- usado desde /cookies ("Cambiar mis
// preferencias") para que ConsentBanner vuelva a mostrarse en la próxima
// carga (RootLayout vuelve a leer getConsentPreferencesAction(), que da
// null otra vez).
export async function resetConsentPreferencesAction(): Promise<void> {
  const store = await cookies();
  store.delete(CONSENT_COOKIE_NAME);
}
