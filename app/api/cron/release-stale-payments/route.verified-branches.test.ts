import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos) — el cron de pagos
// vencidos, cuando SÍ conoce el id real de la transacción de Wompi (se
// guardó al llegar cualquier evento previo), vuelve a preguntar el estado
// real antes de decidir nada. Seis escenarios, todos con datos ficticios y
// sin red/base real:
//   1. Aprobado, sin pedido todavía, con snapshot recuperable -> se crea el
//      pedido (recuperación real).
//   2. Sigue PENDING del lado de Wompi -> no se toca nada.
//   3. Rechazado/anulado -> ya lo resolvió applyWompiWebhookUpdateAction
//      (mockeado acá), el cron no hace nada más.
//   4. Falla la verificación contra Wompi (red) -> no se cancela nada, se
//      reintenta en la próxima corrida.
//   5. Aprobado pero sin snapshot recuperable (pendingOrderInput ausente o
//      corrupto) -> NO se cancela el pago ni se inventa un pedido, queda
//      para revisión manual.
//   6. Aprobado pero el pedido YA existía (carrera con el regreso real de
//      la clienta) -> no se llama a createOrderAction de nuevo.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test app/api/cron/release-stale-payments/route.verified-branches.test.ts

process.env.CRON_SECRET = "test_cron_secret_FALSO";

type FakePayment = {
  id: string;
  wompiTransactionId: string | null;
  orderId: string | null;
  providerRef: string;
  cardLast4: string | null;
  pendingOrderInput: unknown;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
};

const PAGOS: Record<string, FakePayment> = {
  pay_recuperable: {
    id: "pay_recuperable",
    wompiTransactionId: "wompi_tx_1",
    orderId: null,
    providerRef: "lago-recuperable",
    cardLast4: "4242",
    pendingOrderInput: {
      items: [
        {
          productId: "prod_1",
          name: "Traje ficticio",
          image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          size: "M",
          quantity: 1,
          priceValue: 180000,
        },
      ],
      shippingAddress: {
        fullName: "Clienta Ficticia",
        email: "clienta@ejemplo.test",
        street: "Calle Falsa 123",
        neighborhood: "Barrio",
        postalCode: "",
        city: "Bogotá",
        province: "Cundinamarca",
        country: "Colombia",
        phone: "+573000000000",
      },
      shippingMethod: "standard",
      saveAddress: false,
      subscribeNewsletter: false,
    },
    status: "SUCCEEDED",
  },
  pay_pendiente: {
    id: "pay_pendiente",
    wompiTransactionId: "wompi_tx_2",
    orderId: null,
    providerRef: "lago-pendiente",
    cardLast4: null,
    pendingOrderInput: null,
    status: "PENDING",
  },
  pay_rechazado: {
    id: "pay_rechazado",
    wompiTransactionId: "wompi_tx_3",
    orderId: null,
    providerRef: "lago-rechazado",
    cardLast4: null,
    pendingOrderInput: null,
    status: "FAILED",
  },
  pay_verificacion_fallida: {
    id: "pay_verificacion_fallida",
    wompiTransactionId: "wompi_tx_4",
    orderId: null,
    providerRef: "lago-fallida",
    cardLast4: null,
    pendingOrderInput: null,
    status: "PENDING",
  },
  pay_sin_snapshot: {
    id: "pay_sin_snapshot",
    wompiTransactionId: "wompi_tx_5",
    orderId: null,
    providerRef: "lago-sin-snapshot",
    cardLast4: null,
    pendingOrderInput: null, // aprobado pero sin snapshot -> no recuperable
    status: "SUCCEEDED",
  },
  pay_ya_resuelto: {
    id: "pay_ya_resuelto",
    wompiTransactionId: "wompi_tx_6",
    orderId: "order_ya_existente",
    providerRef: "lago-ya-resuelto",
    cardLast4: "1234",
    pendingOrderInput: null,
    status: "SUCCEEDED",
  },
};

const createOrderCalls: unknown[] = [];
const verifyCalls: string[] = [];

mock.module("lib/system/write-pause", {
  namedExports: { areWritesPaused: () => false },
});
mock.module("lib/checkout/server-order-totals", {
  namedExports: {
    releaseReservedStock: async () => {
      throw new Error(
        "no debería llamarse directo desde el cron en estos escenarios (lo hace applyWompiWebhookUpdateAction, ya mockeado como parte de verifyAndApplyPendingWompiPaymentAction)",
      );
    },
  },
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
mock.module("lib/orders/orders-actions", {
  namedExports: {
    createOrderAction: async (input: unknown) => {
      createOrderCalls.push(input);
      return { id: "order_recuperado_ficticio" };
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
            wompiTransactionId: p.wompiTransactionId,
          })),
        findUnique: async ({ where }: { where: { id: string } }) => {
          const payment = PAGOS[where.id];
          return payment ?? null;
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

test("cron de pagos vencidos: los seis caminos con id de transacción conocido", async () => {
  const { GET } = await import("./route");
  const response = await GET(fakeRequest());
  const body = await response.json();

  // Se preguntó a Wompi por los 5 pagos que sí tenían wompiTransactionId
  // (no por pay_pendiente al analizar, ya que ese SÍ tiene id — se pregunta
  // igual, la diferencia es el resultado).
  assert.equal(verifyCalls.length, 6);

  // 1. Recuperado: createOrderAction se llamó una vez, con el snapshot
  //    correcto (nunca con datos de tarjeta, que no existen en el tipo).
  assert.equal(createOrderCalls.length, 1);
  const recovered = createOrderCalls[0] as {
    items: unknown[];
    shippingAddress: { email: string };
    payment: { provider: string; transactionId: string };
  };
  assert.equal(recovered.items.length, 1);
  assert.equal(recovered.shippingAddress.email, "clienta@ejemplo.test");
  assert.equal(recovered.payment.provider, "wompi");
  assert.equal(recovered.payment.transactionId, "lago-recuperable");
  assert.deepEqual(Object.keys(recovered.payment).sort(), [
    "last4",
    "provider",
    "transactionId",
  ]);

  assert.equal(body.verifiedAndRecovered, 1);
  // 2. Sigue pendiente del lado de Wompi: no se tocó.
  assert.equal(body.verifiedAndStillPending, 1);
  // 3. Rechazado: ya resuelto por applyWompiWebhookUpdateAction.
  assert.equal(body.verifiedAndRejected, 1);
  // 4. Falla la verificación: no se cancela, se cuenta aparte.
  assert.equal(body.verificationFailed, 1);
  // 5. Aprobado sin snapshot recuperable: ni se cancela ni se inventa nada.
  assert.equal(body.verifiedButOrderNotRecoverable, 1);
  // 6. Ya tenía pedido (carrera ganada por el regreso real): no se duplica.
  assert.equal(body.verifiedAndAlreadyHadOrder, 1);

  assert.equal(body.cancelledWithoutVerification, 0);
  assert.equal(body.checked, 6);
});
