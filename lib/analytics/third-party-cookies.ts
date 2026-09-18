import { cookies, headers } from "next/headers";

// Fase 2B (cierre de gap de la auditoría de pre-activación): revocar
// consentimiento limpiaba radaelli_consent/radaelli_attribution (propias)
// pero nunca las cookies que gtag.js (GA4) y fbevents.js (Meta Pixel) dejan
// en el navegador cuando el runtime está activo. Nombres oficiales,
// ninguno inventado: _ga es el client id de GA4; _ga_<container-id> es la
// cookie de sesión de GA4, cuyo sufijo varía por Measurement ID (por eso se
// detecta por prefijo, nunca por nombre exacto); _fbp/_fbc son las cookies
// de Meta Pixel (browser id / click id).
const GA4_CLIENT_ID_COOKIE = "_ga";
const GA4_SESSION_COOKIE_PREFIX = "_ga_";
const META_BROWSER_ID_COOKIE = "_fbp";
const META_CLICK_ID_COOKIE = "_fbc";

// Pura: dado el listado de cookies REALMENTE presentes en el request,
// decide cuáles limpiar para GA4. Siempre incluye "_ga" (borrar una cookie
// ausente es un no-op seguro, mismo criterio que clearAttributionCookie en
// lib/attribution/cookie.ts) más cualquier "_ga_*" que exista de verdad --
// separada de la parte que llama cookies() para poder probarla sin
// next/headers.
export function selectGa4CookieNamesToClear(
  presentCookieNames: string[],
): string[] {
  const dynamicSessionCookies = presentCookieNames.filter((name) =>
    name.startsWith(GA4_SESSION_COOKIE_PREFIX),
  );
  return [GA4_CLIENT_ID_COOKIE, ...dynamicSessionCookies];
}

// _fbp/_fbc son nombres fijos (a diferencia de _ga_<id>) -- no hace falta
// mirar qué existe realmente.
export function selectMetaCookieNamesToClear(): string[] {
  return [META_BROWSER_ID_COOKIE, META_CLICK_ID_COOKIE];
}

function hostWithoutPort(host: string | null | undefined): string | null {
  if (!host) return null;
  const bare = host.split(":")[0];
  return bare && bare.length > 0 ? bare : null;
}

// LIMITACIÓN REAL, documentada a propósito (nunca se finge una eliminación
// garantizada, tal como se pidió): una cookie de terceros puede haberse
// guardado host-only (sin atributo Domain) o con Domain explícito -- son
// dos entradas DISTINTAS en el cookie jar del navegador aunque el nombre
// sea el mismo (RFC 6265 §5.3), y next/headers no puede "adivinar" cuál
// usó gtag.js/fbevents.js. Por eso se intenta borrar en las dos formas
// plausibles para un sitio de un solo dominio sin subdominios (el caso real
// de radaelliswimwear.com hoy): host-only (igual que el resto de cookies
// propias de este sitio) y calificada con el hostname exacto del request.
// Esto NUNCA se verificó contra el script real de GA4/Meta corriendo en
// este dominio porque el runtime de Analytics nunca se activó -- la
// verificación empírica queda para el smoke test del RUNBOOK ACTIVAR
// (inspeccionar Application > Cookies tras revocar, con el runtime ya
// encendido).
async function deleteCookieBothForms(
  store: Awaited<ReturnType<typeof cookies>>,
  name: string,
  domain: string | null,
): Promise<void> {
  store.delete(name);
  if (domain) {
    store.delete({ name, domain, path: "/" });
  }
}

async function resolveRequestHostname(): Promise<string | null> {
  try {
    const headersList = await headers();
    return hostWithoutPort(headersList.get("host"));
  } catch (error) {
    console.error(
      "resolveRequestHostname: no se pudo leer el host del request, se borra solo en forma host-only",
      error,
    );
    return null;
  }
}

// Llamadas desde setConsentPreferencesAction (lib/consent/consent-actions.ts)
// cuando la categoría correspondiente pasa a false. "ANALYTICS MUST FAIL
// OPEN FOR COMMERCE": un error acá nunca debe impedir guardar la preferencia
// de consentimiento en sí (ver el try/catch en el llamador).
export async function clearGa4Cookies(): Promise<void> {
  const store = await cookies();
  const present = store.getAll().map((c) => c.name);
  const names = selectGa4CookieNamesToClear(present);
  const domain = await resolveRequestHostname();
  for (const name of names) {
    await deleteCookieBothForms(store, name, domain);
  }
}

export async function clearMetaCookies(): Promise<void> {
  const store = await cookies();
  const domain = await resolveRequestHostname();
  for (const name of selectMetaCookieNamesToClear()) {
    await deleteCookieBothForms(store, name, domain);
  }
}
