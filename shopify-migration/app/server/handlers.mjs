/**
 * Endpoints de la función (diseño § 4):
 *   POST /proxy/wishlist   E1: tienda -> app proxy (firma HMAC en la query)
 *   OPTIONS|POST /ca/wishlist  E2: extensión "Mis favoritos" (session token)
 *   POST /webhooks         E3: webhooks de compliance (no-op con HMAC)
 *   GET  /                 texto mínimo (la app no tiene panel; ver README)
 *
 * Un solo contrato para E1 y E2: body {v:1, add:[{id,handle}], remove:[id]}.
 *   - add/remove vacíos o ausentes = leer/refrescar (bootstrap, reconciliar);
 *   - add = alta / unión invitada -> cuenta;
 *   - remove = quitar.
 * Respuesta 200 {v:1, items, rejected, notFound}; error {v:1, error}.
 *
 * Toda falla de identidad es 401 (R7): wishlist.js reintenta cualquier otro
 * código (W:545-555).
 */
import { randomBytes } from "node:crypto";
import { verifyProxyRequest, rawQueryOf } from "./proxy-signature.mjs";
import { verifySessionToken, bearerToken } from "./session-token.mjs";
import { verifyWebhookHmac } from "./webhook-signature.mjs";
import { validateOpsRequest, LIMITS } from "./wishlist-core.mjs";
import { applyOpsWithCas, AdminError, ConflictError } from "./admin-client.mjs";
import { createCorrelator } from "./logger.mjs";
import { createRateLimiter } from "./rate-limit.mjs";

export const MAX_BODY_BYTES = LIMITS.MAX_BODY_BYTES;
export const WEBHOOK_MAX_BODY_BYTES = 1024 * 1024;
const KNOWN_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const COMPLIANCE_TOPICS = new Set(["customers/data_request", "customers/redact", "shop/redact"]);

/** Motivo del JWT -> código de error público (todos 401). */
const SESSION_REASON_TO_CODE = {
  malformed: "invalid_token",
  bad_alg: "invalid_token",
  bad_signature: "invalid_token",
  bad_aud: "invalid_token",
  expired: "token_expired",
  not_yet_valid: "token_expired",
  bad_dest: "shop_not_allowed",
  no_customer: "no_customer",
};

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

const PREFLIGHT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "600",
  "Cache-Control": "no-store",
};

class BodyTooLargeError extends Error {
  constructor() {
    super("body_too_large");
    this.name = "BodyTooLargeError";
  }
}

function pathOf(requestUrl) {
  const url = String(requestUrl ?? "");
  const index = url.indexOf("?");
  return index === -1 ? url : url.slice(0, index);
}

function isJsonContentType(header) {
  if (typeof header !== "string") return false;
  return header.split(";")[0].trim().toLowerCase() === "application/json";
}

/** Lee el body con tope de bytes. Rechaza sin leer si Content-Length ya lo supera. */
export function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"]);
    if (Number.isFinite(declared) && declared > limit) {
      reject(new BodyTooLargeError());
      return;
    }
    const chunks = [];
    let size = 0;
    let settled = false;
    req.on("data", (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        settled = true;
        chunks.length = 0;
        reject(new BodyTooLargeError());
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
}

/**
 * @param {{config: object, getAdmin: (shop: string) => object, logger: object,
 *          nowMs?: () => number, correlate?: (value: string) => string,
 *          rateLimiter?: {take: (key: string) => {ok: boolean, retryAfterSec: number}},
 *          requestId?: () => string}} deps
 */
export function createRequestHandler(deps) {
  const {
    config,
    getAdmin,
    logger,
    nowMs = Date.now,
    correlate = createCorrelator(),
    rateLimiter = createRateLimiter({ burst: config.rateLimitBurst, perMinute: config.rateLimitPerMinute, nowMs }),
    requestId = () => randomBytes(6).toString("hex"),
  } = deps;

  function send(res, ctx, status, payload, extraHeaders = {}) {
    const body = JSON.stringify(payload);
    const headers = { ...BASE_HEADERS, "Content-Length": String(Buffer.byteLength(body)), ...extraHeaders };
    // E2 (Web Worker de la extensión, sin origen reconocible): CORS "*". Es
    // seguro porque la autenticación va por bearer, no por cookies. E1 es
    // mismo origen: SIN Access-Control-Allow-Origin.
    if (ctx.cors) headers["Access-Control-Allow-Origin"] = "*";
    res.writeHead(status, headers);
    res.end(body);
  }

  function sendError(res, ctx, status, code, extraHeaders) {
    ctx.code = code;
    send(res, ctx, status, { v: 1, error: code }, extraHeaders);
  }

  async function processWishlistOps(req, res, ctx, identity, { requireCsrfHeader }) {
    ctx.subj = correlate(identity.customerGid);

    const bucket = rateLimiter.take(ctx.subj);
    if (!bucket.ok) return sendError(res, ctx, 429, "rate_limited", { "Retry-After": String(bucket.retryAfterSec) });

    if (!isJsonContentType(req.headers["content-type"])) return sendError(res, ctx, 415, "unsupported_media_type");
    // Defensa CSRF de E1 (POST + JSON + header propio). Se puede apagar solo
    // si GO/NO-GO 8 muestra que el proxy no reenvía el header.
    if (requireCsrfHeader && req.headers["x-radaelli-wishlist"] !== "1") {
      return sendError(res, ctx, 400, "missing_csrf_header");
    }

    let raw;
    try {
      raw = await readBody(req, MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof BodyTooLargeError) return sendError(res, ctx, 413, "body_too_large", { Connection: "close" });
      throw error;
    }

    let body;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      return sendError(res, ctx, 400, "invalid_json");
    }
    const parsed = validateOpsRequest(body);
    if (!parsed.ok) return sendError(res, ctx, 400, parsed.error);
    ctx.stats.n_add = parsed.value.add.length;
    ctx.stats.n_remove = parsed.value.remove.length;

    // Corte total de las llamadas a Shopify para este request (R5: el
    // cliente mantiene el Web Lock mientras espera).
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);
    try {
      const admin = getAdmin(identity.shop);
      const result = await applyOpsWithCas({
        admin,
        customerGid: identity.customerGid,
        ops: parsed.value,
        signal: controller.signal,
        emptyListStrategy: config.emptyListStrategy,
      });
      Object.assign(ctx.stats, {
        writes: result.writes,
        attempts: result.attempts,
        n_items: result.items.length,
        n_rejected: result.rejected.length,
        n_not_found: result.notFound.length,
      });
      ctx.code = "ok";
      return send(res, ctx, 200, { v: 1, items: result.items, rejected: result.rejected, notFound: result.notFound });
    } catch (error) {
      if (error instanceof ConflictError) return sendError(res, ctx, 409, "conflict");
      if (error instanceof AdminError) {
        ctx.detail = error.detail;
        if (error.kind === "no_customer") return sendError(res, ctx, 401, "no_customer");
        if (error.kind === "admin_throttled") return sendError(res, ctx, 503, "admin_throttled", { "Retry-After": "2" });
        if (error.kind === "upstream_timeout") return sendError(res, ctx, 504, "upstream_timeout");
        return sendError(res, ctx, 502, "admin_error");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function handleProxy(req, res, ctx) {
    if (req.method !== "POST") return sendError(res, ctx, 405, "method_not_allowed", { Allow: "POST" });
    const rawQuery = rawQueryOf(req.url);
    const identity = verifyProxyRequest(rawQuery, {
      secret: config.apiSecret,
      nowSec: Math.floor(nowMs() / 1000),
      maxSkewSec: config.proxyMaxSkewSec,
      allowedShops: config.allowedShops,
      allowedPathPrefixes: config.allowedPathPrefixes,
    });
    if (!identity.ok) return sendError(res, ctx, 401, identity.reason);
    return processWishlistOps(req, res, ctx, identity, { requireCsrfHeader: config.requireCsrfHeader });
  }

  async function handleCustomerAccount(req, res, ctx) {
    if (req.method === "OPTIONS") {
      ctx.code = "preflight";
      res.writeHead(204, PREFLIGHT_HEADERS);
      res.end();
      return;
    }
    if (req.method !== "POST") return sendError(res, ctx, 405, "method_not_allowed", { Allow: "POST, OPTIONS" });
    const token = bearerToken(req.headers.authorization);
    if (!token) return sendError(res, ctx, 401, "missing_token");
    const identity = verifySessionToken(token, {
      secret: config.apiSecret,
      clientId: config.apiKey,
      allowedShops: config.allowedShops,
      nowSec: Math.floor(nowMs() / 1000),
      leewaySec: config.sessionTokenLeewaySec,
    });
    if (!identity.ok) return sendError(res, ctx, 401, SESSION_REASON_TO_CODE[identity.reason] ?? "invalid_token");
    // Sin cookies: CSRF no aplica (la autenticación es el bearer).
    return processWishlistOps(req, res, ctx, identity, { requireCsrfHeader: false });
  }

  async function handleWebhook(req, res, ctx) {
    if (req.method !== "POST") return sendError(res, ctx, 405, "method_not_allowed", { Allow: "POST" });
    let raw;
    try {
      raw = await readBody(req, WEBHOOK_MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof BodyTooLargeError) return sendError(res, ctx, 413, "body_too_large", { Connection: "close" });
      throw error;
    }
    if (!verifyWebhookHmac(raw, req.headers["x-shopify-hmac-sha256"], config.apiSecret)) {
      return sendError(res, ctx, 401, "invalid_signature");
    }
    const topic = req.headers["x-shopify-topic"];
    ctx.detail = COMPLIANCE_TOPICS.has(topic) ? topic : "other_topic";
    ctx.code = "ok";
    // No-op: la app no guarda datos de clientas fuera de Shopify.
    return send(res, ctx, 200, { v: 1 });
  }

  async function route(req, res, ctx) {
    const path = pathOf(req.url);
    if (path === "/proxy/wishlist") {
      ctx.route = "proxy";
      return handleProxy(req, res, ctx);
    }
    if (path === "/ca/wishlist") {
      ctx.route = "ca";
      ctx.cors = true;
      return handleCustomerAccount(req, res, ctx);
    }
    if (path === "/webhooks") {
      ctx.route = "webhooks";
      return handleWebhook(req, res, ctx);
    }
    if (path === "/" && (req.method === "GET" || req.method === "HEAD")) {
      ctx.route = "root";
      ctx.code = "ok";
      const text = "Radaelli Favoritos: servicio sin panel de administracion.\n";
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(Buffer.byteLength(text)),
      });
      res.end(req.method === "HEAD" ? undefined : text);
      return;
    }
    ctx.route = "not_found";
    return sendError(res, ctx, 404, "not_found");
  }

  return async function handleRequest(req, res) {
    const ctx = {
      rid: requestId(),
      started: nowMs(),
      route: "unknown",
      method: KNOWN_METHODS.has(req.method) ? req.method : "OTHER",
      code: undefined,
      subj: undefined,
      detail: undefined,
      cors: false,
      stats: {},
    };
    try {
      await route(req, res, ctx);
    } catch {
      ctx.detail = ctx.detail ?? "unhandled";
      if (!res.headersSent) sendError(res, ctx, 500, "internal_error");
      else res.destroy();
    } finally {
      logger.info({
        event: "request",
        rid: ctx.rid,
        route: ctx.route,
        method: ctx.method,
        status: res.statusCode,
        code: ctx.code,
        ms: nowMs() - ctx.started,
        subj: ctx.subj,
        detail: ctx.detail,
        ...ctx.stats,
      });
    }
  };
}
