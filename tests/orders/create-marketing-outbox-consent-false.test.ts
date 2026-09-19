// I (checklist Meta CAPI, sep. 2026): consentimiento de marketing false (y
// SIN exclusión de tráfico) -> tampoco debe entregarse. Complementa a T/U
// (create-marketing-outbox-excluded.test.ts / -e2e-test.test.ts), que
// prueban la otra mitad de isMetaCapiAllowedFromSnapshot
// (marketingExclusionReason) -- este archivo aísla la mitad del
// consentimiento (marketingConsentSnapshot), con exclusión en null a
// propósito para que un fallo acá no pueda confundirse con el de aquellos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

const mocks = setupOrdersActionMocks({
  payment: makePayment({
    marketingExclusionReason: null,
    marketingConsentSnapshot: false,
  }),
  products: [product],
});

test("I: marketingConsentSnapshot=false (sin exclusión) -> MarketingEventOutbox SKIPPED, nunca se entrega", async () => {
  const { createOrderAction } = await import("lib/orders/orders-actions");
  await createOrderAction(input);

  const jobs = mocks.committedMarketingEventOutbox();
  assert.equal(jobs.length, 1, "el job se crea igual, para dejar rastro");
  assert.equal(jobs[0]!.status, "SKIPPED");
});
