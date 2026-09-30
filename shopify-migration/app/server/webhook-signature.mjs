/**
 * Verificación HMAC de webhooks (E3, R4): `X-Shopify-Hmac-SHA256` =
 * base64(HMAC-SHA256(body CRUDO, client secret)), comparado en tiempo
 * constante (doc: webhooks/verify-deliveries).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE64_RE = /^[A-Za-z0-9+/]{43}=$/;

export function computeWebhookHmac(rawBody, secret) {
  return createHmac("sha256", secret).update(rawBody).digest("base64");
}

/**
 * @param {Buffer} rawBody body tal cual llegó (sin re-serializar)
 * @param {string | undefined} headerValue valor de X-Shopify-Hmac-SHA256
 * @param {string} secret client secret de la app
 */
export function verifyWebhookHmac(rawBody, headerValue, secret) {
  if (!Buffer.isBuffer(rawBody) || typeof secret !== "string" || secret.length === 0) return false;
  if (typeof headerValue !== "string" || !BASE64_RE.test(headerValue)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const provided = Buffer.from(headerValue, "base64");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
