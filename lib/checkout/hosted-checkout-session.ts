import {
  parsePendingOrderInput,
  type PendingOrderInput,
} from "./pending-order";

// Estado EFÍMERO de UI para el Checkout Web alojado de Wompi
// (propuesta/checkout-wompi-alojado). Vive en sessionStorage, nunca en la
// base de datos y nunca en localStorage:
//   * sessionStorage sobrevive a un refresh y a la redirección completa a
//     checkout.wompi.co y de vuelta, que es exactamente lo que hace falta;
//   * se borra solo al cerrar la pestaña, así no queda un carrito viejo
//     "pegado" en el navegador de una computadora compartida.
//
// La fuente de verdad NO es esto: los mismos datos se guardan server-side en
// Payment.pendingOrderInput al crear el intent (ver
// startWompiHostedCheckoutAction), porque el navegador puede no volver
// nunca. Esta copia solo evita un round-trip extra en el camino feliz.
//
// Nunca guarda datos de tarjeta: con el checkout alojado no existen en esta
// aplicación, ni en el servidor ni en el navegador.
const ATTEMPT_ID_KEY = "radaelli.checkout.wompi.attempt-id";
const HANDOFF_KEY = "radaelli.checkout.wompi.handoff";

export type HostedCheckoutHandoff = {
  checkoutAttemptId: string;
  reference: string;
  pendingOrder: PendingOrderInput;
};

// Cualquier acceso a sessionStorage puede tirar excepción (modo privado,
// cookies de terceros bloqueadas, iframes): nada de esto puede romper el
// checkout, así que todo va envuelto.
function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

// El id del intento se genera UNA vez por pestaña/carrito y se reusa mientras
// dure el checkout: es lo que hace que un doble clic o un refresh reusen el
// mismo Payment en vez de reservar stock dos veces (ver
// Payment.checkoutAttemptId en prisma/schema.prisma).
export function readOrCreateCheckoutAttemptId(): string {
  const store = storage();
  const existing = store?.getItem(ATTEMPT_ID_KEY);
  if (existing && /^[0-9a-fA-F-]{36}$/.test(existing)) return existing;
  const created = crypto.randomUUID();
  try {
    store?.setItem(ATTEMPT_ID_KEY, created);
  } catch {
    // Sin sessionStorage el id igual sirve para esta llamada: se pierde la
    // protección entre recargas, no la del request en curso.
  }
  return created;
}

// Se llama cuando el servidor dice que ese intento ya no está vigente
// (restart: true): la próxima vez se genera uno nuevo.
export function resetCheckoutAttemptId(): void {
  try {
    storage()?.removeItem(ATTEMPT_ID_KEY);
  } catch {
    /* no-op */
  }
}

export function saveHostedCheckoutHandoff(handoff: HostedCheckoutHandoff): void {
  try {
    storage()?.setItem(HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    /* no-op: el servidor tiene su propia copia en Payment.pendingOrderInput */
  }
}

export function readHostedCheckoutHandoff(): HostedCheckoutHandoff | null {
  try {
    const raw = storage()?.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Record<string, unknown>;
    const pendingOrder = parsePendingOrderInput(candidate.pendingOrder);
    if (
      !pendingOrder ||
      typeof candidate.checkoutAttemptId !== "string" ||
      typeof candidate.reference !== "string"
    ) {
      return null;
    }
    return {
      checkoutAttemptId: candidate.checkoutAttemptId,
      reference: candidate.reference,
      pendingOrder,
    };
  } catch {
    return null;
  }
}

export function clearHostedCheckoutSession(): void {
  try {
    const store = storage();
    store?.removeItem(HANDOFF_KEY);
    store?.removeItem(ATTEMPT_ID_KEY);
  } catch {
    /* no-op */
  }
}
