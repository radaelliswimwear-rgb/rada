import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// PROPUESTA (portabilidad de hosting, reemplazo de VERCEL_PROJECT_PRODUCTION_URL) —
// getAppBaseUrl() (lib/utils.ts) es una función pura sobre process.env: no
// cachea nada a nivel de módulo, así que cada test puede fijar
// APP_BASE_URL/APP_ENVIRONMENT libremente sin necesitar mock.module ni
// procesos separados.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/utils.app-base-url.test.ts

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

test("A: development + APP_BASE_URL explícita -> usa APP_BASE_URL", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv(
    { APP_ENVIRONMENT: "development", APP_BASE_URL: "https://dev.radaelliswimwear.com" },
    () => {
      assert.equal(getAppBaseUrl(), "https://dev.radaelliswimwear.com");
    },
  );
});

test("B: development sin APP_BASE_URL -> fallback a localhost", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv({ APP_ENVIRONMENT: "development", APP_BASE_URL: undefined }, () => {
    assert.equal(getAppBaseUrl(), "http://localhost:3000");
  });
});

test("C: production + APP_BASE_URL válida https -> funciona", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv(
    { APP_ENVIRONMENT: "production", APP_BASE_URL: "https://radaelliswimwear.com" },
    () => {
      assert.equal(getAppBaseUrl(), "https://radaelliswimwear.com");
    },
  );
});

test("D: production sin APP_BASE_URL -> error claro, nunca localhost en silencio", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv({ APP_ENVIRONMENT: "production", APP_BASE_URL: undefined }, () => {
    assert.throws(() => getAppBaseUrl(), /APP_BASE_URL no está definida/);
  });
});

test("E: production + http -> error (production exige https)", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv(
    { APP_ENVIRONMENT: "production", APP_BASE_URL: "http://radaelliswimwear.com" },
    () => {
      assert.throws(() => getAppBaseUrl(), /debe usar https en production/);
    },
  );
});

test("F: APP_BASE_URL con trailing slash -> resultado normalizado (sin barra final)", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv(
    { APP_ENVIRONMENT: "production", APP_BASE_URL: "https://radaelliswimwear.com///" },
    () => {
      assert.equal(getAppBaseUrl(), "https://radaelliswimwear.com");
    },
  );
});

test("APP_BASE_URL con esquema no http/https -> error, incluso fuera de production", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv({ APP_ENVIRONMENT: "development", APP_BASE_URL: "ftp://radaelliswimwear.com" }, () => {
    assert.throws(() => getAppBaseUrl(), /debe usar http o https/);
  });
});

test("staging sin APP_BASE_URL -> también falla ruidosamente (no solo production)", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv({ APP_ENVIRONMENT: "staging", APP_BASE_URL: undefined }, () => {
    assert.throws(() => getAppBaseUrl(), /APP_BASE_URL no está definida/);
  });
});

test("APP_ENVIRONMENT ausente y sin APP_BASE_URL -> falla (nunca asume development)", async () => {
  const { getAppBaseUrl } = await import("./utils");
  withEnv({ APP_ENVIRONMENT: undefined, APP_BASE_URL: undefined }, () => {
    assert.throws(() => getAppBaseUrl(), /APP_BASE_URL no está definida/);
  });
});

test("G: APP_BASE_URL explícita en process.env tiene prioridad sobre un .env.local en disco", async () => {
  // Reproduce el escenario real: Next.js (via @next/env) carga .env.local
  // ANTES de que corra código de la app; getAppBaseUrl() nunca lee archivos
  // por su cuenta, solo confía en lo que ya haya en process.env para
  // cuando se le llama -- este test prueba la cadena completa: @next/env
  // + getAppBaseUrl(), igual que en runtime real.
  const { loadEnvConfig } = (await import("@next/env")) as unknown as {
    loadEnvConfig: (dir: string, dev?: boolean) => unknown;
  };
  const { getAppBaseUrl } = await import("./utils");

  const tmpDir = mkdtempSync(path.join(tmpdir(), "app-base-url-precedence-"));
  try {
    writeFileSync(
      path.join(tmpDir, ".env.local"),
      'APP_BASE_URL="https://valor-del-archivo.invalid"\n',
    );

    withEnv(
      { APP_ENVIRONMENT: "production", APP_BASE_URL: "https://valor-explicito.invalid" },
      () => {
        loadEnvConfig(tmpDir, true);
        assert.equal(
          getAppBaseUrl(),
          "https://valor-explicito.invalid",
          "el valor ya presente en process.env no debe ser pisado por .env.local",
        );
      },
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
