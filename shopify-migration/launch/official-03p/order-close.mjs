// Coordinator: after cancel+restock finished, archive (close) the sandbox order and print state.
import { gql } from "file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";
const st = () => gql(`query { orders(first: 3, reverse: true) { nodes { id name test displayFinancialStatus cancelledAt closed } } productVariants(first: 1, query: "sku:LG-ESP-000009-S") { nodes { sku inventoryItem { inventoryLevels(first: 2) { nodes { quantities(names: ["available", "committed", "on_hand"]) { name quantity } } } } } } }`);
let s = st();
const o = s.orders.nodes.find((x) => x.name === "#1001");
console.log("before", JSON.stringify(o), JSON.stringify(s.productVariants.nodes[0].inventoryItem.inventoryLevels.nodes[0].quantities));
if (o.cancelledAt && !o.closed) {
  const r = gql(`mutation($id: ID!) { orderClose(input: {id: $id}) @idempotent(key: "03p-close-1001-20261002") { order { name closed } userErrors { field message } } }`, { id: o.id }, true);
  console.log("close", JSON.stringify(r.orderClose));
}
s = st();
console.log("after", JSON.stringify(s.orders.nodes.find((x) => x.name === "#1001")), JSON.stringify(s.productVariants.nodes[0].inventoryItem.inventoryLevels.nodes[0].quantities));
