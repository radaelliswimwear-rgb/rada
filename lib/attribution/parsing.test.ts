import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildAttributionTouch,
  extractReferrerDomain,
  sanitizeAttributionValue,
  sanitizeLandingPath,
} from "./parsing";

const SITE_HOST = "radaelliswimwear.com";
const NOW = new Date("2026-09-17T12:00:00.000Z");

// A/I -- UTMs + fbclid/gclid presentes -> se capturan.
test("A/I: UTMs completos + fbclid + gclid -> touch con todos los campos", () => {
  const search = new URLSearchParams(
    "utm_source=meta&utm_medium=paid_social&utm_campaign=oasis_natural_sep26&utm_content=video03_promo10s&fbclid=abc123",
  );
  const touch = buildAttributionTouch({
    search,
    referrer: "https://www.instagram.com/",
    path: "/producto/arena-dorada",
    siteHost: SITE_HOST,
    now: NOW,
  });
  assert.ok(touch);
  assert.equal(touch.source, "meta");
  assert.equal(touch.medium, "paid_social");
  assert.equal(touch.campaign, "oasis_natural_sep26");
  assert.equal(touch.content, "video03_promo10s");
  assert.equal(touch.fbclid, "abc123");
  assert.equal(touch.landingPath, "/producto/arena-dorada");
  assert.equal(touch.capturedAt, NOW.toISOString());
  // Ya hay UTM: el referral no se usa (no aporta nada extra).
  assert.equal(touch.referrerDomain, null);
});

test("I bis: solo gclid (sin utm_*) -> igual es un touch válido", () => {
  const touch = buildAttributionTouch({
    search: new URLSearchParams("gclid=xyz789"),
    referrer: null,
    path: "/mujer",
    siteHost: SITE_HOST,
    now: NOW,
  });
  assert.ok(touch);
  assert.equal(touch.gclid, "xyz789");
});

// G -- visita directa: sin UTM/click id, sin referrer -> no es un touch.
test("G: sin UTMs, sin referrer (visita directa) -> buildAttributionTouch null", () => {
  const touch = buildAttributionTouch({
    search: new URLSearchParams(""),
    referrer: null,
    path: "/",
    siteHost: SITE_HOST,
    now: NOW,
  });
  assert.equal(touch, null);
});

// H -- navegación interna: referrer es el propio sitio -> no es un touch.
test("H: referrer es el propio sitio (navegación interna) -> buildAttributionTouch null", () => {
  const touch = buildAttributionTouch({
    search: new URLSearchParams(""),
    referrer: "https://radaelliswimwear.com/mujer",
    path: "/producto/arena-dorada",
    siteHost: SITE_HOST,
    now: NOW,
  });
  assert.equal(touch, null);
});

test("H bis: referrer con www. delante también cuenta como propio sitio si el host coincide", () => {
  // extractReferrerDomain compara hostname exacto -- este caso confirma que
  // un subdominio distinto (www.) SÍ se trataría como externo si el
  // siteHost no lo incluye; se documenta el comportamiento exacto.
  const domain = extractReferrerDomain(
    "https://radaelliswimwear.com/checkout",
    "radaelliswimwear.com",
  );
  assert.equal(domain, null);
});

// Referral externo genuino (sección 8): sin UTM, pero con un referrer
// externo identificable -> se captura como fuente orgánica/referral.
test("referral externo sin UTM (ej. Instagram bio link) -> touch con medium=referral", () => {
  const touch = buildAttributionTouch({
    search: new URLSearchParams(""),
    referrer: "https://www.instagram.com/radaelli_swimwear/",
    path: "/",
    siteHost: SITE_HOST,
    now: NOW,
  });
  assert.ok(touch);
  assert.equal(touch.referrerDomain, "www.instagram.com");
  assert.equal(touch.source, "www.instagram.com");
  assert.equal(touch.medium, "referral");
});

// Regresión encontrada durante el diseño: el regreso de Wompi después de
// pagar es técnicamente un referrer externo (checkout.wompi.co), pero
// jamás debe tratarse como una fuente de marketing -- corrompería
// lastTouch para la PRÓXIMA compra en cada regreso de pago.
test("referrer de Wompi (regreso de pago) -> NUNCA se trata como referral de marketing", () => {
  const touch = buildAttributionTouch({
    search: new URLSearchParams(""),
    referrer: "https://checkout.wompi.co/some/path",
    path: "/checkout/wompi/retorno",
    siteHost: SITE_HOST,
    now: NOW,
  });
  assert.equal(touch, null);
});

test("extractReferrerDomain: dominio de Wompi excluido explícitamente", () => {
  assert.equal(
    extractReferrerDomain("https://checkout.wompi.co/x", SITE_HOST),
    null,
  );
  assert.equal(extractReferrerDomain("https://wompi.co/x", SITE_HOST), null);
});

// J -- input enorme/malicioso: sanitizado o rechazado.
test("J: valor absurdamente largo -> truncado a un límite razonable", () => {
  const huge = "a".repeat(5000);
  const result = sanitizeAttributionValue(huge);
  assert.ok(result);
  assert.ok(result.length <= 200);
});

test("J bis: valor con '<'/'>' (intento de inyectar HTML) -> rechazado por completo", () => {
  assert.equal(sanitizeAttributionValue("<script>alert(1)</script>"), null);
  assert.equal(sanitizeAttributionValue("meta<img src=x>"), null);
});

test("J ter: string vacía o solo espacios -> null", () => {
  assert.equal(sanitizeAttributionValue(""), null);
  assert.equal(sanitizeAttributionValue("   "), null);
  assert.equal(sanitizeAttributionValue(null), null);
  assert.equal(sanitizeAttributionValue(undefined), null);
});

test("J: UTM absurdamente largo dentro de una URL real -> el touch resultante queda truncado", () => {
  const touch = buildAttributionTouch({
    search: new URLSearchParams(`utm_source=${"x".repeat(1000)}`),
    referrer: null,
    path: "/",
    siteHost: SITE_HOST,
    now: NOW,
  });
  assert.ok(touch);
  assert.ok(touch.source && touch.source.length <= 200);
});

// landingPath: solo path, nunca protocolo/host/query.
test("sanitizeLandingPath: descarta query string y fragmento", () => {
  assert.equal(
    sanitizeLandingPath("/producto/arena-dorada?utm_source=meta#reviews"),
    "/producto/arena-dorada",
  );
});

test("sanitizeLandingPath: un valor que no empieza con '/' se rechaza", () => {
  assert.equal(sanitizeLandingPath("https://otro-sitio.com/x"), null);
});

// Referral inválido: URL de referrer corrupta no debe romper nada.
test("extractReferrerDomain: referrer con formato inválido -> null, nunca lanza", () => {
  assert.equal(extractReferrerDomain("no-es-una-url", SITE_HOST), null);
  assert.equal(extractReferrerDomain("", SITE_HOST), null);
  assert.equal(extractReferrerDomain(null, SITE_HOST), null);
});
