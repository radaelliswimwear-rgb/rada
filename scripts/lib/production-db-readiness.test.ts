import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertProductionEnvironment,
  evaluateProductionReadiness,
  RISKY_MIGRATIONS,
  type MigrationRecord,
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
