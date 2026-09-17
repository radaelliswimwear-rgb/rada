// Reintento POSTERIOR a un éxito: el pago ya tiene pedido. Antes tiraba
// "Este pago ya generó un pedido."; ahora debe devolver el pedido existente
// sin crear nada y sin volver a avisar al admin.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import {
  PROVIDER_REF,
  input,
  makeExistingOrder,
  makePayment,
  product,
} from "./fixtures";

const existing = makeExistingOrder();
const payment = makePayment({ orderId: existing.id });
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

test("pago que ya tiene pedido: devuelve ese pedido, no lanza, no crea otro", async () => {
  const createOrderAction = await loadAction();
  const order = await createOrderAction(input);

  assert.equal(order.id, existing.id, "devuelve el pedido que ya existía");
  assert.equal(order.orderNumber, 991);
  assert.equal(order.items.length, 1);
  assert.equal(order.total, 360000);
  assert.equal(order.payment?.transactionId, PROVIDER_REF);

  assert.equal(mocks.calls.orderCreate, 0, "no vuelve a crear un pedido");
  assert.equal(mocks.calls.transactionsCommitted, 0, "ni abre transacción");
  assert.equal(mocks.calls.transactionsRolledBack, 0);
  assert.equal(mocks.committedOrders().length, 1);
  assert.equal(
    mocks.committedEmailOutbox().length,
    0,
    "un reintento sobre un pedido ya existente no crea ningún EmailOutbox nuevo",
  );
  assert.equal(mocks.sentEmails.length, 0, "no reenvía ningún correo");
});

test("el reintento sigue funcionando aunque el pago ya no esté aprobado", async () => {
  // Un webhook posterior de Wompi puede mover el estado del pago después de
  // creado el pedido (reembolso, disputa). Eso no debe hacer fallar la
  // lectura de algo que ya quedó confirmado en la base.
  payment.status = "REFUNDED";

  const createOrderAction = await loadAction();
  const orderAgain = await createOrderAction(input);

  assert.equal(orderAgain.id, existing.id);
  assert.equal(orderAgain.payment?.status, "refunded");
  assert.equal(mocks.calls.orderCreate, 0);
  assert.equal(mocks.committedEmailOutbox().length, 0);
  assert.equal(mocks.sentEmails.length, 0);
});
