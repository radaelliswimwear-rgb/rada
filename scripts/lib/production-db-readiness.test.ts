import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertProductionEnvironment,
  classifyFailedMigration,
  evaluateProductionReadiness,
  RISKY_MIGRATIONS,
  sanitizeMigrationLogs,
  summarizeOrderFulfillmentSchemaState,
  type MigrationRecord,
  type OrderFulfillmentSchemaState,
} from "./production-db-readiness";

// Todo este archivo prueba lógica pura -- ninguna conexión a base de datos,
// ninguna variable de entorno real. Ver scripts/check-production-db-readiness.ts
// para el I/O que envuelve esta lógica.

const REPO_MIGRATIONS = [
  "20260714202536_init",
  RISKY_MIGRATIONS.cartWishlistUnique,
  RISKY_MIGRATIONS.paymentProviderRefUnique,
  "20260916120000_payment_hosted_checkout_fields",
  "20260916150000_payment_wompi_transaction_id",
  "20260916190000_payment_original_user_and_review_flag",
  "20260917025040_add_email_outbox",
];

function applied(names: string[]): MigrationRecord[] {
  return names.map((migration_name) => ({
    migration_name,
    finished_at: new Date("2026-09-01T00:00:00Z"),
    rolled_back_at: null,
  }));
}

const BASE_INPUT = {
  repoMigrationNames: REPO_MIGRATIONS,
  cartDuplicateGroups: 0,
  wishlistDuplicateGroups: 0,
  paymentDuplicateGroups: 0,
  guestExists: true,
};

test("assertProductionEnvironment: rechaza si APP_ENVIRONMENT != production", () => {
  assert.throws(
    () =>
      assertProductionEnvironment({
        APP_ENVIRONMENT: "staging",
        DATABASE_ENV_LABEL: "production",
      }),
    /APP_ENVIRONMENT/,
  );
});

test("assertProductionEnvironment: rechaza si APP_ENVIRONMENT no está definida", () => {
  assert.throws(
    () =>
      assertProductionEnvironment({ DATABASE_ENV_LABEL: "production" }),
    /APP_ENVIRONMENT/,
  );
});

test("assertProductionEnvironment: rechaza si DATABASE_ENV_LABEL != production", () => {
  assert.throws(
    () =>
      assertProductionEnvironment({
        APP_ENVIRONMENT: "production",
        DATABASE_ENV_LABEL: "development",
      }),
    /DATABASE_ENV_LABEL/,
  );
});

test("assertProductionEnvironment: rechaza si DATABASE_ENV_LABEL no está definida", () => {
  assert.throws(
    () =>
      assertProductionEnvironment({ APP_ENVIRONMENT: "production" }),
    /DATABASE_ENV_LABEL/,
  );
});

test("assertProductionEnvironment: pasa cuando ambas son production", () => {
  assert.doesNotThrow(() =>
    assertProductionEnvironment({
      APP_ENVIRONMENT: "production",
      DATABASE_ENV_LABEL: "production",
    }),
  );
});

test("evaluateProductionReadiness: duplicados en Cart con la migración pendiente -> falla", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(["20260714202536_init"]),
    cartDuplicateGroups: 2,
  });
  assert.equal(result.pass, false);
  assert.ok(result.reasons.some((r) => r.includes("Cart.userId")));
});

test("evaluateProductionReadiness: duplicados en Wishlist con la migración pendiente -> falla", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(["20260714202536_init"]),
    wishlistDuplicateGroups: 1,
  });
  assert.equal(result.pass, false);
  assert.ok(result.reasons.some((r) => r.includes("Wishlist.userId")));
});

test("evaluateProductionReadiness: duplicados en Payment.providerRef con la migración pendiente -> falla", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(["20260714202536_init"]),
    paymentDuplicateGroups: 3,
  });
  assert.equal(result.pass, false);
  assert.ok(result.reasons.some((r) => r.includes("Payment.providerRef")));
});

test("evaluateProductionReadiness: guest ausente -> falla", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(REPO_MIGRATIONS),
    guestExists: false,
  });
  assert.equal(result.pass, false);
  assert.ok(result.reasons.some((r) => r.includes('User(id="guest")')));
});

test("evaluateProductionReadiness: guest presente + todo aplicado + sin duplicados -> pasa", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(REPO_MIGRATIONS),
  });
  assert.equal(result.pass, true);
  assert.deepEqual(result.reasons, []);
});

test("evaluateProductionReadiness: migración risky PENDIENTE con datos incompatibles -> falla", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(
      REPO_MIGRATIONS.filter(
        (m) => m !== RISKY_MIGRATIONS.cartWishlistUnique,
      ),
    ),
    cartDuplicateGroups: 5,
  });
  assert.equal(result.pass, false);
  assert.equal(
    result.riskyMigrationsStatus[RISKY_MIGRATIONS.cartWishlistUnique],
    "pending",
  );
});

test("evaluateProductionReadiness: migración risky YA APLICADA ignora duplicados actuales", () => {
  // Si el índice único ya existe, ya quedó demostrado que los datos eran
  // compatibles cuando se aplicó -- el estado actual de duplicados no debe
  // volver a bloquear el gate.
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(REPO_MIGRATIONS),
    cartDuplicateGroups: 4,
    paymentDuplicateGroups: 7,
  });
  assert.equal(result.pass, true);
  assert.equal(
    result.riskyMigrationsStatus[RISKY_MIGRATIONS.cartWishlistUnique],
    "applied",
  );
  assert.equal(
    result.riskyMigrationsStatus[RISKY_MIGRATIONS.paymentProviderRefUnique],
    "applied",
  );
});

test("evaluateProductionReadiness: las 4 migraciones nuevas del release pendientes es NORMAL, no bloquea", () => {
  const NEW_MIGRATIONS = [
    "20260916120000_payment_hosted_checkout_fields",
    "20260916150000_payment_wompi_transaction_id",
    "20260916190000_payment_original_user_and_review_flag",
    "20260917025040_add_email_outbox",
  ];
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(
      REPO_MIGRATIONS.filter((m) => !NEW_MIGRATIONS.includes(m)),
    ),
  });
  assert.equal(result.pass, true);
  assert.deepEqual(result.pendingMigrations.sort(), [...NEW_MIGRATIONS].sort());
});

test("evaluateProductionReadiness: migración fallida/revertida -> falla y la reporta", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: [
      ...applied(["20260714202536_init"]),
      {
        migration_name: RISKY_MIGRATIONS.paymentProviderRefUnique,
        finished_at: null,
        rolled_back_at: null,
      },
    ],
  });
  assert.equal(result.pass, false);
  assert.ok(
    result.failedMigrations.includes(
      RISKY_MIGRATIONS.paymentProviderRefUnique,
    ),
  );
  assert.ok(result.reasons.some((r) => r.includes("fallida")));
});

test("classifyFailedMigration: finished_at y rolled_back_at ambos null -> failed_unresolved", () => {
  assert.equal(
    classifyFailedMigration({ finished_at: null, rolled_back_at: null }),
    "failed_unresolved",
  );
});

test("classifyFailedMigration: rolled_back_at con valor -> resolved_rolled_back", () => {
  assert.equal(
    classifyFailedMigration({
      finished_at: null,
      rolled_back_at: new Date("2026-09-16T00:00:00Z"),
    }),
    "resolved_rolled_back",
  );
});

test("classifyFailedMigration: rolled_back_at tiene prioridad aunque finished_at también tenga valor", () => {
  assert.equal(
    classifyFailedMigration({
      finished_at: new Date("2026-09-16T00:00:00Z"),
      rolled_back_at: new Date("2026-09-16T00:05:00Z"),
    }),
    "resolved_rolled_back",
  );
});

test("sanitizeMigrationLogs: null -> null", () => {
  assert.equal(sanitizeMigrationLogs(null), null);
});

test("sanitizeMigrationLogs: string vacío -> null", () => {
  assert.equal(sanitizeMigrationLogs(""), null);
});

test("sanitizeMigrationLogs: redacta connection strings", () => {
  const result = sanitizeMigrationLogs(
    "Error connecting to postgresql://user:secretpass@host.neon.tech/db?sslmode=require",
  );
  assert.ok(result);
  assert.ok(!result.includes("secretpass"));
  assert.ok(result.includes("[REDACTED_CONNECTION_STRING]"));
});

test("sanitizeMigrationLogs: redacta password=/secret=/token=", () => {
  const result = sanitizeMigrationLogs("auth failed: password=hunter2 token=abc123");
  assert.ok(result);
  assert.ok(!result.includes("hunter2"));
  assert.ok(!result.includes("abc123"));
  assert.ok(result.includes("password=[REDACTED]"));
  assert.ok(result.includes("token=[REDACTED]"));
});

test("sanitizeMigrationLogs: trunca logs muy largos", () => {
  const longLog = "x".repeat(2000);
  const result = sanitizeMigrationLogs(longLog);
  assert.ok(result);
  assert.ok(result.length < 2000);
  assert.ok(result.includes("truncado"));
});

test("sanitizeMigrationLogs: preserva un mensaje de error normal de Postgres sin secretos", () => {
  const log = 'ERROR: relation "OrderStatusEvent" already exists (SQLSTATE 42P07)';
  assert.equal(sanitizeMigrationLogs(log), log);
});

function buildSchemaState(
  overrides: Partial<OrderFulfillmentSchemaState> = {},
): OrderFulfillmentSchemaState {
  return {
    fulfillmentStatusEnumExists: true,
    paymentStatusHasRefundedValue: true,
    orderNumberSequenceExists: true,
    orderFulfillmentStatusColumnExists: true,
    orderOrderNumberColumnExists: true,
    orderNumberUniqueIndexExists: true,
    orderStatusEventTableExists: true,
    orderStatusEventIndexExists: true,
    orderStatusEventPkeyExists: true,
    orderStatusEventFkeyExists: true,
    ...overrides,
  };
}

test("summarizeOrderFulfillmentSchemaState: todos los objetos existen -> allExist true", () => {
  const summary = summarizeOrderFulfillmentSchemaState(buildSchemaState());
  assert.equal(summary.allExist, true);
  assert.equal(summary.noneExist, false);
  assert.equal(summary.existingCount, 10);
  assert.equal(summary.totalCount, 10);
});

test("summarizeOrderFulfillmentSchemaState: ningún objeto existe -> noneExist true", () => {
  const summary = summarizeOrderFulfillmentSchemaState(
    buildSchemaState({
      fulfillmentStatusEnumExists: false,
      paymentStatusHasRefundedValue: false,
      orderNumberSequenceExists: false,
      orderFulfillmentStatusColumnExists: false,
      orderOrderNumberColumnExists: false,
      orderNumberUniqueIndexExists: false,
      orderStatusEventTableExists: false,
      orderStatusEventIndexExists: false,
      orderStatusEventPkeyExists: false,
      orderStatusEventFkeyExists: false,
    }),
  );
  assert.equal(summary.noneExist, true);
  assert.equal(summary.allExist, false);
  assert.equal(summary.existingCount, 0);
});

test("summarizeOrderFulfillmentSchemaState: aplicación parcial -> ni allExist ni noneExist", () => {
  const summary = summarizeOrderFulfillmentSchemaState(
    buildSchemaState({
      orderStatusEventTableExists: false,
      orderStatusEventIndexExists: false,
      orderStatusEventPkeyExists: false,
      orderStatusEventFkeyExists: false,
    }),
  );
  assert.equal(summary.allExist, false);
  assert.equal(summary.noneExist, false);
  assert.equal(summary.existingCount, 6);
});
