# LANE C — Exact COP 299,899 vs 299,900 checkout proof (plan only; nothing was executed on any store by this lane)

Lab precedent (03P certification, micro-test 3): temp products `zz-test-umbral-299899` / `-299900`, Atlantico address -> **299.899 = "Envío estándar" $9.900 (total $309.799)**, **299.900 = "Envío estándar gratis" (total $299.900)**; products deleted afterwards; parity 8/8 and 98/98 inventory unchanged; no order completed. Script: `threshold-proof.mjs` (adapted from `lab-threshold.mjs`: dry-run default, `--apply --confirm-store=`, finds leftovers by handle + vendor so cleanup works even without a state file; verified read-only against the lab: `status` -> 0 leftovers, `create`/`delete` dry-runs OK, `--apply` without confirm -> exit 2).

## Preconditions
- `node verify-shipping.mjs` = SHIPPING_VERIFIED on the target; Colombia market ACTIVE; Online Store publication exists.
- Store still behind the storefront password (the temp products are ACTIVE + published, so they would be public otherwise). The visitor password is entered by the owner/coordinator's own browser session; never typed or stored by this lane.
- No discount codes / automatic discounts active during the test (whether price conditions use the pre- or post-discount subtotal was not tested).
- Checkout may show no payment method on a store without a gateway; the shipping-method step and order summary are enough. NEVER pay / submit an order.

## Steps
| # | Action | Command / how | Expected |
|---|---|---|---|
| S0 | Baseline | `TARGET_STORE=<h> node threshold-proof.mjs status` ; note `productsCount`; (optional) `ordersCount` | `leftovers: []` |
| S1 | Create 2 temp products | dry-run: `node threshold-proof.mjs create` -> then `node threshold-proof.mjs create --apply --confirm-store=<h>` | prints 2 handles/ids. ACTIVE, vendor `ZZ-TEST`, untracked, requires shipping, 0.5 kg, only Online Store, no collection |
| S2 | Boundary A (299,899) | storefront (password session): open `/products/zz-test-umbral-299899`, add to cart (cart = exactly 1 line, total 299.899); checkout; email `prueba.umbral@example.com`, dummy name, department Atlantico, city Barranquilla (any dummy street). Stop at shipping methods | ONLY "Envío estándar" **$9.900**; total **$309.799** |
| S3 | Empty cart | `/cart/clear` (or remove the line) | cart empty |
| S4 | Boundary B (299,900) | same with `/products/zz-test-umbral-299900` | ONLY "Envío estándar gratis" ($0); total **$299.900** |
| S5 | (optional, 2 more checkouts) other zone | 299.899 with San Andres y Providencia (SAP) -> $44.900; 299.900 -> gratis | proves zone mapping + threshold on the official store |
| S6 | (optional, no temp product) zone sweep with real products | 1 unit of a 199.920 product to ATL / BOL / DC / BOY / SAP -> 9.900 / 12.900 / 17.900 / 21.900 / 44.900; 2 units of a 159.920 product (319.840) -> only "gratis" | same as lab certification |
| S7 | Cleanup | `node threshold-proof.mjs delete` (dry-run) then `node threshold-proof.mjs delete --apply --confirm-store=<h>`; final line must show `"leftoversAfter":0` | exit 0 |
| S8 | Post-checks | `status` -> `[]` and `productsCount` == S0; `/products/zz-test-umbral-299899` and `-299900` -> HTTP 404; `/cart.js` empty; `node verify-shipping.mjs` still PASS; coordinator's catalog parity (29/98/95, inventory 98/98) unchanged | all equal to baseline |

Spacing: the storefront rate-limits per IP (429 "Un momento…" seen in the lab after bursts): wait >= 1.5 s between requests and avoid repeated 422s.

## Cleanup / rollback guarantees
- The test never changes the delivery profile; it only adds and removes 2 products. `productDelete` removes the products, their variants and their untracked inventory items (no stock, no orders reference them, no collections/menus/redirects touched).
- `delete` only acts on products whose vendor is exactly `ZZ-TEST` AND handle starts with `zz-test-umbral-`; a real product can never match.
- If creation fails half-way: `status` lists what exists, `delete --apply` removes it; re-running `create` aborts with exit 3 while leftovers exist (no duplicates).
- Residue that cannot be removed by API: an abandoned-checkout record carrying the dummy `@example.com` email (no real personal data, no order, no customer). If any order or customer was created by mistake, stop and tell the owner; do not delete data.

## Optional zero-footprint API probe (UNTESTED; token scope missing in the lab)
`draftOrderAvailableDeliveryOptions` is a GraphQL *query* that returns the shipping rates the delivery profile yields for a hypothetical order, so the same boundary can be read without creating products. The lab's stored token answered `ACCESS_DENIED ... read_draft_orders` (verified 2026-10-02), so it needs `read_draft_orders` added to the `shopify store auth` scopes. Files ready: `queries/rates-at-subtotal.graphql` and `queries/rates-at-subtotal.vars.json` (set `amount` to 299899 / 299900). Treat it as a supplement: the storefront checkout (S2-S4) remains the authoritative proof.
