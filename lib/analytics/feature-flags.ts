// Interruptor central de la Fase 2A (sección 36 del proceso). Mismo patrón
// que WRITES_PAUSED (lib/system/write-pause.ts) y PAYMENTS_TEST_MODE
// (lib/payments/guard-real-payments.ts): string exacto "true", fail-closed
// -- cualquier otro valor (ausente, "false", "1", vacío, typo) es
// DESACTIVADO. Nunca se infiere de NODE_ENV/APP_ENVIRONMENT.
//
// ANALYTICS_RUNTIME_ENABLED es el maestro: apagado, nada de esta fase hace
// NADA (ni GA4/Meta externos, ni siquiera el first-party propio -- sección
// 2 del proceso lista "feature flags" como uno de los gates de los TRES
// destinos, no solo de los externos). Los dos sub-flags solo importan si el
// maestro ya está prendido.
function isEnvFlagTrue(value: string | undefined): boolean {
  return value === "true";
}

export function isAnalyticsRuntimeEnabled(): boolean {
  return isEnvFlagTrue(process.env.ANALYTICS_RUNTIME_ENABLED);
}

// GA4 browser + Meta Pixel browser -- scripts de terceros en el navegador.
export function isBrowserAnalyticsEnabled(): boolean {
  return (
    isAnalyticsRuntimeEnabled() && isEnvFlagTrue(process.env.ANALYTICS_BROWSER_ENABLED)
  );
}

// Meta CAPI (y futuro GA4 Measurement Protocol) -- entrega server-side.
export function isServerDeliveryEnabled(): boolean {
  return (
    isAnalyticsRuntimeEnabled() &&
    isEnvFlagTrue(process.env.ANALYTICS_SERVER_DELIVERY_ENABLED)
  );
}
