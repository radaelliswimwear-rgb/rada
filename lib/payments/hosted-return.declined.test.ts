import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — EL test que motivó
// todo el cambio de diseño.
//
// Wompi devuelve el navegador a la tienda con SOLO "?id=<transaction_id>",
// sin estado, sin monto y sin firma. Su propia documentación dice que esa
// redirección es informativa y que nunca debe usarse para dar por válida una
// transacción. Acá se reproduce el escenario del atacante: llamar la Server
// Action del regreso con CUALQUIER id inventado. Como el estado real sale de
// la API de Wompi (verifyWompiTransaction) y no del query param, el
// resultado nunca puede ser "succeeded".
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test lib/payments/hosted-return.declined.test.ts

process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "wompi";
process.env.WOMPI_PUBLIC_KEY = "pub_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_PRIVATE_KEY = "prv_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_FALSO";

test("DECLINED verificado -> el pago queda FAILED, libera el stock y NINGÚN id manipulado lo aprueba", async () => {
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
    reservedItems: [{ productId: "p1", size: "M", quantity: 2 }],
    stockReleased: false,
    lastEventTimestamp: null,
    createdAt: new Date(),
  };

  const releasedFor: string[] = [];
  const idsPreguntadosAWompi: string[] = [];

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
        releasedFor.push(paymentId);
        payment.stockReleased = true;
      },
    },
  });
  mock.module("./providers/wompi-gateway", {
    namedExports: {
      // La API de Wompi es la única autoridad: diga lo que diga la URL, esta
      // transacción está RECHAZADA.
      verifyWompiTransaction: async (id: string) => {
        idsPreguntadosAWompi.push(id);
        return {
          id,
          status: "DECLINED",
          status_message: "Transacción rechazada por el banco emisor",
          amount_in_cents: 15990000,
          currency: "COP",
          reference: payment.providerRef,
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
        order: { update: async () => ({}) },
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
  assert.notEqual(
    result.status,
    "succeeded",
    "una redirección del navegador nunca puede aprobar un pago",
  );
  assert.equal(result.status, "failed");
  assert.equal(payment.status, "FAILED");
  assert.equal(
    result.failureReason,
    "Transacción rechazada por el banco emisor",
  );
  // El stock se descuenta al crear el intent, ANTES de pagar: un pago
  // rechazado tiene que devolverlo ya mismo.
  assert.deepEqual(releasedFor, ["pay_1"]);
  assert.ok(
    idsPreguntadosAWompi.length >= 1,
    "el estado tiene que preguntarse a la API de Wompi",
  );

  // Segundo intento, con un id completamente inventado por quien llame la
  // acción: tampoco aprueba nada.
  const manipulado = await confirmHostedCheckoutReturnAction(
    "999999-0000000-APROBADO",
  );
  assert.equal(manipulado.success, true);
  if (!manipulado.success) return;
  assert.notEqual(manipulado.status, "succeeded");
  assert.equal(payment.status, "FAILED");
  // Y como quien llamó no conocía la referencia del pago, tampoco se la
  // lleva de regalo.
  assert.equal(manipulado.reference, null);
  assert.equal(manipulado.orderId, null);
});

test("un id con forma inválida (path traversal) se rechaza sin llamar a Wompi", async () => {
  const { confirmHostedCheckoutReturnAction } = await import(
    "lib/payments/payments-actions"
  );

  // El id se interpola en GET /transactions/{id} de la API de Wompi: sin
  // validarlo, un "../" apuntaría a otro endpoint.
  for (const malicioso of [
    "../merchants/pub_test",
    "abc/../../x",
    "id con espacios",
    "",
  ]) {
    const result = await confirmHostedCheckoutReturnAction(malicioso);
    assert.equal(result.success, false);
  }
});
