/**
 * Arranque de la función: `node server/server.mjs` (Node >= 20, sin
 * dependencias). Sin base de datos ni almacenamiento persistente: el único
 * estado es el token de client credentials (si se usa) y el rate limit, los
 * dos en memoria.
 */
import http from "node:http";
import { pathToFileURL } from "node:url";
import { loadConfig, ConfigError } from "./config.mjs";
import { createLogger } from "./logger.mjs";
import { createAccessTokenProvider, createAdminClient } from "./admin-client.mjs";
import { createRequestHandler } from "./handlers.mjs";

/**
 * Arma el servidor HTTP con todas sus piezas. `fetchImpl` es inyectable
 * (los tests pasan un Admin simulado).
 */
export function createAppServer({ config, fetchImpl = globalThis.fetch, logger = createLogger(), nowMs = Date.now, ...handlerOverrides }) {
  const getAccessToken = createAccessTokenProvider({
    source: config.adminTokenSource,
    staticToken: config.adminAccessToken,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    fetchImpl,
    nowMs,
  });
  const admins = new Map();
  const getAdmin = (shop) => {
    if (!admins.has(shop)) {
      admins.set(shop, createAdminClient({ shop, apiVersion: config.apiVersion, getAccessToken, fetchImpl }));
    }
    return admins.get(shop);
  };
  const handler = createRequestHandler({ config, getAdmin, logger, nowMs, ...handlerOverrides });
  const server = http.createServer(
    { requestTimeout: 30_000, headersTimeout: 15_000, maxHeaderSize: 16 * 1024 },
    handler,
  );
  server.keepAliveTimeout = 5_000;
  return server;
}

export function main(env = process.env) {
  const logger = createLogger();
  let config;
  try {
    config = loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) {
      // Solo nombres de variable y motivo; nunca valores.
      logger.error({ event: "config_invalid", detail: error.problems.join(",") });
      process.exitCode = 1;
      return null;
    }
    throw error;
  }
  const server = createAppServer({ config, logger });
  server.listen(config.port, config.host, () => logger.info({ event: "listening", port: config.port }));
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  process.on("unhandledRejection", () => logger.error({ event: "unhandled_rejection" }));
  return server;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();
