/**
 * Verificación del session token de la extensión "Mis favoritos" (E2, R2).
 *
 * Doc (session-token-api): claims `dest` (URL de la tienda), `aud` (client
 * id), `exp` (5 min), `nbf`, `iat`, `jti` y `sub` (GID del cliente, solo con
 * sesión). "Always validate the token signature, expiration (exp), and
 * audience (aud) on your backend using your app's shared secret".
 * Algoritmo HS256 con el client secret (doc de session tokens de Admin).
 *
 * Reglas (diseño § 4 E2):
 * - `alg` debe ser exactamente HS256 (se rechazan "none", RS256, HS512…).
 * - firma HMAC-SHA256 en tiempo constante;
 * - `exp` y `nbf` obligatorios, con tolerancia chica (5 s por defecto);
 * - `aud` = client id (string exacto);
 * - host de `dest` en la allowlist de tiendas. El formato real de `dest` en
 *   cuentas está SIN VERIFICAR (GO/NO-GO 12): se acepta `https://<tienda>`
 *   o el dominio pelado; cualquier otra cosa se rechaza;
 * - `sub` = gid://shopify/Customer/<id>. Sin `sub` no hay clienta: 401.
 * `iss` no se valida: la doc de cuentas no lo lista (ver README, desvíos).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { isAllowedShop } from "./proxy-signature.mjs";

const MAX_TOKEN_LENGTH = 4096;
const SEGMENT_RE = /^[A-Za-z0-9_-]+$/;
const CUSTOMER_GID_RE = /^gid:\/\/shopify\/Customer\/[1-9][0-9]{0,19}$/;

function fail(reason) {
  return { ok: false, reason };
}

function decodeJsonSegment(segment) {
  const value = JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("not_object");
  return value;
}

/** Host de `dest`: acepta "https://tienda.myshopify.com[/]" o "tienda.myshopify.com". */
export function destHost(dest) {
  if (typeof dest !== "string" || dest.length === 0 || dest.length > 255) return null;
  if (!dest.includes("/")) return dest.toLowerCase();
  let url;
  try {
    url = new URL(dest);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  return url.hostname.toLowerCase();
}

/** Extrae el token de un header `Authorization: Bearer <token>`. */
export function bearerToken(header) {
  if (typeof header !== "string") return null;
  const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * @param {string} token JWT compacto
 * @param {{secret: string, clientId: string, allowedShops: readonly string[],
 *          nowSec: number, leewaySec?: number}} options
 * @returns {{ok: true, shop: string, customerGid: string}
 *         | {ok: false, reason: "malformed"|"bad_alg"|"bad_signature"|"expired"|"not_yet_valid"|"bad_aud"|"bad_dest"|"no_customer"}}
 */
export function verifySessionToken(token, options) {
  const { secret, clientId, allowedShops, nowSec, leewaySec = 5 } = options;
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return fail("malformed");
  const parts = token.split(".");
  if (parts.length !== 3 || !parts.every((part) => SEGMENT_RE.test(part))) return fail("malformed");

  let header;
  let payload;
  try {
    header = decodeJsonSegment(parts[0]);
    payload = decodeJsonSegment(parts[1]);
  } catch {
    return fail("malformed");
  }

  if (header.alg !== "HS256") return fail("bad_alg");
  if (typeof secret !== "string" || secret.length === 0) return fail("bad_signature");

  const expected = createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`, "utf8").digest();
  const provided = Buffer.from(parts[2], "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return fail("bad_signature");

  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return fail("expired");
  if (nowSec > payload.exp + leewaySec) return fail("expired");
  if (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf)) return fail("not_yet_valid");
  if (nowSec + leewaySec < payload.nbf) return fail("not_yet_valid");

  if (typeof clientId !== "string" || clientId.length === 0 || payload.aud !== clientId) return fail("bad_aud");

  const host = destHost(payload.dest);
  if (host === null || !isAllowedShop(host, allowedShops)) return fail("bad_dest");

  if (typeof payload.sub !== "string" || !CUSTOMER_GID_RE.test(payload.sub)) return fail("no_customer");

  return { ok: true, shop: host, customerGid: payload.sub };
}
