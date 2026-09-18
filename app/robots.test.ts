import { test } from "node:test";
import assert from "node:assert/strict";

// SEO técnico (sep. 2026): robots.ts lee getAppBaseUrl() al llamarse, no al
// importarse -- alcanza con fijar APP_BASE_URL/APP_ENVIRONMENT antes de
// invocar la función, sin necesidad de mock.module.
process.env.APP_ENVIRONMENT = "production";
process.env.APP_BASE_URL = "https://radaelliswimwear.com";

test("robots: bloquea las rutas privadas/transaccionales reales", async () => {
  const robots = (await import("./robots")).default;
  const result = robots();
  const rule = result.rules[0]!;
  for (const path of [
    "/admin",
    "/cuenta",
    "/checkout",
    "/favoritos",
    "/api",
    "/interno",
    "/buscar",
  ]) {
    assert.ok(
      (rule.disallow as string[]).includes(path),
      `robots.txt debe bloquear ${path}`,
    );
  }
});

test("robots: declara el sitemap y el host con el dominio oficial", async () => {
  const robots = (await import("./robots")).default;
  const result = robots();
  assert.equal(result.sitemap, "https://radaelliswimwear.com/sitemap.xml");
  assert.equal(result.host, "https://radaelliswimwear.com");
});

test("robots: nunca referencia rada-pi.vercel.app", async () => {
  const robots = (await import("./robots")).default;
  const result = robots();
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes("vercel.app"));
});

test("robots: no bloquea rutas de catálogo públicas reales", async () => {
  const robots = (await import("./robots")).default;
  const result = robots();
  const rule = result.rules[0]!;
  for (const publicPath of ["/producto", "/blog", "/oasis-natural"]) {
    assert.ok(!(rule.disallow as string[]).includes(publicPath));
  }
});
