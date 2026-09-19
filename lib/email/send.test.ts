import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  hashRecipientForLogs,
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
