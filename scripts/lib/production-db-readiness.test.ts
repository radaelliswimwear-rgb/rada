import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertProductionEnvironment,
  classifyFailedMigration,
  classifyMigrationGroup,
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

// Una fila exitosa individual, para armar historiales de varias filas por
// migration_name a mano.
function successRow(
  migration_name: string,
  at = "2026-09-01T00:00:00Z",
): MigrationRecord {
  return { migration_name, finished_at: new Date(at), rolled_back_at: null };
}

// Falla sin resolver: finished_at null, rolled_back_at null.
function unresolvedFailureRow(migration_name: string): MigrationRecord {
  return { migration_name, finished_at: null, rolled_back_at: null };
}

// Intento revertido administrativamente (prisma migrate resolve --rolled-back).
function rolledBackRow(
  migration_name: string,
  at = "2026-09-01T00:00:00Z",
): MigrationRecord {
  return {
    migration_name,
    finished_at: null,
    rolled_back_at: new Date(at),
  };
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
    result.blockingMigrations.includes(
      RISKY_MIGRATIONS.paymentProviderRefUnique,
    ),
  );
  assert.ok(result.reasons.some((r) => r.includes("bloqueante")));
});

// ---------------------------------------------------------------------------
// classifyMigrationGroup: los 4 estados posibles a nivel de GRUPO (todas las
// filas de un mismo migration_name evaluadas juntas, no fila por fila).
// ---------------------------------------------------------------------------

test("classifyMigrationGroup: una fila exitosa -> applied", () => {
  assert.equal(
    classifyMigrationGroup([successRow("m")]),
    "applied",
  );
});

test("classifyMigrationGroup: una fila failed unresolved -> unresolved_failure", () => {
  assert.equal(
    classifyMigrationGroup([unresolvedFailureRow("m")]),
    "unresolved_failure",
  );
});

test("classifyMigrationGroup: solo rolled-back, sin éxito posterior -> pending", () => {
  assert.equal(
    classifyMigrationGroup([rolledBackRow("m")]),
    "pending",
  );
});

test("classifyMigrationGroup: rolled-back histórico + retry exitoso -> applied (caso real de Production)", () => {
  assert.equal(
    classifyMigrationGroup([rolledBackRow("m"), successRow("m")]),
    "applied",
  );
});

test("classifyMigrationGroup: fila exitosa + falla sin resolver posterior -> anomalous_failure_after_success", () => {
  assert.equal(
    classifyMigrationGroup([successRow("m"), unresolvedFailureRow("m")]),
    "anomalous_failure_after_success",
  );
});

test("classifyMigrationGroup: dos rolled-back + un retry exitoso -> applied", () => {
  assert.equal(
    classifyMigrationGroup([
      rolledBackRow("m"),
      rolledBackRow("m"),
      successRow("m"),
    ]),
    "applied",
  );
});

test("classifyMigrationGroup: sin ninguna fila -> pending", () => {
  assert.equal(classifyMigrationGroup([]), "pending");
});

// ---------------------------------------------------------------------------
// evaluateProductionReadiness: casos A-I pedidos explícitamente, cada uno
// sobre una migración objetivo distinta para aislar el escenario. El resto
// de REPO_MIGRATIONS va normalmente aplicado salvo que el caso diga otra
// cosa, para que solo la migración objetivo determine pass/fail.
// ---------------------------------------------------------------------------

const TARGET = "20260101000000_target_migration";
const OTHER_REPO_MIGRATIONS = REPO_MIGRATIONS.filter(
  (m) =>
    m !== RISKY_MIGRATIONS.cartWishlistUnique &&
    m !== RISKY_MIGRATIONS.paymentProviderRefUnique,
);

test("caso A: fila exitosa normal -> applied, pasa", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    repoMigrationNames: [...OTHER_REPO_MIGRATIONS, TARGET],
    appliedMigrations: [
      ...applied(OTHER_REPO_MIGRATIONS),
      successRow(TARGET),
    ],
  });
  assert.equal(result.pass, true);
  assert.ok(!result.pendingMigrations.includes(TARGET));
  assert.ok(!result.blockingMigrations.includes(TARGET));
});

test("caso B: fila failed unresolved -> blocker", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    repoMigrationNames: [...OTHER_REPO_MIGRATIONS, TARGET],
    appliedMigrations: [
      ...applied(OTHER_REPO_MIGRATIONS),
      unresolvedFailureRow(TARGET),
    ],
  });
  assert.equal(result.pass, false);
  assert.ok(result.blockingMigrations.includes(TARGET));
});

test("caso C: solo rolled-back, sin éxito -> pending/retryable, NO failed", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    repoMigrationNames: [...OTHER_REPO_MIGRATIONS, TARGET],
    appliedMigrations: [
      ...applied(OTHER_REPO_MIGRATIONS),
      rolledBackRow(TARGET),
    ],
  });
  assert.equal(result.pass, true);
  assert.ok(result.pendingMigrations.includes(TARGET));
  assert.ok(!result.blockingMigrations.includes(TARGET));
  assert.ok(result.historicalRolledBackAttempts.includes(TARGET));
});

test("caso D (CASO REAL DE PRODUCTION): rolled-back histórico + retry exitoso -> applied, NO blocker", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    repoMigrationNames: [...OTHER_REPO_MIGRATIONS, TARGET],
    appliedMigrations: [
      ...applied(OTHER_REPO_MIGRATIONS),
      rolledBackRow(TARGET),
      successRow(TARGET, "2026-09-02T00:00:00Z"),
    ],
  });
  assert.equal(result.pass, true);
  assert.ok(!result.pendingMigrations.includes(TARGET));
  assert.ok(!result.blockingMigrations.includes(TARGET));
  assert.ok(result.historicalRolledBackAttempts.includes(TARGET));
});

test("caso E: failed unresolved + fila exitosa anterior -> blocker (inconsistencia anómala)", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    repoMigrationNames: [...OTHER_REPO_MIGRATIONS, TARGET],
    appliedMigrations: [
      ...applied(OTHER_REPO_MIGRATIONS),
      successRow(TARGET, "2026-09-01T00:00:00Z"),
      unresolvedFailureRow(TARGET),
    ],
  });
  assert.equal(result.pass, false);
  assert.ok(result.blockingMigrations.includes(TARGET));
});

test("caso F: dos intentos rolled-back + uno posterior exitoso -> applied", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    repoMigrationNames: [...OTHER_REPO_MIGRATIONS, TARGET],
    appliedMigrations: [
      ...applied(OTHER_REPO_MIGRATIONS),
      rolledBackRow(TARGET, "2026-09-01T00:00:00Z"),
      rolledBackRow(TARGET, "2026-09-02T00:00:00Z"),
      successRow(TARGET, "2026-09-03T00:00:00Z"),
    ],
  });
  assert.equal(result.pass, true);
  assert.ok(!result.blockingMigrations.includes(TARGET));
});

test("caso G: 4 migraciones nuevas sin registro exitoso -> pending permitido", () => {
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
  assert.deepEqual(
    result.pendingMigrations.sort(),
    [...NEW_MIGRATIONS].sort(),
  );
});

test("caso H: migración risky pendiente + datos incompatibles -> blocker sigue funcionando", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: applied(
      REPO_MIGRATIONS.filter(
        (m) => m !== RISKY_MIGRATIONS.paymentProviderRefUnique,
      ),
    ),
    paymentDuplicateGroups: 2,
  });
  assert.equal(result.pass, false);
  assert.equal(
    result.riskyMigrationsStatus[RISKY_MIGRATIONS.paymentProviderRefUnique],
    "pending",
  );
});

test("caso I: migración risky aplicada mediante retry exitoso -> NO vuelve a comprobar incompatibilidad histórica", () => {
  const result = evaluateProductionReadiness({
    ...BASE_INPUT,
    appliedMigrations: [
      ...applied(
        REPO_MIGRATIONS.filter(
          (m) => m !== RISKY_MIGRATIONS.paymentProviderRefUnique,
        ),
      ),
      rolledBackRow(RISKY_MIGRATIONS.paymentProviderRefUnique),
      successRow(
        RISKY_MIGRATIONS.paymentProviderRefUnique,
        "2026-09-02T00:00:00Z",
      ),
    ],
    // Duplicados en el estado ACTUAL de los datos -- no deberían importar,
    // porque la migración ya está aplicada (vía el retry exitoso).
    paymentDuplicateGroups: 9,
  });
  assert.equal(result.pass, true);
  assert.equal(
    result.riskyMigrationsStatus[RISKY_MIGRATIONS.paymentProviderRefUnique],
    "applied",
  );
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
