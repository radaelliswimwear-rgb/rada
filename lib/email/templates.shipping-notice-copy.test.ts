import { test } from "node:test";
import assert from "node:assert/strict";
import { adminNewOrderEmail, customerOrderConfirmationEmail } from "./templates";
import { DEFAULT_FREE_SHIPPING_THRESHOLD } from "lib/checkout/pricing";
import type { Order } from "lib/orders/types";

// Sprint 32 (política de envíos) — casos E, F y H pedidos explícitamente:
// E. email cliente por debajo del umbral muestra "por coordinar", nunca
//    "gratis"; F. email cliente en/sobre el umbral muestra "gratis", nunca
//    "por confirmar" ambiguo; H. el mismo principio para el email admin
//    (nunca llama "gratis" a un envío que hay que coordinar).
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
    payment: {
      provider: "wompi",
      transactionId: "wompi_txn_ficticio",
      last4: "4242",
      status: "succeeded",
    },
    ...overrides,
  };
}

test("E: email cliente por debajo del umbral -> 'Por coordinar', nunca 'Gratis'", () => {
  const order = buildFictitiousOrder({
    subtotal: 199900,
    total: 199900,
  });
  const { html } = customerOrderConfirmationEmail(
    order,
    DEFAULT_FREE_SHIPPING_THRESHOLD,
  );
  assert.match(html, />Por coordinar</);
  assert.doesNotMatch(html, />Gratis</);
  assert.match(
    html,
    /El costo del envío no está incluido en este pago/,
    "debe explicar que el envío se coordina después",
  );
});

test("F: email cliente en/sobre el umbral -> 'Gratis', nunca 'Por coordinar' ni 'Por confirmar'", () => {
  const order = buildFictitiousOrder({
    subtotal: DEFAULT_FREE_SHIPPING_THRESHOLD,
    total: DEFAULT_FREE_SHIPPING_THRESHOLD,
  });
  const { html } = customerOrderConfirmationEmail(
    order,
    DEFAULT_FREE_SHIPPING_THRESHOLD,
  );
  assert.match(html, />Gratis</);
  assert.doesNotMatch(html, /Por coordinar/);
  assert.doesNotMatch(html, /Por confirmar/);
  assert.match(
    html,
    /Tu pedido califica para envío estándar gratis/,
    "debe confirmar explícitamente el envío gratis",
  );
});

test("customerOrderConfirmationEmail sin threshold explícito usa el default centralizado (compatibilidad hacia atrás)", () => {
  const order = buildFictitiousOrder({
    subtotal: DEFAULT_FREE_SHIPPING_THRESHOLD,
    total: DEFAULT_FREE_SHIPPING_THRESHOLD,
  });
  const { html } = customerOrderConfirmationEmail(order);
  assert.match(html, />Gratis</);
});

test("H: email admin por debajo del umbral -> 'POR COORDINAR CON CLIENTA', nunca 'GRATIS'", () => {
  const order = buildFictitiousOrder({
    subtotal: 199900,
    total: 199900,
  });
  const { html } = adminNewOrderEmail(order, DEFAULT_FREE_SHIPPING_THRESHOLD);
  assert.match(html, />POR COORDINAR CON CLIENTA</);
  assert.doesNotMatch(html, />GRATIS</);
});

test("H: email admin en/sobre el umbral -> 'GRATIS'", () => {
  const order = buildFictitiousOrder({
    subtotal: DEFAULT_FREE_SHIPPING_THRESHOLD,
    total: DEFAULT_FREE_SHIPPING_THRESHOLD,
  });
  const { html } = adminNewOrderEmail(order, DEFAULT_FREE_SHIPPING_THRESHOLD);
  assert.match(html, />GRATIS</);
  assert.doesNotMatch(html, /POR COORDINAR/);
});

test("el snapshot del umbral congela la decisión histórica del email, aunque el umbral vigente cambie después", () => {
  // Pedido que calificaba para envío gratis con el umbral vigente al momento
  // del pedido (250000), aunque un umbral MÁS ALTO más nuevo ya no lo haría
  // calificar hoy -- el email debe reflejar el umbral histórico (snapshot),
  // no el actual.
  const order = buildFictitiousOrder({
    subtotal: 250000,
    total: 250000,
  });
  const { html } = customerOrderConfirmationEmail(order, 200000);
  assert.match(
    html,
    />Gratis</,
    "debe usar el umbral histórico (200000) pasado explícitamente, no el default actual",
  );
});
