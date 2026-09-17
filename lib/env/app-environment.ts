// Fuente única de verdad para en qué entorno está corriendo la aplicación
// -- deliberadamente propia y portable, nunca depende de una variable
// exclusiva de un hosting (VERCEL_ENV, o el equivalente de Railway/Render/
// Fly/AWS). NO confundir con DATABASE_ENV_LABEL (scripts/lib/load-safe-env.ts):
// esa clasifica la BASE DE DATOS a la que apunta un script/proceso;
// APP_ENVIRONMENT clasifica la EJECUCIÓN de la aplicación en sí -- son
// conceptos relacionados pero distintos, y permanecen separados a
// propósito.
export type AppEnvironment = "development" | "staging" | "production" | "test";

const VALID_APP_ENVIRONMENTS: readonly AppEnvironment[] = [
  "development",
  "staging",
  "production",
  "test",
];

function isValidAppEnvironment(value: string): value is AppEnvironment {
  return (VALID_APP_ENVIRONMENTS as readonly string[]).includes(value);
}

/**
 * Lee APP_ENVIRONMENT. Devuelve null si no está definida.
 *
 * Deliberadamente NO cae a NODE_ENV: `next start` deja NODE_ENV=production
 * incluso en builds locales/E2E, así que NODE_ENV no sirve como fuente de
 * verdad de "esto es producción comercial real" -- APP_ENVIRONMENT es
 * explícita a propósito.
 */
export function getAppEnvironment(): AppEnvironment | null {
  const raw = process.env.APP_ENVIRONMENT;
  if (!raw) return null;
  if (!isValidAppEnvironment(raw)) {
    throw new Error(
      `APP_ENVIRONMENT="${raw}" no es un valor reconocido. Valores permitidos: ` +
        `${VALID_APP_ENVIRONMENTS.join(", ")}.`,
    );
  }
  return raw;
}

/**
 * Igual que getAppEnvironment(), pero lanza si no está definida -- para
 * puntos de decisión donde asumir en silencio "probablemente development"
 * o "probablemente production" sería inseguro (p. ej. el guard de pagos
 * reales). `context` describe, en el mensaje de error, para qué hacía
 * falta.
 */
export function requireAppEnvironment(context: string): AppEnvironment {
  const env = getAppEnvironment();
  if (!env) {
    throw new Error(
      `APP_ENVIRONMENT no está definida y hace falta para decidir: ${context}. ` +
        "No se asume ni \"development\" ni \"production\" en silencio -- definila " +
        "explícitamente (development | staging | production | test).",
    );
  }
  return env;
}
