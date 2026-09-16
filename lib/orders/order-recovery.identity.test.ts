import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos) — recoverOrderForApprovedPayment
// (usado solo por el cron de pagos vencidos) tiene que asignar el pedido
// recuperado a la CUENTA ORIGINAL de quien pagó, nunca a la cuenta
// invitada por defecto ni a la sesión de quien ejecuta el cron (que no
// tiene ninguna). Dos casos, ambos en este archivo porque no hacen falta
// escenarios de mock.module distintos, solo datos de Payment distintos:
//   1. Compra registrada: Payment.originalUserId tiene un id real ->
//      createOrderForPayment se llama con ESE id.
//   2. Compra de invitada: Payment.originalUserId es null (nunca tuvo
//      sesión al pagar) -> createOrderForPayment se llama con GUEST_USER_ID,
//      nunca con un id inventado.
//
// Sin base real: Prisma y createOrderForPayment mockeados.

const PENDING_ORDER_INPUT = {
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
};

const PAGOS: Record<string, Record<string, unknown>> = {
  pay_registrada: {
    id: "pay_registrada",
    orderId: null,
    providerRef: "lago-registrada",
    cardLast4: "4242",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: "user_real_ficticio_123",
  },
  pay_invitada: {
    id: "pay_invitada",
    orderId: null,
    providerRef: "lago-invitada",
    cardLast4: "4242",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  },
};

const createCalls: { userId: string; input: unknown }[] = [];

mock.module("lib/orders/order-creation-core", {
  namedExports: {
    createOrderForPayment: async (userId: string, input: unknown) => {
      createCalls.push({ userId, input });
      return { id: "order_recuperado_ficticio" };
    },
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findUnique: async ({ where }: { where: { id: string } }) =>
          PAGOS[where.id] ?? null,
      },
    },
  },
});

test("recuperación de compra registrada: usa el id de la cuenta original, no la sesión del cron ni la invitada", async () => {
  const { recoverOrderForApprovedPayment } = await import(
    "./order-recovery"
  );

  const outcome = await recoverOrderForApprovedPayment("pay_registrada");

  assert.equal(outcome, "recovered");
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0]!.userId, "user_real_ficticio_123");
});

test("recuperación de compra de invitada: usa GUEST_USER_ID, nunca un id inventado", async () => {
  const { recoverOrderForApprovedPayment } = await import(
    "./order-recovery"
  );
  const { GUEST_USER_ID } = await import("lib/checkout/types");

  const outcome = await recoverOrderForApprovedPayment("pay_invitada");

  assert.equal(outcome, "recovered");
  assert.equal(createCalls.length, 2); // se acumula con el test anterior
  assert.equal(createCalls[1]!.userId, GUEST_USER_ID);
});
