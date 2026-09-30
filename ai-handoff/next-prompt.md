# NEXT PROMPT

STATUS: OWNER_ACTION_REQUIRED_03L
PHASE: 03L — COLOMBIA CLIENT TRANSFER STORE BOOTSTRAP + DETERMINISTIC MIGRATION
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03K remains the last completed phase. 03L is NOT complete.

VERIFIED BLOCKER
The store `radaelli-swimwear-colombia` created by the owner is NOT a Client Transfer Store. It is a Dev Store (`type=dev`) and the Dev Dashboard filter `type=client_transfer` returns zero stores. Its current General settings also show United States/USD context. Do NOT migrate RC1.10, catalog, collections, content, redirects, metafields, or any other launch artifacts into this store.

OWNER ACTION REQUIRED — ONE ACTION ONLY
Daniela must create the correct store from SHOPIFY DEV DASHBOARD, not from the normal Shopify Admin store switcher:
1. Dev Dashboard → Stores.
2. Create store.
3. Choose `Client transfer store` / `Para transferir a clientes` explicitly.
4. Name: `Radaelli Swimwear Colombia Launch` or another clear unused name.
5. Country/region: Colombia.
6. No Shopify Plus unless explicitly intended.
7. No transfer yet.

Do not use the normal Admin `Crear tienda` flow because that created another Dev Store.
Do not delete either existing Dev Store yet.

AFTER OWNER CREATES IT
Immediately verify, read-only first:
- Dev Dashboard type = Client transfer store / Para transferir a clientes;
- Dev Dashboard filter `type=client_transfer` shows the new store;
- country/region = Colombia;
- no paid commitment/transfer performed;
- no real payment provider active.

If and only if those checks pass, continue the existing 03L migration plan autonomously:
- Colombia/COP/Bogota/Spanish baseline;
- RC1.10 unpublished and remote parity 98/98;
- catalog 29 products / 98 variants / 95 images;
- collections Oasis 10 / Aurora 12 / Espuma 7 / Salidas 0 / Destacados 7 where applicable;
- required metafields/metaobjects;
- safe sourced pages/navigation;
- redirects 51/51;
- targeted Home/PDP/Collection/Search/Cart QA at 320/390/768/1440;
- backup branch update after secret scan.

Do not ask Daniela routine questions after the correct Client Transfer Store exists. Continue until migration/parity is complete or Shopify forces a true owner-only/auth/legal/billing/irreversible checkpoint.

When 03L is actually complete, then and only then send `HANDOFF READY 03L` and update ai-handoff status to READY_FOR_CHATGPT_REVIEW.
