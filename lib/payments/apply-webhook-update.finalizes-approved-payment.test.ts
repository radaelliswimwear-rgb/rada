import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (mejora arquitectónica post-E2E real con webhook) —
// applyWompiWebhookUpdateAction ahora dispara finalizeApprovedPayment
// cuando el evento deja el pago en SUCCEEDED (antes el webhook solo
// actualizaba Payment y nunca intentaba crear el pedido — ver el hallazgo
// real del E2E #1010/#1011). finalizeApprovedPayment se mockea acá porque
// su propio contrato de gateo ya se prueba en
// lib/orders/finalize-approved-payment.test.ts; a este archivo solo le
// importa CUÁNDO se llama (y con qué `source`), nunca para estados que no
// sean SUCCEEDED.
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test lib/payments/apply-webhook-update.finalizes-approved-payment.test.ts

process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "wompi";
process.env.WOMPI_PUBLIC_KEY = "pub_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_PRIVATE_KEY = "prv_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_FALSO";

const finalizeCalls: { paymentId: string; source: string }[] = [];

// Estado mutable compartido por los dos tests (mock.module solo se puede
// instalar una vez por proceso).
const payment: Record<string, unknown> = {
  id: "pay_1",
  providerRef: "lago-abc123",
  amount: 370000,
  currency: "COP",
  status: "PENDING",
  orderId: null,
  lastEventTimestamp: null,
};
let liveStatus = "APPROVED";
let liveStatusMessage: string | null = null;

mock.module("lib/orders/order-recovery", {
  namedExports: {
    finalizeApprovedPayment: async (paymentId: string, source: string) => {
      finalizeCalls.push({ paymentId, source });
      return "created";
    },
  },
});
mock.module("lib/checkout/server-order-totals", {
  namedExports: { releaseReservedStock: async () => undefined },
});
mock.module("lib/payments/providers/wompi-gateway", {
  namedExports: {
    verifyWompiTransaction: async () => ({
      id: "wompi_tx_1",
      status: liveStatus,
      status_message: liveStatusMessage,
      amount_in_cents: 37000000,
      currency: "COP",
      reference: "lago-abc123",
    }),
    fetchWompiAcceptanceInfo: async () => null,
    buildWompiHostedCheckoutUrl: () => "https://checkout.wompi.co/p/?stub=1",
    toWompiAmountInCents: (amount: number) => Math.round(amount * 100),
    wompiGateway: { provider: "wompi", createIntent: async () => ({}) },
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findFirst: async () => ({ ...payment }),
        findUnique: async () => ({ ...payment }),
        update: async (args: { data: Record<string, unknown> }) => {
          Object.assign(payment, args.data);
          return { ...payment };
        },
      },
      order: { update: async () => ({}) },
    },
  },
});

test("evento APPROVED: el webhook finaliza el pago (finalizeApprovedPayment con source='webhook')", async () => {
  liveStatus = "APPROVED";
  liveStatusMessage = null;
  const { applyWompiWebhookUpdateAction } = await import("./payments-actions");

  await applyWompiWebhookUpdateAction(
    {
      id: "wompi_tx_1",
      reference: "lago-abc123",
      status: "APPROVED",
      statusMessage: null,
      amountInCents: 37000000,
      currency: "COP",
    },
    1_789_000_100,
  );

  assert.equal(payment.status, "SUCCEEDED");
  assert.equal(finalizeCalls.length, 1);
  assert.equal(finalizeCalls[0]!.paymentId, "pay_1");
  assert.equal(finalizeCalls[0]!.source, "webhook");
});

test("evento DECLINED: nunca llama a finalizeApprovedPayment", async () => {
  payment.status = "PENDING";
  payment.lastEventTimestamp = null;
  liveStatus = "DECLINED";
  liveStatusMessage = "Transacción rechazada por el banco emisor";
  const antes = finalizeCalls.length;
  const { applyWompiWebhookUpdateAction } = await import("./payments-actions");

  await applyWompiWebhookUpdateAction(
    {
      id: "wompi_tx_2",
      reference: "lago-abc123",
      status: "DECLINED",
      statusMessage: "Transacción rechazada por el banco emisor",
      amountInCents: 37000000,
      currency: "COP",
    },
    1_789_000_200,
  );

  assert.equal(payment.status, "FAILED");
  assert.equal(
    finalizeCalls.length,
    antes,
    "un rechazo nunca debe intentar crear un pedido",
  );
});
