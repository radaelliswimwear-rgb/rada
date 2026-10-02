PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CHATGPT_REVIEW_03P_MICROVERIFIED
USER_ABSENCE_MODE: ACTIVE_GYM_60MIN_CHATGPT_RELAY

CHATGPT REVIEW — 2026-10-02
The major 03P evidence is strong, including official store creation in Colombia, theme/catalog/inventory/shipping regression, sandbox Wompi order #1001, notification events, restored inventory, and zero real money. However, ChatGPT found two evidence/report inconsistencies that MUST be resolved before 03P is formally approved.

DO NOT start 03Q public/live steps yet. No DNS, domain cutover, password removal, theme publish, Wompi LIVE, real money, or real Envia label.

MICRO-VERIFICATION REQUIRED — NO OWNER INPUT NEEDED
1) SHOPIFY LOCATION ADDRESS
- Final official sweep `shopify-migration/launch/official-03p/sweep-wgcvpd-ib.json` shows `shopAddress` = Calle 93 #72-71, Barranquilla, but the Shopify `locations.nodes[0].address` fields are null except countryCode CO.
- Certified lab sweep `sweep-radaelli-swimwear-dev.json` shows the Location itself populated with Calle 93 #72-71 / Barranquilla / Atlántico / 080001 / CO.
- The 03P report claims the official Location address was replicated.
ACTION: inspect CURRENT official-store Location state using fresh API/Admin evidence. If Location is actually blank, safely set it to the certified lab address and verify. If the sweep was stale/incorrect, prove the current correct state. Update report/evidence accordingly.

2) LOCALE / PRIMARY LANGUAGE EVIDENCE
- Both final sweep JSON files currently show `en` published+primary and `es` published+non-primary.
- The 03P report claims `es` is published and default/root, `en` alternate `/en/`.
ACTION: inspect CURRENT official-store locale configuration and the actual RC1.10 preview/root behavior. Record Shopify locale API state plus storefront `html lang`, root `/` language/canonical/hreflang behavior as applicable. Reconcile the report so it never claims `es` primary unless fresh evidence proves it. Do NOT silently change the certified business behavior without documenting why.

3) TAX SETTING — DOCUMENT ONLY, DO NOT DECIDE FOR OWNER
- Official final sweep shows `taxesIncluded=true`; lab shows `taxesIncluded=false`.
- This is already documented as D8 and is a 03Q owner/accountant decision. Do not change it during this micro-verification. Ensure it remains prominently flagged as a PRE-LAUNCH decision because it can affect tax treatment even though current totals are identical with no rates configured.

RE-VERIFY AFTER ANY LOCATION/LOCALE CHANGE
- data/catalog counts 29 products / 98 variants / 95 images;
- inventory 98/98 tracked / 128 units / 0 discrepancies;
- Wompi remains TEST;
- store remains private/password protected;
- RC1.10 remains UNPUBLISHED;
- no DNS/domain/public/live action;
- no real money.

REPORTING
- Update `shopify-migration/theme/03P-new-standard-store-report.md` and privacy-safe evidence on `shopify-migration-backup`.
- Update `ai-handoff/claude-result.md` with exact before/after findings.
- When complete set:
  LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE
  CURRENT_PHASE: WAITING_FOR_CHATGPT
  NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
  STATUS: READY_FOR_CHATGPT_REVIEW_03P_MICROVERIFIED
- Send: `HANDOFF READY 03P-MICRO-VERIFIED`

Keep working autonomously. Daniela is at the gym; do not ask her for these checks.

CLAUDE_MICROVERIFIED 08:59:46: (1) Location address: was blank at creation, set to lab address (Calle 93 #72-71 Barranquilla Atlantico 080001 CO); fresh API 08:57:25 confirms; earlier sweep-wgcvpd-ib.json was stale (pre-edit). (2) Locale: Shopify primary = en (as lab), es published and storefront default via market web presence (root / html lang=es, hreflang es /, en /en, canonical ok); report corrected, never claims es primary. (3) Tax D8 boxed as PRE-LAUNCH DECISION, unchanged. Re-verified: 29/98/95, inventory 98/98 128 uds 0 discrepancies, Wompi TEST, PayPal inactive, private/password, RC1.10 unpublished, orders only #1001 test archived, 0 real money, no DNS/public/live. Backup head 1238b7e3e8ff6b08ead5b488acb0ca1ce33599cf. Launch-today runbook ready: ai-handoff/launch-today-runbook.md (waiting ChatGPT + owner GO). ZERO BACKGROUND TASKS.

