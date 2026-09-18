import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isFulfillmentTransitionAllowed,
  isInProgressFulfillmentStatus,
  orderNeedsRefundReview,
  paymentPendingRefundReview,
  resolveFreeShippingThresholdSnapshot,
} from "./fulfillment-rules";

// P0 admin operativo (auditoría de septiembre 2026): lógica pura, sin DB ni
// cookies() reales -- ver el comentario en fulfillment-rules.ts.

// B. "Pedidos en proceso" debe derivarse de fulfillmentStatus, no del
// Order.status legado.
test("B: estados activos cuentan como en proceso", () => {
  for (const status of [
    "PENDIENTE_POR_PREPARAR",
    "PREPARANDO",
    "CLIENTE_CONTACTADO",
    "ENTREGA_COORDINADA",
    "DESPACHADO",
  ] as const) {
    assert.equal(isInProgressFulfillmentStatus(status), true, status);
  }
});

test("B: estados terminales NO cuentan como en proceso", () => {
  for (const status of ["ENTREGADO", "CANCELADO", "REEMBOLSADO"] as const) {
    assert.equal(isInProgressFulfillmentStatus(status), false, status);
  }
});

// E. Pendientes de reembolso: Payment SUCCEEDED + fulfillment cancelado o
// reembolsado.
test("E: Payment SUCCEEDED + CANCELADO -> pendiente de revisión", () => {
  assert.equal(paymentPendingRefundReview("CANCELADO", "SUCCEEDED"), true);
});

test("E: Payment SUCCEEDED + REEMBOLSADO -> pendiente de revisión (equivalente real)", () => {
  assert.equal(paymentPendingRefundReview("REEMBOLSADO", "SUCCEEDED"), true);
});

test("E: Payment PENDING + CANCELADO -> no hay plata cobrada, no aplica", () => {
  assert.equal(paymentPendingRefundReview("CANCELADO", "PENDING"), false);
});

test("E: Payment FAILED + CANCELADO -> no aplica", () => {
  assert.equal(paymentPendingRefundReview("CANCELADO", "FAILED"), false);
});

test("E: Payment SUCCEEDED + fulfillment activo -> no aplica", () => {
  assert.equal(
    paymentPendingRefundReview("PREPARANDO", "SUCCEEDED"),
    false,
  );
});

test("E: sin Payment (null) -> no aplica", () => {
  assert.equal(paymentPendingRefundReview("CANCELADO", null), false);
  assert.equal(paymentPendingRefundReview("CANCELADO", undefined), false);
});

// Equivalente de dominio (español) de paymentPendingRefundReview, usado por
// la UI del panel (order-detail.tsx).
test("dominio: Cancelado + succeeded -> necesita revisión", () => {
  assert.equal(orderNeedsRefundReview("Cancelado", "succeeded"), true);
});

test("dominio: Reembolsado + succeeded -> necesita revisión", () => {
  assert.equal(orderNeedsRefundReview("Reembolsado", "succeeded"), true);
});

test("dominio: Cancelado + pending -> no necesita revisión", () => {
  assert.equal(orderNeedsRefundReview("Cancelado", "pending"), false);
});

test("dominio: Entregado + succeeded -> no necesita revisión", () => {
  assert.equal(orderNeedsRefundReview("Entregado", "succeeded"), false);
});

// L. Transiciones bloqueadas/permitidas.
test("L: CANCELADO -> PROCESANDO (estado activo) bloqueado", () => {
  assert.equal(
    isFulfillmentTransitionAllowed("CANCELADO", "PREPARANDO"),
    false,
  );
});

test("L: CANCELADO -> CANCELADO (no-op) permitido", () => {
  assert.equal(
    isFulfillmentTransitionAllowed("CANCELADO", "CANCELADO"),
    true,
  );
});

test("L: REEMBOLSADO -> cualquier estado activo bloqueado", () => {
  assert.equal(
    isFulfillmentTransitionAllowed("REEMBOLSADO", "PENDIENTE_POR_PREPARAR"),
    false,
  );
});

test("L: REEMBOLSADO -> REEMBOLSADO (no-op) permitido", () => {
  assert.equal(
    isFulfillmentTransitionAllowed("REEMBOLSADO", "REEMBOLSADO"),
    true,
  );
});

test("L: ENTREGADO -> CANCELADO bloqueado (absurdo operativo)", () => {
  assert.equal(
    isFulfillmentTransitionAllowed("ENTREGADO", "CANCELADO"),
    false,
  );
});

test("L: ENTREGADO -> REEMBOLSADO permitido (devolución/garantía real)", () => {
  assert.equal(
    isFulfillmentTransitionAllowed("ENTREGADO", "REEMBOLSADO"),
    true,
  );
});

test("L: transiciones normales del flujo activo permitidas", () => {
  assert.equal(
    isFulfillmentTransitionAllowed("PREPARANDO", "DESPACHADO"),
    true,
  );
  assert.equal(
    isFulfillmentTransitionAllowed(
      "PENDIENTE_POR_PREPARAR",
      "CLIENTE_CONTACTADO",
    ),
    true,
  );
  assert.equal(
    isFulfillmentTransitionAllowed("DESPACHADO", "ENTREGADO"),
    true,
  );
});

// Umbral histórico de envío gratis.
test("snapshot propio de Order tiene prioridad sobre el de EmailOutbox", () => {
  assert.equal(resolveFreeShippingThresholdSnapshot(299900, 250000), 299900);
});

test("sin snapshot propio, cae al de EmailOutbox (pedido previo a la migración)", () => {
  assert.equal(resolveFreeShippingThresholdSnapshot(null, 250000), 250000);
});

test("sin ningún snapshot -> null, nunca la config actual", () => {
  assert.equal(resolveFreeShippingThresholdSnapshot(null, null), null);
  assert.equal(resolveFreeShippingThresholdSnapshot(undefined, undefined), null);
});
