import type { AttributionState, AttributionTouch } from "./types";

// Constante central de TTL -- no existía un criterio previo en el proyecto
// para atribución de marketing, así que se documenta acá una ventana
// razonable (90 días, un estándar común de first-party attribution) en vez
// de repetir el número en cada lugar que lo necesita.
export const ATTRIBUTION_TTL_DAYS = 90;

const CURRENT_VERSION = 1 as const;

// firstTouch se fija UNA sola vez (la primera vez que existe algo que
// guardar) y nunca se vuelve a tocar después. lastTouch se reemplaza cada
// vez que se llama con un touch válido nuevo -- el llamador es responsable
// de nunca invocar esto para una visita directa/navegación interna (ver
// buildAttributionTouch, que devuelve null en esos casos y por lo tanto
// nunca debería llegar hasta acá).
export function applyTouch(
  existing: AttributionState | null,
  touch: AttributionTouch,
): AttributionState {
  return {
    version: CURRENT_VERSION,
    firstTouch: existing?.firstTouch ?? touch,
    lastTouch: touch,
  };
}

// Nunca lanza: cualquier valor ausente, corrupto o con una forma
// inesperada se trata igual -- null, que equivale a "sin atribución
// todavía" (mismo criterio que parseConsentCookieValue en
// lib/consent/preferences.ts). Esto también es lo que efectivamente pasa
// con una cookie vencida: el navegador ya no la manda, así que `raw` llega
// undefined acá igual que si nunca hubiera existido.
export function parseAttributionCookieValue(
  raw: string | undefined | null,
): AttributionState | null {
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== CURRENT_VERSION) return null;

  const firstTouch = normalizeTouch(candidate.firstTouch);
  const lastTouch = normalizeTouch(candidate.lastTouch);
  if (firstTouch === undefined || lastTouch === undefined) return null;

  return { version: CURRENT_VERSION, firstTouch, lastTouch };
}

// undefined = forma inválida (el llamador debe descartar todo el estado);
// null = "no hay touch" (válido, ej. cookie recién creada con solo
// lastTouch). No valida el CONTENIDO de cada campo de texto (ya se
// sanitizó una vez al capturarlo, y confiar ciegamente en lo leído de
// vuelta de la propia cookie que este mismo código escribió es razonable) --
// solo que la forma general sea la esperada.
function normalizeTouch(value: unknown): AttributionTouch | null | undefined {
  if (value === null) return null;
  if (typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.capturedAt !== "string") return undefined;
  const stringOrNull = (key: string): string | null => {
    const v = candidate[key];
    return typeof v === "string" ? v : null;
  };
  return {
    source: stringOrNull("source"),
    medium: stringOrNull("medium"),
    campaign: stringOrNull("campaign"),
    content: stringOrNull("content"),
    term: stringOrNull("term"),
    fbclid: stringOrNull("fbclid"),
    gclid: stringOrNull("gclid"),
    landingPath: stringOrNull("landingPath"),
    referrerDomain: stringOrNull("referrerDomain"),
    capturedAt: candidate.capturedAt,
  };
}

export function serializeAttributionState(state: AttributionState): string {
  return JSON.stringify(state);
}

// Puerta de consentimiento (Fase 0): la atribución de marketing SOLO se
// persiste con consentimiento de marketing explícito -- ni con
// analíticas=true solamente, ni con consentimiento todavía sin decidir
// (null). Nunca se confunde con una cookie "esencial".
export function shouldPersistAttribution(
  consent: { marketing: boolean } | null,
): boolean {
  return consent?.marketing === true;
}

// Puerta de tráfico interno (Fase 0): un Payment solo congela un snapshot
// de atribución comercial cuando NO está excluido de marketing. Mismo
// marketingExclusionReason que ya resuelve cada punto de creación de
// Payment -- no una lógica aparte.
export function shouldFreezeAttributionForPayment(
  marketingExclusionReason: string | null,
): boolean {
  return marketingExclusionReason === null;
}

// Si la clienta retira el consentimiento de marketing, la cookie de
// atribución futura debe borrarse/inutilizarse -- pero esto NUNCA toca
// Payments/Orders ya creados (esos snapshots ya están congelados y son
// historia financiera-adyacente, no se reescriben).
export function shouldClearAttributionOnConsentChange(prefs: {
  marketing: boolean;
}): boolean {
  return !prefs.marketing;
}
