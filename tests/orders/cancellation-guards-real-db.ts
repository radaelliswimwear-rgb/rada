// PRUEBA: guardas de cancelación (P0 admin operativo, secciones 9/10) contra
// Postgres real -- mismo criterio que concurrency-real-db.ts: un guard de
// idempotencia real (releaseReservedStock) solo se puede demostrar contra
// una base de verdad, no un mock de Prisma.
//
// Cómo correrlo:
//   DATABASE_URL="postgresql://...proyecto-descartable-o-dev..." \
//     npx tsx --test --experimental-test-module-mocks \
//     tests/orders/cancellation-guards-real-db.ts
//
// Qué verifica, con un pedido/pago/variante de prueba propios (no toca
// pedidos reales):
//   (J) cancelar libera el stock reservado exactamente una vez,
//   (K) cancelar el mismo pedido una segunda vez es un no-op (no libera
//       stock de nuevo, no crea un segundo OrderStatusEvent),
//   (L) CANCELADO -> un estado activo (ej. "Preparando pedido") queda
//       bloqueado server-side,
//   (M) en ningún momento de lo anterior se toca Payment.status.
//
// No borra nada: cuenta/lee filas antes y después.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../mock-module";

if (!process.env["DATABASE_URL"]) {
  throw new Error(
    "Falta DATABASE_URL. Esta prueba SOLO debe apuntar a una base descartable o de desarrollo.",
  );
}

const RUN_ID = `cancel-guard-${Date.now()}`;
const PRODUCT_ID = `prod-${RUN_ID}`;
const SIZE = "M";
const INITIAL_STOCK = 3;
const RESERVED_QTY = 2;

// requireAdmin() -> requireUser() -> getCurrentUser() (lib/auth/session,
// usa cookies() de next/headers, que no existe fuera del runtime de Next).
// Se mockea para devolver siempre la misma admin de prueba.
const FAKE_ADMIN = {
  id: `admin-${RUN_ID}`,
  name: "Admin de prueba",
  email: `admin-${RUN_ID}@radaelliswimwear.local`,
  role: "ADMIN" as const,
  createdAt: new Date(),
  emailVerifiedAt: new Date(),
};
mockModule("lib/auth/session", {
  getCurrentUser: async () => FAKE_ADMIN,
  createSession: async () => undefined,
  destroySession: async () => undefined,
});

test("cancelación: libera stock una sola vez, bloquea reactivación, nunca toca Payment.status", async () => {
  const { prisma } = await import("lib/prisma");
  const { updateFulfillmentStatusAction } = await import(
    "lib/admin/orders-actions"
  );

  await prisma.user.upsert({
    where: { id: "guest" },
    update: {},
    create: { id: "guest", name: "Invitada", email: "guest@cancel-guard-test.local" },
  });
  const category = await prisma.category.upsert({
    where: { slug: `cancel-guard-${RUN_ID}` },
    update: {},
    create: { slug: `cancel-guard-${RUN_ID}`, name: "Bikinis" },
  });
  const product = await prisma.product.create({
    data: {
      id: PRODUCT_ID,
      slug: PRODUCT_ID,
      name: "Bikini de prueba (guard de cancelación)",
      categoryId: category.id,
      priceValue: 180000,
      color: "Lila",
      description: "Producto de prueba de guardas de cancelación.",
      sku: `RAD-${RUN_ID}`,
      variants: {
        create: [{ size: SIZE, stock: INITIAL_STOCK }],
      },
    },
  });

  const payment = await prisma.payment.create({
    data: {
      provider: "WOMPI",
      providerRef: `providerref-${RUN_ID}`,
      amount: 360000,
      status: "SUCCEEDED",
      reservedItems: [{ productId: product.id, size: SIZE, quantity: RESERVED_QTY }],
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: "guest",
      subtotal: 360000,
      shippingCost: 0,
      tax: 0,
      total: 360000,
      shippingAddress: {
        fullName: "Clienta de prueba",
        email: "clienta@cancel-guard-test.local",
        street: "Calle falsa 123",
        neighborhood: "Centro",
        city: "Bogotá",
        postalCode: "110111",
        province: "Bogotá D.C.",
        country: "Colombia",
        phone: "+573000000000",
      },
      payment: { connect: { id: payment.id } },
    },
  });

  const eventsBefore = await prisma.orderStatusEvent.count({
    where: { orderId: order.id },
  });

  // --- Primera cancelación --------------------------------------------
  const first = await updateFulfillmentStatusAction(order.id, "Cancelado");
  assert.equal(first.success, true, "la primera cancelación debe tener éxito");

  const variantAfterFirst = await prisma.productVariant.findUnique({
    where: { productId_size: { productId: product.id, size: SIZE } },
  });
  assert.equal(
    variantAfterFirst?.stock,
    INITIAL_STOCK + RESERVED_QTY,
    "(J) el stock reservado se liberó exactamente una vez",
  );

  const paymentAfterFirst = await prisma.payment.findUnique({
    where: { id: payment.id },
  });
  assert.equal(
    paymentAfterFirst?.status,
    "SUCCEEDED",
    "(M) cancelar NO modifica Payment.status",
  );
  assert.equal(paymentAfterFirst?.stockReleased, true);

  // --- Segunda cancelación (mismo estado, no-op) -----------------------
  const second = await updateFulfillmentStatusAction(order.id, "Cancelado");
  assert.equal(
    second.success,
    true,
    "cancelar un pedido ya cancelado es un no-op seguro, no un error",
  );

  const variantAfterSecond = await prisma.productVariant.findUnique({
    where: { productId_size: { productId: product.id, size: SIZE } },
  });
  assert.equal(
    variantAfterSecond?.stock,
    INITIAL_STOCK + RESERVED_QTY,
    "(K) la segunda cancelación NO vuelve a liberar stock",
  );

  const eventsAfterSecond = await prisma.orderStatusEvent.count({
    where: { orderId: order.id },
  });
  assert.equal(
    eventsAfterSecond,
    eventsBefore + 1,
    "(K) el no-op no crea un segundo OrderStatusEvent duplicado",
  );

  const paymentAfterSecond = await prisma.payment.findUnique({
    where: { id: payment.id },
  });
  assert.equal(
    paymentAfterSecond?.status,
    "SUCCEEDED",
    "(M) la segunda cancelación tampoco toca Payment.status",
  );

  // --- Intento de reactivar (CANCELADO -> estado activo) ---------------
  const reactivate = await updateFulfillmentStatusAction(
    order.id,
    "Preparando pedido",
  );
  assert.equal(
    reactivate.success,
    false,
    "(L) CANCELADO -> un estado activo debe quedar bloqueado server-side",
  );

  const variantAfterReactivateAttempt = await prisma.productVariant.findUnique({
    where: { productId_size: { productId: product.id, size: SIZE } },
  });
  assert.equal(
    variantAfterReactivateAttempt?.stock,
    INITIAL_STOCK + RESERVED_QTY,
    "el intento bloqueado no cambia el stock",
  );

  const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });
  assert.equal(
    orderAfter?.fulfillmentStatus,
    "CANCELADO",
    "el pedido sigue CANCELADO -- la transición bloqueada no se aplicó",
  );

  console.log(
    `\n  cancelación (J/K/L/M): OK -- stock liberado una vez, no-op seguro, reactivación bloqueada, Payment intacto\n`,
  );

  await prisma.$disconnect();
});
