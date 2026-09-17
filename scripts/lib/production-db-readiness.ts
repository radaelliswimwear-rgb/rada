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
  blockingMigrations: string[];
  historicalRolledBackAttempts: string[];
  riskyMigrationsStatus: Record<string, "applied" | "pending">;
};

// Prisma no borra filas viejas de _prisma_migrations: un mismo migration_name
// puede tener varias, una por cada intento real (fallido, revertido
// administrativamente, o finalmente exitoso). Evaluar cada FILA como si
// fuera una migración distinta -- como hacía la versión anterior de este
// gate -- produce falsos positivos: una migración con un intento viejo
// fallido+rolled-back y un reintento posterior exitoso terminaba marcada
// como bloqueante, aunque ya esté 100% aplicada (caso real de Production,
// ver 20260915020000_order_fulfillment_and_admin_email).
export type MigrationGroupStatus =
  | "applied"
  | "unresolved_failure"
  | "anomalous_failure_after_success"
  | "pending";

/**
 * Clasifica TODAS las filas de un mismo migration_name como un solo
 * estado. Puro, sin I/O.
 *
 * - applied: existe al menos una fila exitosa (finished_at set,
 *   rolled_back_at null) y ninguna falla sin resolver -- sin importar
 *   cuántos intentos rolled-back haya en el historial.
 * - unresolved_failure: existe una falla sin resolver (finished_at null,
 *   rolled_back_at null) y NINGUNA fila exitosa -- el caso real que
 *   bloquea con P3009.
 * - anomalous_failure_after_success: existe una fila exitosa Y ADEMÁS una
 *   falla sin resolver -- no debería pasar en un flujo normal (una
 *   migración ya aplicada no debería volver a intentarse). Se bloquea a
 *   propósito para que un humano lo investigue, nunca se asume seguro.
 * - pending: sin fila exitosa y sin falla sin resolver -- o no se intentó
 *   nunca, o solo hay intentos rolled-back (reintentable por
 *   `migrate deploy` sin problema).
 */
export function classifyMigrationGroup(
  rows: MigrationRecord[],
): MigrationGroupStatus {
  const hasSuccess = rows.some(
    (r) => r.finished_at !== null && r.rolled_back_at === null,
  );
  const hasUnresolvedFailure = rows.some(
    (r) => r.finished_at === null && r.rolled_back_at === null,
  );
  if (hasSuccess && hasUnresolvedFailure) {
    return "anomalous_failure_after_success";
  }
  if (hasSuccess) return "applied";
  if (hasUnresolvedFailure) return "unresolved_failure";
  return "pending";
}

/**
 * Evalúa si Production está lista para `prisma migrate deploy`. Puro: no
 * conecta a nada, solo decide a partir de lo que ya se consultó.
 *
 * Una migración risky PENDIENTE exige que sus datos sean compatibles (sin
 * duplicados) -- de lo contrario el UNIQUE INDEX fallaría al aplicarse. Una
 * migración risky ya APLICADA no vuelve a chequearse: si el índice ya
 * existe, ya se demostró compatible cuando se creó (incluyendo vía un
 * reintento posterior exitoso a un intento rolled-back) -- no importa el
 * estado actual de los datos para decidir si el gate pasa.
 */
export function evaluateProductionReadiness(
  input: PreflightInput,
): PreflightResult {
  const reasons: string[] = [];

  const byName = new Map<string, MigrationRecord[]>();
  for (const record of input.appliedMigrations) {
    const rows = byName.get(record.migration_name) ?? [];
    rows.push(record);
    byName.set(record.migration_name, rows);
  }

  const appliedNames = new Set<string>();
  const blockingMigrations: string[] = [];
  const historicalRolledBackAttempts: string[] = [];

  for (const [name, rows] of byName) {
    if (rows.some((r) => r.rolled_back_at !== null)) {
      historicalRolledBackAttempts.push(name);
    }
    const status = classifyMigrationGroup(rows);
    if (status === "applied") {
      appliedNames.add(name);
    } else if (
      status === "unresolved_failure" ||
      status === "anomalous_failure_after_success"
    ) {
      blockingMigrations.push(name);
    }
    // "pending" (nunca intentada, o solo intentos rolled-back sin éxito
    // posterior) no se agrega a ningún lado acá -- ya cae en
    // pendingMigrations más abajo por no estar en appliedNames.
  }

  const pendingMigrations = input.repoMigrationNames.filter(
    (name) => !appliedNames.has(name),
  );

  if (blockingMigrations.length > 0) {
    reasons.push(
      `${blockingMigrations.length} migración(es) bloqueante(s) en _prisma_migrations: ${blockingMigrations.join(", ")}. Requiere resolución manual (prisma migrate resolve) antes de continuar.`,
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
    blockingMigrations,
    historicalRolledBackAttempts,
    riskyMigrationsStatus,
  };
}

// ---------------------------------------------------------------------------
// Diagnóstico por fila individual de una migración bloqueante -- el gate de
// arriba ya decide pass/fail a nivel de GRUPO (por migration_name), pero
// _prisma_migrations distingue dos casos bien distintos a nivel de FILA que
// el operador necesita ver para decidir la recuperación segura:
//
//   - failed_unresolved (finished_at NULL, rolled_back_at NULL): Prisma se
//     niega a seguir con CUALQUIER `migrate deploy` (error P3009) hasta que
//     alguien resuelva manualmente. Esto es lo que bloquea hoy.
//   - resolved_rolled_back (rolled_back_at con valor): alguien ya corrió
//     `prisma migrate resolve --rolled-back` en el pasado -- `migrate
//     deploy` SÍ seguiría, pero reintentaría aplicar el SQL completo de esa
//     migración desde cero (riesgoso si ya quedó algo parcialmente creado).
//
// Nunca cambia el resultado pass/fail del gate -- solo agrega información
// para diagnosticar sin necesitar una segunda conexión manual a Production.
// ---------------------------------------------------------------------------

export const ORDER_FULFILLMENT_MIGRATION =
  "20260915020000_order_fulfillment_and_admin_email";

export type FailedMigrationClassification =
  | "failed_unresolved"
  | "resolved_rolled_back";

/**
 * Clasifica una fila que YA calificó como "fallida/revertida" (ver
 * evaluateProductionReadiness). `rolled_back_at` con valor tiene prioridad:
 * indica una resolución administrativa explícita en el pasado, que es un
 * caso operativamente distinto de una falla nunca resuelta.
 */
export function classifyFailedMigration(record: {
  finished_at: Date | null;
  rolled_back_at: Date | null;
}): FailedMigrationClassification {
  if (record.rolled_back_at !== null) return "resolved_rolled_back";
  return "failed_unresolved";
}

const CONNECTION_STRING_PATTERN = /postgres(ql)?:\/\/\S+/gi;
const CREDENTIAL_LIKE_PATTERN = /\b(password|secret|token)\s*=\s*\S+/gi;
const MAX_SANITIZED_LOG_LENGTH = 800;

/**
 * Nunca imprime `logs` de _prisma_migrations tal cual -- redacta cualquier
 * cosa con forma de connection string o de "password=.../secret=.../
 * token=...", y trunca. `logs` de Prisma normalmente es solo el error de
 * Postgres (mensaje + código), no debería traer secretos, pero esto es una
 * segunda capa de seguridad, no una confianza ciega en esa suposición.
 */
export function sanitizeMigrationLogs(logs: string | null): string | null {
  if (!logs) return null;
  let sanitized = logs
    .replace(CONNECTION_STRING_PATTERN, "[REDACTED_CONNECTION_STRING]")
    .replace(CREDENTIAL_LIKE_PATTERN, (match) => {
      const key = match.split("=")[0];
      return `${key}=[REDACTED]`;
    });
  if (sanitized.length > MAX_SANITIZED_LOG_LENGTH) {
    sanitized =
      sanitized.slice(0, MAX_SANITIZED_LOG_LENGTH) +
      `... [truncado, ${sanitized.length - MAX_SANITIZED_LOG_LENGTH} caracteres más]`;
  }
  return sanitized;
}

// Objetos exactos que 20260915020000_order_fulfillment_and_admin_email crea
// -- derivados directamente de su migration.sql, no inventados. Permite
// distinguir: (a) nunca se aplicó nada, (b) quedó parcialmente aplicada,
// (c) en realidad SÍ terminó de aplicarse y solo falló el registro final en
// _prisma_migrations (p. ej. un corte de conexión justo al final).
export type OrderFulfillmentSchemaState = {
  fulfillmentStatusEnumExists: boolean;
  paymentStatusHasRefundedValue: boolean;
  orderNumberSequenceExists: boolean;
  orderFulfillmentStatusColumnExists: boolean;
  orderOrderNumberColumnExists: boolean;
  orderNumberUniqueIndexExists: boolean;
  orderStatusEventTableExists: boolean;
  orderStatusEventIndexExists: boolean;
  orderStatusEventPkeyExists: boolean;
  orderStatusEventFkeyExists: boolean;
};

export function summarizeOrderFulfillmentSchemaState(
  state: OrderFulfillmentSchemaState,
): { existingCount: number; totalCount: number; allExist: boolean; noneExist: boolean } {
  const values = Object.values(state);
  const existingCount = values.filter(Boolean).length;
  return {
    existingCount,
    totalCount: values.length,
    allExist: existingCount === values.length,
    noneExist: existingCount === 0,
  };
}
