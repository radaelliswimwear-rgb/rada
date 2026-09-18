import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — el flujo de retorno
// reusa applyWompiWebhookUpdateAction (la función ya auditada del webhook)
// en vez de duplicar su lógica. Este archivo verifica que llamarla desde el
// retorno NO saltea sus dos guardas más importantes:
//
//   1. evento viejo/repetido: si el webhook ya aplicó un evento POSTERIOR
//      (por ejemplo una anulación), el regreso tardío del navegador con una
//      transacción vieja no puede "resucitar" el pago a aprobado;
//   2. monto/moneda: un estado que no coincide con lo que de verdad se
//      cobró server-side se descarta.
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test lib/payments/hosted-return.reusa-guardas-del-webhook.test.ts

process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "wompi";
process.env.WOMPI_PUBLIC_KEY = "pub_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_PRIVATE_KEY = "prv_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_FALSO";

// Estado mutable compartido por los dos tests (los mocks se registran una
// sola vez por proceso: node:test no permite remockear el mismo módulo).
const payment: Record<string, unknown> = {
  id: "pay_1",
  providerRef: "lago-0123456789abcdef01234567",
  provider: "WOMPI",
  amount: 159900,
  currency: "COP",
  status: "PENDING",
  orderId: null,
  failureReason: null,
  cardLast4: null,
  reservedItems: [{ productId: "p1", size: "M", quantity: 1 }],
  stockReleased: false,
  lastEventTimestamp: null,
  createdAt: new Date(),
};
let liveTransaction: Record<string, unknown> = {};

mock.module("lib/auth/rate-limit", {
  namedExports: {
    checkRateLimit: async () => undefined,
    RateLimitError: class RateLimitError extends Error {},
  },
});
mock.module("lib/request/client-ip", {
  namedExports: { getClientIp: async () => "203.0.113.7" },
});
mock.module("lib/checkout/server-order-totals", {
  namedExports: {
    CheckoutValidationError: class CheckoutValidationError extends Error {},
    reserveAndPriceCheckout: async () => {
      throw new Error("no debería usarse en este test");
    },
    releaseReservedStock: async () => undefined,
    // P0 (sep. 2026): "held" preserva el comportamiento previo de este test.
    reclaimReleasedStockForLateApproval: async () => "held" as const,
  },
});
mock.module("./providers/wompi-gateway", {
  namedExports: {
    verifyWompiTransaction: async (id: string) => ({
      id,
      reference: payment.providerRef,
      ...liveTransaction,
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
        updateMany: async (args: { data: Record<string, unknown> }) => {
          Object.assign(payment, args.data);
          return { count: 1 };
        },
      },
      order: { update: async () => ({}) },
    },
  },
});

test("un evento posterior ya aplicado (anulación por webhook) no se pisa desde el retorno", async () => {
  // El webhook ya anuló este pago con un evento de dentro de una hora (o
  // sea: más nuevo que cualquier timestamp que genere el retorno ahora).
  payment.status = "CANCELLED";
  payment.failureReason = "Transacción anulada";
  payment.lastEventTimestamp = Math.floor(Date.now() / 1000) + 3600;
  liveTransaction = {
    status: "APPROVED",
    status_message: null,
    amount_in_cents: 15990000,
    currency: "COP",
  };

  const { confirmHostedCheckoutReturnAction } = await import(
    "lib/payments/payments-actions"
  );
  const result = await confirmHostedCheckoutReturnAction(
    "113344-1699999-1",
    payment.providerRef as string,
  );

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(
    payment.status,
    "CANCELLED",
    "el retorno no puede revertir un evento más nuevo ya aplicado",
  );
  assert.equal(result.status, "cancelled");
  assert.notEqual(result.status, "succeeded");
});

test("un monto que no coincide con lo cobrado server-side se descarta", async () => {
  payment.status = "PENDING";
  payment.failureReason = null;
  payment.lastEventTimestamp = null;
  // La transacción dice estar aprobada por 1.599 pesos en vez de 159.900.
  liveTransaction = {
    status: "APPROVED",
    status_message: null,
    amount_in_cents: 159900,
    currency: "COP",
  };

  const { confirmHostedCheckoutReturnAction } = await import(
    "lib/payments/payments-actions"
  );
  const result = await confirmHostedCheckoutReturnAction(
    "113344-1699999-2",
    payment.providerRef as string,
  );

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(
    payment.status,
    "PENDING",
    "un monto distinto al cobrado nunca puede aprobar el pago",
  );
  assert.notEqual(result.status, "succeeded");
});
