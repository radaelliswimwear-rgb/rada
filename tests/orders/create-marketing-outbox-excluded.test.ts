// T/U: pedidos excluidos (tráfico interno / prueba e2e) no generan un
// Purchase de marketing real -- el job se crea igual (para dejar rastro),
// pero con status SKIPPED, nunca PENDING.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

const mocks = setupOrdersActionMocks({
  payment: makePayment({
    marketingExclusionReason: "internal_traffic",
    marketingConsentSnapshot: true,
  }),
  products: [product],
});

const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

test("T: pedido de tráfico interno -> MarketingEventOutbox SKIPPED, no PENDING", async () => {
  const createOrderAction = await loadAction();
  await createOrderAction(input);

  const jobs = mocks.committedMarketingEventOutbox();
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]!.status, "SKIPPED");
});
