import { test } from "node:test";
import assert from "node:assert/strict";
import { customerOrderConfirmationEmail } from "./templates";
import type { Order } from "lib/orders/types";

// PROPUESTA (rama propuesta/categorias-colecciones-NO-APLICAR) — corrección
// posterior sobre el texto de customerOrderConfirmationEmail para 3 estados
// de pago. No repite la verificación de los otros 4 estados (whatsapp,
// aprobado, simulado, sin_pago): su copy no cambió en esta ronda y ya se
// probó en la ronda anterior. customerOrderConfirmationEmail es una función
// pura (no toca Prisma ni ningún servicio) — no hace falta ningún mock.
//
// Datos 100% ficticios, nunca se envía ningún correo real.

const FICTITIOUS_ITEMS: Order["items"] = [
  {
    productId: "prod_ficticio_1",
    name: "Traje de Baño Ficticio Modelo Demo",
    image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    size: "M",
    quantity: 1,
    priceValue: 180000,
    sku: "FICTICIO-001",
    color: "Negro",
    collection: "Colección de Prueba",
  },
];

function buildFictitiousOrder(overrides: Partial<Order>): Order {
  const itemsTotal = FICTITIOUS_ITEMS.reduce(
    (sum, item) => sum + item.priceValue * item.quantity,
    0,
  );
  return {
    id: "order_ficticio_test",
    orderNumber: 888888,
    userId: "user_ficticio_test",
    date: new Date(0).toISOString(),
    status: "Procesando",
    fulfillmentStatus: "Pendiente por preparar",
    items: FICTITIOUS_ITEMS,
    total: itemsTotal,
    subtotal: itemsTotal,
    shippingCost: 0,
    tax: 0,
    shippingMethod: "standard",
    ...overrides,
  };
}

test("customerOrderConfirmationEmail — pendiente: usa exactamente la frase pedida, sin prometer nada más", () => {
  const order = buildFictitiousOrder({
    payment: {
      provider: "wompi",
      transactionId: "wompi_txn_ficticio_pendiente",
      last4: "4242",
      status: "pending",
    },
  });
  const { html } = customerOrderConfirmationEmail(order);
  assert.match(html, /Aún no tenemos confirmación del pago/);
});

test("customerOrderConfirmationEmail — rechazado/cancelado: informa el estado sin asegurar que no hubo cobro", () => {
  for (const status of ["failed", "cancelled"] as const) {
    const order = buildFictitiousOrder({
      payment: {
        provider: "wompi",
        transactionId: `wompi_txn_ficticio_${status}`,
        last4: "4242",
        status,
      },
    });
    const { html } = customerOrderConfirmationEmail(order);
    assert.match(
      html,
      /quedó rechazado o cancelado/,
      `debe informar el estado para status=${status}`,
    );
    assert.doesNotMatch(
      html,
      /no se realizó ning[uú]n cobro/i,
      `no debe afirmar ausencia de cobro para status=${status}`,
    );
  }
});

test("customerOrderConfirmationEmail — reembolsado: describe un cambio de estado interno, no una devolución efectiva confirmada", () => {
  const order = buildFictitiousOrder({
    payment: {
      provider: "wompi",
      transactionId: "wompi_txn_ficticio_reembolsado",
      last4: "4242",
      status: "refunded",
    },
  });
  const { html, subject } = customerOrderConfirmationEmail(order);
  assert.match(
    html,
    /se actualizó a "reembolsado" en nuestro sistema/,
    "debe describir un cambio de estado, no un hecho financiero confirmado",
  );
  assert.doesNotMatch(
    html,
    /tu pedido[^<]*fue reembolsado/i,
    "no debe afirmar que el reembolso ya se efectivizó",
  );
  assert.match(subject, /Reembolso registrado/);
});
