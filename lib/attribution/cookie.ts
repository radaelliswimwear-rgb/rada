import { cookies } from "next/headers";
import {
  ATTRIBUTION_TTL_DAYS,
  parseAttributionCookieValue,
  serializeAttributionState,
} from "./state";
import type { AttributionState } from "./types";

// First-party, sin PII (ver lib/attribution/types.ts). httpOnly: nada acá
// necesita lectura directa desde JS de cliente -- toda la lógica (capturar,
// leer, decidir first/last touch) pasa por Server Actions, igual que
// radaelli_internal (Fase 0). No confundir con radaelli_consent, que sí
// necesita ser legible por cliente para gatear scripts de terceros más
// adelante.
export const ATTRIBUTION_COOKIE_NAME = "radaelli_attribution";
const ATTRIBUTION_TTL_SECONDS = 60 * 60 * 24 * ATTRIBUTION_TTL_DAYS;

export async function readAttributionCookie(): Promise<AttributionState | null> {
  const store = await cookies();
  return parseAttributionCookieValue(
    store.get(ATTRIBUTION_COOKIE_NAME)?.value,
  );
}

export async function writeAttributionCookie(
  state: AttributionState,
): Promise<void> {
  const store = await cookies();
  store.set(ATTRIBUTION_COOKIE_NAME, serializeAttributionState(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ATTRIBUTION_TTL_SECONDS,
  });
}

// Usado cuando se retira el consentimiento de marketing (ver
// lib/consent/consent-actions.ts) y, potencialmente, desde un futuro botón
// explícito de la clienta. Nunca toca Payments/Orders ya creados -- esos
// snapshots ya están congelados aparte.
export async function clearAttributionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ATTRIBUTION_COOKIE_NAME);
}
