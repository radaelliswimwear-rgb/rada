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
  classifyFailedMigration,
  evaluateProductionReadiness,
  ORDER_FULFILLMENT_MIGRATION,
  sanitizeMigrationLogs,
  summarizeOrderFulfillmentSchemaState,
  type MigrationRecord,
  type OrderFulfillmentSchemaState,
} from "./lib/production-db-readiness";

loadProjectEnv();

function fail(message: string): never {
  console.error(`check-production-db-readiness: ${message}`);
  process.exit(1);
}

// Diagnóstico extra de solo lectura para cada migración ya clasificada como
// bloqueante (unresolved_failure o anomalous_failure_after_success a nivel
// de GRUPO -- ver classifyMigrationGroup) -- NUNCA cambia el resultado
// pass/fail del gate (eso lo decide únicamente evaluateProductionReadiness),
// solo imprime más contexto POR FILA para que la recuperación no requiera
// una segunda conexión manual. Nunca imprime DATABASE_URL, passwords,
// hashes ni datos de clientas -- solo nombres, timestamps
// presentes/ausentes, conteos y logs saneados.
async function reportBlockingMigrationDiagnostics(
  client: pg.Client,
  blockingMigrations: string[],
): Promise<void> {
  const detailResult = await client.query<{
    migration_name: string;
    started_at: Date | null;
    finished_at: Date | null;
    rolled_back_at: Date | null;
    applied_steps_count: number | null;
    logs: string | null;
  }>(
    `SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count, logs
     FROM "_prisma_migrations" WHERE migration_name = ANY($1::text[])`,
    [blockingMigrations],
  );

  for (const row of detailResult.rows) {
    const classification = classifyFailedMigration(row);
    console.log(`    ${row.migration_name}:`);
    console.log(`      clasificación: ${classification}`);
    console.log(`      started_at presente: ${row.started_at !== null}`);
    console.log(`      finished_at presente: ${row.finished_at !== null}`);
    console.log(`      rolled_back_at presente: ${row.rolled_back_at !== null}`);
    console.log(`      applied_steps_count: ${row.applied_steps_count ?? "(null)"}`);
    console.log(`      logs presente: ${row.logs !== null && row.logs !== ""}`);
    const sanitizedLogs = sanitizeMigrationLogs(row.logs);
    if (sanitizedLogs) {
      console.log(`      logs (saneado): ${sanitizedLogs}`);
    }

    if (row.migration_name === ORDER_FULFILLMENT_MIGRATION) {
      await reportOrderFulfillmentSchemaState(client);
    }
  }
}

// Objetos exactos que crea 20260915020000_order_fulfillment_and_admin_email
// (ver su migration.sql) -- un solo round-trip de solo lectura, sin filas
// reales, sin datos de clientas.
async function reportOrderFulfillmentSchemaState(
  client: pg.Client,
): Promise<void> {
  const schemaResult = await client.query<OrderFulfillmentSchemaState>(`
    SELECT
      EXISTS(SELECT 1 FROM pg_type WHERE typname = 'FulfillmentStatus') AS "fulfillmentStatusEnumExists",
      EXISTS(
        SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'PaymentStatus' AND e.enumlabel = 'REFUNDED'
      ) AS "paymentStatusHasRefundedValue",
      EXISTS(SELECT 1 FROM pg_sequences WHERE sequencename = 'Order_orderNumber_seq') AS "orderNumberSequenceExists",
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Order' AND column_name = 'fulfillmentStatus'
      ) AS "orderFulfillmentStatusColumnExists",
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Order' AND column_name = 'orderNumber'
      ) AS "orderOrderNumberColumnExists",
      EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'Order_orderNumber_key') AS "orderNumberUniqueIndexExists",
      EXISTS(
        SELECT 1 FROM information_schema.tables WHERE table_name = 'OrderStatusEvent'
      ) AS "orderStatusEventTableExists",
      EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'OrderStatusEvent_orderId_createdAt_idx') AS "orderStatusEventIndexExists",
      EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'OrderStatusEvent_pkey') AS "orderStatusEventPkeyExists",
      EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'OrderStatusEvent_orderId_fkey') AS "orderStatusEventFkeyExists"
  `);
  const state = schemaResult.rows[0];
  if (!state) {
    fail(
      "no se pudo leer el estado del schema para el diagnóstico de order_fulfillment (fila vacía inesperada).",
    );
  }
  const summary = summarizeOrderFulfillmentSchemaState(state);

  console.log(`      schema real (objetos de ${ORDER_FULFILLMENT_MIGRATION}):`);
  for (const [key, exists] of Object.entries(state)) {
    console.log(`        ${key}: ${exists}`);
  }
  console.log(
    `        resumen: ${summary.existingCount}/${summary.totalCount} objetos existen (allExist=${summary.allExist}, noneExist=${summary.noneExist})`,
  );
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
    if (result.blockingMigrations.length > 0) {
      console.log(
        `  migraciones bloqueantes: ${result.blockingMigrations.join(", ")}`,
      );
      await reportBlockingMigrationDiagnostics(client, result.blockingMigrations);
    }
    const informationalRolledBack = result.historicalRolledBackAttempts.filter(
      (name) => !result.blockingMigrations.includes(name),
    );
    if (informationalRolledBack.length > 0) {
      console.log(
        `  intentos rolled-back históricos, ya superados (informativo, NO bloquean): ${informationalRolledBack.join(", ")}`,
      );
      if (informationalRolledBack.includes(ORDER_FULFILLMENT_MIGRATION)) {
        await reportOrderFulfillmentSchemaState(client);
      }
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
