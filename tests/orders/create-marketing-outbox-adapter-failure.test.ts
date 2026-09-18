// V. fallo adapter Google/Meta -> Order sigue creándose. Simula un fallo
// inesperado de red hacia Meta CAPI (el adapter real, lib/analytics/
// adapters/meta-capi.ts, nunca lanza -- esto prueba la red de seguridad de
// todas formas, mismo criterio defensivo que ya cubre EmailOutbox).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../mock-module";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

process.env.ANALYTICS_RUNTIME_ENABLED = "true";
process.env.ANALYTICS_SERVER_DELIVERY_ENABLED = "true";

mockModule("lib/analytics/adapters/meta-capi", {
  sendMetaCapiPurchase: async () => {
    throw new Error("fallo simulado de red hacia Meta CAPI");
  },
});

const mocks = setupOrdersActionMocks({
  payment: makePayment({
    marketingExclusionReason: null,
    marketingConsentSnapshot: true,
  }),
  products: [product],
});

const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

test("V: fallo del adapter de Meta CAPI no impide que el Order se cree", async () => {
  const createOrderAction = await loadAction();
  const order = await createOrderAction(input);

  assert.ok(order.id, "el Order se creó igual, a pesar del fallo del adapter");
  assert.equal(mocks.calls.transactionsCommitted, 1);
  assert.equal(mocks.calls.transactionsRolledBack, 0);

  const jobs = mocks.committedMarketingEventOutbox();
  assert.equal(jobs.length, 1, "el job se creó dentro de la transacción, igual");
});
