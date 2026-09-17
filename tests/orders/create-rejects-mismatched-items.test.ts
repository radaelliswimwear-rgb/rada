// Chequeo que se CONSERVA: los productos del pedido tienen que coincidir
// con los que se reservaron/cobraron (Payment.reservedItems). Este rechazo
// no cambia con la idempotencia — y además es lo que impide que el camino
// de reintento se convierta en una forma nueva de leer el pedido de otra
// persona sabiendo solo el providerRef.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import {
  PRODUCT_ID,
  input,
  makeExistingOrder,
  makePayment,
  product,
} from "./fixtures";

const existing = makeExistingOrder();
// Se reservaron 5 unidades; el input del checkout pide 2.
const payment = makePayment({
  reservedItems: [{ productId: PRODUCT_ID, size: "M", quantity: 5 }],
});
const mocks = setupOrdersActionMocks({
  payment,
  products: [product],
  existingOrders: [existing],
});

// Import diferido: los mock.module de arriba tienen que estar instalados
// antes de cargar el módulo bajo prueba (y tsx compila estos .ts a CJS, así
// que no hay top-level await disponible).
const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

test("items que no coinciden con lo cobrado: sigue rechazando", async () => {
  const createOrderAction = await loadAction();
  await assert.rejects(
    () => createOrderAction(input),
    /no coinciden con los que se cobraron/,
  );
  assert.equal(mocks.calls.orderCreate, 0);
  assert.equal(mocks.calls.paymentUpdateMany, 0);
  assert.equal(
    mocks.committedOrders().length,
    1,
    "solo el pedido preexistente",
  );
  assert.equal(mocks.sentEmails.length, 0);
  assert.equal(mocks.committedEmailOutbox().length, 0);
});

test("el camino idempotente tampoco entrega un pedido con items que no coinciden", async () => {
  // Ahora el pago YA tiene pedido. Devolverlo sin verificar las líneas
  // reservadas convertiría el reintento en una lectura gratis para quien
  // solo conoce el providerRef — por eso el chequeo va antes de ese atajo.
  payment.orderId = existing.id;

  const createOrderAction = await loadAction();
  await assert.rejects(
    () => createOrderAction(input),
    /no coinciden con los que se cobraron/,
  );
  assert.equal(mocks.calls.orderCreate, 0);
});
