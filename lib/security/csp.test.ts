import { test } from "node:test";
import assert from "node:assert/strict";
import nextConfig from "../../next.config";

// Fase 0 analytics foundation: test de regresión. next.config.ts debe
// quedar libre de dominios de trackers de terceros (least privilege) hasta
// que una fase posterior los agregue de forma deliberada — ver el
// comentario junto al array CSP en next.config.ts.

const TRACKER_DOMAINS = [
  "googletagmanager.com",
  "google-analytics.com",
  "facebook.net",
  "facebook.com",
  "doubleclick.net",
  "tiktok.com",
];

test("CSP no incluye dominios de trackers de terceros todavía", async () => {
  const headersConfig = await nextConfig.headers?.();
  assert.ok(headersConfig, "next.config.ts debe exportar headers()");

  const entry = headersConfig!.find((item) => item.source === "/:path*");
  assert.ok(entry, "debe existir una entrada de headers para /:path*");

  const cspHeader = entry!.headers.find(
    (header) => header.key === "Content-Security-Policy",
  );
  assert.ok(cspHeader, "debe existir el header Content-Security-Policy");

  for (const domain of TRACKER_DOMAINS) {
    assert.ok(
      !cspHeader!.value.includes(domain),
      `la CSP no debería incluir "${domain}" todavía`,
    );
  }
});
