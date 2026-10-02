PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
CURRENT_MODEL: SONNET 5.5
STATUS: CHATGPT_APPROVED_03P_READY_FOR_03Q_OWNER_GO
USER_ABSENCE_MODE: ACTIVE_GYM_60MIN_CHATGPT_RELAY

CHATGPT FORMAL APPROVAL — 2026-10-02
03P-NEW-STANDARD-STORE is FORMALLY APPROVED after independent GitHub review and micro-verification.

APPROVED EVIDENCE
- Official store is a normal Shopify merchant store under the owner account, based in Colombia.
- Colombia / COP / America-Bogota / kg confirmed.
- Theme RC1.10 remains UNPUBLISHED with parity 98/98; Horizon remains live while private.
- Catalog: 29 products / 98 variants / 95 images.
- Inventory: 98/98 tracked / 128 units / 0 discrepancies / 500 g x98.
- Collections, pages, policies, menus, 51 redirects, Search & Discovery, regional shipping, threshold 299,899 paid / 299,900 free all verified.
- Envia installed+linked; no real label purchased.
- Wompi TEST E2E #1001 PASS: test=true, SALE SUCCESS, COP 169,820, customer-confirmation event + staff-new-order event, no duplicate order, inventory restored, order cancelled/archived, 0 real money; Wompi remains TEST.
- Store remains private/password protected.
- No production domain/DNS cutover, no password removal, no theme publication, no Wompi LIVE, no real payment.

MICRO-VERIFICATION CLOSED
1) Location address discrepancy resolved:
- Official Shopify Location was blank at creation.
- Claude safely set it to the certified lab address.
- Fresh evidence `sweep-wgcvpd-ib-final.json` confirms Calle 93 #72-71, Barranquilla, Atlántico 080001, CO.
2) Locale discrepancy resolved:
- Shopify technical primary locale = `en` (same as lab).
- Market web presence default locale = `es`.
- Root `/` serves Spanish; English is alternate at `/en/`.
- Report corrected; no false claim that `es` is Shopify primary.
3) D8 tax difference remains intentionally unresolved for 03Q owner/accountant decision:
- official `taxesIncluded=true` vs lab `false`;
- no tax rates configured; current checkout totals matched certified values;
- DO NOT change autonomously.

BACKUP / EVIDENCE
- `shopify-migration-backup` verified at head `1238b7e3e8ff6b08ead5b488acb0ca1ce33599cf`.
- Final report: `shopify-migration/theme/03P-new-standard-store-report.md`.
- Final locale evidence: `shopify-migration/launch/official-03p/locales-wgcvpd-ib-final.json`.
- Final store/location evidence: `shopify-migration/launch/official-03p/sweep-wgcvpd-ib-final.json`.
- ZERO BACKGROUND TASKS at 03P close.

03Q HOLD — DO NOT CROSS WITHOUT OWNER GO
No public/live action is authorized merely by this approval. Until Daniela explicitly gives GO for final launch certification/cutover, DO NOT:
- connect or alter production DNS/domain;
- remove storefront password;
- publish RC1.10;
- activate Wompi LIVE / production payment flow;
- run real-money payment;
- buy a real Envia label;
- delete/touch the certified lab or inactive launch store;
- touch main/merge/PR.

PRE-LAUNCH OWNER DECISIONS TO RESOLVE IN 03Q
- D8 taxes/IVA treatment (owner/accountant decision; do not infer).
- Seller identity / contact / legal notice fields if owner wants them completed before opening.
- Announcement bar 20% decision.
- Verified sender `info@radaelliswimwear.com` / staff recipients.
- Historical data stays deferred unless owner explicitly authorizes export/migration.
- Domain/DNS, password removal, theme publication, Wompi LIVE and any real payment require explicit owner GO.

NEXT ACTION
Wait for Daniela's explicit instruction to begin `03Q-FINAL-LAUNCH-CERTIFICATION`. When GO is given, read `ai-handoff/next-prompt.md` and execute only the staged, gated 03Q sequence. Preserve rollback path to Vercel until public launch is verified.
