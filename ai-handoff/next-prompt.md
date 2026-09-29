# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03C

PHASE: 03C — REAL CATALOG IMPORT + COLLECTIONS + METAFIELDS + DATA QA
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 03C — CATÁLOGO REAL EN DEVELOPMENT STORE

==================================================
AUTONOMY — HIGHEST PRIORITY
==================================================

Daniela is away until approximately 13:00 Colombia time.

DO NOT ask Daniela to perform routine Shopify work.

Claude must execute every legitimate action it can using:
- Shopify CLI;
- authenticated Shopify Admin/browser;
- official Shopify tooling/APIs available in-session;
- existing catalog exports and migration artifacts;
- local worktree/harness.

If an owner-only step appears:
- record DEFERRED_OWNER_ONLY_BLOCKER;
- do not wait;
- do not ask Daniela before 13:00;
- continue every independent safe task.

A blocked subtask is NOT a blocked phase.

At phase end use the finite handoff checks:
+1 min → +2 min → +5 min.

==================================================
03B — REVIEWED AND APPROVED
==================================================

03B completed successfully enough to proceed with catalog.

Confirmed:
- Storefront default locale: Spanish.
- English remains at /en.
- Store currency: COP.
- Market Colombia active; fallback region Colombia.
- Timezone: America/Bogota.
- Metric / kg.
- theme support email: info@radaelliswimwear.com.
- password page implemented and accepted by Shopify.
- Favorites page created.
- Favorites temporary view workaround works with ?view=wishlist.
- New Customer Accounts enabled.
- Customer login-code test is DEFERRED_OWNER_ONLY_BLOCKER.
- Horizon remains live.
- Radaelli RC1 remains unpublished.
- Current theme content = RC1.2.
- RC1.2 SHA-256:
  00f008b97c8e9097c88079863e565f93a429eb3ffe0485a7a329590263f7c86f
- Theme Check 0/0.
- Products: 0.
- No custom/wishlist app.
- Translate & Adapt is installed, official Shopify app.
- No Production/Staging/main changes.

03C does NOT depend on the deferred login-code test.

==================================================
OBJECTIVE
==================================================

Import the REAL Radaelli Swimwear catalog into the Development Store and validate it end-to-end against the source-of-truth artifacts.

Target baseline:
- 29 real products
- 98 variants/talla rows
- 95 real product image URLs
- Oasis Natural: 10 products
- Aurora Viva: 12
- Espuma de Ola: 7
- Salidas de Baño: 0

Target collections:
- Oasis Natural
- Aurora Viva
- Espuma de Ola
- Salidas de Baño

Do NOT migrate as target collections:
- Accesorios
- Hombre
- Mujer
- Niños
- Calzado

This is a DEV STORE only.
No production publish.

==================================================
1. SOURCE OF TRUTH — MANDATORY
==================================================

Before importing anything, inspect and reconcile:

shopify-migration/catalog/Radaelli_Catalogo_Master.xlsx
shopify-migration/catalog/products-master.csv
shopify-migration/catalog/variants-master.csv
shopify-migration/catalog/images-manifest.csv
shopify-migration/catalog/collections-master.csv
shopify-migration/catalog/current-url-inventory.csv
shopify-migration/catalog/catalog-snapshot.json

Also read relevant reports from:
- Phase 01
- Phase 02 architecture
- 02F Product Card
- 02G Collection
- 02H PDP
- 02J Search
- 02M release report
- 03A / 03B reports

Do NOT reconstruct catalog from memory if source files exist.

Generate a pre-import validation report:
- product count
- variant count
- image count
- unique handles
- unique SKUs where expected
- price types
- missing price
- missing image
- missing variant
- collection membership
- duplicate handles/SKUs
- malformed URLs
- inconsistent color values
- current URLs

If source files disagree:
- determine which Phase 01 artifact is authoritative;
- document discrepancy;
- do not invent missing commercial data.

==================================================
2. KNOWN ANOMALIES — PRESERVE TRACEABILITY
==================================================

Known Phase 01 anomalies:

A. Uppercase slug:
COSTA-ESMERALDA-AZUL

B. Two historic azul-marino slugs whose real product color is NEGRO.

C. Three legacy SKUs prefixed LG-HOM- that now belong to Aurora Viva.

RULES:
- Handle/URL preservation has SEO priority.
- Do NOT rename a current valid public handle merely because its historic text is imperfect.
- Correct taxonomy/color through metadata, not silent URL mutation.
- If Shopify normalizes a handle (for example uppercase to lowercase), record exact source → Shopify mapping for later redirect.
- Legacy SKUs remain unchanged unless Shopify technically rejects them.
- Never "clean up" SKUs for aesthetics.

Create:
shopify-migration/catalog/shopify-handle-mapping.csv

Columns:
source_url
source_handle
shopify_handle
product_title
redirect_needed
reason

==================================================
3. IMPORT METHOD
==================================================

Choose the most official, deterministic and repeatable method.

Preferred order:
1. Shopify-supported CSV import if it preserves required product/variant/image structure cleanly.
2. Official authenticated Admin/API tooling if already legitimately available.
3. Authenticated Admin UI automation.

Do NOT create a custom app solely to import catalog in 03C.

Do NOT use unofficial/private Shopify endpoints.

Create reproducible import artifacts under:
shopify-migration/import/

At minimum:
- Shopify-ready product import CSV if CSV is used;
- mapping files;
- import README;
- checksums.

Do not include secrets.

==================================================
4. PRODUCTS
==================================================

Import exactly the 29 target products.

Preserve from source when available:
- title
- handle
- description
- vendor/brand
- product type/category only if source supports it
- price
- compare-at price
- variant option names
- talla values
- SKU
- images and order
- alt text if source exists
- existing SEO fields if source exists

Do NOT invent:
- reviews
- descriptions
- features
- materials not present in source
- compare-at values
- discounts
- weights
- barcodes
- cost per item

Vendor may be normalized to:
Radaelli Swimwear
ONLY if source/current site clearly identifies brand and Shopify requires/benefits from vendor.

==================================================
5. VARIANTS
==================================================

Target:
98 variant/talla rows.

Reconcile all variant values.

Rules:
- preserve size nomenclature exactly unless Shopify rejects invalid syntax;
- no XS/XL resurrection if catalog source removed them;
- do not create missing sizes;
- do not invent color as a variant option if current product model treats color as separate product/metafield;
- SKU exact preservation;
- price exact source value;
- compare-at only from source;
- product availability must not imply real production inventory if inventory snapshot is unavailable.

==================================================
6. INVENTORY — DO NOT INVENT COMMERCIAL STOCK
==================================================

Determine whether Phase 01 source contains an authoritative inventory quantity snapshot.

If YES:
- import exact quantities only into Dev Store;
- label/report snapshot date/source.

If NO:
- do NOT invent quantity values;
- configure dev products so they can still be exercised in storefront/cart using the least misleading Shopify-native approach;
- prefer inventory NOT tracked for Dev validation rather than fake stock numbers;
- document clearly that Dev availability is NOT production inventory truth.

Do NOT query or modify Neon/Production inventory.

==================================================
7. IMAGES
==================================================

Target:
95 real product images.

Use the real URLs from images-manifest/source.

Requirements:
- correct product mapping;
- correct display order;
- no duplicate images unless source intentionally duplicates;
- no AI replacements;
- no image editing;
- do not alter product design/color/body/model;
- Shopify must ingest/store the images successfully;
- validate no broken media on product pages.

If Shopify cannot ingest a specific source URL:
- retry with official supported method;
- record exact failed URL/product;
- do not substitute a different image.

==================================================
8. COLLECTIONS
==================================================

Create exactly:
- Oasis Natural
- Aurora Viva
- Espuma de Ola
- Salidas de Baño

Membership targets:
- Oasis Natural = 10
- Aurora Viva = 12
- Espuma de Ola = 7
- Salidas de Baño = 0

Prefer deterministic manual collection membership unless the source clearly supports safe automated rules.

Do NOT create target collections:
Accesorios, Hombre, Mujer, Niños, Calzado.

If Shopify already has default collection frontpage:
- do not delete it blindly;
- ensure it does not leak into final navigation/theme configuration unless intentionally used.

==================================================
9. PRODUCT METAFIELD — COLOR
==================================================

Create/verify the exact definition expected by the theme from 02H:

Product metafield:
custom.color

Read the report/code first for exact Shopify type.

Populate all products with normalized REAL color values from source.

Known values include examples such as:
- Beige
- Negro
- Naranja
- Azul / Azul turki, according to source truth

Do not normalize distinct commercial color names into one generic label unless Phase 01 mapping explicitly says so.

Create a mapping report:
source color → Shopify custom.color

==================================================
10. SIZE GUIDE METAOBJECT / METAFIELD
==================================================

Read 02H product-page-report.md and current theme source.

Create the exact schema expected for:
- Product custom.size_guide
- Size Guide metaobject
- fields such as image/content ONLY if those are exactly what current code expects.

Populate objects only where authoritative content/assets exist.

If no authoritative per-product content exists:
- create the definition/schema;
- use the theme's documented fallback;
- do NOT invent measurement values.

Validate PDP opens the size guide without error.

==================================================
11. COLLECTION METAFIELDS
==================================================

Read 02G collection-report.md and actual Liquid.

Create ONLY the exact collection metafield definitions the theme supports.

Expected report mentioned 6 metafields, but Claude must derive exact:
- namespaces
- keys
- types
- intended use

from current code/report.

Populate only where source-of-truth data exists.

Fallbacks must remain functional.

Do not fabricate banners/framing values.

==================================================
12. SEARCH-BY-COLOR DATA
==================================================

02J found custom.color alone is not enough for native predictive search behavior.

Investigate in the REAL Dev Store after products exist.

Test:
- search by exact product title
- search by collection
- search by real color terms

If Shopify native search indexes product tags in the required manner:
- add deterministic color tags derived from custom.color;
- use a documented naming convention;
- verify query behavior.

If tags do NOT reliably solve it:
- do not pollute catalog;
- document for later Search & Discovery configuration.

No third-party search app.

==================================================
13. PRODUCT STATUS / SALES CHANNEL
==================================================

Products in Development Store must be visible to the Online Store preview for QA.

Use the minimum state required for that.

Do not publish anything to a commercial store.

Document:
- product status
- Online Store publication state
- any differences from future commercial launch.

==================================================
14. NAVIGATION AFTER COLLECTION CREATION
==================================================

Now that real collections exist, re-audit the current Radaelli navbar/navigation code and 02C report.

Replace the temporary minimal menu with the closest faithful Shopify navigation.

Only use real existing destinations.

No dead links.

Validate desktop + mobile.

Do NOT invent categories excluded from migration.

==================================================
15. HOME CONFIGURATION
==================================================

Re-audit 02E Home report and current source.

Configure the UNPUBLISHED Radaelli theme in Dev Store so Home sections point to real collections/products where the theme requires settings.

Preserve intended order:
hero
featured categories
editorial collection
featured products
recommended products
promo
newsletter

Do not invent marketing content not in source/current site.

If a section requires content not yet migrated:
use safe fallback and document.

==================================================
16. COLLECTION PAGE — REAL SHOPIFY QA
==================================================

With actual products, test each target collection.

Validate:
- correct product counts
- header/banner fallback
- Product Card
- price
- sold-out state if applicable
- filters
- sort
- mobile filter drawer
- pagination if applicable
- 2-column mobile grid
- 320px
- no nested links
- no fatal JS/Liquid

Search & Discovery may not be configured yet.
If filters require it:
- use Shopify's native capability if already available;
- do not install third-party apps.
- official Shopify Search & Discovery app may be evaluated only if actually necessary and free; do not install unless required and within prior user authorization for routine free official Shopify tooling.

==================================================
17. PDP — REAL SHOPIFY QA
==================================================

Test representative products from ALL 3 populated collections.

At minimum include:
- multiple images
- product with sale/compare-at if one exists
- product with multiple sizes
- product with known color anomaly
- product with legacy SKU prefix

Validate:
- title
- price
- compare-at
- SKU
- color
- availability
- size selector
- sold-out size semantics if source supports
- add-to-cart
- gallery
- thumbnails
- mobile swipe
- lightbox
- zoom
- size guide
- accordions
- recommendations
- wishlist heart guest mode
- cart drawer integration

No real payment.

==================================================
18. CART — REAL PRODUCT QA
==================================================

Using Dev Store products:
- add
- add second product
- increment
- decrement
- remove
- subtotal
- cart count
- drawer
- cart page
- error handling
- variant/talla label
- COP formatting

If inventory isn't tracked, explicitly note stock tests not representative.

No checkout/payment yet.

==================================================
19. SEARCH — REAL DATA QA
==================================================

Validate:
- /search
- predictive search
- exact title
- partial title
- collection/product terms
- color term
- no result
- keyboard
- mobile
- Product Card render

Record any real Shopify divergence.

==================================================
20. WISHLIST — REAL PRODUCT QA
==================================================

Wishlist account sync stays OFF.

With real products:
- heart on Product Card
- heart on PDP
- Header count
- Favorites page via current ?view=wishlist workaround
- remove
- reload persistence
- multi-tab if feasible
- real product Section Rendering
- deleted/nonexistent behavior only with synthetic safe test, not by deleting real catalog products

Do not require customer login.

==================================================
21. SEO / URL PARITY
==================================================

Compare all 29 Shopify product URLs against:
current-url-inventory.csv

Create:
shopify-migration/catalog/shopify-url-parity.csv

Columns:
source_url
shopify_url
status
redirect_needed
reason

Also capture collection URLs.

Do NOT create redirects in Production.
Dev-store redirects may be prepared only if useful and reversible, but do not spend time on launch redirects before mapping is complete.

==================================================
22. DATA QUALITY GATES
==================================================

Before declaring 03C complete:

Hard targets:
- products = 29
- variants = 98
- expected images = 95 source records
- collection membership = 10 / 12 / 7 / 0
- 0 target products in excluded target collections
- 0 accidental demo products
- 0 duplicate target handles
- 0 duplicate product imports
- 0 missing required price
- 0 malformed variant associations

If image count inside Shopify differs due to platform dedupe/processing:
report both source records and Shopify media count with exact explanation.

==================================================
23. DATA EXPORT BACK FROM SHOPIFY
==================================================

After import, export/read back the resulting Dev Store catalog through a supported method.

Compare Shopify → source:
- product
- handle
- title
- variant count
- SKU
- option
- price
- compare-at
- color metafield
- collection membership
- image count/order where possible

Create:
shopify-migration/catalog/shopify-post-import-audit.csv

Every mismatch must be:
- fixed, or
- explicitly justified.

==================================================
24. THEME BUG FIXES DISCOVERED BY REAL DATA
==================================================

If real catalog exposes a theme bug:
- diagnose;
- fix in theme-src;
- Theme Check 0/0;
- run relevant offline regression;
- push ONLY to unpublished Radaelli theme ID 189072474431;
- verify on real Shopify.

Do not touch Horizon.

If theme code changes materially:
- produce RC1.3;
- deterministic ZIP + manifest;
- report SHA-256.

If no theme changes:
- keep RC1.2 and say so.

==================================================
25. OWNER-ONLY BLOCKERS FROM 03B
==================================================

Carry but DO NOT stop for:
- customer login email code;
- full authenticated customer Liquid test.

Do not ask Daniela before 13:00.

Do NOT resolve business decisions unrelated to 03C:
- store legal entity/address
- US market keep/remove
- final voseo vs tú
- final production shipping rates

For 03C use existing safe state and document.

==================================================
26. SHIPPING
==================================================

Do NOT configure final production shipping rates in 03C.

Reason:
it is a commercial policy decision and not required to validate catalog/theme.

You MAY:
- inspect current empty/default shipping state;
- ensure product import does not accidentally create misleading shipping profiles;
- prepare a later shipping configuration checklist.

Do not block catalog work.

==================================================
27. TAX / PAYMENTS / WOMPI
==================================================

NO:
- tax configuration
- Shopify Payments
- Wompi
- real checkout payment
- payment app
- domain

==================================================
28. SAFETY
==================================================

NO:
- publish Radaelli theme
- modify Horizon
- Production
- Staging
- Vercel
- Neon
- DNS
- main
- merge
- PR
- destructive product deletion unless removing an accidental duplicate created by THIS phase and verified safe
- real customer outreach

==================================================
29. VALIDATION
==================================================

At end:
- Shopify theme check: 0 errors / 0 warnings
- current theme parity/pull check if theme changed
- real storefront smoke with catalog
- desktop 1280
- tablet 768
- mobile 430 / 390 / 375 / 320
- no horizontal overflow
- no fatal JS
- no fatal Liquid
- own assets load
- COP formatting
- Spanish storefront

==================================================
30. REPORT
==================================================

Create:
shopify-migration/theme/03C-catalog-import-report.md

Include at minimum:

1. model confirmed
2. elapsed time
3. resource/usage or UNAVAILABLE
4. source artifacts audited
5. pre-import product count
6. pre-import variant count
7. pre-import image rows
8. anomalies confirmed
9. import method
10. import artifact paths
11. Shopify products after import
12. Shopify variants after import
13. Shopify media/images after import
14. duplicate products 0/FAIL
15. duplicate handles 0/FAIL
16. SKU reconciliation
17. price reconciliation
18. compare-at reconciliation
19. inventory strategy
20. Oasis Natural count
21. Aurora Viva count
22. Espuma de Ola count
23. Salidas de Baño count
24. excluded collection contamination 0/FAIL
25. custom.color definition/population
26. size guide definition/metaobject status
27. collection metafields status
28. color tag/search strategy
29. navigation status
30. Home collection assignments
31. Collection real QA
32. PDP real QA
33. Cart real QA
34. Search real QA
35. Wishlist real QA
36. handle mapping created
37. URL parity created
38. post-import audit created
39. mismatches found/fixed
40. Theme bugs discovered
41. Theme code changed YES/NO
42. RC1.3 created YES/NO
43. final theme version/hash
44. Theme Check errors
45. Theme Check warnings
46. real responsive matrix result
47. fatal JS errors
48. fatal Liquid errors
49. Horizon untouched YES/NO
50. Radaelli theme unpublished YES/NO
51. customer-login blocker still deferred YES/NO
52. Production/Staging/main touched NO
53. app installations during phase
54. blockers for 03D
55. READY FOR 03D YES/NO
56. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
31. HANDOFF
==================================================

At completion:

Update:
ai-handoff/claude-result.md

Create:
ai-handoff/archive/03C-result.md

Update status.md:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03C
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03D
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

Push ONLY handoff Markdown to origin/ai-handoff.

Send:
HANDOFF READY 03C

Then perform exactly:
CHECK 1: +1 minute
CHECK 2: +2 additional minutes
CHECK 3: +5 additional minutes

If status becomes READY_FOR_CLAUDE_03D:
continue immediately.

If not ready after ~8 minutes:
stop only the handoff wait.
Do not invent 03D.

==================================================
BACKGROUND RULE
==================================================

No detached watchers.
No infinite loops.
No indefinite waits.
No persistent background tasks.

While Daniela is away:
defer owner-only blockers and keep working.

At phase completion:
zero background tasks outside the finite 1/2/5 handoff checks.
