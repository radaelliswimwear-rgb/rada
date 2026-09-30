# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03K
PHASE: 03K — COLOMBIA STORE REMEDIATION + MIGRATION TO TRANSFERABLE TARGET
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

URGENT USER OVERRIDE — EFFECTIVE IMMEDIATELY
Daniela explicitly does NOT want more shipping/Wompi work performed on top of a store whose underlying country/store type is not appropriate for the final Colombia launch. Stop the previous 03K flow now. Do NOT continue carrier-app exploration, Wompi install, or shipping-rate work in the current Dev Store until this remediation is complete.

WHY THIS OVERRIDE EXISTS
Official Shopify documentation states:
- a Dev Store is for app/theme testing and cannot be transferred to the merchant;
- a Client Transfer Store is the Partner store type intended to be built for a merchant and then transferred;
- when creating a Client Transfer Store, the country/region is selected at creation;
- Shopify requires accurate business/store location, and changing store country creates/changes the business entity context and can affect shipping and available Shopify products/services.

The current `radaelli-swimwear-dev` remains useful as a QA sandbox and source of truth, but it MUST NOT be treated as the final Colombia commercial store.

CRITICAL REASSURANCE / DATA PRESERVATION
The work is NOT to be discarded or rebuilt manually from zero.
Preserve and reuse the existing deterministic artifacts:
- RC1.9 theme + manifest;
- catalog 29 products / 98 variants / 95 images;
- collections and mappings;
- metafields/metaobjects definitions;
- 47 redirects;
- legal/page artifacts already prepared;
- menus/navigation artifacts;
- wishlist app package and tests;
- launch/reproducibility artifacts;
- all validation tooling.
The current Dev Store is retained intact as rollback/reference until the new Colombia target is proven equivalent.

ONE PROCESS ONLY
- NO subagents.
- NO workflows.
- NO broad rediscovery.
- NO repeating the 03G crawl.
- NO deletion of the existing Dev Store.
- NO Production/Staging/Vercel/Neon/main/merge/PR/DNS changes.
- NO real payment, no production Wompi keys, no publish/domain cutover.

PRIMARY OBJECTIVE
Create or identify the correct transferable/final-path Shopify store for Radaelli in COLOMBIA, migrate the already-built project into it deterministically, and prove parity before resuming shipping/Wompi work.

STEP 0 — STOP CURRENT WRONG-PATH WORK
If Claude is currently waiting inside carrier/shipping/Wompi exploration from the prior prompt, stop that exploration immediately.
Do not install any shipping app or payment provider in `radaelli-swimwear-dev` as part of the old 03K plan.
Do not change its current business entity further.
Preserve its current state and evidence.

STEP 1 — CONFIRM STORE TYPES AND CAPABILITY, READ ONLY
Using Shopify's current Dev Dashboard/Admin, determine and record:
A. current store `radaelli-swimwear-dev` exact type (expected Dev Store);
B. whether the current Partner/Dev Dashboard account exposes `Client transfer store` creation;
C. whether a Client Transfer Store can be created with country/region = Colombia under this account;
D. whether creation itself has any charge or billing commitment;
E. whether any owner authentication/approval is required.

Do not rely only on memory. Read the current Shopify UI and current official Shopify documentation.

EXPECTED DECISION
If Client Transfer Store creation for Colombia is available without paid billing/irreversible commitment, that is the preferred target because it is specifically designed to be built and later transferred to the merchant.
If it is not available, DO NOT improvise another US Dev Store. Present Daniela with exactly ONE minimum manual step required to create a standard Colombia merchant store or the supported equivalent.

STEP 2 — CREATE THE CORRECT COLOMBIA TARGET (OWNER CHECKPOINT ONLY IF REQUIRED)
Preferred target:
- type: Client Transfer Store / transferable merchant-build store;
- country/region at creation: Colombia;
- no demo/test catalog data;
- do not select a paid upgrade unless Daniela explicitly approves it;
- name clearly identifies it as Radaelli Swimwear Colombia / launch target, avoiding confusion with the old Dev Store.

If Shopify asks Daniela to authenticate, accept ownership/legal terms, select a paid plan, or perform another owner-only action, ask/show ONLY that one step. Do not ask a batch.

Do not delete or modify the old Dev Store after creating the target.

STEP 3 — BASE COLOMBIA SETTINGS ON THE NEW TARGET
Before importing project artifacts, configure/verify only safe baseline settings:
- operating/store country Colombia;
- real Radaelli store/dispatch address already supplied in 03J (use it from the authenticated local project/session; NEVER copy the full private address into GitHub handoff files);
- COP;
- timezone America/Bogota;
- metric/kg;
- Spanish storefront default where Shopify supports it;
- Colombia market active/appropriate;
- no real payments active;
- password/private storefront as appropriate while building.

Do not invent NIT, legal entity name, tax registrations, billing data, phone, or other owner facts not already supplied.

STEP 4 — MIGRATE EXISTING WORK; DO NOT REBUILD FROM SCRATCH
Use the existing deterministic source artifacts as the migration source of truth.
Migrate in this order, one write wave at a time with verification after each wave:
1. theme RC1.9 as UNPUBLISHED;
2. catalog -> target 29 products / 98 variants / 95 images;
3. target collections and memberships;
4. metafields/metaobjects/definitions required by theme/catalog;
5. pages/legal artifacts that are safe and already sourced;
6. menus/navigation;
7. 47 redirects;
8. required theme settings/content wiring that are reproducible from artifacts;
9. any safe free/partner-compatible app state only if needed for parity and officially allowed on the target store.

Do not migrate customer PII, historical orders, coupons, newsletter contacts or inventory quantities unless/ until their existing owner decisions are resolved.
Do not publish.

STEP 5 — PARITY GATES BEFORE ANY NEW FEATURE WORK
The new Colombia target must prove, at minimum:
- RC1.9 remote = ZIP for all theme files;
- Horizon/default live theme remains untouched if present; Radaelli remains unpublished;
- 29 products;
- 98 variants;
- 95 images;
- Oasis 10 / Aurora 12 / Espuma 7 / Salidas 0;
- Destacados 7 if the artifact is part of the current target state;
- redirects 47/47;
- Spanish/COP/Colombia context;
- product availability for Colombia is not blocked by the old US-only shipping-origin state;
- Home/PDP/Collection/Search/Cart basic smoke PASS;
- no fatal Liquid/JS errors;
- no secret/credential leakage.

Reuse existing validators. Do not rerun the entire 03G mega-audit unless a parity failure makes it necessary.

STEP 6 — SHIPPING/WOMPI ONLY AFTER TARGET PARITY
Only once the new Colombia target passes Step 5:
A. re-evaluate Shopify shipping options for Colombia on THIS correct target;
B. confirm the real carrier Daniela identified/uses;
C. decide whether checkout-calculated shipping is available on the future production plan or requires a carrier/app/add-on;
D. re-evaluate Wompi using Wompi's official Shopify integration route on THIS correct Colombia target.

Important:
- absence of Wompi from provider search alone is not proof it is unsupported; Wompi documents an official Shopify integration and sandbox flow;
- absence of Colombian carrier names in Shopify's built-in carrier list is not proof the store is US; carrier-calculated shipping can require apps and plan support;
- nevertheless, the new target must be Colombia-native so final tests are representative.

Do not enter Wompi production credentials in 03K.
Do not ask Daniela to paste any secret in chat.
If Wompi sandbox requires production credentials first, document that owner boundary and stop before credential entry unless Daniela explicitly chooses to proceed directly in the official Wompi screen.

STEP 7 — OLD DEV STORE DISPOSITION
After the new Colombia target passes parity:
- keep `radaelli-swimwear-dev` intact as a QA/reference environment for now;
- label/document it as NON-FINAL / NON-TRANSFERABLE DEV SANDBOX;
- do not delete it in 03K;
- future work should target the Colombia transferable/commercial-path store unless a test specifically needs a Dev Store.

STEP 8 — REPORT
Create `shopify-migration/theme/03K-colombia-store-remediation-report.md` with privacy-safe output:
1 model
2 elapsed
3 old store exact type
4 old store retained YES/NO
5 client-transfer capability available YES/NO
6 owner/manual action required to create target YES/NO
7 new target store type
8 new target country
9 billing/paid commitment made NO unless explicitly approved
10 Colombia/COP/Bogota baseline PASS/FAIL
11 RC1.9 migrated YES/NO + remote parity
12 catalog counts
13 collection counts
14 redirects count
15 page/menu/metafield migration summary
16 smoke QA result
17 secrets scan result
18 Wompi official route visibility on new target
19 shipping capability finding on new target
20 old Dev Store touched after freeze YES/NO
21 production/DNS/main touched NO
22 remaining owner blockers
23 READY FOR 03L YES/NO
24 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

HANDOFF
When complete:
- update `ai-handoff/claude-result.md` with the privacy-safe report;
- create `ai-handoff/archive/03K-result.md`;
- update status to LAST_COMPLETED_PHASE: 03K / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03L / STATUS: READY_FOR_CHATGPT_REVIEW;
- push only handoff files to `ai-handoff` via the established bridge;
- send exactly `HANDOFF READY 03K`;
- perform finite +1 / +2 / +5 minute checks;
- continue only after ChatGPT publishes READY_FOR_CLAUDE_03L.

SAFETY / DECISION RULE
If Shopify proves that creating the correct Colombia target requires a paid plan, irreversible merchant transfer, or another material commitment, stop at that single checkpoint and ask Daniela for that exact approval. Do not continue building in the wrong US-context Dev Store merely to avoid the checkpoint.
