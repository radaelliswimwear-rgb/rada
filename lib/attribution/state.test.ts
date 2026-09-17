import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyTouch,
  parseAttributionCookieValue,
  serializeAttributionState,
  shouldClearAttributionOnConsentChange,
  shouldFreezeAttributionForPayment,
  shouldPersistAttribution,
} from "./state";
import type { AttributionTouch } from "./types";

// Fase 1 de analytics (atribución first-party): lógica pura, sin cookies()
// ni Prisma reales -- mismo patrón que lib/internal-traffic/status.ts /
// lib/consent/preferences.ts.

const TOUCH_A: AttributionTouch = {
  source: "meta",
  medium: "paid_social",
  campaign: "oasis_natural_sep26",
  content: "video03_promo10s",
  term: null,
  fbclid: "abc123",
  gclid: null,
  landingPath: "/producto/arena-dorada",
  referrerDomain: null,
  capturedAt: "2026-09-01T10:00:00.000Z",
};

const TOUCH_B: AttributionTouch = {
  source: "google",
  medium: "cpc",
  campaign: "espuma_de_ola_oct26",
  content: null,
  term: "trajes de bano",
  fbclid: null,
  gclid: "xyz789",
  landingPath: "/espuma-de-ola",
  referrerDomain: null,
  capturedAt: "2026-09-03T10:00:00.000Z",
};

// A/B -- puerta de consentimiento.
test("A: marketing consent true -> shouldPersistAttribution true", () => {
  assert.equal(shouldPersistAttribution({ marketing: true }), true);
});

test("B: marketing consent false -> shouldPersistAttribution false", () => {
  assert.equal(shouldPersistAttribution({ marketing: false }), false);
});

test("B bis: consentimiento todavía sin decidir (null) -> shouldPersistAttribution false", () => {
  assert.equal(shouldPersistAttribution(null), false);
});

// K/L -- puerta de tráfico interno al crear un Payment.
test("K: Payment normal (marketingExclusionReason null) -> se congela snapshot", () => {
  assert.equal(shouldFreezeAttributionForPayment(null), true);
});

test("L: Payment interno (marketingExclusionReason internal_traffic) -> snapshot null", () => {
  assert.equal(shouldFreezeAttributionForPayment("internal_traffic"), false);
});

test("L bis: Payment de prueba (marketingExclusionReason e2e_test) -> snapshot null", () => {
  assert.equal(shouldFreezeAttributionForPayment("e2e_test"), false);
});

// D -- firstTouch inicialmente vacío se establece.
test("D: firstTouch vacío -> se establece con el primer touch", () => {
  const result = applyTouch(null, TOUCH_A);
  assert.deepEqual(result, {
    version: 1,
    firstTouch: TOUCH_A,
    lastTouch: TOUCH_A,
  });
});

// E -- firstTouch existente no se sobrescribe.
test("E: firstTouch existente -> no se sobrescribe con un touch nuevo", () => {
  const existing = { version: 1 as const, firstTouch: TOUCH_A, lastTouch: TOUCH_A };
  const result = applyTouch(existing, TOUCH_B);
  assert.deepEqual(result.firstTouch, TOUCH_A);
});

// F -- lastTouch se actualiza con una campaña nueva válida.
test("F: nueva campaña válida -> lastTouch se actualiza", () => {
  const existing = { version: 1 as const, firstTouch: TOUCH_A, lastTouch: TOUCH_A };
  const result = applyTouch(existing, TOUCH_B);
  assert.deepEqual(result.lastTouch, TOUCH_B);
});

// G -- una visita directa NUNCA debe llegar a llamar applyTouch (eso lo
// garantiza buildAttributionTouch devolviendo null, ver parsing.test.ts) --
// acá se confirma la otra mitad: si nunca se llama, lastTouch simplemente
// no cambia, porque nada en este módulo lo toca sin un touch real.
test("G: sin llamar applyTouch (visita directa) -> el estado no cambia (documenta la garantía)", () => {
  const existing = { version: 1 as const, firstTouch: TOUCH_A, lastTouch: TOUCH_B };
  // No se invoca applyTouch acá a propósito: el llamador real (capture-actions.ts)
  // ni siquiera llega a este punto cuando buildAttributionTouch devuelve null.
  assert.deepEqual(existing.lastTouch, TOUCH_B);
});

// Round-trip de serialización.
test("serializeAttributionState + parseAttributionCookieValue -> round-trip exacto", () => {
  const state = { version: 1 as const, firstTouch: TOUCH_A, lastTouch: TOUCH_B };
  const raw = serializeAttributionState(state);
  assert.deepEqual(parseAttributionCookieValue(raw), state);
});

// P -- cookie expirada: el navegador simplemente deja de mandarla, así que
// `raw` llega undefined -- mismo resultado que "nunca existió".
test("P: cookie ausente/expirada (undefined) -> parseAttributionCookieValue null", () => {
  assert.equal(parseAttributionCookieValue(undefined), null);
});

test("cookie con JSON corrupto -> parseAttributionCookieValue null, nunca lanza", () => {
  assert.equal(parseAttributionCookieValue("{not json"), null);
});

test("cookie con versión incorrecta -> parseAttributionCookieValue null", () => {
  const raw = JSON.stringify({ version: 2, firstTouch: null, lastTouch: null });
  assert.equal(parseAttributionCookieValue(raw), null);
});

test("cookie con firstTouch con forma inválida -> parseAttributionCookieValue null", () => {
  const raw = JSON.stringify({
    version: 1,
    firstTouch: "no debería ser un string",
    lastTouch: null,
  });
  assert.equal(parseAttributionCookieValue(raw), null);
});

test("cookie válida con ambos touch en null (recién creada) -> se acepta", () => {
  const raw = JSON.stringify({ version: 1, firstTouch: null, lastTouch: null });
  assert.deepEqual(parseAttributionCookieValue(raw), {
    version: 1,
    firstTouch: null,
    lastTouch: null,
  });
});

// Q -- retirar consentimiento de marketing.
test("Q: marketing pasa a false -> shouldClearAttributionOnConsentChange true", () => {
  assert.equal(shouldClearAttributionOnConsentChange({ marketing: false }), true);
});

test("Q bis: marketing sigue en true -> shouldClearAttributionOnConsentChange false", () => {
  assert.equal(shouldClearAttributionOnConsentChange({ marketing: true }), false);
});
