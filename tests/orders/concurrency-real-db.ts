// PRUEBA CENTRAL: concurrencia REAL contra Postgres, sin mockear Prisma.
//
// Un mock no puede demostrar atomicidad a nivel de fila — puede simular que
// `updateMany` devolvió 0, pero no que Postgres serializó dos llamadas
// simultáneas sobre la misma fila de Payment. Por eso esto corre contra una
// base Postgres de verdad (un proyecto Neon DESCARTABLE, creado y borrado
// para la prueba; NUNCA la base real del proyecto).
//
// Cómo correrlo:
//   DATABASE_URL="postgresql://...proyecto-descartable..." \
//     npx tsx --test --experimental-test-module-mocks \
//     tests/orders/concurrency-real-db.ts
//
// Qué verifica, con el mismo providerRef para todas las llamadas:
//   (a) queda EXACTAMENTE un Order enlazado a ese Payment (se cuentan filas),
//   (b) TODAS las promesas resuelven (ninguna tira "ya generó un pedido"),
//   (c) todas devuelven el MISMO order.id,
//   (d) no quedan Order huérfanos (creados y desenlazados) en la tabla,
//   (e) un reintento POSTERIOR, ya sin concurrencia, devuelve ese mismo id.
//
// No borra NADA: cuenta filas antes y después y compara los deltas. Aun
// así, apuntá esto solo a una base descartable — escribe pedidos y pagos de
// prueba.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CreateOrderInput } from "lib/orders/types";
import { mockModule } from "../mock-module";

const CONCURRENT_CALLS = 10;

if (!process.env["DATABASE_URL"]) {
  throw new Error(
    "Falta DATABASE_URL. Esta prueba SOLO debe apuntar a una base descartable.",
  );
}

// El aviso al admin manda correos reales: se registra en memoria en vez de
// enviarse. También sirve para afirmar que se manda una sola vez aunque
// haya 10 llamadas simultáneas.
const notifications: string[] = [];
mockModule("lib/email/order-notifications", {
  notifyAdminsOfNewOrder: async (order: { id: string }) => {
    notifications.push(order.id);
  },
  notifyAdminsOfNewSubscriber: async () => undefined,
});

// getCurrentUser usa cookies() de next/headers, que no existe fuera del
// runtime de Next. Acá siempre compra una invitada (el camino público).
mockModule("lib/auth/session", {
  getCurrentUser: async () => null,
  createSession: async () => undefined,
  destroySession: async () => undefined,
});

const PROVIDER_REF = `race-test-${Date.now()}`;
const PRODUCT_ID = "prod-race-test";

const input: CreateOrderInput = {
  items: [
    {
      productId: PRODUCT_ID,
      name: "Bikini de prueba",
      image: "/test.jpg",
      size: "M",
      quantity: 2,
      priceValue: 180000,
    },
  ],
  shippingAddress: {
    fullName: "Laura Gómez",
    email: "laura@example.com",
    street: "Calle 10 #20-30",
    neighborhood: "El Poblado",
    city: "Medellín",
    postalCode: "050021",
    province: "Antioquia",
    country: "Colombia",
    phone: "+573001112233",
  },
  shippingMethod: "standard",
  payment: { provider: "wompi", transactionId: PROVIDER_REF, last4: "4242" },
};

test("createOrderAction concurrente: un solo pedido, todas las llamadas lo recuperan", async () => {
  const { prisma } = await import("lib/prisma");
  const { createOrderAction } = await import("lib/orders/orders-actions");

  // Se cuenta ANTES y DESPUÉS y se comparan los deltas, en vez de vaciar
  // las tablas: esta prueba no borra nada. Un pedido huérfano, por
  // definición, ya no está enlazado a ningún pago, así que solo se lo puede
  // detectar contando la tabla Order entera — pero alcanza con contar
  // cuántas filas AGREGÓ esta corrida, y eso no exige que la base empiece
  // vacía. Así el archivo es repetible y, sobre todo, no tiene ningún
  // deleteMany que pudiera arrasar una base equivocada.
  const ordersBefore = await prisma.order.count();
  const itemsBefore = await prisma.orderItem.count();
  const eventsBefore = await prisma.orderStatusEvent.count();

  // --- Datos mínimos reales en la base descartable ------------------------
  await prisma.user.upsert({
    where: { id: "guest" },
    update: {},
    create: { id: "guest", name: "Invitada", email: "guest@race-test.local" },
  });
  const category = await prisma.category.upsert({
    where: { slug: "race-test" },
    update: {},
    create: { slug: "race-test", name: "Bikinis" },
  });
  await prisma.product.upsert({
    where: { id: PRODUCT_ID },
    update: {},
    create: {
      id: PRODUCT_ID,
      slug: "prod-race-test",
      name: "Bikini de prueba",
      categoryId: category.id,
      priceValue: 180000,
      color: "Lila",
      description: "Producto de prueba de concurrencia.",
      sku: "RAD-RACE-001",
    },
  });
  const payment = await prisma.payment.create({
    data: {
      provider: "WOMPI",
      providerRef: PROVIDER_REF,
      cardLast4: "4242",
      amount: 360000,
      status: "SUCCEEDED",
      reservedItems: [{ productId: PRODUCT_ID, size: "M", quantity: 2 }],
    },
  });
  assert.equal(payment.orderId, null, "el pago arranca sin pedido");

  // --- La carrera de verdad ----------------------------------------------
  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENT_CALLS }, () => createOrderAction(input)),
  );

  const rejected = results.filter((r) => r.status === "rejected");
  for (const r of rejected) {
    console.error("RECHAZADA:", (r as PromiseRejectedResult).reason);
  }

  // (b) Ninguna llamada falló.
  assert.equal(
    rejected.length,
    0,
    `${rejected.length}/${CONCURRENT_CALLS} llamadas fallaron`,
  );

  // (c) Todas devolvieron el mismo pedido.
  const ids = results.map(
    (r) => (r as PromiseFulfilledResult<{ id: string }>).value.id,
  );
  const uniqueIds = [...new Set(ids)];
  console.log(`\n  llamadas simultáneas: ${CONCURRENT_CALLS}`);
  console.log(`  promesas resueltas:   ${ids.length}`);
  console.log(
    `  ids distintos:        ${uniqueIds.length} -> ${uniqueIds.join(", ")}`,
  );
  assert.equal(uniqueIds.length, 1, "todas deben devolver el mismo order.id");

  // (a) Exactamente un Order enlazado a ese Payment.
  const fresh = await prisma.payment.findUnique({
    where: { providerRef: PROVIDER_REF },
  });
  assert.equal(fresh?.orderId, uniqueIds[0], "el pago apunta a ese pedido");

  // (d) Y ningún Order huérfano: esta corrida agregó UNA sola fila a Order,
  // así que ninguna de las 9 perdedoras dejó su propio pedido suelto (con
  // el código anterior este delta daba 10, con 9 huérfanos).
  const newOrders = (await prisma.order.count()) - ordersBefore;
  const newItems = (await prisma.orderItem.count()) - itemsBefore;
  const newEvents = (await prisma.orderStatusEvent.count()) - eventsBefore;
  console.log(`  Order creados:        ${newOrders}`);
  console.log(`  OrderItem creados:    ${newItems}`);
  console.log(`  StatusEvent creados:  ${newEvents}`);
  console.log(`  avisos al admin:      ${notifications.length}`);
  assert.equal(newOrders, 1, "esta corrida creó un solo Order");
  assert.equal(newItems, 1, "un solo OrderItem (una línea del pedido)");
  assert.equal(newEvents, 1, "un solo evento de historial logístico");

  // El correo de "pedido nuevo" se manda una sola vez, no diez.
  assert.equal(notifications.length, 1, "un solo aviso al admin");

  // (e) Reintento posterior, ya sin concurrencia.
  const retry = await createOrderAction(input);
  assert.equal(retry.id, uniqueIds[0], "el reintento recupera el mismo pedido");
  assert.equal(
    (await prisma.order.count()) - ordersBefore,
    1,
    "el reintento no creó nada",
  );
  assert.equal(notifications.length, 1, "el reintento no reenvía el aviso");
  console.log(`  reintento posterior:  ${retry.id} (sin crear nada)\n`);

  await prisma.$disconnect();
});
