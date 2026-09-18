import { test } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../tests/mock-module";

process.env.APP_ENVIRONMENT = "production";
process.env.APP_BASE_URL = "https://radaelliswimwear.com";

const PRODUCT_UPDATED_AT = new Date("2026-09-01T12:00:00.000Z");
const POST_UPDATED_AT = new Date("2026-08-15T09:00:00.000Z");

mockModule("lib/catalog/catalog-repository", {
  catalogRepository: {
    listSitemapProducts: async () => [
      { slug: "bikini-foam", updatedAt: PRODUCT_UPDATED_AT },
    ],
  },
});

mockModule("lib/blog/blog-repository", {
  blogRepository: {
    listSitemapPosts: async () => [
      { slug: "cuidado-de-prendas", updatedAt: POST_UPDATED_AT },
    ],
  },
});

test("sitemap: incluye productos publicados con lastModified real", async () => {
  const sitemap = (await import("./sitemap")).default;
  const entries = await sitemap();
  const product = entries.find((e) => e.url.endsWith("/producto/bikini-foam"));
  assert.ok(product, "el producto debe estar en el sitemap");
  assert.equal(product!.lastModified, PRODUCT_UPDATED_AT);
});

test("sitemap: incluye posts de blog publicados con lastModified real", async () => {
  const sitemap = (await import("./sitemap")).default;
  const entries = await sitemap();
  const post = entries.find((e) =>
    e.url.endsWith("/blog/cuidado-de-prendas"),
  );
  assert.ok(post, "el post debe estar en el sitemap");
  assert.equal(post!.lastModified, POST_UPDATED_AT);
});

test("sitemap: incluye páginas legales/informativas públicas reales", async () => {
  const sitemap = (await import("./sitemap")).default;
  const entries = await sitemap();
  const urls = entries.map((e) => e.url);
  for (const path of [
    "/envios",
    "/devoluciones",
    "/garantia",
    "/terminos",
    "/privacidad",
    "/cookies",
  ]) {
    assert.ok(
      urls.includes(`https://radaelliswimwear.com${path}`),
      `falta ${path} en el sitemap`,
    );
  }
});

test("sitemap: excluye categorías archivadas (hombre/mujer/ninos/calzado)", async () => {
  const sitemap = (await import("./sitemap")).default;
  const entries = await sitemap();
  const urls = entries.map((e) => e.url);
  for (const path of ["/hombre", "/mujer", "/ninos", "/calzado"]) {
    assert.ok(
      !urls.includes(`https://radaelliswimwear.com${path}`),
      `${path} no debería estar en el sitemap (archivada)`,
    );
  }
});

test("sitemap: excluye rutas privadas/transaccionales", async () => {
  const sitemap = (await import("./sitemap")).default;
  const entries = await sitemap();
  const serialized = JSON.stringify(entries);
  for (const forbidden of [
    "/checkout",
    "/admin",
    "/cuenta",
    "/interno",
    "/buscar",
    "/api",
  ]) {
    assert.ok(!serialized.includes(forbidden), `no debe incluir ${forbidden}`);
  }
});

test("sitemap: todas las URLs usan el dominio oficial, nunca rada-pi.vercel.app", async () => {
  const sitemap = (await import("./sitemap")).default;
  const entries = await sitemap();
  for (const entry of entries) {
    assert.ok(entry.url.startsWith("https://radaelliswimwear.com"));
    assert.ok(!entry.url.includes("vercel.app"));
  }
});
