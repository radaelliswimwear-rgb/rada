/**
 * Configuración + chequeos estáticos de los archivos entregados (sin secretos,
 * scopes mínimos, placeholders).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { loadConfig, ConfigError } from "../server/config.mjs";
import { createRateLimiter } from "../server/rate-limit.mjs";
import { createLogger, createCorrelator } from "../server/logger.mjs";
import { testEnv, FAKE_SECRET, FAKE_SHOP } from "./helpers.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const exists = (path) => existsSync(new URL(path, import.meta.url));
// El zip (scripts/pack.mjs) excluye .env*: desde el paquete estos chequeos se saltean.
const skipWithoutEnvExample = exists("../.env.example") ? false : ".env.example no está (paquete sin .env*)";

test("config: valores por defecto documentados", () => {
  const config = loadConfig(testEnv());
  assert.equal(config.apiVersion, "2026-07");
  assert.deepEqual(config.allowedPathPrefixes, ["/apps/radaelli"]);
  assert.equal(config.proxyMaxSkewSec, 300);
  assert.equal(config.sessionTokenLeewaySec, 5);
  assert.equal(config.requireCsrfHeader, true);
  assert.equal(config.upstreamTimeoutMs, 10000);
  assert.equal(config.emptyListStrategy, "set_empty");
  assert.equal(config.adminTokenSource, "env");
  assert.ok(Object.isFrozen(config));
});

test("config: tiendas en minúsculas y solo *.myshopify.com", () => {
  assert.deepEqual(loadConfig(testEnv({ ALLOWED_SHOPS: " Radaelli-Fake.MyShopify.com " })).allowedShops, [FAKE_SHOP]);
  assert.throws(() => loadConfig(testEnv({ ALLOWED_SHOPS: "radaelli.com" })), /ALLOWED_SHOPS:invalid_domain/);
});

test("config: faltantes y placeholders -> error con NOMBRES de variable, nunca valores", () => {
  let error;
  try {
    loadConfig({ SHOPIFY_API_KEY: "REEMPLAZAR-client-id", SHOPIFY_API_SECRET: "", ALLOWED_SHOPS: "" });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof ConfigError);
  assert.deepEqual(error.problems.sort(), [
    "ALLOWED_SHOPS:missing",
    "SHOPIFY_ADMIN_ACCESS_TOKEN:missing",
    "SHOPIFY_API_KEY:placeholder",
    "SHOPIFY_API_SECRET:missing",
  ]);
  assert.ok(!error.message.includes("REEMPLAZAR-client-id"));
  const withSecret = (() => {
    try {
      loadConfig(testEnv({ PORT: "abc" }));
    } catch (caught) {
      return caught;
    }
  })();
  assert.ok(!withSecret.message.includes(FAKE_SECRET));
});

test("config: token offline (env) exige UNA sola tienda; client_credentials no exige token", () => {
  assert.throws(() => loadConfig(testEnv({ ALLOWED_SHOPS: `${FAKE_SHOP},otra-fake.myshopify.com` })), /single_shop_required_with_env_token/);
  const config = loadConfig(testEnv({ ADMIN_TOKEN_SOURCE: "client_credentials", SHOPIFY_ADMIN_ACCESS_TOKEN: "", ALLOWED_SHOPS: `${FAKE_SHOP},otra-fake.myshopify.com` }));
  assert.equal(config.allowedShops.length, 2);
});

test("config: el .env.example no arranca (todo placeholder)", { skip: skipWithoutEnvExample }, () => {
  const env = {};
  for (const line of read("../.env.example").split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match) env[match[1]] = match[2];
  }
  assert.throws(() => loadConfig(env), (error) => error instanceof ConfigError && error.problems.includes("SHOPIFY_API_SECRET:placeholder"));
});

test(".env.example solo tiene placeholders o valores no secretos", { skip: skipWithoutEnvExample }, () => {
  const secrets = ["SHOPIFY_API_KEY", "SHOPIFY_API_SECRET", "SHOPIFY_ADMIN_ACCESS_TOKEN"];
  for (const line of read("../.env.example").split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match && secrets.includes(match[1])) assert.match(match[2], /^REEMPLAZAR-/);
  }
});

test("shopify.app.toml: sin client_id, scopes mínimos (sin customer_write_customers), proxy apps/radaelli", () => {
  const toml = read("../shopify.app.toml");
  assert.doesNotMatch(toml, /^\s*client_id\s*=/m);
  const scopes = /^scopes\s*=\s*"([^"]+)"/m.exec(toml)[1].split(",");
  assert.deepEqual(scopes.sort(), ["customer_read_customers", "read_customers", "read_products", "write_app_proxy", "write_customers"]);
  assert.doesNotMatch(toml, /customer_write_customers"/);
  assert.match(toml, /\[app_proxy\][\s\S]*prefix = "apps"[\s\S]*subpath = "radaelli"/);
  assert.match(toml, /^embedded = false$/m);
  assert.match(toml, /compliance_topics = \[ "customers\/data_request", "customers\/redact", "shop\/redact" \]/);
  assert.doesNotMatch(toml, /^\s*topics\s*=/m, "sin webhooks fuera de compliance");
});

test("extensión: target full-page, api_access y network_access", () => {
  const toml = read("../extensions/mis-favoritos/shopify.extension.toml");
  assert.match(toml, /target = "customer-account\.page\.render"/);
  assert.match(toml, /api_access = true/);
  assert.match(toml, /network_access = true/);
  assert.equal((toml.match(/\[\[extensions\.targeting\]\]/g) ?? []).length, 1);
});

test("rate limit: balde por clave, recarga en el tiempo y memoria acotada", () => {
  let now = 0;
  const limiter = createRateLimiter({ burst: 2, perMinute: 60, maxKeys: 3, nowMs: () => now });
  assert.equal(limiter.take("a").ok, true);
  assert.equal(limiter.take("a").ok, true);
  const denied = limiter.take("a");
  assert.equal(denied.ok, false);
  assert.equal(denied.retryAfterSec, 1);
  now += 1000;
  assert.equal(limiter.take("a").ok, true);
  for (const key of ["b", "c", "d", "e"]) limiter.take(key);
  assert.equal(limiter.size, 3);
});

test("logger: lista blanca de claves y solo primitivos", () => {
  const lines = [];
  const logger = createLogger({ sink: (line) => lines.push(line), clock: () => new Date(0) });
  logger.info({ event: "x", status: 200, query: "signature=abc", body: { a: 1 }, customerGid: "gid://shopify/Customer/1", detail: "y".repeat(500) });
  const entry = JSON.parse(lines[0]);
  assert.deepEqual(Object.keys(entry).sort(), ["detail", "event", "level", "status", "ts"]);
  assert.equal(entry.detail.length, 120);
  const correlate = createCorrelator(Buffer.alloc(32, 1));
  assert.match(correlate("gid://shopify/Customer/1"), /^[0-9a-f]{12}$/);
  assert.notEqual(createCorrelator()("gid://shopify/Customer/1"), createCorrelator()("gid://shopify/Customer/1"), "sal distinta por proceso");
});

test("ningún archivo entregado contiene secretos reales conocidos por forma (shpat_/shpss_/shpca_)", () => {
  const files = [
    "../shopify.app.toml",
    "../.env.example",
    "../README.md",
    "../server/config.mjs",
    "../server/admin-client.mjs",
    "../extensions/mis-favoritos/src/config.js",
    "../extensions/wishlist-transport/assets/wishlist-transport.js",
  ];
  for (const file of files.filter(exists)) assert.doesNotMatch(read(file), /shp(at|ss|ca|pa)_[0-9a-f]{16,}/, file);
});
