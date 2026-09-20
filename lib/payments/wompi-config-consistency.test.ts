import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Auditoría go-live (sep. 2026): assertWompiConfigConsistencyOrThrow ahora
// importa lib/observability/log (transitivamente lib/prisma) en su nuevo
// throw path -- sin este stub, el import de abajo construye un
// PrismaClient real y revienta con "DATABASE_URL no está definida" antes
// de llegar a ningún assert (mismo patrón que guard-real-payments.test.ts).
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

// Hardening P2/P3 (sep. 2026): assertWompiConfigConsistencyOrThrow
// (lib/payments/guard-real-payments.ts) -- cruza WOMPI_BASE_URL, el
// prefijo de las llaves y NEXT_PUBLIC_WOMPI_SANDBOX/APP_ENVIRONMENT.
// Nunca lee llaves reales, solo prefijos públicos (pub_test_/pub_prod_,
// documentados en .env.example de este mismo repo).
//
// Cómo correrlo:
//   node --import tsx --test lib/payments/wompi-config-consistency.test.ts

const SANDBOX_URL = "https://sandbox.wompi.co/v1";
const PRODUCTION_URL = "https://production.wompi.co/v1";
const SANDBOX_PUB = "pub_test_abc123";
const SANDBOX_PRV = "prv_test_abc123";
const PROD_PUB = "pub_prod_xyz789";
const PROD_PRV = "prv_prod_xyz789";

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

test("sandbox válida: base URL + llaves + flag, todo consistente -- no lanza", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "true", APP_ENVIRONMENT: "development" },
    () => {
      assert.doesNotThrow(() =>
        assertWompiConfigConsistencyOrThrow({
          baseUrl: SANDBOX_URL,
          publicKey: SANDBOX_PUB,
          privateKey: SANDBOX_PRV,
        }),
      );
    },
  );
});

test("producción válida: base URL + llaves de prod, flag apagado, APP_ENVIRONMENT=production -- no lanza", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "false", APP_ENVIRONMENT: "production" },
    () => {
      assert.doesNotThrow(() =>
        assertWompiConfigConsistencyOrThrow({
          baseUrl: PRODUCTION_URL,
          publicKey: PROD_PUB,
          privateKey: PROD_PRV,
        }),
      );
    },
  );
});

test("producción válida SIN la variable NEXT_PUBLIC_WOMPI_SANDBOX definida (ausente = false) -- no lanza", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: undefined, APP_ENVIRONMENT: "production" },
    () => {
      assert.doesNotThrow(() =>
        assertWompiConfigConsistencyOrThrow({
          baseUrl: PRODUCTION_URL,
          publicKey: PROD_PUB,
          privateKey: PROD_PRV,
        }),
      );
    },
  );
});

test("inválida: WOMPI_BASE_URL sandbox pero llaves de producción -- lanza", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "false", APP_ENVIRONMENT: "production" },
    () => {
      assert.throws(
        () =>
          assertWompiConfigConsistencyOrThrow({
            baseUrl: SANDBOX_URL,
            publicKey: PROD_PUB,
            privateKey: PROD_PRV,
          }),
        /inconsistente/,
      );
    },
  );
});

test("inválida: llave pública de prod pero llave privada de sandbox -- lanza", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "false", APP_ENVIRONMENT: "production" },
    () => {
      assert.throws(() =>
        assertWompiConfigConsistencyOrThrow({
          baseUrl: PRODUCTION_URL,
          publicKey: PROD_PUB,
          privateKey: SANDBOX_PRV,
        }),
      );
    },
  );
});

test('inválida: NEXT_PUBLIC_WOMPI_SANDBOX="true" con credenciales de PRODUCCIÓN reales -- lanza', async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "true", APP_ENVIRONMENT: "production" },
    () => {
      assert.throws(
        () =>
          assertWompiConfigConsistencyOrThrow({
            baseUrl: PRODUCTION_URL,
            publicKey: PROD_PUB,
            privateKey: PROD_PRV,
          }),
        /tarjetas de prueba/,
      );
    },
  );
});

test("inválida: NEXT_PUBLIC_WOMPI_SANDBOX apagado con credenciales de SANDBOX -- lanza", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "false", APP_ENVIRONMENT: "development" },
    () => {
      assert.throws(
        () =>
          assertWompiConfigConsistencyOrThrow({
            baseUrl: SANDBOX_URL,
            publicKey: SANDBOX_PUB,
            privateKey: SANDBOX_PRV,
          }),
        /nunca cobrarían dinero de verdad/,
      );
    },
  );
});

test("inválida: APP_ENVIRONMENT=production corriendo contra credenciales de SANDBOX -- lanza", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "true", APP_ENVIRONMENT: "production" },
    () => {
      assert.throws(
        () =>
          assertWompiConfigConsistencyOrThrow({
            baseUrl: SANDBOX_URL,
            publicKey: SANDBOX_PUB,
            privateKey: SANDBOX_PRV,
          }),
        /entorno de pruebas de Wompi/,
      );
    },
  );
});

test("un WOMPI_BASE_URL no reconocido (proxy/mirror propio) no rompe por sí solo -- se ignora esa señal", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "false", APP_ENVIRONMENT: "production" },
    () => {
      assert.doesNotThrow(() =>
        assertWompiConfigConsistencyOrThrow({
          baseUrl: "https://api.mi-proxy-interno.example/wompi",
          publicKey: PROD_PUB,
          privateKey: PROD_PRV,
        }),
      );
    },
  );
});

test("secretos reales nunca aparecen en el mensaje de error -- solo la clasificación derivada", async () => {
  const { assertWompiConfigConsistencyOrThrow } = await import(
    "./guard-real-payments"
  );
  const secretPublicKey = "pub_prod_SUPER_SECRETO_1234567890";
  withEnv(
    { NEXT_PUBLIC_WOMPI_SANDBOX: "true", APP_ENVIRONMENT: "production" },
    () => {
      try {
        assertWompiConfigConsistencyOrThrow({
          baseUrl: PRODUCTION_URL,
          publicKey: secretPublicKey,
          privateKey: PROD_PRV,
        });
        assert.fail("debía lanzar");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /SUPER_SECRETO/);
      }
    },
  );
});
