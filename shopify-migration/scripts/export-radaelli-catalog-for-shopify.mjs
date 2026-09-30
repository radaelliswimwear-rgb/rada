#!/usr/bin/env node
// Radaelli Swimwear -- Shopify migration, Fase 01 (sección 11) + Fase 01B
// (limpieza de taxonomía, secciones 5/9/10).
//
// SCRIPT DE SOLO LECTURA. No contiene ninguna llamada de escritura: solo usa
// `.findMany()` de Prisma sobre Product/Category/Coupon. No ejecuta
// `create`/`update`/`delete`/`upsert`/`$executeRaw` en ningún punto.
//
// FALLA CERRADO A PROPÓSITO: se niega a correr si detecta un entorno de
// desarrollo (DATABASE_ENV_LABEL/APP_ENVIRONMENT), o si no se pasa la
// confirmación explícita, para que nunca se use por error contra la base de
// desarrollo y el resultado se presente como "catálogo real de producción".
// Ver ../MANUAL_STEP_REQUIRED.md para el contexto completo.
//
// Uso (desde la raíz del repo, con DATABASE_URL de PRODUCCIÓN y solo lectura
// ya confirmado por Daniela):
//
//   CONFIRM_PRODUCTION_READONLY_EXPORT=yes DATABASE_URL="postgresql://..." \
//     node shopify-migration/scripts/export-radaelli-catalog-for-shopify.mjs
//
// No se ejecutó nunca en esta fase -- no había ninguna cadena de conexión
// confirmada como de producción y de solo lectura disponible.

import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

function failClosed(reason) {
  console.error(`\nMANUAL STEP REQUIRED — CATALOG DATA ACCESS\n\n${reason}\n`);
  console.error("Ver shopify-migration/MANUAL_STEP_REQUIRED.md antes de reintentar.\n");
  process.exit(1);
}

// --- Guardas de entorno: fallar cerrado ante cualquier ambigüedad ---

if (process.env.CONFIRM_PRODUCTION_READONLY_EXPORT !== "yes") {
  failClosed(
    "Falta la confirmación explícita CONFIRM_PRODUCTION_READONLY_EXPORT=yes. " +
      "Este script no asume nada por defecto."
  );
}

const envLabel = (process.env.DATABASE_ENV_LABEL || "").toLowerCase();
const appEnv = (process.env.APP_ENVIRONMENT || "").toLowerCase();

if (envLabel.includes("dev") || appEnv.includes("dev")) {
  failClosed(
    `DATABASE_ENV_LABEL="${process.env.DATABASE_ENV_LABEL}" / APP_ENVIRONMENT="${process.env.APP_ENVIRONMENT}" ` +
      "indican un entorno de desarrollo. Este script se niega a exportar 'catálogo real' desde ahí."
  );
}

if (!process.env.DATABASE_URL) {
  failClosed("No hay DATABASE_URL en el entorno. Nada que consultar.");
}

// --- A partir de acá, solo lectura ---

const prisma = new PrismaClient();

// Decisión de negocio de la Fase 01B (ver reports/category-taxonomy-audit.md
// y shopify-import/shopify-target-taxonomy.md) -- NO se ejecuta acá, solo se
// anota en el export para no perder la fotografía histórica ("current_category"
// siempre queda intacto en products-master.csv/JSON, esto solo AGREGA la
// propuesta al lado, ver sección 9 del encargo).
const CATEGORY_CLEANUP = {
  "oasis-natural": { targetStatus: "official collection", keepRemove: "KEEP", targetCollection: "Oasis Natural" },
  "aurora-viva": { targetStatus: "official collection", keepRemove: "KEEP", targetCollection: "Aurora Viva" },
  "espuma-de-ola": { targetStatus: "official collection", keepRemove: "KEEP", targetCollection: "Espuma de Ola" },
  "salidas-de-bano": { targetStatus: "official collection", keepRemove: "KEEP", targetCollection: "Salidas de Baño" },
  accesorios: { targetStatus: "REQUIRES_DECISION", keepRemove: "REQUIRES_DECISION", targetCollection: "REQUIRES_DECISION" },
  hombre: { targetStatus: "retired", keepRemove: "REMOVE", targetCollection: null },
  mujer: { targetStatus: "retired", keepRemove: "REMOVE", targetCollection: null },
  ninos: { targetStatus: "retired", keepRemove: "REMOVE", targetCollection: null },
  calzado: { targetStatus: "retired", keepRemove: "REMOVE", targetCollection: null },
};

function cleanupFor(slug) {
  return (
    CATEGORY_CLEANUP[slug] ?? {
      targetStatus: "REQUIRES_DECISION",
      keepRemove: "REQUIRES_DECISION",
      targetCollection: "REQUIRES_DECISION",
    }
  );
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

async function main() {
  console.log("Exportando catálogo — SOLO LECTURA (findMany únicamente)...");

  // Solo lectura: findMany. Ninguna de estas llamadas escribe nada.
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
      images: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "asc" },
  });

  const siteUrl = process.env.APP_BASE_URL || "https://radaelliswimwear.com";

  // --- JSON canónico (sección 6) ---
  const snapshot = {
    _meta: {
      schema_version: "1.0",
      generated_at: new Date().toISOString(),
      generated_by: "shopify-migration/scripts/export-radaelli-catalog-for-shopify.mjs",
      source_database_env_label: process.env.DATABASE_ENV_LABEL || null,
      status: "REAL_EXPORT",
    },
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      priceValueCents: p.priceValue,
      discountPercent: p.discountPercent,
      color: p.color,
      description: p.description,
      featured: p.featured,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: {
        id: p.category.id,
        slug: p.category.slug,
        name: p.category.name,
        discountPercent: p.category.discountPercent,
      },
      variants: p.variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock })),
      images: p.images.map((im) => ({
        id: im.id,
        url: im.url,
        publicId: im.publicId,
        position: im.position,
      })),
      seo: {
        effectiveTitle: p.name,
        effectiveDescription: p.description,
        canonicalUrl: `${siteUrl}/producto/${p.slug}`,
      },
      categoryCleanup: {
        currentCategory: p.category.name,
        targetShopifyCollection: cleanupFor(p.category.slug).targetCollection,
        cleanupRequired: cleanupFor(p.category.slug).keepRemove !== "KEEP",
      },
    })),
    collections: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      active: c.active,
      discountPercent: c.discountPercent,
      productCount: c._count.products,
      cleanup: {
        currentStatus: c.active ? "active" : "archived",
        ...cleanupFor(c.slug),
      },
    })),
    coupons: coupons.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.value,
      active: c.active,
      minSubtotalCents: c.minSubtotal,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    })),
  };

  writeFileSync(
    join(ROOT, "source-of-truth", "catalog-snapshot.json"),
    JSON.stringify(snapshot, null, 2)
  );

  // --- CSVs ---
  const productRows = products.map((p) => ({
    current_id: p.id,
    sku: p.sku ?? "",
    slug: p.slug,
    name: p.name,
    category: p.category.name,
    collection: p.category.slug,
    color: p.color,
    description: p.description,
    price_cop: Math.round(p.priceValue / 100),
    discount_percent: p.discountPercent,
    calculated_sale_price: Math.round(
      (p.priceValue / 100) * (1 - p.discountPercent / 100)
    ),
    active: p.active,
    featured: p.featured,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    seo_title: p.name,
    seo_description: p.description,
    current_public_url: `${siteUrl}/producto/${p.slug}`,
    current_category: p.category.name,
    target_shopify_collection: cleanupFor(p.category.slug).targetCollection ?? "",
    category_cleanup_required: cleanupFor(p.category.slug).keepRemove !== "KEEP",
  }));
  writeFileSync(
    join(ROOT, "catalog", "products-master.csv"),
    toCsv(productRows, [
      "current_id", "sku", "slug", "name", "category", "collection", "color",
      "description", "price_cop", "discount_percent", "calculated_sale_price",
      "active", "featured", "created_at", "updated_at", "seo_title",
      "seo_description", "current_public_url", "current_category",
      "target_shopify_collection", "category_cleanup_required",
    ])
  );

  const variantRows = products.flatMap((p) =>
    p.variants.map((v) => ({
      variant_id: v.id,
      product_id: p.id,
      product_sku: p.sku ?? "",
      product_name: p.name,
      color: p.color,
      size: v.size,
      stock: v.stock,
      variant_identifier: `${p.sku ?? p.slug}-${v.size}`,
      migration_notes: v.stock < 0 ? "STOCK NEGATIVO -- revisar antes de migrar" : "",
    }))
  );
  writeFileSync(
    join(ROOT, "catalog", "variants-master.csv"),
    toCsv(variantRows, [
      "variant_id", "product_id", "product_sku", "product_name", "color",
      "size", "stock", "variant_identifier", "migration_notes",
    ])
  );

  const imageRows = products.flatMap((p) =>
    p.images.map((im) => ({
      product_id: p.id,
      sku: p.sku ?? "",
      product_name: p.name,
      image_position: im.position,
      current_url: im.url,
      public_id: im.publicId ?? "",
      alt_text: "",
      source: im.publicId ? "cloudinary" : "external/unknown",
      migration_status: "PENDING",
    }))
  );
  writeFileSync(
    join(ROOT, "images", "images-manifest.csv"),
    toCsv(imageRows, [
      "product_id", "sku", "product_name", "image_position", "current_url",
      "public_id", "alt_text", "source", "migration_status",
    ])
  );

  const collectionRows = categories.map((c) => {
    const cleanup = cleanupFor(c.slug);
    return {
      current_category: c.name,
      slug: c.slug,
      products_count: c._count.products,
      current_status: c.active ? "active" : "archived",
      target_status: cleanup.targetStatus,
      keep_remove: cleanup.keepRemove,
      target_collection: cleanup.targetCollection ?? "",
      redirect_required: cleanup.keepRemove === "REMOVE" ? "REQUIERE_DECISION" : "SI",
      proposed_shopify_collection: cleanup.targetCollection ?? c.name,
      migration_notes: c.active ? "" : "Archivada (active=false) -- ver category-taxonomy-audit.md",
    };
  });
  writeFileSync(
    join(ROOT, "collections", "collections-master.csv"),
    toCsv(collectionRows, [
      "current_category", "slug", "products_count", "current_status",
      "target_status", "keep_remove", "target_collection", "redirect_required",
      "proposed_shopify_collection", "migration_notes",
    ])
  );

  console.log(`OK — ${products.length} productos, ${categories.length} colecciones, ${coupons.length} cupones exportados.`);
  console.log("Ningún dato de clientes/pedidos/pagos fue leído ni exportado por este script.");
}

main()
  .catch((err) => {
    console.error("Error durante el export (solo lectura, nada se escribió en la base):", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
