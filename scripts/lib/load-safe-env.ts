// Carga central de variables de entorno para prisma.config.ts y para los
// scripts sueltos de scripts/*.ts. Usa @next/env -- el mismo mecanismo que
// usa `next dev`/`build`/`start` -- para que Next, Prisma CLI y estos
// scripts resuelvan DATABASE_URL con EXACTAMENTE la misma precedencia,
// nunca dos sistemas distintos:
//
//   1. process.env ya definido explícitamente (shell, CI/CD, hosting)
//      -> SIEMPRE gana, nunca se pisa.
//   2. .env.local -> override de desarrollo cuando process.env no lo trae.
//   3. .env -> fallback.
//
// No depende de Vercel (@next/env es parte del paquete open-source `next`,
// no de su plataforma de hosting) y no hardcodea ningún proveedor de
// Postgres ni ningún host conocido -- es portable a Railway, Render,
// Fly.io, AWS o cualquier otro hosting/Postgres.
import { loadEnvConfig } from "@next/env";

let loaded = false;

/**
 * Carga .env.local / .env (sin pisar process.env ya definido) exactamente
 * una vez por proceso, con la misma lógica que usa Next.js.
 */
export function loadProjectEnv(): void {
  if (loaded) return;
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  loaded = true;
}

export interface SafeDatabaseTarget {
  hostname: string;
  database: string;
  environmentLabel: string;
}

/**
 * Resuelve DATABASE_URL con la precedencia de arriba y devuelve la URL
 * cruda (para conectar) junto con metadata segura para mostrar en consola
 * -- nunca la password, nunca la URL completa.
 *
 * Lanza si DATABASE_URL no quedó definida o no es una URL válida: ningún
 * script que use esto puede seguir de largo con una base de datos sin
 * resolver de forma segura.
 *
 * `requireEnvironmentLabel` (opcional, default false) exige además que
 * DATABASE_ENV_LABEL esté definida -- usado por los scripts de escritura
 * manual (scripts/add-*.ts) y por el wrapper de `db:seed`, para que nunca
 * corran contra un entorno sin clasificar explícitamente. Portable: es solo
 * una convención de nombre propia (development/staging/production), no
 * depende de ningún proveedor de hosting ni de Postgres.
 */
export function resolveDatabaseUrl(options?: {
  requireEnvironmentLabel?: boolean;
}): { databaseUrl: string; target: SafeDatabaseTarget } {
  loadProjectEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL no está definida (ni en process.env, ni en .env.local, ni en .env). " +
        "Abortando: ninguna operación de base de datos puede continuar sin un DATABASE_URL resuelto de forma segura.",
    );
  }

  let hostname: string;
  let database: string;
  try {
    const url = new URL(databaseUrl);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      throw new Error(`esquema '${url.protocol}' no es postgres:/postgresql:`);
    }
    hostname = url.hostname;
    database = url.pathname.replace(/^\//, "");
  } catch (cause) {
    throw new Error(
      `DATABASE_URL está definida pero no es una URL de Postgres válida (${
        cause instanceof Error ? cause.message : String(cause)
      }). Abortando.`,
    );
  }

  const environmentLabel = process.env.DATABASE_ENV_LABEL || "(sin clasificar)";

  if (
    options?.requireEnvironmentLabel &&
    environmentLabel === "(sin clasificar)"
  ) {
    throw new Error(
      "Se requiere DATABASE_ENV_LABEL para esta operación y no está definida. Abortando.",
    );
  }

  return { databaseUrl, target: { hostname, database, environmentLabel } };
}

/** Metadata segura para imprimir antes de cualquier escritura -- sin password, sin URL completa. */
export function describeDatabaseTarget(target: SafeDatabaseTarget): string {
  return [
    `DB environment: ${target.environmentLabel}`,
    `DB host: ${target.hostname}`,
    `DB name: ${target.database}`,
  ].join("\n");
}
