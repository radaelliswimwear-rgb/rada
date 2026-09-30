#!/usr/bin/env node
/**
 * Fase 03C -- paridad de URLs: sitio actual -> Development Store.
 *
 *   node shopify-migration/scripts/build-url-parity.mjs
 *
 * Entrada: seo/current-url-inventory.csv (Fase 01) + catalog/shopify-handle-mapping.csv.
 * Salida:  catalog/shopify-url-parity.csv
 *
 * "status" describe el estado en la Development Store al cierre de 03C
 * (productos y colecciones verificados en vivo: 200). Ningún redirect se crea
 * aquí: es el insumo para la fase de lanzamiento.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function parseCSV(text) {
  const rows = [];
  let rec = [];
  let f = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          f += '"';
          i++;
        } else q = false;
      } else f += c;
      continue;
    }
    if (c === '"') q = true;
    else if (c === ",") {
      rec.push(f);
      f = "";
    } else if (c === "\r") continue;
    else if (c === "\n") {
      rec.push(f);
      rows.push(rec);
      rec = [];
      f = "";
    } else f += c;
  }
  if (f || rec.length) {
    rec.push(f);
    rows.push(rec);
  }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, k) => [h, r[k]])));
}
const cell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const inventory = parseCSV(fs.readFileSync(path.join(ROOT, "seo/current-url-inventory.csv"), "utf8"));
const handles = new Map(parseCSV(fs.readFileSync(path.join(ROOT, "catalog/shopify-handle-mapping.csv"), "utf8")).map((r) => [r.source_url, r.shopify_handle]));
const TARGET_COLLECTIONS = new Set(["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"]);

const out = [["source_url", "shopify_url", "status", "redirect_needed", "reason"]];
for (const r of inventory) {
  const src = r.current_url;
  switch (r.entity_type) {
    case "home":
      out.push([src, "/", "EXISTS", "NO", "Misma ruta raíz"]);
      break;
    case "product": {
      const handle = handles.get(src);
      if (!handle) throw new Error(`producto sin mapeo: ${src}`);
      out.push([
        src,
        `/products/${handle}`,
        "EXISTS (200 en Dev Store)",
        "SI",
        handle !== r.slug ? "/producto/<slug> -> /products/<handle>; slug de origen en mayúsculas, Shopify lo usa en minúsculas" : "/producto/<slug> -> /products/<handle>; handle preservado exacto",
      ]);
      break;
    }
    case "collection":
      if (TARGET_COLLECTIONS.has(r.slug)) {
        out.push([
          src,
          `/collections/${r.slug}`,
          "EXISTS (200 en Dev Store)",
          "SI",
          r.slug === "salidas-de-bano"
            ? "/<slug> -> /collections/<slug>; la colección existe en Shopify (0 productos, igual que hoy): la Fase 01 decía NO por tener 0 productos, pero sin redirect la URL actual daría 404 -- REVISAR al lanzar"
            : "/<slug> -> /collections/<slug>; handle preservado exacto",
        ]);
      } else {
        out.push([src, "", "NOT_MIGRATED (excluida por decisión de catálogo)", "REQUIRES_DECISION", `Fase 01: ${r.migration_notes}. Opciones al lanzar: 301 a / o a una colección objetivo, o 404`]);
      }
      break;
    case "page":
      out.push([src, r.proposed_shopify_url, "NOT_AVAILABLE_YET (página legal no creada en 03C)", "SI (cuando exista)", "Contenido legal fuera del alcance de 03C; alternativa: políticas nativas de Shopify (/policies/...)"]);
      break;
    case "search":
      out.push([src, "/search", "EXISTS", "OPCIONAL", "Búsqueda nativa de Shopify; hoy /buscar es noindex"]);
      break;
    case "blog_post":
      out.push([src, r.proposed_shopify_url, "NOT_MIGRATED (blog fuera del alcance de 03C)", "SI (cuando se migre)", r.migration_notes]);
      break;
    default:
      throw new Error(`tipo desconocido ${r.entity_type}`);
  }
}
out.push(["https://radaelliswimwear.com/favoritos", "/pages/favoritos", "EXISTS (wishlist vía ?view=wishlist hasta asignar page.wishlist al publicar)", "SI", "/favoritos -> /pages/favoritos; activar después de asignar la plantilla (ver 03B)"]);
out.push(["https://radaelliswimwear.com/cuenta/favoritos", "/pages/favoritos", "EXISTS (idem)", "SI", "Mismo destino que /favoritos"]);

fs.writeFileSync(path.join(ROOT, "catalog/shopify-url-parity.csv"), out.map((r) => r.map(cell).join(",")).join("\n") + "\n");
const counts = {};
for (const r of out.slice(1)) counts[r[2].split(" ")[0]] = (counts[r[2].split(" ")[0]] || 0) + 1;
console.log(JSON.stringify({ rows: out.length - 1, counts }));
