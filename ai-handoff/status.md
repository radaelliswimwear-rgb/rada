PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-LAB-FINAL-DEEP-AUDIT
CURRENT_PHASE: 03P-NEW-STANDARD-STORE
NEXT_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_MODEL: SONNET 5.5
STATUS: OWNER_ABSENT_GREEN_LIGHT_CONTINUE_NO_GLOBAL_PAUSE
USER_ABSENCE_MODE: ACTIVE_GYM_60MIN_CHATGPT_RELAY

GREEN LIGHT — OWNER RELEASED TO GYM
- Daniela is now released to leave for approximately 60 minutes.
- The consolidated owner batch has been completed in `ai-handoff/owner-action-batch.md`.
- Do NOT request any additional scattered/manual action from Daniela while she is away.
- The only currently known 03P owner-only blocker is B1: Wompi sandbox card payment in the prepared checkout. It may wait until Daniela returns.

NO-GLOBAL-PAUSE RULE — ABSOLUTE
- Never pause the whole project because one branch is blocked.
- If any task needs owner input, secrets, consent, billing, live/public action or manual card entry, mark ONLY that branch blocked and immediately continue every other safe/reversible task.
- Keep working continuously on parity, regression, evidence, report, notifications, email configuration assessment, historical assessment, Theme Check, secret scan, social-link verification, inventory verification, cleanup, timing telemetry and any other independent safe work.
- Do not idle waiting for Daniela.
- Do not idle waiting for ChatGPT if another safe lane exists.

CHATGPT RELAY MODE
- For any non-owner-only question, write the exact question/context to GitHub and continue other work; ChatGPT may answer through the handoff.
- For a true owner-only question discovered while Daniela is away, append it to `owner-action-batch.md` and continue other work. Do not stop globally.
- Poll/fetch `origin/ai-handoff` periodically at sensible intervals before blocked-branch retry or any irreversible/live/public action.

CURRENT OWNER BATCH SUMMARY
- Already done today: Shopify Basic monthly subscription approved by owner; Wompi TEST keys entered by owner with test mode ON; Wompi events URL set; Envia linked; PayPal Express disabled because not in baseline; checkout contact/phone settings aligned to Wompi requirement.
- Only AHORA action still pending: B1 Wompi sandbox test payment using the prepared checkout. Daniela will do it after returning.
- 03Q actions remain deferred: domain/DNS, verified sender, Wompi LIVE, first real Envia label, publish RC1.10/remove password, reauth if prompted, optional Gmail inbox delivery check, and documented business decisions.

CURRENT VERIFIED STATE BEFORE OWNER LEAVES
- Official store: `wgcvpd-ib.myshopify.com`, normal Shopify Basic store, private/password protected.
- Colombia/COP/America-Bogota/kg verified.
- Theme RC1.10 UNPUBLISHED parity 98/98.
- 29 products / 98 variants / 95 images.
- Inventory 98/98 tracked / 128 units / 500g x98.
- Shipping 5 zones / 33 provinces; exact 299,899 paid / 299,900 free proof completed; temporary products deleted.
- Data parity 7/8 only because plan type differs by design from dev lab.
- Storefront regression complete: 29/29 PDP, 98/98 variants coherent, 51/51 redirects, search/filters/routes/social links/responsive all passed.
- Envia installed+linked; no real label.
- Wompi TEST configured; no live payment.
- No DNS/domain cutover, no password removal, no theme publish, no Wompi LIVE, no real money.

WORK TO CONTINUE WHILE OWNER IS AWAY
1. Finish all non-B1 03P checks and cleanup.
2. Complete notification/email assessment and safe previews.
3. Complete historical-data assessment.
4. Re-run final parity/Theme Check/secret scan as appropriate.
5. Assemble `03P-new-standard-store-report.md` including stopwatch/timing table.
6. Prepare evidence in `shopify-migration-backup`.
7. Keep B1 isolated as pending owner action; do not let it block other lanes.
8. On Daniela return, resume B1, then order/inventory/email verification and final 03P handoff.

HARD STOPS STILL APPLY
- No production DNS/domain cutover.
- No storefront password removal.
- No publishing RC1.10.
- No Wompi LIVE/production credentials or real payment.
- No real Envia label.
- No deletion/touching of certified lab or inactive launch store.
- No main/merge/PR.

OWNER RETURN SIGNAL
When Daniela returns, she will perform B1 from `owner-action-batch.md`. Until then, continue working without global pauses.