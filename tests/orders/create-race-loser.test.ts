// Carrera PERDIDA: al entrar, el pago todavía no tenía pedido (así que la
// llamada pasa el chequeo inicial y abre la transacción), pero otra llamada
// concurrente lo reclama justo antes del updateMany condicional.
//
// Lo que se verifica acá es exactamente el bug que se está cerrando: la
// perdedora NO debe dejar su propio Order en la tabla. Antes, las dos
// llamadas creaban su Order completo y el segundo UPDATE pisaba el orderId
// del primero, dejando un pedido huérfano.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makeExistingOrder, makePayment, product } from "./fixtures";

const winnerOrder = makeExistingOrder("order-ganador");
const payment = makePayment(); // orderId null al momento de la lectura inicial

const mocks = setupOrdersActionMocks({
  payment,
  products: [product],
  existingOrders: [winnerOrder],
  onBeforeClaim: (row) => {
    // La ganadora commiteó mientras esta transacción estaba en vuelo: en
    // Postgres esto es la fila ya actualizada que ve la perdedora cuando se
    // suelta el lock y se reevalúa el WHERE.
    row.orderId = winnerOrder.id;
  },
});

// Import diferido: los mock.module de arriba tienen que estar instalados
// antes de cargar el módulo bajo prueba (y tsx compila estos .ts a CJS, así
// que no hay top-level await disponible).
const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

test("carrera perdida: revierte lo suyo y devuelve el pedido de la ganadora", async () => {
  const createOrderAction = await loadAction();
  const order = await createOrderAction(input);

  // (a) Devuelve el pedido de la ganadora, sin lanzar error.
  assert.equal(order.id, winnerOrder.id);
  assert.equal(order.orderNumber, 991);

  // (b) Intentó crear y reclamar, pero el reclamo no ganó.
  assert.equal(mocks.calls.orderCreate, 1, "alcanzó a crear dentro de la tx");
  assert.equal(mocks.calls.paymentUpdateMany, 1);
  assert.equal(mocks.calls.transactionsCommitted, 0, "no commiteó nada");
  assert.equal(
    mocks.calls.transactionsRolledBack,
    1,
    "revirtió su transacción",
  );

  // (c) Lo esencial: NO quedó ningún Order huérfano. Solo sobrevive el de
  // la ganadora — el que la perdedora creó dentro de la transacción se fue
  // con el rollback.
  const committed = mocks.committedOrders();
  assert.equal(committed.length, 1, "un solo pedido en la tabla");
  assert.equal(committed[0]!.id, winnerOrder.id);

  // (d) El pago sigue apuntando al pedido de la ganadora, no al de la
  // perdedora: el updateMany condicional no lo pisó.
  assert.equal(payment.orderId, winnerOrder.id);

  // (e) La perdedora no deja ningún EmailOutbox huérfano -- sus filas se
  // crearon dentro de la MISMA transacción que revirtió, así que
  // desaparecen con ella (igual que su propio Order) -- y tampoco manda
  // ningún correo real, ni al admin ni a la clienta.
  assert.equal(
    mocks.committedEmailOutbox().length,
    0,
    "el rollback de la perdedora no debe dejar EmailOutbox huérfanos",
  );
  assert.equal(mocks.sentEmails.length, 0);
});
