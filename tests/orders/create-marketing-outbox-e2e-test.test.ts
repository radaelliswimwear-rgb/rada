// U: pedido de prueba e2e_test (ej. Order #1005) -> tampoco genera Purchase
// de marketing real.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

const mocks = setupOrdersActionMocks({
  payment: makePayment({
    marketingExclusionReason: "e2e_test",
    marketingConsentSnapshot: true,
  }),
  products: [product],
});

const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

test("U: pedido e2e_test -> MarketingEventOutbox SKIPPED, no PENDING", async () => {
  const createOrderAction = await loadAction();
  await createOrderAction(input);

  const jobs = mocks.committedMarketingEventOutbox();
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]!.status, "SKIPPED");
});
