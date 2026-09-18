"use server";

import { headers } from "next/headers";
import { getConsentPreferencesAction } from "lib/consent/consent-actions";
import { resolveInternalTraffic } from "lib/internal-traffic/resolve";
import { readAttributionCookie } from "lib/attribution/cookie";
import { isFirstPartyAnalyticsActive } from "./consent-gate";
import { deriveDeviceCategory } from "./device-category";
import { isAnalyticsRuntimeEnabled } from "./feature-flags";
import { sanitizeCustomPayload } from "./sanitize";
import { resolveAnalyticsSession } from "./session";
import { recordAnalyticsEvent } from "./store";
import type { AnalyticsEventInput } from "./types";

// Punto de entrada ÚNICO que los componentes cliente llaman para grabar un
// evento en el almacén first-party (ver lib/analytics/client/track.ts) --
// resuelve TODOS los gates server-side (consentimiento, tráfico interno,
// feature flag) antes de escribir nada. Nunca lanza: "ANALYTICS MUST FAIL
// OPEN FOR COMMERCE" (sección 1 del proceso) -- un fallo acá jamás debe
// interrumpir la navegación/compra de la clienta, solo se registra.
export async function recordAnalyticsEventAction(
  input: AnalyticsEventInput,
): Promise<void> {
  try {
    const [consent, internalStatus] = await Promise.all([
      getConsentPreferencesAction(),
      resolveInternalTraffic(),
    ]);

    const allowed = isFirstPartyAnalyticsActive({
      consent,
      isInternalTraffic: internalStatus.isInternal,
      runtimeEnabled: isAnalyticsRuntimeEnabled(),
    });
    if (!allowed) return;

    const [sessionId, attribution, headersList] = await Promise.all([
      resolveAnalyticsSession({ allowed: true }),
      readAttributionCookie(),
      headers(),
    ]);
    const deviceCategory = deriveDeviceCategory(headersList.get("user-agent"));

    await recordAnalyticsEvent({
      ...input,
      custom: sanitizeCustomPayload(input.custom),
      analyticsSessionId: sessionId,
      deviceCategory,
      attributionSnapshot: attribution,
    });
  } catch (error) {
    console.error(
      "recordAnalyticsEventAction: fallo no bloqueante, evento descartado",
      { eventName: input.name, error },
    );
  }
}
