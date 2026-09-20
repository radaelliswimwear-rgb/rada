import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertStagingEnvironment,
  checkStagingEnvironment,
} from "./assert-staging-environment";

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

const VALID_STAGING_ENV = {
  APP_ENVIRONMENT: "staging",
  DATABASE_ENV_LABEL: "staging",
  APP_BASE_URL: "https://rada-staging.vercel.app",
  WOMPI_BASE_URL: "https://sandbox.wompi.co/v1",
  WOMPI_PUBLIC_KEY: "pub_test_abc123",
  WOMPI_PRIVATE_KEY: "prv_test_abc123",
  ANALYTICS_RUNTIME_ENABLED: undefined,
  STAGING_ANALYTICS_OVERRIDE: undefined,
};

test("entorno de staging válido -- no lanza, sin fallas", () => {
  withEnv(VALID_STAGING_ENV, () => {
    assert.doesNotThrow(() => assertStagingEnvironment());
    assert.deepEqual(checkStagingEnvironment(), []);
  });
});

test("APP_ENVIRONMENT no es staging -- falla", () => {
  withEnv({ ...VALID_STAGING_ENV, APP_ENVIRONMENT: "production" }, () => {
    const failures = checkStagingEnvironment();
    assert.ok(failures.some((f) => f.check === "APP_ENVIRONMENT"));
    assert.throws(() => assertStagingEnvironment());
  });
});

test("DATABASE_ENV_LABEL no es staging -- falla", () => {
  withEnv({ ...VALID_STAGING_ENV, DATABASE_ENV_LABEL: "development" }, () => {
    const failures = checkStagingEnvironment();
    assert.ok(failures.some((f) => f.check === "DATABASE_ENV_LABEL"));
  });
});

test("APP_BASE_URL contiene el dominio real de Production -- falla", () => {
  withEnv(
    { ...VALID_STAGING_ENV, APP_BASE_URL: "https://radaelliswimwear.com" },
    () => {
      const failures = checkStagingEnvironment();
      assert.ok(failures.some((f) => f.check === "APP_BASE_URL"));
    },
  );
});

test("Wompi con host de producción real -- falla (aunque las llaves parezcan sandbox)", () => {
  withEnv(
    { ...VALID_STAGING_ENV, WOMPI_BASE_URL: "https://production.wompi.co/v1" },
    () => {
      const failures = checkStagingEnvironment();
      assert.ok(failures.some((f) => f.check === "WOMPI"));
    },
  );
});

test("Wompi con llave pública de producción real -- falla", () => {
  withEnv(
    { ...VALID_STAGING_ENV, WOMPI_PUBLIC_KEY: "pub_prod_real123" },
    () => {
      const failures = checkStagingEnvironment();
      assert.ok(failures.some((f) => f.check === "WOMPI"));
    },
  );
});

test("Wompi con llave privada de producción real -- falla", () => {
  withEnv(
    { ...VALID_STAGING_ENV, WOMPI_PRIVATE_KEY: "prv_prod_real123" },
    () => {
      const failures = checkStagingEnvironment();
      assert.ok(failures.some((f) => f.check === "WOMPI"));
    },
  );
});

test("ANALYTICS_RUNTIME_ENABLED=true sin override -- falla", () => {
  withEnv({ ...VALID_STAGING_ENV, ANALYTICS_RUNTIME_ENABLED: "true" }, () => {
    const failures = checkStagingEnvironment();
    assert.ok(failures.some((f) => f.check === "ANALYTICS_RUNTIME_ENABLED"));
  });
});

test("ANALYTICS_RUNTIME_ENABLED=true CON STAGING_ANALYTICS_OVERRIDE=true -- no falla por eso (activación explícita)", () => {
  withEnv(
    {
      ...VALID_STAGING_ENV,
      ANALYTICS_RUNTIME_ENABLED: "true",
      STAGING_ANALYTICS_OVERRIDE: "true",
    },
    () => {
      const failures = checkStagingEnvironment();
      assert.ok(!failures.some((f) => f.check === "ANALYTICS_RUNTIME_ENABLED"));
    },
  );
});

test("múltiples fallas simultáneas -- todas se reportan, no solo la primera", () => {
  withEnv(
    {
      ...VALID_STAGING_ENV,
      APP_ENVIRONMENT: "production",
      DATABASE_ENV_LABEL: "production",
    },
    () => {
      const failures = checkStagingEnvironment();
      assert.equal(failures.length, 2);
    },
  );
});

test("el mensaje de error no incluye ningún secreto, solo el nombre del check y una razón corta", () => {
  withEnv(
    { ...VALID_STAGING_ENV, WOMPI_PRIVATE_KEY: "prv_prod_SECRETO_REAL_123456" },
    () => {
      try {
        assertStagingEnvironment();
        assert.fail("debía lanzar");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /SECRETO_REAL_123456/);
      }
    },
  );
});
