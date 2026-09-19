import { test } from "node:test";
import assert from "node:assert/strict";
import nextConfig from "../../next.config";

// Hardening P2/P3 (sep. 2026): X-Powered-By, Cross-Origin-Opener-Policy,
// Cross-Origin-Resource-Policy. Mismo patrón de test que lib/security/csp.test.ts
// -- lee next.config.ts real, nunca un valor copiado a mano que se pueda
// desalinear.

test("X-Powered-By queda desactivado (poweredByHeader: false)", () => {
  assert.equal(nextConfig.poweredByHeader, false);
});

test("Cross-Origin-Opener-Policy: same-origin está presente en /:path*", async () => {
  const headersConfig = await nextConfig.headers?.();
  const entry = headersConfig!.find((item) => item.source === "/:path*");
  assert.ok(entry);

  const coop = entry!.headers.find(
    (header) => header.key === "Cross-Origin-Opener-Policy",
  );
  assert.ok(coop, "debe existir el header Cross-Origin-Opener-Policy");
  assert.equal(coop!.value, "same-origin");
});

test("Cross-Origin-Resource-Policy: same-origin está presente en /:path*", async () => {
  const headersConfig = await nextConfig.headers?.();
  const entry = headersConfig!.find((item) => item.source === "/:path*");
  assert.ok(entry);

  const corp = entry!.headers.find(
    (header) => header.key === "Cross-Origin-Resource-Policy",
  );
  assert.ok(corp, "debe existir el header Cross-Origin-Resource-Policy");
  assert.equal(corp!.value, "same-origin");
});

// Deliberadamente NO se agrega Cross-Origin-Embedder-Policy (COEP) -- ver
// el comentario junto a SECURITY_HEADERS en next.config.ts. Este test
// documenta la decisión como regresión: si alguien lo agrega sin haber
// auditado Cloudinary/GA4/Meta Pixel primero, este test falla y obliga a
// revisar el motivo antes de continuar.
test("Cross-Origin-Embedder-Policy NO está presente (fuera de alcance a propósito)", async () => {
  const headersConfig = await nextConfig.headers?.();
  const entry = headersConfig!.find((item) => item.source === "/:path*");
  const coep = entry!.headers.find(
    (header) => header.key === "Cross-Origin-Embedder-Policy",
  );
  assert.equal(coep, undefined);
});

// Confirma que los headers ya existentes (auditoría previa) siguen intactos
// -- este cambio solo debía SUMAR headers, nunca reemplazar los que ya
// funcionaban.
test("los headers de seguridad previos siguen todos presentes", async () => {
  const headersConfig = await nextConfig.headers?.();
  const entry = headersConfig!.find((item) => item.source === "/:path*");
  const keys = entry!.headers.map((header) => header.key);

  for (const expected of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    assert.ok(keys.includes(expected), `falta el header ${expected}`);
  }
});
