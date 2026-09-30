#!/usr/bin/env node
/**
 * 03L — migración determinista del paquete Radaelli a la tienda final (Client Transfer Store de Colombia) por Admin GraphQL.
 * Usa `shopify store execute` con la autorización que la dueña aprobó (token en línea guardado por el CLI: este script
 * nunca lo lee, lo imprime ni lo guarda). Idempotente: cada ola comprueba si el recurso ya existe.
 *
 *   node launch/tools/03l-migrate.mjs <ola> [--dry]
 *
 * Olas (en este orden):
 *   info         lectura: tienda, idiomas, canales de venta
 *   defs         definiciones de metaobjeto y de metafields (import/metafield-definitions.json)
 *   collections  colecciones manuales (Oasis 10 / Aurora 12 / Espuma 7 / Salidas 0 / Destacados 7)
 *   products     29 productos / 98 variantes / 95 imágenes (import/shopify-products-03c.csv + corrección de fotos grandes)
 *   membership   pertenencia y orden manual de las colecciones (orden de la Dev Store: launch/evidence/dev-collections.json)
 *   publish      publica productos y colecciones en la Tienda online
 *   pages        páginas cuyo texto exacto ya existe (Garantía, Favoritos)
 *   menus        menús main-menu, comprar y ayuda (content/navigation-final-store.json)
 *   redirects    51 redirecciones (seo/shopify-redirects-import-final-store.csv)
 *   verify       lectura: cuentas y comprobaciones de la tienda
 *
 * No escribe llaves, tokens, cookies ni datos personales. No toca pagos, dominios ni la tienda de desarrollo.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseCSV } from "./03k-catalog-package-check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const STORE = process.env.TARGET_STORE || "radaelli-swimwear-colombia-launch-1jeqp0yj.myshopify.com";
const ARGS = process.argv.slice(2);
const WAVE = ARGS.find((a) => !a.startsWith("--")) || "info";
const DRY = ARGS.includes("--dry");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "03l-"));
const LOG = [];
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const table = (file) => {
  const [h, ...r] = parseCSV(rd(file));
  return r.map((row) => Object.fromEntries(h.map((k, i) => [k, row[i] ?? ""])));
};

let seq = 0;
export function gql(query, variables = {}, mutation = false) {
  const n = ++seq;
  const qf = path.join(TMP, `q${n}.graphql`);
  const vf = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(qf, query);
  fs.writeFileSync(vf, JSON.stringify(variables));
  const args = ["store", "execute", "--store", STORE, "--query-file", qf, "--variable-file", vf, "--json", "--no-color"];
  if (mutation) args.push("--allow-mutations");
  const r = spawnSync("shopify.cmd", args, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
  const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) {
    const err = ((r.stderr || "") + out).replace(/\u001b\[[0-9;]*[A-Za-z]/g, "").slice(0, 1500);
    throw new Error(`gql #${n} falló (exit ${r.status}): ${err}`);
  }
  const data = JSON.parse(out.slice(i));
  return data;
}
const log = (o) => { LOG.push(o); console.log(JSON.stringify(o)); };
const userErrs = (label, payload) => {
  const errs = payload?.userErrors || [];
  return errs.map((e) => `${label}: ${(e.field || []).join(".")} ${e.message}${e.code ? " [" + e.code + "]" : ""}`);
};

// ------------------------------------------------------------------ info
function info() {
  const d = gql(`query { shop { name currencyCode ianaTimezone weightUnit unitSystem plan { displayName partnerDevelopment shopifyPlus } shopAddress { countryCodeV2 } }
    shopLocales { locale primary published }
    publications(first: 10) { nodes { id name } }
    productsCount { count } collectionsCount { count } }`);
  log({ wave: "info", ...d });
  return d;
}

// ------------------------------------------------------------------ defs
const DEFS = JSON.parse(rd("import/metafield-definitions.json"));
function defs() {
  const errors = [];
  // 1) metaobjeto size_guide
  const mo = DEFS.metaobject_definitions[0];
  let moId = null;
  const ex = gql(`query { metaobjectDefinitionByType(type: "${mo.type}") { id type } }`);
  moId = ex.metaobjectDefinitionByType?.id || null;
  if (!moId && !DRY) {
    const r = gql(
      `mutation($def: MetaobjectDefinitionCreateInput!) { metaobjectDefinitionCreate(definition: $def) { metaobjectDefinition { id type } userErrors { field message code } } }`,
      {
        def: {
          type: mo.type,
          name: mo.name,
          access: { storefront: "PUBLIC_READ" },
          fieldDefinitions: [
            { key: "image", name: "Imagen", type: "file_reference", validations: [{ name: "file_type_options", value: JSON.stringify(["Image"]) }] },
            { key: "content", name: "Contenido", type: "rich_text_field" },
          ],
        },
      },
      true
    );
    errors.push(...userErrs("metaobject", r.metaobjectDefinitionCreate));
    moId = r.metaobjectDefinitionCreate?.metaobjectDefinition?.id || null;
  }
  log({ wave: "defs", metaobject: mo.type, id: moId ? "ok" : "falta", existed: !!ex.metaobjectDefinitionByType });
  // 2) metafields (el de cliente `custom.wishlist` se crea solo con la app de favoritos: se omite)
  const owner = { product: "PRODUCT", collection: "COLLECTION", customer: "CUSTOMER" };
  for (const d of DEFS.definitions) {
    if (d.owner === "customer") { log({ wave: "defs", skip: `${d.owner}.${d.namespace}.${d.key}`, why: "solo con la app de favoritos (S09)" }); continue; }
    const q = gql(`query { metafieldDefinitions(ownerType: ${owner[d.owner]}, namespace: "${d.namespace}", key: "${d.key}", first: 1) { nodes { id } } }`);
    if (q.metafieldDefinitions.nodes.length) { log({ wave: "defs", def: `${d.owner}.${d.namespace}.${d.key}`, existed: true }); continue; }
    const validations = [];
    if (d.type === "file_reference") validations.push({ name: "file_type_options", value: JSON.stringify([d.file_type === "video" ? "Video" : "Image"]) });
    if (d.type === "metaobject_reference") validations.push({ name: "metaobject_definition_id", value: moId });
    if (DRY) { log({ wave: "defs", dry: `${d.owner}.${d.key}` }); continue; }
    const r = gql(
      `mutation($def: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $def) { createdDefinition { id } userErrors { field message code } } }`,
      { def: { name: d.name, namespace: d.namespace, key: d.key, type: d.type, ownerType: owner[d.owner], access: { storefront: "PUBLIC_READ" }, validations } },
      true
    );
    errors.push(...userErrs(`${d.owner}.${d.key}`, r.metafieldDefinitionCreate));
    log({ wave: "defs", def: `${d.owner}.${d.namespace}.${d.key}`, created: !!r.metafieldDefinitionCreate?.createdDefinition });
  }
  if (errors.length) throw new Error("defs: " + errors.join(" | "));
}

// ------------------------------------------------------------------ collections
const TONES = { "oasis-natural": "moss", "aurora-viva": "linen", "espuma-de-ola": "fog", "salidas-de-bano": "sand" };
const COLLECTIONS = [
  { handle: "oasis-natural", title: "Oasis Natural" },
  { handle: "aurora-viva", title: "Aurora Viva" },
  { handle: "espuma-de-ola", title: "Espuma de Ola" },
  { handle: "salidas-de-bano", title: "Salidas de Baño" },
  { handle: "destacados", title: "Destacados" },
];
function currentSiteDescription(handle) {
  const f = path.join(ROOT, "launch/evidence/current-site", handle + ".html");
  if (!fs.existsSync(f)) return "";
  const m = fs.readFileSync(f, "utf8").match(/<meta name="description" content="([^"]*)"/);
  return m ? m[1].replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"') : "";
}
function collectionId(handle) {
  const q = gql(`query { collectionByIdentifier(identifier: {handle: "${handle}"}) { id title } }`);
  return q.collectionByIdentifier?.id || null;
}
function collections() {
  const errors = [];
  for (const c of COLLECTIONS) {
    const existing = collectionId(c.handle);
    if (existing) { log({ wave: "collections", handle: c.handle, existed: true }); continue; }
    if (DRY) { log({ wave: "collections", dry: c.handle }); continue; }
    const desc = c.handle === "destacados" ? "" : currentSiteDescription(c.handle);
    const input = { title: c.title, handle: c.handle, sortOrder: "MANUAL" };
    if (desc) input.descriptionHtml = `<p>${desc}</p>`;
    if (TONES[c.handle]) input.metafields = [{ namespace: "custom", key: "description_tone", type: "single_line_text_field", value: TONES[c.handle] }];
    const r = gql(`mutation($input: CollectionInput!) { collectionCreate(input: $input) { collection { id handle } userErrors { field message } } }`, { input }, true);
    errors.push(...userErrs(c.handle, r.collectionCreate));
    log({ wave: "collections", handle: c.handle, created: !!r.collectionCreate?.collection });
  }
  if (errors.length) throw new Error("collections: " + errors.join(" | "));
}

// ------------------------------------------------------------------ products
function buildProducts() {
  const rows = table("import/shopify-products-03c.csv");
  const fix = table("import/image-resolution-fix.csv");
  const fixMap = new Map(fix.filter((x) => /^supera/.test(x.reason)).map((x) => [x.source_url, x.imported_url]));
  const byHandle = new Map();
  for (const r of rows) {
    const h = r["URL handle"];
    if (!byHandle.has(h)) byHandle.set(h, { handle: h, rows: [] });
    byHandle.get(h).rows.push(r);
  }
  const colorKey = "Color (product.metafields.custom.color)";
  return [...byHandle.values()].map(({ handle, rows: rs }) => {
    const head = rs.find((r) => r["Title"]);
    const variants = rs.filter((r) => r["SKU"]).map((r) => ({
      optionValues: [{ optionName: r["Option1 name"], name: r["Option1 value"] }],
      sku: r["SKU"],
      price: r["Price"],
      compareAtPrice: r["Compare-at price"] || null,
      inventoryPolicy: r["Continue selling when out of stock"].toUpperCase() === "CONTINUE" ? "CONTINUE" : "DENY",
      inventoryItem: { tracked: false, requiresShipping: r["Requires shipping"] !== "false" },
    }));
    const optName = variants[0].optionValues[0].optionName;
    const files = rs
      .filter((r) => r["Product image URL"])
      .sort((a, b) => Number(a["Image position"]) - Number(b["Image position"]))
      .map((r) => ({ originalSource: fixMap.get(r["Product image URL"]) || r["Product image URL"], alt: r["Image alt text"], contentType: "IMAGE" }));
    return {
      handle,
      input: {
        title: head["Title"],
        handle,
        descriptionHtml: head["Description"],
        vendor: head["Vendor"],
        productType: head["Type"],
        status: "ACTIVE",
        productOptions: [{ name: optName, values: [...new Set(variants.map((v) => v.optionValues[0].name))].map((name) => ({ name })) }],
        variants,
        files,
        metafields: head[colorKey] ? [{ namespace: "custom", key: "color", type: "single_line_text_field", value: head[colorKey] }] : [],
      },
    };
  });
}
function productId(handle) {
  const q = gql(`query { productByIdentifier(identifier: {handle: "${handle}"}) { id } }`);
  return q.productByIdentifier?.id || null;
}
function products() {
  const list = buildProducts();
  const only = ARGS.find((a) => a.startsWith("--only="))?.slice(7);
  const errors = [];
  let created = 0;
  let existed = 0;
  for (const p of list) {
    if (only && p.handle !== only) continue;
    const id = productId(p.handle);
    if (id) { existed++; log({ wave: "products", handle: p.handle, existed: true }); continue; }
    if (DRY) { log({ wave: "products", dry: p.handle, variants: p.input.variants.length, files: p.input.files.length }); continue; }
    const r = gql(
      `mutation($input: ProductSetInput!) { productSet(synchronous: true, input: $input) { product { id handle variants(first: 10) { nodes { sku } } media(first: 20) { nodes { id } } } userErrors { field message code } } }`,
      { input: p.input },
      true
    );
    const e = userErrs(p.handle, r.productSet);
    errors.push(...e);
    const prod = r.productSet?.product;
    if (prod) created++;
    log({ wave: "products", handle: p.handle, created: !!prod, variants: prod?.variants?.nodes?.length, media: prod?.media?.nodes?.length, errors: e.length });
  }
  log({ wave: "products", resumen: { totalEnPaquete: list.length, creados: created, yaExistian: existed } });
  if (errors.length) throw new Error("products: " + errors.slice(0, 8).join(" | "));
}

// ------------------------------------------------------------------ membership
function membership() {
  const ev = JSON.parse(rd("launch/evidence/dev-collections.json")).collections;
  const errors = [];
  for (const c of ev) {
    if (c.h === "frontpage") continue;
    const cid = collectionId(c.h);
    if (!cid) throw new Error(`falta la colección ${c.h}: correr la ola collections`);
    const ids = c.order.map((h) => productId(h));
    const missing = c.order.filter((h, i) => !ids[i]);
    if (missing.length) throw new Error(`${c.h}: productos sin crear: ${missing.join(", ")}`);
    if (!ids.length) { log({ wave: "membership", handle: c.h, products: 0 }); continue; }
    const cur = gql(`query { collection(id: "${cid}") { products(first: 50) { nodes { handle } } } }`).collection.products.nodes.map((n) => n.handle);
    if (JSON.stringify(cur) === JSON.stringify(c.order)) { log({ wave: "membership", handle: c.h, products: cur.length, existed: true, orderOk: true }); continue; }
    if (DRY) { log({ wave: "membership", dry: c.h, want: c.order.length, have: cur.length }); continue; }
    // Se vacía y se reagrega en el orden de la Dev Store (colección manual: el orden de alta es el orden de la colección).
    if (cur.length) {
      const rm = gql(`mutation($id: ID!, $ids: [ID!]!) { collectionRemoveProducts(id: $id, productIds: $ids) { job { id } userErrors { field message } } }`, { id: cid, ids: cur.map((h) => productId(h)) }, true);
      errors.push(...userErrs(c.h + " remove", rm.collectionRemoveProducts));
    }
    const add = gql(`mutation($id: ID!, $ids: [ID!]!) { collectionAddProductsV2(id: $id, productIds: $ids) { job { id } userErrors { field message } } }`, { id: cid, ids }, true);
    errors.push(...userErrs(c.h + " add", add.collectionAddProductsV2));
    log({ wave: "membership", handle: c.h, requested: ids.length });
  }
  if (errors.length) throw new Error("membership: " + errors.join(" | "));
}

// ------------------------------------------------------------------ publish
function publish() {
  const pubs = gql(`query { publications(first: 20) { nodes { id name } } }`).publications.nodes;
  const online = pubs.find((p) => /online store|tienda online/i.test(p.name));
  if (!online) throw new Error("no se encontró el canal Tienda online: " + pubs.map((p) => p.name).join(", "));
  const targets = [];
  for (const p of buildProducts()) targets.push(productId(p.handle));
  for (const c of COLLECTIONS) targets.push(collectionId(c.handle));
  const ids = targets.filter(Boolean);
  if (DRY) { log({ wave: "publish", dry: ids.length }); return; }
  const errors = [];
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const body = chunk.map((id, k) => `p${k}: publishablePublish(id: "${id}", input: [{publicationId: "${online.id}"}]) { userErrors { field message } }`).join("\n");
    const r = gql(`mutation { ${body} }`, {}, true);
    for (const [k, v] of Object.entries(r)) errors.push(...userErrs(k, v).filter((m) => !/already published/i.test(m)));
  }
  log({ wave: "publish", publicados: ids.length, canal: online.name });
  if (errors.length) throw new Error("publish: " + errors.slice(0, 6).join(" | "));
}

// ------------------------------------------------------------------ pages
function pages() {
  const items = [
    { handle: "garantia", title: "Política de garantía", file: "content/legal/garantia.html" },
    { handle: "favoritos", title: "Favoritos", body: "", templateSuffix: "wishlist" },
  ];
  const errors = [];
  for (const p of items) {
    const ex = gql(`query { pages(first: 5, query: "handle:${p.handle}") { nodes { id handle } } }`).pages.nodes.find((n) => n.handle === p.handle);
    if (ex) { log({ wave: "pages", handle: p.handle, existed: true }); continue; }
    if (DRY) { log({ wave: "pages", dry: p.handle }); continue; }
    const body = p.file ? rd(p.file).replace(/\r\n/g, "\n") : p.body;
    const page = { title: p.title, handle: p.handle, body, isPublished: true };
    if (p.templateSuffix) page.templateSuffix = p.templateSuffix;
    const r = gql(`mutation($page: PageCreateInput!) { pageCreate(page: $page) { page { id handle templateSuffix } userErrors { field message code } } }`, { page }, true);
    const e = userErrs(p.handle, r.pageCreate);
    errors.push(...e);
    log({ wave: "pages", handle: p.handle, created: !!r.pageCreate?.page, templateSuffix: r.pageCreate?.page?.templateSuffix ?? null, errors: e });
  }
  if (errors.length) throw new Error("pages: " + errors.join(" | "));
}

// ------------------------------------------------------------------ policies
// Solo la política de reembolso (texto verbatim y completo del sitio actual, sin campos legales pendientes). Las demás quedan sin crear.
function policies() {
  const body = rd("content/legal/devoluciones.html").replace(/\r\n/g, "\n");
  const cur = gql(`query { shop { shopPolicies { id type body } } }`).shop.shopPolicies.find((p) => p.type === "REFUND_POLICY");
  const norm = (s) => String(s || "").replace(/\s+/g, "");
  if (cur && norm(cur.body) === norm(body)) { log({ wave: "policies", refund: "ya idéntica" }); return; }
  if (DRY) { log({ wave: "policies", dry: "refund" }); return; }
  const r = gql(`mutation($p: ShopPolicyInput!) { shopPolicyUpdate(shopPolicy: $p) { shopPolicy { type url } userErrors { field message } } }`, { p: { type: "REFUND_POLICY", body } }, true);
  const e = userErrs("refund", r.shopPolicyUpdate);
  log({ wave: "policies", refund: !!r.shopPolicyUpdate?.shopPolicy, errors: e });
  if (e.length) throw new Error("policies: " + e.join(" | "));
}

// ------------------------------------------------------------------ menus
function menus() {
  const nav = JSON.parse(rd("content/navigation-final-store.json"));
  const existing = gql(`query { menus(first: 20) { nodes { id handle title isDefault } } }`).menus.nodes;
  const errors = [];
  const pageIds = {};
  for (const h of ["garantia", "favoritos"]) {
    const n = gql(`query { pages(first: 5, query: "handle:${h}") { nodes { id handle } } }`).pages.nodes.find((x) => x.handle === h);
    if (n) pageIds[h] = n.id;
  }
  // Las políticas exigen el permiso read_legal_policies: sin él, el ítem «Devoluciones» se omite y se agrega al repetir la ola.
  let refund = null;
  try {
    refund = gql(`query { shop { shopPolicies { id type url } } }`).shop.shopPolicies.find((p) => p.type === "REFUND_POLICY") || null;
  } catch (e) {
    log({ wave: "menus", aviso: "sin permiso de políticas legales: «Devoluciones» se omite por ahora" });
  }
  const itemFor = (it) => {
    let m;
    if (it.url === "/") return { title: it.title, type: "FRONTPAGE", url: "/" };
    if ((m = it.url.match(/^\/collections\/([a-z0-9-]+)$/))) {
      const id = collectionId(m[1]);
      return id ? { title: it.title, type: "COLLECTION", resourceId: id } : null;
    }
    if ((m = it.url.match(/^\/pages\/([a-z0-9-]+)$/))) return pageIds[m[1]] ? { title: it.title, type: "PAGE", resourceId: pageIds[m[1]] } : null;
    if (it.url === "/policies/refund-policy") return refund?.id ? { title: it.title, type: "SHOP_POLICY", resourceId: refund.id } : null;
    return { title: it.title, type: "HTTP", url: it.url };
  };
  for (const menu of nav.menus) {
    const items = menu.items.map(itemFor);
    const skipped = menu.items.filter((_, i) => !items[i]).map((i) => i.title);
    const good = items.filter(Boolean);
    const ex = existing.find((m) => m.handle === menu.handle);
    if (DRY) { log({ wave: "menus", dry: menu.handle, items: good.length, omitidos: skipped }); continue; }
    if (ex) {
      const r = gql(`mutation($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) { menuUpdate(id: $id, title: $title, items: $items) { menu { id handle } userErrors { field message } } }`, { id: ex.id, title: menu.title, items: good }, true);
      errors.push(...userErrs(menu.handle, r.menuUpdate));
      log({ wave: "menus", handle: menu.handle, updated: true, items: good.length, omitidos: skipped });
    } else {
      const r = gql(`mutation($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) { menuCreate(title: $title, handle: $handle, items: $items) { menu { id handle } userErrors { field message } } }`, { title: menu.title, handle: menu.handle, items: good }, true);
      errors.push(...userErrs(menu.handle, r.menuCreate));
      log({ wave: "menus", handle: menu.handle, created: true, items: good.length, omitidos: skipped });
    }
  }
  if (errors.length) throw new Error("menus: " + errors.join(" | "));
}

// ------------------------------------------------------------------ redirects
function redirects() {
  const rows = parseCSV(rd("seo/shopify-redirects-import-final-store.csv")).slice(1);
  const existing = new Set();
  let after = null;
  for (;;) {
    const q = gql(`query($after: String) { urlRedirects(first: 100, after: $after) { nodes { path } pageInfo { hasNextPage endCursor } } }`, { after });
    q.urlRedirects.nodes.forEach((n) => existing.add(n.path));
    if (!q.urlRedirects.pageInfo.hasNextPage) break;
    after = q.urlRedirects.pageInfo.endCursor;
  }
  const todo = rows.filter((r) => !existing.has(r[0]));
  if (DRY) { log({ wave: "redirects", dry: todo.length, existian: existing.size }); return; }
  const errors = [];
  for (let i = 0; i < todo.length; i += 17) {
    const chunk = todo.slice(i, i + 17);
    const body = chunk.map((r, k) => `r${k}: urlRedirectCreate(urlRedirect: {path: ${JSON.stringify(r[0])}, target: ${JSON.stringify(r[1])}}) { userErrors { field message } }`).join("\n");
    const res = gql(`mutation { ${body} }`, {}, true);
    for (const [k, v] of Object.entries(res)) errors.push(...userErrs(chunk[Number(k.slice(1))][0], v));
  }
  log({ wave: "redirects", creadas: todo.length - errors.length, yaExistian: existing.size, totalPaquete: rows.length });
  if (errors.length) throw new Error("redirects: " + errors.slice(0, 6).join(" | "));
}

// ------------------------------------------------------------------ verify (solo lectura)
function verify() {
  const online = gql(`query { publications(first: 20) { nodes { id name } } }`).publications.nodes.find((p) => /online store|tienda online/i.test(p.name));
  const d = gql(`query {
    productsCount { count } collectionsCount { count } productVariantsCount { count }
    urlRedirectsCount { count }
    shop { name currencyCode ianaTimezone plan { displayName partnerDevelopment shopifyPlus } }
    shopLocales { locale primary published }
    menus(first: 20) { nodes { handle title itemsCount: items { title } } }
    products(first: 50) { nodes { handle status vendor productType variantsCount { count } mediaCount { count } collections(first: 5) { nodes { handle } } metafield(namespace: "custom", key: "color") { value } onlineStore: publishedOnPublication(publicationId: "${online.id}") } }
    collections(first: 20) { nodes { handle sortOrder productsCount { count } metafield(namespace: "custom", key: "description_tone") { value } } }
  }`);
  const products = d.products.nodes;
  const media = products.reduce((a, p) => a + p.mediaCount.count, 0);
  const summary = {
    wave: "verify",
    productos: d.productsCount.count,
    variantes: d.productVariantsCount.count,
    imagenes: media,
    coleccionesPorHandle: Object.fromEntries(d.collections.nodes.map((c) => [c.handle, c.productsCount.count])),
    redirecciones: d.urlRedirectsCount.count,
    publicados: products.filter((p) => p.onlineStore).length,
    sinColor: products.filter((p) => !p.metafield?.value).length,
    idiomas: d.shopLocales,
    tienda: d.shop,
    menus: d.menus.nodes.map((m) => ({ handle: m.handle, items: m.itemsCount.length })),
  };
  log(summary);
}

// ------------------------------------------------------------------ parity (solo lectura): tienda final = paquete
function parity() {
  const results = [];
  const check = (id, name, ok, detail = "") => results.push({ id, name, ok, detail });
  const want = buildProducts();
  const online = gql(`query { publications(first: 20) { nodes { id name } } }`).publications.nodes.find((p) => /online store|tienda online/i.test(p.name));
  const got = [];
  let after = null;
  for (;;) {
    const q = gql(
      `query($after: String) { products(first: 20, after: $after) { nodes { handle title vendor productType status
        variants(first: 10) { nodes { sku price compareAtPrice inventoryPolicy selectedOptions { name value } inventoryItem { tracked } } }
        media(first: 20) { nodes { alt mediaContentType } }
        color: metafield(namespace: "custom", key: "color") { value }
        online: publishedOnPublication(publicationId: "${online.id}") } pageInfo { hasNextPage endCursor } } }`,
      { after }
    );
    got.push(...q.products.nodes);
    if (!q.products.pageInfo.hasNextPage) break;
    after = q.products.pageInfo.endCursor;
  }
  const gotBy = new Map(got.map((p) => [p.handle, p]));
  check("Q1", "29 productos, 98 variantes, 95 imágenes", got.length === 29 && got.reduce((a, p) => a + p.variants.nodes.length, 0) === 98 && got.reduce((a, p) => a + p.media.nodes.length, 0) === 95, `${got.length}/${got.reduce((a, p) => a + p.variants.nodes.length, 0)}/${got.reduce((a, p) => a + p.media.nodes.length, 0)}`);
  const bad = [];
  for (const w of want) {
    const g = gotBy.get(w.handle);
    if (!g) { bad.push(`${w.handle}: falta`); continue; }
    const i = w.input;
    if (g.title !== i.title) bad.push(`${w.handle}: título`);
    if (g.vendor !== i.vendor || g.productType !== i.productType) bad.push(`${w.handle}: vendor/tipo`);
    if (g.status !== "ACTIVE" || !g.online) bad.push(`${w.handle}: estado/publicación`);
    if (g.color?.value !== i.metafields[0]?.value) bad.push(`${w.handle}: color`);
    const gv = new Map(g.variants.nodes.map((v) => [v.sku, v]));
    for (const v of i.variants) {
      const x = gv.get(v.sku);
      if (!x) { bad.push(`${w.handle}: falta ${v.sku}`); continue; }
      if (Number(x.price) !== Number(v.price) || Number(x.compareAtPrice) !== Number(v.compareAtPrice)) bad.push(`${v.sku}: precios`);
      if (x.selectedOptions[0]?.value !== v.optionValues[0].name) bad.push(`${v.sku}: talla`);
      if (x.inventoryPolicy !== v.inventoryPolicy || x.inventoryItem.tracked !== false) bad.push(`${v.sku}: inventario`);
    }
    if (g.variants.nodes.length !== i.variants.length) bad.push(`${w.handle}: nº de variantes`);
    if (g.media.nodes.length !== i.files.length) bad.push(`${w.handle}: nº de imágenes ${g.media.nodes.length}/${i.files.length}`);
    if (g.media.nodes.some((m, k) => m.alt !== i.files[k]?.alt)) bad.push(`${w.handle}: alt`);
  }
  check("Q2", "handles, títulos, vendor/tipo, SKU, talla, precio y compare-at, inventario sin seguimiento, alt, color y publicación = paquete", bad.length === 0, bad.slice(0, 6).join("; "));
  // colecciones = Dev Store (conjunto y orden)
  const ev = JSON.parse(rd("launch/evidence/dev-collections.json")).collections.filter((c) => c.h !== "frontpage");
  const cbad = [];
  const counts = {};
  for (const c of ev) {
    const q = gql(`query { collectionByIdentifier(identifier: {handle: "${c.h}"}) { sortOrder title descriptionHtml tone: metafield(namespace: "custom", key: "description_tone") { value } products(first: 50) { nodes { handle } } } }`).collectionByIdentifier;
    if (!q) { cbad.push(`${c.h}: falta`); continue; }
    const hs = q.products.nodes.map((p) => p.handle);
    counts[c.h] = hs.length;
    if (JSON.stringify(hs) !== JSON.stringify(c.order)) cbad.push(`${c.h}: conjunto u orden`);
    if (q.sortOrder !== "MANUAL") cbad.push(`${c.h}: orden no manual`);
    if (TONES[c.h] && q.tone?.value !== TONES[c.h]) cbad.push(`${c.h}: tono`);
    if (TONES[c.h] && currentSiteDescription(c.h) && !q.descriptionHtml.includes(currentSiteDescription(c.h))) cbad.push(`${c.h}: descripción`);
  }
  const fp = gql(`query { collectionByIdentifier(identifier: {handle: "frontpage"}) { products(first: 5) { nodes { handle } } } }`).collectionByIdentifier;
  check("Q3", "colecciones Oasis 10 / Aurora 12 / Espuma 7 / Salidas 0 / Destacados 7 en el orden de la Dev Store, con descripción y tono; «Home page» vacía", cbad.length === 0 && (fp?.products.nodes.length ?? 0) === 0, `${JSON.stringify(counts)} ${cbad.join("; ")} frontpage=${fp?.products.nodes.length}`);
  // metafields y metaobjeto
  const defsNeeded = DEFS.definitions.filter((d) => d.owner !== "customer");
  const dbad = [];
  for (const d of defsNeeded) {
    const q = gql(`query { metafieldDefinitions(ownerType: ${d.owner.toUpperCase()}, namespace: "${d.namespace}", key: "${d.key}", first: 1) { nodes { type { name } access { storefront } } } }`).metafieldDefinitions.nodes[0];
    if (!q) dbad.push(`${d.owner}.${d.key}: falta`);
    else if (q.type.name !== d.type || q.access.storefront !== "PUBLIC_READ") dbad.push(`${d.owner}.${d.key}: tipo o acceso`);
  }
  const mo = gql(`query { metaobjectDefinitionByType(type: "size_guide") { fieldDefinitions { key type { name } } } }`).metaobjectDefinitionByType;
  if (!mo || mo.fieldDefinitions.length !== 2) dbad.push("metaobjeto size_guide");
  check("Q4", `definiciones de metafields (${defsNeeded.length}) y metaobjeto size_guide`, dbad.length === 0, dbad.join("; "));
  // redirecciones
  const wantR = parseCSV(rd("seo/shopify-redirects-import-final-store.csv")).slice(1);
  const haveR = new Map();
  after = null;
  for (;;) {
    const q = gql(`query($after: String) { urlRedirects(first: 100, after: $after) { nodes { path target } pageInfo { hasNextPage endCursor } } }`, { after });
    q.urlRedirects.nodes.forEach((n) => haveR.set(n.path, n.target));
    if (!q.urlRedirects.pageInfo.hasNextPage) break;
    after = q.urlRedirects.pageInfo.endCursor;
  }
  // Shopify guarda el origen en minúsculas ("Redirect from" no distingue mayúsculas; medido en 03F), p. ej. /producto/COSTA-ESMERALDA-AZUL.
  const haveLower = new Map([...haveR].map(([k, v]) => [k.toLowerCase(), v]));
  const rbad = wantR.filter(([f, t]) => haveLower.get(f.toLowerCase()) !== t);
  check("Q5", "51 redirecciones = paquete (origen y destino)", rbad.length === 0 && haveR.size === 51, `${haveR.size} en la tienda; distintas ${rbad.length}`);
  // páginas y menús
  const pg = gql(`query { pages(first: 20) { nodes { handle title isPublished templateSuffix body } } }`).pages.nodes;
  const gar = pg.find((p) => p.handle === "garantia");
  const garOk = gar && gar.isPublished && gar.body.replace(/\s+/g, "") === rd("content/legal/garantia.html").replace(/\s+/g, "");
  const fav = pg.find((p) => p.handle === "favoritos");
  check("Q6", "páginas Garantía (texto idéntico al verbatim) y Favoritos (plantilla wishlist)", !!garOk && !!fav && fav.templateSuffix === "wishlist", `pages=${pg.map((p) => p.handle).join(",")}`);
  const mn = gql(`query { menus(first: 20) { nodes { handle items { title url type } } } }`).menus.nodes;
  const navWant = JSON.parse(rd("content/navigation-final-store.json")).menus;
  const mbad = [];
  for (const m of navWant) {
    const g = mn.find((x) => x.handle === m.handle);
    if (!g) { mbad.push(`${m.handle}: falta`); continue; }
    const have = g.items.map((i) => i.title);
    const wantT = m.items.map((i) => i.title).filter((t) => have.includes(t));
    if (JSON.stringify(have) !== JSON.stringify(wantT)) mbad.push(`${m.handle}: orden`);
    if (m.handle !== "ayuda" && have.length !== m.items.length) mbad.push(`${m.handle}: ítems ${have.length}/${m.items.length}`);
  }
  check("Q7", "menús main-menu (5), comprar (4) y ayuda (parcial hasta que existan las páginas)", mbad.length === 0, mbad.join("; "));
  const sh = gql(`query { shop { currencyCode ianaTimezone weightUnit unitSystem plan { displayName partnerDevelopment shopifyPlus } shopAddress { countryCodeV2 } } shopLocales { locale primary published } }`);
  check("Q8", "COP, America/Bogota, métrico/kg, Colombia, plan de desarrollo sin Plus, es y en publicados", sh.shop.currencyCode === "COP" && sh.shop.ianaTimezone === "America/Bogota" && sh.shop.weightUnit === "KILOGRAMS" && sh.shop.unitSystem === "METRIC_SYSTEM" && sh.shop.shopAddress.countryCodeV2 === "CO" && sh.shop.plan.partnerDevelopment && !sh.shop.plan.shopifyPlus && sh.shopLocales.filter((l) => l.published).length === 2, JSON.stringify(sh.shopLocales));
  for (const r of results) log({ wave: "parity", id: r.id, ok: r.ok, name: r.name, detail: r.ok ? "" : r.detail });
  log({ wave: "parity", resumen: `${results.filter((r) => r.ok).length}/${results.length} PASS` });
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

const WAVES = { info, defs, collections, products, membership, publish, pages, policies, menus, redirects, verify, parity };
if (process.argv[1] && process.argv[1].endsWith("03l-migrate.mjs")) {
  if (!WAVES[WAVE]) { console.error("ola desconocida: " + WAVE + " (" + Object.keys(WAVES).join(", ") + ")"); process.exit(2); }
  try { WAVES[WAVE](); } catch (e) { console.error("ERROR: " + String(e.message).slice(0, 1800)); process.exit(1); }
  fs.rmSync(TMP, { recursive: true, force: true });
}
