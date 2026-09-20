import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCancelConfirmationMessage,
  buildRefundConfirmationMessage,
} from "./cancellation-copy";

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
  for (const status of [
    "pending",
    "failed",
    "cancelled",
    "refunded",
    undefined,
  ]) {
    const message = buildCancelConfirmationMessage(status);
    assert.doesNotMatch(message, /pago aprobado/);
  }
});

// Auditoría go-live (sep. 2026): antes, marcar un pedido como
// "Reembolsado" -- estado tan terminal/bloqueado como "Cancelado" (ver
// lib/admin/fulfillment-rules.ts) -- no pedía ninguna confirmación.
test("buildRefundConfirmationMessage: siempre deja claro que la acción queda bloqueada", () => {
  const message = buildRefundConfirmationMessage("succeeded");
  assert.match(message, /queda bloqueada/);
  assert.match(message, /no se puede mover a ningún otro estado/);
});

test("buildRefundConfirmationMessage: sin pago aprobado, agrega advertencia extra", () => {
  const message = buildRefundConfirmationMessage("pending");
  assert.match(message, /no tiene un pago aprobado registrado/);
});

test("buildRefundConfirmationMessage: con pago aprobado, no agrega la advertencia extra", () => {
  const message = buildRefundConfirmationMessage("succeeded");
  assert.doesNotMatch(message, /no tiene un pago aprobado registrado/);
});
