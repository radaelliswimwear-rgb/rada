import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos) — el cron de pagos
// vencidos ahora cubre dos grupos de candidatos (ver route.ts): pagos
// PENDING con id de transacción conocido, y pagos SUCCEEDED sin pedido
// (recuperación directa, sin volver a preguntarle nada a Wompi porque ya
// lo confirmó un evento real). Ocho escenarios, todos con datos ficticios
// y sin red/base real:
//   PENDING + id conocido:
//   1. Verificado APROBADO, sin pedido, con snapshot recuperable -> se crea
//      el pedido.
//   2. Sigue PENDING del lado de Wompi -> no se toca nada.
//   3. Verificado rechazado/anulado -> ya lo resolvió
//      applyWompiWebhookUpdateAction (mockeado acá).
//   4. Falla la verificación contra Wompi (red) -> no se cancela nada.
//   5. Verificado aprobado pero sin snapshot recuperable -> ni se cancela
//      ni se inventa un pedido.
//   6. Verificado aprobado pero el pedido YA existía (carrera con el
//      regreso real) -> no se llama a recuperar de nuevo.
//   SUCCEEDED sin reverificación (ya confirmado por un evento anterior):
//   7. Sin pedido, se recupera directo.
//   8. Ya tenía pedido (carrera con el regreso real justo en el momento del
//      cron) -> no se duplica.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test app/api/cron/release-stale-payments/route.verified-branches.test.ts

process.env.CRON_SECRET = "test_cron_secret_FALSO";

type FakePayment = {
  id: string;
  wompiTransactionId: string | null;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
};

const PAGOS: Record<string, FakePayment> = {
  pay_recuperable: {
    id: "pay_recuperable",
    wompiTransactionId: "wompi_tx_1",
    status: "PENDING", // pasa a SUCCEEDED tras verificar (ver mock de abajo)
  },
  pay_pendiente: {
    id: "pay_pendiente",
    wompiTransactionId: "wompi_tx_2",
    status: "PENDING",
  },
  pay_rechazado: {
    id: "pay_rechazado",
    wompiTransactionId: "wompi_tx_3",
    status: "PENDING",
  },
  pay_verificacion_fallida: {
    id: "pay_verificacion_fallida",
    wompiTransactionId: "wompi_tx_4",
    status: "PENDING",
  },
  pay_sin_snapshot: {
    id: "pay_sin_snapshot",
    wompiTransactionId: "wompi_tx_5",
    status: "PENDING", // pasa a SUCCEEDED tras verificar, pero sin snapshot
  },
  pay_ya_resuelto: {
    id: "pay_ya_resuelto",
    wompiTransactionId: "wompi_tx_6",
    status: "PENDING", // pasa a SUCCEEDED tras verificar, pero ya tenía pedido
  },
  pay_succeeded_recuperable: {
    id: "pay_succeeded_recuperable",
    wompiTransactionId: "wompi_tx_7",
    status: "SUCCEEDED", // llegó SUCCEEDED directo (webhook sin regreso)
  },
  pay_succeeded_ya_resuelto: {
    id: "pay_succeeded_ya_resuelto",
    wompiTransactionId: "wompi_tx_8",
    status: "SUCCEEDED",
  },
};

// Estado post-verificación de cada pago PENDING (lo que
// verifyAndApplyPendingWompiPaymentAction "hace" del lado de la base,
// simulado acá sin tocar Prisma de verdad).
const ESTADO_TRAS_VERIFICAR: Record<string, "SUCCEEDED" | "PENDING" | "FAILED"> = {
  pay_recuperable: "SUCCEEDED",
  pay_pendiente: "PENDING",
  pay_rechazado: "FAILED",
  pay_sin_snapshot: "SUCCEEDED",
  pay_ya_resuelto: "SUCCEEDED",
};

const recoverCalls: string[] = [];
const verifyCalls: string[] = [];

mock.module("lib/system/write-pause", {
  namedExports: { areWritesPaused: () => false },
});
mock.module("lib/payments/payments-actions", {
  namedExports: {
    verifyAndApplyPendingWompiPaymentAction: async (
      wompiTransactionId: string,
    ) => {
      verifyCalls.push(wompiTransactionId);
      if (wompiTransactionId === "wompi_tx_4") {
        return { ok: false, error: "fallo de red ficticio" };
      }
      return { ok: true };
    },
  },
});
mock.module("lib/orders/order-recovery", {
  namedExports: {
    recoverOrderForApprovedPayment: async (paymentId: string) => {
      recoverCalls.push(paymentId);
      if (paymentId === "pay_sin_snapshot") return "not-recoverable";
      if (paymentId === "pay_ya_resuelto") return "already-had-order";
      if (paymentId === "pay_succeeded_ya_resuelto") return "already-had-order";
      return "recovered";
    },
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findMany: async () =>
          Object.values(PAGOS).map((p) => ({
            id: p.id,
            status: p.status,
            wompiTransactionId: p.wompiTransactionId,
          })),
        findUnique: async ({ where }: { where: { id: string } }) => {
          const status = ESTADO_TRAS_VERIFICAR[where.id];
          return status ? { status } : null;
        },
        update: async () => {
          throw new Error(
            "no debería llamarse: ningún escenario de este archivo cae en el camino sin wompiTransactionId",
          );
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

test("cron de pagos vencidos: los ocho caminos con id de transacción conocido o ya SUCCEEDED", async () => {
  const { GET } = await import("./route");
  const response = await GET(fakeRequest());
  const body = await response.json();

  // Se verificó contra Wompi solo a los 6 PENDING (nunca a los ya
  // SUCCEEDED: esos no necesitan reverificación).
  assert.equal(verifyCalls.length, 6);

  // Se intentó recuperar pedido para: recuperable, sin_snapshot,
  // ya_resuelto (los 3 PENDING que terminan SUCCEEDED tras verificar) +
  // succeeded_recuperable + succeeded_ya_resuelto (directo) = 5.
  assert.equal(recoverCalls.length, 5);
  assert.ok(recoverCalls.includes("pay_recuperable"));
  assert.ok(recoverCalls.includes("pay_sin_snapshot"));
  assert.ok(recoverCalls.includes("pay_ya_resuelto"));
  assert.ok(recoverCalls.includes("pay_succeeded_recuperable"));
  assert.ok(recoverCalls.includes("pay_succeeded_ya_resuelto"));
  // Nunca se intentó recuperar antes de verificar para los que no llegaron
  // a SUCCEEDED.
  assert.ok(!recoverCalls.includes("pay_pendiente"));
  assert.ok(!recoverCalls.includes("pay_rechazado"));
  assert.ok(!recoverCalls.includes("pay_verificacion_fallida"));

  // Recuperados: pay_recuperable (vía verificación) + pay_succeeded_recuperable
  // (directo) = 2.
  assert.equal(body.recovered, 2);
  // Ya tenían pedido: pay_ya_resuelto (vía verificación) +
  // pay_succeeded_ya_resuelto (directo) = 2.
  assert.equal(body.alreadyHadOrder, 2);
  // No recuperable: pay_sin_snapshot = 1.
  assert.equal(body.notRecoverable, 1);
  // Sigue pendiente: pay_pendiente = 1.
  assert.equal(body.verifiedAndStillPending, 1);
  // Rechazado: pay_rechazado = 1.
  assert.equal(body.verifiedAndRejected, 1);
  // Falla la verificación: pay_verificacion_fallida = 1.
  assert.equal(body.verificationFailed, 1);

  assert.equal(body.flaggedForManualReview, 0);
  assert.equal(body.checked, 8);
});
