/**
 * Logs estructurados SIN datos personales (R11, REPORT § 14).
 *
 * Nunca se loguea: la query firmada ni la firma, logged_in_customer_id, el
 * GID de la clienta, emails, session tokens, el token de Admin, bodies ni
 * pares clienta + producto. Solo: ruta, estado HTTP, código de resultado,
 * latencia, contadores y un correlativo irreversible.
 *
 * Defensa en profundidad: el logger solo escribe claves de una lista
 * blanca y solo valores primitivos (strings recortados a 120 caracteres).
 */
import { createHmac, randomBytes } from "node:crypto";

export const LOG_FIELDS = new Set([
  "event",
  "rid",
  "route",
  "method",
  "status",
  "code",
  "ms",
  "subj",
  "writes",
  "attempts",
  "n_add",
  "n_remove",
  "n_items",
  "n_rejected",
  "n_not_found",
  "detail",
  "port",
]);

export function createLogger({ sink = (line) => process.stdout.write(`${line}\n`), clock = () => new Date() } = {}) {
  function write(level, fields) {
    const entry = { ts: clock().toISOString(), level };
    for (const [key, value] of Object.entries(fields ?? {})) {
      if (!LOG_FIELDS.has(key) || value === undefined || value === null) continue;
      if (typeof value === "number" || typeof value === "boolean") entry[key] = value;
      else if (typeof value === "string") entry[key] = value.slice(0, 120);
    }
    sink(JSON.stringify(entry));
  }
  return {
    info: (fields) => write("info", fields),
    warn: (fields) => write("warn", fields),
    error: (fields) => write("error", fields),
  };
}

/**
 * Correlativo irreversible: HMAC con una sal aleatoria POR PROCESO,
 * recortado a 12 hex. Sirve para agrupar requests de una misma clienta
 * dentro de una instancia, pero no permite recuperar el id (ni por fuerza
 * bruta sobre ids numéricos, porque la sal nunca sale del proceso).
 */
export function createCorrelator(salt = randomBytes(32)) {
  return (value) => createHmac("sha256", salt).update(String(value)).digest("hex").slice(0, 12);
}
