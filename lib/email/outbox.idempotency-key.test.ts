import { test } from "node:test";
import assert from "node:assert/strict";

// computeIdempotencyKey no toca la base de datos, pero vive en el mismo
// módulo que sí importa lib/prisma (lib/email/outbox.ts) -- ese archivo
// lanza si DATABASE_URL no está definida al cargarse, aunque esta prueba no
// vaya a usarla. Mismo placeholder que ya usa
// components/cart-drawer/cart-store.compute-invalid-lines.test.ts para el
// mismo motivo. El import en sí se hace DIFERIDO dentro de cada test (no a
// nivel de archivo) porque tsx compila esto a CJS, sin top-level await.
process.env.DATABASE_URL ??=
  "postgresql://user:pass@localhost:5432/placeholder";

// PROPUESTA (Sprint de confiabilidad de emails/outbox) — computeIdempotencyKey
// debe ser puramente determinística (mismo input -> mismo output, siempre),
// nunca exponer el email en texto plano, y respetar el límite documentado
// de Resend (256 caracteres, confirmado contra
// https://resend.com/docs/dashboard/emails/idempotency-keys). No usa
// mock.module -- computeIdempotencyKey no toca DB ni red, se prueba
// directo.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/email/outbox.idempotency-key.test.ts

test("misma entrada -> siempre la misma key (determinístico)", async () => {
  const { computeIdempotencyKey } = await import("./outbox");
  const key1 = computeIdempotencyKey(
    "order-abc",
    "CUSTOMER_ORDER_CONFIRMATION",
    "clienta@ejemplo.test",
  );
  const key2 = computeIdempotencyKey(
    "order-abc",
    "CUSTOMER_ORDER_CONFIRMATION",
    "clienta@ejemplo.test",
  );
  assert.equal(key1, key2);
});

test("distinto orderId, type o recipient -> keys distintas", async () => {
  const { computeIdempotencyKey } = await import("./outbox");
  const base = computeIdempotencyKey(
    "order-abc",
    "CUSTOMER_ORDER_CONFIRMATION",
    "clienta@ejemplo.test",
  );
  const distintoOrder = computeIdempotencyKey(
    "order-xyz",
    "CUSTOMER_ORDER_CONFIRMATION",
    "clienta@ejemplo.test",
  );
  const distintoTipo = computeIdempotencyKey(
    "order-abc",
    "ADMIN_NEW_ORDER",
    "clienta@ejemplo.test",
  );
  const distintoRecipient = computeIdempotencyKey(
    "order-abc",
    "CUSTOMER_ORDER_CONFIRMATION",
    "otra@ejemplo.test",
  );
  const keys = new Set([base, distintoOrder, distintoTipo, distintoRecipient]);
  assert.equal(
    keys.size,
    4,
    "las cuatro combinaciones deben producir keys distintas",
  );
});

test("la key nunca contiene el email en texto plano (solo un hash)", async () => {
  const { computeIdempotencyKey } = await import("./outbox");
  const email = "cliente-muy-identificable@ejemplo.test";
  const key = computeIdempotencyKey(
    "order-abc",
    "CUSTOMER_ORDER_CONFIRMATION",
    email,
  );
  assert.ok(
    !key.includes(email),
    "la idempotency key no debe exponer el email en texto plano",
  );
  assert.ok(!key.includes("@"), "tampoco debe quedar ningún fragmento con @");
});

test("formato y longitud dentro del límite documentado de Resend (<=256 chars)", async () => {
  const { computeIdempotencyKey } = await import("./outbox");
  const key = computeIdempotencyKey(
    "cmu4wmhhg0007c0unso8aa37o", // largo típico de un cuid de Order real
    "CUSTOMER_ORDER_CONFIRMATION",
    "un-email-bastante-largo-para-probar-el-limite@ejemplo-largo.test",
  );
  assert.ok(
    key.length <= 256,
    `la key debe respetar el límite de 256 caracteres de Resend, midió ${key.length}`,
  );
  assert.match(
    key,
    /^order:[^:]+:[a-z_]+:[0-9a-f]{64}$/,
    "formato esperado: order:<orderId>:<type>:<hash sha256 hex de 64 caracteres>",
  );
});
