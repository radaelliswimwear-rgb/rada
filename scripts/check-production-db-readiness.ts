// Gate de solo lectura antes de `prisma migrate deploy` en Production (ver
// package.json: "production:build"). Portable a propósito -- depende
// únicamente de APP_ENVIRONMENT/DATABASE_ENV_LABEL (lib/env/app-environment.ts,
// scripts/lib/load-safe-env.ts), nunca de VERCEL_ENV ni de ninguna variable
// exclusiva de un hosting: el mismo comando funciona igual en Vercel,
// Railway, Render o cualquier otro.
//
// Nunca escribe nada. Nunca imprime DATABASE_URL, passwords, hashes, ni
// datos de usuarios reales -- solo nombres de migraciones, conteos
// agregados y booleanos. Sale con código distinto de cero (fail-closed) ante
// cualquier problema: entorno mal clasificado, DB inalcanzable, migración
// fallida/revertida, migración riesgosa pendiente con datos incompatibles,
// o falta el usuario sentinela de invitado.
import { readdirSync } from "node:fs";
import pg from "pg";
import { loadProjectEnv } from "./lib/load-safe-env";
import {
  assertProductionEnvironment,
  evaluateProductionReadiness,
  type MigrationRecord,
} from "./lib/production-db-readiness";

loadProjectEnv();

function fail(message: string): never {
  console.error(`check-production-db-readiness: ${message}`);
  process.exit(1);
}

async function main() {
  // 1. Guarda de entorno -- antes de tocar Prisma/pg, antes de cualquier
  // consulta. Ninguna de las dos variables se infiere ni tiene fallback.
  try {
    assertProductionEnvironment({
      APP_ENVIRONMENT: process.env.APP_ENVIRONMENT,
      DATABASE_ENV_LABEL: process.env.DATABASE_ENV_LABEL,
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    fail("DATABASE_URL no está definida. Abortando antes de conectar.");
  }

  const repoMigrationNames = readdirSync("prisma/migrations", {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
  } catch (error) {
    fail(
      `no se pudo conectar a la base de datos (${
        error instanceof Error ? error.message : String(error)
      }). Abortando -- el deployment no debe continuar sin poder verificar el estado real de la DB.`,
    );
  }

  try {
    const migrationsResult = await client.query<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>(
      `SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`,
    );
    const appliedMigrations: MigrationRecord[] = migrationsResult.rows;

    const cartDup = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM (
         SELECT "userId" FROM "Cart" WHERE "userId" IS NOT NULL
         GROUP BY "userId" HAVING count(*) > 1
       ) t`,
    );
    const wishlistDup = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM (
         SELECT "userId" FROM "Wishlist" WHERE "userId" IS NOT NULL
         GROUP BY "userId" HAVING count(*) > 1
       ) t`,
    );
    const paymentDup = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM (
         SELECT "providerRef" FROM "Payment" WHERE "providerRef" IS NOT NULL
         GROUP BY "providerRef" HAVING count(*) > 1
       ) t`,
    );
    const guestRow = await client.query(
      `SELECT 1 FROM "User" WHERE id = 'guest' LIMIT 1`,
    );

    const result = evaluateProductionReadiness({
      appliedMigrations,
      repoMigrationNames,
      cartDuplicateGroups: Number(cartDup.rows[0]?.count ?? 0),
      wishlistDuplicateGroups: Number(wishlistDup.rows[0]?.count ?? 0),
      paymentDuplicateGroups: Number(paymentDup.rows[0]?.count ?? 0),
      guestExists: (guestRow.rowCount ?? 0) > 0,
    });

    console.log("check-production-db-readiness:");
    console.log(
      `  migraciones del repo: ${repoMigrationNames.length}, pendientes: ${result.pendingMigrations.length}`,
    );
    if (result.pendingMigrations.length > 0) {
      console.log(`    pendientes: ${result.pendingMigrations.join(", ")}`);
    }
    if (result.failedMigrations.length > 0) {
      console.log(
        `  migraciones fallidas/revertidas: ${result.failedMigrations.join(", ")}`,
      );
    }
    for (const [name, status] of Object.entries(result.riskyMigrationsStatus)) {
      console.log(`  ${name}: ${status}`);
    }
    console.log(
      `  duplicateGroups -> Cart: ${cartDup.rows[0]?.count ?? 0}, Wishlist: ${wishlistDup.rows[0]?.count ?? 0}, Payment: ${paymentDup.rows[0]?.count ?? 0}`,
    );
    console.log(`  guestExists: ${(guestRow.rowCount ?? 0) > 0}`);

    if (!result.pass) {
      console.error("  RESULTADO: FAIL");
      for (const reason of result.reasons) {
        console.error(`    - ${reason}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log("  RESULTADO: PASS");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
