#!/usr/bin/env node
/**
 * LANE C — reversible temporary products for the exact 299,899 vs 299,900 checkout proof (adapted from lab-threshold.mjs). NOT RUN BY THIS LANE.
 *
 *   TARGET_STORE=<handle>.myshopify.com node threshold-proof.mjs plan                       # prints the steps, no network
 *   TARGET_STORE=... node threshold-proof.mjs status                                        # READ-ONLY: lists leftover ZZ-TEST products (must be empty before create and after delete)
 *   TARGET_STORE=... node threshold-proof.mjs create                                        # DRY-RUN (default): prints what would be created
 *   TARGET_STORE=... node threshold-proof.mjs create --apply --confirm-store=<same store>   # creates 2 products (299899, 299900), ACTIVE, untracked, 0.5 kg, published to Online Store
 *   TARGET_STORE=... node threshold-proof.mjs delete --apply --confirm-store=<same store>   # deletes every product with vendor ZZ-TEST and handle zz-test-umbral-* (found by query: survives a lost state file)
 *
 * Needs scopes read_products, write_products, read_publications, write_publications, write_inventory. Idempotent: create refuses if leftovers exist; delete only touches ZZ-TEST/zz-test-umbral-*.
 */
import { guard, argFlag, argValue, requireTargetStore, loadGql } from "./shipping-lib.mjs";

const argv = process.argv.slice(2);
const MODE = argv.find((a) => !a.startsWith("--")) || "plan";
const APPLY = argFlag(argv, "--apply");
const PRICES = [299899, 299900];
const PREFIX = "zz-test-umbral-";
const VENDOR = "ZZ-TEST";
const store = guard(requireTargetStore);

const PLAN = [
  "S0  read: node verify-shipping.mjs PASS; threshold-proof.mjs status -> 0 leftovers; note productsCount/ordersCount baseline; password page still ON.",
  `S1  create ${PRICES.map((p) => PREFIX + p).join(" + ")} (ACTIVE, vendor ${VENDOR}, untracked inventory, requiresShipping, 0.5 kg, only Online Store publication, in NO collection).`,
  "S2  storefront (visitor-password session by the owner/coordinator): add ONE product, cart must contain exactly 1 line; checkout with a dummy address in Atlantico (Barranquilla), dummy @example.com email; STOP at the shipping-method step (never pay).",
  "S3  299899 -> only 'Envio estandar' 9.900 (total 309.799); 299900 -> only 'Envio estandar gratis' (total 299.900). Optional cross-zone: 299899 with San Andres (SAP) -> 44.900; 299900 -> gratis.",
  "S4  empty the cart (/cart/clear) between runs; space storefront requests >= 1.5 s (per-IP 429 seen in the lab).",
  "S5  delete: threshold-proof.mjs delete --apply ...; then status -> 0 leftovers; storefront /products/zz-test-umbral-299899 and -299900 -> 404; productsCount back to baseline; node verify-shipping.mjs still PASS.",
];

if (MODE === "plan") { console.log(PLAN.join("\n")); process.exit(0); }

const { gql } = await loadGql(store);
// authoritative lookup by exact handle (productByIdentifier) + a vendor search as a safety net; union by id.
const F = "id handle title status vendor variants(first: 3) { nodes { id price } }";
const STATUS_Q = `query { ${PRICES.map((p) => `h${p}: productByIdentifier(identifier: { handle: "${PREFIX}${p}" }) { ${F} }`).join(" ")} products(first: 50, query: "vendor:\\"${VENDOR}\\"") { nodes { ${F} } } productsCount { count } }`;
const leftovers = () => {
  const d = gql(STATUS_Q);
  const all = [...PRICES.map((p) => d["h" + p]).filter(Boolean), ...d.products.nodes];
  const items = [...new Map(all.filter((p) => p.vendor === VENDOR && p.handle.startsWith(PREFIX)).map((p) => [p.id, p])).values()];
  return { total: d.productsCount.count, items };
};
const needApply = () => {
  if (!APPLY) return false;
  if (argValue(argv, "--confirm-store") !== store) { console.error(`--apply requires --confirm-store=${store}`); process.exit(2); }
  return true;
};

if (MODE === "status") {
  const l = leftovers();
  console.log(JSON.stringify({ store, productsCount: l.total, leftovers: l.items.map((p) => ({ handle: p.handle, status: p.status, price: p.variants.nodes[0]?.price })) }, null, 2));
  process.exit(0);
}

if (MODE === "create") {
  const l = leftovers();
  if (l.items.length) { console.error("ABORT: leftovers exist: " + l.items.map((p) => p.handle).join(", ") + " (run delete first)"); process.exit(3); }
  const apply = needApply();
  console.log(`[threshold create] store=${store} baseline productsCount=${l.total} mode=${apply ? "APPLY" : "DRY-RUN"}`);
  if (!apply) { console.log(JSON.stringify(PRICES.map((p) => ({ handle: PREFIX + p, price: p, status: "ACTIVE", vendor: VENDOR, tracked: false, requiresShipping: true, weightKg: 0.5, publish: "Online Store only" }))), "\nDRY-RUN only: nothing created."); process.exit(0); }
  const online = gql(`query { publications(first: 20) { nodes { id name } } }`).publications.nodes.find((p) => /online store|tienda online/i.test(p.name));
  if (!online) { console.error("ABORT: Online Store publication not found"); process.exit(3); }
  const out = [];
  for (const price of PRICES) {
    const handle = PREFIX + price;
    const r = gql(`mutation($p: ProductCreateInput!) { productCreate(product: $p) { product { id handle variants(first: 1) { nodes { id } } } userErrors { field message } } }`, { p: { title: `ZZ TEST UMBRAL ${price}`, handle, status: "ACTIVE", vendor: VENDOR, productType: VENDOR, tags: ["zz-test"] } }, true).productCreate;
    if (r.userErrors.length) throw new Error(JSON.stringify(r.userErrors));
    const pid = r.product.id, vid = r.product.variants.nodes[0].id;
    const u = gql(`mutation($pid: ID!, $v: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $pid, variants: $v) { productVariants { id price } userErrors { field message } } }`, { pid, v: [{ id: vid, price: String(price), inventoryItem: { tracked: false, requiresShipping: true, measurement: { weight: { value: 0.5, unit: "KILOGRAMS" } } } }] }, true).productVariantsBulkUpdate;
    if (u.userErrors.length) throw new Error(JSON.stringify(u.userErrors));
    const pub = gql(`mutation($id: ID!, $i: [PublicationInput!]!) { publishablePublish(id: $id, input: $i) { userErrors { field message } } }`, { id: pid, i: [{ publicationId: online.id }] }, true).publishablePublish;
    if (pub.userErrors.length) throw new Error(JSON.stringify(pub.userErrors));
    out.push({ price, handle, pid });
  }
  console.log(JSON.stringify(out));
  process.exit(0);
}

if (MODE === "delete") {
  const l = leftovers();
  const apply = needApply();
  console.log(`[threshold delete] store=${store} found=${l.items.map((p) => p.handle).join(", ") || "none"} mode=${apply ? "APPLY" : "DRY-RUN"}`);
  if (!apply) process.exit(0);
  for (const p of l.items) {
    const r = gql(`mutation($i: ProductDeleteInput!) { productDelete(input: $i) { deletedProductId userErrors { field message } } }`, { i: { id: p.id } }, true).productDelete;
    console.log(p.handle, JSON.stringify(r));
  }
  const after = leftovers();
  console.log(JSON.stringify({ leftoversAfter: after.items.length, productsCount: after.total }));
  process.exit(after.items.length ? 1 : 0);
}

console.error("modes: plan | status | create | delete");
process.exit(2);
