import type { AttributionTouch } from "./types";

// Los valores llegan de la URL o de document.referrer -- input no
// confiable. Límite generoso para un UTM real (nunca deberían superar
// unas pocas decenas de caracteres) pero corto para un intento de abuso;
// `<`/`>` se rechaza directo (nunca se va a renderizar como HTML hoy, pero
// tampoco cuesta nada cerrar la puerta de antemano).
const MAX_VALUE_LENGTH = 200;
const MAX_PATH_LENGTH = 300;

export function sanitizeAttributionValue(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.includes("<") || trimmed.includes(">")) return null;
  return trimmed.slice(0, MAX_VALUE_LENGTH);
}

// Wompi redirige el navegador de vuelta a /checkout/wompi/retorno después
// de un pago -- ESE regreso también es un document.referrer "externo"
// (checkout.wompi.co), pero no tiene absolutamente nada que ver con de
// dónde vino la clienta originalmente. Sin esta lista, cada regreso de
// Wompi pisaría lastTouch con "referral: checkout.wompi.co", corrompiendo
// la atribución de la PRÓXIMA compra (la actual ya se congeló en Payment
// antes de salir hacia Wompi, así que a esa no la afecta -- pero sí a
// cualquier atribución futura leída de la misma cookie).
const NON_MARKETING_REFERRER_SUFFIXES = ["wompi.co"];

function isNonMarketingReferrer(hostname: string): boolean {
  return NON_MARKETING_REFERRER_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

// null si no hay referrer, si es inválido, si es del propio sitio
// (navegación interna nunca es un "referral"), o si es un dominio conocido
// que no es de marketing (ver arriba). Devuelve solo el hostname, nunca la
// URL completa -- no hace falta más para atribución, y evita guardar de más
// (un path de referrer externo podría tener sus propios parámetros).
export function extractReferrerDomain(
  referrer: string | null | undefined,
  siteHost: string,
): string | null {
  if (!referrer) return null;
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return null;
  }
  const hostname = url.hostname.toLowerCase();
  if (!hostname || hostname === siteHost.toLowerCase()) return null;
  if (isNonMarketingReferrer(hostname)) return null;
  return sanitizeAttributionValue(hostname);
}

// Solo el path -- nunca protocolo/host, nunca el query string (los UTMs ya
// se capturan aparte; repetirlos acá sería redundante, y cualquier otro
// parámetro de la URL que no sea de atribución no tiene por qué guardarse).
export function sanitizeLandingPath(path: string): string | null {
  if (!path) return null;
  const pathOnly = path.split("?")[0]!.split("#")[0]!;
  if (!pathOnly.startsWith("/")) return null;
  return pathOnly.slice(0, MAX_PATH_LENGTH);
}

export type BuildAttributionTouchInput = {
  search: URLSearchParams;
  referrer: string | null;
  path: string;
  siteHost: string;
  now: Date;
};

// El único punto que decide "¿esto es un touch de marketing válido?".
// Válido = hay al menos un UTM/click id, O (a falta de eso) un referrer
// externo identificable que no sea de la lista de arriba. Ninguno de los
// dos -> null, y el llamador NUNCA debe tocar la cookie en ese caso (así es
// como una visita directa o una navegación interna no pisan lastTouch ni
// crean firstTouch).
export function buildAttributionTouch(
  input: BuildAttributionTouchInput,
): AttributionTouch | null {
  const source = sanitizeAttributionValue(input.search.get("utm_source"));
  const medium = sanitizeAttributionValue(input.search.get("utm_medium"));
  const campaign = sanitizeAttributionValue(input.search.get("utm_campaign"));
  const content = sanitizeAttributionValue(input.search.get("utm_content"));
  const term = sanitizeAttributionValue(input.search.get("utm_term"));
  const fbclid = sanitizeAttributionValue(input.search.get("fbclid"));
  const gclid = sanitizeAttributionValue(input.search.get("gclid"));

  const hasUtmOrClickId = Boolean(
    source || medium || campaign || content || term || fbclid || gclid,
  );

  const referrerDomain = hasUtmOrClickId
    ? null // si ya hay UTM/click id, el referral no aporta nada -- no hace falta
    : extractReferrerDomain(input.referrer, input.siteHost);

  if (!hasUtmOrClickId && !referrerDomain) {
    return null; // visita directa o navegación interna: no es un touch
  }

  return {
    source: source ?? (referrerDomain ? referrerDomain : null),
    medium: medium ?? (referrerDomain ? "referral" : null),
    campaign,
    content,
    term,
    fbclid,
    gclid,
    landingPath: sanitizeLandingPath(input.path),
    referrerDomain,
    capturedAt: input.now.toISOString(),
  };
}
