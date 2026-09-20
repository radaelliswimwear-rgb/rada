import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCouponRevalidationOutcome } from "./coupon-revalidation";

test("cupón ya no válido contra el subtotal nuevo -- se limpia", () => {
  const outcome = resolveCouponRevalidationOutcome(
    { code: "VERANO10", discount: 10000 },
    {
      success: false,
      error: "El subtotal no alcanza el mínimo para este cupón.",
    },
  );
  assert.deepEqual(outcome, { action: "clear" });
});

test("cupón sigue válido pero el descuento cambió (subtotal más chico) -- se actualiza", () => {
  const outcome = resolveCouponRevalidationOutcome(
    { code: "VERANO10", discount: 10000 },
    { success: true, code: "VERANO10", discount: 5000 },
  );
  assert.deepEqual(outcome, {
    action: "update",
    code: "VERANO10",
    discount: 5000,
  });
});

test("cupón sigue válido y el descuento es exactamente el mismo -- no hace nada", () => {
  const outcome = resolveCouponRevalidationOutcome(
    { code: "VERANO10", discount: 10000 },
    { success: true, code: "VERANO10", discount: 10000 },
  );
  assert.deepEqual(outcome, { action: "keep" });
});

test("cupón porcentual con descuento mayor (subtotal más grande) -- se actualiza también hacia arriba", () => {
  const outcome = resolveCouponRevalidationOutcome(
    { code: "VERANO10", discount: 10000 },
    { success: true, code: "VERANO10", discount: 20000 },
  );
  assert.deepEqual(outcome, {
    action: "update",
    code: "VERANO10",
    discount: 20000,
  });
});
