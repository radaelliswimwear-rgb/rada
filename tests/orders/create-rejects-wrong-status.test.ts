// Chequeo que se CONSERVA: un pago que todavía no fue aprobado no puede
// generar un pedido. Se sigue exigiendo solo en el camino de creación (un
// pago que ya tiene pedido se lee sin volver a pedir estado — ver
// create-retry-after-success.test.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

const payment = makePayment({ status: "PENDING" });
const mocks = setupOrdersActionMocks({ payment, products: [product] });

// Import diferido: los mock.module de arriba tienen que estar instalados
// antes de cargar el módulo bajo prueba (y tsx compila estos .ts a CJS, así
// que no hay top-level await disponible).
const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

test("pago con tarjeta no aprobado: sigue rechazando", async () => {
  const createOrderAction = await loadAction();
  await assert.rejects(
    () => createOrderAction(input),
    /todavía no fue aprobado/,
  );
  assert.equal(mocks.calls.orderCreate, 0);
  assert.equal(mocks.calls.paymentUpdateMany, 0);
  assert.equal(mocks.committedOrders().length, 0);
  assert.equal(mocks.notifications.length, 0);
});

test("pago de WhatsApp que ya dejó de estar pendiente: sigue rechazando", async () => {
  payment.provider = "WHATSAPP";
  payment.status = "CANCELLED";
  const createOrderAction = await loadAction();
  await assert.rejects(() => createOrderAction(input), /ya no está pendiente/);
  assert.equal(mocks.calls.orderCreate, 0);
});

test("pago inexistente: sigue rechazando", async () => {
  const createOrderAction = await loadAction();
  await assert.rejects(
    () =>
      createOrderAction({
        ...input,
        payment: { ...input.payment, transactionId: "ref-que-no-existe" },
      }),
    /No se encontró el pago/,
  );
  assert.equal(mocks.calls.orderCreate, 0);
});
