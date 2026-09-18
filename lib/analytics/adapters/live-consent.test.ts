import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConsentFromCookieString } from "./live-consent";

function cookieValue(prefs: { analytics: boolean; marketing: boolean }): string {
  return encodeURIComponent(
    JSON.stringify({ ...prefs, version: 1, timestamp: "2026-09-18T00:00:00.000Z" }),
  );
}

test("sin la cookie radaelli_consent en el string -> null", () => {
  assert.equal(parseConsentFromCookieString(""), null);
  assert.equal(parseConsentFromCookieString("lago-cart-id=abc; otra=1"), null);
});

test("con la cookie presente entre otras -> decodifica y parsea correctamente", () => {
  const value = cookieValue({ analytics: true, marketing: false });
  const result = parseConsentFromCookieString(
    `lago-cart-id=abc; radaelli_consent=${value}; otra=1`,
  );
  assert.deepEqual(result, {
    version: 1,
    analytics: true,
    marketing: false,
    timestamp: "2026-09-18T00:00:00.000Z",
  });
});

test("cookie al principio del string (sin '; ' antes) también matchea", () => {
  const value = cookieValue({ analytics: false, marketing: true });
  const result = parseConsentFromCookieString(`radaelli_consent=${value}; otra=1`);
  assert.equal(result?.analytics, false);
  assert.equal(result?.marketing, true);
});

test("valor corrupto/no-JSON -> null, nunca lanza", () => {
  assert.equal(parseConsentFromCookieString("radaelli_consent=no-es-json"), null);
});

test("valor mal percent-encoded -> null, nunca lanza", () => {
  assert.equal(parseConsentFromCookieString("radaelli_consent=%ZZinvalido"), null);
});

test("refleja revocación: analytics=true seguido de analytics=false produce resultados distintos", () => {
  const before = parseConsentFromCookieString(
    `radaelli_consent=${cookieValue({ analytics: true, marketing: true })}`,
  );
  const after = parseConsentFromCookieString(
    `radaelli_consent=${cookieValue({ analytics: false, marketing: true })}`,
  );
  assert.equal(before?.analytics, true);
  assert.equal(after?.analytics, false);
});
