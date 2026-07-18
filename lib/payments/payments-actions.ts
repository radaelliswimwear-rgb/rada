"use server";

import { prisma } from "lib/prisma";
import type { Payment as PaymentRow } from "@prisma/client";
import { paymentGateway } from "./payment-gateway";
import type {
  CardInput,
  PaymentIntent,
  PaymentProvider,
  PaymentStatus,
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
};
const STATUS_FROM_DB: Record<PaymentRow["status"], PaymentStatus> = {
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

function toIntent(row: PaymentRow): PaymentIntent {
  return {
    id: row.providerRef,
    provider: PROVIDER_FROM_DB[row.provider],
    amount: row.amount / 100,
    currency: row.currency,
    status: STATUS_FROM_DB[row.status],
    orderId: row.orderId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    failureReason: row.failureReason ?? undefined,
  };
}

export async function createPaymentIntentAction(
  amount: number,
  currency: string,
): Promise<PaymentIntent> {
  const intent = await paymentGateway.createIntent(amount, currency);
  await prisma.payment.create({
    data: {
      provider: PROVIDER_TO_DB[intent.provider],
      providerRef: intent.id,
      amount: Math.round(amount * 100),
      currency,
      status: "PENDING",
    },
  });
  return intent;
}

// Coordinación manual por WhatsApp (sin pasarela real ni cobro online): el
// registro Payment existe solo para que el pedido tenga un historial de pago
// consistente en el panel; queda en PENDING hasta que el admin lo confirme
// a mano cambiando el estado del pedido.
export async function createWhatsappPaymentAction(
  amount: number,
  currency: string,
): Promise<PaymentIntent> {
  const providerRef = `whatsapp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const row = await prisma.payment.create({
    data: {
      provider: "WHATSAPP",
      providerRef,
      amount: Math.round(amount * 100),
      currency,
      status: "PENDING",
    },
  });
  return toIntent(row);
}

export async function confirmPaymentAction(
  intent: PaymentIntent,
  card: CardInput,
  customerEmail?: string,
): Promise<PaymentIntent> {
  const result = await paymentGateway.confirmPayment(
    intent,
    card,
    customerEmail,
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

export async function getPaymentByIdAction(
  intentId: string,
): Promise<PaymentIntent | null> {
  const row = await prisma.payment.findFirst({
    where: { providerRef: intentId },
  });
  return row ? toIntent(row) : null;
}

// Estado que llega en los eventos de Wompi (transaction.status), distinto
// del PaymentStatus interno — mapeo propio para no acoplar el webhook al
// resto del dominio (Sprint 16).
const WOMPI_TRANSACTION_STATUS_TO_DB: Record<string, PaymentRow["status"]> = {
  APPROVED: "SUCCEEDED",
  DECLINED: "FAILED",
  VOIDED: "CANCELLED",
  ERROR: "FAILED",
  PENDING: "PENDING",
};

// Llamada desde app/api/webhooks/wompi/route.ts (Sprint 16), después de
// verificar la firma del evento. `reference` es la misma que generamos en
// wompiGateway.createIntent() y guardamos como Payment.providerRef — Wompi
// la devuelve tal cual en cada evento, así que sirve para encontrar el pago
// sin depender del id interno de la transacción en Wompi.
export async function applyWompiWebhookUpdateAction(
  reference: string,
  wompiStatus: string,
  failureReason: string | null,
): Promise<void> {
  const dbStatus = WOMPI_TRANSACTION_STATUS_TO_DB[wompiStatus];
  if (!dbStatus) {
    console.error(
      "applyWompiWebhookUpdateAction: estado de Wompi desconocido",
      wompiStatus,
    );
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: { providerRef: reference },
  });
  if (!payment) {
    console.error(
      "applyWompiWebhookUpdateAction: no se encontró el pago para la referencia",
      reference,
    );
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: dbStatus, failureReason },
  });

  // Actualización automática del estado del pedido: si un pago que ya
  // estaba vinculado a un pedido termina fallando o anulándose (resolución
  // asincrónica posterior a la creación del pedido), el pedido se cancela
  // solo. Nunca se hace en sentido contrario — un pago aprobado no adelanta
  // el estado de envío, que sigue siendo responsabilidad del panel
  // (lib/admin/orders-actions.ts).
  if (payment.orderId && (dbStatus === "FAILED" || dbStatus === "CANCELLED")) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CANCELADO" },
    });
  }
}
