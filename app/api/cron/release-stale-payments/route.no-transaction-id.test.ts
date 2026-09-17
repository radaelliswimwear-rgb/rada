import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos) — CORRECCIÓN sobre
// la primera versión de esta prueba: antes afirmaba que un pago sin
// wompiTransactionId conocido debía cancelarse por tiempo transcurrido.
// Eso era exactamente el riesgo que se pidió eliminar — sin ese id no hay
// ningún contrato confirmado para preguntarle nada a Wompi, así que
// cancelar seguía siendo una decisión a ciegas (podría anular un cobro
// real). Ahora este caso NUNCA cancela ni libera stock automáticamente:
// se marca con flaggedForReviewAt para revisión manual y se deja como
// estaba.
//
// Sin base real ni red: todo mockeado. Correr con:
//   node --experimental-test-module-mocks --import tsx --test app/api/cron/release-stale-payments/route.no-transaction-id.test.ts

process.env.CRON_SECRET = "test_cron_secret_FALSO";

const updates: { where: unknown; data: unknown }[] = [];

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
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: unknown;
        }) => {
          updates.push({ where, data });
          return { id: where.id };
        },
      },
    },
  },
});

function fakeRequest() {
  return {
    headers: { get: () => "Bearer test_cron_secret_FALSO" },
  } as unknown as Parameters<Awaited<typeof import("./route")>["GET"]>[0];
}

test("pago PENDING sin wompiTransactionId conocido: NO se cancela ni se libera stock, se marca para revisión manual", async () => {
  const { GET } = await import("./route");
  const response = await GET(fakeRequest());
  const body = await response.json();

  // Un único update: pone flaggedForReviewAt. Nunca cambia status ni
  // failureReason (eso sería tratarlo como si se hubiera decidido algo
  // sobre el pago, y acá deliberadamente no se decidió nada).
  assert.equal(updates.length, 1);
  const data = updates[0]!.data as Record<string, unknown>;
  assert.ok(
    data.flaggedForReviewAt instanceof Date ||
      typeof data.flaggedForReviewAt === "string",
  );
  assert.equal(data.status, undefined, "no debe tocar el status");
  assert.equal(
    data.failureReason,
    undefined,
    "no debe tocar failureReason -- este pago no se está cancelando",
  );

  assert.equal(body.flaggedForManualReview, 1);
  assert.equal(body.recovered, 0);
  assert.equal(body.checked, 1);
});
