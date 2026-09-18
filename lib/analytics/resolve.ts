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
