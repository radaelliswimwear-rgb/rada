import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — cada escenario de
// mock.module vive en su propio archivo porque node:test no permite
// remockear el mismo módulo dos veces en el mismo proceso.
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test lib/payments/hosted-return.approved.test.ts
//
// Nada de esto toca una base de datos ni la red: Prisma y la API de Wompi
// están mockeadas. Las "credenciales" son strings inventados acá.

process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "wompi";
process.env.WOMPI_PUBLIC_KEY = "pub_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_PRIVATE_KEY = "prv_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_FALSO";

test("regreso de Wompi con APPROVED verificado -> el pago queda SUCCEEDED", async () => {
  const payment: Record<string, unknown> = {
    id: "pay_1",
    providerRef: "lago-0123456789abcdef01234567",
    provider: "WOMPI",
    amount: 159900, // pesos enteros (ver lib/currency/subunits.ts)
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

  let releasedStockFor: string | null = null;
  let verifyCalls = 0;

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
      releaseReservedStock: async (paymentId: string) => {
        releasedStockFor = paymentId;
      },
    },
  });
  mock.module("./providers/wompi-gateway", {
    namedExports: {
      verifyWompiTransaction: async (id: string) => {
        verifyCalls++;
        return {
          id,
          status: "APPROVED",
          status_message: null,
          amount_in_cents: 15990000,
          currency: "COP",
          reference: payment.providerRef,
          payment_method: { type: "CARD", extra: { last_four: "4242" } },
        };
      },
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
        order: {
          update: async () => {
            throw new Error("no debería cancelarse ningún pedido acá");
          },
        },
      },
    },
  });

  const { confirmHostedCheckoutReturnAction } = await import(
    "lib/payments/payments-actions"
  );

  const result = await confirmHostedCheckoutReturnAction("113344-1699999-12345");

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.status, "succeeded");
  assert.equal(result.reference, payment.providerRef);
  assert.equal(result.orderId, null);
  assert.equal(payment.status, "SUCCEEDED");
  assert.equal(
    releasedStockFor,
    null,
    "un pago aprobado nunca debe liberar el stock reservado",
  );
  // Últimos 4 dígitos: llegan de la transacción ya cobrada en Wompi, nunca
  // de un formulario propio.
  assert.equal(payment.cardLast4, "4242");
  assert.ok(
    verifyCalls >= 1,
    "el estado tiene que salir de la API de Wompi, no del query param",
  );

  // El timestamp que se le pasa a applyWompiWebhookUpdateAction va en
  // SEGUNDOS: Payment.lastEventTimestamp es un Int de 32 bits y un
  // Date.now() en milisegundos lo desbordaría (y dejaría el contador tan
  // alto que todo webhook posterior se descartaría por "evento viejo").
  const applied = payment.lastEventTimestamp as number;
  assert.ok(
    applied > 1_600_000_000 && applied < 2_147_483_647,
    `lastEventTimestamp debe ser un unix en segundos que entre en un Int32, fue ${applied}`,
  );
});
