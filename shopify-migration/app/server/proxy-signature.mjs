/**
 * Verificación de la firma del app proxy (diseño § 2a y § 5.1).
 *
 * Algoritmo de shopify.dev (authenticate-app-proxies), reproducido con el
 * vector oficial (secreto "hush") en test/proxy-signature.test.mjs:
 *   1. query CRUDA del request (antes de que un framework la re-codifique);
 *   2. parseo application/x-www-form-urlencoded ("+" = espacio, %XX);
 *      se firma el valor DECODIFICADO;
 *   3. se descarta `signature` (debe venir exactamente una vez, 64 hex);
 *   4. valores repetidos de una clave se unen con ",";
 *   5. se arman los strings "k=v" y se ordenan COMO STRINGS (no por clave);
 *   6. se concatenan sin separador;
 *   7. hex(HMAC-SHA256(secreto de la app, mensaje));
 *   8. comparación en tiempo constante.
 * Recién después: ventana del timestamp (decisión propia, ±300 s), tienda en
 * la allowlist, path_prefix en la allowlist y `logged_in_customer_id`.
 *
 * La identidad de la clienta sale SOLO de `logged_in_customer_id` de la
 * query firmada. El body NO está firmado (R11): nunca se toma identidad del
 * body ni de headers.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { SHOP_DOMAIN_RE } from "./config.mjs";

const HEX64_RE = /^[0-9a-f]{64}$/;
const TIMESTAMP_RE = /^[0-9]{1,12}$/;
const CUSTOMER_ID_RE = /^[1-9][0-9]{0,19}$/;
const MAX_QUERY_LENGTH = 4096;

/** Parte de la query de un request-target (`/ruta?query`), sin decodificar. */
export function rawQueryOf(requestUrl) {
  const url = String(requestUrl ?? "");
  const index = url.indexOf("?");
  return index === -1 ? "" : url.slice(index + 1);
}

/** Mensaje que firma Shopify para una query cruda. */
export function proxyMessage(rawQuery) {
  const params = new URLSearchParams(rawQuery);
  const grouped = new Map();
  for (const [key, value] of params) {
    if (key === "signature") continue;
    const values = grouped.get(key);
    if (values) values.push(value);
    else grouped.set(key, [value]);
  }
  return [...grouped]
    .map(([key, values]) => `${key}=${values.join(",")}`)
    .sort()
    .join("");
}

export function computeProxySignature(rawQuery, secret) {
  return createHmac("sha256", secret).update(proxyMessage(rawQuery), "utf8").digest("hex");
}

/** Tienda `*.myshopify.com` exacta y en la allowlist (sin distinguir mayúsculas). */
export function isAllowedShop(shop, allowedShops) {
  const normalized = String(shop ?? "").toLowerCase();
  return SHOP_DOMAIN_RE.test(normalized) && allowedShops.includes(normalized);
}

function single(params, key) {
  const values = params.getAll(key);
  return values.length === 1 ? values[0] : null;
}

function fail(reason) {
  return { ok: false, reason };
}

/**
 * @param {string} rawQuery query cruda (sin "?")
 * @param {{secret: string, nowSec: number, maxSkewSec: number,
 *          allowedShops: readonly string[], allowedPathPrefixes: readonly string[]}} options
 * @returns {{ok: true, shop: string, customerId: string, customerGid: string}
 *         | {ok: false, reason: "invalid_signature"|"stale_request"|"shop_not_allowed"|"prefix_not_allowed"|"no_customer"}}
 */
export function verifyProxyRequest(rawQuery, options) {
  const { secret, nowSec, maxSkewSec, allowedShops, allowedPathPrefixes } = options;
  if (typeof rawQuery !== "string" || rawQuery.length === 0 || rawQuery.length > MAX_QUERY_LENGTH) {
    return fail("invalid_signature");
  }
  if (typeof secret !== "string" || secret.length === 0) return fail("invalid_signature");

  const params = new URLSearchParams(rawQuery);
  const signatures = params.getAll("signature");
  if (signatures.length !== 1 || !HEX64_RE.test(signatures[0])) return fail("invalid_signature");

  const expected = Buffer.from(computeProxySignature(rawQuery, secret), "hex");
  const provided = Buffer.from(signatures[0], "hex");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return fail("invalid_signature");
  }

  const timestamp = single(params, "timestamp");
  if (timestamp === null || !TIMESTAMP_RE.test(timestamp)) return fail("stale_request");
  if (Math.abs(nowSec - Number(timestamp)) > maxSkewSec) return fail("stale_request");

  const shop = single(params, "shop");
  if (shop === null || !isAllowedShop(shop, allowedShops)) return fail("shop_not_allowed");

  const pathPrefix = single(params, "path_prefix");
  if (pathPrefix === null || !allowedPathPrefixes.includes(pathPrefix)) return fail("prefix_not_allowed");

  const customerId = single(params, "logged_in_customer_id");
  if (customerId === null || !CUSTOMER_ID_RE.test(customerId)) return fail("no_customer");

  return {
    ok: true,
    shop: shop.toLowerCase(),
    customerId,
    customerGid: `gid://shopify/Customer/${customerId}`,
  };
}
