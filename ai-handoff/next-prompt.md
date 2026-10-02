# NEXT PROMPT

STATUS: READY_FOR_03R_META_PURCHASE_VALIDATION
PHASE: 03R-POST-LAUNCH-REVENUE-MEASUREMENT
MODEL: SONNET 5.5

CHATGPT REVIEW 2026-10-02 ~17:10 America/Bogota

03Q is already launched/certified; do not repeat 03P/03Q. Meta/Shopify integration is connected to the existing `Radaelli Swimwear Web` dataset 1415307240666037 and current production evidence supports PageView, ViewContent, AddToCart and InitiateCheckout through the official Shopify partner integration. META_ERROR_1 and META_ERROR_2 were resolved; META_ERROR_3 was a reporting delay and resolved when current browser+server events appeared. Paid media remains gated only because Purchase has not yet been proven end-to-end.

OWNER AUTHORIZATION NOW EXISTS
Read `ai-handoff/owner-authorization-meta-purchase-test.md` before proceeding. Daniela has explicitly authorized ONE real-money minimal Purchase validation test, target COP 5,000, superseding the earlier decision to wait for a customer order. Daniela herself must enter payment/card data and give final payment consent. This authorization does NOT authorize ads, billing changes, DNS/domain changes, publication changes, additional real-money tests, or irreversible actions beyond the specifically authorized minimal purchase and least-cost cleanup described in that file.

IMMEDIATE SAFE NEXT STEP
Prepare the single authorized Purchase test completely without asking Daniela to perform routine setup. Use a temporary internal/test product only if needed; do not alter real catalog prices, inventory, shipping, tax, or customer-facing products. Preserve a UTM-tagged entry path so order attribution can be checked. When and only when the checkout is ready for owner payment, emit `OWNER_ACTION_REQUIRED_03R_META_PURCHASE_PAYMENT` with the exact COP amount and the single action Daniela must perform: enter her payment data and approve that one charge. Continue any independent safe lanes while waiting.

AFTER PAYMENT
Prove with timestamped evidence: Shopify order/payment, Wompi LIVE transaction, Meta Purchase, value and currency COP, order/event correlation, one logical Purchase after browser/server/native deduplication, UTM/order attribution, notifications as applicable, and no unexpected catalog/inventory/tax/shipping changes. Record both browser/server delivery evidence and final deduplicated logical count; do not infer dedup solely from event IDs. If Purchase is missing, duplicated, wrong value/currency, UTMs are lost, Shopify/Meta disagree, or custom CAPI/code appears necessary, write `CHATGPT_REVIEW_REQUIRED_META` before architectural changes.

CLEANUP
Attempt same-day annulment first if available. If any refund/annulment requires a new owner approval, emit the exact `OWNER_ACTION_REQUIRED_*` with amount/consequence before moving money. Delete/retire the temporary product, clear cart, verify catalog returns to 29 products, and record actual META TEST COST. Do not launch paid ads yet.

PAID-MEDIA GATE
Only after Purchase passes all acceptance criteria write exactly `HANDOFF READY 03R-PAID-MEDIA-MEASUREMENT-CERTIFICATION` for independent ChatGPT review. ChatGPT, not Claude, will give the final measurement-gate approval before paid campaigns.

TIMING ACCOUNTING — STILL REQUIRED
The prior 03Q result did not yet contain the requested gate/task timing table and total wall-clock elapsed from the official 07:30 America/Bogota start. Reconstruct it from tool marks/checkpoints without double-counting parallel agents. For each meaningful gate/task report start, end, wall-clock duration, classification (ACTIVE WORK / OWNER WAIT / PLATFORM WAIT / AVOIDABLE SYSTEM-ORCHESTRATION IDLE), and evidence/source. Report total wall-clock elapsed from 07:30 to the relevant handoff/certification timestamp and reconcile overlaps. Preserve the known avoidable idle 09:03:30–09:41:14 = ~37m44s. Label estimates; do not invent precision. This timing work must not block the Purchase test or other safe work.

OWNER OPERATING RULE
Claude executes everything technically possible. Daniela intervenes only for true owner-only blockers: authentication/MFA/passkeys/captcha, private credentials/payment data, explicit real-money approval, legally consequential owner-only decisions, or provider-enforced owner actions. Never ask her for routine inspection/testing Claude can perform. No global pause: park only blocked lanes and continue safe independent work.

GUARDRAILS
Keep customer IVA zero while owner remains NO RESPONSABLE DE IVA. Do not alter product designs/variants/prices/discounts/shipping/inventory outside the isolated authorized test. Do not start paid ads. Do not touch certified lab/inactive launch store, main/merge/PR, billing, DNS, publication, or unrelated real-money actions without explicit owner approval.

REPORTING
Update `ai-handoff/claude-result.md` and `ai-handoff/status.md` after meaningful milestones. Preserve the full error/fix/retest sequence, evidence, timing table, actual test cost, and remaining gaps.