import { getAppEnvironment } from "./app-environment";

// Fase 2A del proyecto de staging/pentest (sep. 2026) -- ver
// docs/pentest-architecture.md. Guard de precondición reutilizable para
// cualquier script que solo debe poder correr contra el entorno de
// staging real (el seed sintético, el bootstrap, y cualquier otro script
// destructivo de pentest que se agregue después): NUNCA debe ser posible
// correrlos "por accidente" contra Production ni contra un entorno a
// medio configurar.
//
// Deliberadamente NO importa nada de lib/payments/guard-real-payments.ts
// ni de lib/observability/log.ts (que arrastran lib/prisma, que exige
// DATABASE_URL en el momento de importar) -- este guard tiene que poder
// evaluarse ANTES de asumir que existe una conexión de base de datos
// utilizable. La clasificación de Wompi de acá es un duplicado
// deliberado y mínimo de la de guard-real-payments.ts (mismo criterio:
// prefijo/host público, nunca el secreto completo).
function isWompiProductionByPrefix(value: string | undefined): boolean {
  if (!value) return false;
  return (
    value.includes("production.wompi.co") ||
    value.startsWith("pub_prod_") ||
    value.startsWith("prv_prod_")
  );
}

export type StagingEnvironmentFailure = { check: string; reason: string };

// Devuelve la lista de fallas SIN lanzar -- para que un script pueda
// imprimir el detalle completo antes de decidir abortar (assertStagingEnvironment,
// más abajo, es la versión que sí lanza y es lo que la mayoría de los
// llamadores debería usar).
export function checkStagingEnvironment(): StagingEnvironmentFailure[] {
  const failures: StagingEnvironmentFailure[] = [];

  if (getAppEnvironment() !== "staging") {
    failures.push({
      check: "APP_ENVIRONMENT",
      reason: `debe ser exactamente "staging" (valor actual: ${
        process.env.APP_ENVIRONMENT ?? "(no definida)"
      }).`,
    });
  }

  if (process.env.DATABASE_ENV_LABEL !== "staging") {
    failures.push({
      check: "DATABASE_ENV_LABEL",
      reason: `debe ser exactamente "staging" (valor actual: ${
        process.env.DATABASE_ENV_LABEL ?? "(no definida)"
      }).`,
    });
  }

  const appBaseUrl = process.env.APP_BASE_URL ?? "";
  if (appBaseUrl.includes("radaelliswimwear.com")) {
    failures.push({
      check: "APP_BASE_URL",
      reason:
        "no debe contener el dominio real de Production (radaelliswimwear.com).",
    });
  }

  if (
    isWompiProductionByPrefix(process.env.WOMPI_BASE_URL) ||
    isWompiProductionByPrefix(process.env.WOMPI_PUBLIC_KEY) ||
    isWompiProductionByPrefix(process.env.WOMPI_PRIVATE_KEY)
  ) {
    failures.push({
      check: "WOMPI",
      reason:
        "WOMPI_BASE_URL/WOMPI_PUBLIC_KEY/WOMPI_PRIVATE_KEY parecen ser de PRODUCCIÓN real -- deben ser de Sandbox en staging.",
    });
  }

  // Mismo criterio EXACTO que lib/analytics/feature-flags.ts
  // (isAnalyticsRuntimeEnabled): el flag en "true" sin el override
  // explícito de staging es justo el caso accidental que este guard
  // existe para atrapar (la copia en bloque de variables de Production
  // que originó esta fase). Se lee el env directo, sin importar
  // feature-flags.ts, para que este módulo siga sin depender de nada más
  // que lib/env/app-environment.ts (ver el comentario de arriba sobre por
  // qué este archivo no importa lib/payments/guard-real-payments.ts).
  if (
    process.env.ANALYTICS_RUNTIME_ENABLED === "true" &&
    process.env.STAGING_ANALYTICS_OVERRIDE !== "true"
  ) {
    failures.push({
      check: "ANALYTICS_RUNTIME_ENABLED",
      reason:
        'está en "true" sin STAGING_ANALYTICS_OVERRIDE=true -- analytics no debe poder salir de staging sin ese override explícito.',
    });
  }

  return failures;
}

// Versión que lanza -- la que debería usar cualquier script destructivo o
// que siembra datos (seed sintético, bootstrap, futuros scripts de
// pentest). Fail-closed: cualquier falla, por chica que sea, aborta antes
// de tocar nada.
export function assertStagingEnvironment(): void {
  const failures = checkStagingEnvironment();
  if (failures.length === 0) return;

  const details = failures.map((f) => `  - ${f.check}: ${f.reason}`).join("\n");
  throw new Error(
    `assertStagingEnvironment: este proceso exige un entorno de staging real y no lo encontró. Fallas:\n${details}`,
  );
}
