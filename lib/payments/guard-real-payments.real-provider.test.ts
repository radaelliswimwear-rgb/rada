import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Auditoría go-live (sep. 2026): mismo motivo que guard-real-payments.test.ts
// -- assertRealPaymentConfigOrThrow ahora importa lib/observability/log
// (transitivamente lib/prisma), así que necesita este stub aunque el único
// test de este archivo tome el camino que NUNCA llega a lanzar/loguear
// nada (el import en sí ya dispara la cadena).
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      systemLog: {
        create: async () => ({ id: "log_1" }),
        findFirst: async () => null,
        update: async () => ({}),
      },
    },
  },
});
mock.module("lib/email/send", {
  namedExports: {
    sendEmail: async () => ({ success: true }),
  },
});

// PROPUESTA (portabilidad de hosting, reemplazo de VERCEL_ENV) — escenario
// H, en su propio archivo: NEXT_PUBLIC_PAYMENT_PROVIDER debe fijarse ANTES
// de importar lib/payments/config.ts (ACTIVE_PAYMENT_PROVIDER se resuelve
// una sola vez, a nivel de módulo, para todo el proceso) -- por eso este
// caso no puede convivir con guard-real-payments.test.ts, que depende del
// default ("stripe", simulado).
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/payments/guard-real-payments.real-provider.test.ts

process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "wompi";

test("H: APP_ENVIRONMENT=production + provider real (wompi) correctamente configurado -> permitido", async () => {
  const { assertRealPaymentConfigOrThrow } = await import(
    "./guard-real-payments"
  );
  const previous = {
    APP_ENVIRONMENT: process.env.APP_ENVIRONMENT,
    PAYMENTS_TEST_MODE: process.env.PAYMENTS_TEST_MODE,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };
  process.env.APP_ENVIRONMENT = "production";
  delete process.env.PAYMENTS_TEST_MODE;
  delete process.env.VERCEL_ENV;
  try {
    // Con un provider REAL activo, la función retorna sin lanzar -- nunca
    // llega siquiera a mirar APP_ENVIRONMENT/PAYMENTS_TEST_MODE, porque no
    // hay ninguna decisión de "provider simulado" que tomar.
    assert.doesNotThrow(() => assertRealPaymentConfigOrThrow());
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key as keyof typeof previous];
      else process.env[key as keyof typeof previous] = value;
    }
  }
});
