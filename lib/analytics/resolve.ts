import { headers } from "next/headers";
import { getConsentPreferencesAction } from "lib/consent/consent-actions";

// Llamado desde los mismos 3 puntos donde ya se resuelve
// resolvePaymentAttributionSnapshot (lib/payments/payments-actions.ts) --
// necesario porque el Order se crea o confirma después desde webhook/
// return/cron, contextos sin cookies del navegador. Sin congelar esto ACÁ,
// MarketingEventOutbox (lib/analytics/marketing-outbox.ts) no tendría forma
// de saber, en esos contextos, si había consentimiento de marketing en el
// momento real de la compra.
//
// "ANALYTICS MUST FAIL OPEN FOR COMMERCE": un error leyendo el
// consentimiento nunca debe impedir crear el Payment -- null (no se pudo
// determinar) nunca autoriza envío a Meta (ver isMetaCapiAllowed,
// lib/analytics/consent-gate.ts).
export async function resolveMarketingConsentSnapshot(): Promise<boolean | null> {
  try {
    const consent = await getConsentPreferencesAction();
    return consent?.marketing ?? null;
  } catch (error) {
    console.error(
      "resolveMarketingConsentSnapshot: no se pudo leer el consentimiento, se sigue sin él",
      error,
    );
    return null;
  }
}

// Fase 2B: misma función que arriba, pero para la categoría de consentimiento
// `analytics` -- DISTINTA de `marketing` (ver lib/analytics/consent-gate.ts:
// GA4/first-party gatean por analytics, Meta Pixel/CAPI por marketing). Sin
// esto, recordPaymentFailedEvent (lib/analytics/payment-failed.ts) no tenía
// forma de saber, desde un webhook/cron, si la clienta había consentido
// analytics -- terminaba grabando el evento igual con solo mirar tráfico
// interno (bug encontrado en la auditoría de Fase 2B).
export async function resolveAnalyticsConsentSnapshot(): Promise<boolean | null> {
  try {
    const consent = await getConsentPreferencesAction();
    return consent?.analytics ?? null;
  } catch (error) {
    console.error(
      "resolveAnalyticsConsentSnapshot: no se pudo leer el consentimiento, se sigue sin él",
      error,
    );
    return null;
  }
}

// Fase 2B: User-Agent del request real, congelado en el mismo momento y por
// el mismo motivo que los snapshots de arriba -- único destino hoy es
// client_user_agent en Meta CAPI (lib/analytics/adapters/meta-capi.ts),
// parámetro ya seleccionado a mano en Meta Events Manager. "ANALYTICS MUST
// FAIL OPEN FOR COMMERCE": un error leyendo el header nunca debe impedir
// crear el Payment.
export async function resolveUserAgentSnapshot(): Promise<string | null> {
  try {
    const store = await headers();
    return store.get("user-agent") ?? null;
  } catch (error) {
    console.error(
      "resolveUserAgentSnapshot: no se pudo leer el User-Agent, se sigue sin él",
      error,
    );
    return null;
  }
}
