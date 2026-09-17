"use server";

import { cookies } from "next/headers";
import {
  buildConsentCookieValue,
  CONSENT_COOKIE_NAME,
  parseConsentCookieValue,
} from "./preferences";
import type { ConsentPreferences } from "./preferences";

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
}

// Borra la decisión guardada -- usado desde /cookies ("Cambiar mis
// preferencias") para que ConsentBanner vuelva a mostrarse en la próxima
// carga (RootLayout vuelve a leer getConsentPreferencesAction(), que da
// null otra vez).
export async function resetConsentPreferencesAction(): Promise<void> {
  const store = await cookies();
  store.delete(CONSENT_COOKIE_NAME);
}
