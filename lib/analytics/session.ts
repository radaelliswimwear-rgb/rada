import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

// Identificador analítico first-party (Fase 2A, sección 23 del proceso) --
// NO es la sesión de auth (lib/auth/session.ts), ni el guest id del
// carrito, ni la cookie de atribución (lib/attribution/cookie.ts). Sirve
// solo para agrupar eventos de comportamiento de una misma visita en
// AnalyticsEvent.analyticsSessionId. No es secreto (no autoriza nada, no
// hashea, no se compara contra una tabla) -- es un id opaco aleatorio, el
// mismo criterio que el client id propio de GA4.
export const ANALYTICS_SESSION_COOKIE_NAME = "radaelli_analytics_session";

// "Sesión" en el sentido analítico estándar: 30 minutos de inactividad la
// cierra (mismo criterio de timeout que usa GA4 por defecto) -- cada evento
// nuevo extiende el TTL desde ese momento (sliding window), no desde la
// creación original.
const ANALYTICS_SESSION_TTL_SECONDS = 60 * 30;

function isValidSessionId(value: string | undefined): value is string {
  return Boolean(value) && value!.length > 0 && value!.length <= 100;
}

// Nunca crea una cookie nueva si no corresponde -- "No crear analytics
// identity antes del consentimiento" (sección 23). Devuelve null en ese
// caso, y el llamador (store.ts) simplemente no la usa.
export async function resolveAnalyticsSession(input: {
  allowed: boolean; // ya resuelto por isFirstPartyAnalyticsAllowed (consent + internal traffic)
}): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(ANALYTICS_SESSION_COOKIE_NAME)?.value;

  if (!input.allowed) {
    // Si había una sesión de una visita anterior con consentimiento vigente
    // y ahora ya no corresponde (ej. tráfico interno recién marcado), no se
    // borra activamente acá -- resolveInternalTraffic/consent ya bloquean
    // su USO; dejarla expirar por TTL es más simple y suficiente.
    return null;
  }

  if (isValidSessionId(existing)) {
    // Sliding TTL: cualquier evento nuevo extiende la sesión 30 minutos más.
    store.set(ANALYTICS_SESSION_COOKIE_NAME, existing, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ANALYTICS_SESSION_TTL_SECONDS,
    });
    return existing;
  }

  const created = randomUUID();
  store.set(ANALYTICS_SESSION_COOKIE_NAME, created, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ANALYTICS_SESSION_TTL_SECONDS,
  });
  return created;
}
