// Diagnóstico E2E #1006 (sep. 2026): eventSourceUrl nunca se estaba
// llenando en MarketingEventOutbox.payloadSnapshot -- createOrderForPayment
// nunca lo pasaba a createMarketingEventJobsForOrder (ver
// lib/orders/order-creation-core.ts). Meta documenta event_source_url como
// necesario para eventos con action_source:"website" -- muy probable causa
// (o co-causa) real del fallo de Meta CAPI. Archivo propio (no
// create-marketing-outbox.test.ts) porque necesita fijar APP_BASE_URL ANTES
// de crear el pedido, y ese archivo comparte el mismo Payment/Order fixture
// entre sus dos tests (un tercer test ahí reusaría el job ya creado sin
// APP_BASE_URL, no probaría nada nuevo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

process.env.APP_BASE_URL = "https://radaelliswimwear.example";

const mocks = setupOrdersActionMocks({
  payment: makePayment({
    marketingExclusionReason: null,
    marketingConsentSnapshot: true,
  }),
  products: [product],
});

test("W: con APP_BASE_URL configurada, el job de Meta CAPI lleva event_source_url = la página de confirmación real de ESTE pedido", async () => {
  const { createOrderAction } = await import("lib/orders/orders-actions");
  const order = await createOrderAction(input);

  const jobs = mocks.committedMarketingEventOutbox();
  assert.equal(jobs.length, 1);
  const snapshot = jobs[0]!.payloadSnapshot as {
    eventSourceUrl: string | null;
  };
  assert.equal(
    snapshot.eventSourceUrl,
    `https://radaelliswimwear.example/checkout/confirmacion/${order.id}`,
    "debe ser la MISMA página que ve el Pixel del navegador para este pedido, con el id real",
  );
});
