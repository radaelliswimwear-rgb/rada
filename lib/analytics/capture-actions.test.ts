// Fase 2B (cierre de gap de la auditoría de pre-activación): recordAnalyticsEventAction
// -- el punto de entrada ÚNICO que los componentes cliente usan para el
// first-party -- no tenía ningún test propio (solo su lógica de gate pura
// estaba probada en consent-gate.test.ts). Este archivo prueba la función
// real de punta a punta: tráfico interno debe producir CERO llamadas a
// recordAnalyticsEvent, sin importar el consentimiento.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../../tests/mock-module";

const recorded: unknown[] = [];

mockModule("lib/analytics/store", {
  recordAnalyticsEvent: async (input: unknown) => {
    recorded.push(input);
  },
});

// mock.module solo admite mockear cada especificador UNA vez por proceso --
// se mockea acá, al cargar el archivo, con implementaciones que delegan a
// una variable reasignable, para que cada test pueda "cambiar" el
// escenario sin volver a llamar mock.module().
let currentGates: {
  isInternal: boolean;
  consent: { analytics: boolean; marketing: boolean } | null;
} = { isInternal: false, consent: null };

mockModule("lib/internal-traffic/resolve", {
  resolveInternalTraffic: async () => ({ isInternal: currentGates.isInternal }),
});
mockModule("lib/consent/consent-actions", {
  getConsentPreferencesAction: async () =>
    currentGates.consent
      ? { version: 1, ...currentGates.consent, timestamp: "2026-09-18T00:00:00.000Z" }
      : null,
});

function mockGates(input: {
  isInternal: boolean;
  consent: { analytics: boolean; marketing: boolean } | null;
}) {
  currentGates = input;
}

// Solo necesarios para el camino "allowed=true" (recordAnalyticsEventAction
// sigue de largo después del gate) -- el camino "no permitido" retorna
// antes de tocar ninguno de estos, así que mockearlos siempre, sin
// condicionar por test, deja el harness simple y cubre ambos casos.
mockModule("lib/analytics/session", {
  resolveAnalyticsSession: async () => "session-fake-1",
});
mockModule("lib/attribution/cookie", {
  readAttributionCookie: async () => null,
});
mockModule("next/headers", {
  headers: async () => ({ get: () => "Mozilla/5.0 (test)" }),
});

const loadAction = async () =>
  (await import("./capture-actions")).recordAnalyticsEventAction;

test("tráfico interno -> CERO AnalyticsEvent, incluso con consentimiento completo y runtime encendido", async () => {
  recorded.length = 0;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  mockGates({ isInternal: true, consent: { analytics: true, marketing: true } });
  const recordAnalyticsEventAction = await loadAction();

  await recordAnalyticsEventAction({ name: "view_item", value: 1000 });

  assert.equal(recorded.length, 0);
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});

test("tráfico interno -> CERO AnalyticsEvent aunque no haya decisión de consentimiento guardada", async () => {
  recorded.length = 0;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  mockGates({ isInternal: true, consent: null });
  const recordAnalyticsEventAction = await loadAction();

  await recordAnalyticsEventAction({ name: "view_item", value: 1000 });

  assert.equal(recorded.length, 0);
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});

test("tráfico externo sin consentimiento de analytics -> CERO AnalyticsEvent", async () => {
  recorded.length = 0;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  mockGates({ isInternal: false, consent: { analytics: false, marketing: true } });
  const recordAnalyticsEventAction = await loadAction();

  await recordAnalyticsEventAction({ name: "view_item", value: 1000 });

  assert.equal(recorded.length, 0);
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});

test("runtime apagado -> CERO AnalyticsEvent aunque todo lo demás califique", async () => {
  recorded.length = 0;
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
  mockGates({ isInternal: false, consent: { analytics: true, marketing: true } });
  const recordAnalyticsEventAction = await loadAction();

  await recordAnalyticsEventAction({ name: "view_item", value: 1000 });

  assert.equal(recorded.length, 0);
});

test("control positivo -- tráfico externo, consentimiento de analytics, runtime encendido -> SÍ escribe (prueba que el harness no está siempre en false)", async () => {
  recorded.length = 0;
  process.env.ANALYTICS_RUNTIME_ENABLED = "true";
  mockGates({ isInternal: false, consent: { analytics: true, marketing: false } });
  const recordAnalyticsEventAction = await loadAction();

  await recordAnalyticsEventAction({ name: "view_item", value: 1000 });

  assert.equal(recorded.length, 1);
  delete process.env.ANALYTICS_RUNTIME_ENABLED;
});
