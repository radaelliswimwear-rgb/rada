# LANE C — Markets / shop-baseline checklist for the NEW official store

Reference = certified lab `radaelli-swimwear-dev.myshopify.com` (read 2026-10-02 07:40 America/Bogota, read-only). Machine-readable copy: `lab-shipping-structure.json` (`shop`, `markets`, `locations`, `expected_markets`).

## 0. Run order on the fresh store (coordinator)
1. OWNER/UI: store created with Colombian address, currency COP, time zone Bogota, metric/kg (section 2). Active location "Shop location" in Barranquilla (ATL, CO) that fulfils online orders.
2. Auth (owner approves in browser, once): `shopify store auth --store <handle>.myshopify.com --scopes read_shipping,write_shipping,read_locations,read_markets,write_markets,read_products,write_products,read_publications,write_publications,read_inventory,write_inventory` (add `read_draft_orders` only if the optional rate probe in `threshold-plan.md` is wanted; the lab token does not have it).
3. Baseline: `TARGET_STORE=<handle>.myshopify.com node verify-shipping.mjs` (expect shipping FAIL on a fresh store = proves the check bites; shop+markets should already pass).
4. `node apply-shipping.mjs` (dry-run, read-only) -> review the printed `toDelete` / `toCreate` -> `node apply-shipping.mjs --apply --confirm-store=<handle>.myshopify.com`.
5. Markets (section 3) AFTER shipping exists (zone before market: with Colombia primary and no rates every product shows unavailable and `cart/add.js` answers 422 — measured in 03G/03I).
6. `node verify-shipping.mjs` -> `VERDICT: SHIPPING_VERIFIED` (25 checks: 16 shipping + 9 shop/markets).
7. Threshold proof: `threshold-plan.md`.

## 1. Read verification (all read-only; `verify-shipping.mjs` runs exactly this)
```graphql
query {
  shop { currencyCode ianaTimezone weightUnit unitSystem enabledPresentmentCurrencies
         shopAddress { city provinceCode countryCodeV2 } shipsToCountries countriesInShippingZones { countryCodes includeRestOfWorld } }
  locations(first: 20, includeInactive: true) { nodes { id name isActive fulfillsOnlineOrders address { city provinceCode countryCode } } }
  markets(first: 25) { nodes { id name handle status type
      conditions { regionsCondition { applicationLevel regions(first: 50) { nodes { name ... on MarketRegionCountry { code } } } } } } }
}
```
CLI: `shopify.cmd store execute --store <handle>.myshopify.com --query-file markets.graphql --json --no-color --output-file out.json` (Windows: wrap in `cmd /c "..."` if PowerShell prints NativeCommandError noise; the Bash tool here has no coreutils).

Lab values (the target): currency `COP`, `enabledPresentmentCurrencies ["COP"]`, `ianaTimezone America/Bogota` (offset -0500), `weightUnit KILOGRAMS`, `unitSystem METRIC_SYSTEM`, shop address Barranquilla/ATL/CO, `shipsToCountries ["CO"]`, `countriesInShippingZones {["CO"], includeRestOfWorld false}`; markets: `colombia` ACTIVE (REGION, regions [CO], applicationLevel SPECIFIED, `currencySettings null`, 0 catalogs, 0 web presences) and `us` DRAFT (REGION, [US]).

## 2. Shop-level items — OWNER-ONLY / UI-ONLY (no Admin GraphQL mutation exists)
Introspection of the lab's `Mutation` type shows no `shopUpdate`; only `shopLocale*`, `shopPolicyUpdate`, `locationEdit`, `market*`, `deliveryProfile*`. So Claude can only VERIFY these; if one fails, the owner fixes it in the Admin UI:

| Item | Expected | Verify (field) | Fix (owner, UI) |
|---|---|---|---|
| Store currency | COP | `shop.currencyCode`, `enabledPresentmentCurrencies` | Settings > General > Store currency. Locked once the first order exists; normally derived from the country picked at store creation. |
| Time zone | America/Bogota | `shop.ianaTimezone` | Settings > General > Store defaults > Time zone "(GMT-05:00) Bogota" |
| Weight unit / unit system | KILOGRAMS / METRIC_SYSTEM | `shop.weightUnit`, `unitSystem` | Settings > General > Standards and formats |
| Store/billing address country | CO | `shop.shopAddress.countryCodeV2` | Settings > General > Store address / Business entity (legal data, owner only) |
| Store (origin) location | active, CO address, fulfils online orders | `locations` | Settings > Locations > "Shop location". The address is the owner's business data: she supplies it. `locationEdit` (needs `write_locations`) exists but the coordinator should not invent an address. NEVER remove the last location of a delivery group: Shopify then deletes its zones and rates. |
| Primary market = Colombia | Colombia | UI only (the API does not expose "primary") | Settings > Markets. A primary market cannot be set to Draft. |

## 3. Markets — doable through the Admin API (coordinator, needs `write_markets`)
Colombia ACTIVE (only if the read shows it as DRAFT):
```graphql
mutation { marketUpdate(id: "gid://shopify/Market/<COLOMBIA_ID>", input: { status: ACTIVE }) { market { handle status } userErrors { field message code } } }
```
US (or any non-CO market that is ACTIVE) -> DRAFT. This is the exact mutation used in the lab (`lab-market-off.graphql`):
```graphql
mutation { marketUpdate(id: "gid://shopify/Market/<US_ID>", input: { status: DRAFT }) { market { handle status } userErrors { field message code } } }
```
Colombia market missing entirely (not expected on a Colombian store; shape checked by schema introspection only, NOT executed anywhere):
```graphql
mutation { marketCreate(input: { name: "Colombia", handle: "colombia", status: ACTIVE,
  conditions: { regionsCondition: { regions: [{ countryCode: CO }] } } }) { market { id handle status } userErrors { field message code } } }
```
Notes:
- On a store created in Colombia there is probably NO `us` market at all (the lab had one only because the dev store started in the US): then "US DRAFT" = nothing to do. `verify-shipping.mjs` passes `no_ACTIVE_market_outside_CO` as long as no ACTIVE market has a region other than CO (an extra ACTIVE "International"/rest-of-world market would FAIL it -> set it to DRAFT the same way, after the coordinator confirms that is intended).
- Currency per market: the lab's Colombia market has `currencySettings: null` and the only presentment currency is COP; nothing to set. Local currencies / rounding = UI (Markets > Colombia > Currency); leave untouched.
- `marketUpdate` is idempotent (same status = no change). Rollback: set the previous status back with the same mutation (record the `status` read in step 3 before changing it).
- Do not touch languages, domains, web presences or catalogs here (out of scope of lane C).

## 4. Owner-only vs UI-only vs API summary
- OWNER-ONLY (identity/legal/payment): store address & business entity, billing/plan, Wompi/Envia credentials, storefront password, domain. Not in lane C.
- UI-ONLY (no API): currency, time zone, weight unit, primary market, (location creation if no scope).
- API (coordinator, mutations): delivery profile zones/rates (`apply-shipping.mjs`), `marketUpdate` status (Colombia ACTIVE, other markets DRAFT).
- Read-only for everybody: `verify-shipping.mjs`.

## 5. Assumptions / not verifiable from the lab
- A fresh Colombian store ships with default zones (e.g. "Domestic" CO and/or "International" rest-of-world, no custom rates). `apply-shipping.mjs` deletes any zone outside the certified five (listed in the dry-run; `--keep-stale` to skip) because a zone covering all of CO collides with the province zones. The lab did the same (deleted "Colombia" and "Domestic" in the same mutation).
- The default delivery profile already has one location group containing the Barranquilla location; if not, `apply-shipping.mjs` aborts with exit 3 and a message (it does not create location groups: untested path).
- The market API shapes above were validated only by schema introspection and by the lab's own `marketUpdate ... DRAFT` run; `marketCreate` and `marketUpdate ... ACTIVE` were not executed.
