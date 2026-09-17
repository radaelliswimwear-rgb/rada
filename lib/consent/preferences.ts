// Lógica pura, sin cookies() ni Prisma -- separada de consent-actions.ts a
// propósito, para poder probarla sin un request real (mismo patrón que
// computeInternalTrafficStatus en lib/internal-traffic/status.ts y
// computeCartDisplayStatus en components/cart-drawer/cart-store.tsx).
//
// Fase 0 de analytics: esto SOLO guarda la preferencia de la clienta sobre
// cookies de análisis/marketing. Hoy no existe ningún tracker instalado en
// el sitio (sin GA4, sin GTM, sin Meta Pixel, sin Meta CAPI) -- esta pieza
// no activa nada, únicamente deja la plomería lista para que una fase
// futura decida si prende un tracker según lo que haya acá guardado.
export type ConsentPreferences = {
  version: 1;
  analytics: boolean;
  marketing: boolean;
  timestamp: string; // ISO
};

// Vive acá y no en consent-actions.ts porque todo export de nivel superior
// de un archivo "use server" tiene que ser una función async -- una
// constante ahí rompe el build de Next.js (mismo motivo que
// DEFAULT_FREE_SHIPPING_THRESHOLD vive en lib/checkout/pricing.ts y no en
// lib/checkout/free-shipping-actions.ts).
export const CONSENT_COOKIE_NAME = "radaelli_consent";

export const DEFAULT_CONSENT_VERSION = 1;

// Presets de los dos botones principales del banner -- sin timestamp, eso lo
// agrega buildConsentCookieValue al momento real de guardar.
export const ACCEPT_ALL_CONSENT = { analytics: true, marketing: true };
export const REJECT_NON_ESSENTIAL_CONSENT = { analytics: false, marketing: false };

// Nunca lanza: cualquier valor ausente, corrupto o con una forma inesperada
// se trata igual -- null, que significa "todavía no hay decisión" (el
// banner debe mostrarse). No distingue "sin cookie" de "cookie manipulada"
// por el mismo motivo que getCurrentUser en lib/auth/session.ts no
// distingue motivos de "no autenticado".
export function parseConsentCookieValue(
  raw: string | undefined | null,
): ConsentPreferences | null {
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;

  if (candidate.version !== 1) return null;
  if (typeof candidate.analytics !== "boolean") return null;
  if (typeof candidate.marketing !== "boolean") return null;
  if (typeof candidate.timestamp !== "string" || candidate.timestamp.length === 0) {
    return null;
  }

  return {
    version: 1,
    analytics: candidate.analytics,
    marketing: candidate.marketing,
    timestamp: candidate.timestamp,
  };
}

// Llamada desde código de servidor (una "use server" action) -- new Date()
// real está bien acá, esto no es un script de Workflow.
export function buildConsentCookieValue(prefs: {
  analytics: boolean;
  marketing: boolean;
}): string {
  return JSON.stringify({
    version: DEFAULT_CONSENT_VERSION,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    timestamp: new Date().toISOString(),
  });
}
