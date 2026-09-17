import { test } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (portabilidad de hosting, reemplazo de VERCEL_ENV) —
// NEXT_PUBLIC_PAYMENT_PROVIDER no se define en este archivo, así que
// lib/payments/config.ts resuelve ACTIVE_PAYMENT_PROVIDER="stripe" (el
// default), que es el proveedor SIMULADO -- exactamente el caso que el
// guard existe para bloquear/permitir según el entorno. Para el caso de
// un proveedor REAL (wompi) ver guard-real-payments.real-provider.test.ts
// (necesita su propio archivo porque ACTIVE_PAYMENT_PROVIDER se fija una
// sola vez, al importar lib/payments/config.ts, para todo el proceso).
//
// APP_ENVIRONMENT y PAYMENTS_TEST_MODE sí se leen en cada llamada (nunca
// se cachean a nivel de módulo), así que estos tests SÍ pueden variarlos
// libremente entre casos dentro del mismo archivo.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/payments/guard-real-payments.test.ts

function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) previous[key] = process.env[key];
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("I: APP_ENVIRONMENT=production + PAYMENTS_TEST_MODE=true -> bloqueado (no anula la capa 1)", async () => {
  const { assertRealPaymentConfigOrThrow } = await import("./guard-real-payments");
  withEnv(
    { APP_ENVIRONMENT: "production", PAYMENTS_TEST_MODE: "true", VERCEL_ENV: undefined },
    () => {
      assert.throws(
        () => assertRealPaymentConfigOrThrow(),
        /APP_ENVIRONMENT=production/,
        "PAYMENTS_TEST_MODE=true nunca debe poder anular el bloqueo en production",
      );
    },
  );
});

test("J: APP_ENVIRONMENT=production + provider simulado (sin PAYMENTS_TEST_MODE) -> bloqueado", async () => {
  const { assertRealPaymentConfigOrThrow } = await import("./guard-real-payments");
  withEnv(
    { APP_ENVIRONMENT: "production", PAYMENTS_TEST_MODE: undefined, VERCEL_ENV: undefined },
    () => {
      assert.throws(() => assertRealPaymentConfigOrThrow(), /APP_ENVIRONMENT=production/);
    },
  );
});

test("K: APP_ENVIRONMENT=development + PAYMENTS_TEST_MODE=true -> permitido (comportamiento preexistente)", async () => {
  const { assertRealPaymentConfigOrThrow } = await import("./guard-real-payments");
  withEnv(
    { APP_ENVIRONMENT: "development", PAYMENTS_TEST_MODE: "true", VERCEL_ENV: undefined },
    () => {
      assert.doesNotThrow(() => assertRealPaymentConfigOrThrow());
    },
  );
});

test("development sin PAYMENTS_TEST_MODE -> sigue bloqueado por defecto (el simulado nunca es el default)", async () => {
  const { assertRealPaymentConfigOrThrow } = await import("./guard-real-payments");
  withEnv(
    { APP_ENVIRONMENT: "development", PAYMENTS_TEST_MODE: undefined, VERCEL_ENV: undefined },
    () => {
      assert.throws(() => assertRealPaymentConfigOrThrow(), /PAYMENTS_TEST_MODE/);
    },
  );
});

test("L: APP_ENVIRONMENT ausente + se intenta decidir sobre el provider simulado -> error, fail closed", async () => {
  const { assertRealPaymentConfigOrThrow } = await import("./guard-real-payments");
  withEnv(
    { APP_ENVIRONMENT: undefined, PAYMENTS_TEST_MODE: "true", VERCEL_ENV: undefined },
    () => {
      assert.throws(
        () => assertRealPaymentConfigOrThrow(),
        /APP_ENVIRONMENT no está definida/,
        "ni siquiera PAYMENTS_TEST_MODE=true debe permitir seguir sin saber el entorno",
      );
    },
  );
});

test("M: VERCEL_ENV ausente + APP_ENVIRONMENT=production correctamente definida -> bloquea igual (no depende de Vercel)", async () => {
  const { assertRealPaymentConfigOrThrow } = await import("./guard-real-payments");
  withEnv(
    { APP_ENVIRONMENT: "production", PAYMENTS_TEST_MODE: undefined, VERCEL_ENV: undefined },
    () => {
      assert.throws(() => assertRealPaymentConfigOrThrow(), /APP_ENVIRONMENT=production/);
    },
  );
});

test("M (variante): VERCEL_ENV con un valor ENGAÑOSO no tiene ningún efecto -- solo APP_ENVIRONMENT importa", async () => {
  const { assertRealPaymentConfigOrThrow } = await import("./guard-real-payments");
  withEnv(
    // VERCEL_ENV dice "preview" (no producción) pero APP_ENVIRONMENT dice
    // production -- si el guard todavía mirara VERCEL_ENV de alguna forma,
    // este caso NO bloquearía. Debe seguir bloqueando.
    { APP_ENVIRONMENT: "production", PAYMENTS_TEST_MODE: "true", VERCEL_ENV: "preview" },
    () => {
      assert.throws(() => assertRealPaymentConfigOrThrow(), /APP_ENVIRONMENT=production/);
    },
  );
});
