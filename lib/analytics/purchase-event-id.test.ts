import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGa4TransactionId, buildPurchaseEventId } from "./purchase-event-id";

// R. Meta browser/server usan mismo event_id -- se prueba acá que la
// función es determinística (misma entrada -> misma salida siempre), que
// es justamente lo que garantiza que browser y server calculen igual sin
// coordinarse por la red.
test("R: buildPurchaseEventId es determinístico para el mismo orderId", () => {
  const a = buildPurchaseEventId("order_abc123");
  const b = buildPurchaseEventId("order_abc123");
  assert.equal(a, b);
  assert.equal(a, "purchase:order_abc123");
});

test("R: recargar la página de confirmación recalcula el MISMO id (no uno nuevo)", () => {
  const first = buildPurchaseEventId("order_xyz");
  const reload = buildPurchaseEventId("order_xyz");
  assert.equal(first, reload);
});

test("órdenes distintas producen event_id distintos", () => {
  assert.notEqual(buildPurchaseEventId("order_1"), buildPurchaseEventId("order_2"));
});

// S. GA4 Purchase mismo transaction_id -- orderNumber es la fuente estable.
test("S: buildGa4TransactionId usa orderNumber tal cual, como string", () => {
  assert.equal(buildGa4TransactionId(1005), "1005");
});

test("S: es determinístico para el mismo orderNumber (recarga no genera otro)", () => {
  assert.equal(buildGa4TransactionId(1017), buildGa4TransactionId(1017));
});
