#!/usr/bin/env node
// LANE B - READ-ONLY one-call post-wave check (~6 s) so each wave can be verified without the slow `--dry` re-reads (products --dry = 100 s).
//   $env:TARGET_STORE='<store>.myshopify.com'; node quickcheck.mjs
// Expected on the finished official store:
//   products 29, variants 98, images 95 (READY 95), collections {oasis-natural:10, aurora-viva:12, espuma-de-ola:7, salidas-de-bano:0, destacados:7, frontpage:0},
//   redirects 51, pages incl. garantia/favoritos/privacidad/terminos/envios/cookies, menus {main-menu:5, comprar:4, ayuda:6}, tracked 98, weight500g 98.
const STORE = process.env.TARGET_STORE;
if (!STORE || /colombia-launch/.test(STORE)) { console.error("TARGET_STORE obligatorio y distinto de 'launch'"); process.exit(2); }
const { gql } = await import("file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs");
const d = gql(`query {
  productsCount { count } productVariantsCount { count } collectionsCount { count } urlRedirectsCount { count }
  products(first: 40) { nodes { handle status mediaCount { count } media(first: 10) { nodes { status } } } }
  collections(first: 10) { nodes { handle sortOrder productsCount { count } } }
  pages(first: 20) { nodes { handle isPublished templateSuffix } }
  menus(first: 20) { nodes { handle items { title } } }
  shop { shopPolicies { type } }
  productVariants(first: 100) { nodes { inventoryItem { tracked measurement { weight { value unit } } } } }
}`);
const st = {};
for (const p of d.products.nodes) for (const m of p.media.nodes) st[m.status] = (st[m.status] || 0) + 1;
const g = (w) => (!w ? 0 : w.unit === "GRAMS" ? w.value : w.unit === "KILOGRAMS" ? w.value * 1000 : NaN);
console.log(JSON.stringify({
  store: STORE,
  products: d.productsCount.count, active: d.products.nodes.filter((p) => p.status === "ACTIVE").length,
  variants: d.productVariantsCount.count,
  images: d.products.nodes.reduce((a, p) => a + p.mediaCount.count, 0), mediaStatus: st,
  collections: Object.fromEntries(d.collections.nodes.map((c) => [c.handle, c.productsCount.count])),
  collectionsManual: d.collections.nodes.filter((c) => c.sortOrder === "MANUAL").map((c) => c.handle),
  redirects: d.urlRedirectsCount.count,
  pages: d.pages.nodes.filter((p) => p.isPublished).map((p) => p.handle + (p.templateSuffix ? ":" + p.templateSuffix : "")),
  menus: Object.fromEntries(d.menus.nodes.map((m) => [m.handle, m.items.length])),
  policies: d.shop.shopPolicies.map((p) => p.type),
  tracked: d.productVariants.nodes.filter((v) => v.inventoryItem.tracked).length,
  weight500g: d.productVariants.nodes.filter((v) => Math.abs(g(v.inventoryItem.measurement?.weight) - 500) < 0.01).length,
}));
