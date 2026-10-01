import { gql } from "file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";
const q = gql(`query { productVariants(first: 1, query: "sku:LG-ESP-000005-S") { nodes { sku inventoryItem { id inventoryLevels(first: 3) { nodes { location { id } quantities(names: ["available"]) { name quantity } } } } } } }`).productVariants.nodes[0];
const lvl = q.inventoryItem.inventoryLevels.nodes[0];
console.log(q.sku, JSON.stringify(lvl.quantities));
const cur = lvl.quantities[0].quantity;
if (cur === 0) {
  const r = gql(`mutation($i: InventoryAdjustQuantitiesInput!) { inventoryAdjustQuantities(input: $i) @idempotent(key: "lab-restore-esp5s-20261001") { inventoryAdjustmentGroup { reason } userErrors { field message } } }`, { i: { reason: "correction", name: "available", changes: [{ inventoryItemId: q.inventoryItem.id, locationId: lvl.location.id, delta: 1, changeFromQuantity: 0 }] } }, true);
  console.log(JSON.stringify(r.inventoryAdjustQuantities));
}
