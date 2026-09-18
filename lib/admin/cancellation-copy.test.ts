import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCancelConfirmationMessage } from "./cancellation-copy";

test("siempre deja claro que cancelar no reembolsa Wompi", () => {
  const message = buildCancelConfirmationMessage(undefined);
  assert.match(message, /NO reembolsa automáticamente el pago de Wompi/);
});

test("Payment succeeded agrega advertencia extra de reembolso pendiente", () => {
  const message = buildCancelConfirmationMessage("succeeded");
  assert.match(message, /pago aprobado/);
  assert.match(message, /resolver el reembolso por separado/);
});

test("Payment no succeeded (pending/failed/etc) no agrega la advertencia extra", () => {
  for (const status of ["pending", "failed", "cancelled", "refunded", undefined]) {
    const message = buildCancelConfirmationMessage(status);
    assert.doesNotMatch(message, /pago aprobado/);
  }
});
