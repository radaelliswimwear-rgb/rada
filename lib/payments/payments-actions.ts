"use server";

import { prisma } from "lib/prisma";
import type { Payment as PaymentRow } from "@prisma/client";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
import { BASE_CURRENCY } from "lib/currency/types";
import { checkRateLimit, RateLimitError } from "lib/auth/rate-limit";
import { getClientIp } from "lib/request/client-ip";
import {
  CheckoutValidationError,
  releaseReservedStock,
  reserveAndPriceCheckout,
  type ServerOrderItemInput,
} from "lib/checkout/server-order-totals";
import { ACTIVE_PAYMENT_PROVIDER } from "./config";
import { assertRealPaymentConfigOrThrow } from "./guard-real-payments";
import { paymentGateway } from "./payment-gateway";
import {
  fetchWompiAcceptanceInfo,
  verifyWompiTransaction,
  type WompiAcceptanceInfo,
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
): Promise<PaymentIntent> {
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
  const { subtotal, discount, total, couponCode: validatedCoupon, reservedItems } =
    priced;

  try {
    const intent = await createPaymentIntentRow(
      total,
      BASE_CURRENCY,
      reservedItems,
      validatedCoupon,
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
  const { subtotal, discount, total, couponCode: validatedCoupon, reservedItems } =
    priced;

  const providerRef = `whatsapp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const row = await prisma.payment.create({
    data: {
      provider: "WHATSAPP",
      providerRef,
      amount: toSubunits(total),
      currency: BASE_CURRENCY,
      status: "PENDING",
      reservedItems,
      couponCode: validatedCoupon,
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
export const WOMPI_TRANSACTION_STATUS_TO_DB: Record<string, PaymentRow["status"]> = {
  APPROVED: "SUCCEEDED",
  DECLINED: "FAILED",
  VOIDED: "CANCELLED",
  ERROR: "FAILED",
  PENDING: "PENDING",
};

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
export async function applyWompiWebhookUpdateAction(
  transaction: WompiWebhookTransaction,
  eventTimestamp: number,
): Promise<void> {
  const dbStatus = WOMPI_TRANSACTION_STATUS_TO_DB[transaction.status];
  if (!dbStatus) {
    console.error(
      "applyWompiWebhookUpdateAction: estado de Wompi desconocido",
      transaction.status,
    );
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: { providerRef: transaction.reference },
  });
  if (!payment) {
    console.error(
      "applyWompiWebhookUpdateAction: no se encontró el pago para la referencia",
      transaction.reference,
    );
    return;
  }

  if (
    payment.lastEventTimestamp !== null &&
    eventTimestamp <= payment.lastEventTimestamp
  ) {
    console.error(
      "applyWompiWebhookUpdateAction: evento viejo o repetido, ignorado",
      transaction.reference,
    );
    return;
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
    return;
  }

  let liveStatus: string;
  try {
    const live = await verifyWompiTransaction(transaction.id);
    liveStatus = live.status;
  } catch (error) {
    console.error(
      "applyWompiWebhookUpdateAction: no se pudo re-verificar la transacción contra la API de Wompi, evento descartado",
      transaction.reference,
      error,
    );
    return;
  }
  const liveDbStatus = WOMPI_TRANSACTION_STATUS_TO_DB[liveStatus];
  if (!liveDbStatus) {
    console.error(
      "applyWompiWebhookUpdateAction: la API de Wompi devolvió un estado desconocido, evento descartado",
      transaction.reference,
      liveStatus,
    );
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: liveDbStatus,
      failureReason: transaction.statusMessage,
      lastEventTimestamp: eventTimestamp,
    },
  });

  if (liveDbStatus === "FAILED" || liveDbStatus === "CANCELLED") {
    await releaseReservedStock(payment.id);
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
}
