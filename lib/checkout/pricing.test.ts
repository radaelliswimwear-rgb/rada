import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  calculateCostSummary,
  qualifiesForFreeShipping,
} from "./pricing";

// Sprint 32 (política de envíos): casos A-D pedidos explícitamente para el
// umbral de envío gratis. Todo esto es lógica pura, sin DB.

test("A: subtotal justo por debajo del umbral (299899) -> envío por coordinar", () => {
  assert.equal(
    qualifiesForFreeShipping(299899, 0, DEFAULT_FREE_SHIPPING_THRESHOLD),
    false,
  );
});

test("B: subtotal exactamente en el umbral (299900) -> envío gratis", () => {
  assert.equal(
    qualifiesForFreeShipping(299900, 0, DEFAULT_FREE_SHIPPING_THRESHOLD),
    true,
  );
});

test("C: subtotal por encima del umbral -> envío gratis", () => {
  assert.equal(
    qualifiesForFreeShipping(350000, 0, DEFAULT_FREE_SHIPPING_THRESHOLD),
    true,
  );
});

test("D: un cupón reduce el valor final por debajo del umbral -> ya no califica", () => {
  // Subtotal solo (310000) superaría el umbral, pero el valor final después
  // del cupón (295000) no.
  assert.equal(
    qualifiesForFreeShipping(310000, 15000, DEFAULT_FREE_SHIPPING_THRESHOLD),
    false,
  );
});

test("D bis: un cupón que deja el valor final justo en el umbral -> sigue calificando", () => {
  assert.equal(
    qualifiesForFreeShipping(310000, 10100, DEFAULT_FREE_SHIPPING_THRESHOLD),
    true,
  );
});

test("calculateCostSummary: total = subtotal - descuento, redondeado", () => {
  const result = calculateCostSummary(299900, 100);
  assert.deepEqual(result, {
    subtotal: 299900,
    discount: 100,
    total: 299800,
  });
});

test("calculateCostSummary: sin descuento, total = subtotal", () => {
  const result = calculateCostSummary(159920);
  assert.deepEqual(result, {
    subtotal: 159920,
    discount: 0,
    total: 159920,
  });
});
