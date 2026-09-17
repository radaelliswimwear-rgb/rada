"use server";

import { getConsentPreferencesAction } from "lib/consent/consent-actions";
import { getAppBaseUrl } from "lib/utils";
import { buildAttributionTouch } from "./parsing";
import { applyTouch, shouldPersistAttribution } from "./state";
import { readAttributionCookie, writeAttributionCookie } from "./cookie";

// Público a propósito (como activateInternalTrafficAction en Fase 0): se
// llama desde components/attribution/attribution-capture.tsx en el mount
// de cada carga de página real y, sin recargar, apenas la clienta otorga
// consentimiento de marketing mientras sigue en la misma landing (ver ese
// componente para el mecanismo exacto -- nunca un workaround de
// localStorage antes de consentimiento).
//
// Nunca lanza hacia el llamador: esto es puramente de marketing, un fallo
// acá jamás debe romper la navegación de la clienta.
export async function captureAttributionTouchAction(input: {
  search: string; // query string crudo, con o sin "?" inicial
  referrer: string | null;
  path: string;
}): Promise<void> {
  try {
    const consent = await getConsentPreferencesAction();
    if (!shouldPersistAttribution(consent)) return;

    let siteHost: string;
    try {
      siteHost = new URL(getAppBaseUrl()).host;
    } catch {
      return; // sin base URL confiable no hay forma segura de distinguir referral externo de interno
    }

    const touch = buildAttributionTouch({
      search: new URLSearchParams(input.search),
      referrer: input.referrer,
      path: input.path,
      siteHost,
      now: new Date(),
    });
    if (!touch) return; // visita directa o navegación interna: no se toca la cookie

    const existing = await readAttributionCookie();
    await writeAttributionCookie(applyTouch(existing, touch));
  } catch (error) {
    console.error(
      "captureAttributionTouchAction: no se pudo capturar la atribución",
      error,
    );
  }
}
