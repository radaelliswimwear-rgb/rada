import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — protección contra
// cobros/reservas duplicadas al INICIAR el pago (distinta del rate limit,
// que ya existía): reintentar el pago para el MISMO carrito, por doble clic
// o por un refresh antes de completar, no puede reservar el stock dos veces
// ni crear dos Payment.
//
// La garantía real la da el índice único de Postgres sobre
// Payment.checkoutAttemptId. Acá se prueban los dos caminos:
//   1. secuencial (refresh): el findUnique previo encuentra el intento
//      vigente y lo reusa;
//   2. carrera (dos clics simultáneos): el findUnique no ve nada, el INSERT
//      falla con P2002 y hay que devolver el stock que reservó el intento
//      perdedor y reusar el ganador.
//
// Nada de esto toca una base de datos: Prisma está mockeado. El módulo de
// Wompi NO está mockeado a propósito — así se verifica que la URL que se le
// entrega al navegador es la de verdad, firmada y sin ningún dato de tarjeta.
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test lib/payments/hosted-start.idempotente.test.ts

process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "wompi";
process.env.WOMPI_PUBLIC_KEY = "pub_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_PRIVATE_KEY = "prv_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_FALSO";

const ATTEMPT_ID = "6f1a1d1e-2b3c-4d5e-8f90-a1b2c3d4e5f6";
const ITEMS = [{ productId: "p1", size: "M", quantity: 1 }];
const PENDING_ORDER = {
  items: [
    {
      productId: "p1",
      name: "Bikini Aurora",
      image: "https://cdn.test/bikini.jpg",
      size: "M",
      quantity: 1,
      priceValue: 159900,
      sku: "RAD-001",
    },
  ],
  shippingAddress: {
    fullName: "Clienta de Prueba",
    email: "clienta@ejemplo.test",
    street: "Calle 1 # 2-3",
    neighborhood: "Centro",
    city: "Medellín",
    postalCode: "050001",
    province: "Antioquia",
    country: "Colombia",
    phone: "3001234567",
  },
  shippingMethod: "standard" as const,
  saveAddress: false,
  subscribeNewsletter: false,
};

type Row = Record<string, unknown>;
let rows: Row[] = [];
let reserveCalls = 0;
let createCalls = 0;
let stockDevuelto: { productId: string; size: string; quantity: number }[] = [];
// Simula la carrera: el findUnique del camino rápido no ve la fila que otro
// request está insertando en ese mismo instante.
let ocultarFilaUnaVez = false;

mock.module("lib/auth/rate-limit", {
  namedExports: {
    checkRateLimit: async () => undefined,
    RateLimitError: class RateLimitError extends Error {},
  },
});
mock.module("lib/request/client-ip", {
  namedExports: { getClientIp: async () => "203.0.113.7" },
});
// CORRECCIÓN (revisión posterior): startWompiHostedCheckoutAction ahora
// captura la sesión real (Payment.originalUserId, ver lib/orders/
// order-recovery.ts) — getCurrentUser() llama a cookies() de next/headers,
// que tira fuera de un request real de Next.js si no se mockea. Esta
// prueba es sobre la idempotencia del inicio, no sobre identidad — se
// simula sin sesión (compra de invitada), que es un valor válido.
mock.module("lib/auth/session", {
  namedExports: { getCurrentUser: async () => null },
});
mock.module("lib/checkout/server-order-totals", {
  namedExports: {
    CheckoutValidationError: class CheckoutValidationError extends Error {},
    reserveAndPriceCheckout: async () => {
      reserveCalls++;
      return {
        subtotal: 159900,
        discount: 0,
        total: 159900,
        couponCode: null,
        resolvedPrices: new Map(),
        reservedItems: ITEMS.map((item) => ({ ...item })),
      };
    },
    releaseReservedStock: async () => undefined,
    // P0 (sep. 2026): finalizeApprovedPayment ahora reclama stock liberado
    // antes de crear un pedido -- "held" preserva el comportamiento previo
    // de este test (el stock de estos pagos nunca se libera acá).
    reclaimReleasedStockForLateApproval: async () => "held" as const,
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findUnique: async (args: { where: { checkoutAttemptId?: string } }) => {
          if (ocultarFilaUnaVez) {
            ocultarFilaUnaVez = false;
            return null;
          }
          return (
            rows.find(
              (row) => row.checkoutAttemptId === args.where.checkoutAttemptId,
            ) ?? null
          );
        },
        findFirst: async () => rows[0] ?? null,
        create: async (args: { data: Row }) => {
          createCalls++;
          if (
            rows.some(
              (row) => row.checkoutAttemptId === args.data.checkoutAttemptId,
            )
          ) {
            // Lo que devuelve Postgres cuando se viola el índice único.
            const error = new Error(
              "Unique constraint failed on the fields: (`checkoutAttemptId`)",
            ) as Error & { code?: string };
            error.code = "P2002";
            throw error;
          }
          const row: Row = {
            id: `pay_${rows.length + 1}`,
            orderId: null,
            stockReleased: false,
            failureReason: null,
            cardLast4: null,
            lastEventTimestamp: null,
            createdAt: new Date(),
            ...args.data,
          };
          rows.push(row);
          return { ...row };
        },
        update: async (args: { where: { id: string }; data: Row }) => {
          const row = rows.find((candidate) => candidate.id === args.where.id);
          if (row) Object.assign(row, args.data);
          return { ...row };
        },
      },
      productVariant: {
        updateMany: async (args: {
          where: { productId: string; size: string };
          data: { stock: { increment: number } };
        }) => {
          stockDevuelto.push({
            productId: args.where.productId,
            size: args.where.size,
            quantity: args.data.stock.increment,
          });
          return { count: 1 };
        },
      },
    },
  },
});

function reset() {
  rows = [];
  reserveCalls = 0;
  createCalls = 0;
  stockDevuelto = [];
  ocultarFilaUnaVez = false;
}

test("dos veces el mismo checkoutAttemptId (refresh) -> un solo Payment y una sola reserva", async () => {
  reset();
  const { startWompiHostedCheckoutAction } = await import(
    "lib/payments/payments-actions"
  );

  const primera = await startWompiHostedCheckoutAction(
    ITEMS,
    null,
    ATTEMPT_ID,
    PENDING_ORDER,
  );
  assert.equal(primera.success, true);
  if (!primera.success) return;
  assert.equal(primera.reused, false);
  assert.match(primera.reference, /^lago-[0-9a-f]{24}$/);

  const segunda = await startWompiHostedCheckoutAction(
    ITEMS,
    null,
    ATTEMPT_ID,
    PENDING_ORDER,
  );
  assert.equal(segunda.success, true);
  if (!segunda.success) return;

  assert.equal(
    segunda.reused,
    true,
    "el segundo intento debe reusar el primero",
  );
  assert.equal(
    segunda.reference,
    primera.reference,
    "la referencia (y por lo tanto el cobro) tiene que ser la misma",
  );
  assert.equal(rows.length, 1, "no puede haber un segundo Payment");
  assert.equal(createCalls, 1, "no puede intentarse un segundo INSERT");
  assert.equal(
    reserveCalls,
    1,
    "el stock no puede reservarse dos veces por el mismo checkout",
  );
  assert.equal(segunda.total, primera.total);

  // La URL que se le entrega al navegador es la del Checkout Web oficial,
  // firmada, y sin un solo dato de tarjeta.
  const url = new URL(segunda.checkoutUrl);
  assert.equal(url.origin + url.pathname, "https://checkout.wompi.co/p/");
  assert.equal(url.searchParams.get("reference"), primera.reference);
  assert.match(url.searchParams.get("signature:integrity")!, /^[0-9a-f]{64}$/);
  assert.ok(
    !/(card|cvc|cvv|number|pan)/i.test(url.search),
    "la URL no puede contener ningún dato de tarjeta",
  );
});

test("carrera de dos clics simultáneos -> el perdedor devuelve el stock y reusa el ganador", async () => {
  reset();
  const { startWompiHostedCheckoutAction } = await import(
    "lib/payments/payments-actions"
  );

  const ganadora = await startWompiHostedCheckoutAction(
    ITEMS,
    null,
    ATTEMPT_ID,
    PENDING_ORDER,
  );
  assert.equal(ganadora.success, true);
  if (!ganadora.success) return;

  // El segundo request no llega a ver la fila del primero (como pasaría de
  // verdad con dos clics simultáneos): reserva stock, intenta insertar y
  // choca contra el índice único.
  ocultarFilaUnaVez = true;
  const perdedora = await startWompiHostedCheckoutAction(
    ITEMS,
    null,
    ATTEMPT_ID,
    PENDING_ORDER,
  );

  assert.equal(perdedora.success, true);
  if (!perdedora.success) return;
  assert.equal(perdedora.reused, true);
  assert.equal(perdedora.reference, ganadora.reference);
  assert.equal(rows.length, 1, "sigue habiendo un solo Payment");
  assert.equal(createCalls, 2, "el segundo INSERT se intentó y falló (P2002)");
  assert.deepEqual(
    stockDevuelto,
    [{ productId: "p1", size: "M", quantity: 1 }],
    "el stock que reservó el intento perdedor tiene que volver al catálogo",
  );
});
