// Fase 2B (auditoría de pre-activación): antes de este archivo,
// recordPaymentFailedEvent no tenía ningún test -- la auditoría encontró que
// escribía AnalyticsEvent sin mirar ANALYTICS_RUNTIME_ENABLED ni el
// consentimiento de analytics de la clienta (solo miraba tráfico interno).
// Estos tests fijan el comportamiento correcto: runtime apagado o sin
// consentimiento real de analytics -> nunca escribe, igual que cualquier
// otro destino de esta fase.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../../tests/mock-module";

type RecordedCall = Parameters<
  typeof import("./store").recordAnalyticsEvent
>[0];

const recorded: RecordedCall[] = [];
let shouldThrow = false;

mockModule("lib/analytics/store", {
  recordAnalyticsEvent: async (input: RecordedCall) => {
    if (shouldThrow) throw new Error("fallo simulado escribiendo AnalyticsEvent");
    recorded.push(input);
  },
});

const loadRecordPaymentFailedEvent = async () =>
  (await import("./payment-failed")).recordPaymentFailedEvent;

function basePayment() {
  return {
    amount: 500000, // centavos
    currency: "COP",
    failureReason: "Fondos insuficientes",
    marketingExclusionReason: null as string | null,
    attributionSnapshot: null,
    analyticsConsentSnapshot: true as boolean | null,
  };
}

test("runtime apagado -> nunca escribe, aunque consentimiento y exclusión digan que sí correspondería", async () => {
  recorded.length = 0;
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
  const recordPaymentFailedEvent = await loadRecordPaymentFailedEvent();
  await recordPaymentFailedEvent(basePayment());
  assert.equal(recorded.length, 0);
});

test("runtime prendido pero tráfico excluido (interno/e2e_test) -> no escribe", async () => {
  recorded.length = 0;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  const recordPaymentFailedEvent = await loadRecordPaymentFailedEvent();
  await recordPaymentFailedEvent({
    ...basePayment(),
    marketingExclusionReason: "internal_traffic",
  });
  assert.equal(recorded.length, 0);
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});

test("runtime prendido, no excluido, pero analyticsConsentSnapshot=null (no se pudo determinar) -> no escribe (fail-closed)", async () => {
  recorded.length = 0;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  const recordPaymentFailedEvent = await loadRecordPaymentFailedEvent();
  await recordPaymentFailedEvent({
    ...basePayment(),
    analyticsConsentSnapshot: null,
  });
  assert.equal(recorded.length, 0);
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});

test("runtime prendido, no excluido, analyticsConsentSnapshot=false -> no escribe", async () => {
  recorded.length = 0;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  const recordPaymentFailedEvent = await loadRecordPaymentFailedEvent();
  await recordPaymentFailedEvent({
    ...basePayment(),
    analyticsConsentSnapshot: false,
  });
  assert.equal(recorded.length, 0);
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});

test("runtime prendido, no excluido, analyticsConsentSnapshot=true -> escribe con los campos correctos", async () => {
  recorded.length = 0;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  const recordPaymentFailedEvent = await loadRecordPaymentFailedEvent();
  await recordPaymentFailedEvent(basePayment());
  assert.equal(recorded.length, 1);
  const call = recorded[0]!;
  assert.equal(call.name, "payment_failed");
  assert.equal(call.value, 500000); // fromSubunits es identidad para COP (lib/currency/subunits.ts)
  assert.equal(call.currency, "COP");
  assert.deepEqual(call.custom, { reason: "Fondos insuficientes" });
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});

test("un fallo escribiendo AnalyticsEvent nunca se propaga (fail-open)", async () => {
  recorded.length = 0;
  shouldThrow = true;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  const recordPaymentFailedEvent = await loadRecordPaymentFailedEvent();
  await assert.doesNotReject(() => recordPaymentFailedEvent(basePayment()));
  shouldThrow = false;
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});
