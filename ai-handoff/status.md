PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
CURRENT_MODEL: SONNET 5.5
STATUS: 03Q_SAFE_PRELAUNCH_WORK_IN_PROGRESS_NO_GLOBAL_PAUSE
USER_ABSENCE_MODE: OFF

LAUNCH-GATE CORRECTION — CHATGPT REVIEW 2026-10-02
- Before any DNS edit, first use Shopify Admin > Settings > Domains > Connect existing domain for radaelliswimwear.com and read the EXACT store-specific DNS requirements Shopify presents. Connecting the domain while DNS still points to Vercel is safe preparation; do NOT make it primary/public yet.
- Shopify current official guidance lists default targets IPv4 23.227.38.65, IPv6 AAAA 2620:0127:f00f:5::, and www CNAME shops.myshopify.com.; Shopify may present a region-specific supported A value. Therefore do NOT blindly edit only A + CNAME from a stale runbook. Capture exact A/AAAA/CNAME requirements shown for THIS store immediately before cutover, preserve MX/TXT/email records, and retain exact Vercel rollback values.
- The proposed real Wompi smoke test remains owner-gated. A temporary hidden low-value product is acceptable if no lower-risk equivalent exists, but NEVER promise the test is cost-free. Wompi support states a completed refund can leave the transaction commission + IVA on that commission charged to the merchant. Same-day immediate annulment may avoid settlement if the card network allows it, but that is not guaranteed. Before the owner pays, show the exact amount she will charge and disclose the possible small non-refundable fee. After approval/payment, attempt immediate annulment first when supported; otherwise process the required refund/cleanup and record any actual cost as LAUNCH TEST COST.
- Keep this distinct from Radaelli customer IVA: owner is NO RESPONSABLE DE IVA and the store must collect/add zero customer IVA; the Wompi commission may itself carry IVA as a provider fee.
- Meta/Facebook & Instagram connection is REQUIRED before paid Meta spend, but it does not need to hold the public Shopify launch if all other launch gates pass and Daniela will not start paid traffic until tracking is connected/validated. No paid campaign should start without trustworthy Purchase attribution and duplicate-event check.

REVENUE-FIRST OPERATING PRIORITY — OWNER UPDATE 2026-10-02
- Daniela's employment has ended and Radaelli Swimwear is now expected to become her primary near-term source of income.
- Therefore the immediate business objective is to START SELLING AS SOON AS SAFELY POSSIBLE.
- Prioritize launch-critical work that enables real customer traffic, checkout, payment, fulfillment and trustworthy conversion. Defer non-blocking polish, cosmetic refinements, historical-data migration and low-value perfectionism until after the store is live and stable.
- Do NOT cut corners on payment safety, inventory integrity, domain/DNS correctness, shipping, legal/contact minimums, tax/IVA correctness, storefront accessibility, rollback readiness or post-launch verification.
- Once only owner-gated launch actions remain, surface them immediately in ONE concise owner batch so there is no idle time.
- After launch, immediately shift into revenue-enablement/stabilization: conversion checks, analytics readiness, promo/discount management, customer contact flows, product merchandising, first-order operations, and a short post-launch monitoring window.
- Continue MAXIMUM SAFE PARALLELISM with NO GLOBAL PAUSE.

PAID-MEDIA MEASUREMENT / ATTRIBUTION — LAUNCH-CRITICAL REQUIREMENT
- Daniela explicitly requires complete commercial measurement so paid traffic can be judged by real return, not vanity metrics.
- Do NOT consider the revenue stack launch-ready until the storefront can reliably measure the funnel at minimum: sessions/landing views -> product views -> add to cart -> begin checkout -> purchase/order -> revenue.
- Prepare and verify Meta Ads attribution readiness before paid campaigns are scaled. Use the most standard Shopify-supported integration available and avoid unnecessary custom tracking when a native/official path exists.
- Required metrics/reporting after launch: spend, impressions, reach, CPM, link CTR, CPC, landing-page views/sessions, product views, add-to-cart rate, checkout-start rate, purchase conversion rate, number of purchases, revenue, AOV, CPA/CAC, ROAS, MER (total revenue / total ad spend), refund/cancellation impact where applicable, and by-product/creative/campaign breakdown when source data supports it.
- Preserve UTMs/campaign identifiers where possible so traffic source and campaign can be reconciled with Shopify order/revenue data.
- Verify no duplicate purchase events before accepting attribution as trustworthy.
- Create a simple owner dashboard/checklist for Daniela that answers: (1) how much was spent, (2) how much revenue came back, (3) how many purchases, (4) CPA/CAC, (5) ROAS, (6) where the funnel is leaking, (7) which products/creatives/campaigns are producing sales, and (8) whether to pause, keep testing, or scale based on data.
- Do not invent profitability thresholds yet: final break-even ROAS / allowable CPA must be calculated from real unit economics (product cost, payment fees, shipping subsidy, returns/discounts, Shopify/app costs as relevant). Gather/structure the inputs needed for that calculation and flag any missing cost data.
- This measurement requirement is directly tied to revenue-first operation and must not be deferred as post-launch polish.

FINAL DEADLINE / OPERATING OBJECTIVE — 2026-10-20
- Daniela's current high-capacity Claude subscription ends on 2026-10-20. She intends to downgrade afterward to a much lower-cost plan used mainly for occasional troubleshooting, promotion changes, validation and maintenance assistance.
- Therefore the project objective is NOT merely to launch. By 2026-10-20 the Shopify operation must be production-ready, stable, documented, recoverable, and maintainable by a nontechnical owner with only occasional AI assistance.
- Prioritize all high-compute/high-complexity work BEFORE 2026-10-20. Do not defer architecture, migration, validation, hardening, documentation, recovery procedures, or recurring maintenance setup that can reasonably be completed now.
- Required before deadline, in addition to launch: complete launch certification; rollback/recovery runbook; DNS/domain documentation; payment/Wompi troubleshooting checklist; Envia first-order/label workflow; inventory and order sanity-check guide; promotion/announcement/discount update guide; theme-safe-edit guide; email/sender/notification guide; backup/restore strategy; list of credentials/secrets locations WITHOUT storing secrets; list of apps/services/costs/renewal dates; post-launch monitoring checklist; common failure playbook; and a concise OWNER MAINTENANCE MANUAL written for a nontechnical user.
- Create a final 'Claude downgrade readiness' checklist proving the store can be managed after 2026-10-20 using lower-capacity support for routine incidents and adjustments.
- If any item would create future dependence on custom code or a proprietary manual process, simplify/standardize it now where safely possible.
- Keep time accounting for all work through final stabilization.

TIMING ACCOUNTING — IMPORTANT
- Daniela explicitly requires every elapsed interval to be accounted for in the final summary.
- Record ACTIVE WORK, OWNER WAIT, PLATFORM WAIT, and AVOIDABLE IDLE/PAUSE as separate categories; never hide idle time inside active work.
- Confirmed avoidable idle interval: approximately 37m44s SYSTEM/ORCHESTRATION AVOIDABLE IDLE, based on last Claude activity ~09:03:30 and restart 09:41:14. Keep this separate from owner/platform wait and productive time.

CHATGPT FORMAL APPROVAL — 2026-10-02
03P-NEW-STANDARD-STORE is FORMALLY APPROVED after independent GitHub review and micro-verification.

OWNER CONTINUATION INSTRUCTION — 2026-10-02
Daniela explicitly instructed that Claude must keep working continuously and not stop. Treat this as GO to execute ALL SAFE, REVERSIBLE, NON-PUBLIC 03Q pre-launch certification/preparation now. It is NOT authorization for public/live/irreversible cutover actions.

NO-GLOBAL-PAUSE RULE
- Do not sit idle while any safe independent 03Q task remains.
- Use one coordinator and parallel safe independent lanes where useful.
- If one lane is blocked by owner input or a hard gate, park ONLY that lane and continue every other safe lane.
- Accumulate owner/manual needs into one batch whenever possible; do not drip-feed routine clicks.
- Report blockers through GitHub for ChatGPT relay.
- Do not repeat already-passed 03P work unless a concrete 03Q regression requires it.

SAFE 03Q WORK AUTHORIZED NOW
- Implement and verify D8 zero-IVA configuration consistent with owner-stated NO RESPONSABLE DE IVA status, preserving all catalog prices and adding no 19% rate.
- Freshly prove checkout adds/collects no IVA/tax.
- Audit seller contact/legal-notice fields and prepare exact proposed values/text; do not invent owner/legal identity data.
- Audit announcement bar 20% and prepare decision/evidence without changing commercial promise unless already approved.
- Audit verified sender/staff notification readiness and prepare exact remaining owner action if any.
- Connect the existing domain inside Shopify ONLY as a non-public preparation step, read/capture authoritative store-specific DNS requirements, and preserve rollback values; do not edit Hostinger DNS yet.
- Verify production-readiness prerequisites for Wompi LIVE without activating LIVE or exposing secrets.
- Prepare post-launch certification scripts/checklists and rollback plan.
- Prepare/verify analytics + paid-media attribution readiness as defined above, without making public/live ad changes that require owner approval.
- Refresh final prelaunch parity/health checks where useful and update evidence/report.
- Continue any other safe, reversible, private preparation that reduces launch time.

APPROVED 03P EVIDENCE
- Official store is a normal Shopify merchant store under the owner account, based in Colombia.
- Colombia / COP / America-Bogota / kg confirmed.
- Theme RC1.10 remains UNPUBLISHED with parity 98/98; Horizon remains live while private.
- Catalog: 29 products / 98 variants / 95 images.
- Inventory: 98/98 tracked / 128 units / 0 discrepancies / 500 g x98.
- Collections, pages, policies, menus, 51 redirects, Search & Discovery, regional shipping, threshold 299,899 paid / 299,900 free all verified.
- Envia installed+linked; no real label purchased.
- Wompi TEST E2E #1001 PASS: test=true, SALE SUCCESS, COP 169,820, customer-confirmation event + staff-new-order event, no duplicate order, inventory restored, order cancelled/archived, 0 real money; Wompi remains TEST.
- Store remains private/password protected.

D8 TAX / IVA — OWNER DECISION RESOLVED 2026-10-02
- Daniela explicitly states she is currently NO RESPONSABLE DE IVA in Colombia.
- Business requirement for launch: Radaelli Swimwear must NOT charge/add/collect IVA from customers while that status remains current.
- D8 zero-IVA implementation verified in 03Q checkpoint 1: taxesIncluded=false, taxShipping=false, no Colombian rate created, fresh checkout with no tax line, prices unchanged.

MICRO-VERIFICATION CLOSED
- Location address freshly corrected/verified to Calle 93 #72-71, Barranquilla, Atlántico 080001, CO.
- Shopify technical primary locale = en; market web presence default = es; root / serves Spanish; English alternate /en/.

BACKUP / EVIDENCE
- Final 03P report: shopify-migration/theme/03P-new-standard-store-report.md.
- 03Q prelaunch evidence is being added continuously on shopify-migration-backup.

PUBLIC/LIVE HARD GATES — STILL NOT AUTHORIZED
Until Daniela explicitly approves the specific launch/cutover action, DO NOT:
- modify production DNS/domain records;
- remove storefront password;
- publish RC1.10;
- activate Wompi LIVE / production payment flow;
- run real-money payment;
- buy a real Envia label;
- delete/touch certified lab or inactive launch store;
- touch main/merge/PR.

NEXT ACTION
Claude: continue all safe launch-critical 03Q work continuously and prioritize getting the store revenue-ready as soon as safely possible. Apply the launch-gate correction above before asking the owner to touch DNS or spend real money. Treat analytics/attribution readiness as launch-critical, not cosmetic. When only owner-gated launch steps remain, immediately consolidate them into one concise owner-action batch and flag ChatGPT. Do not spend time on nonblocking polish before launch.

CLAUDE_03Q_CHECKPOINT_1 09:49:07: D8 zero-IVA DONE: Admin > Taxes toggle OFF + saved; API taxesIncluded=false taxShipping=false (= lab); Colombia region not collecting (Manual Tax), no rate created, prices untouched; fresh checkout BRISA NATURAL BEIGE M 199,920 + shipping 9,900 = 209,820 with NO tax line (cart cleared). Health refresh: inventory 98/98 128 uds 0 discrepancies; parity 7/8 (Q8 by design); shipping VERIFIED. Wompi (read-only): Activa, TEST ON, all methods enabled, PayPal inactive; production keys not verifiable without owner toggling. Domains page: only wgcvpd-ib.myshopify.com Principal; domain NOT connected; DNS recon + rollback values recorded in launch-today-runbook.md. Evidence: launch/official-03p/03q-prelaunch-evidence.json, backup head 1e769bfcecdc99c8b8e8b44e63409c9b936b7988. Agents running: legal/identity + announcement-bar audit, post-launch cert scripts. No public/live action.

CLAUDE_03Q_CHECKPOINT_2 09:58:27: legal/identity audit DONE (nothing names the seller; Informacion de contacto + Aviso legal policies absent; phone/company empty; fields F1-F19 only the owner can give; templates with placeholders; nothing invented). Announcement bar 20 percent: 98/98 variants carry compare-at and current price is exactly 80 percent of it (official = lab); #1001 had no discounts (read_discounts scope missing). Timing reconciliation: ~37m44s SYSTEM/ORCHESTRATION AVOIDABLE IDLE. Backup head e04edadef80774358f469e399b073fba18a4b1ba. Remaining safe lane: post-launch certification scripts (agent writing README/rollback). Owner-gated list unchanged in owner-action-batch.md.
CLAUDE_03Q_CHECKPOINT_3 10:13:30: OWNER-GATED LAUNCH BATCH CONSOLIDATED and shown to Daniela in chat at ~10:05 (owner-action-batch.md section L, L1-L9 + one-line summary): GO / old-site pending-orders check / Wompi LIVE toggle + 1 minimal real self-payment / 2 Hostinger DNS records / Meta login for attribution (Customer events page is EMPTY: no pixel installed) / optional D9 seller data. Awaiting her GO + ChatGPT approval; nothing public done. Safe lanes: post-launch certification kit DONE (core+PDP harness+assembler+README+rollback-and-health, offline selftests 120/120, 42/42, 12/12, 23/23; copied to launch/official-03p/post-launch-cert); live smoke test of core script on preview storefront (read-only) in progress; analytics/Meta plan + maintenance manual agents still running.
