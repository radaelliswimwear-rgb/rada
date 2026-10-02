// Coordinator: close the sandbox order #1001 and restore certified inventory (cancel + restock, no customer notification, no refund call).
import { gql } from "file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";
const q = gql(`query { orders(first: 3, reverse: true) { nodes { id name test displayFinancialStatus cancelledAt closed } } }`);
const o = q.orders.nodes.find((x) => x.name === "#1001");
console.log("order", JSON.stringify(o));
if (!o || !o.test) { console.error("order missing or not test: abort"); process.exit(2); }
if (!o.cancelledAt) {
  const r = gql(
    `mutation($id: ID!) { orderCancel(orderId: $id, reason: OTHER, refund: false, restock: true, notifyCustomer: false, staffNote: "Pedido de prueba sandbox 03P (Wompi test): cancelado con reposicion de inventario") @idempotent(key: "03p-cancel-1001-20261002") { job { id done } orderCancelUserErrors { field message code } } }`,
    { id: o.id }, true);
  console.log("cancel", JSON.stringify(r.orderCancel));
}
