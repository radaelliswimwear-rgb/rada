/**
 * Configuración de la función (03D). Lee SOLO variables de entorno; nunca
 * archivos .env (eso lo hace el hosting o quien la arranque).
 *
 * Reglas:
 * - Los errores de configuración nombran la VARIABLE, nunca su valor.
 * - Se rechazan valores de plantilla (REEMPLAZAR / PLACEHOLDER) para que la
 *   función no arranque por accidente con el `.env.example`.
 * - Todo lo que no es secreto tiene un valor por defecto documentado en el
 *   README. Los secretos no tienen valor por defecto.
 */

export const SHOP_DOMAIN_RE = /^[a-z0-9][a-z0-9-]{0,61}\.myshopify\.com$/;
const PATH_PREFIX_RE = /^\/(a|apps|community|tools)\/[A-Za-z0-9_-]{1,30}$/;
const API_VERSION_RE = /^[0-9]{4}-(01|04|07|10)$/;
const PLACEHOLDER_RE = /REEMPLAZAR|PLACEHOLDER|CHANGEME/i;

/** Versión de las APIs de Shopify fijada al construir (diseño § 4). */
export const PINNED_API_VERSION = "2026-07";

export class ConfigError extends Error {
  /** @param {string[]} problems nombres de variable + motivo corto, sin valores */
  constructor(problems) {
    super(`config_invalid: ${problems.join(", ")}`);
    this.name = "ConfigError";
    this.problems = problems;
  }
}

function readString(env, name) {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

function readInt(env, name, fallback, min, max, problems) {
  const raw = readString(env, name);
  if (raw === "") return fallback;
  if (!/^[0-9]{1,9}$/.test(raw)) {
    problems.push(`${name}:not_integer`);
    return fallback;
  }
  const value = Number(raw);
  if (value < min || value > max) {
    problems.push(`${name}:out_of_range`);
    return fallback;
  }
  return value;
}

function readBool(env, name, fallback, problems) {
  const raw = readString(env, name).toLowerCase();
  if (raw === "") return fallback;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  problems.push(`${name}:not_boolean`);
  return fallback;
}

function readSecret(env, name, problems, { required }) {
  const value = readString(env, name);
  if (value === "") {
    if (required) problems.push(`${name}:missing`);
    return "";
  }
  if (PLACEHOLDER_RE.test(value)) {
    problems.push(`${name}:placeholder`);
    return "";
  }
  return value;
}

/**
 * @param {Record<string, string | undefined>} env normalmente process.env
 * @returns {Readonly<object>} configuración validada
 * @throws {ConfigError} con la lista de variables con problemas
 */
export function loadConfig(env = process.env) {
  const problems = [];

  const apiKey = readSecret(env, "SHOPIFY_API_KEY", problems, { required: true });
  const apiSecret = readSecret(env, "SHOPIFY_API_SECRET", problems, { required: true });

  const allowedShops = readString(env, "ALLOWED_SHOPS")
    .split(",")
    .map((shop) => shop.trim().toLowerCase())
    .filter(Boolean);
  if (allowedShops.length === 0) problems.push("ALLOWED_SHOPS:missing");
  else if (allowedShops.some((shop) => !SHOP_DOMAIN_RE.test(shop) || PLACEHOLDER_RE.test(shop))) {
    problems.push("ALLOWED_SHOPS:invalid_domain");
  }

  const prefixRaw = readString(env, "ALLOWED_PATH_PREFIXES") || "/apps/radaelli";
  const allowedPathPrefixes = prefixRaw
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean);
  if (allowedPathPrefixes.length === 0 || allowedPathPrefixes.some((prefix) => !PATH_PREFIX_RE.test(prefix))) {
    problems.push("ALLOWED_PATH_PREFIXES:invalid");
  }

  const adminTokenSource = readString(env, "ADMIN_TOKEN_SOURCE") || "env";
  if (adminTokenSource !== "env" && adminTokenSource !== "client_credentials") {
    problems.push("ADMIN_TOKEN_SOURCE:invalid");
  }
  const adminAccessToken = readSecret(env, "SHOPIFY_ADMIN_ACCESS_TOKEN", problems, {
    required: adminTokenSource === "env",
  });
  // Un token offline es de UNA tienda: con varias tiendas en la allowlist se
  // usaría el token equivocado. En ese caso hay que usar client_credentials
  // (misma organización) o una función por tienda.
  if (adminTokenSource === "env" && allowedShops.length > 1) {
    problems.push("ALLOWED_SHOPS:single_shop_required_with_env_token");
  }

  const apiVersion = readString(env, "SHOPIFY_API_VERSION") || PINNED_API_VERSION;
  if (!API_VERSION_RE.test(apiVersion)) problems.push("SHOPIFY_API_VERSION:invalid");

  const emptyListStrategy = readString(env, "EMPTY_LIST_STRATEGY") || "set_empty";
  if (emptyListStrategy !== "set_empty" && emptyListStrategy !== "delete") {
    problems.push("EMPTY_LIST_STRATEGY:invalid");
  }

  const config = {
    apiKey,
    apiSecret,
    allowedShops,
    allowedPathPrefixes,
    adminTokenSource,
    adminAccessToken,
    apiVersion,
    emptyListStrategy,
    proxyMaxSkewSec: readInt(env, "PROXY_MAX_SKEW_SEC", 300, 1, 3600, problems),
    sessionTokenLeewaySec: readInt(env, "SESSION_TOKEN_LEEWAY_SEC", 5, 0, 60, problems),
    requireCsrfHeader: readBool(env, "REQUIRE_CSRF_HEADER", true, problems),
    upstreamTimeoutMs: readInt(env, "UPSTREAM_TIMEOUT_MS", 10000, 10, 30000, problems),
    rateLimitBurst: readInt(env, "RATE_LIMIT_BURST", 20, 1, 1000, problems),
    rateLimitPerMinute: readInt(env, "RATE_LIMIT_PER_MINUTE", 30, 1, 6000, problems),
    port: readInt(env, "PORT", 8080, 1, 65535, problems),
    host: readString(env, "HOST") || "0.0.0.0",
  };

  if (problems.length > 0) throw new ConfigError(problems);
  return Object.freeze({
    ...config,
    allowedShops: Object.freeze([...config.allowedShops]),
    allowedPathPrefixes: Object.freeze([...config.allowedPathPrefixes]),
  });
}
