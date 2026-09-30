# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03P
PHASE: 03P — STORE TRANSFER + PLAN/CCS ACTIVATION + ENVIA LIVE-RATE PROOF
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03O APPROVED BY CHATGPT. TRANSFER_READY = YES.

AUTHORITATIVE 03O STATE
- ONLY launch target: Client Transfer Store `Radaelli Swimwear`, Colombia.
- Colombia / COP / America-Bogota / metric-kg intact.
- Current theme candidate: RC1.10, UNPUBLISHED, SHA-256 `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`, parity 98/98.
- Catalog: 29 products / 98 variants / 95 images.
- Inventory: tracking enabled 98/98, 128 total units using owner-approved provisional counts. XL KEEP; 98 variants remain.
- Legal: Privacy / Terms / Shipping / Cookies approved and published in the private store; legal intentional 404 count = 0; Help menu = 6 items.
- Search & Discovery installed and targeted smoke PASS.
- Wompi official traditional provider installed. Sandbox E2E PASS (#1002). Wompi remains TEST MODE. Production Events URL reported SAVED by Daniela; do not expose/read production keys.
- Shopify test gateway remains active.
- Envia app installed and account linked; `Tienda ya instalada` confirmed.
- Shipping package currently provisional: 15 × 10 × 5 cm; 500 g applied to all 98 variants. Daniela will refine later.
- Free shipping >= COP 299,900 = PASS.
- Shipping < COP 299,900 = NO METHOD yet; one-prenda checkout says shipping unavailable.
- Business rule is fixed: below COP 299,900 customer pays the REAL destination-calculated Envia rate; do not invent a flat rate.
- Historical data decision = MIGRATE all, but migration/export is deferred and not part of the transfer gate.
- Contrast C4 = owner explicitly deferred/accepted; no theme change.
- No real money, no DNS change, no storefront password removal, no theme publication yet.
- Both QA Dev Stores remain reference only.

CURRENT OFFICIAL SHOPIFY FACTS VERIFIED BY CHATGPT TODAY
Use CURRENT Shopify UI and official docs as source of truth at execution time.
1. Third-party carrier-calculated shipping (CCS):
   - Shopify Grow: available with annual billing OR an additional monthly CCS fee;
   - Shopify Advanced: included;
   - Shopify Plus: included;
   - other plans, including Basic/Starter: not available.
2. A Client Transfer Store becomes merchant-owned after transfer and leaves the Partner organization.
3. After transfer, if Claude/Partner access is lost, use collaborator access; never ask Daniela for her Shopify password.
4. Client Transfer Stores are not eligible for Shopify free trials/promotions after transfer.

PRIMARY OBJECTIVE
Transfer the correct store to Daniela, activate the lowest-cost/currently available Shopify plan option that actually satisfies the hard requirement for third-party CCS, prove that Envia returns a live shipping rate below COP 299,900, and leave the store at a POST_TRANSFER_SHIPPING_READY gate.

03P IS NOT THE PUBLIC LAUNCH PHASE.
DO NOT connect/cut production DNS, remove the storefront password, publish RC1.10, enable real Wompi payments, or intentionally process real money in 03P.

CRITICAL OWNER-INTERACTION RULE
Claude does all reversible navigation/configuration possible.
Daniela only handles actions Shopify legally/security/financially requires from the owner:
- accepting the transfer;
- approving the selected Shopify plan/billing cycle;
- entering billing card/payment information;
- owner authentication/MFA;
- approving collaborator access if post-transfer access is lost.
For each owner gate: navigate to the exact screen first, ask for ONE simple click/input, and resume immediately afterward. Never ask for passwords or secret credentials in chat.

ONE ACTIVE PROCESS ONLY
No subagents. No workflows. No broad audit. No main/merge/PR. Do not alter QA stores.

STEP 1 — FINAL PRE-TRANSFER SNAPSHOT
Before initiating transfer:
1. Verify Colombia/COP/Bogota.
2. Verify RC1.10 unpublished + parity PASS.
3. Verify 29/98/95 and inventory 98/98 / 128 units.
4. Verify 4 legal pages, 0 legal 404.
5. Verify Wompi TEST MODE and Shopify test gateway active.
6. Verify Envia linked but sub-threshold rate still unavailable.
7. Make/update a privacy-safe final pre-transfer backup on `shopify-migration-backup`; no main/PR.
8. Export/pull RC1.10 theme for rollback evidence.
If any critical mismatch appears, fix only deterministic safe issues before transfer.

STEP 2 — INITIATE STORE TRANSFER
Use the official Client Transfer Store transfer flow for the ONLY launch target `Radaelli Swimwear`.
- Do not transfer either QA Dev Store.
- Navigate as far as possible autonomously.
- When Shopify requires Daniela to accept ownership, ask her for that ONE owner action only.
- Verify the recipient/account shown is Daniela's intended merchant account before the irreversible acceptance.
- Do not change domain, theme publication, payments, or storefront password during this step.

STEP 3 — PLAN SELECTION: CCS IS A HARD REQUIREMENT
At the live plan screen, inspect CURRENT prices, billing cycles, CCS eligibility, and any applicable tax/fees.
Only consider options that support third-party CCS now:
A. Grow with annual billing if CCS is included and immediately activatable;
B. Grow monthly + CCS fee only if Shopify explicitly offers/can activate it now and the total cost is known;
C. Advanced if it is the practical compatible alternative;
D. Plus only if there is a separate genuine business requirement; do not upsell it.

Do NOT select Basic/Starter while live Envia calculated rates remain mandatory.

Before financial activation:
- compare the exact CURRENT total cost of the viable options;
- identify the lowest-cost option that meets CCS without a known functional gap;
- present Daniela one concise recommendation with exact current billing commitment and ask for ONE approval.
Do not activate a paid plan without her explicit approval.

If Grow annual is the lowest-cost fully compatible option, prefer recommending it; if current UI shows a different materially better compatible option, use the current facts instead.
If Grow monthly requires contacting Shopify Support to add CCS and cannot be activated immediately, do not assume it will work for launch; classify it accordingly.

Daniela enters billing card/payment details herself. Claude must not read/store/screenshot billing details.

STEP 4 — POST-TRANSFER ACCESS CONTINUITY
Immediately after transfer + plan activation:
- verify merchant ownership / active plan state;
- verify the store is no longer a Client Transfer Store under the Partner organization as expected;
- test whether Claude retains required Admin access.
If access is lost:
1. use the official collaborator-request flow from the Partner/Dev Dashboard;
2. request only the minimum permissions needed for theme, products/inventory, shipping, apps, payments read/config where allowed;
3. ask Daniela only to approve the collaborator request; never ask for her password.
Resume only when safe access is restored.

STEP 5 — VERIFY CCS ELIGIBILITY IS ACTUALLY ACTIVE
Do not infer from the plan name alone.
In Shopify Shipping & Delivery / carrier-app rate configuration:
- verify that third-party carrier-calculated/app shipping is actually available/enabled;
- verify Colombia zone still has free shipping >= COP 299,900;
- preserve that free-shipping rule;
- do not add invented flat/backup rates unless Daniela explicitly changes the business rule.
If the selected plan should support CCS but Shopify still shows it disabled, resolve the specific activation requirement (for example annual billing status or Shopify Support activation) before proceeding.

STEP 6 — ENVIA LIVE RATE PROOF UNDER COP 299,900
Open Envia after transfer and verify the linked store/account.
Use current provisional shipping inputs only because Daniela explicitly approved them for now:
- package 15 × 10 × 5 cm;
- 500 g per variant.
Do not claim these are final physical measurements.

Configure/verify the Envia carrier/app rate inside the Colombia shipping profile as required.
Then run ONE checkout-rate test with exactly one representative swimsuit whose subtotal is < COP 299,900.
Required PASS evidence:
- destination in Colombia;
- checkout in COP;
- a real destination-calculated Envia/app shipping method appears;
- amount is not manually invented by Claude;
- no payment is submitted;
- order is NOT created merely for this rate test.
Record only non-sensitive summary evidence (carrier/rate type and amount if safe); no address/customer PII.

If no rate appears:
- inspect exact Shopify/Envia error once;
- verify CCS registration/service availability, package/weight mapping, origin, zone/profile, and app callback state;
- correct deterministic configuration issues;
- retry a bounded number of times.
If the blocker is external/support-side, document the exact blocker and do not publish the store.

STEP 7 — HIGH-THRESHOLD SHIPPING REGRESSION
After Envia is working below threshold, verify the business rule is still correct:
- subtotal < COP 299,900 => Envia real calculated rate available;
- subtotal >= COP 299,900 => approved free-shipping option remains available.
Avoid creating additional orders unless a checkout payment test becomes strictly necessary. Shipping-rate visibility is sufficient for 03P.

STEP 8 — WOMPI SAFETY AFTER TRANSFER
Do NOT turn Wompi live yet.
- Verify Wompi provider survived transfer.
- Verify TEST MODE remains ON.
- Verify Shopify test gateway state is understood.
- Verify production Events URL remains owner-confirmed; do not expose/read production keys.
If Shopify automatically changes payment availability during transfer, keep/restore a safe test-only state until 03Q.
No real Wompi payment in 03P.

STEP 9 — OTHER POST-TRANSFER CHECKS (TARGETED ONLY)
Check only transfer-sensitive items:
- Online Store remains password/private;
- RC1.10 remains unpublished;
- Colombia/COP/Bogota unchanged;
- products/catalog/inventory intact;
- legal pages and redirects intact;
- Search & Discovery and Envia/Wompi app installations intact.
No broad UI redesign or mega-audit.

STEP 10 — HISTORICAL DATA: DO NOT BLOCK 03P
Owner already decided MIGRATE all historical categories.
Do not let this delay shipping/plan proof.
- Preserve the prepared migration procedure.
- If existing authenticated source access makes a READ-ONLY export trivial and safe after transfer, you may prepare/export counts/hashes only, without committing PII.
- Otherwise leave it explicitly for 03Q/03R with no duplicate owner decision request.
Never expose customer PII in GitHub/handoff.

STEP 11 — POST_TRANSFER_SHIPPING_READY GATE
03P is complete only if all are true:
1. ownership transfer completed to Daniela's merchant account;
2. paid Shopify plan active with verified third-party CCS eligibility;
3. Claude/Partner collaborator access is sufficient to continue;
4. Envia linked post-transfer;
5. one < COP 299,900 checkout shows a real calculated Envia/app rate;
6. >= COP 299,900 free shipping rule remains intact;
7. Wompi remains TEST MODE; no real money;
8. RC1.10 remains unpublished;
9. storefront password remains ON;
10. DNS/domain not cut over;
11. no critical data/config regression.

If transfer succeeds but Envia/CCS still fails, do NOT mark READY FOR 03Q. Set `OWNER_ACTION_REQUIRED_03P` only if a true owner/support action is required; otherwise continue troubleshooting boundedly and report exact blocker.

STEP 12 — PREPARE 03Q, DO NOT EXECUTE CUTOVER
03Q will handle final go-live work, likely including:
- final production Wompi switch and controlled validation;
- turning off test gateways;
- final domain/DNS connection;
- publishing RC1.10;
- storefront password removal;
- final production smoke/analytics/email checks;
- historical-data migration scheduling/execution as safe;
- optional primary-language decision.
Do not perform those in 03P unless ChatGPT explicitly releases them later.

STEP 13 — REPORT / BACKUP / HANDOFF
Secret-scan and update `shopify-migration-backup`; no main, no PR.
Create `shopify-migration/theme/03P-transfer-plan-envia-report.md` containing at least:
1 model / elapsed
2 pre-transfer snapshot result
3 transfer completed YES/NO
4 merchant ownership verified YES/NO
5 selected plan + billing cycle + current price basis (no card data)
6 CCS eligibility verified YES/NO
7 collaborator/admin access after transfer
8 Envia linked after transfer
9 sub-299900 live rate PASS/FAIL + non-sensitive result
10 >=299900 free shipping PASS/FAIL
11 package/weight provisional status
12 Wompi provider retained
13 Wompi TEST MODE still ON
14 real money processed = NO
15 RC1.10 unpublished YES/NO + parity
16 storefront password still ON
17 DNS untouched
18 catalog/inventory/legal parity
19 remaining launch blockers
20 historical-data state
21 POST_TRANSFER_SHIPPING_READY YES/NO
22 READY FOR 03Q YES/NO
23 secret scan / backup
24 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

When complete and only if POST_TRANSFER_SHIPPING_READY = YES:
- update `ai-handoff/claude-result.md`;
- archive `ai-handoff/archive/03P-result.md`;
- set LAST_COMPLETED_PHASE: 03P / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03Q / STATUS: READY_FOR_CHATGPT_REVIEW;
- push handoff;
- send exactly `HANDOFF READY 03P`;
- finite +1/+2/+5 checks; continue only after ChatGPT releases 03Q.

FAIL-SAFE
- Never choose/pay for a plan without Daniela's explicit approval.
- Never ask for or use her Shopify password.
- Never expose billing/payment credentials.
- Never publish merely to test Envia.
- Never switch Wompi to live or move real money in 03P.
- Never invent a shipping rate.
- Keep one active process at a time and minimize owner interruptions.
