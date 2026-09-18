import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos) — startWompiHostedCheckoutAction
// captura la sesión real de quien está pagando (si la hay) en el momento
// de crear el Payment, como Payment.originalUserId — la única fuente
// confiable de identidad que el cron de pagos vencidos puede usar más
// adelante para recuperar un pedido sin sesión (ver
// lib/orders/order-recovery.ts). Dos casos: con sesión real, y de
// invitada (sin sesión) -> originalUserId debe quedar null, nunca un valor
// inventado.
//
// Sin base real ni red.

process.env.WOMPI_PUBLIC_KEY = "pub_test_ficticio";
process.env.WOMPI_PRIVATE_KEY = "prv_test_ficticio";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_ficticio";

const createCalls: { data: Record<string, unknown> }[] = [];
let sessionUser: { id: string } | null = { id: "user_real_ficticio_456" };

mock.module("lib/auth/session", {
  namedExports: { getCurrentUser: async () => sessionUser },
});
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
    reserveAndPriceCheckout: async () => ({
      total: 370000,
      couponCode: null,
      reservedItems: [{ productId: "prod_1", size: "M", quantity: 1 }],
    }),
    releaseReservedStock: async () => undefined,
    // P0 (sep. 2026): "held" preserva el comportamiento previo de este test.
    reclaimReleasedStockForLateApproval: async () => "held" as const,
  },
});
mock.module("./config", {
  namedExports: { ACTIVE_PAYMENT_PROVIDER: "wompi" },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findUnique: async () => null, // sin intento previo que reusar
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createCalls.push({ data });
          return {
            id: "pay_ficticio",
            providerRef: data.providerRef,
            amount: data.amount,
            currency: data.currency,
            createdAt: new Date(),
          };
        },
      },
    },
  },
});

const PENDING_ORDER_INPUT = {
  items: [
    {
      productId: "prod_1",
      name: "Traje ficticio",
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      size: "M",
      quantity: 1,
      priceValue: 370000,
    },
  ],
  shippingAddress: {
    fullName: "Clienta Ficticia",
    email: "clienta@ejemplo.test",
    street: "Calle Falsa 123",
    neighborhood: "Barrio",
    city: "Bogotá",
    province: "Cundinamarca",
    country: "Colombia",
    phone: "+573000000000",
  },
  shippingMethod: "standard",
};

test("con sesión real: Payment.originalUserId queda con el id de esa cuenta", async () => {
  const { startWompiHostedCheckoutAction } = await import("./payments-actions");

  const result = await startWompiHostedCheckoutAction(
    [{ productId: "prod_1", size: "M", quantity: 1 }],
    null,
    "11111111-1111-4111-8111-111111111111",
    PENDING_ORDER_INPUT,
  );

  assert.equal(result.success, true);
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0]!.data.originalUserId, "user_real_ficticio_456");
});

test("de invitada (sin sesión): Payment.originalUserId queda null, nunca un valor inventado", async () => {
  sessionUser = null;
  const { startWompiHostedCheckoutAction } = await import("./payments-actions");

  const result = await startWompiHostedCheckoutAction(
    [{ productId: "prod_1", size: "M", quantity: 1 }],
    null,
    "22222222-2222-4222-8222-222222222222",
    PENDING_ORDER_INPUT,
  );

  assert.equal(result.success, true);
  assert.equal(createCalls.length, 2);
  assert.equal(createCalls[1]!.data.originalUserId, null);
});
