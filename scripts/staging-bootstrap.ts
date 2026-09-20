// Fase 2A del proyecto de staging/pentest (sep. 2026) -- ver
// docs/pentest-architecture.md. Punto de entrada único para dejar
// `rada-staging` listo: valida el entorno, aplica migraciones, siembra
// datos sintéticos, y corre el checker de consistencia de inventario --
// en ESE orden, abortando en el primer paso que falle. Nunca toca
// Production bajo ninguna circunstancia: el primer guard
// (assertStagingEnvironment) corta antes de que cualquiera de los pasos
// siguientes pueda ejecutarse si el entorno no es, de verdad, staging.
//
// Uso:
//   PENTEST_CUSTOMER_PASSWORD=... PENTEST_ADMIN_PASSWORD=... \
//     npm run staging:bootstrap
import { spawnSync } from "node:child_process";
import {
  loadProjectEnv,
  resolveDatabaseUrl,
  describeDatabaseTarget,
} from "./lib/load-safe-env";
import { assertStagingEnvironment } from "../lib/env/assert-staging-environment";

function fail(message: string): never {
  console.error(`staging:bootstrap: ${message}`);
  process.exit(1);
}

function runStep(
  label: string,
  command: string,
  extraEnv: Record<string, string>,
): void {
  console.log(`\nstaging:bootstrap -> ${label}...`);
  const result = spawnSync(command, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    fail(`"${label}" no se pudo ejecutar: ${result.error.message}`);
  }
  if ((result.status ?? 1) !== 0) {
    fail(
      `"${label}" terminó con error (código ${result.status}). Abortando el resto del bootstrap.`,
    );
  }
}

function main(): void {
  loadProjectEnv();

  // 1. Guarda de entorno -- antes de CUALQUIER otra cosa.
  try {
    assertStagingEnvironment();
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  // 2. Confirmación independiente de la conexión real que se va a usar.
  const { databaseUrl, target } = resolveDatabaseUrl({
    requireEnvironmentLabel: true,
  });
  if (target.environmentLabel !== "staging") {
    fail(
      `DATABASE_ENV_LABEL resuelto ("${target.environmentLabel}") no es "staging". Abortando antes de tocar nada.`,
    );
  }
  console.log("staging:bootstrap: entorno confirmado.");
  console.log(describeDatabaseTarget(target));

  if (
    !process.env.PENTEST_CUSTOMER_PASSWORD ||
    !process.env.PENTEST_ADMIN_PASSWORD
  ) {
    fail(
      "PENTEST_CUSTOMER_PASSWORD y PENTEST_ADMIN_PASSWORD deben estar definidas -- ver docs/pentest-accounts.md.",
    );
  }

  const dbEnv = { DATABASE_URL: databaseUrl };

  // 3. Migraciones -- SOLO `migrate deploy` (nunca dev/reset/push), mismo
  // comando exacto que usa production:build para Production.
  runStep("prisma migrate deploy", "npx prisma migrate deploy", dbEnv);

  // 4. Seed sintético -- scripts/seed-staging-pentest.ts vuelve a correr
  // su propio assertStagingEnvironment() de forma independiente (defensa
  // en profundidad: este paso no confía en que el paso 1 de este mismo
  // proceso sea la única protección).
  runStep(
    "seed sintético de pentest",
    "npx tsx scripts/seed-staging-pentest.ts",
    dbEnv,
  );

  // 5. Consistency check -- de solo lectura, nunca hace fallar el
  // bootstrap por encontrar algo (solo informa).
  runStep(
    "checker de consistencia de inventario (informativo)",
    "npx tsx scripts/check-inventory-consistency.ts",
    dbEnv,
  );

  console.log(
    "\nstaging:bootstrap: completo. Sin secretos impresos arriba (solo host/nombre de DB, nunca DATABASE_URL).",
  );
}

main();
