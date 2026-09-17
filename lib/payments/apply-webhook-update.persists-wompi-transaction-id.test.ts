import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos, tarea 4 del cron) —
// applyWompiWebhookUpdateAction ahora guarda wompiTransactionId (el id REAL
// de la transacción en Wompi) cada vez que aplica un evento, sea por
// webhook o por verifyAndApplyPendingWompiPaymentAction (el cron). Sin esta
// columna, un pago que se queda PENDING después de un evento parcial no se
// podría volver a consultar más adelante: no hay ningún contrato confirmado
// de Wompi para buscar una transacción por nuestra propia referencia, solo
// por su id real (ver el comentario junto a verifyWompiTransaction en
// lib/payments/providers/wompi-gateway.ts).
//
// Sin base real: Prisma mockeado.

const updateCalls: { where: unknown; data: unknown }[] = [];

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findFirst: async () => ({
          id: "pay_1",
          providerRef: "lago-abc123",
          amount: 370000,
          currency: "COP",
          lastEventTimestamp: null,
          orderId: null,
        }),
        // applyWompiWebhookUpdateAction ahora llama a finalizeApprovedPayment
        // cuando el evento deja el pago en SUCCEEDED (ver Sprint de
        // finalización unificada) — ese llamado hace su propio findUnique.
        // Sin status en esta fila, finalizeApprovedPayment corta de
        // inmediato en "not-approved" (status !== "SUCCEEDED"), sin tocar
        // nada más: este archivo solo prueba que wompiTransactionId se
        // guarda, no la finalización (ver
        // apply-webhook-update.finalizes-approved-payment.test.ts).
        findUnique: async () => ({
          id: "pay_1",
          providerRef: "lago-abc123",
          amount: 370000,
          currency: "COP",
          lastEventTimestamp: null,
          orderId: null,
        }),
        update: async (args: { where: unknown; data: unknown }) => {
          updateCalls.push(args);
          return {};
        },
      },
      order: { update: async () => ({}) },
    },
  },
});
mock.module("lib/checkout/server-order-totals", {
  namedExports: { releaseReservedStock: async () => undefined },
});
mock.module("lib/payments/providers/wompi-gateway", {
  namedExports: {
    verifyWompiTransaction: async () => ({
      id: "wompi_tx_real_999",
      status: "APPROVED",
      amount_in_cents: 37000000,
      currency: "COP",
      reference: "lago-abc123",
    }),
    fetchWompiAcceptanceInfo: async () => {
      throw new Error("no debería llamarse en este test");
    },
    buildWompiHostedCheckoutUrl: () => {
      throw new Error("no debería llamarse en este test");
    },
    toWompiAmountInCents: (n: number) => Math.round(n * 100),
  },
});

test("applyWompiWebhookUpdateAction guarda el id real de la transacción de Wompi", async () => {
  const { applyWompiWebhookUpdateAction } = await import("./payments-actions");

  await applyWompiWebhookUpdateAction(
    {
      id: "wompi_tx_real_999",
      reference: "lago-abc123",
      status: "APPROVED",
      statusMessage: null,
      amountInCents: 37000000,
      currency: "COP",
    },
    1_789_000_000,
  );

  assert.equal(updateCalls.length, 1);
  const data = updateCalls[0]!.data as { wompiTransactionId: string };
  assert.equal(data.wompiTransactionId, "wompi_tx_real_999");
});
