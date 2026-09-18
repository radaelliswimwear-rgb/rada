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
import { clearGa4Cookies, clearMetaCookies } from "lib/analytics/third-party-cookies";

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

  // Fase 2B (cierre de gap de la auditoría de pre-activación): mismo
  // criterio que arriba, para las cookies de terceros que GA4/Meta dejan en
  // el navegador cuando el runtime está activo -- ver
  // lib/analytics/third-party-cookies.ts para el detalle y las
  // limitaciones reales de esto. Cada una en su propio try/catch: un fallo
  // limpiando cookies de terceros NUNCA debe impedir guardar la preferencia
  // de consentimiento en sí ("ANALYTICS MUST FAIL OPEN FOR COMMERCE").
  if (!prefs.analytics) {
    try {
      await clearGa4Cookies();
    } catch (error) {
      console.error(
        "setConsentPreferencesAction: no se pudieron limpiar las cookies de GA4, se sigue igual",
        error,
      );
    }
  }
  if (!prefs.marketing) {
    try {
      await clearMetaCookies();
    } catch (error) {
      console.error(
        "setConsentPreferencesAction: no se pudieron limpiar las cookies de Meta, se sigue igual",
        error,
      );
    }
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
