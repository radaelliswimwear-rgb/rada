# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03N
PHASE: 03N — OFFICIAL WOMPI ROUTE + FINAL OWNER-BLOCKER COMPRESSION
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03M APPROVED BY CHATGPT WITH ONE REQUIRED FOLLOW-UP: Wompi was NOT proven unavailable; only normal provider/App Store discovery failed. Official Wompi documentation currently exposes direct Shopify installation routes, including a legacy alternative-provider route and the free `Wompi Tarjetas` Shopify App Store app. 03N must test the OFFICIAL direct routes and record the exact compatibility outcome before classifying Wompi as post-transfer only.

AUTHORITATIVE 03M STATE
- ONLY launch target: Client Transfer Store `Radaelli Swimwear` in Colombia.
- Colombia / COP / America-Bogota / metric / kg intact.
- RC1.10 remains UNPUBLISHED and parity 98/98.
- Catalog 29 products / 98 variants / 95 images.
- Collections and metafields migrated.
- 51 redirects present; exactly 4 legal destinations intentionally 404 until owner legal data/approval.
- Checkout settings: email contact + shipping phone required.
- Shipping Colombia: free shipping for subtotal >= COP 299,900, verified in a TEST checkout.
- No shipping method exists below COP 299,900 yet.
- Envia.com app installed but not authenticated/configured with an Envia account.
- Shopify test gateway active; TEST order #1001 succeeded with no real money.
- Search & Discovery reached owner install-permission screen but final Install click is still pending.
- No transfer, paid plan, DNS cutover, real payment provider, real shipping label or real money.

CURRENT VERIFIED PLATFORM FACTS
Use current official docs/UI as source of truth:
1. Wompi official Shopify docs currently provide:
   A. traditional Wompi Shopify provider direct-install route via Shopify account/store selection;
   B. `Wompi Tarjetas` app in Shopify App Store (developer `Wompi Co`, pricing Free), for on-site card payments.
2. Wompi onboarding may require PRODUCTION credentials first and TEST credentials second. Any credential entry is OWNER-ONLY; never read/copy/log/screenshot/commit secrets.
3. Shopify Client Transfer Stores only allow free/partner-eligible apps before transfer and no real transactions.
4. Shopify third-party carrier-calculated shipping (CCS) currently requires Advanced/Plus, or Grow with annual billing / additional monthly CCS fee. Basic/Starter do not include CCS.
5. Live carrier/app rates require real product/package weight/dimensions and carrier/app account configuration.

PRIMARY OBJECTIVE
Resolve every remaining blocker that can be resolved before transfer, prove the true Wompi/Envia/Search & Discovery compatibility state, and compress the owner-required work into ONE minimal final batch. Do NOT transfer/publish/bill yet.

OPERATING RULE
Claude does all permitted Shopify work. Daniela only performs ONE simple owner-only click/input when Shopify/Wompi/Envia forces it. Do not hand her routine navigation.
No subagents. No workflows. One process at a time. No broad re-audit. No main/merge/PR.

STEP 1 — WOMPI: TEST OFFICIAL DIRECT ROUTES, NOT SEARCH DISCOVERY
On the Client Transfer Store only, read current official Wompi Shopify documentation and test BOTH official paths in this order:

A. Traditional Wompi Shopify provider direct route
- Use the official Wompi documentation's `Instalar plugin aquí` path that resolves to Shopify's alternative-provider installation flow (official provider identifier currently exposed by the direct link).
- Do NOT infer availability from Shopify provider search alone.
- Select ONLY the launch store.
- If Shopify permits connection and then requests owner credentials/approval, navigate to the exact screen and ask Daniela only for that click/secret entry.
- If it is blocked, capture the exact non-sensitive reason/status shown (for example store type/plan/transfer eligibility) and stop this path safely.

B. Wompi Tarjetas App Store route
- Open the official Shopify App Store listing `Wompi Tarjetas`, developer `Wompi Co`, pricing Free.
- Attempt install specifically on the launch store.
- If Shopify says incompatible, capture the exact compatibility requirement if visible. Do not paraphrase `not found` if the app exists.
- If install is allowed, ask Daniela only for the final owner Install/OAuth click if required, then continue.
- If credential setup appears, Daniela enters credentials directly. Claude must not inspect or persist them.
- TEST MODE only; NEVER enable live production transactions in 03N.

Decision output must distinguish:
- INSTALLABLE NOW / TEST MODE WORKS;
- APP EXISTS BUT CLIENT TRANSFER STORE INCOMPATIBLE;
- REQUIRES POST-TRANSFER/PAID PLAN;
- OWNER CREDENTIALS REQUIRED;
- OTHER exact blocker.

Do not claim Wompi is unavailable merely because it does not appear in normal provider search.

STEP 2 — SEARCH & DISCOVERY
Resume the already-open blocker:
- Navigate to official Shopify Search & Discovery install permission.
- Ask Daniela for ONE click `Instalar` only if owner OAuth is still required.
- After install, configure only useful reversible catalog features using existing data (search filters/recommendations where deterministic).
- Run targeted search/collection smoke.
- If Client Transfer restriction blocks it, document exact blocker.

STEP 3 — ENVIA.COM ACCOUNT PRECONFIGURATION
Business rule is already decided by Daniela:
- subtotal >= COP 299,900 => free shipping;
- subtotal < COP 299,900 => customer pays REAL destination-calculated shipping, not an invented flat rate.

Do NOT ask her to choose flat vs dynamic again.

For Envia.com:
- Open the already-installed app on the launch store.
- If login/account creation is required, navigate to that exact screen and ask Daniela only to log in/create account directly. Do not read/store credentials.
- Configure every reversible non-sensitive setting possible after authentication.
- Use the existing Colombia dispatch origin through authenticated Shopify/Envia context; never write full address to handoff/GitHub.
- Do NOT invent product weight or package dimensions.
- Determine whether Envia itself can supply live rates on this Client Transfer Store before transfer and whether CCS/plan restriction is the actual blocker.
- Do not select a paid Shopify plan or CCS add-on.

If live rates cannot be enabled pre-transfer, prepare exact post-transfer activation steps and PASS test for one below-threshold checkout.

STEP 4 — PACKED WEIGHT / DIMENSION DATA GAP
Current products are 0.0 kg and no valid packed dimensions exist. Do not invent them.
- Determine the MINIMUM data model Envia actually needs: per-product weight, default package dimensions, or both.
- If a single standardized package can legally/technically cover most swimwear orders, prepare a template but do not populate guessed values.
- If actual owner measurements are mandatory, put them into the FINAL OWNER BATCH as one compact request, not separate interruptions.
- Preserve free-shipping >=299,900 as already validated.

STEP 5 — LEGAL OWNER DATA: COMPRESS, DO NOT PUBLISH PLACEHOLDERS
Exactly 4 legal destinations remain missing: Privacy, Terms, Shipping, Cookies.
- Reuse existing verbatim/source drafts.
- Generate ONE compact owner data block listing only facts still missing (legal name/entity, NIT if applicable, legal address/publication choice, representative if actually required, approvals of the four texts).
- Do not invent facts.
- Do not publish incomplete pages.
- Keep intentional legal 404 count exactly documented.

STEP 6 — INVENTORY / XL / CUSTOMER-DATA DECISIONS
Do not invent stock.
- Use existing deterministic tooling.
- Consolidate remaining factual decisions into the same FINAL OWNER BATCH:
  * XL discrepancy yes/no;
  * inventory quantities or explicit decision to keep products untracked;
  * whether any historical customer/newsletter/order data is to be migrated.
- Do not ask these one by one while autonomous tasks remain.

STEP 7 — STORE PRIMARY LANGUAGE
Spanish is already default on the root domain and storefront smoke returns `lang=es`; primary admin/store language remains English because Shopify warned of theme/payment translation side effects.
- Re-check exact current warning once.
- Do not change primary language if it risks rewriting theme/payment content before final backup/cutover.
- Prepare exact safe final-cutover sequence and rollback if this change is still desired.

STEP 8 — ACCESSIBILITY C4
Keep existing contrast patch prepared but not applied if it materially changes approved branding.
- Include one visual/brand decision in final owner batch only if still launch-blocking.
- Do not reopen broad design work.

STEP 9 — RE-VERIFY TEST CHECKOUT SAFETY
Do NOT create another test order unless an integration change requires it.
Preserve evidence from #1001.
If Wompi TEST MODE becomes successfully installable, then and only then run ONE Wompi sandbox E2E using documented test credentials entered by Daniela directly, with subtotal >=299,900 and no real money.
Archive/clean test artifacts safely.

STEP 10 — FINAL OWNER BATCH
After all autonomous work is exhausted, create ONE prioritized final owner checklist with only unresolved actions.
Group it into:
A. can be completed BEFORE transfer;
B. must happen DURING transfer/plan selection;
C. immediately AFTER transfer before publish;
D. optional/deferrable.

For every item state:
- why it is needed;
- exact owner click/data needed;
- whether launch-blocking;
- what Claude does immediately after owner action.

Do NOT ask Daniela the batch during 03N unless the current task literally cannot continue without one of those inputs. If she is actively present and an OAuth/install screen is open, ask only for that single click, then resume.

STEP 11 — 03N REPORT / BACKUP / HANDOFF
Secret-scan new artifacts and update `shopify-migration-backup`. No main, no PR.
Create `shopify-migration/theme/03N-official-integrations-owner-batch-report.md` with at least:
1 model / elapsed
2 launch store baseline still Colombia/COP/Bogota
3 Wompi traditional direct route result
4 Wompi Tarjetas route result
5 exact Wompi blocker or TEST PASS
6 Search & Discovery status
7 Envia account status
8 Envia live-rate pre-transfer status
9 packed weight/dimension data gap
10 free shipping >=299900 still PASS
11 below-threshold shipping status
12 legal 404 count
13 owner legal-data block prepared
14 inventory/XL/customer-data decision block prepared
15 primary language state
16 test gateway state
17 real money processed = NO
18 paid plan/transfer/DNS/publish touched = NO
19 final owner batch count by timing group
20 launch readiness estimate (separate migration readiness vs publish readiness)
21 secret scan / backup result
22 READY FOR 03O YES/NO
23 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

When complete:
- update `ai-handoff/claude-result.md`;
- archive `ai-handoff/archive/03N-result.md`;
- set LAST_COMPLETED_PHASE: 03N / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03O / STATUS: READY_FOR_CHATGPT_REVIEW;
- push handoff via established bridge;
- send exactly `HANDOFF READY 03N`;
- finite +1/+2/+5 checks; continue only after ChatGPT publishes 03O.

FAIL-SAFE
If Wompi/Envia/Search & Discovery are blocked by an owner click, navigate to the exact screen and ask for ONE simple action. If blocked by transfer/plan limitations, document once and continue. Never idle on a blocker and never infer `not available` when the official app/provider exists but is incompatible with the current store state.