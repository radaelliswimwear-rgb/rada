"use server";

import { prisma } from "lib/prisma";
import type { Payment as PaymentRow } from "@prisma/client";
import { paymentGateway } from "./payment-gateway";
import type { CardInput, PaymentIntent, PaymentProvider, PaymentStatus } from "./types";

// Server Actions Prisma/Postgres. payments-repository.ts conserva los
// mismos nombres que antes (Sprint 11, localStorage) — la UI no cambia. El
// gateway simulado (paymentGateway) sigue siendo puro/sin red real; solo la
// persistencia de cada intento pasa a Postgres.
const PROVIDER_TO_DB: Record<PaymentProvider, PaymentRow["provider"]> = {
  stripe: "STRIPE",
  wompi: "WOMPI",
};
const PROVIDER_FROM_DB: Record<PaymentRow["provider"], PaymentProvider> = {
  STRIPE: "stripe",
  WOMPI: "wompi",
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

export async function confirmPaymentAction(
  intent: PaymentIntent,
  card: CardInput,
): Promise<PaymentIntent> {
  const result = await paymentGateway.confirmPayment(intent, card);
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
  const row = await prisma.payment.findFirst({ where: { providerRef: intentId } });
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
  const row = await prisma.payment.findFirst({ where: { providerRef: intentId } });
  return row ? toIntent(row) : null;
}
