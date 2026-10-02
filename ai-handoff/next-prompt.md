# NEXT PROMPT

STATUS: READY_FOR_03R_POST_LAUNCH_REVENUE_MEASUREMENT_AND_STABILIZATION
PHASE: 03R-POST-LAUNCH-REVENUE-MEASUREMENT
MODEL: SONNET 5.5

CHATGPT REVIEW 2026-10-02 ~12:07 America/Bogota
- 03Q launch evidence reviewed: public custom domain, Wompi LIVE real-payment smoke test, DNS cutover, TLS, RC1.10 publication and PL-1.0 real-domain certification are supported by `claude-result.md` and backup evidence references.
- Proceed directly with 03R. Do NOT repeat 03P/03Q unless a concrete regression appears.
- IMPORTANT TIMING GAP: the current result has category estimates but does NOT yet satisfy Daniela's requirement for a gate/task timing table plus total wall-clock elapsed time from the official 07:30 America/Bogota phase start. Reconstruct this from tool marks/checkpoints without double-counting parallel agents. Report for each meaningful gate/task: start, end, wall-clock duration, classification (ACTIVE WORK / OWNER WAIT / PLATFORM WAIT / AVOIDABLE SYSTEM-ORCHESTRATION IDLE), and evidence/source. Also report total wall-clock elapsed from 07:30 to the relevant handoff/certification timestamp, and reconcile overlaps explicitly. Preserve the known avoidable idle 09:03:30–09:41:14 = ~37m44s. Do not invent precision where logs do not support it; label estimates.
- Continue safe/reversible work while reconstructing timing; timing reconciliation must not create a global pause.

OWNER OPERATING RULE — MINIMIZE DANIELA'S INVOLVEMENT
Claude executes EVERYTHING technically possible. Daniela intervenes ONLY for true owner-only blockers: login/authentication/MFA/passkeys/captcha; entering private credentials/secrets directly into provider UI; explicit approval of real-money spend/refunds/charges/Envia funding or labels; legally consequential owner/business decisions that cannot be inferred; or provider-enforced owner-only actions. Do not ask Daniela to perform routine inspection/clicking/testing Claude can do. Batch unavoidable owner actions.

NO GLOBAL PAUSE
If one lane is blocked, park only that lane and continue every safe independent lane.

PRIMARY OBJECTIVE
Make revenue measurable and operations stable. NO PAID META ADS until attribution is independently validated and duplicate Purchase events are ruled out.

LANE A — CLOSE LAUNCH TEST #1002
Verify Shopify #1002 and matching LIVE Wompi transaction. If same-day annulment is available and requires owner consent, emit exactly `OWNER_ACTION_REQUIRED_03R_WOMPI_1002` with one concise manual action and why. Otherwise continue all safe checks. Never move money without explicit owner approval. After authorized closure, reconcile Shopify/Wompi, inventory/accounting, delete the temporary product when safe, and record actual LAUNCH TEST COST.

LANE B — META / FACEBOOK & INSTAGRAM OFFICIAL SHOPIFY INTEGRATION
Use current official Shopify/Meta documentation. Install/enable the official integration if needed. Claude handles every routine screen; Daniela only handles login/MFA/authorization or identity-bound asset selection. Connect the correct existing business portfolio/Page/Instagram/ad account/pixel-or-dataset/commerce assets; do not create duplicates. Preserve domain verification. Do not launch campaigns or spend money. If owner authentication is the only blocker, emit exactly `OWNER_ACTION_REQUIRED_03R_META_AUTH` and state only the login/MFA action required and why; keep all other lanes running.

LANE C — ATTRIBUTION / EVENT VALIDATION
Prove, not merely configure: session/landing visit, ViewContent/product view, AddToCart, InitiateCheckout/begin checkout, Purchase, correct COP value, order/event identifiers where available, UTM survival/reconciliation, and ONE logical Purchase per order with browser/server/native deduplication. Prefer #1002 evidence before proposing any new real-money test. Never create another paid test without explicit approval.

PAID-MEDIA ACCEPTANCE GATE
Do not mark ready until official Meta integration is connected to correct assets, production domain verified, ViewContent/AddToCart/InitiateCheckout/Purchase observed, Purchase value/currency correct, duplicate counting ruled out, UTM path tested, Shopify revenue/order reconciled, and owner dashboard documented. Missing proof = GAP, not PASS.

LANE D — OWNER REVENUE DASHBOARD
Validate a simple weekly view covering spend, sessions/landing views, product views, add-to-cart rate, checkout-start rate, conversion rate, purchases/orders, revenue, AOV, CPA/CAC, ROAS, MER, refunds/cancellations, campaign/creative/product performance where supported, and funnel leakage. Do not invent data.

LANE E — UNIT ECONOMICS
Populate verified inputs only: selling price, landed/product cost, Shopify external-payment fee if applicable, actual Wompi fee structure, shipping subsidy, packaging/handling, refunds/returns, platform/app allocation. Calculate contribution before ads, break-even CPA, break-even ROAS, and contribution after ads at sample CPA levels. Missing owner/business inputs remain FALTA_DATO.

LANE F — COOKIE/PRIVACY/CONSENT D13
Use current authoritative Colombian and platform sources. Audit Shopify Customer Privacy and storefront behavior; remove stale old-stack vendor references only when accurate replacement facts are known. Implement appropriate consent behavior if required/prudent for tracking. If a genuinely legal owner choice remains, emit `OWNER_ACTION_REQUIRED_03R_PRIVACY_DECISION` with the exact plain-Spanish choice and why; otherwise Claude executes.

LANE G — 72-HOUR POST-LAUNCH MONITORING
Monitor domain/DNS/SSL, storefront/routes, checkout/Wompi LIVE availability, orders/inventory, critical JS/network errors, notifications, analytics continuity, 404/redirect regressions, theme/password state and zero customer IVA. No unnecessary real orders.

LANE H — FIRST REAL CUSTOMER ORDER / ENVIA READINESS
Prepare workflow now. For first genuine order verify paid status/address/SKU/inventory/shipping and prepare Envia. Owner only funds/purchases a real label if required. Do not buy labels for tests.

LANE I — HANDOVER / DOWNGRADE READINESS BEFORE 2026-10-20
Finish simple-Spanish owner manual, DNS/domain recovery, Wompi reconciliation, Envia workflow, inventory/order checks, product editing, refunds/returns, promotions, theme-safe editing, email/notifications, backup/restore, credential-location map without secrets, app/service/cost/renewal register, monitoring checklist, failure playbook and CLAUDE-DOWNGRADE-READINESS. Standardize away unnecessary bespoke dependencies.

GUARDRAILS
Keep customer IVA zero while owner remains NO RESPONSABLE DE IVA unless owner/accountant changes instruction. Do not alter product designs/variants/prices/discounts/shipping/inventory outside established rules. Do not start paid ads. Do not touch certified lab/inactive launch store, main/merge/PR, billing, DNS, publication, Wompi LIVE state, real money or irreversible actions without explicit owner approval.

REPORTING
Update `ai-handoff/claude-result.md` and status checkpoints after meaningful milestones with exact evidence, connected assets (privacy-safe IDs/names only), tests, event counts/results, dedup findings, remaining gaps, owner blockers and the reconciled timing table. When Meta + analytics acceptance gates pass, write exactly:
`HANDOFF READY 03R-PAID-MEDIA-MEASUREMENT-CERTIFICATION`
for independent ChatGPT review before any paid campaign.