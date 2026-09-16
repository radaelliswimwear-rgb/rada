import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos) — corrección del
// cron de pagos vencidos: cuando NUNCA llegó ningún evento de Wompi para un
// pago (ni webhook ni regreso del Checkout Web alojado), no hay id real de
// transacción guardado — y sin él no existe ningún contrato confirmado para
// preguntarle nada a Wompi (no hay forma de buscar por nuestra propia
// referencia). Este caso conserva el comportamiento anterior: cancela por
// tiempo transcurrido, pero deja explícito en failureReason que fue SIN
// poder verificar, para que sea auditable.
//
// Sin base real ni red: todo mockeado. Correr con:
//   node --experimental-test-module-mocks --import tsx --test app/api/cron/release-stale-payments/route.no-transaction-id.test.ts

process.env.CRON_SECRET = "test_cron_secret_FALSO";

const releasedIds: string[] = [];
const updates: { id: string; data: unknown }[] = [];

mock.module("lib/system/write-pause", {
  namedExports: { areWritesPaused: () => false },
});
mock.module("lib/checkout/server-order-totals", {
  namedExports: {
    releaseReservedStock: async (paymentId: string) => {
      releasedIds.push(paymentId);
    },
  },
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
mock.module("lib/orders/orders-actions", {
  namedExports: {
    createOrderAction: async () => {
      throw new Error("no debería llamarse en este escenario");
    },
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findMany: async () => [
          { id: "pay_sin_id_wompi", wompiTransactionId: null },
        ],
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: unknown;
        }) => {
          updates.push({ id: where.id, data });
          return { id: where.id };
        },
      },
    },
  },
});

function fakeRequest() {
  return {
    headers: { get: () => "Bearer test_cron_secret_FALSO" },
  } as unknown as Parameters<
    Awaited<typeof import("./route")>["GET"]
  >[0];
}

test("pago sin wompiTransactionId conocido: se cancela por tiempo, marcado explícitamente como sin verificar", async () => {
  const { GET } = await import("./route");
  const response = await GET(fakeRequest());
  const body = await response.json();

  assert.equal(releasedIds.length, 1);
  assert.equal(releasedIds[0], "pay_sin_id_wompi");

  assert.equal(updates.length, 1);
  assert.equal(
    (updates[0]!.data as { status: string }).status,
    "CANCELLED",
  );
  assert.match(
    (updates[0]!.data as { failureReason: string }).failureReason,
    /no se pudo verificar/i,
  );

  assert.equal(body.cancelledWithoutVerification, 1);
  assert.equal(body.verifiedAndRecovered, 0);
  assert.equal(body.checked, 1);
});
