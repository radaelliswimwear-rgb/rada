#!/usr/bin/env node
/**
 * 03K (workstream E) — validación determinista del paquete de migración del catálogo para una tienda LIMPIA (29 productos / 98 variantes / 95 imágenes).
 * Solo lectura. No toca Shopify, no usa red.
 *
 *   node launch/tools/03k-catalog-package-check.mjs               # valida (exit 1 si algo falla)
 *   node launch/tools/03k-catalog-package-check.mjs --json        # resultado en JSON
 *   node launch/tools/03k-catalog-package-check.mjs --self-test   # casos negativos sintéticos
 *
 * Controles (el CSV de importación es import/shopify-products-03c.csv, formato oficial de Productos > Importar):
 *   E1  29 productos, 98 variantes, 95 imágenes; 1 fila de producto por handle
 *   E2  handles: minúsculas [a-z0-9-], únicos; = catalog/shopify-handle-mapping.csv (29); 1 redirect por mayúsculas (COSTA-ESMERALDA-AZUL)
 *   E3  SKU únicos (98); = variant_identifier de catalog/variants-master.csv; = SKU de la hoja de inventario (98)
 *   E4  precios: enteros COP > 0; compare-at > precio en todas las variantes; = calculated_sale_price / price_cop de products-master.csv
 *   E5  colecciones: solo las 4 del sitio (10 / 12 / 7 / 0 productos según collections-master.csv) y cada producto en exactamente 1
 *   E6  imágenes: URL https, posiciones 1..n sin huecos por producto, alt no vacío; = images/images-manifest.csv (95); dimensiones 95/95 dentro del límite de Shopify
 *   E7  metafield custom.color presente en todos los productos y con un valor del mapa import/color-mapping.csv
 *   E8  import/checksums.txt: cada archivo listado existe y su SHA-256 coincide (reproducibilidad)
 *   E9  hoja de inventario: 98 filas, cantidad_a_cargar VACÍA en todas (no se inventan cantidades), 1 fila marcada XL
 *   E10 decisión XL pendiente: import/xl-decision.json = PENDING_OWNER (no se elimina ni se decide sola)
 *   E11 definiciones de metafields: import/metafield-definitions.json cubre TODO metafield que usa el theme (grep de theme-src)
 *   E12 la Dev Store está documentada como QA (no como tienda final): import/README.md no promete publicar desde ella
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ARGS = new Set(process.argv.slice(2));
const rd = (p, enc = "utf8") => fs.readFileSync(path.join(ROOT, p), enc);
const has = (p) => fs.existsSync(path.join(ROOT, p));

export function parseCSV(text) {
  const rows = [];
  let rec = [];
  let f = "";
  let q = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { rec.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; rec.push(f); f = ""; if (rec.length > 1 || rec[0] !== "") rows.push(rec); rec = []; }
    else f += c;
  }
  if (f !== "" || rec.length) { rec.push(f); rows.push(rec); }
  return rows;
}
const table = (file) => {
  const [h, ...r] = parseCSV(rd(file));
  return r.map((row) => Object.fromEntries(h.map((k, i) => [k, row[i] ?? ""])));
};

export function evaluate(data) {
  const { imp, variants, products, mapping, collectionsMaster, images, dims, colors, inventory, checksums, xl, metaDefs, metaUsed, readme, fix, imgFix } = data;
  const out = [];
  const check = (id, name, ok, detail = "") => out.push({ id, name, ok, detail });

  const prodRows = imp.filter((r) => r["Title"] !== "");
  const varRows = imp.filter((r) => r["SKU"] !== "");
  const imgRows = imp.filter((r) => r["Product image URL"] !== "");
  const handles = [...new Set(imp.map((r) => r["URL handle"]))];
  check("E1", "29 productos / 98 variantes / 95 imágenes", prodRows.length === 29 && varRows.length === 98 && imgRows.length === 95 && handles.length === 29, `${prodRows.length}/${varRows.length}/${imgRows.length}, handles ${handles.length}`);

  const badH = handles.filter((h) => !/^[a-z0-9-]+$/.test(h));
  const mapH = new Set(mapping.map((m) => m.shopify_handle));
  const missH = handles.filter((h) => !mapH.has(h));
  const redirects = mapping.filter((m) => /^SI/.test(m.redirect_needed)).length;
  const upper = mapping.filter((m) => m.source_handle !== m.source_handle.toLowerCase()).length;
  check("E2", "handles minúsculas, únicos y = mapeo (29); 1 origen con mayúsculas", badH.length === 0 && missH.length === 0 && mapping.length === 29 && upper === 1, `malos ${badH.length}; fuera del mapeo ${missH.length}; mapeo ${mapping.length}; mayúsculas ${upper}; redirects ${redirects}`);

  const skus = varRows.map((r) => r["SKU"]);
  const dupSku = skus.filter((s, i) => skus.indexOf(s) !== i);
  const vmSkus = new Set(variants.map((v) => v.variant_identifier));
  const invSkus = new Set(inventory.map((r) => r.sku));
  const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
  check("E3", "SKU únicos (98) = variants-master = hoja de inventario", dupSku.length === 0 && skus.length === 98 && sameSet(new Set(skus), vmSkus) && sameSet(new Set(skus), invSkus), `duplicados ${dupSku.length}; masters ${vmSkus.size}; inventario ${invSkus.size}`);

  const prodBySlug = Object.fromEntries(products.map((p) => [p.slug.toLowerCase(), p]));
  const badP = [];
  for (const v of varRows) {
    const price = Number(v["Price"]);
    const cmp = Number(v["Compare-at price"]);
    if (!Number.isInteger(price) || price <= 0) badP.push(`${v["SKU"]}: precio ${v["Price"]}`);
    if (!(cmp > price)) badP.push(`${v["SKU"]}: compare-at ${v["Compare-at price"]} <= precio`);
  }
  for (const r of prodRows) {
    const p = prodBySlug[r["URL handle"]];
    if (!p) { badP.push(`${r["URL handle"]}: sin producto en products-master`); continue; }
    const firstVar = varRows.find((v) => v["URL handle"] === r["URL handle"]);
    if (firstVar && (Number(firstVar["Price"]) !== Number(p.calculated_sale_price) || Number(firstVar["Compare-at price"]) !== Number(p.price_cop))) badP.push(`${r["URL handle"]}: precios distintos a products-master`);
  }
  check("E4", "precios enteros > 0, compare-at > precio y = products-master", badP.length === 0, badP.slice(0, 4).join("; "));

  const collCount = {};
  const perProd = {};
  for (const r of prodRows) { collCount[r["Collection"]] = (collCount[r["Collection"]] || 0) + 1; perProd[r["URL handle"]] = (perProd[r["URL handle"]] || 0) + (r["Collection"] ? 1 : 0); }
  const want = { "Oasis Natural": 10, "Aurora Viva": 12, "Espuma de Ola": 7 };
  const okColl = Object.entries(want).every(([k, v]) => collCount[k] === v) && Object.keys(collCount).length === 3 && Object.values(perProd).every((n) => n === 1);
  const salidas = collectionsMaster.find((c) => c.slug === "salidas-de-bano");
  check("E5", "colecciones 10 / 12 / 7 / 0 (Salidas de Baño vacía) y 1 por producto", okColl && salidas && Number(salidas.products_count) === 0, JSON.stringify(collCount));

  const byH = {};
  for (const r of imgRows) (byH[r["URL handle"]] ||= []).push(r);
  const badI = [];
  for (const [h, rs] of Object.entries(byH)) {
    const pos = rs.map((r) => Number(r["Image position"])).sort((a, b) => a - b);
    if (pos.some((p, i) => p !== i + 1)) badI.push(`${h}: posiciones ${pos.join(",")}`);
    for (const r of rs) {
      if (!/^https:\/\//.test(r["Product image URL"])) badI.push(`${h}: URL no https`);
      if (!r["Image alt text"].trim()) badI.push(`${h}: alt vacío`);
    }
  }
  const manifestUrls = new Set(images.map((i) => i.current_url));
  const impUrls = new Set(imgRows.map((r) => r["Product image URL"]));
  // 43 fotos de 4672x7008 (32,7 MP) superan el límite de Shopify (5000 px / 25 MP): la primera pasada las descarta y la SEGUNDA pasada
  // (import/shopify-products-03c-images.csv) las reimporta con c_limit,w_5000,h_5000,q_95 (trazabilidad en image-resolution-fix.csv).
  const oversize = dims.filter((d) => d.within_shopify_limit !== "SI");
  const fixSrc = new Set(fix.map((x) => x.source_url));
  const uncovered = oversize.filter((d) => !fixSrc.has(d.url));
  // Las filas "dentro del límite" (1) se reimportan con la URL original: solo las que superan el límite llevan c_limit.
  const badFix = fix.filter((x) => /^supera/.test(x.reason) && !/c_limit,w_5000,h_5000/.test(x.imported_url));
  const imgFixUrls = new Set(imgFix.filter((r) => r["Product image URL"] !== "").map((r) => r["Product image URL"]));
  const notInPass2 = fix.filter((x) => !imgFixUrls.has(x.imported_url));
  check("E6", "imágenes: 95, https, posiciones 1..n, alt, = manifiesto; las que exceden el límite (>25 MP) tienen reimportación c_limit en la segunda pasada", badI.length === 0 && manifestUrls.size === 95 && sameSet(manifestUrls, impUrls) && dims.length === 95 && uncovered.length === 0 && badFix.length === 0 && notInPass2.length === 0, `${badI.slice(0, 3).join("; ")} manifiesto ${manifestUrls.size}; dims ${dims.length} (sobre el límite ${oversize.length}; sin reimportación ${uncovered.length}; fix sin c_limit ${badFix.length}; fuera de la segunda pasada ${notInPass2.length})`);

  const colorCol = "Color (product.metafields.custom.color)";
  const allowed = new Set(colors.map((c) => c.shopify_custom_color));
  const noColor = prodRows.filter((r) => !r[colorCol] || !allowed.has(r[colorCol]));
  check("E7", "custom.color en los 29 productos y dentro del mapa de colores", noColor.length === 0, noColor.slice(0, 3).map((r) => `${r["URL handle"]}=${r[colorCol]}`).join("; "));

  const badC = [];
  for (const [file, hash] of checksums) {
    if (!has(file)) badC.push(`${file}: falta`);
    else if (crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, file))).digest("hex") !== hash) badC.push(`${file}: SHA distinto`);
  }
  check("E8", `checksums.txt (${checksums.length} archivos)`, checksums.length >= 6 && badC.length === 0, badC.join("; "));

  const filled = inventory.filter((r) => (r.cantidad_a_cargar || "").trim() !== "");
  const xlRows = inventory.filter((r) => (r.nota || "").trim() !== "");
  check("E9", "hoja de inventario: 98 filas, ninguna cantidad inventada, 1 fila XL marcada", inventory.length === 98 && filled.length === 0 && xlRows.length === 1 && xlRows[0].sku === "LG-AUR-000001-XL", `filas ${inventory.length}; con cantidad ${filled.length}; marcadas ${xlRows.length}`);

  check("E10", "decisión XL = PENDING_OWNER (no se decide sola)", xl && xl.sku === "LG-AUR-000001-XL" && xl.status === "PENDING_OWNER" && xl.decision === null, xl ? `${xl.sku} ${xl.status}` : "falta import/xl-decision.json");

  const defined = new Set((metaDefs.definitions || []).map((d) => `${d.owner}.${d.namespace}.${d.key}`));
  const missing = [...metaUsed].filter((m) => !defined.has(m));
  check("E11", `definiciones de metafields cubren lo que usa el theme (${metaUsed.size})`, missing.length === 0 && (metaDefs.definitions || []).every((d) => d.type && d.name), `sin definir: ${missing.join(", ")}`);

  check("E12", "la Dev Store se declara sandbox de QA, no tienda final", /sandbox|QA|tienda final|tienda limpia/i.test(readme) && !/publicar(la)? desde la Dev Store/i.test(readme), "import/README.md");
  return out;
}

export function loadData() {
  const metaUsed = new Set();
  const scan = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = dir + "/" + e.name;
      if (e.isDirectory()) scan(rel);
      else if (/\.(liquid|js|json)$/.test(e.name)) for (const m of rd(rel).matchAll(/\b(products?|collections?|customer|shop|page|article|variants?)\.metafields\.([a-z_]+)\.([a-z_0-9]+)/g)) {
        const owner = { product: "product", products: "product", collection: "collection", collections: "collection", customer: "customer", shop: "shop", page: "page", article: "article", variant: "variant", variants: "variant" }[m[1]];
        metaUsed.add(`${owner}.${m[2]}.${m[3]}`);
      }
    }
  };
  scan("theme-src");
  for (const m of rd("theme-src/layout/theme.liquid").matchAll(/customer\.metafields\.([a-z_]+)\.([a-z_0-9]+)/g)) metaUsed.add(`customer.${m[1]}.${m[2]}`);
  const readOr = (f, fallback) => (has(f) ? JSON.parse(rd(f)) : fallback);
  return {
    imp: table("import/shopify-products-03c.csv"),
    variants: table("catalog/variants-master.csv"),
    products: table("catalog/products-master.csv"),
    mapping: table("catalog/shopify-handle-mapping.csv"),
    collectionsMaster: table("collections/collections-master.csv"),
    images: table("images/images-manifest.csv"),
    dims: table("import/image-dimensions.csv"),
    fix: table("import/image-resolution-fix.csv"),
    imgFix: table("import/shopify-products-03c-images.csv"),
    colors: table("import/color-mapping.csv"),
    inventory: table("import/inventory-template.csv"),
    checksums: rd("import/checksums.txt").split(/\r?\n/).filter(Boolean).map((l) => { const m = l.match(/^([0-9a-f]{64})\s+(.+)$/); return m ? [m[2].trim(), m[1]] : null; }).filter(Boolean),
    xl: readOr("import/xl-decision.json", null),
    metaDefs: readOr("import/metafield-definitions.json", { definitions: [] }),
    metaUsed,
    readme: rd("import/README.md"),
  };
}

function selfTest() {
  const data = loadData();
  const clone = () => JSON.parse(JSON.stringify(data, (k, v) => (v instanceof Set ? { __set: [...v] } : v), 0), (k, v) => (v && v.__set ? new Set(v.__set) : v));
  const good = evaluate(clone());
  const fails0 = good.filter((r) => !r.ok).length;
  const mutants = [
    ["E1", (d) => { d.imp = d.imp.filter((r, i) => i !== 5); }],
    ["E2", (d) => { d.imp[0]["URL handle"] = "Marea Natural"; }],
    ["E3", (d) => { d.inventory[1].sku = d.inventory[0].sku; }],
    ["E4", (d) => { const v = d.imp.find((r) => r["SKU"]); v["Compare-at price"] = v["Price"]; }],
    ["E5", (d) => { const r = d.imp.find((x) => x["Collection"] === "Aurora Viva"); r["Collection"] = "Oasis Natural"; }],
    ["E6", (d) => { const r = d.imp.find((x) => x["Product image URL"]); r["Image alt text"] = ""; }],
    ["E6", (d) => { for (let i = 0; i < 5; i++) d.fix.pop(); }],
    ["E7", (d) => { d.imp.find((r) => r["Title"])["Color (product.metafields.custom.color)"] = ""; }],
    ["E8", (d) => { d.checksums[0][1] = "0".repeat(64); }],
    ["E9", (d) => { d.inventory[3].cantidad_a_cargar = "5"; }],
    ["E10", (d) => { d.xl = { ...d.xl, status: "DECIDED", decision: "delete" }; }],
    ["E11", (d) => { d.metaDefs.definitions.pop(); }],
    ["E12", (d) => { d.readme = "publicar desde la Dev Store"; }],
  ];
  let detected = 0;
  for (const [id, mut] of mutants) {
    const d = clone();
    mut(d);
    const r = evaluate(d).find((x) => x.id === id);
    if (r && !r.ok) detected++;
    else console.log(`NO DETECTADO: ${id}`);
  }
  console.log(`self-test: base ${fails0 === 0 ? "PASS" : `FAIL(${fails0})`}; mutantes detectados ${detected}/${mutants.length}`);
  process.exit(fails0 === 0 && detected === mutants.length ? 0 : 1);
}

if (process.argv[1] && process.argv[1].endsWith("03k-catalog-package-check.mjs")) {
  if (ARGS.has("--self-test")) selfTest();
  else {
    const res = evaluate(loadData());
    if (ARGS.has("--json")) console.log(JSON.stringify(res, null, 1));
    else {
      for (const r of res) console.log(`[${r.ok ? "PASS" : "FAIL"}] ${r.id} ${r.name}${!r.ok && r.detail ? "\n        " + r.detail : ""}`);
      const fails = res.filter((r) => !r.ok).length;
      console.log(`\nRESULTADO: ${fails === 0 ? "PASS" : "FAIL"} -- ${res.length - fails}/${res.length} controles`);
    }
    process.exit(res.some((r) => !r.ok) ? 1 : 0);
  }
}
