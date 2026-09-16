import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — un pago que Wompi
// todavía no resolvió (PENDING, típico de PSE o de una resolución antifraude
// asincrónica) NO se marca aprobado ni rechazado: queda pendiente, con el
// stock todavía reservado, y la página de retorno vuelve a consultar.
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test lib/payments/hosted-return.pending.test.ts

process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "wompi";
process.env.WOMPI_PUBLIC_KEY = "pub_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_PRIVATE_KEY = "prv_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_FALSO";

test("PENDING verificado -> el pago sigue PENDING y no se libera el stock", async () => {
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

  let stockLiberado = false;

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
      releaseReservedStock: async () => {
        stockLiberado = true;
      },
    },
  });
  mock.module("./providers/wompi-gateway", {
    namedExports: {
      verifyWompiTransaction: async (id: string) => ({
        id,
        status: "PENDING",
        status_message: null,
        amount_in_cents: 15990000,
        currency: "COP",
        reference: payment.providerRef,
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
        order: {
          update: async () => {
            throw new Error("un pago pendiente no debe tocar ningún pedido");
          },
        },
      },
    },
  });

  const { confirmHostedCheckoutReturnAction } = await import(
    "lib/payments/payments-actions"
  );

  const result = await confirmHostedCheckoutReturnAction(
    "113344-1699999-12345",
    payment.providerRef as string,
  );

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.status, "pending");
  assert.notEqual(result.status, "succeeded");
  assert.equal(payment.status, "PENDING");
  assert.equal(
    stockLiberado,
    false,
    "mientras el pago siga vivo, el stock reservado no se devuelve",
  );
  assert.equal(result.orderId, null, "sin pago aprobado no hay pedido");
});
