import { test, mock } from "node:test";
import assert from "node:assert/strict";

// P0 (corrección de leak de inventario, sep. 2026) — CORRECCIÓN sobre la
// versión anterior de esta prueba: afirmaba que un pago sin
// wompiTransactionId conocido NUNCA debía cancelarse ni liberar stock, solo
// marcarse con flaggedForReviewAt. Esa era exactamente la causa del leak
// real encontrado en la auditoría: sin ninguna pantalla de admin que
// actuara sobre esa marca, el stock de un carrito abandonado (el caso más
// común, lejos) quedaba reservado para siempre. Ahora este caso SÍ se
// cancela y SÍ libera su stock automáticamente después del TTL, delegando
// el trabajo atómico/idempotente a cancelAbandonedPaymentAndReleaseStock
// (lib/checkout/server-order-totals.ts, con sus propias pruebas dedicadas
// en server-order-totals.abandoned-payment.test.ts) — este archivo prueba
// SOLO que el cron llama a esa función con los datos correctos y registra
// bien el resultado, no su mecánica interna.
//
// Sin base real ni red: todo mockeado. Correr con:
//   node --experimental-test-module-mocks --import tsx --test app/api/cron/release-stale-payments/route.no-transaction-id.test.ts

process.env.CRON_SECRET = "test_cron_secret_FALSO";

const cancelCalls: { paymentId: string; failureReason: string }[] = [];

mock.module("lib/system/write-pause", {
  namedExports: { areWritesPaused: () => false },
});
mock.module("lib/payments/payments-actions", {
  namedExports: {
    verifyAndApplyPendingWompiPaymentAction: async () => {
      throw new Error(
        "no debería llamarse: este pago no tiene wompiTransactionId",
      );
    },
  },
});
mock.module("lib/orders/order-recovery", {
  namedExports: {
    finalizeApprovedPayment: async () => {
      throw new Error(
        "no debería llamarse: este pago sigue PENDING, no SUCCEEDED",
      );
    },
  },
});

let cancelResult: "cancelled" | "not-pending" = "cancelled";

mock.module("lib/checkout/server-order-totals", {
  namedExports: {
    cancelAbandonedPaymentAndReleaseStock: async (
      paymentId: string,
      failureReason: string,
    ) => {
      cancelCalls.push({ paymentId, failureReason });
      return cancelResult;
    },
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findMany: async () => [
          {
            id: "pay_sin_id_wompi",
            status: "PENDING",
            wompiTransactionId: null,
          },
        ],
      },
    },
  },
});

function fakeRequest() {
  return {
    headers: { get: () => "Bearer test_cron_secret_FALSO" },
  } as unknown as Parameters<Awaited<typeof import("./route")>["GET"]>[0];
}

test("pago PENDING sin wompiTransactionId conocido, vencido por TTL: se cancela y se libera su stock (delegado a cancelAbandonedPaymentAndReleaseStock)", async () => {
  cancelResult = "cancelled";
  const { GET } = await import("./route");
  const response = await GET(fakeRequest());
  const body = await response.json();

  assert.equal(cancelCalls.length, 1);
  assert.equal(cancelCalls[0]!.paymentId, "pay_sin_id_wompi");
  // El motivo debe ser un mensaje real y específico -- no un string vacío
  // ni un genérico "cancelado".
  assert.ok(cancelCalls[0]!.failureReason.length > 10);

  assert.equal(body.cancelledAbandoned, 1);
  assert.equal(body.flaggedForManualReview, 0);
  assert.equal(body.recovered, 0);
  assert.equal(body.checked, 1);
});

test("cancelAbandonedPaymentAndReleaseStock pierde la carrera (un webhook lo resolvió un instante antes): el cron no cuenta nada extra ni revienta", async () => {
  cancelCalls.length = 0;
  cancelResult = "not-pending";
  const { GET } = await import("./route");
  const response = await GET(fakeRequest());
  const body = await response.json();

  assert.equal(
    cancelCalls.length,
    1,
    "igual se intenta -- perder la carrera se decide adentro",
  );
  assert.equal(body.cancelledAbandoned, 0);
  assert.equal(body.flaggedForManualReview, 0);
  assert.equal(body.checked, 1);
});
