# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03L
PHASE: 03L — COLOMBIA CLIENT TRANSFER STORE BOOTSTRAP + DETERMINISTIC MIGRATION
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03K APPROVED BY CHATGPT.

AUTHORITATIVE 03K RESULT
- Autonomous pre-cutover work is exhausted.
- Current QA sandbox: `radaelli-swimwear-dev` (Dev Store), preserved.
- Current theme candidate: RC1.10.
- RC1.10 SHA-256: `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`.
- RC1.10: 98 files, deterministic build confirmed, Theme Check 0/0, regression 89/89, 16 new mutants detected, remote = ZIP 98/98.
- RC1.9 remains rollback.
- Catalog source of truth: 29 products / 98 variants / 95 images.
- Collections: Oasis 10 / Aurora 12 / Espuma 7 / Salidas 0; Destacados 7 where applicable.
- Redirect package: 51 final redirects prepared.
- Wishlist app: 156/156 tests, 20/20 mutants; install/OAuth deferred.
- Backup branch: `shopify-migration-backup`, verified remote, no `main`, no PR, secret scan 0 blocking findings.
- Shipping live calculation and Wompi are FINAL-STORE ONLY and remain deferred.
- No real payments, no DNS/domain cutover, no production publish.

CURRENT OFFICIAL SHOPIFY FACTS — VERIFIED BY CHATGPT BEFORE 03L
Use current Shopify Dev Dashboard behavior as the source of truth and re-check UI before acting.
- Shopify distinguishes Dev Stores from Client Transfer Stores.
- Dev Stores are for app/theme testing and cannot be converted to production or transferred to a merchant.
- Client Transfer Stores are specifically for building a merchant store and later transferring ownership.
- Client Transfer Stores are free to create; the merchant begins paying only after transfer and selecting a paid plan.
- Country/region is selected when creating a Client Transfer Store.
- Real transactions are not supported before transfer.

PRIMARY OBJECTIVE
Create the correct Colombia Client Transfer Store (or the current official equivalent if Shopify renamed the UI), migrate the already-built Radaelli package into it deterministically, prove parity, and make it the new launch target.

DO NOT REBUILD FROM SCRATCH.
DO NOT ask Daniela routine questions while the current authenticated session can perform the work.

OWNER-INTERRUPTION RULE
Daniela wants maximum progress and minimal interruptions.
- Do NOT ask her for shipping, Wompi, plan, inventory, XL, domain, legal data, analytics, OAuth or other unrelated decisions during this phase.
- If Shopify requires a true owner-only authentication, legal acceptance, transfer acceptance, billing/plan choice, MFA, or irreversible approval, stop only at that exact screen and ask for that ONE action.
- Otherwise continue autonomously.

ONE ACTIVE PROCESS ONLY
- No subagents.
- No workflows.
- No broad re-audits.
- One write wave at a time.
- Verify after each write wave.

STEP 1 — CREATE THE COLOMBIA CLIENT TRANSFER STORE
In Shopify Dev Dashboard:
1. Verify current store types and confirm `radaelli-swimwear-dev` is Dev Store.
2. Choose Create store > Client Transfer Store (or exact current equivalent).
3. Create a new target with:
   - clear name such as `Radaelli Swimwear Colombia`;
   - country/region: Colombia;
   - no demo/test catalog data;
   - no paid upgrade/Plus unless already free and explicitly non-billing;
   - no transfer to merchant yet.
4. Record the new store identifier/slug privately and only a non-sensitive identifier in handoff.

If creation itself requires no billing or irreversible commitment, proceed without asking Daniela.
If Shopify requires owner auth/permission, ask only for that exact step.

STEP 2 — BASELINE COLOMBIA SETTINGS
On the new target configure safe baseline only:
- country/region Colombia;
- store/dispatch address already supplied in 03J when the Admin permits reuse; do not expose full address in GitHub;
- COP;
- America/Bogota;
- metric/kg;
- Spanish storefront default if supported;
- Colombia market active/appropriate;
- storefront private/password protected while building;
- no real payment provider;
- no domain cutover.

Do not invent NIT, legal entity, tax registrations, phone or billing data.

STEP 3 — MIGRATE THEME RC1.10 UNPUBLISHED
- Upload RC1.10 to the new target as UNPUBLISHED.
- Do not publish it.
- Verify remote = ZIP exact parity for all 98 files (byte/content-aware for Shopify JSON reserialization).
- Run Theme Check only if upload or schema validation requires it; expected 0/0.
- Preserve RC1.9 and RC1.10 local artifacts unchanged.

STEP 4 — MIGRATE DATA IN DETERMINISTIC WAVES
Reuse the 03K package and runbook. Do not manually recreate records unless the deterministic importer requires a small compatibility adjustment.

Wave A: catalog
- import 29 products / 98 variants / 95 images;
- verify handles, SKUs, prices/compare-at, image counts and alt data;
- inventory quantities remain unset/untracked per existing decision state;
- keep XL discrepancy PENDING_OWNER; do not add/remove XL by inference.

Wave B: collections
- Oasis 10;
- Aurora 12;
- Espuma 7;
- Salidas 0;
- Destacados 7 if part of source package;
- verify memberships deterministically.

Wave C: metafields/metaobjects
- create required definitions and populate deterministic values from package;
- no invented owner facts.

Wave D: pages/content/navigation
- create only pages whose exact sourced content is already complete and safe;
- if a legal page contains unresolved owner placeholders, keep it draft/unpublished or do not create it if Shopify would expose incomplete legal content;
- install menus/navigation from package;
- verify no broken internal links.

Wave E: redirects
- import final 51 redirects;
- validate all 51.

STEP 5 — THEME/CONTENT WIRING ON NEW TARGET
Configure reproducible theme settings/content that do not require a new owner decision:
- Home sections and collection references;
- footer/header sourced content;
- SEO/theme settings available from existing package;
- social handles already sourced;
- free-shipping messaging must remain conditional and must not falsely advertise a checkout behavior that is not yet configured on this target.

Do not install Wompi, Envia.com, Search & Discovery, wishlist OAuth, analytics account integrations or paid apps in this step.

STEP 6 — PARITY VALIDATION
Run targeted deterministic validation on the NEW Colombia target.
Required gates:
- store type = Client Transfer Store/current official equivalent;
- country/region Colombia;
- COP;
- America/Bogota;
- Spanish default where supported;
- RC1.10 remote = ZIP 98/98;
- 29 products;
- 98 variants;
- 95 images;
- collection counts 10/12/7/0 (+ Destacados 7 if imported);
- required metafield definitions present;
- 51 redirects PASS;
- Home/PDP/Collection/Search/Cart basic smoke PASS;
- no fatal Liquid/JS errors;
- no raw translation keys;
- no stale US/USD storefront copy;
- no secret/credential leakage.

Widths for targeted storefront smoke: 320, 390, 768, 1440 on Home + one representative PDP + one collection + Search + Cart.
Do not repeat the full 03G mega-audit unless a failure demands it.

STEP 7 — FINAL-STORE READINESS CLASSIFICATION
Once parity passes, mark the new target as the ONLY launch target.
Keep old `radaelli-swimwear-dev` intact as NON-FINAL QA SANDBOX.

Reclassify remaining blockers, but do not solve owner-only items in 03L:
- shipping live calculation / Envia.com: FINAL-STORE ONLY, pending plan/account decision;
- Wompi: FINAL-STORE ONLY, sandbox first, owner auth/credentials later;
- wishlist installation/OAuth: owner auth, optional launch blocker according to existing matrix;
- Search & Discovery OAuth: owner auth;
- analytics account connection: owner auth;
- inventory quantities: owner decision/data;
- XL discrepancy: owner decision;
- legal owner fields: owner legal data;
- domain/publish/transfer/plan: final cutover.

STEP 8 — BACKUP / REPRODUCIBILITY UPDATE
Update `shopify-migration-backup` with new 03L migration artifacts and target-store bootstrap evidence, after secret scan.
Do not push to `main`; no PR.
Exclude private address, tokens, cookies, secrets, checkout URLs and credentials.

STEP 9 — REPORT
Create `shopify-migration/theme/03L-colombia-client-transfer-migration-report.md` with privacy-safe output and at least:
1 model
2 elapsed
3 old QA store type
4 old QA store preserved YES/NO
5 new target created YES/NO
6 new target type
7 new target country
8 billing/paid commitment made YES/NO
9 Colombia/COP/Bogota/Spanish baseline
10 RC1.10 remote parity
11 catalog counts 29/98/95
12 collection counts
13 metafield/metaobject migration result
14 content/navigation result
15 redirects 51/51 result
16 targeted responsive/smoke result
17 secrets scan result
18 backup branch updated YES/NO
19 shipping status FINAL-STORE ONLY
20 Wompi status FINAL-STORE ONLY
21 owner actions requested during 03L count
22 exact remaining blockers by category
23 launch-target migration readiness percentage
24 READY FOR 03M YES/NO
25 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

HANDOFF
When complete:
- update `ai-handoff/claude-result.md`;
- create `ai-handoff/archive/03L-result.md`;
- update status to LAST_COMPLETED_PHASE: 03L / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03M / STATUS: READY_FOR_CHATGPT_REVIEW;
- set USER_ABSENCE_MODE: INACTIVE unless Daniela explicitly says she is away again;
- push only handoff files to `ai-handoff` via established bridge;
- send exactly `HANDOFF READY 03L`;
- perform finite +1 / +2 / +5 minute checks;
- continue only after ChatGPT publishes READY_FOR_CLAUDE_03M.

FAIL-SAFE
If Client Transfer Store creation is unavailable because of account permissions, do not create another Dev Store and do not use a US store as a substitute. Capture the exact non-sensitive blocker and ask Daniela for the ONE minimum owner action required. Otherwise continue autonomously until migration/parity is complete.
