# LANE B - Catalog / inventory / collections replica runbook (lab -> NEW official store)

Written 2026-10-02 (Bogota) by Lane B. READ-ONLY analysis: nothing here was executed against any store except read-only queries on the certified lab
`radaelli-swimwear-dev.myshopify.com`. The coordinator owns every write.

Tools dir (`$T`): `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration`
Lane-B helpers (`$L`): `C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/official/laneB`

## 0. Findings that change how you run it (read first)

1. **DANGER - default target = the inactive `launch` store.** `03l-migrate.mjs` does `STORE = process.env.TARGET_STORE || "radaelli-swimwear-colombia-launch-1jeqp0yj.myshopify.com"`,
   and `03m-post-decision.mjs`, `03o-weights.mjs`, `03o-inventory-verify.mjs`, `03o-inventory-sheet.mjs`, every `03p-lab-*.mjs` import that `gql()`. **Every shell must set `TARGET_STORE` first.**
   All Lane-B helpers refuse to start without it and refuse the `launch` slug.
2. **Artifacts-only.** Every wave of `03l-migrate.mjs` reads ONLY local artifacts (`import/*.csv|json`, `launch/evidence/dev-collections.json`, `launch/evidence/current-site/*.html` (collection
   meta descriptions), `content/legal/*.html`, `content/navigation-final-store.json`, `seo/shopify-redirects-import-final-store.csv`). No wave reads the lab at runtime. All files verified present;
   `node launch/tools/03k-catalog-package-check.mjs` = 12/12 PASS offline (0.1 s).
3. **Only runtime-reads-the-store tool = `03o-inventory-sheet.mjs`** (reads `oasis-natural` from TARGET_STORE and OVERWRITES `import/inventory-sheet-03o.csv`). **DO NOT RUN IT.** The sheet is already final:
   98 rows, 128 units (Oasis S2/M3/L1 per product, rest 1, XL kept). Validated offline: `node launch/tools/03m-post-decision.mjs inventory --sheet import/inventory-sheet-03o.csv` -> "Hoja válida: 98 filas, total de unidades 128" (dry, no network).
4. **Images come from Cloudinary URLs** (`productSet.files[].originalSource`, Shopify downloads server-side). No local images, no staged uploads (`images/` has 2 tiny files). 95/95 URLs HEAD = 200 `image/jpeg`
   (checked now: 162.4 MB total, max 7.7 MB, slowest 1.0 s; 43 of them are the `c_limit,w_5000,h_5000,q_95` derivations for the >25 MP photos, 121.7 MB). Script: `$L/head-images.mjs`.
5. **Parity gaps** (the certified `parity` wave is NOT enough on its own): (a) Q8 requires `plan.partnerDevelopment == true` -> on a real/standard official store Q8 reports FAIL by design (judge Q8 by
   currency/timezone/weight/country/locales only); (b) Q1 counts media nodes, not media status -> a FAILED image still counts; (c) nothing empties the automatic **"Home page"** (`frontpage`) collection
   that Shopify may fill with the first created product (03L L10) and Q3 requires it empty; (d) the lab has the search tag `MOSTAZA` on `entero-golden-hour` (documented in
   `catalog/color-search-tag-map.csv`, search_tag_needed=SI) but neither the CSV nor `03l-migrate.mjs` writes any tag. Use `quickcheck.mjs` (media status), `post-products-fixes.mjs` (frontpage + tag),
   and do the lab-vs-new `snapshot.mjs --diff`.
6. **Not reusable as-is for the new store:** `03p-lab-shipping-zones.mjs` hardcodes the LAB delivery profile / locationGroup / zone GIDs (and `03p-lab-threshold-test.mjs` creates temp products). Shipping needs a
   variant that discovers `deliveryProfiles(first:5){nodes{id default profileLocationGroups{locationGroup{id} locationGroupZones{nodes{zone{id name}}}}}}` first (not Lane B).
7. **Fixed idempotency key** in `03m-post-decision.mjs`: `@idempotent(key:"03o-inventory-sheet-v1")`. Fresh store = fine. If the first `inventory --apply` on the new store returns userErrors, do NOT re-run
   with the same key blindly; use `fast-write.mjs --key <new-key>`.

## 1. Session variables (paste once per shell; PowerShell)

```powershell
$NEW = '<NEW-SLUG>.myshopify.com'            # official store domain
$T   = 'C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration'
$L   = 'C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/official/laneB'
$env:TARGET_STORE = $NEW                      # MANDATORY (see 0.1)
$env:NODE_NO_WARNINGS = '1'                   # hides DEP0190 noise from the tools' spawnSync(shell:true)
Set-Location $T
```

## 2. Authorization (the ONLY owner click) + scope proof

```powershell
shopify.cmd store auth --store $NEW --scopes (Get-Content "$L/scopes.txt" -TotalCount 1)   # owner approves in HER browser (expires if not approved ~10 min)
shopify.cmd store execute --store $NEW --query-file "$L/q/scopes.graphql" --json --no-color --output-file "$L/q/scopes.new.json"   # read-only: list granted handles
```
Scope string: see `scopes.txt` line 1 (13 scopes = lab-proven set minus write_orders). `shopify.cmd` global = 4.8.3 (checked).

## 3. Preconditions on the NEW store and how the tools discover them

| # | Precondition | Used by | How discovered / checked | If missing |
|---|---|---|---|---|
| P1 | Store currency **COP** (prices are written as bare numbers, e.g. 199920) | products | NOT checked by any wave; `info`/`verify`/`parity Q8`, `q/preflight.graphql` print `shop.currencyCode` | Fix BEFORE products (owner/Admin): wrong currency = wrong prices |
| P2 | `ianaTimezone America/Bogota`, `weightUnit KILOGRAMS`, `unitSystem METRIC`, `shopAddress.countryCodeV2 CO` | parity Q8 only | `q/preflight.graphql` | Owner/Admin Settings |
| P3 | Sales channel whose name matches `/online store\|tienda online/i` (lab shows "Tienda online"; admin language decides the label) | publish, verify, parity | `publications(first:20){nodes{id name}}` at runtime (id not hardcoded) | wave throws "no se encontro el canal Tienda online" |
| P4 | **Exactly one active location** (lab: "Shop location", Barranquilla, ATL, CO, fulfillsOnlineOrders=true) | `03m inventory --apply` | `locations(first:5)` -> FIRST active one (no name match). `fast-write.mjs` aborts if !=1 active | "sin sucursal activa" / quantities land on the wrong location |
| P5 | Empty catalog: `productsCount = 0`; only auto-collection "Home page" (`frontpage`) allowed; none of the 29 product handles / 5 collection handles / `size_guide` type exist | all create waves | every wave is idempotent per handle (`existed:true` = skipped, NOT updated) | Remove demo/sample products first; a pre-existing wrong product is skipped silently |
| P6 | Metafield definitions BEFORE products/collections (`custom.color`, `description_tone` typed) | products, collections | wave order (defs first) | metafields would be created untyped then pinned later |
| P7 | Locale: lab = `en` primary + `es` published (parity Q8 wants 2 published) | parity Q8 | `shopLocales` | Lane for languages (write_locales granted) |
| P8 | Theme with `templates/page.wishlist.json` pushed BEFORE `pages` if you want `favoritos` -> `templateSuffix wishlist` accepted | pages | parity Q6 / `quickcheck` shows `favoritos:wishlist` | `03p-lab-fix-pages-collections.mjs pages` sets it afterwards (works with TARGET_STORE) |
| P9 | Online token valid with the scopes of `scopes.txt` | all | any call fails with auth error | re-run `shopify store auth` |
| P10 | Cloudinary reachable by Shopify (95 URLs) | products | `node $L/head-images.mjs` (95/95 = 200 today) | media FAILED, see 7 |

## 4. Wave table (order, mode, counts, time)

Measured: **~3.7-4.2 s per `shopify store execute` call** (node + CLI + HTTPS; lab dry-runs: info 4.2 s, defs-dry 31 s/8 calls, collections-dry 18 s/5 calls, products-dry 101 s/29 calls,
membership-dry 202 s/~49 calls). Mutations with media are slower (productSet est. 6-15 s). Estimates below are serial single-process; "parallel" columns in section 5.

| # | Wave / tool | Type | Needs | Calls | Serial est. | Expected result (log lines) |
|---|---|---|---|---|---|---|
| 0 | preflight: `03k-catalog-package-check` + `q/preflight.graphql` | read | auth | 1 | 15 s | 12/12 PASS; COP/Bogota/KG/CO; 1 active location; 0 products |
| 1 | `03l-migrate.mjs defs` | write, **SERIAL, FIRST** | auth | 18 | 75 s | metaobject `size_guide` created; 8 `created:true` (product.color, product.size_guide, collection.cover_image/cover_video/image_pos_x/image_pos_y/zoom/description_tone); 1 skip (customer.wishlist = intentional) |
| 2 | `collections` | write | defs | 10 | 45 s | 5 created (oasis-natural, aurora-viva, espuma-de-ola, salidas-de-bano, destacados), sortOrder MANUAL, description from `current-site/*.html`, `description_tone` moss/linen/fog/sand (destacados none) |
| 3 | `products` (29x `productSet`) | write | defs | 58 | 5-6 min (pool of 4: ~2 min) | 29 `created:true`, `variants` 4/3/.. summing 98, `media` summing 95; summary `{totalEnPaquete:29, creados:29, yaExistian:0}` |
| 3b | `post-products-fixes.mjs --apply` | write (tiny) | products | 2-4 | 15 s | `fix:frontpage products: []` (only mutates if Shopify auto-added one) and `fix:tag needsMOSTAZA:false` (adds tag `MOSTAZA` to entero-golden-hour via `tagsAdd`, as in the lab) |
| 4 | `membership` | write | collections + ALL products | ~49 | 3.5 min | oasis 10 / aurora 12 / espuma 7 / destacados 7 / salidas 0 (`requested:N`), frontpage skipped. Async jobs: wait ~30 s before any re-run |
| 4+5 alt | `$L/fast-collections.mjs both --apply` (optional fast path: same mutations, ids via 2 bulk queries; lab dry = 13.7 s vs 202 s + 220 s for the certified dry-runs) | write | products + collections | ~14 | ~1 min | `membership: <handle> requested:N errors:[]` for oasis/aurora/espuma/destacados (10/12/7/7), `publish: hecho publicados:34` |
| 5 | `publish` | write | products + collections | ~39 | 2.5 min | `{publicados:34, canal:"Online Store"/"Tienda online"}` (29 products + 5 collections) |
| 6 | `pages` | write | none (theme for wishlist template, P8) | 12 | 50 s | 6 created: garantia, favoritos (templateSuffix wishlist), privacidad, terminos, envios, cookies |
| 7 | `policies` | write | none | 8 | 35 s | refund created/identical; privacy, terms, shipping `true`. **RISK:** privacy may return userErrors while Shopify's "Usar politica automatizada" is ON (03O had to switch it OFF in Admin) |
| 8 | `menus` | write | collections + pages + policies (refund) | ~20 | 80 s | main-menu 5, comprar 4, ayuda 6, `omitidos:[]` (if non-empty: re-run after pages/policies exist; `menuUpdate` is idempotent) |
| 9 | `redirects` | write | none | 4 | 20 s | `{creadas:51, yaExistian:0, totalPaquete:51}` |
| 10 | weights: `03o-weights.mjs apply --grams 500 --yes` | write | products | ~33 | 2 min | `{actualizadas:98, erroresDeUsuario:0}`; `status` -> `{"500":98}` |
| 11 | inventory: `03m-post-decision.mjs inventory --sheet import/inventory-sheet-03o.csv --apply` | write, **SERIAL** | products + location (+ weights done) | 101 (98 x `inventoryItemUpdate` + 1 `inventorySetQuantities`) | 6.5-7 min | `{"userErrors":[]}`; then `03o-inventory-verify` -> `{variantes:98, conSeguimiento:98, coincidenConLaHoja:98, unidadesTotales:128, discrepancias:[]}` exit 0 |
| 10+11 alt | `$L/fast-write.mjs --apply` (optional fast path, same mutations, pool) | write | products | 3 reads + 29 + 1 + 3 | ~1.5-2 min | `verify:{variants:98, tracked:98, units:128, discrepancies:[]}` |
| 12 | verify: `quickcheck.mjs`, `03l-migrate.mjs parity`, `03o-inventory-verify.mjs`, `snapshot.mjs` + `--diff` | read, parallel-safe | all | 1 / 22 / 1 / ~25 | 8 s / 90 s / 5 s / 80 s | see section 6 |

Total with the certified tools strictly serial: ~27-30 min (~400 calls). With the parallel plan below and the optional fast paths: **~8-10 min after auth**; with parallel but certified-only tools: ~12-14 min.

## 5. Execution plan (serial gates vs parallel groups)

Independent processes are safe to run concurrently (read-only dry runs and snapshots already ran 2-3 CLI processes at once on the lab with no session/lock problem; `par-test.mjs` ran 1/3/6/9 concurrent
queries: all OK). **Measured scaling on this 6-core PC** (every `shopify store execute` is CPU-heavy node start-up): 1 process 4.5 s/call -> 3 concurrent 7.7 s wall (0.39 calls/s) -> 6 concurrent 9.4 s (0.64 calls/s)
-> 9 concurrent 11.5 s (0.78 calls/s). **Keep <= 6 CLI processes alive at once** (the browser/other lanes also need CPU); beyond that per-call latency just inflates. Admin GraphQL cost is not the limit:
~0.6 calls/s ~= 10-30 points/s (mutations ~10 pts each; standard bucket 1000, restore 50-100/s). A `THROTTLED`/429 aborts only that wave with exit 1 -> re-run it (idempotent).

```
T+0   GATE G0  auth done + preflight OK (P1-P5)
T+0   GROUP P0 (parallel)  ->  [A] defs      [B] pages      [C] policies      [D] redirects
T+80s GATE G1  defs exit 0  (pages/policies/redirects may still run)
T+80s GROUP P1 (parallel)  ->  [E] collections      [F] products-pool.mjs --pool 4 --apply
T+~3m GATE G2  collections exit 0 AND products exit 0 AND quickcheck shows 29/98/95  -> run post-products-fixes (3b)
T+~3m GROUP P2 (parallel, <= 6 processes) -> [G] fast-collections.mjs both --apply (= membership+publish; certified: membership + publish = 2 processes)   [I] menus (needs B+C done)
                                              [J] fast-write.mjs --pool 3 --apply   (certified alternative: serial 03o-weights then 03m inventory)
T+~6m GATE G3  all exit 0   (certified-only P2 would end ~T+9-10m: membership 49 calls is the critical path)
T+~6m GROUP P3 (parallel, read-only) -> quickcheck, parity, inventory-verify, snapshot (+ diff vs lab), media-status wait loop
```
MUST be serialized: defs before collections/products; products before membership/publish/weights/inventory; collections+pages+policies before menus; weights and inventory writes never in two
processes on the same inventory items (use `fast-write.mjs` OR the two certified tools one after the other, not both); post-products-fixes after products. Everything in a group is independent.

### Commands (one per process)

```powershell
# G0
node launch/tools/03k-catalog-package-check.mjs
shopify.cmd store execute --store $NEW --query-file "$L/q/preflight.graphql" --json --no-color --output-file "$L/q/preflight.new.json"
# P0
node launch/tools/03l-migrate.mjs defs
node launch/tools/03l-migrate.mjs pages
node launch/tools/03l-migrate.mjs policies
node launch/tools/03l-migrate.mjs redirects
# P1  (after defs OK)
node launch/tools/03l-migrate.mjs collections
node "$L/products-pool.mjs" --pool 4 --apply        # plan only without --apply; or serial: node launch/tools/03l-migrate.mjs products
# G2
node "$L/quickcheck.mjs"                            # products 29, variants 98, images 95, mediaStatus READY 95 (may need 1-3 min for READY)
node "$L/post-products-fixes.mjs"; node "$L/post-products-fixes.mjs" --apply   # dry first: shows frontpage products + whether MOSTAZA tag is missing
# P2
node "$L/fast-collections.mjs" both                 # DRY first: membership want/have per collection, publish pendientes n=34
node "$L/fast-collections.mjs" both --apply
#   certified alternative (2 processes, ~6 min): node launch/tools/03l-migrate.mjs membership   |   node launch/tools/03l-migrate.mjs publish
node launch/tools/03l-migrate.mjs menus
node "$L/fast-write.mjs" --pool 3                   # DRY first: prints toTrackOrWeigh 98, quantitiesToSet 98, sheetUnits 128
node "$L/fast-write.mjs" --pool 3 --apply
#   certified alternative (serial, ~9 min):
#   node launch/tools/03o-weights.mjs apply --grams 500 --yes ; node launch/tools/03m-post-decision.mjs inventory --sheet import/inventory-sheet-03o.csv --apply
# P3
node "$L/quickcheck.mjs"
node launch/tools/03l-migrate.mjs parity
node launch/tools/03o-inventory-verify.mjs
node "$L/snapshot.mjs" "$L/snapshot-new.json" ; node "$L/snapshot.mjs" --diff "$L/snapshot-lab.json" "$L/snapshot-new.json"
```
Dry mode of any certified wave: append `--dry` (reads only; guarded before every mutation in all waves - reviewed line by line).

## 6. Verification after each wave (fast = `quickcheck.mjs`, 6-8 s, 1 call)

| After | Fast check | Exact expectation |
|---|---|---|
| defs | `node launch/tools/03l-migrate.mjs defs --dry` (31 s) | 1 metaobject line `existed:true` + 8 `existed:true` + 1 skip |
| collections | `quickcheck` `collectionsManual` | oasis-natural, aurora-viva, espuma-de-ola, salidas-de-bano, destacados (frontpage stays MOST_RELEVANT/empty) |
| products | `quickcheck` | `products:29, active:29, variants:98, images:95, mediaStatus:{READY:95}` |
| membership | `quickcheck` `collections` | `{oasis-natural:10, aurora-viva:12, espuma-de-ola:7, salidas-de-bano:0, destacados:7, frontpage:0}` (order is checked by parity Q3 / snapshot) |
| publish | `parity` Q2 or snapshot `products[].onlineStore` / `collections[].onlineStore` | 29 + 5 true |
| pages / policies | `quickcheck` `pages`, `policies` | garantia, favoritos:wishlist, privacidad, terminos, envios, cookies; REFUND, PRIVACY, TERMS_OF_SERVICE, SHIPPING_POLICY |
| menus | `quickcheck` `menus` | main-menu 5, comprar 4, ayuda 6 |
| redirects | `quickcheck` `redirects` | 51 |
| weights | `node launch/tools/03o-weights.mjs status` or `quickcheck.weight500g` | `{"variantes":98,"porPesoEnGramos":{"500":98}}` |
| inventory | `node launch/tools/03o-inventory-verify.mjs` (exit 0) | 98/98 tracked, 98 match, 128 units, 0 discrepancies |
| EVERYTHING | `node launch/tools/03l-migrate.mjs parity` | Q1..Q7 PASS (Q8 FAILS only on `partnerDevelopment` for a non-development plan: expected) |
| EXACT REPLICA | `snapshot.mjs --diff snapshot-lab.json snapshot-new.json` | SAME for products, mediaStatus, inventory, collections, definitions, redirects, policies, menus. Expected DIFF: `shop`/`locations` only if the official store differs in locale/address; `pages` (lab also has default `contact`/`data-sharing-opt-out`; lab `garantia` template "page" vs none); `markets`/`shipping` until their lanes finish; `products` shows `entero-golden-hour` tags until `post-products-fixes --apply` ran |

`snapshot-lab.json` was produced now from the lab (29 products / 98 variants / 95 images READY / 128 units / 6 collections / 51 redirects / 4 policies / markets Colombia ACTIVE + US DRAFT / 5 shipping zones).

## 7. Rate-limit and failure risks

- **No Admin API rate-limit risk when serial** (3.7 s/call = ~0.3 calls/s). The real cost is CLI start-up per call. Parallel plan peaks ~2 calls/s: still low; a throttle shows as exit 1 in one wave -> re-run (all waves skip what exists; `membership` rebuilds the order; `publish` ignores "already published").
- **Media**: productSet returns before images are processed. 95 images / 162 MB are fetched from Cloudinary asynchronously (est. 1-3 min after the last product). `parity Q1` would count a FAILED image, so require `quickcheck.mediaStatus == {READY:95}`. If a product has a FAILED/missing image the wave will NOT redo it (product exists -> skipped): delete that product in Admin/API and re-run `products --only=<handle>`.
- **Image idempotency is per product, not per image** (no per-image upsert). Re-running `products` never duplicates (handle lookup), and never repairs.
- **Products wave partial failure**: a `userErrors` on one product aborts only that handle's process in the pool (pool retries once); the serial tool throws at the end with the first 8 errors.
- **Collections membership race**: `collectionAddProductsV2` is an async job; do not re-run `membership` within ~30 s (it removes all then adds again).
- **Inventory**: 98 sequential `inventoryItemUpdate` calls are the slowest step (~6.5 min). `inventorySetQuantities` uses `changeFromQuantity:null` + fixed `@idempotent` key (see 0.7). Item must be stocked at the single active location (true for 1-location stores; same as 03O on launch).
- **Policies**: privacy automated-policy toggle may block the write (needs an Admin click by the owner/coordinator, then re-run `policies`).
- **Auth**: online token expires; owner must approve within the CLI wait window; a second click is needed if a scope is missing (use the string in `scopes.txt`).
- **Storefront 429 "Verifying your connection"** (seen in 03I) affects storefront fetches, not Admin GraphQL; do not run storefront smoke tests while waves run.
- **Cloudinary dependency**: if the `lago/products` assets are removed or the derived `c_limit` URLs are purged, media fails. Re-check with `node $L/head-images.mjs` right before the products wave.

## 8. Read-only evidence collected for this runbook (lab only)

- `dryrun/` logs + `dryrun/timings.csv`: certified waves run with `--dry` / read-only against the lab: all report `existed:true` (defs 8+1, collections 5, products 29, membership orderOk on the 4 non-empty collections,
  pages 6, policies 4 "ya identica", menus 5/4/6 with `omitidos:[]`, publish 34 targets resolved). **`parity` = 8/8 PASS on the lab, `03o-inventory-verify` = 98/98 tracked, 98 match the sheet, 128 units, `03o-weights status` = {500:98}:**
  i.e. the artifacts + sheet + tools describe exactly the certified lab state. Timings (lab, with 2-3 concurrent readers): info 4 s, defs-dry 31 s, collections-dry 18 s, products-dry 101 s, membership-dry 202 s, publish-dry 220 s,
  pages-dry 25 s, policies-dry 14 s, menus-dry 60 s, redirects-dry 4 s, verify 7 s, parity 76 s, weights-status 7 s, inventory-verify 4 s.
- Quirk: `redirects --dry` on the finished lab reports `dry:1, existian:51` - the one package path with upper case (`/producto/COSTA-ESMERALDA-AZUL`) is stored lower-cased by Shopify, so the wave would try to create it again
  (userErrors -> exit 1) if you re-run `redirects` after it finished. Do not re-run it blindly; parity Q5 lower-cases both sides and is the right check.
- `snapshot-lab.json` (normalized lab snapshot), `q/preflight.lab.json`, `q/scopes.graphql` (+ lab result).
- Lab token scopes: 27 handles (see `scopes.txt`).

## 9. Files in `$L` (all read-only to Shopify unless marked)

| File | Purpose | Writes? |
|---|---|---|
| `scopes.txt` | line 1 = exact `--scopes` string; comments = justification, optional add-ons | - |
| `q/scopes.graphql`, `q/preflight.graphql` | one-call scope proof / store preflight (shop, locales, location, channels, counts, markets) | read |
| `snapshot.mjs` (+ `snapshot-lab.json`) | normalized, id-free, PII-free store snapshot; `--diff lab new` proves exact replica | read |
| `quickcheck.mjs` | 1-call post-wave counts incl. media status, tracked, weights, pages, menus | read |
| `head-images.mjs` | HEAD-checks the 95 Cloudinary URLs actually sent to Shopify | read (3rd party) |
| `par-test.mjs` | concurrency sizing (done; results in section 5) | read |
| `products-pool.mjs` | plan/run the certified `products --only=<handle>` x29 with a pool | **--apply only** |
| `post-products-fixes.mjs` | empties `frontpage`, adds tag `MOSTAZA` to entero-golden-hour | **--apply only** |
| `fast-collections.mjs` | fast `membership` + `publish` (same mutations) | **--apply only** |
| `fast-write.mjs` | fast weights(500 g) + tracked + quantities from the sheet (same mutations) | **--apply only** |
| `run-dryruns-lab.ps1`, `dryrun/` | the lab dry-run harness and its logs | read |

All "write" helpers default to DRY, refuse a missing `TARGET_STORE` and refuse the `launch` slug. Their dry modes were exercised against the lab (0 changes planned = lab already equals the target state).
Their `--apply` paths were NOT executed anywhere (Lane B is read-only); mutation bodies are copies of the certified tools' mutations, and every result is re-checked by `quickcheck`, `parity`, `inventory-verify` and `snapshot --diff`.
