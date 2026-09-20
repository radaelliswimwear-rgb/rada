import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  hashRecipientForLogs,
  isRecipientAllowedInStaging,
  sanitizeProviderErrorBody,
  sendEmail,
} from "./send";

// @types/node (vía Next.js) tipa NODE_ENV como una propiedad readonly de
// NodeJS.ProcessEnv -- se accede a través de una referencia sin ese tipo
// específico para poder simularlo, sin `any` (mismo patrón que
// lib/guest-identity.test.ts).
const mutableEnv = process.env as Record<string, string | undefined>;

// Hardening P2/P3 (sep. 2026): sendEmail loguea en varios puntos cuando
// algo falla (sin RESEND_API_KEY/EMAIL_FROM en producción, Resend
// responde con error, la red falla) -- antes, esos console.error incluían
// el email completo del destinatario, y en el caso de un error de Resend,
// el body crudo de su respuesta (formato fuera de nuestro control, podía
// traer el email de vuelta). Este archivo prueba las dos funciones de
// saneamiento en aislado y confirma, en un caso real de sendEmail, que el
// email nunca aparece en lo que se loguea.
//
// Cómo correrlo:
//   node --import tsx --test lib/email/send.test.ts

test("hashRecipientForLogs: mismo email (distinto casing/espacios) da el mismo hash", () => {
  const a = hashRecipientForLogs("Clienta@Example.com");
  const b = hashRecipientForLogs("  clienta@example.com  ");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{12}$/);
});

test("hashRecipientForLogs: emails distintos dan hashes distintos", () => {
  const a = hashRecipientForLogs("una@example.com");
  const b = hashRecipientForLogs("otra@example.com");
  assert.notEqual(a, b);
});

test("hashRecipientForLogs: el hash nunca contiene el email original", () => {
  const email = "clienta-secreta@example.com";
  const hash = hashRecipientForLogs(email);
  assert.doesNotMatch(hash, /clienta|example|secreta/i);
});

test("sanitizeProviderErrorBody: redacta cualquier email dentro del body", () => {
  const body = JSON.stringify({
    error: "Invalid to address",
    to: "clienta@example.com",
  });
  const sanitized = sanitizeProviderErrorBody(body);
  assert.doesNotMatch(sanitized, /clienta@example\.com/);
  assert.match(sanitized, /\[email\]/);
});

test("sanitizeProviderErrorBody: no toca texto sin forma de email", () => {
  const body = JSON.stringify({ error: "Rate limit exceeded" });
  assert.equal(sanitizeProviderErrorBody(body), body);
});

test("sanitizeProviderErrorBody: trunca respuestas muy largas", () => {
  const body = "x".repeat(5000);
  const sanitized = sanitizeProviderErrorBody(body);
  assert.ok(sanitized.length <= 300);
});

// Fase 2A del proyecto de staging/pentest (sep. 2026): en APP_ENVIRONMENT
// "staging", ningún correo debe poder salir a un destinatario arbitrario
// -- ver docs/pentest-architecture.md. Este chequeo va ANTES que
// RESEND_API_KEY/NODE_ENV, así que se prueba con una API key real
// configurada (para descartar que el bloqueo sea "casualidad" del
// fallback de key ausente) y confirmando que NUNCA se llega a llamar
// fetch (ningún request sale hacia Resend).

test("isRecipientAllowedInStaging: coincide sin importar mayúsculas/espacios", () => {
  const previousList = mutableEnv.STAGING_EMAIL_ALLOWLIST;
  mutableEnv.STAGING_EMAIL_ALLOWLIST = "Prueba@Ejemplo.test, otra@ejemplo.test";
  try {
    assert.equal(isRecipientAllowedInStaging("  prueba@ejemplo.test  "), true);
    assert.equal(isRecipientAllowedInStaging("PRUEBA@EJEMPLO.TEST"), true);
    assert.equal(isRecipientAllowedInStaging("otra@ejemplo.test"), true);
    assert.equal(isRecipientAllowedInStaging("clienta-real@gmail.com"), false);
  } finally {
    if (previousList === undefined) delete mutableEnv.STAGING_EMAIL_ALLOWLIST;
    else mutableEnv.STAGING_EMAIL_ALLOWLIST = previousList;
  }
});

test("isRecipientAllowedInStaging: allowlist vacía/ausente no permite a nadie (fail-closed)", () => {
  const previousList = mutableEnv.STAGING_EMAIL_ALLOWLIST;
  delete mutableEnv.STAGING_EMAIL_ALLOWLIST;
  try {
    assert.equal(isRecipientAllowedInStaging("cualquiera@ejemplo.test"), false);
  } finally {
    if (previousList === undefined) delete mutableEnv.STAGING_EMAIL_ALLOWLIST;
    else mutableEnv.STAGING_EMAIL_ALLOWLIST = previousList;
  }
});

test("sendEmail en staging: destinatario FUERA de la allowlist -- nunca llama a Resend, nunca reescribe el destinatario", async () => {
  const previousAppEnv = mutableEnv.APP_ENVIRONMENT;
  const previousList = mutableEnv.STAGING_EMAIL_ALLOWLIST;
  const previousKey = mutableEnv.RESEND_API_KEY;
  const previousFrom = mutableEnv.EMAIL_FROM;
  mutableEnv.APP_ENVIRONMENT = "staging";
  mutableEnv.STAGING_EMAIL_ALLOWLIST = "equipo-qa@ejemplo.test";
  mutableEnv.RESEND_API_KEY = "re_test_fake_key";
  mutableEnv.EMAIL_FROM = "Radaelli <no-reply@radaelliswimwear.com>";

  let fetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = (async () => {
    fetchCalled = true;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  const warnSpy = mock.method(console, "warn", () => undefined);
  try {
    const result = await sendEmail({
      to: "clienta-real-de-pentest@gmail.com",
      subject: "Confirmación de pedido",
      html: "<p>hola</p>",
    });
    assert.equal(result.success, false);
    assert.equal(result.skipped, true);
    assert.equal(fetchCalled, false, "nunca debe llegar a llamar a Resend");

    const loggedArgs = warnSpy.mock.calls.flatMap((call) => call.arguments);
    const serialized = JSON.stringify(loggedArgs);
    assert.doesNotMatch(serialized, /clienta-real-de-pentest@gmail\.com/);
  } finally {
    global.fetch = originalFetch;
    warnSpy.mock.restore();
    if (previousAppEnv === undefined) delete mutableEnv.APP_ENVIRONMENT;
    else mutableEnv.APP_ENVIRONMENT = previousAppEnv;
    if (previousList === undefined) delete mutableEnv.STAGING_EMAIL_ALLOWLIST;
    else mutableEnv.STAGING_EMAIL_ALLOWLIST = previousList;
    if (previousKey === undefined) delete mutableEnv.RESEND_API_KEY;
    else mutableEnv.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete mutableEnv.EMAIL_FROM;
    else mutableEnv.EMAIL_FROM = previousFrom;
  }
});

test("sendEmail en staging: destinatario DENTRO de la allowlist -- procede normalmente", async () => {
  const previousAppEnv = mutableEnv.APP_ENVIRONMENT;
  const previousList = mutableEnv.STAGING_EMAIL_ALLOWLIST;
  const previousKey = mutableEnv.RESEND_API_KEY;
  const previousFrom = mutableEnv.EMAIL_FROM;
  mutableEnv.APP_ENVIRONMENT = "staging";
  mutableEnv.STAGING_EMAIL_ALLOWLIST = "equipo-qa@ejemplo.test";
  mutableEnv.RESEND_API_KEY = "re_test_fake_key";
  mutableEnv.EMAIL_FROM = "Radaelli <no-reply@radaelliswimwear.com>";

  let fetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = (async () => {
    fetchCalled = true;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  try {
    const result = await sendEmail({
      to: "equipo-qa@ejemplo.test",
      subject: "Confirmación de pedido",
      html: "<p>hola</p>",
    });
    assert.equal(result.success, true);
    assert.equal(
      fetchCalled,
      true,
      "un destinatario permitido sí debe llegar a Resend",
    );
  } finally {
    global.fetch = originalFetch;
    if (previousAppEnv === undefined) delete mutableEnv.APP_ENVIRONMENT;
    else mutableEnv.APP_ENVIRONMENT = previousAppEnv;
    if (previousList === undefined) delete mutableEnv.STAGING_EMAIL_ALLOWLIST;
    else mutableEnv.STAGING_EMAIL_ALLOWLIST = previousList;
    if (previousKey === undefined) delete mutableEnv.RESEND_API_KEY;
    else mutableEnv.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete mutableEnv.EMAIL_FROM;
    else mutableEnv.EMAIL_FROM = previousFrom;
  }
});

test("sendEmail fuera de staging (production): la allowlist NO interfiere aunque esté seteada", async () => {
  const previousAppEnv = mutableEnv.APP_ENVIRONMENT;
  const previousList = mutableEnv.STAGING_EMAIL_ALLOWLIST;
  const previousKey = mutableEnv.RESEND_API_KEY;
  const previousFrom = mutableEnv.EMAIL_FROM;
  mutableEnv.APP_ENVIRONMENT = "production";
  mutableEnv.STAGING_EMAIL_ALLOWLIST = "equipo-qa@ejemplo.test";
  mutableEnv.RESEND_API_KEY = "re_test_fake_key";
  mutableEnv.EMAIL_FROM = "Radaelli <no-reply@radaelliswimwear.com>";

  let fetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = (async () => {
    fetchCalled = true;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  try {
    const result = await sendEmail({
      to: "clienta-real@gmail.com",
      subject: "Confirmación de pedido",
      html: "<p>hola</p>",
    });
    assert.equal(result.success, true);
    assert.equal(
      fetchCalled,
      true,
      "en production, la allowlist de staging nunca debe bloquear nada",
    );
  } finally {
    global.fetch = originalFetch;
    if (previousAppEnv === undefined) delete mutableEnv.APP_ENVIRONMENT;
    else mutableEnv.APP_ENVIRONMENT = previousAppEnv;
    if (previousList === undefined) delete mutableEnv.STAGING_EMAIL_ALLOWLIST;
    else mutableEnv.STAGING_EMAIL_ALLOWLIST = previousList;
    if (previousKey === undefined) delete mutableEnv.RESEND_API_KEY;
    else mutableEnv.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete mutableEnv.EMAIL_FROM;
    else mutableEnv.EMAIL_FROM = previousFrom;
  }
});

test("sendEmail en producción sin RESEND_API_KEY: el email nunca aparece en lo logueado", async () => {
  const previousEnv = mutableEnv.NODE_ENV;
  const previousKey = mutableEnv.RESEND_API_KEY;
  mutableEnv.NODE_ENV = "production";
  delete mutableEnv.RESEND_API_KEY;

  const errorSpy = mock.method(console, "error", () => undefined);
  try {
    const result = await sendEmail({
      to: "clienta-secreta@example.com",
      subject: "Asunto",
      html: "<p>hola</p>",
    });
    assert.equal(result.success, false);

    const loggedArgs = errorSpy.mock.calls.flatMap((call) => call.arguments);
    const serialized = JSON.stringify(loggedArgs);
    assert.doesNotMatch(serialized, /clienta-secreta@example\.com/);
  } finally {
    errorSpy.mock.restore();
    mutableEnv.NODE_ENV = previousEnv;
    if (previousKey === undefined) delete mutableEnv.RESEND_API_KEY;
    else mutableEnv.RESEND_API_KEY = previousKey;
  }
});

test("sendEmail: un body de error de Resend con el email de vuelta queda redactado en el log", async () => {
  const previousEnv = mutableEnv.NODE_ENV;
  const previousKey = mutableEnv.RESEND_API_KEY;
  const previousFrom = mutableEnv.EMAIL_FROM;
  mutableEnv.NODE_ENV = "production";
  mutableEnv.RESEND_API_KEY = "re_test_fake_key";
  mutableEnv.EMAIL_FROM = "Radaelli <no-reply@radaelliswimwear.com>";

  const originalFetch = global.fetch;
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        message: "Invalid recipient",
        to: "clienta-secreta@example.com",
      }),
      { status: 422 },
    )) as typeof fetch;

  const errorSpy = mock.method(console, "error", () => undefined);
  try {
    const result = await sendEmail({
      to: "clienta-secreta@example.com",
      subject: "Asunto",
      html: "<p>hola</p>",
    });
    assert.equal(result.success, false);

    const loggedArgs = errorSpy.mock.calls.flatMap((call) => call.arguments);
    const serialized = JSON.stringify(loggedArgs);
    assert.doesNotMatch(serialized, /clienta-secreta@example\.com/);
    assert.match(serialized, /\[email\]/);
  } finally {
    global.fetch = originalFetch;
    errorSpy.mock.restore();
    mutableEnv.NODE_ENV = previousEnv;
    if (previousKey === undefined) delete mutableEnv.RESEND_API_KEY;
    else mutableEnv.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete mutableEnv.EMAIL_FROM;
    else mutableEnv.EMAIL_FROM = previousFrom;
  }
});
