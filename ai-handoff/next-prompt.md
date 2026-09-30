# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03O
PHASE: 03O — PRE-TRANSFER OWNER DATA CLOSURE + TRANSFER-READY GATE
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03N APPROVED BY CHATGPT.

AUTHORITATIVE 03N STATE
- ONLY launch target: Client Transfer Store `Radaelli Swimwear` in Colombia.
- Colombia / COP / America-Bogota / metric-kg intact.
- RC1.10 remains UNPUBLISHED and parity 98/98.
- Catalog: 29 products / 98 variants / 95 images.
- Collections/metafields/navigation/51 redirects migrated.
- Exactly 4 legal destinations remain intentionally missing: `/envios`, `/terminos`, `/privacidad`, `/cookies`.
- Wompi official traditional Shopify route IS installed and TEST MODE works.
- Wompi sandbox E2E PASS: test order #1002, COP 367,840, free shipping, no real money; archived.
- Critical Wompi finding: the Wompi Events URL is required or an approved payment may not create the Shopify order. Sandbox URL is configured and proven. Production Events URL still must be configured before live payments.
- Shopify Search & Discovery installed.
- Envia account exists and Envia app is installed but cannot currently link the Client Transfer Store (`No encontramos tu tienda`). No live rates below COP 299,900 yet.
- Free shipping >= COP 299,900 remains PASS.
- Orders below COP 299,900 currently have NO shipping method. Do not invent a flat rate.
- Product/variant shipping weight is still 0.0 kg and packed dimensions are not yet owner-supplied.
- Shopify test gateway and Wompi test mode remain active; no real money.
- No transfer, paid plan, billing card, DNS cutover, password removal or theme publish yet.
- Backup branch current; no main, no PR; secret scan clean.

CURRENT OFFICIAL FACTS VERIFIED BY CHATGPT BEFORE 03O
Re-check current UI/docs before acting.
1. Wompi official Shopify documentation requires an Events URL for status notifications and instructs configuring the Shopify webhook URL in BOTH Production and Test environments. Production and Sandbox are separate environments. Never expose or copy owner keys/secrets.
2. Shopify third-party carrier-calculated shipping (CCS) currently requires:
   - Advanced or Plus: included;
   - Grow: available with annual billing or an additional monthly CCS fee;
   - Basic/Starter: not available.
3. Calculated shipping depends on shipment weight/dimensions/destination plus carrier/app configuration. Do not assume Envia will work until post-transfer plan eligibility and app linkage are actually verified.

PRIMARY OBJECTIVE
Close EVERY launch-blocking owner fact/decision that can be resolved BEFORE transfer, apply all resulting safe changes autonomously, and leave the store at a clean `TRANSFER_READY` gate.

03O MUST NOT transfer the store, choose/pay for a Shopify plan, enter a billing card, connect/cut DNS, remove storefront password, publish the theme, turn Wompi live, or process real money. Those belong to 03P+ after ChatGPT approval.

CRITICAL OPERATING RULE — CLAUDE DOES THE WORK
Daniela does NOT want routine navigation delegated to her.
- Claude performs all Shopify/Wompi/Envia navigation and configuration the authenticated session allows.
- Daniela only supplies facts/decisions or performs ONE simple owner-only login/OAuth/save/permission click when the platform enforces it.
- Do not ask separate questions one by one.
- Present ONE compact owner batch only after autonomous verification below is complete.
- After Daniela responds, apply everything possible immediately without asking again.

ONE PROCESS ONLY
- No subagents.
- No workflows.
- No broad audit.
- No main/merge/PR.
- One write/config wave at a time with verification.

STEP 1 — AUTONOMOUS PRE-BATCH VERIFICATION
Before asking Daniela anything:
A. Re-verify launch store baseline: Colombia/COP/Bogota, RC1.10 unpublished, 29/98/95, parity 8/8, 51 redirects.
B. Run the missing targeted Search & Discovery smoke on Search + one collection using the unpublished theme preview if access is available. Record PASS/FAIL; fix only deterministic reversible config issues.
C. Re-open Envia app read-only and confirm whether the same store-link blocker remains. Do not repeatedly retry more than needed and do not select a paid plan.
D. Re-open Wompi configuration read-only and confirm TEST mode remains active and no live production payment mode was enabled accidentally.
E. Confirm the exact public Events URL required by Wompi's current official Shopify docs. Do not expose keys.

STEP 2 — WOMPI PRODUCTION EVENTS URL (PREPARE NOW; NO LIVE PAYMENTS)
The Events URL is NOT a secret and is launch-blocking.
- Navigate to the Wompi Production environment's developer/transaction-tracking configuration if permitted.
- Configure the official Shopify Events URL documented by Wompi for the traditional Shopify integration.
- If Wompi requires Daniela to log in or make the final owner save/approval click, navigate to the exact screen and ask only for that ONE action.
- Do NOT enter/read/copy production keys.
- Do NOT disable test mode or process live money.
- Verify only that Production now has the Events URL saved; do not run a real transaction.

STEP 3 — ONE CONSOLIDATED OWNER BATCH
After Steps 1–2 are exhausted, ask Daniela for ONE response containing ONLY the unresolved pre-transfer launch facts/decisions below. Keep language simple. Do not make her navigate anywhere.

### 03O OWNER BATCH — ask together once

A. SHIPPING WEIGHT / PACKAGE
Ask for real packed measurements, in metric units:
1. Standard package length (cm)
2. Width (cm)
3. Height (cm)
4. Packed shipping weight model:
   - either ONE verified packed weight (grams) that safely represents one swimsuit order, if she intentionally wants one standard shipping weight;
   - OR actual packed weights by product/talla if they differ materially.
Do not invent. Explain in one sentence that Envia needs these to quote real shipping under COP 299,900.

B. LEGAL FACTS + APPROVAL
Ask only for factual values the existing four draft pages require:
1. Legal/business name to publish
2. NIT (if applicable)
3. Legal/contact address she authorizes to publish (or explicitly say she does NOT want a street address published if the drafts allow an alternative)
4. Legal representative, only if the prepared draft actually requires it
5. Approval decision for each existing sourced draft: Privacy / Terms / Shipping / Cookies = `APPROVE AS DRAFTED` or `REVIEW LATER`
Do not claim legal compliance; do not invent missing facts. If she chooses REVIEW LATER on a launch-required page, classify it as a legal launch blocker.

C. INVENTORY + XL
Ask:
1. Inventory strategy: `SELL WITHOUT LIMIT` OR provide quantities for variants.
2. Pending XL variant `LG-AUR-000001-XL`: `KEEP` or `REMOVE`.
If she chooses quantities and does not provide them in the same response, preserve pending state; do not guess.

D. HISTORICAL DATA
For each type answer `MIGRATE` or `DO NOT MIGRATE`:
- customers
- historical orders
- discount/coupon records where technically migratable
- newsletter subscribers
- blog/content history
Do not migrate PII until explicit MIGRATE and a supported source/export path are both confirmed.

E. ACCESSIBILITY C4
Present the measured issue succinctly: white button text on sand was measured ~1.69:1.
Ask her to choose ONE:
- `A` keep sand background, change button text to dark (prepared option; measured high contrast);
- `B` keep white text, darken sand sufficiently;
- `C` keep current appearance and explicitly defer/accept the accessibility issue.
Do not choose for her.

Do NOT include plan, billing, domain, GA4/Meta, wishlist account-sync, or other optional items in this batch. Those are not needed to close pre-transfer facts.

STEP 4 — APPLY OWNER ANSWERS AUTONOMOUSLY
Once Daniela responds, do NOT ask for confirmation again unless a new irreversible/security gate appears.

A. Shipping data
- Save real package dimensions in the deterministic shipping package/config artifact.
- Apply real product/variant shipping weights according to her selected model using existing tooling.
- If Shopify requires inventory/location OAuth to update weight fields, navigate to owner OAuth and ask for one click.
- Verify 98/98 variants have the intended weight state; no guessed values.
- Do not claim Envia live rates work yet; actual linkage remains post-transfer/plan-dependent.

B. Legal
- Substitute only owner-provided facts into the four existing sourced drafts.
- If approved, create/publish the four Shopify pages in the PRIVATE/password-protected launch store, restore their Help menu items, and validate all 4 formerly intentional legal redirects.
- Target legal 404 count after approved creation: 0.
- If any draft is not approved, keep it unpublished and report the exact blocker.
- Never expose private credentials or non-approved private address data in GitHub/handoff.

C. Inventory / XL
- Execute deterministic post-decision tooling.
- SELL WITHOUT LIMIT means configure exactly the previously prepared untracked/unlimited behavior; do not fabricate stock counts.
- If quantities were supplied, apply exactly those quantities only.
- KEEP/REMOVE XL exactly as Daniela chooses; rerun catalog parity/count validation and document resulting expected variant count if REMOVE changes 98.

D. Historical data
- For every MIGRATE decision, first determine whether a supported export/source actually exists and whether Shopify import/API supports the target data safely.
- Prepare/migrate only what is explicitly authorized and technically supported before transfer.
- Do not expose PII in GitHub evidence/handoff. Use counts/hashes only.
- If Shopify/client-transfer limitations require post-transfer migration, classify it clearly and prepare the exact post-transfer procedure.

E. Contrast
- A: apply prepared Option A patch.
- B: create a minimal WCAG-compliant darkened-sand patch while preserving brand intent.
- C: make no visual change; record owner-deferred accessibility risk.
If A/B changes theme files:
- build RC1.11 (or next single sequential RC);
- Theme Check 0/0;
- targeted regression + mutant for contrast behavior;
- deterministic build twice same hash;
- upload UNPUBLISHED only;
- verify remote parity;
- RC1.10 remains rollback.

STEP 5 — CLEANUP SAFE PRE-TRANSFER BLOCKERS
After owner answers are applied:
- re-run store parity;
- content/link check;
- targeted Home/PDP/Collection/Search/Cart smoke at 390 + 1440 minimum (use broader widths only if a theme change warrants it);
- confirm Wompi remains TEST MODE and Shopify test gateway remains test-only;
- confirm free shipping >= COP 299,900 still works by configuration/evidence; do NOT create another order unless a changed shipping/payment config requires it;
- confirm Envia remains installed/account-linked as far as current store state permits, but do not claim live rates below threshold until post-transfer CCS is proven.

STEP 6 — TRANSFER-READY GATE
03O may be marked complete only when every pre-transfer launch blocker is either DONE or explicitly OWNER-DEFERRED with a reason.

Required TRANSFER_READY evidence:
1. Correct Client Transfer Store, Colombia/COP/Bogota.
2. Current RC candidate unpublished + parity PASS.
3. Catalog/collections/meta parity PASS after owner changes.
4. Wompi sandbox already PASS and Production Events URL saved.
5. Free shipping >=299900 preserved.
6. Real shipping weight/package data stored/applied OR explicitly still owner-missing.
7. Legal pages: 0 legal 404 if approved, otherwise exact unresolved legal blocker.
8. Inventory/XL decision applied or exact missing quantities blocker.
9. Historical data decisions recorded/applied/prepared.
10. Search & Discovery smoke result recorded.
11. Envia status truthfully classified as PRECONFIGURED / POST-TRANSFER CCS REQUIRED unless linkage begins working.
12. No real money, transfer, plan, billing, DNS, publish, or password removal.

STEP 7 — PREPARE 03P TRANSFER/PLAN DECISION, BUT DO NOT EXECUTE
Prepare a concise transfer runbook for 03P.
At transfer time, re-check the CURRENT Shopify plan screen and official docs. For Daniela's required live Envia rates, compare only plans/options that actually support third-party CCS at that moment:
- Grow annual billing or Grow + CCS fee, if offered;
- Advanced;
- Plus only if genuinely relevant (do not upsell or recommend unnecessarily).
Basic/Starter must not be selected if live third-party calculated rates remain a hard requirement and Shopify still excludes CCS on those plans.
Do not choose or pay for a plan in 03O.

STEP 8 — REPORT / BACKUP / HANDOFF
Secret-scan and update `shopify-migration-backup`; no main, no PR.
Create `shopify-migration/theme/03O-pretransfer-owner-closure-report.md` with at least:
1 model/elapsed
2 store baseline
3 Search & Discovery smoke
4 Wompi Production Events URL saved YES/NO
5 owner batch answered YES/NO
6 packed dimensions/weight result
7 legal facts/approval result
8 legal pages + intentional 404 count
9 inventory strategy result
10 XL result + resulting catalog count
11 historical data decisions/result
12 contrast decision/result
13 current RC + hash/parity
14 Envia state
15 below-threshold shipping state
16 free shipping >=299900 state
17 Wompi mode still TEST
18 real money = NO
19 transfer/plan/billing/DNS/publish touched = NO
20 remaining PRE-transfer blockers count
21 exact 03P transfer-time blockers
22 TRANSFER_READY YES/NO
23 READY FOR 03P YES/NO
24 secret scan/backup
25 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

HANDOFF RULE
If owner batch is still unanswered when all autonomous work is exhausted:
- DO NOT send `HANDOFF READY 03O`.
- set status `OWNER_ACTION_REQUIRED_03O` and place the ONE consolidated batch in the Claude response.
- resume automatically after Daniela answers.

Only when 03O reaches TRANSFER_READY:
- update `ai-handoff/claude-result.md`;
- archive `ai-handoff/archive/03O-result.md`;
- set LAST_COMPLETED_PHASE: 03O / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03P / STATUS: READY_FOR_CHATGPT_REVIEW;
- push handoff;
- send exactly `HANDOFF READY 03O`;
- finite +1/+2/+5 checks; continue only after ChatGPT publishes 03P.

FAIL-SAFE
Do not transfer or bill merely to unblock Envia. Do not invent weights, legal data, inventory or shipping rates. Do not process live Wompi transactions. Keep owner interruptions consolidated and minimal.