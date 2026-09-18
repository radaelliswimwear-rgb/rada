"use server";

import { prisma } from "lib/prisma";
import type { Payment as PaymentRow } from "@prisma/client";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
import { BASE_CURRENCY } from "lib/currency/types";
import { checkRateLimit, RateLimitError } from "lib/auth/rate-limit";
import { getClientIp } from "lib/request/client-ip";
import { getCurrentUser } from "lib/auth/session";
import {
  marketingExclusionReasonFor,
  resolveInternalTraffic,
} from "lib/internal-traffic/resolve";
import { resolvePaymentAttributionSnapshot } from "lib/attribution/resolve";
import {
  resolveMarketingConsentSnapshot,
  resolveAnalyticsConsentSnapshot,
  resolveUserAgentSnapshot,
} from "lib/analytics/resolve";
import { recordPaymentFailedEvent } from "lib/analytics/payment-failed";
import {
  CheckoutValidationError,
  releaseReservedStock,
  reserveAndPriceCheckout,
  type ServerOrderItemInput,
} from "lib/checkout/server-order-totals";
import { parsePendingOrderInput } from "lib/checkout/pending-order";
import { finalizeApprovedPayment } from "lib/orders/order-recovery";
import { getAppBaseUrl } from "lib/utils";
import { ACTIVE_PAYMENT_PROVIDER } from "./config";
import { assertRealPaymentConfigOrThrow } from "./guard-real-payments";
import { paymentGateway } from "./payment-gateway";
import { WOMPI_TRANSACTION_STATUS_TO_DB } from "./wompi-status-mapping";
import {
  buildWompiHostedCheckoutUrl,
  fetchWompiAcceptanceInfo,
  toWompiAmountInCents,
  verifyWompiTransaction,
  wompiGateway,
  type WompiAcceptanceInfo,
  type WompiTransaction,
} from "./providers/wompi-gateway";
import type {
  CardInput,
  PaymentIntent,
  PaymentProvider,
  PaymentStatus,
  WompiAcceptanceTokens,
} from "./types";

// Server Actions Prisma/Postgres. payments-repository.ts conserva los
// mismos nombres que antes (Sprint 11, localStorage) — la UI no cambia. El
// gateway simulado (paymentGateway) sigue siendo puro/sin red real; solo la
// persistencia de cada intento pasa a Postgres.
const PROVIDER_TO_DB: Record<PaymentProvider, PaymentRow["provider"]> = {
  stripe: "STRIPE",
  wompi: "WOMPI",
  whatsapp: "WHATSAPP",
};
const PROVIDER_FROM_DB: Record<PaymentRow["provider"], PaymentProvider> = {
  STRIPE: "stripe",
  WOMPI: "wompi",
  WHATSAPP: "whatsapp",
};
const STATUS_TO_DB: Record<PaymentStatus, PaymentRow["status"]> = {
  pending: "PENDING",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
};
const STATUS_FROM_DB: Record<PaymentRow["status"], PaymentStatus> = {
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

function toIntent(row: PaymentRow): PaymentIntent {
  return {
    id: row.providerRef,
    provider: PROVIDER_FROM_DB[row.provider],
    amount: fromSubunits(row.amount),
    currency: row.currency,
    status: STATUS_FROM_DB[row.status],
    orderId: row.orderId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    failureReason: row.failureReason ?? undefined,
  };
}

async function createPaymentIntentRow(
  amount: number,
  currency: string,
  reservedItems: ServerOrderItemInput[] | null,
  couponCode: string | null,
  marketingExclusionReason: string | null,
): Promise<PaymentIntent> {
  const attributionSnapshot =
    await resolvePaymentAttributionSnapshot(marketingExclusionReason);
  const marketingConsentSnapshot = await resolveMarketingConsentSnapshot();
  const analyticsConsentSnapshot = await resolveAnalyticsConsentSnapshot();
  const userAgentSnapshot = await resolveUserAgentSnapshot();
  const intent = await paymentGateway.createIntent(amount, currency);
  await prisma.payment.create({
    data: {
      provider: PROVIDER_TO_DB[intent.provider],
      providerRef: intent.id,
      amount: toSubunits(amount),
      currency,
      status: "PENDING",
      reservedItems: reservedItems ?? undefined,
      couponCode,
      marketingExclusionReason,
      attributionSnapshot,
      marketingConsentSnapshot,
      analyticsConsentSnapshot,
      userAgentSnapshot,
    },
  });
  return intent;
}

export type VerifiedCheckoutResult =
  | {
      success: true;
      intent: PaymentIntent;
      subtotal: number;
      discount: number;
      total: number;
      couponCode: string | null;
    }
  | { success: false; error: string };

// Único punto de entrada del checkout real (Wompi): el cliente manda SOLO
// productId/size/quantity + el código de cupón que aplicó — nunca un monto.
// reserveAndPriceCheckout (lib/checkout/server-order-totals.ts) recalcula el
// precio real de cada línea, revalida el cupón contra la base de datos y
// reserva el stock atómicamente ANTES de que se cree el intent. El `total`
// que devuelve acá es el mismo que se usa como amount_in_cents al cobrar la
// tarjeta en Wompi (ver wompi-gateway.ts) — nunca el que calculó el
// navegador. Auditoría de seguridad, Sprint 29.
//
// Devuelve {success:false, error} (en vez de lanzar la excepción tal cual)
// para los fallos esperables (carrito vacío, sin stock, demasiados
// intentos) — Next.js redacta el mensaje real de una Server Action que
// tira una excepción sin capturar en producción, así que esto asegura que
// la clienta vea un motivo real y no un genérico "ocurrió un error".
export async function createVerifiedPaymentIntentAction(
  items: ServerOrderItemInput[],
  couponCode: string | null | undefined,
): Promise<VerifiedCheckoutResult> {
  // Primero que cualquier otra cosa, y sin capturar el error: una
  // configuración de pagos inválida tiene que ser ruidosa (visible en los
  // logs/monitoreo de Vercel), no un {success:false} silencioso más entre
  // los demás.
  assertRealPaymentConfigOrThrow();

  try {
    await checkRateLimit(await getClientIp(), "checkout");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  let priced: Awaited<ReturnType<typeof reserveAndPriceCheckout>>;
  try {
    priced = await reserveAndPriceCheckout(items, couponCode);
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
  const {
    subtotal,
    discount,
    total,
    couponCode: validatedCoupon,
    reservedItems,
  } = priced;

  const marketingExclusionReason = marketingExclusionReasonFor(
    await resolveInternalTraffic(),
  );

  try {
    const intent = await createPaymentIntentRow(
      total,
      BASE_CURRENCY,
      reservedItems,
      validatedCoupon,
      marketingExclusionReason,
    );
    return {
      success: true,
      intent,
      subtotal,
      discount,
      total,
      couponCode: validatedCoupon,
    };
  } catch (error) {
    // Si no se pudo ni crear el registro del pago, nadie va a cobrar nada —
    // hay que devolver el stock que ya se reservó arriba, si no queda
    // bloqueado para siempre sin ningún pago asociado que lo libere después.
    await prisma.payment
      .create({
        data: {
          provider: "WOMPI",
          providerRef: `orphan_${crypto.randomUUID()}`,
          amount: toSubunits(total),
          currency: BASE_CURRENCY,
          status: "CANCELLED",
          reservedItems,
          stockReleased: true,
        },
      })
      .catch(() => undefined);
    for (const item of reservedItems) {
      await prisma.productVariant
        .updateMany({
          where: { productId: item.productId, size: item.size },
          data: { stock: { increment: item.quantity } },
        })
        .catch(() => undefined);
    }
    throw error;
  }
}

// Mismo criterio que createVerifiedPaymentIntentAction, para el checkout por
// WhatsApp: no hay cobro automático (lo coordina la fundadora a mano), pero
// el total mostrado y el stock reservado deben salir igual de una fuente
// server-side, no de lo que mande el navegador.
export async function createVerifiedWhatsappIntentAction(
  items: ServerOrderItemInput[],
  couponCode: string | null | undefined,
): Promise<VerifiedCheckoutResult> {
  try {
    await checkRateLimit(await getClientIp(), "checkout");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  let priced: Awaited<ReturnType<typeof reserveAndPriceCheckout>>;
  try {
    priced = await reserveAndPriceCheckout(items, couponCode);
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
  const {
    subtotal,
    discount,
    total,
    couponCode: validatedCoupon,
    reservedItems,
  } = priced;

  const providerRef = `whatsapp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const marketingExclusionReason = marketingExclusionReasonFor(
    await resolveInternalTraffic(),
  );
  const attributionSnapshot =
    await resolvePaymentAttributionSnapshot(marketingExclusionReason);
  const marketingConsentSnapshot = await resolveMarketingConsentSnapshot();
  const analyticsConsentSnapshot = await resolveAnalyticsConsentSnapshot();
  const userAgentSnapshot = await resolveUserAgentSnapshot();
  const row = await prisma.payment.create({
    data: {
      provider: "WHATSAPP",
      providerRef,
      amount: toSubunits(total),
      currency: BASE_CURRENCY,
      status: "PENDING",
      reservedItems,
      couponCode: validatedCoupon,
      marketingExclusionReason,
      attributionSnapshot,
      marketingConsentSnapshot,
      analyticsConsentSnapshot,
      userAgentSnapshot,
    },
  });
  return {
    success: true,
    intent: toIntent(row),
    subtotal,
    discount,
    total,
    couponCode: validatedCoupon,
  };
}

// Solo tiene sentido con Wompi activo — las demás pasarelas devuelven null
// y el checkout no muestra ningún checkbox de aceptación de contratos.
export async function getWompiAcceptanceInfoAction(): Promise<WompiAcceptanceInfo | null> {
  if (ACTIVE_PAYMENT_PROVIDER !== "wompi") return null;
  try {
    return await fetchWompiAcceptanceInfo();
  } catch (error) {
    console.error("getWompiAcceptanceInfoAction: no se pudo obtener", error);
    return null;
  }
}

export async function confirmPaymentAction(
  intent: PaymentIntent,
  card: CardInput,
  customerEmail?: string,
  wompiAcceptance?: WompiAcceptanceTokens,
): Promise<PaymentIntent> {
  assertRealPaymentConfigOrThrow();

  const result = await paymentGateway.confirmPayment(
    intent,
    card,
    customerEmail,
    wompiAcceptance,
  );
  const last4 = card.cardNumber.replace(/\s/g, "").slice(-4);
  await prisma.payment.updateMany({
    where: { providerRef: result.id },
    data: {
      status: STATUS_TO_DB[result.status],
      failureReason: result.failureReason ?? null,
      cardLast4: last4,
    },
  });

  // El stock se reservó (descontó) al crear el intent, ANTES de cobrar la
  // tarjeta (ver createVerifiedPaymentIntentAction) — si el cobro no
  // terminó en éxito, hay que devolverlo ya mismo, no dejarlo bloqueado
  // esperando un webhook que para un rechazo síncrono puede no llegar
  // nunca (Wompi solo manda webhook para resoluciones asincrónicas).
  if (result.status !== "succeeded") {
    const row = await prisma.payment.findFirst({
      where: { providerRef: result.id },
    });
    if (row) await releaseReservedStock(row.id);
  }

  return result;
}

// ==========================================================================
// Checkout Web ALOJADO de Wompi (propuesta/checkout-wompi-alojado)
// ==========================================================================
// confirmPaymentAction (arriba) recibía el número de tarjeta y el CVV y los
// mandaba a Wompi DESDE ESTE SERVIDOR. Sigue existiendo solo para el
// proveedor simulado de desarrollo (stripe-gateway.ts); con Wompi real, el
// cobro con tarjeta pasa por estas dos acciones y los datos de la tarjeta
// nunca tocan esta aplicación.
//
// El flujo completo:
//   1. startWompiHostedCheckoutAction: reserva stock + precio real (igual
//      que antes), crea el Payment PENDING, y devuelve la URL firmada del
//      Checkout Web. El navegador sale ENTERO hacia checkout.wompi.co.
//   2. La clienta paga en el dominio de Wompi.
//   3. Wompi devuelve el navegador a redirect-url con SOLO "?id=<tx>".
//   4. confirmHostedCheckoutReturnAction: consulta el estado REAL contra la
//      API de Wompi y lo aplica reusando applyWompiWebhookUpdateAction.
//
// Ese "?id=" no prueba absolutamente nada: es un parámetro de URL que
// cualquiera puede escribir a mano. La propia documentación de Wompi dice
// que la redirección es informativa y que la confirmación real son los
// eventos. Por eso el paso 4 nunca mira el query param más que para saber
// QUÉ transacción preguntar.

const HOSTED_CHECKOUT_REDIRECT_PATH = "/checkout/wompi/retorno";

// Debe quedar alineado con STALE_AFTER_MINUTES del cron que libera reservas
// abandonadas (app/api/cron/release-stale-payments/route.ts): si el link de
// Wompi siguiera siendo pagable después de que el cron ya devolvió el stock
// al catálogo, se podría cobrar un pedido cuyas unidades ya se le vendieron
// a otra clienta. `expiration-time` le pide a Wompi que no acepte el pago
// pasado ese punto.
const HOSTED_CHECKOUT_TTL_MINUTES = 30;
// Margen para no entregar un link que expira en 30 segundos cuando se
// reusa un intento ya creado (refresh de la página).
const HOSTED_CHECKOUT_MIN_REMAINING_MINUTES = 5;

export type HostedCheckoutStartResult =
  | {
      success: true;
      checkoutUrl: string;
      reference: string;
      total: number;
      // true = se reusó un intento ya creado para el mismo checkoutAttemptId
      // (doble clic o refresh) en vez de reservar stock otra vez.
      reused: boolean;
    }
  | {
      success: false;
      error: string;
      // true = el intento guardado en sessionStorage ya no sirve; el cliente
      // debe generar un checkoutAttemptId nuevo antes de reintentar.
      restart?: boolean;
    };

function sameRequestedLines(
  a: { productId: string; size: string; quantity: number }[],
  b: { productId: string; size: string; quantity: number }[],
): boolean {
  if (a.length !== b.length) return false;
  const key = (x: { productId: string; size: string; quantity: number }) =>
    `${x.productId}::${x.size}::${x.quantity}`;
  const sortedA = a.map(key).sort();
  const sortedB = b.map(key).sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function hostedCheckoutUrlForPayment(
  row: PaymentRow,
  customerEmail: string,
): string {
  const expiresAt = new Date(
    row.createdAt.getTime() + HOSTED_CHECKOUT_TTL_MINUTES * 60 * 1000,
  );
  return buildWompiHostedCheckoutUrl({
    reference: row.providerRef,
    amountInCents: toWompiAmountInCents(fromSubunits(row.amount)),
    currency: row.currency,
    redirectUrl: `${getAppBaseUrl()}${HOSTED_CHECKOUT_REDIRECT_PATH}`,
    customerEmail,
    expirationTime: expiresAt.toISOString(),
  });
}

// Un intento ya creado solo se puede reusar si sigue siendo EXACTAMENTE el
// mismo cobro: mismo carrito, todavía pendiente, con stock aún reservado y
// con tiempo de sobra antes de que expire el link firmado.
function canReuseHostedCheckoutPayment(
  row: PaymentRow,
  items: ServerOrderItemInput[],
): boolean {
  if (row.provider !== "WOMPI") return false;
  if (row.status !== "PENDING") return false;
  if (row.orderId) return false;
  if (row.stockReleased) return false;

  const ageMinutes = (Date.now() - row.createdAt.getTime()) / 60000;
  if (
    ageMinutes >
    HOSTED_CHECKOUT_TTL_MINUTES - HOSTED_CHECKOUT_MIN_REMAINING_MINUTES
  ) {
    return false;
  }

  const reserved =
    (row.reservedItems as unknown as ServerOrderItemInput[] | null) ?? [];
  return sameRequestedLines(reserved, items);
}

// Inicia (o reusa) el pago con el Checkout Web alojado de Wompi.
//
// NO recibe —ni podría recibir— ningún dato de tarjeta: su firma solo admite
// qué se compra, el cupón, la clave de idempotencia del intento y los datos
// de envío. Ver wompi-hosted-checkout.no-card-data.test.ts.
//
// `checkoutAttemptId` lo genera el navegador una sola vez por carrito
// (crypto.randomUUID) y lo guarda en sessionStorage, así sobrevive un
// refresh de la pestaña. Es la protección contra cobros/reservas duplicadas
// que el rate limit NO da: el rate limit frena una ráfaga, pero dos clics
// legítimos separados por un refresh crearían igual dos reservas de stock y
// dos Payment. Acá la garantía la da el índice único de Postgres sobre
// Payment.checkoutAttemptId, no un findUnique previo — ese findUnique es
// solo el camino rápido; la carrera real (dos clics simultáneos) la resuelve
// el P2002 del INSERT.
export async function startWompiHostedCheckoutAction(
  items: ServerOrderItemInput[],
  couponCode: string | null | undefined,
  checkoutAttemptId: string,
  pendingOrderInput: unknown,
): Promise<HostedCheckoutStartResult> {
  if (ACTIVE_PAYMENT_PROVIDER !== "wompi") {
    return {
      success: false,
      error: "El checkout alojado de Wompi no está activo.",
    };
  }

  // Formato de crypto.randomUUID() y nada más: esto va a una columna única,
  // no tiene sentido aceptar cualquier string arbitrario de largo libre.
  if (
    typeof checkoutAttemptId !== "string" ||
    !/^[0-9a-fA-F-]{36}$/.test(checkoutAttemptId)
  ) {
    return {
      success: false,
      error: "El intento de pago no es válido. Recargá el checkout.",
      restart: true,
    };
  }

  const pendingOrder = parsePendingOrderInput(pendingOrderInput);
  if (!pendingOrder) {
    return {
      success: false,
      error: "Faltan datos de envío para iniciar el pago.",
    };
  }
  // El snapshot del pedido tiene que describir las MISMAS líneas que se van
  // a reservar y cobrar — si no, el pedido que se cree al volver de Wompi no
  // coincidiría con lo cobrado (createOrderAction lo rechazaría después,
  // con la clienta ya cobrada).
  if (
    !sameRequestedLines(
      pendingOrder.items.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      })),
      items,
    )
  ) {
    return {
      success: false,
      error: "Tu carrito cambió mientras iniciabas el pago. Probá de nuevo.",
      restart: true,
    };
  }

  try {
    await checkRateLimit(await getClientIp(), "checkout");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  // Camino rápido: la clienta refrescó la página (o volvió atrás) y ya hay
  // un intento vigente para este mismo checkout.
  const existing = await prisma.payment.findUnique({
    where: { checkoutAttemptId },
  });
  if (existing) {
    if (!canReuseHostedCheckoutPayment(existing, items)) {
      // A propósito NO se cancela ni se libera el stock del intento viejo:
      // un pago PENDING puede estar YA pagado en Wompi y solo faltarle la
      // confirmación (webhook o regreso del navegador). Cancelarlo acá
      // podría anular una compra real. Lo resuelven el webhook o el cron.
      return {
        success: false,
        error: "Ese intento de pago ya no está vigente. Probá de nuevo.",
        restart: true,
      };
    }
    // La dirección/preferencias pueden haberse editado entre el primer clic
    // y el refresh; el monto no cambia (las líneas son las mismas), así que
    // esto no toca nada firmado.
    await prisma.payment.update({
      where: { id: existing.id },
      data: { pendingOrderInput: pendingOrder },
    });
    return {
      success: true,
      checkoutUrl: hostedCheckoutUrlForPayment(
        existing,
        pendingOrder.shippingAddress.email,
      ),
      reference: existing.providerRef,
      total: fromSubunits(existing.amount),
      reused: true,
    };
  }

  let priced: Awaited<ReturnType<typeof reserveAndPriceCheckout>>;
  try {
    priced = await reserveAndPriceCheckout(items, couponCode);
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
  const { total, couponCode: validatedCoupon, reservedItems } = priced;

  // Identidad original de quien paga, capturada ACÁ y solo acá — el único
  // momento en el que este código corre dentro de un request real de su
  // navegador, con su cookie de sesión, verificable de verdad. Se guarda en
  // Payment.originalUserId para que, si hace falta recuperar el pedido más
  // adelante sin que la clienta vuelva (ver lib/orders/order-recovery.ts,
  // usado por el cron de pagos vencidos), el pedido se le asigne a ELLA y
  // no a la cuenta invitada — un cron no tiene ninguna sesión que leer, así
  // que sin este valor guardado de antemano no habría forma honesta de
  // saber a quién pertenece un pedido recuperado. Null es un valor
  // legítimo (compra de invitada), no un error.
  const sessionUser = await getCurrentUser();
  const originalUserId = sessionUser?.id ?? null;
  // Mismo momento y mismo criterio que originalUserId arriba: es la única
  // vez que este código corre dentro de un request real del navegador, con
  // su cookie de tráfico interno disponible -- el webhook/return/cron que
  // confirman el pago después nunca la tienen (ver
  // lib/internal-traffic/resolve.ts).
  const marketingExclusionReason = marketingExclusionReasonFor(
    await resolveInternalTraffic(),
  );
  // Mismo motivo que arriba: la cookie radaelli_attribution (Fase 1) solo
  // existe con consentimiento de marketing real, y solo se lee acá, en el
  // único momento con un request real del navegador.
  const attributionSnapshot =
    await resolvePaymentAttributionSnapshot(marketingExclusionReason);
  const marketingConsentSnapshot = await resolveMarketingConsentSnapshot();
  const analyticsConsentSnapshot = await resolveAnalyticsConsentSnapshot();
  const userAgentSnapshot = await resolveUserAgentSnapshot();

  const intent = await wompiGateway.createIntent(total, BASE_CURRENCY);
  let row: PaymentRow;
  try {
    row = await prisma.payment.create({
      data: {
        provider: "WOMPI",
        providerRef: intent.id,
        amount: toSubunits(total),
        currency: BASE_CURRENCY,
        status: "PENDING",
        reservedItems,
        couponCode: validatedCoupon,
        checkoutAttemptId,
        pendingOrderInput: pendingOrder,
        originalUserId,
        marketingExclusionReason,
        attributionSnapshot,
        marketingConsentSnapshot,
        analyticsConsentSnapshot,
        userAgentSnapshot,
      },
    });
  } catch (error) {
    // Carrera real: dos clics simultáneos con el mismo checkoutAttemptId. El
    // índice único hace fallar el segundo INSERT — se devuelve el stock que
    // este intento perdedor acababa de reservar y se reusa el que ganó, así
    // la clienta ve el mismo link de pago y nunca se descuenta el stock dos
    // veces.
    for (const item of reservedItems) {
      await prisma.productVariant
        .updateMany({
          where: { productId: item.productId, size: item.size },
          data: { stock: { increment: item.quantity } },
        })
        .catch(() => undefined);
    }

    if (isUniqueConstraintError(error)) {
      const winner = await prisma.payment.findUnique({
        where: { checkoutAttemptId },
      });
      if (winner && canReuseHostedCheckoutPayment(winner, items)) {
        return {
          success: true,
          checkoutUrl: hostedCheckoutUrlForPayment(
            winner,
            pendingOrder.shippingAddress.email,
          ),
          reference: winner.providerRef,
          total: fromSubunits(winner.amount),
          reused: true,
        };
      }
      return {
        success: false,
        error: "Ese intento de pago ya no está vigente. Probá de nuevo.",
        restart: true,
      };
    }
    throw error;
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = hostedCheckoutUrlForPayment(
      row,
      pendingOrder.shippingAddress.email,
    );
  } catch (error) {
    // Sin credenciales de Wompi no hay URL firmada posible: se cancela el
    // intento y se devuelve el stock en vez de dejarlo reservado por un pago
    // que nunca va a poder intentarse.
    console.error(
      "startWompiHostedCheckoutAction: no se pudo armar la URL del checkout alojado",
      error,
    );
    await prisma.payment
      .update({
        where: { id: row.id },
        data: {
          status: "CANCELLED",
          failureReason: "No se pudo iniciar el checkout de Wompi.",
        },
      })
      .catch(() => undefined);
    await releaseReservedStock(row.id).catch(() => undefined);
    return {
      success: false,
      error: "No pudimos iniciar el pago con Wompi. Intentá de nuevo.",
      restart: true,
    };
  }

  return {
    success: true,
    checkoutUrl,
    reference: row.providerRef,
    total,
    reused: false,
  };
}

export type HostedCheckoutReturnResult =
  | {
      success: true;
      status: PaymentStatus;
      // reference y orderId vienen en null cuando quien llama no demostró
      // conocer ya la referencia de ese pago (ver expectedReference abajo).
      reference: string | null;
      failureReason: string | null;
      // Id del pedido si este pago YA generó uno (la clienta recargó el
      // retorno, o lo creó otro proceso) — el cliente redirige ahí en vez de
      // crear un segundo pedido.
      orderId: string | null;
    }
  | { success: false; error: string };

// Wompi devuelve el navegador con SOLO "?id=<transaction_id>". Acá ese id se
// usa ÚNICAMENTE para preguntarle a la API de Wompi, con la llave privada,
// cuál es el estado REAL de esa transacción. Ningún camino de este código
// marca un pago como aprobado por lo que diga la URL.
//
// `expectedReference` es la referencia que el navegador ya tenía guardada de
// cuando inició el pago (sessionStorage). No es una credencial —y por eso
// nunca decide el estado del pago—, pero sí decide qué se DEVUELVE: sin
// ella, la respuesta trae el estado y nada más. El motivo: el id de
// transacción de Wompi tiene un formato semi-estructurado que no pude
// confirmar que sea imposible de enumerar; si alguien probara ids al azar,
// devolverle la referencia del pago (y el id del pedido) le daría
// justamente las dos piezas con las que se puede reclamar un pedido ajeno
// (ver createOrderAction, que encuentra el pago por su referencia) o leer
// un pedido de invitada. Verificar y aplicar el estado real sí se hace
// siempre: eso es trabajo del servidor contra la API de Wompi y no filtra
// nada.
export async function confirmHostedCheckoutReturnAction(
  transactionId: string,
  expectedReference?: string | null,
): Promise<HostedCheckoutReturnResult> {
  // La confirmación también necesita su propio freno: hoy confirmPaymentAction
  // (el viejo) no tiene ninguno, y esta acción hace una llamada de red a
  // Wompi por invocación. Bucket propio y no el de "checkout" porque la
  // página de retorno hace polling mientras un pago queda PENDING — con el
  // límite de creación de intents (20/15min) un solo pago lento ya lo
  // agotaría.
  try {
    await checkRateLimit(await getClientIp(), "checkout-return");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  // El id se interpola en la URL de la API de Wompi (GET /transactions/{id}):
  // sin esta validación, un id con "../" apuntaría a otro endpoint.
  if (
    typeof transactionId !== "string" ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(transactionId)
  ) {
    return { success: false, error: "Referencia de pago inválida." };
  }

  let live: WompiTransaction;
  try {
    live = await verifyWompiTransaction(transactionId);
  } catch (error) {
    console.error(
      "confirmHostedCheckoutReturnAction: no se pudo verificar la transacción contra Wompi",
      error,
    );
    return {
      success: false,
      error: "No pudimos confirmar el pago con Wompi. Probá de nuevo.",
    };
  }

  if (
    !live.reference ||
    typeof live.amount_in_cents !== "number" ||
    !live.currency
  ) {
    console.error(
      "confirmHostedCheckoutReturnAction: la transacción de Wompi vino incompleta",
      { id: live.id, status: live.status },
    );
    return {
      success: false,
      error: "No pudimos confirmar el pago con Wompi. Probá de nuevo.",
    };
  }

  // Se reusa tal cual la función ya auditada del webhook: valida monto y
  // moneda contra lo que de verdad se cobró, descarta eventos viejos o
  // repetidos, re-verifica en vivo contra la API de Wompi, libera el stock
  // si el pago falló y cancela el pedido vinculado si corresponde. Duplicar
  // esa lógica acá sería duplicar también sus errores futuros.
  //
  // El timestamp va en SEGUNDOS, no en milisegundos: es el mismo campo que
  // llena Wompi en sus eventos (Payment.lastEventTimestamp, un Int de 32
  // bits). Date.now() en milisegundos desbordaría ese Int y, además,
  // dejaría el contador tan alto que TODO webhook posterior de esa
  // transacción se descartaría por "evento viejo".
  const transaction: WompiWebhookTransaction = {
    id: live.id,
    reference: live.reference,
    status: live.status,
    statusMessage: live.status_message ?? null,
    amountInCents: live.amount_in_cents,
    currency: live.currency,
  };
  await applyWompiWebhookUpdateAction(
    transaction,
    Math.floor(Date.now() / 1000),
  );

  let payment = await prisma.payment.findFirst({
    where: { providerRef: live.reference },
  });
  if (!payment) {
    return { success: false, error: "No encontramos este pago." };
  }

  // Últimos 4 dígitos para la confirmación: llegan desde la transacción ya
  // cobrada en Wompi, nunca de un formulario propio. Es lo único "de la
  // tarjeta" que esta aplicación ve, y solo cuando el medio de pago fue una
  // tarjeta.
  const last4 = readCardLast4(live);
  if (last4 && payment.cardLast4 !== last4) {
    await prisma.payment
      .update({ where: { id: payment.id }, data: { cardLast4: last4 } })
      .catch(() => undefined);
  }

  // Finalización server-side (misma función única que usan el webhook y el
  // cron de pagos vencidos — ver finalizeApprovedPayment,
  // lib/orders/order-recovery.ts): un pago ya APROBADO y verificado arriba
  // contra la API de Wompi no debería quedar sin pedido solo porque esta
  // pestaña perdió el handoff de sessionStorage (otro navegador, storage
  // borrado, la pestaña se cerró) — o porque el webhook ya ganó la carrera
  // y creó el pedido primero, en cuyo caso acá no se intenta nada de
  // nuevo. Ya no hace falta filtrar por status === "SUCCEEDED" acá: eso lo
  // decide finalizeApprovedPayment (devuelve "not-approved" sin efecto
  // para cualquier otro estado), así que el llamado es seguro para
  // cualquier resultado de la verificación de arriba.
  if (!payment.orderId) {
    await finalizeApprovedPayment(payment.id, "return");
    // Releer: si la finalización ganó el reclamo, orderId ya no es null y
    // la respuesta de abajo tiene que reflejarlo. Si por algo la fila ya no
    // aparece (no debería pasar: recién existía), seguimos con la copia
    // que ya teníamos en vez de reventar la confirmación del pago.
    const refreshed = await prisma.payment.findUnique({
      where: { id: payment.id },
    });
    if (refreshed) payment = refreshed;
  }

  // Igualdad simple y no comparación en tiempo constante a propósito: esto
  // no protege un secreto (quien llama ya tiene que conocer la referencia
  // para que le sirva), solo evita entregársela a quien llegó probando ids.
  //
  // Importante: esto decide SOLO qué se le muestra a esta pestaña, nunca si
  // el pedido se recupera server-side (eso ya pasó arriba, sin condición
  // alguna sobre expectedReference). Que el backend haya podido armar el
  // pedido no significa que corresponda revelárselo a quien no demuestra
  // conocer la referencia — evita que alguien probando ids de transacción al
  // azar aprenda que un pedido existe, o lea sus datos.
  const knowsReference =
    typeof expectedReference === "string" &&
    expectedReference.length > 0 &&
    expectedReference === payment.providerRef;

  return {
    success: true,
    status: STATUS_FROM_DB[payment.status],
    reference: knowsReference ? payment.providerRef : null,
    failureReason: payment.failureReason ?? null,
    orderId: knowsReference ? (payment.orderId ?? null) : null,
  };
}

function readCardLast4(live: WompiTransaction): string | null {
  const value = live.payment_method?.extra?.last_four;
  return typeof value === "string" && /^[0-9]{4}$/.test(value) ? value : null;
}

export async function cancelPaymentAction(
  intentId: string,
): Promise<PaymentIntent | null> {
  const row = await prisma.payment.findFirst({
    where: { providerRef: intentId },
  });
  if (!row) return null;
  const updated = await prisma.payment.update({
    where: { id: row.id },
    data: { status: "CANCELLED" },
  });
  await releaseReservedStock(row.id);
  return toIntent(updated);
}

export async function linkPaymentToOrderAction(
  intentId: string,
  orderId: string,
): Promise<void> {
  await prisma.payment.updateMany({
    where: { providerRef: intentId },
    data: { orderId },
  });
}

// Estado que llega en los eventos de Wompi (transaction.status), distinto
// del PaymentStatus interno — mapeo propio para no acoplar el webhook al
// resto del dominio (Sprint 16).
// WOMPI_TRANSACTION_STATUS_TO_DB se movió a ./wompi-status-mapping (ver
// import arriba) — un archivo "use server" solo puede exportar funciones
// async, exportar una constante desde acá es un error de build real de
// Next (no lo detecta tsc).

export type WompiWebhookTransaction = {
  id: string;
  reference: string;
  status: string;
  statusMessage: string | null;
  amountInCents: number;
  currency: string;
};

// Llamada desde app/api/webhooks/wompi/route.ts (Sprint 16, endurecida en el
// Sprint 29), después de verificar la firma del evento. `reference` es la
// misma que generamos en wompiGateway.createIntent() y guardamos como
// Payment.providerRef — Wompi la devuelve tal cual en cada evento, así que
// sirve para encontrar el pago sin depender del id interno de la
// transacción en Wompi.
//
// Auditoría de seguridad: antes, pasar la firma del evento alcanzaba para
// que el webhook aplicara CUALQUIER status/monto que trajera el payload.
// Ahora, además: (1) se rechaza un evento más viejo que el último ya
// aplicado a ese pago (repetido o fuera de orden); (2) se rechaza si el
// monto/moneda del evento no coincide con lo que de verdad se cobró
// server-side al crear el intent; (3) se re-verifica la transacción en vivo
// contra la API de Wompi (con la llave privada, un secreto distinto al de
// eventos) antes de confiar en el status del payload — dos secretos
// comprometidos a la vez, no uno solo, harían falta para falsear un pago.
// Resultado de aplicar un evento (Sprint de hardening HTTP del webhook) —
// distingue "no había nada más que hacer, a propósito" de "no pudimos
// terminar de procesar esto, debería reintentarse". app/api/webhooks/wompi
// es el único llamador al que le importa esta distinción (decide el código
// HTTP con esto); confirmHostedCheckoutReturnAction sigue descartando el
// valor de retorno, igual que antes — un timeout puntual contra Wompi ahí
// ya se resuelve solo con el próximo polling de la página de retorno, no
// necesita convertirse en un error visible para la clienta.
export type ApplyWompiWebhookUpdateOutcome =
  | "applied"
  | "ignored-unknown-status"
  | "ignored-payment-not-found"
  | "ignored-stale-event"
  | "ignored-amount-mismatch"
  | "verification-failed"
  | "ignored-unknown-live-status";

export async function applyWompiWebhookUpdateAction(
  transaction: WompiWebhookTransaction,
  eventTimestamp: number,
): Promise<ApplyWompiWebhookUpdateOutcome> {
  const dbStatus = WOMPI_TRANSACTION_STATUS_TO_DB[transaction.status];
  if (!dbStatus) {
    console.error(
      "applyWompiWebhookUpdateAction: estado de Wompi desconocido",
      transaction.status,
    );
    return "ignored-unknown-status";
  }

  const payment = await prisma.payment.findFirst({
    where: { providerRef: transaction.reference },
  });
  if (!payment) {
    console.error(
      "applyWompiWebhookUpdateAction: no se encontró el pago para la referencia",
      transaction.reference,
    );
    return "ignored-payment-not-found";
  }

  if (
    payment.lastEventTimestamp !== null &&
    eventTimestamp <= payment.lastEventTimestamp
  ) {
    console.error(
      "applyWompiWebhookUpdateAction: evento viejo o repetido, ignorado",
      transaction.reference,
    );
    return "ignored-stale-event";
  }

  const expectedAmountInCents = Math.round(payment.amount * 100);
  if (
    transaction.amountInCents !== expectedAmountInCents ||
    transaction.currency !== payment.currency
  ) {
    console.error(
      "applyWompiWebhookUpdateAction: el monto/moneda del evento no coincide con el pago registrado — evento descartado",
      transaction.reference,
    );
    return "ignored-amount-mismatch";
  }

  let liveStatus: string;
  try {
    const live = await verifyWompiTransaction(transaction.id);
    liveStatus = live.status;
  } catch (error) {
    // A diferencia de los descartes de arriba, ESTE no es una decisión
    // consciente sobre el evento — es que no pudimos completar la
    // verificación obligatoria contra Wompi (timeout, 5xx transitorio de su
    // API). No hay nada que este proceso pueda hacer ya mismo para
    // resolverlo, pero SÍ hay algo que Wompi puede hacer: reintentar la
    // entrega más tarde. Por eso esto ya no se traga en silencio — el
    // llamador (el webhook) lo traduce en un 5xx real.
    console.error(
      "applyWompiWebhookUpdateAction: no se pudo re-verificar la transacción contra la API de Wompi, se pedirá reintento",
      transaction.reference,
      error,
    );
    return "verification-failed";
  }
  const liveDbStatus = WOMPI_TRANSACTION_STATUS_TO_DB[liveStatus];
  if (!liveDbStatus) {
    console.error(
      "applyWompiWebhookUpdateAction: la API de Wompi devolvió un estado desconocido, evento descartado",
      transaction.reference,
      liveStatus,
    );
    return "ignored-unknown-live-status";
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: liveDbStatus,
      failureReason: transaction.statusMessage,
      lastEventTimestamp: eventTimestamp,
      // Guardado acá (y no en otro punto) porque este es el único lugar por
      // el que pasan TODOS los caminos que aprenden el id real de Wompi: el
      // webhook y el regreso del Checkout Web alojado. Sirve para que el
      // cron de pagos vencidos (app/api/cron/release-stale-payments) pueda
      // volver a consultar GET /transactions/{id} más adelante si este pago
      // se queda PENDING — no hay otra forma confirmada de encontrar una
      // transacción de Wompi a partir de nuestra propia referencia.
      wompiTransactionId: transaction.id,
    },
  });

  if (liveDbStatus === "FAILED" || liveDbStatus === "CANCELLED") {
    await releaseReservedStock(payment.id);
    // Fase 2A de analytics (sección 16) -- fail-open, nunca puede tumbar la
    // actualización real del pago (ver lib/analytics/payment-failed.ts).
    await recordPaymentFailedEvent({
      amount: payment.amount,
      currency: payment.currency,
      failureReason: transaction.statusMessage,
      marketingExclusionReason: payment.marketingExclusionReason,
      attributionSnapshot: payment.attributionSnapshot,
      analyticsConsentSnapshot: payment.analyticsConsentSnapshot,
    });
  }

  // Actualización automática del estado del pedido: si un pago que ya
  // estaba vinculado a un pedido termina fallando o anulándose (resolución
  // asincrónica posterior a la creación del pedido), el pedido se cancela
  // solo. Nunca se hace en sentido contrario — un pago aprobado no adelanta
  // el estado de envío, que sigue siendo responsabilidad del panel
  // (lib/admin/orders-actions.ts).
  if (
    payment.orderId &&
    (liveDbStatus === "FAILED" || liveDbStatus === "CANCELLED")
  ) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CANCELADO" },
    });
  }

  // Finalización server-side (Sprint de finalización unificada): antes el
  // webhook solo actualizaba Payment y dejaba la creación del pedido
  // enteramente en manos del regreso de la clienta o del cron de pagos
  // vencidos — si la clienta pagaba y nunca volvía al sitio, el pedido
  // dependía de que el cron corriera (hasta 30 minutos después, ver
  // STALE_AFTER_MINUTES en release-stale-payments). Ahora el webhook
  // también finaliza de inmediato, con la MISMA función que usan el
  // regreso y el cron (finalizeApprovedPayment) — nunca duplica el reclamo
  // atómico ni la recuperación, solo la dispara una vía más. Se llama con
  // el `payment.id` ya conocido (no con transaction.reference) para
  // reusar exactamente el mismo primitivo que los otros dos caminos.
  if (liveDbStatus === "SUCCEEDED") {
    await finalizeApprovedPayment(payment.id, "webhook");
  }

  return "applied";
}

// Usado por app/api/cron/release-stale-payments: vuelve a preguntarle a
// Wompi el estado REAL de una transacción puntual y lo aplica reusando
// applyWompiWebhookUpdateAction — mismo patrón que
// confirmHostedCheckoutReturnAction (arriba), como función aparte en vez de
// reusar esa (que valida cosas propias de un request de navegador —
// rate limit por IP, `expectedReference` para no filtrar datos a quien
// prueba ids al azar) que no aplican acá: el cron no tiene IP de clienta ni
// necesita ocultarle nada a sí mismo, ya está protegido por CRON_SECRET y
// corre una vez por invocación programada, no por request público.
export async function verifyAndApplyPendingWompiPaymentAction(
  transactionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let live: WompiTransaction;
  try {
    live = await verifyWompiTransaction(transactionId);
  } catch (error) {
    console.error(
      "verifyAndApplyPendingWompiPaymentAction: no se pudo verificar contra Wompi",
      transactionId,
      error,
    );
    return { ok: false, error: "No se pudo verificar contra Wompi." };
  }

  if (
    !live.reference ||
    typeof live.amount_in_cents !== "number" ||
    !live.currency
  ) {
    console.error(
      "verifyAndApplyPendingWompiPaymentAction: la transacción de Wompi vino incompleta",
      { id: live.id, status: live.status },
    );
    return { ok: false, error: "Respuesta incompleta de Wompi." };
  }

  const transaction: WompiWebhookTransaction = {
    id: live.id,
    reference: live.reference,
    status: live.status,
    statusMessage: live.status_message ?? null,
    amountInCents: live.amount_in_cents,
    currency: live.currency,
  };
  await applyWompiWebhookUpdateAction(
    transaction,
    Math.floor(Date.now() / 1000),
  );

  const last4 = readCardLast4(live);
  if (last4) {
    await prisma.payment
      .updateMany({
        where: { providerRef: live.reference, cardLast4: null },
        data: { cardLast4: last4 },
      })
      .catch(() => undefined);
  }

  return { ok: true };
}
