// Fase 2A de analytics: MarketingEventOutbox creado atómicamente junto con
// el Order (ver lib/analytics/marketing-outbox.ts,
// createMarketingEventJobsForOrder, llamado desde createOrderForPayment).
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

const mocks = setupOrdersActionMocks({
  payment: makePayment({
    marketingExclusionReason: null,
    marketingConsentSnapshot: true,
  }),
  products: [product],
});

const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

// P. Payment SUCCEEDED + único Order -> exactamente un logical Purchase.
test("P: pedido elegible crea exactamente un MarketingEventOutbox PENDING para Meta", async () => {
  const createOrderAction = await loadAction();
  const order = await createOrderAction(input);

  const jobs = mocks.committedMarketingEventOutbox();
  assert.equal(jobs.length, 1, "un solo job, un solo logical Purchase");
  assert.equal(jobs[0]!.orderId, order.id);
  assert.equal(jobs[0]!.eventName, "PURCHASE");
  assert.equal(jobs[0]!.provider, "META");
  assert.equal(jobs[0]!.eventId, `purchase:${order.id}`);
  // ANALYTICS_SERVER_DELIVERY_ENABLED no está prendido en el entorno de
  // test -- el intento inmediato debe devolver "skipped" SIN tocar el
  // status, así que sigue PENDING (no SENT, no FAILED).
  assert.equal(jobs[0]!.status, "PENDING");
  assert.equal(jobs[0]!.attemptCount, 0);
});

// Q. Un reintento (mismo pago, ya con Order) no duplica el job.
test("Q: reintento sobre un pago que ya tiene pedido no crea un segundo job", async () => {
  const createOrderAction = await loadAction();
  const first = await createOrderAction(input);
  const retry = await createOrderAction(input);

  assert.equal(retry.id, first.id);
  const jobs = mocks.committedMarketingEventOutbox();
  assert.equal(jobs.length, 1, "el reintento no crea un segundo job");
});
