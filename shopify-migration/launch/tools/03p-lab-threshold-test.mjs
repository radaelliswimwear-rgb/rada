import fs from "node:fs";
import { gql } from "file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";
const STATE = "C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/lab-threshold-state.json";
const mode = process.argv[2];
if (mode === "create") {
  const online = gql(`query { publications(first: 20) { nodes { id name } } }`).publications.nodes.find((p) => /online store|tienda online/i.test(p.name));
  const out = [];
  for (const price of [299899, 299900]) {
    const handle = `zz-test-umbral-${price}`;
    const r = gql(`mutation($p: ProductCreateInput!) { productCreate(product: $p) { product { id handle variants(first: 1) { nodes { id inventoryItem { id } } } } userErrors { field message } } }`, { p: { title: `ZZ TEST UMBRAL ${price}`, handle, status: "ACTIVE", vendor: "ZZ-TEST", productType: "ZZ-TEST" } }, true).productCreate;
    if (r.userErrors.length) throw new Error(JSON.stringify(r.userErrors));
    const pid = r.product.id, vid = r.product.variants.nodes[0].id;
    const u = gql(`mutation($pid: ID!, $v: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $pid, variants: $v) { productVariants { id price } userErrors { field message } } }`, { pid, v: [{ id: vid, price: String(price), inventoryItem: { tracked: false, requiresShipping: true, measurement: { weight: { value: 0.5, unit: "KILOGRAMS" } } } }] }, true).productVariantsBulkUpdate;
    if (u.userErrors.length) throw new Error(JSON.stringify(u.userErrors));
    const pub = gql(`mutation($id: ID!, $i: [PublicationInput!]!) { publishablePublish(id: $id, input: $i) { userErrors { field message } } }`, { id: pid, i: [{ publicationId: online.id }] }, true).publishablePublish;
    if (pub.userErrors.length) throw new Error(JSON.stringify(pub.userErrors));
    out.push({ price, handle, pid, vid: u.productVariants[0].id });
  }
  fs.writeFileSync(STATE, JSON.stringify(out));
  console.log(JSON.stringify(out));
}
if (mode === "delete") {
  const out = JSON.parse(fs.readFileSync(STATE, "utf8"));
  for (const o of out) {
    const r = gql(`mutation($i: ProductDeleteInput!) { productDelete(input: $i) { deletedProductId userErrors { field message } } }`, { i: { id: o.pid } }, true).productDelete;
    console.log(o.handle, JSON.stringify(r));
  }
}
