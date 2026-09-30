#!/usr/bin/env node
// Radaelli Swimwear -- Shopify migration, Fase 01E.
// Transforma source-of-truth/public-scrape-raw.json (obtenido por lectura
// pasiva GET de paginas publicas de radaelliswimwear.com, sin
// autenticacion, sin DATABASE_URL) en los archivos maestros de la Fase 01.
//
// NO es el mismo metodo que export-radaelli-catalog-for-shopify.mjs (ese
// lee Prisma directo, este parte de HTML/JSON-LD publico). Se marca con un
// status distinto en catalog-snapshot.json para que quede trazable cual
// metodo produjo los datos.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SITE_URL = "https://radaelliswimwear.com";

const raw = JSON.parse(
  readFileSync(join(ROOT, "source-of-truth", "public-scrape-raw.json"), "utf8")
);

const CATEGORY_CLEANUP = {
  "Oasis Natural": { slug: "oasis-natural", keepRemove: "KEEP", target: "Oasis Natural" },
  "Aurora Viva": { slug: "aurora-viva", keepRemove: "KEEP", target: "Aurora Viva" },
  "Espuma de Ola": { slug: "espuma-de-ola", keepRemove: "KEEP", target: "Espuma de Ola" },
};

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  return lines.join("\n") + "\n";
}

const products = raw.products.map((p) => {
  const discountPercent = Math.round((1 - p.salePriceCop / p.listPriceCop) * 100);
  const cleanup = CATEGORY_CLEANUP[p.category] ?? { slug: null, keepRemove: "N/A", target: null };
  return { ...p, discountPercent, cleanup };
});

// --- catalog-snapshot.json ---
const snapshot = {
  _meta: {
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    generated_by: "shopify-migration/scripts/build-from-public-scrape.mjs",
    method: "PUBLIC_PAGES_PASSIVE_GET",
    status: "REAL_EXPORT_PUBLIC_SCRAPE",
    note:
      "Datos reales obtenidos SIN DATABASE_URL: sitemap.xml + JSON-LD de cada /producto/<slug> + HTML de las paginas de coleccion, todo GET publico sin autenticacion. Stock: solo se pudo confirmar disponibilidad (InStock/OutOfStock), NO la cantidad exacta -- ver MANUAL_STEP_REQUIRED.md. Product.id, featured, y conteo de productos INACTIVOS (no visibles publicamente) siguen NOT_AVAILABLE.",
  },
  products: products.map((p) => ({
    id: null,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    listPriceCop: p.listPriceCop,
    salePriceCop: p.salePriceCop,
    discountPercent: p.discountPercent,
    color: p.color,
    description: p.description,
    active: true,
    updatedAt: p.lastmod,
    category: { slug: p.cleanup.slug, name: p.category },
    sizes: p.sizes,
    stockStatus: p.availability,
    images: p.images,
    seo: {
      effectiveTitle: p.name,
      effectiveDescription: p.description,
      canonicalUrl: `${SITE_URL}/producto/${p.slug}`,
    },
    categoryCleanup: {
      currentCategory: p.category,
      targetShopifyCollection: p.cleanup.target,
      cleanupRequired: p.cleanup.keepRemove !== "KEEP",
    },
    dataQualityFlags: [p.nameSlugMismatch, p.skuPrefixMismatch].filter(Boolean),
  })),
  collections: Object.entries(raw.collectionCounts).map(([slug, count]) => ({
    slug,
    productCount: count,
  })),
}
writeFileSync(join(ROOT, "source-of-truth", "catalog-snapshot.json"), JSON.stringify(snapshot, null, 2));

// --- products-master.csv ---
const productHeaders = [
  "current_id", "sku", "slug", "name", "category", "collection", "color",
  "description", "price_cop", "discount_percent", "calculated_sale_price",
  "active", "featured", "created_at", "updated_at", "seo_title",
  "seo_description", "current_public_url", "current_category",
  "target_shopify_collection", "category_cleanup_required",
];
writeFileSync(
  join(ROOT, "catalog", "products-master.csv"),
  toCsv(
    products.map((p) => ({
      current_id: "NOT_AVAILABLE (id interno no expuesto publicamente)",
      sku: p.sku, slug: p.slug, name: p.name, category: p.category,
      collection: p.cleanup.slug, color: p.color, description: p.description,
      price_cop: p.listPriceCop, discount_percent: p.discountPercent,
      calculated_sale_price: p.salePriceCop, active: true,
      featured: "NOT_AVAILABLE", created_at: "NOT_AVAILABLE", updated_at: p.lastmod,
      seo_title: p.name, seo_description: p.description,
      current_public_url: `${SITE_URL}/producto/${p.slug}`,
      current_category: p.category, target_shopify_collection: p.cleanup.target,
      category_cleanup_required: p.cleanup.keepRemove !== "KEEP",
    })),
    productHeaders
  )
);

// --- variants-master.csv (una fila por talla, sin cantidad exacta) ---
const variantRows = products.flatMap((p) =>
  p.sizes.map((size) => ({
    variant_id: "NOT_AVAILABLE", product_id: "NOT_AVAILABLE",
    product_sku: p.sku, product_name: p.name, color: p.color, size,
    stock: "NOT_AVAILABLE (solo se confirmo disponible/agotado, no cantidad)",
    variant_identifier: `${p.sku}-${size}`,
    migration_notes: `Disponible (${p.availability}) segun web publica, 2026-09-28`,
  }))
);
writeFileSync(
  join(ROOT, "catalog", "variants-master.csv"),
  toCsv(variantRows, ["variant_id", "product_id", "product_sku", "product_name", "color", "size", "stock", "variant_identifier", "migration_notes"])
);

// --- images-manifest.csv ---
const imageRows = products.flatMap((p) =>
  p.images.map((url, i) => ({
    product_id: "NOT_AVAILABLE", sku: p.sku, product_name: p.name,
    image_position: i, current_url: url, public_id: "NOT_AVAILABLE (no expuesto publicamente)",
    alt_text: p.name, source: "cloudinary", migration_status: "PENDING",
  }))
);
writeFileSync(
  join(ROOT, "images", "images-manifest.csv"),
  toCsv(imageRows, ["product_id", "sku", "product_name", "image_position", "current_url", "public_id", "alt_text", "source", "migration_status"])
);

// --- collections-master.csv ---
const OFFICIAL = new Set(["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"]);
const NAMES = { "oasis-natural": "Oasis Natural", "aurora-viva": "Aurora Viva", "espuma-de-ola": "Espuma de Ola", "salidas-de-bano": "Salidas de Baño", accesorios: "Accesorios", hombre: "Hombre", mujer: "Mujer", ninos: "Niños", calzado: "Calzado" };
const collectionRows = Object.entries(raw.collectionCounts).map(([slug, count]) => {
  const keep = OFFICIAL.has(slug);
  return {
    current_category: NAMES[slug], slug, products_count: count,
    current_status: count > 0 ? "active, con productos reales" : "sin productos reales hoy",
    target_status: keep ? "official collection" : (slug === "accesorios" ? "REQUIRES_DECISION" : "retired"),
    keep_remove: keep ? "KEEP" : (slug === "accesorios" ? "REQUIRES_DECISION" : "REMOVE"),
    target_collection: keep ? NAMES[slug] : (slug === "accesorios" ? "REQUIRES_DECISION" : ""),
    redirect_required: count > 0 ? "SI" : "NO (sin productos indexados hoy)",
    proposed_shopify_collection: keep ? NAMES[slug] : (slug === "accesorios" ? "REQUIRES_DECISION" : ""),
    migration_notes: count === 0 ? "Confirmado 0 productos reales (Fase 01E, lectura publica 2026-09-28) -- sin reasignacion pendiente" : `${count} productos reales confirmados`,
  };
});
writeFileSync(
  join(ROOT, "collections", "collections-master.csv"),
  toCsv(collectionRows, ["current_category", "slug", "products_count", "current_status", "target_status", "keep_remove", "target_collection", "redirect_required", "proposed_shopify_collection", "migration_notes"])
);

// --- seo/current-url-inventory.csv (regenerar con las 29 filas reales de producto) ---
const seoStatic = [
  { current_url: `${SITE_URL}/`, entity_type: "home", slug: "", seo_title: "Radaelli Swimwear", meta_description: "NOT_AVAILABLE (generado en runtime)", canonical_current: `${SITE_URL}/`, proposed_shopify_url: "/", redirect_required: "SI", migration_notes: "Home" },
];
const seoCollections = Object.entries(raw.collectionCounts).map(([slug]) => ({
  current_url: `${SITE_URL}/${slug}`, entity_type: "collection", slug,
  seo_title: "NOT_AVAILABLE (generado en runtime)", meta_description: "NOT_AVAILABLE",
  canonical_current: `${SITE_URL}/${slug}`, proposed_shopify_url: `/collections/${slug}`,
  redirect_required: raw.collectionCounts[slug] > 0 ? "SI" : "NO (0 productos)",
  migration_notes: OFFICIAL.has(slug) ? "KEEP" : (slug === "accesorios" ? "REQUIRES_DECISION" : "REMOVE (ya archivada, 0 productos)"),
}));
const seoProducts = products.map((p) => ({
  current_url: `${SITE_URL}/producto/${p.slug}`, entity_type: "product", slug: p.slug,
  seo_title: p.name, meta_description: p.description.slice(0, 160),
  canonical_current: `${SITE_URL}/producto/${p.slug}`, proposed_shopify_url: `/products/${p.slug.toLowerCase()}`,
  redirect_required: "SI", migration_notes: p.dataQualityFlags?.length ? "Ver catalog-quality-report.md" : "",
}));
const seoTail = [
  { current_url: `${SITE_URL}/blog/<slug>`, entity_type: "blog_post", slug: "<slug>", seo_title: "NOT_AVAILABLE", meta_description: "NOT_AVAILABLE", canonical_current: `${SITE_URL}/blog/<slug>`, proposed_shopify_url: "/blogs/<blog>/<slug>", redirect_required: "SI", migration_notes: "3 posts reales confirmados en sitemap" },
  { current_url: `${SITE_URL}/envios`, entity_type: "page", slug: "envios", seo_title: "NOT_AVAILABLE", meta_description: "NOT_AVAILABLE", canonical_current: `${SITE_URL}/envios`, proposed_shopify_url: "/pages/envios", redirect_required: "SI", migration_notes: "Pagina legal" },
  { current_url: `${SITE_URL}/devoluciones`, entity_type: "page", slug: "devoluciones", seo_title: "NOT_AVAILABLE", meta_description: "NOT_AVAILABLE", canonical_current: `${SITE_URL}/devoluciones`, proposed_shopify_url: "/pages/devoluciones", redirect_required: "SI", migration_notes: "Pagina legal" },
  { current_url: `${SITE_URL}/garantia`, entity_type: "page", slug: "garantia", seo_title: "NOT_AVAILABLE", meta_description: "NOT_AVAILABLE", canonical_current: `${SITE_URL}/garantia`, proposed_shopify_url: "/pages/garantia", redirect_required: "SI", migration_notes: "Pagina legal" },
  { current_url: `${SITE_URL}/terminos`, entity_type: "page", slug: "terminos", seo_title: "NOT_AVAILABLE", meta_description: "NOT_AVAILABLE", canonical_current: `${SITE_URL}/terminos`, proposed_shopify_url: "/pages/terminos", redirect_required: "SI", migration_notes: "Pagina legal" },
  { current_url: `${SITE_URL}/privacidad`, entity_type: "page", slug: "privacidad", seo_title: "NOT_AVAILABLE", meta_description: "NOT_AVAILABLE", canonical_current: `${SITE_URL}/privacidad`, proposed_shopify_url: "/pages/privacidad", redirect_required: "SI", migration_notes: "Pagina legal" },
  { current_url: `${SITE_URL}/cookies`, entity_type: "page", slug: "cookies", seo_title: "NOT_AVAILABLE", meta_description: "NOT_AVAILABLE", canonical_current: `${SITE_URL}/cookies`, proposed_shopify_url: "/pages/cookies", redirect_required: "SI", migration_notes: "Pagina legal" },
  { current_url: `${SITE_URL}/buscar`, entity_type: "search", slug: "", seo_title: "NOT_AVAILABLE", meta_description: "NOT_AVAILABLE", canonical_current: "noindex (propio)", proposed_shopify_url: "/search", redirect_required: "NO", migration_notes: "noindex hoy" },
];
writeFileSync(
  join(ROOT, "seo", "current-url-inventory.csv"),
  toCsv([...seoStatic, ...seoCollections, ...seoProducts, ...seoTail], ["current_url", "entity_type", "slug", "seo_title", "meta_description", "canonical_current", "proposed_shopify_url", "redirect_required", "migration_notes"])
);

console.log(`OK -- ${products.length} productos reales procesados (metodo: lectura publica, sin DATABASE_URL).`);
console.log(`Categorias con productos reales: ${Object.entries(raw.collectionCounts).filter(([,c]) => c > 0).map(([s,c]) => `${s}=${c}`).join(", ")}`);
console.log(`Categorias con 0 productos reales: ${Object.entries(raw.collectionCounts).filter(([,c]) => c === 0).map(([s]) => s).join(", ")}`);
