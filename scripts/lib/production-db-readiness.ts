// Lógica pura del gate de solo lectura que corre antes de `prisma migrate
// deploy` en Production (ver scripts/check-production-db-readiness.ts).
// Separada del I/O real (conexión a Postgres, lectura de env) para poder
// probarla sin tocar ninguna base de datos -- mismo patrón que
// computeInvalidCartLineIds en components/cart-drawer/cart-store.tsx.

export type MigrationRecord = {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

// Las 3 migraciones ya existentes cuyo UNIQUE INDEX puede fallar si la base
// real tiene datos incompatibles con la restricción -- ver auditoría de
// migraciones previa a este gate. `active_toggle` (UPDATE de backfill sobre
// Category, sin restricción UNIQUE) queda fuera a propósito: no puede
// fallar por datos duplicados, solo comparamos su estado aplicada/pendiente
// como cualquier otra migración.
export const RISKY_MIGRATIONS = {
  cartWishlistUnique: "20260914213939_add_cart_wishlist_user_unique",
  paymentProviderRefUnique: "20260915010000_payment_security_hardening",
} as const;

export function assertProductionEnvironment(env: {
  APP_ENVIRONMENT?: string;
  DATABASE_ENV_LABEL?: string;
}): void {
  if (env.APP_ENVIRONMENT !== "production") {
    throw new Error(
      `APP_ENVIRONMENT debe ser "production" para correr este gate (valor actual: ${
        env.APP_ENVIRONMENT ?? "(no definida)"
      }). Abortando antes de cualquier consulta.`,
    );
  }
  if (env.DATABASE_ENV_LABEL !== "production") {
    throw new Error(
      `DATABASE_ENV_LABEL debe ser "production" para correr este gate (valor actual: ${
        env.DATABASE_ENV_LABEL ?? "(no definida)"
      }). Abortando antes de cualquier consulta.`,
    );
  }
}

export type PreflightInput = {
  appliedMigrations: MigrationRecord[];
  repoMigrationNames: string[];
  cartDuplicateGroups: number;
  wishlistDuplicateGroups: number;
  paymentDuplicateGroups: number;
  guestExists: boolean;
};

export type PreflightResult = {
  pass: boolean;
  reasons: string[];
  pendingMigrations: string[];
  failedMigrations: string[];
  riskyMigrationsStatus: Record<string, "applied" | "pending">;
};

/**
 * Evalúa si Production está lista para `prisma migrate deploy`. Puro: no
 * conecta a nada, solo decide a partir de lo que ya se consultó.
 *
 * Una migración risky PENDIENTE exige que sus datos sean compatibles (sin
 * duplicados) -- de lo contrario el UNIQUE INDEX fallaría al aplicarse. Una
 * migración risky ya APLICADA no vuelve a chequearse: si el índice ya
 * existe, ya se demostró compatible cuando se creó: no importa el estado
 * actual de los datos para decidir si el gate pasa.
 */
export function evaluateProductionReadiness(
  input: PreflightInput,
): PreflightResult {
  const reasons: string[] = [];

  const appliedNames = new Set(
    input.appliedMigrations
      .filter((m) => m.finished_at !== null && m.rolled_back_at === null)
      .map((m) => m.migration_name),
  );
  const failedMigrations = input.appliedMigrations
    .filter((m) => m.finished_at === null || m.rolled_back_at !== null)
    .map((m) => m.migration_name);
  const pendingMigrations = input.repoMigrationNames.filter(
    (name) => !appliedNames.has(name),
  );

  if (failedMigrations.length > 0) {
    reasons.push(
      `${failedMigrations.length} migración(es) fallida(s)/revertida(s) en _prisma_migrations: ${failedMigrations.join(", ")}. Requiere resolución manual (prisma migrate resolve) antes de continuar.`,
    );
  }

  const riskyMigrationsStatus: Record<string, "applied" | "pending"> = {};
  for (const name of Object.values(RISKY_MIGRATIONS)) {
    riskyMigrationsStatus[name] = appliedNames.has(name)
      ? "applied"
      : "pending";
  }

  if (
    riskyMigrationsStatus[RISKY_MIGRATIONS.cartWishlistUnique] === "pending"
  ) {
    if (input.cartDuplicateGroups > 0) {
      reasons.push(
        `Cart.userId tiene ${input.cartDuplicateGroups} grupo(s) duplicado(s) y ${RISKY_MIGRATIONS.cartWishlistUnique} sigue pendiente -- fallaría al aplicarse.`,
      );
    }
    if (input.wishlistDuplicateGroups > 0) {
      reasons.push(
        `Wishlist.userId tiene ${input.wishlistDuplicateGroups} grupo(s) duplicado(s) y ${RISKY_MIGRATIONS.cartWishlistUnique} sigue pendiente -- fallaría al aplicarse.`,
      );
    }
  }

  if (
    riskyMigrationsStatus[RISKY_MIGRATIONS.paymentProviderRefUnique] ===
    "pending"
  ) {
    if (input.paymentDuplicateGroups > 0) {
      reasons.push(
        `Payment.providerRef tiene ${input.paymentDuplicateGroups} grupo(s) duplicado(s) y ${RISKY_MIGRATIONS.paymentProviderRefUnique} sigue pendiente -- fallaría al aplicarse.`,
      );
    }
  }

  if (!input.guestExists) {
    reasons.push(
      'User(id="guest") no existe -- el checkout de invitada fallaría al crear un pedido (Order.userId es FK obligatoria).',
    );
  }

  return {
    pass: reasons.length === 0,
    reasons,
    pendingMigrations,
    failedMigrations,
    riskyMigrationsStatus,
  };
}
