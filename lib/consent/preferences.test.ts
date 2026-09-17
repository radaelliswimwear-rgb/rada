import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACCEPT_ALL_CONSENT,
  REJECT_NON_ESSENTIAL_CONSENT,
  buildConsentCookieValue,
  parseConsentCookieValue,
} from "./preferences";

// Fase 0 de analytics (consentimiento de cookies): lógica pura, sin
// cookies() ni Prisma reales -- ver el comentario en preferences.ts sobre
// por qué vive separada de consent-actions.ts. lib/consent/preferences.ts
// no tiene ningún import externo, así que no hace falta el truco de
// DATABASE_URL placeholder que usan los archivos que importan lib/prisma
// transitivamente.

// M. Sin cookie / cookie malformada -> parseConsentCookieValue devuelve
// null (representa "todavía no hay decisión", analytics/marketing
// efectivamente en false hasta que se guarde una decisión real).
test("M: sin cookie (undefined) -> parseConsentCookieValue devuelve null", () => {
  assert.equal(parseConsentCookieValue(undefined), null);
});

test("M bis: cookie null -> parseConsentCookieValue devuelve null", () => {
  assert.equal(parseConsentCookieValue(null), null);
});

test("M ter: cookie vacía (string vacío) -> parseConsentCookieValue devuelve null", () => {
  assert.equal(parseConsentCookieValue(""), null);
});

// N. "Aceptar todas" -> construir el valor de la cookie con
// ACCEPT_ALL_CONSENT hace un round-trip por buildConsentCookieValue +
// parseConsentCookieValue hasta {analytics:true, marketing:true}.
test("N: Aceptar todas -> round-trip conserva analytics:true, marketing:true", () => {
  const raw = buildConsentCookieValue(ACCEPT_ALL_CONSENT);
  const parsed = parseConsentCookieValue(raw);
  assert.ok(parsed);
  assert.equal(parsed?.analytics, true);
  assert.equal(parsed?.marketing, true);
});

// O. "Rechazar no esenciales" -> mismo round-trip con
// REJECT_NON_ESSENTIAL_CONSENT -> {analytics:false, marketing:false}.
test("O: Rechazar no esenciales -> round-trip conserva analytics:false, marketing:false", () => {
  const raw = buildConsentCookieValue(REJECT_NON_ESSENTIAL_CONSENT);
  const parsed = parseConsentCookieValue(raw);
  assert.ok(parsed);
  assert.equal(parsed?.analytics, false);
  assert.equal(parsed?.marketing, false);
});

// P. Configuración granular -> una combinación arbitraria (no solo los dos
// presets) también hace el round-trip correctamente.
test("P: configuración granular (analytics:true, marketing:false) -> round-trip correcto", () => {
  const raw = buildConsentCookieValue({ analytics: true, marketing: false });
  const parsed = parseConsentCookieValue(raw);
  assert.ok(parsed);
  assert.equal(parsed?.analytics, true);
  assert.equal(parsed?.marketing, false);
});

test("P bis: configuración granular (analytics:false, marketing:true) -> round-trip correcto", () => {
  const raw = buildConsentCookieValue({ analytics: false, marketing: true });
  const parsed = parseConsentCookieValue(raw);
  assert.ok(parsed);
  assert.equal(parsed?.analytics, false);
  assert.equal(parsed?.marketing, true);
});

// Casos adicionales pedidos explícitamente: string basura, versión
// incorrecta, y un valor al que le falta un campo requerido -- los tres
// deben devolver null.
test("string basura ('not json') -> parseConsentCookieValue devuelve null", () => {
  assert.equal(parseConsentCookieValue("not json"), null);
});

test("versión incorrecta (version: 2) -> parseConsentCookieValue devuelve null", () => {
  const raw = JSON.stringify({
    version: 2,
    analytics: true,
    marketing: true,
    timestamp: new Date().toISOString(),
  });
  assert.equal(parseConsentCookieValue(raw), null);
});

test("falta un campo requerido (sin timestamp) -> parseConsentCookieValue devuelve null", () => {
  const raw = JSON.stringify({
    version: 1,
    analytics: true,
    marketing: true,
  });
  assert.equal(parseConsentCookieValue(raw), null);
});
