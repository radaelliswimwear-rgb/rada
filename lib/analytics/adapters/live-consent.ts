"use client";

import { CONSENT_COOKIE_NAME, parseConsentCookieValue } from "lib/consent/preferences";
import type { ConsentPreferences } from "lib/consent/preferences";

// Fase 2B (cierre de gap de la auditoría de pre-activación): antes,
// dispatchGA4Event/dispatchMetaPixelEvent solo comprobaban que
// window.gtag/window.fbq existieran -- una vez que el script cargó (con
// consentimiento vigente en ese momento), seguían existiendo en memoria
// aunque la clienta revocara el consentimiento después SIN recargar la
// página (el loader deja de inyectar el <script> recién en el PRÓXIMO
// render del servidor, eso no "descarga" un script que ya corrió). Esto
// releía el consentimiento EN VIVO antes de cada dispatch, sin depender de
// un reload. radaelli_consent es la única cookie de este sitio
// deliberadamente legible por JS (ver lib/consent/consent-actions.ts),
// justo para este caso -- reusa el mismo parser que ya usa el servidor
// (lib/consent/preferences.ts), sin duplicar el formato.

// Pura: dado el string crudo de document.cookie (o cualquier string con el
// mismo formato "nombre=valor; nombre2=valor2"), extrae y decodifica
// radaelli_consent. Separada de readLiveConsent() para poder probarla sin
// un DOM real (mismo patrón del resto del proyecto: lógica pura separada
// de lo que toca cookies()/document).
export function parseConsentFromCookieString(
  cookieString: string,
): ConsentPreferences | null {
  const match = cookieString.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`),
  );
  if (!match) return null;
  const rawValue = match[1];
  if (rawValue === undefined) return null;
  let raw: string;
  try {
    raw = decodeURIComponent(rawValue);
  } catch {
    return null;
  }
  return parseConsentCookieValue(raw);
}

export function readLiveConsent(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;
  return parseConsentFromCookieString(document.cookie);
}
