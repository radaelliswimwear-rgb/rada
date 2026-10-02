PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
CURRENT_MODEL: SONNET 5.5
STATUS: 03Q_SAFE_PRELAUNCH_WORK_IN_PROGRESS_NO_GLOBAL_PAUSE
USER_ABSENCE_MODE: ACTIVE_GYM_60MIN_CHATGPT_RELAY

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
- Confirmed owner-reported avoidable idle gap occurred after the 03P micro-verification and before Claude resumed 03Q work.
- Last confirmed 03P micro-verification checkpoint: 08:59:46 America/Bogota.
- First confirmed later 03Q checkpoint: 09:49:07 America/Bogota.
- Therefore the full unverified gap window is 49m21s maximum. Daniela confirms Claude was actually stopped for MORE THAN 30 MINUTES inside this window.
- Final timing report must classify this as SYSTEM/ORCHESTRATION IDLE TIME, not owner wait and not productive work. Reconcile exact start/restart timestamps from Claude/session logs if available; until then report: >30m confirmed idle, <=49m21s upper bound.
- Do not erase or merge this interval with parallel-agent runtime.

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
- Prepare domain/DNS cutover plan using store-specific Shopify evidence when accessible without changing DNS; capture rollback values before any future cutover.
- Verify production-readiness prerequisites for Wompi LIVE without activating LIVE or exposing secrets.
- Prepare post-launch certification scripts/checklists and rollback plan.
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
- Safely configure Shopify so checkout adds/collects NO IVA; target taxesIncluded=false if that is the correct harmless representation in Shopify.
- Verify no Colombian tax registration/rate is causing IVA collection and fresh checkout shows NO IVA/tax amount added or separately collected.
- Preserve product prices exactly. Do NOT invent a 19% tax rate.
- If Shopify presents an ambiguous legal/tax choice, stop only that tax subtask and continue all others.

MICRO-VERIFICATION CLOSED
- Location address freshly corrected/verified to Calle 93 #72-71, Barranquilla, Atlántico 080001, CO.
- Shopify technical primary locale = en; market web presence default = es; root / serves Spanish; English alternate /en/.

BACKUP / EVIDENCE
- shopify-migration-backup verified at head 1238b7e3e8ff6b08ead5b488acb0ca1ce33599cf at 03P close.
- Final 03P report: shopify-migration/theme/03P-new-standard-store-report.md.

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
Claude: continue all safe 03Q prelaunch work continuously. Never globally pause because one gated lane is waiting. Update GitHub checkpoints/evidence as work proceeds. When only owner-gated public/live actions remain, consolidate them into one owner-action batch and mark that state explicitly for ChatGPT review.

CLAUDE_03Q_CHECKPOINT_1 09:49:07: D8 zero-IVA DONE: Admin > Taxes toggle 'Incluir impuesto sobre las ventas en el precio...' OFF + saved; API taxesIncluded=false taxShipping=false (= lab); Colombia region not collecting (Manual Tax), no rate created, prices untouched; fresh checkout BRISA NATURAL BEIGE M 199,920 + shipping 9,900 = 209,820 with NO tax line (cart cleared). Health refresh: inventory 98/98 128 uds 0 discrepancies; parity 7/8 (Q8 by design); shipping VERIFIED. Wompi (read-only): Activa, TEST ON, all methods enabled, PayPal inactive; production keys not verifiable without owner toggling. Domains page: only wgcvpd-ib.myshopify.com Principal; domain NOT connected; DNS recon + rollback values recorded in launch-today-runbook.md. Evidence: launch/official-03p/03q-prelaunch-evidence.json, backup head 1e769bfcecdc99c8b8e8b44e63409c9b936b7988. Agents running: legal/identity + announcement-bar audit, post-launch cert scripts. No public/live action.
