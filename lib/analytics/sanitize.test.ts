import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeCustomPayload, sanitizeSearchTerm } from "./sanitize";

test("sanitizeSearchTerm: null/undefined/vacío -> null", () => {
  assert.equal(sanitizeSearchTerm(null), null);
  assert.equal(sanitizeSearchTerm(undefined), null);
  assert.equal(sanitizeSearchTerm("   "), null);
});

test("sanitizeSearchTerm: recorta whitespace y trunca a 100 caracteres", () => {
  assert.equal(sanitizeSearchTerm("  bikini  "), "bikini");
  const long = "a".repeat(500);
  assert.equal(sanitizeSearchTerm(long)!.length, 100);
});

test("sanitizeSearchTerm: rechaza intentos de HTML/script", () => {
  assert.equal(sanitizeSearchTerm("<script>alert(1)</script>"), null);
  assert.equal(sanitizeSearchTerm("bikini <img src=x>"), null);
});

test("sanitizeCustomPayload: sin input -> objeto vacío", () => {
  assert.deepEqual(sanitizeCustomPayload(null), {});
  assert.deepEqual(sanitizeCustomPayload(undefined), {});
});

test("sanitizeCustomPayload: pasa number/boolean/null tal cual", () => {
  assert.deepEqual(sanitizeCustomPayload({ count: 3, ok: true, empty: null }), {
    count: 3,
    ok: true,
    empty: null,
  });
});

test("sanitizeCustomPayload: sanea y trunca strings, omite las rechazadas", () => {
  const result = sanitizeCustomPayload({
    coupon: "  RADAELLI10  ",
    xss: "<script>bad()</script>",
  });
  assert.equal(result.coupon, "RADAELLI10");
  assert.equal("xss" in result, false);
});

test("sanitizeCustomPayload: limita a 20 claves", () => {
  const raw: Record<string, string> = {};
  for (let i = 0; i < 30; i++) raw[`k${i}`] = "v";
  const result = sanitizeCustomPayload(raw);
  assert.equal(Object.keys(result).length, 20);
});
