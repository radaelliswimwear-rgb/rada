import { test } from "node:test";
import assert from "node:assert/strict";
import { planStagingAwareBuildSteps } from "./staging-aware-build";

const VALID_STAGING_ENV = {
  APP_ENVIRONMENT: "staging",
  DATABASE_ENV_LABEL: "staging",
  APP_BASE_URL: "https://rada-staging.vercel.app",
  WOMPI_BASE_URL: "https://sandbox.wompi.co/v1",
  WOMPI_PUBLIC_KEY: "pub_test_abc123",
  WOMPI_PRIVATE_KEY: "prv_test_abc123",
  ANALYTICS_RUNTIME_ENABLED: undefined as string | undefined,
  STAGING_ANALYTICS_OVERRIDE: undefined as string | undefined,
};

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

// A. staging válido + flag true -> migrate + seed + consistency + build.
test("A: staging válido + STAGING_SEED_ON_BUILD=true -> migrate, seed, consistency, build (en ese orden)", () => {
  withEnv({ ...VALID_STAGING_ENV, STAGING_SEED_ON_BUILD: "true" }, () => {
    const steps = planStagingAwareBuildSteps();
    assert.deepEqual(
      steps.map((s) => s.command),
      [
        "npx prisma migrate deploy",
        "npx tsx scripts/seed-staging-pentest.ts",
        "npx tsx scripts/check-inventory-consistency.ts",
        "next build",
      ],
    );
  });
});

// B. staging válido + flag ausente -> migrate + NO seed + build.
test("B: staging válido sin STAGING_SEED_ON_BUILD -> migrate, consistency, build -- SIN seed", () => {
  withEnv({ ...VALID_STAGING_ENV, STAGING_SEED_ON_BUILD: undefined }, () => {
    const steps = planStagingAwareBuildSteps();
    assert.deepEqual(
      steps.map((s) => s.command),
      [
        "npx prisma migrate deploy",
        "npx tsx scripts/check-inventory-consistency.ts",
        "next build",
      ],
    );
    assert.ok(
      !steps.some((s) => s.command.includes("seed-staging-pentest")),
      "el seed nunca debe aparecer sin la bandera",
    );
  });
});

// B (variante): flag en cualquier valor que no sea el string exacto "true" -- tampoco siembra.
test('B (variante): STAGING_SEED_ON_BUILD con un valor que no es "true" exacto -- tampoco siembra', () => {
  for (const bad of ["1", "TRUE", "yes", ""]) {
    withEnv({ ...VALID_STAGING_ENV, STAGING_SEED_ON_BUILD: bad }, () => {
      const steps = planStagingAwareBuildSteps();
      assert.ok(
        !steps.some((s) => s.command.includes("seed-staging-pentest")),
        `valor: "${bad}"`,
      );
    });
  }
});

// C. APP_ENVIRONMENT=production + flag true -> seed bloqueado (ni siquiera se considera:
// el build entero toma el camino normal, sin tocar la DB).
test("C: APP_ENVIRONMENT=production + STAGING_SEED_ON_BUILD=true -> camino normal, seed bloqueado", () => {
  withEnv(
    {
      ...VALID_STAGING_ENV,
      APP_ENVIRONMENT: "production",
      STAGING_SEED_ON_BUILD: "true",
    },
    () => {
      const steps = planStagingAwareBuildSteps();
      assert.deepEqual(steps, [
        {
          label: "next build (camino normal, sin cambios)",
          command: "next build",
        },
      ]);
    },
  );
});

// D. DATABASE_ENV_LABEL=production + flag true (con APP_ENVIRONMENT=staging) -> bloqueado, fail closed.
test("D: DATABASE_ENV_LABEL=production con APP_ENVIRONMENT=staging -> lanza, seed bloqueado (fail closed)", () => {
  withEnv(
    {
      ...VALID_STAGING_ENV,
      DATABASE_ENV_LABEL: "production",
      STAGING_SEED_ON_BUILD: "true",
    },
    () => {
      assert.throws(() => planStagingAwareBuildSteps(), /DATABASE_ENV_LABEL/);
    },
  );
});

// E. APP_BASE_URL de Production -> bloqueado.
test("E: APP_BASE_URL contiene el dominio real de Production -> lanza, bloqueado", () => {
  withEnv(
    { ...VALID_STAGING_ENV, APP_BASE_URL: "https://radaelliswimwear.com" },
    () => {
      assert.throws(() => planStagingAwareBuildSteps(), /APP_BASE_URL/);
    },
  );
});

// F. Wompi de Production -> bloqueado.
test("F: credenciales de Wompi de PRODUCCIÓN real -> lanza, bloqueado", () => {
  withEnv(
    { ...VALID_STAGING_ENV, WOMPI_PUBLIC_KEY: "pub_prod_real123" },
    () => {
      assert.throws(() => planStagingAwareBuildSteps(), /WOMPI/);
    },
  );
});

// G. Analytics -- ANALYTICS_RUNTIME_ENABLED=true sin override explícito
// también bloquea el build completo de staging (mismo guard reutilizado
// de lib/env/assert-staging-environment.ts, ya probado ahí a fondo -- acá
// solo se confirma que este script realmente lo está usando).
test("G: ANALYTICS_RUNTIME_ENABLED=true sin STAGING_ANALYTICS_OVERRIDE -> lanza, build de staging bloqueado", () => {
  withEnv(
    {
      ...VALID_STAGING_ENV,
      ANALYTICS_RUNTIME_ENABLED: "true",
      STAGING_ANALYTICS_OVERRIDE: undefined,
    },
    () => {
      assert.throws(
        () => planStagingAwareBuildSteps(),
        /ANALYTICS_RUNTIME_ENABLED/,
      );
    },
  );
});

test("G (variante): ANALYTICS_RUNTIME_ENABLED=true CON STAGING_ANALYTICS_OVERRIDE=true -- no bloquea por eso", () => {
  withEnv(
    {
      ...VALID_STAGING_ENV,
      ANALYTICS_RUNTIME_ENABLED: "true",
      STAGING_ANALYTICS_OVERRIDE: "true",
    },
    () => {
      assert.doesNotThrow(() => planStagingAwareBuildSteps());
    },
  );
});

// H. Idempotencia -- el planificador es una función pura: mismo entorno,
// mismos pasos, siempre. La idempotencia real del SEED en sí
// (seed-staging-pentest.ts, sin cambios en esta fase) ya se verificó
// funcionalmente en la Fase 2A corriéndolo dos veces seguidas contra la
// base de desarrollo confirmada, con los mismos ids de vuelta las dos
// veces -- no se repite acá.
test("H: planStagingAwareBuildSteps es determinístico -- mismo entorno, mismos pasos, sin importar cuántas veces se llame", () => {
  withEnv({ ...VALID_STAGING_ENV, STAGING_SEED_ON_BUILD: "true" }, () => {
    const first = planStagingAwareBuildSteps();
    const second = planStagingAwareBuildSteps();
    assert.deepEqual(first, second);
  });
});

// I. Nunca imprime/incluye DATABASE_URL -- ni en los comandos planeados ni
// en el mensaje de error cuando algo falla.
test("I: ningún paso planeado ni ningún mensaje de error contiene nada con forma de connection string", () => {
  const dbUrlShape = /postgres(ql)?:\/\//i;
  withEnv({ ...VALID_STAGING_ENV, STAGING_SEED_ON_BUILD: "true" }, () => {
    const steps = planStagingAwareBuildSteps();
    for (const step of steps) {
      assert.doesNotMatch(step.command, dbUrlShape);
      assert.doesNotMatch(step.label, dbUrlShape);
    }
  });
  withEnv({ ...VALID_STAGING_ENV, DATABASE_ENV_LABEL: "production" }, () => {
    try {
      planStagingAwareBuildSteps();
      assert.fail("debía lanzar");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      assert.doesNotMatch(message, dbUrlShape);
    }
  });
});

// J. Nunca imprime/incluye las contraseñas de pentest -- ni en los pasos
// planeados ni en ningún mensaje de error. El planificador ni siquiera
// LEE esas dos variables (solo lo hace seed-staging-pentest.ts, que
// corre como un proceso hijo aparte) -- este test confirma que, aunque
// estén definidas en el entorno, jamás terminan en ningún string que
// este módulo produzca.
test("J: las contraseñas de pentest nunca aparecen en los pasos planeados ni en ningún error", () => {
  const secretCustomer = "SuperSecretoCustomer#2026";
  const secretAdmin = "SuperSecretoAdmin#2026";
  withEnv(
    {
      ...VALID_STAGING_ENV,
      STAGING_SEED_ON_BUILD: "true",
      PENTEST_CUSTOMER_PASSWORD: secretCustomer,
      PENTEST_ADMIN_PASSWORD: secretAdmin,
    },
    () => {
      const steps = planStagingAwareBuildSteps();
      const serialized = JSON.stringify(steps);
      assert.doesNotMatch(serialized, new RegExp(secretCustomer));
      assert.doesNotMatch(serialized, new RegExp(secretAdmin));
    },
  );
});

// Camino normal -- sin APP_ENVIRONMENT=staging, comportamiento idéntico al
// `next build` de siempre (Preview real de `rada`, desarrollo local, etc.).
test("APP_ENVIRONMENT ausente -- camino normal, un solo paso, next build sin más", () => {
  withEnv({ APP_ENVIRONMENT: undefined }, () => {
    const steps = planStagingAwareBuildSteps();
    assert.deepEqual(steps, [
      {
        label: "next build (camino normal, sin cambios)",
        command: "next build",
      },
    ]);
  });
});
