// Matriz de consentimiento (Fase 2A, sección 27 del proceso) -- lógica pura,
// sin cookies()/Prisma/env. Separa a propósito el gate "por visitante"
// (consentimiento + tráfico interno) del gate "por deployment" (feature
// flags, lib/analytics/feature-flags.ts) -- se combinan explícitamente en
// las funciones *Active de abajo, nunca mezclados dentro de esta lógica.
//
// Matriz exacta:
//   GA4 browser / first-party behavioral -> requiere analytics=true
//   Meta Pixel (browser)                 -> requiere marketing=true
//   Meta CAPI (server)                   -> requiere marketing=true Y Order no excluido
// Tráfico interno bloquea los tres, siempre, antes que cualquier otra cosa
// (sección 26: "CRÍTICO. Antes de cualquier evento comercial:
// resolveInternalTraffic()").
export type ConsentLike = { analytics: boolean; marketing: boolean } | null;

export function isFirstPartyAnalyticsAllowed(
  consent: ConsentLike,
  isInternalTraffic: boolean,
): boolean {
  if (isInternalTraffic) return false;
  return consent?.analytics === true;
}

// Hoy es exactamente la misma regla que first-party (ambos "behavioral",
// gateados por analytics=true) -- función propia igual, para que un cambio
// futuro de la matriz (ej. GA4 exigiendo algo más) no tenga que tocar el
// nombre que ya usan los call sites.
export function isGA4BrowserAllowed(
  consent: ConsentLike,
  isInternalTraffic: boolean,
): boolean {
  return isFirstPartyAnalyticsAllowed(consent, isInternalTraffic);
}

export function isMetaPixelAllowed(
  consent: ConsentLike,
  isInternalTraffic: boolean,
): boolean {
  if (isInternalTraffic) return false;
  return consent?.marketing === true;
}

export function isMetaCapiAllowed(input: {
  consent: ConsentLike;
  isInternalTraffic: boolean;
  // Order.marketingExclusionReason -- null significa "elegible". Mismo
  // criterio que lib/analytics/purchase-eligibility.ts
  // (isEligibleForMarketingPurchaseEvent), reutilizado acá, no reinventado.
  orderMarketingExclusionReason: string | null | undefined;
}): boolean {
  if (input.isInternalTraffic) return false;
  if (input.consent?.marketing !== true) return false;
  return (input.orderMarketingExclusionReason ?? null) === null;
}

// Combinan el gate por visitante con el flag de deployment -- estas son las
// que de verdad llaman el loader/adapter/outbox, nunca las de arriba solas.
// runtimeEnabled ya viene resuelto (isBrowserAnalyticsEnabled()/
// isServerDeliveryEnabled(), lib/analytics/feature-flags.ts) para que esta
// función siga sin tocar process.env directamente.
export function isGA4BrowserActive(input: {
  consent: ConsentLike;
  isInternalTraffic: boolean;
  runtimeEnabled: boolean;
}): boolean {
  return (
    input.runtimeEnabled && isGA4BrowserAllowed(input.consent, input.isInternalTraffic)
  );
}

export function isMetaPixelActive(input: {
  consent: ConsentLike;
  isInternalTraffic: boolean;
  runtimeEnabled: boolean;
}): boolean {
  return (
    input.runtimeEnabled && isMetaPixelAllowed(input.consent, input.isInternalTraffic)
  );
}

export function isMetaCapiActive(input: {
  consent: ConsentLike;
  isInternalTraffic: boolean;
  runtimeEnabled: boolean;
  orderMarketingExclusionReason: string | null | undefined;
}): boolean {
  return input.runtimeEnabled && isMetaCapiAllowed(input);
}

export function isFirstPartyAnalyticsActive(input: {
  consent: ConsentLike;
  isInternalTraffic: boolean;
  runtimeEnabled: boolean;
}): boolean {
  return (
    input.runtimeEnabled &&
    isFirstPartyAnalyticsAllowed(input.consent, input.isInternalTraffic)
  );
}
