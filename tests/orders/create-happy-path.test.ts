// Caso feliz: un pago aprobado que todavía no tiene pedido crea uno.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

const mocks = setupOrdersActionMocks({
  payment: makePayment(),
  products: [product],
});

// Import diferido a propósito: los mock.module de arriba tienen que estar
// instalados ANTES de que se cargue el módulo bajo prueba. (No se usa
// top-level await porque tsx compila estos .ts a CJS — el repo no declara
// "type": "module".)
const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

test("pago sin pedido: crea el pedido, reclama el pago y avisa una vez", async () => {
  const createOrderAction = await loadAction();
  const order = await createOrderAction(input);

  assert.equal(mocks.calls.orderCreate, 1);
  assert.equal(mocks.calls.paymentUpdateMany, 1, "el enlace usa updateMany");
  assert.equal(mocks.calls.transactionsCommitted, 1);
  assert.equal(mocks.calls.transactionsRolledBack, 0);

  const committed = mocks.committedOrders();
  assert.equal(committed.length, 1, "queda exactamente un pedido");
  assert.equal(order.id, committed[0]!.id);

  // Los importes siguen derivándose del Payment ya cobrado, no del input.
  assert.equal(order.total, 360000);
  assert.equal(order.subtotal, 360000);
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0]!.quantity, 2);
  assert.equal(order.items[0]!.sku, "RAD-BL-001");
  assert.equal(order.items[0]!.collection, "Bikinis");

  // El snapshot de pago sale de la fila Payment, no de input.payment.
  assert.equal(order.payment?.provider, "wompi");
  assert.equal(order.payment?.status, "succeeded");

  // Historial logístico inicial: una sola vez.
  assert.equal(mocks.calls.orderStatusEventCreate, 1);

  // Outbox (Sprint de confiabilidad de emails): un EmailOutbox por
  // destinatario -- admin ×N (lo que devuelva getAdminNotificationEmails(),
  // sin asumir un número fijo) + 1 de la clienta -- y el intento inmediato
  // manda los 3 de una sola vez (mockModule de sendEmail siempre "éxito").
  const { getAdminNotificationEmails } = await import(
    "lib/email/admin-recipients"
  );
  const adminRecipients = getAdminNotificationEmails();
  const jobs = mocks.committedEmailOutbox();
  assert.equal(jobs.length, adminRecipients.length + 1);
  const adminJobs = jobs.filter((j) => j.type === "ADMIN_NEW_ORDER");
  const customerJobs = jobs.filter(
    (j) => j.type === "CUSTOMER_ORDER_CONFIRMATION",
  );
  assert.equal(adminJobs.length, adminRecipients.length);
  assert.equal(customerJobs.length, 1);
  assert.deepEqual(
    adminJobs.map((j) => j.recipientNormalized).sort(),
    [...adminRecipients].sort(),
  );
  assert.equal(customerJobs[0]!.recipient, input.shippingAddress.email);
  for (const job of jobs) {
    assert.equal(
      job.status,
      "SENT",
      "el intento inmediato debe marcarlos SENT",
    );
    assert.ok(job.sentAt);
  }

  assert.equal(
    mocks.sentEmails.length,
    adminRecipients.length + 1,
    "una sola ronda real de envíos",
  );
});
