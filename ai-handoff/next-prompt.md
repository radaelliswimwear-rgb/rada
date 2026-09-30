# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03L
PHASE: 03L — COLOMBIA CLIENT TRANSFER STORE BOOTSTRAP + DETERMINISTIC MIGRATION
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

OWNER CHECKPOINT COMPLETED — RESUME NOW
Daniela has successfully created the CORRECT Shopify Client Transfer Store from the Shopify Dev Dashboard.

NEW TARGET
- Name: `Radaelli Swimwear Colombia Launch`
- Non-sensitive admin/store slug observed: `radaelli-swimwear-colombia-launch-1jeqp0yj`
- Store type selected explicitly: `Client transfer`
- Country selected explicitly at creation: `Colombia`
- Shopify Plus checkbox: NOT selected
- No transfer performed
- No paid plan selected

SCREENSHOT-VERIFIED BASELINE
In Settings > General on the NEW target, Daniela visually confirmed:
- commercial entity country: Colombia;
- store address country: Colombia;
- currency display: Peso colombiano (COP $);
- backup region: Colombia;
- unit system: metric;
- default weight unit: kilogram (kg).

ONE KNOWN BASELINE FIX
The timezone currently shows `(GMT-05:00) Eastern Time (US & Canada)`.
Claude must change this himself to the Shopify option corresponding to `Bogotá` / `America/Bogota` if available.
Do NOT ask Daniela to navigate to this setting manually unless Shopify blocks Claude with a true permission/owner gate.

CRITICAL OPERATING RULE — CLAUDE DOES THE WORK
Daniela explicitly wants Claude to perform all Shopify configuration/navigation/actions that the authenticated Claude session is permitted to perform.
Do NOT give Daniela routine navigation instructions such as “go to Settings > General and change X” when Claude can do it.
Do NOT ask her to configure locale, timezone, markets, shipping placeholders, theme, catalog, collections, pages, redirects, metafields, menus, SEO, QA settings, or other normal admin work that Claude can perform.

Daniela should only be interrupted for a SIMPLE OWNER CLICK when Shopify technically requires one of these:
- explicit permission grant to Claude/browser session;
- owner-only authentication or MFA;
- OAuth approval screen;
- legal acceptance;
- billing/paid plan commitment;
- irreversible transfer/publish/domain cutover;
- secret/credential entry that Claude must not read;
- other action the platform explicitly prevents Claude from taking.

If that happens:
1. navigate to the exact screen first if permitted;
2. ask Daniela for ONE simple click/action only;
3. explain exactly what button she should press and what must NOT be selected;
4. after she clicks, resume autonomously immediately.
Do not hand her a list of manual settings to configure herself.

DO NOT REPEAT THE OLD BLOCKER
The earlier store `radaelli-swimwear-colombia` is a Dev Store and remains NON-FINAL. Do not migrate launch artifacts there.
The original `radaelli-swimwear-dev` also remains a QA Dev Store.
The ONLY launch target from now on is `Radaelli Swimwear Colombia Launch`, after read-only verification confirms it appears as `Client transfer` in the Dev Dashboard.
Do not delete either Dev Store yet.

STEP 1 — VERIFY NEW TARGET READ-ONLY
Immediately verify:
- Dev Dashboard type = Client transfer / transfer to client;
- country = Colombia;
- no transfer performed;
- no paid plan/Plus commitment;
- no real payment provider active.
If all PASS, continue without asking Daniela anything.

STEP 2 — COMPLETE COLOMBIA BASELINE YOURSELF
Configure/verify on the NEW target:
- timezone = Bogotá / America/Bogota;
- currency = COP;
- metric system;
- kg;
- Spanish storefront default where Shopify supports it;
- Colombia market active/appropriate;
- storefront remains non-public/private/password-protected during build;
- no real payments;
- no DNS/domain cutover.
Reuse the real store/dispatch address already supplied in 03J only through authenticated/local context; never copy the full private address into GitHub handoff files.
Do not invent NIT, legal entity name, tax registrations, phone, billing or other owner facts.

STEP 3 — MIGRATE RC1.10 UNPUBLISHED
Use the existing deterministic package.
- Upload RC1.10 to the NEW target as UNPUBLISHED.
- Verify remote = ZIP parity for all 98 files, content-aware for Shopify JSON reserialization.
- Expected RC1.10 SHA-256: `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`.
- Preserve RC1.9 rollback.
- Do not publish.

STEP 4 — MIGRATE DATA IN DETERMINISTIC WAVES
Wave A — Catalog:
- 29 products;
- 98 variants;
- 95 images;
- verify handles, SKUs, prices/compare-at, images/alt;
- do not invent inventory quantities;
- keep XL discrepancy PENDING_OWNER.

Wave B — Collections:
- Oasis 10;
- Aurora 12;
- Espuma 7;
- Salidas 0;
- Destacados 7 where applicable.

Wave C — Metafields/metaobjects:
- create required deterministic definitions/values from package;
- no invented owner facts.

Wave D — Content/navigation:
- create only exact sourced safe pages;
- incomplete legal pages with owner placeholders must remain draft/unpublished or not be created if Shopify would expose them;
- configure menus/navigation from package;
- verify internal links.

Wave E — Redirects:
- import final 51 redirects;
- validate 51/51.

STEP 5 — THEME/CONTENT WIRING
Configure all reproducible settings Claude can do:
- Home sections and collection references;
- header/footer sourced content;
- SEO/theme settings from existing package;
- social handles already sourced;
- Spanish locale wiring;
- conditional free-shipping messaging must not falsely imply dynamic checkout shipping until shipping is configured.

Do NOT install or activate Wompi, Envia.com, wishlist OAuth, analytics account integrations, paid apps or production credentials in this step unless a later approved phase explicitly directs it.

STEP 6 — TARGETED VALIDATION
Required gates on NEW target:
- type = Client Transfer Store/current equivalent;
- country Colombia;
- COP;
- Bogotá timezone;
- Spanish default where supported;
- RC1.10 parity 98/98;
- catalog 29/98/95;
- collections 10/12/7/0 (+ Destacados 7 if imported);
- required metafields present;
- redirects 51/51;
- Home/PDP/Collection/Search/Cart smoke PASS;
- widths 320/390/768/1440 on Home + representative PDP + collection + Search + Cart;
- no fatal Liquid/JS;
- no raw translation keys;
- no stale US/USD storefront copy;
- no secret leakage.
Do not repeat the 03G mega-audit unless a failure requires it.

STEP 7 — LAUNCH TARGET CLASSIFICATION
After parity passes:
- mark `Radaelli Swimwear Colombia Launch` as the ONLY launch target;
- keep both prior Dev Stores as non-final QA/reference environments;
- shipping/Envia.com remains FINAL-STORE ONLY;
- Wompi remains FINAL-STORE ONLY;
- wishlist/Search & Discovery/analytics OAuth remain owner-auth items for later;
- inventory, XL, legal owner fields remain owner data decisions;
- transfer/plan/domain/publish remain final cutover.

STEP 8 — BACKUP
Update `shopify-migration-backup` with 03L artifacts/evidence after secret scan.
No `main`, no PR, no secrets, no cookies/tokens/private address/checkout URLs.

STEP 9 — REPORT + HANDOFF
Create `shopify-migration/theme/03L-colombia-client-transfer-migration-report.md` with privacy-safe evidence including:
1 model
2 elapsed
3 old QA stores preserved
4 new target verified as Client Transfer YES/NO
5 country Colombia YES/NO
6 paid commitment NO unless explicitly approved
7 Colombia/COP/Bogota/Spanish baseline
8 RC1.10 parity
9 catalog 29/98/95
10 collections
11 metafields/metaobjects
12 content/navigation
13 redirects 51/51
14 targeted smoke/responsive
15 secret scan
16 backup branch updated
17 shipping = FINAL-STORE ONLY
18 Wompi = FINAL-STORE ONLY
19 owner interruptions during resumed 03L
20 exact remaining blockers
21 launch-target migration readiness percentage
22 READY FOR 03M YES/NO
23 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

When complete:
- update `ai-handoff/claude-result.md`;
- archive `ai-handoff/archive/03L-result.md`;
- set LAST_COMPLETED_PHASE: 03L / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03M / STATUS: READY_FOR_CHATGPT_REVIEW;
- push handoff via established bridge;
- send exactly `HANDOFF READY 03L`;
- perform finite +1/+2/+5 checks;
- continue only after ChatGPT publishes READY_FOR_CLAUDE_03M.

DO NOT STOP OR HAND ROUTINE ADMIN CONFIGURATION BACK TO DANIELA. CLAUDE PERFORMS ALL PERMITTED WORK; DANIELA ONLY DOES REQUIRED OWNER CLICKS.