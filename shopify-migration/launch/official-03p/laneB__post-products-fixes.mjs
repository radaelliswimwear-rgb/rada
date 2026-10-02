#!/usr/bin/env node
// LANE B - two lab-state items the certified 03l tool does NOT reproduce. DEFAULT = DRY (reads only). --apply writes.
//   (1) empties the automatic "Home page" collection (handle frontpage) if Shopify auto-added a product to it (finding L10 of 03C/03L; parity Q3 needs 0).
//   (2) search tag MOSTAZA on entero-golden-hour (catalog/color-search-tag-map.csv: the ONLY product whose title lacks its color; lab has exactly this tag; CSV import and 03l write no tags).
//   $env:TARGET_STORE='<new>.myshopify.com'; node post-products-fixes.mjs [--apply]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const STORE = process.env.TARGET_STORE;
if (!STORE || /colombia-launch/.test(STORE)) { console.error("TARGET_STORE obligatorio y distinto de 'launch'"); process.exit(2); }
const APPLY = process.argv.includes("--apply");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "laneb-fix-"));
let n = 0;
function gql(query, variables = {}, mutation = false) {
  n++; const qf = path.join(TMP, `q${n}.graphql`), vf = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(qf, query); fs.writeFileSync(vf, JSON.stringify(variables));
  const args = ["store", "execute", "--store", STORE, "--query-file", qf, "--variable-file", vf, "--json", "--no-color"];
  if (mutation) args.push("--allow-mutations");
  const r = spawnSync("shopify.cmd", args, { encoding: "utf8", shell: true, env: { ...process.env, NODE_NO_WARNINGS: "1" }, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error(`gql falló (exit ${r.status}): ${((r.stderr || "") + out).slice(0, 600)}`);
  return JSON.parse(out.slice(i));
}
let bad = 0;
// (1) frontpage
const c = gql(`query { collectionByIdentifier(identifier: {handle: "frontpage"}) { id title products(first: 50) { nodes { id handle } } } }`).collectionByIdentifier;
if (!c) console.log(JSON.stringify({ fix: "frontpage", state: "no existe (nada que vaciar)" }));
else {
  const ids = c.products.nodes.map((p) => p.id);
  console.log(JSON.stringify({ fix: "frontpage", products: c.products.nodes.map((p) => p.handle), apply: APPLY }));
  if (ids.length && APPLY) {
    const r = gql(`mutation($id: ID!, $ids: [ID!]!) { collectionRemoveProducts(id: $id, productIds: $ids) { job { id } userErrors { field message } } }`, { id: c.id, ids }, true).collectionRemoveProducts;
    console.log(JSON.stringify({ fix: "frontpage", result: r })); if (r.userErrors.length) bad++;
  }
}
// (2) tag MOSTAZA
const p = gql(`query { productByIdentifier(identifier: {handle: "entero-golden-hour"}) { id tags } }`).productByIdentifier;
if (!p) { console.log(JSON.stringify({ fix: "tag", state: "entero-golden-hour no existe todavía" })); bad++; }
else {
  const has = p.tags.includes("MOSTAZA");
  console.log(JSON.stringify({ fix: "tag", handle: "entero-golden-hour", tags: p.tags, needsMOSTAZA: !has, apply: APPLY }));
  if (!has && APPLY) {
    const r = gql(`mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }`, { id: p.id, tags: ["MOSTAZA"] }, true).tagsAdd;
    console.log(JSON.stringify({ fix: "tag", result: r })); if (r.userErrors.length) bad++;
  }
}
process.exit(bad ? 1 : 0);
