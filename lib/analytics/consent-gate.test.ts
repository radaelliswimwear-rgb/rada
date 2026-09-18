import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isFirstPartyAnalyticsActive,
  isFirstPartyAnalyticsAllowed,
  isGA4BrowserActive,
  isGA4BrowserAllowed,
  isMetaCapiActive,
  isMetaCapiAllowed,
  isMetaPixelActive,
  isMetaPixelAllowed,
} from "./consent-gate";

const ANALYTICS_ONLY = { analytics: true, marketing: false };
const MARKETING_ONLY = { analytics: false, marketing: true };
const BOTH = { analytics: true, marketing: true };
const NEITHER = { analytics: false, marketing: false };

// A. tráfico interno -> 0 analytics (bloquea los 3 canales, aunque haya
// consentimiento y el runtime esté prendido).
test("A: tráfico interno bloquea first-party aunque analytics=true", () => {
  assert.equal(isFirstPartyAnalyticsAllowed(BOTH, true), false);
});
test("A: tráfico interno bloquea GA4 browser aunque analytics=true", () => {
  assert.equal(isGA4BrowserAllowed(BOTH, true), false);
});
test("A: tráfico interno bloquea Meta Pixel aunque marketing=true", () => {
  assert.equal(isMetaPixelAllowed(BOTH, true), false);
});
test("A: tráfico interno bloquea Meta CAPI aunque marketing=true y order elegible", () => {
  assert.equal(
    isMetaCapiAllowed({
      consent: BOTH,
      isInternalTraffic: true,
      orderMarketingExclusionReason: null,
    }),
    false,
  );
});

// B. analytics consent false -> no GA4 / no first-party behavioral.
test("B: sin analytics consent -> first-party bloqueado", () => {
  assert.equal(isFirstPartyAnalyticsAllowed(MARKETING_ONLY, false), false);
  assert.equal(isFirstPartyAnalyticsAllowed(null, false), false);
});
test("B: sin analytics consent -> GA4 browser bloqueado", () => {
  assert.equal(isGA4BrowserAllowed(MARKETING_ONLY, false), false);
});
test("B: con analytics consent y tráfico externo -> permitido", () => {
  assert.equal(isFirstPartyAnalyticsAllowed(ANALYTICS_ONLY, false), true);
  assert.equal(isGA4BrowserAllowed(ANALYTICS_ONLY, false), true);
});

// C. marketing consent false -> no Meta Pixel / no CAPI.
test("C: sin marketing consent -> Meta Pixel bloqueado", () => {
  assert.equal(isMetaPixelAllowed(ANALYTICS_ONLY, false), false);
  assert.equal(isMetaPixelAllowed(null, false), false);
});
test("C: sin marketing consent -> Meta CAPI bloqueado aunque order elegible", () => {
  assert.equal(
    isMetaCapiAllowed({
      consent: ANALYTICS_ONLY,
      isInternalTraffic: false,
      orderMarketingExclusionReason: null,
    }),
    false,
  );
});
test("C: con marketing consent y tráfico externo -> Meta Pixel permitido", () => {
  assert.equal(isMetaPixelAllowed(MARKETING_ONLY, false), true);
});

// Meta CAPI además exige Order no excluido, incluso con marketing=true.
test("Meta CAPI: order excluido (ej. tráfico interno histórico) bloquea aunque marketing=true", () => {
  assert.equal(
    isMetaCapiAllowed({
      consent: BOTH,
      isInternalTraffic: false,
      orderMarketingExclusionReason: "internal_traffic",
    }),
    false,
  );
});
test("Meta CAPI: marketing=true + order elegible + tráfico externo -> permitido", () => {
  assert.equal(
    isMetaCapiAllowed({
      consent: BOTH,
      isInternalTraffic: false,
      orderMarketingExclusionReason: null,
    }),
    true,
  );
});

// D. runtime disabled -> NO carga scripts externos aunque consentimiento=true.
test("D: runtimeEnabled=false bloquea GA4 browser aunque consentimiento=true", () => {
  assert.equal(
    isGA4BrowserActive({ consent: BOTH, isInternalTraffic: false, runtimeEnabled: false }),
    false,
  );
});
test("D: runtimeEnabled=false bloquea Meta Pixel aunque consentimiento=true", () => {
  assert.equal(
    isMetaPixelActive({ consent: BOTH, isInternalTraffic: false, runtimeEnabled: false }),
    false,
  );
});
test("D: runtimeEnabled=false bloquea Meta CAPI aunque todo lo demás califique", () => {
  assert.equal(
    isMetaCapiActive({
      consent: BOTH,
      isInternalTraffic: false,
      runtimeEnabled: false,
      orderMarketingExclusionReason: null,
    }),
    false,
  );
});
test("D: runtimeEnabled=false bloquea first-party aunque consentimiento=true", () => {
  assert.equal(
    isFirstPartyAnalyticsActive({
      consent: BOTH,
      isInternalTraffic: false,
      runtimeEnabled: false,
    }),
    false,
  );
});
test("D: runtimeEnabled=true + todo lo demás en regla -> activo", () => {
  assert.equal(
    isGA4BrowserActive({ consent: BOTH, isInternalTraffic: false, runtimeEnabled: true }),
    true,
  );
  assert.equal(
    isMetaPixelActive({ consent: BOTH, isInternalTraffic: false, runtimeEnabled: true }),
    true,
  );
});

test("sin decisión de consentimiento (null) -> todo bloqueado, nunca se asume true", () => {
  assert.equal(isFirstPartyAnalyticsAllowed(null, false), false);
  assert.equal(isMetaPixelAllowed(null, false), false);
  assert.equal(
    isMetaCapiAllowed({ consent: null, isInternalTraffic: false, orderMarketingExclusionReason: null }),
    false,
  );
});

test("NEITHER (rechazó todo) -> ningún canal permitido", () => {
  assert.equal(isFirstPartyAnalyticsAllowed(NEITHER, false), false);
  assert.equal(isMetaPixelAllowed(NEITHER, false), false);
});
