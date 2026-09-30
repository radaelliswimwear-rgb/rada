#!/usr/bin/env node
// Radaelli Swimwear -- Shopify migration, Fase 01, sección 4.
// Genera shopify-migration/catalog/Radaelli_Catalogo_Master.xlsx (6 hojas)
// a partir de source-of-truth/catalog-snapshot.json.
//
// Soporta 3 estados de snapshot._meta.status:
//   TEMPLATE_NOT_POPULATED   -- sin datos reales, solo estructura (Fase 01)
//   REAL_EXPORT              -- datos reales vía Prisma/DATABASE_URL directo (nunca corrido)
//   REAL_EXPORT_PUBLIC_SCRAPE -- datos reales vía lectura pública GET, sin DB (Fase 01E)
//
// Dependencia `xlsx` instalada de forma AISLADA en shopify-migration/scripts/
// (este package.json), nunca en el package.json del ecommerce.

import xlsx from "xlsx";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const snapshot = JSON.parse(
  readFileSync(join(ROOT, "source-of-truth", "catalog-snapshot.json"), "utf8")
);

const status = snapshot._meta?.status ?? "TEMPLATE_NOT_POPULATED";
const mode = status === "REAL_EXPORT" ? "db_real" : status === "REAL_EXPORT_PUBLIC_SCRAPE" ? "public_scrape" : "template";

const CATEGORY_CLEANUP = {
  "oasis-natural": { name: "Oasis Natural", targetStatus: "official collection", keepRemove: "KEEP", targetCollection: "Oasis Natural" },
  "aurora-viva": { name: "Aurora Viva", targetStatus: "official collection", keepRemove: "KEEP", targetCollection: "Aurora Viva" },
  "espuma-de-ola": { name: "Espuma de Ola", targetStatus: "official collection", keepRemove: "KEEP", targetCollection: "Espuma de Ola" },
  "salidas-de-bano": { name: "Salidas de Baño", targetStatus: "official collection", keepRemove: "KEEP", targetCollection: "Salidas de Baño" },
  accesorios: { name: "Accesorios", targetStatus: "REQUIRES_DECISION", keepRemove: "REQUIRES_DECISION", targetCollection: "REQUIRES_DECISION" },
  hombre: { name: "Hombre", targetStatus: "retired", keepRemove: "REMOVE", targetCollection: null },
  mujer: { name: "Mujer", targetStatus: "retired", keepRemove: "REMOVE", targetCollection: null },
  ninos: { name: "Niños", targetStatus: "retired", keepRemove: "REMOVE", targetCollection: null },
  calzado: { name: "Calzado", targetStatus: "retired", keepRemove: "REMOVE", targetCollection: null },
};
function cleanupFor(slug) {
  return CATEGORY_CLEANUP[slug] ?? { targetStatus: "REQUIRES_DECISION", keepRemove: "REQUIRES_DECISION", targetCollection: "REQUIRES_DECISION" };
}

const wb = xlsx.utils.book_new();
const products = mode !== "template" ? snapshot.products : [];

// --- HOJA 1: RESUMEN ---
let resumenRows;
if (mode === "db_real") {
  const totalVariants = products.reduce((n, p) => n + p.variants.length, 0);
  const totalStock = products.reduce((n, p) => n + p.variants.reduce((s, v) => s + v.stock, 0), 0);
  resumenRows = [
    ["fecha_del_snapshot", snapshot._meta.generated_at],
    ["metodo", "DATABASE_URL directo (Prisma)"],
    ["numero_de_productos", products.length],
    ["productos_activos", products.filter((p) => p.active).length],
    ["productos_inactivos", products.filter((p) => !p.active).length],
    ["numero_de_variantes", totalVariants],
    ["stock_total", totalStock],
    ["productos_sin_sku", products.filter((p) => !p.sku).length],
    ["variantes_sin_stock", products.reduce((n, p) => n + p.variants.filter((v) => v.stock === 0).length, 0)],
    ["productos_sin_imagenes", products.filter((p) => p.images.length === 0).length],
    ["productos_sin_descripcion", products.filter((p) => !p.description).length],
    ["productos_con_descuento", products.filter((p) => p.discountPercent > 0).length],
    ["productos_destacados", products.filter((p) => p.featured).length],
  ];
} else if (mode === "public_scrape") {
  const withFlags = products.filter((p) => (p.dataQualityFlags ?? []).length > 0).length;
  const skuSet = new Set(products.map((p) => p.sku));
  const slugSet = new Set(products.map((p) => p.slug.toLowerCase()));
  resumenRows = [
    ["fecha_del_snapshot", snapshot._meta.generated_at],
    ["metodo", "Lectura pública GET (sitemap + JSON-LD + páginas de colección), SIN DATABASE_URL -- ver MANUAL_STEP_REQUIRED.md"],
    ["numero_de_productos", products.length],
    ["productos_activos", `${products.length} confirmados visibles públicamente (no se puede confirmar cuántos productos INACTIVOS existen además, no son públicos)`],
    ["productos_inactivos", "NOT_AVAILABLE (no observables por este método)"],
    ["numero_de_variantes_talla", products.reduce((n, p) => n + p.sizes.length, 0)],
    ["stock_total", "NOT_AVAILABLE (solo se confirmó disponible/agotado por talla, no cantidad exacta)"],
    ["productos_sin_sku", products.filter((p) => !p.sku).length],
    ["sku_duplicados", skuSet.size !== products.length ? products.length - skuSet.size : 0],
    ["slugs_duplicados_case_insensitive", slugSet.size !== products.length ? products.length - slugSet.size : 0],
    ["productos_sin_imagenes", products.filter((p) => p.images.length === 0).length],
    ["productos_sin_descripcion", products.filter((p) => !p.description).length],
    ["productos_con_descuento_activo", products.filter((p) => p.discountPercent > 0).length],
    ["productos_destacados", "NOT_AVAILABLE (flag no expuesto públicamente)"],
    ["productos_con_hallazgos_de_calidad", withFlags],
  ];
} else {
  resumenRows = [
    ["fecha_del_snapshot", "PENDING — ver MANUAL_STEP_REQUIRED.md"],
    ["numero_de_productos", "PENDING"], ["productos_activos", "PENDING"], ["productos_inactivos", "PENDING"],
    ["numero_de_variantes", "PENDING"], ["stock_total", "PENDING"], ["productos_sin_sku", "PENDING"],
    ["variantes_sin_stock", "PENDING"], ["productos_sin_imagenes", "PENDING"], ["productos_sin_descripcion", "PENDING"],
    ["productos_con_descuento", "PENDING"], ["productos_destacados", "PENDING"],
  ];
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([["metrica", "valor"], ...resumenRows]), "RESUMEN");

// --- HOJA 2: PRODUCTOS ---
const productHeaders = [
  "current_id", "sku", "slug", "name", "category", "collection", "color",
  "description", "price_cop", "discount_percent", "calculated_sale_price",
  "active", "featured", "created_at", "updated_at", "seo_title",
  "seo_description", "current_public_url", "current_category",
  "target_shopify_collection", "category_cleanup_required", "data_quality_flags",
];
let productRows = [];
if (mode === "db_real") {
  productRows = products.map((p) => {
    const cleanup = cleanupFor(p.category.slug);
    return [
      p.id, p.sku ?? "", p.slug, p.name, p.category.name, p.category.slug, p.color,
      p.description, Math.round(p.priceValueCents / 100), p.discountPercent,
      Math.round((p.priceValueCents / 100) * (1 - p.discountPercent / 100)),
      p.active, p.featured, p.createdAt, p.updatedAt,
      p.seo.effectiveTitle, p.seo.effectiveDescription, p.seo.canonicalUrl,
      p.category.name, cleanup.targetCollection ?? "", cleanup.keepRemove !== "KEEP", "",
    ];
  });
} else if (mode === "public_scrape") {
  productRows = products.map((p) => [
    "NOT_AVAILABLE", p.sku, p.slug, p.name, p.category.name, p.category.slug, p.color,
    p.description, p.listPriceCop, p.discountPercent, p.salePriceCop,
    true, "NOT_AVAILABLE", "NOT_AVAILABLE", p.updatedAt,
    p.seo.effectiveTitle, p.seo.effectiveDescription, p.seo.canonicalUrl,
    p.categoryCleanup.currentCategory, p.categoryCleanup.targetShopifyCollection ?? "",
    p.categoryCleanup.cleanupRequired, (p.dataQualityFlags ?? []).join(" | "),
  ]);
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([productHeaders, ...productRows]), "PRODUCTOS");

// --- HOJA 3: VARIANTES ---
const variantHeaders = ["variant_id", "product_id", "product_sku", "product_name", "color", "size", "stock", "variant_identifier", "migration_notes"];
let variantRows = [];
if (mode === "db_real") {
  variantRows = products.flatMap((p) =>
    p.variants.map((v) => [v.id, p.id, p.sku ?? "", p.name, p.color, v.size, v.stock, `${p.sku ?? p.slug}-${v.size}`, v.stock < 0 ? "STOCK NEGATIVO -- revisar antes de migrar" : ""])
  );
} else if (mode === "public_scrape") {
  variantRows = products.flatMap((p) =>
    p.sizes.map((size) => ["NOT_AVAILABLE", "NOT_AVAILABLE", p.sku, p.name, p.color, size, "NOT_AVAILABLE (solo disponible/agotado)", `${p.sku}-${size}`, `${p.stockStatus} según web pública`])
  );
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([variantHeaders, ...variantRows]), "VARIANTES");

// --- HOJA 4: IMAGENES ---
const imageHeaders = ["product_id", "sku", "product_name", "image_position", "current_url", "public_id", "alt_text", "source", "migration_status"];
let imageRows = [];
if (mode === "db_real") {
  imageRows = products.flatMap((p) => p.images.map((im) => [p.id, p.sku ?? "", p.name, im.position, im.url, im.publicId ?? "", "", im.publicId ? "cloudinary" : "external/unknown", "PENDING"]));
} else if (mode === "public_scrape") {
  imageRows = products.flatMap((p) => p.images.map((url, i) => ["NOT_AVAILABLE", p.sku, p.name, i, url, "NOT_AVAILABLE", p.name, "cloudinary", "PENDING"]));
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([imageHeaders, ...imageRows]), "IMAGENES");

// --- HOJA 5: COLECCIONES ---
const collectionHeaders = ["current_category", "slug", "products_count", "current_status", "target_status", "keep_remove", "target_collection", "redirect_required", "proposed_shopify_collection", "migration_notes"];
let collectionRows = [];
if (mode === "db_real") {
  collectionRows = snapshot.collections.map((c) => {
    const cleanup = cleanupFor(c.slug);
    return [c.name, c.slug, c.productCount, c.active ? "active" : "archived", cleanup.targetStatus, cleanup.keepRemove, cleanup.targetCollection ?? "", cleanup.keepRemove === "REMOVE" ? "REQUIERE_DECISION" : "SI", cleanup.targetCollection ?? c.name, c.active ? "" : "Archivada"];
  });
} else if (mode === "public_scrape") {
  collectionRows = snapshot.collections.map((c) => {
    const cleanup = cleanupFor(c.slug);
    const name = cleanup.name ?? c.slug;
    return [name, c.slug, c.productCount, c.productCount > 0 ? "active, con productos reales" : "sin productos reales hoy", cleanup.targetStatus, cleanup.keepRemove, cleanup.targetCollection ?? "", c.productCount > 0 ? "SI" : "NO (0 productos)", cleanup.targetCollection ?? "", c.productCount === 0 ? "Confirmado 0 productos reales (Fase 01E)" : `${c.productCount} productos reales`];
  });
} else {
  collectionRows = Object.entries(CATEGORY_CLEANUP).map(([slug, cleanup]) => [
    cleanup.name, slug, "NOT_AVAILABLE",
    ["hombre", "mujer", "ninos", "calzado"].includes(slug) ? "archived (fuera de nav/sitemap)" : "active (nav+sitemap)",
    cleanup.targetStatus, cleanup.keepRemove, cleanup.targetCollection ?? "",
    cleanup.keepRemove === "REMOVE" ? "REQUIERE_DECISION" : "SI", cleanup.targetCollection ?? cleanup.name,
    "Ver category-taxonomy-audit.md",
  ]);
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([collectionHeaders, ...collectionRows]), "COLECCIONES");

// --- HOJA 6: SEO ---
const seoHeaders = ["current_url", "entity_type", "slug", "seo_title", "meta_description", "canonical_current", "proposed_shopify_url", "redirect_required", "migration_notes"];
let seoRows = [];
if (mode !== "template") {
  seoRows = products.map((p) => [p.seo.canonicalUrl, "product", p.slug, p.seo.effectiveTitle, p.seo.effectiveDescription, p.seo.canonicalUrl, `/products/${p.slug.toLowerCase()}`, "SI", (p.dataQualityFlags ?? []).join(" | ")]);
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([seoHeaders, ...seoRows]), "SEO");

const outPath = join(ROOT, "catalog", "Radaelli_Catalogo_Master.xlsx");
xlsx.writeFile(wb, outPath);
console.log(`Workbook escrito en ${outPath} (modo: ${mode})`);
