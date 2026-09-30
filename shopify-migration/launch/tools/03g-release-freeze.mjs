// 03G — genera launch/03G-release-freeze.md (hashes SHA-256 de lo que queda congelado).
// Uso: node launch/tools/03g-release-freeze.mjs "<fecha y hora Bogotá, p.ej. 2026-09-30, 00:55>"
// Solo lectura sobre los artefactos; escribe únicamente el .md.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(here, "..", "..");
const time = process.argv[2] || "NOT_AVAILABLE";
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(path.join(MIG, p))).digest("hex");
const size = (p) => fs.statSync(path.join(MIG, p)).size;
const exists = (p) => fs.existsSync(path.join(MIG, p));

const groups = [
  { title: "Theme (release congelado)", files: ["dist/radaelli-shopify-theme-rc1.8.zip", "dist/release-manifest-rc1.8.json", "dist/release-manifest-rc1.7.json", "dist/radaelli-shopify-theme-rc1.7.zip"] },
  { title: "App de favoritos (sin instalar)", files: ["dist/radaelli-wishlist-app-0.1.2.zip", "dist/radaelli-wishlist-app-0.1.1.zip", "dist/radaelli-wishlist-app-0.1.0.zip"] },
  {
    title: "Catálogo (29 productos / 98 variantes / 95 imágenes)",
    files: [
      "catalog/products-master.csv", "catalog/variants-master.csv", "catalog/shopify-handle-mapping.csv", "catalog/shopify-post-import-audit.csv",
      "catalog/shopify-url-parity.csv", "catalog/color-search-tag-map.csv", "catalog/Radaelli_Catalogo_Master.xlsx", "collections/collections-master.csv",
      "import/shopify-products-03c.csv", "import/shopify-products-03c-images.csv", "import/image-resolution-fix.csv", "import/color-mapping.csv", "import/image-dimensions.csv",
      "source-of-truth/catalog-snapshot.json", "source-of-truth/public-scrape-raw.json",
    ],
  },
  { title: "Redirecciones", files: ["seo/shopify-redirects-import.csv", "seo/current-url-inventory.csv", "seo/validate-redirects.mjs", "seo/03E-redirect-plan.md"] },
  { title: "Contenido legal (verbatim)", files: ["content/legal/manifest.json", "content/legal/cookies.html", "content/legal/devoluciones.html", "content/legal/envios.html", "content/legal/garantia.html", "content/legal/privacidad.html", "content/legal/terminos.html"] },
  { title: "Media", files: ["content/media/media-migration-manifest.csv", "content/media/03E-wiring-plan.md", "content/media/03F-media-owner-runbook.md"] },
  {
    title: "Scripts principales",
    files: [
      "scripts/build-theme-rc.mjs", "scripts/apply-media-wiring.mjs", "scripts/prepare-media-package.mjs", "scripts/build-shopify-product-csv.mjs",
      "scripts/build-shopify-image-fix-csv.mjs", "scripts/build-color-search-tag-map.mjs", "scripts/build-url-parity.mjs", "scripts/audit-theme-limits.mjs",
      "scripts/export-radaelli-catalog-for-shopify.mjs", "scripts/extract-legal-verbatim.cjs", "scripts/test/test-apply-media-wiring.mjs",
    ],
  },
  { title: "Esqueleto de analítica (apagado)", files: fs.existsSync(path.join(MIG, "analytics/custom-pixel")) ? fs.readdirSync(path.join(MIG, "analytics/custom-pixel"), { withFileTypes: true }).filter((e) => e.isFile()).map((e) => "analytics/custom-pixel/" + e.name).sort() : [] },
];

const lines = [];
lines.push("# 03G — Congelamiento de release (RC1.8)");
lines.push("");
lines.push(`- **Fecha de congelamiento:** ${time} (Bogotá), después de la regresión final de 03G.`);
lines.push("- **Generado por:** `launch/tools/03g-release-freeze.mjs` (determinista; lee los artefactos y calcula SHA-256).");
lines.push("- **Alcance:** lo que se congela es lo necesario para reconstruir la Dev Store y para migrar a la tienda comercial. Los documentos de `launch/`, `theme/` y `seo/03F-*` describen el estado; no forman parte del congelamiento.");
lines.push("");
lines.push("## Qué significa congelar");
lines.push("");
lines.push("- El theme vigente en la Dev Store es **RC1.8** y no cambia salvo un defecto real. Si aparece uno: corrección + prueba de regresión + mutante + Theme Check 0/0 + push solo al theme sin publicar + comparación remoto = ZIP + **RC1.9** con su manifiesto (RC1.8 queda como histórico).");
lines.push("- Ningún artefacto de catálogo, redirecciones, contenido legal ni media se modifica sin volver a correr sus validadores (`seo/validate-redirects.mjs`, `scripts/test/test-apply-media-wiring.mjs`, auditoría 29/98/95).");
lines.push("- Pasar de la Dev Store a la tienda comercial reutiliza estos mismos archivos; el plan está en `launch/03G-commercial-store-migration-plan.md`.");
lines.push("- Lo que existe **solo en el Admin** (y no en estos archivos) está listado en `launch/03G-reproducibility-gap-audit.md`.");
lines.push("");
lines.push("## Qué cambió en 03G");
lines.push("");
lines.push("- Theme: **RC1.7 → RC1.8** (un archivo: `sections/main-product.liquid`). Corrige la miga de pan, el enlace \"Volver a…\" y el JSON-LD `BreadcrumbList` de la ficha, que usaban `product.collections.first` (orden no garantizado por Shopify; 4 fichas de Espuma de Ola mostraban \"Destacados\"). Ahora usan la colección de categoría del producto.");
lines.push("- App: sin cambios (0.1.2). Catálogo, redirecciones, legales y media: sin cambios.");
lines.push("");
for (const g of groups) {
  lines.push(`## ${g.title}`);
  lines.push("");
  lines.push("| Archivo | Bytes | SHA-256 |");
  lines.push("|---|---:|---|");
  for (const f of g.files) {
    if (!exists(f)) {
      lines.push(`| \`${f}\` | — | **NO EXISTE** |`);
      continue;
    }
    lines.push(`| \`${f}\` | ${size(f).toLocaleString("en-US").replace(/,/g, ".")} | \`${sha(f)}\` |`);
  }
  lines.push("");
}

// Contenido de theme-src desplegable: hash del conjunto
const THEME_DIRS = ["assets", "config", "layout", "locales", "sections", "snippets", "templates"];
const all = [];
for (const d of THEME_DIRS) for (const e of fs.readdirSync(path.join(MIG, "theme-src", d))) all.push(`${d}/${e}`);
all.sort();
const setHash = crypto.createHash("sha256");
for (const f of all) setHash.update(f + "\0" + sha("theme-src/" + f) + "\n");
lines.push("## Contenido del theme (theme-src desplegable)");
lines.push("");
lines.push(`- ${all.length} archivos en los 7 directorios desplegables. Hash del conjunto (nombre + SHA-256 de cada archivo, orden alfabético): \`${setHash.digest("hex")}\`.`);
lines.push("- Debe coincidir con el contenido del ZIP RC1.8 y con el theme remoto `189072474431` (comparación 96/96 hecha el 2026-09-29).");
lines.push("");
fs.writeFileSync(path.join(MIG, "launch", "03G-release-freeze.md"), lines.join("\n"));
console.log("freeze escrito; archivos hasheados:", groups.reduce((a, g) => a + g.files.length, 0), "; theme-src:", all.length);
