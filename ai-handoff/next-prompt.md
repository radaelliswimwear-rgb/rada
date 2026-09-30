# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03H
PHASE: 03H — THEME CONVERGENCE + TARGETED VERIFICATION
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03G APPROVED BY CHATGPT.

AUTHORITATIVE 03G HANDOFF:
- ai-handoff commit: 3103bbc57082099df7f0d22b367e82039e2bdd76
- RC1.8 SHA-256: e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67
- Theme Check: 0 errors / 0 warnings
- Theme regression: 74/74
- App tests: 156/156
- App mutants: 20/20
- Catalog: 29 products / 98 variants / 95 images
- Redirects: 47/47
- Horizon: live and untouched
- Radaelli: unpublished
- Payments: OFF
- 03G launch verdict if launching today: NO-GO because owner-only blockers remain. That does NOT block independent 03H work.

PRIMARY OBJECTIVE:
Converge the remaining independent theme differences identified in 03G into one small candidate RC1.9, validate only the affected surfaces plus the required full theme regression, and stop. Do not expand scope.

EFFICIENCY RULES — MANDATORY:
- One active process at a time.
- NO new subagents.
- NO new workflows.
- NO broad exploratory audits.
- NO full recrawl of the current site.
- Reuse 03G evidence and deterministic scripts instead of regenerating them.
- Do not repeat app/catalog/redirect checks unless a change in 03H could affect them.
- Do not start 03I.
- Do not perform owner/manual actions.

1. ENTRY CHECK
Read origin/ai-handoff/claude-result.md and confirm the 03G state above before touching the theme.
Confirm Horizon is live and Radaelli is unpublished.

2. IMPLEMENT ONLY THESE 5 THEME FIXES FROM 03G
Use theme/03G-home-parity.md as source of truth.

HP-03 — rows 8 and 18
- Hero and promo CTA anchors: `#categorias` -> `#productos`.

HP-07 — row 14
- Editorial card: remove category badge and remove `Ver producto` for that editorial presentation.
- Parameterize/reuse the snippet safely; do not globally remove these elements from product cards that still require them.

HP-08 — row 21
- Newsletter button text: `Quiero enterarme`.

HP-09 — rows 27 and 28
- Footer: use the sourced brand name and brand description from the current-site parity evidence.
- Do not invent or rewrite brand copy.

HP-22 — row 38
- Footer Contact dropdown: render username/number as text as specified by parity evidence and remove the duplicated `Contacto` label.

Do NOT implement H-01 contrast in this phase unless one of the five fixes above directly touches the same exact token and the correction is mechanically unavoidable. Otherwise leave H-01 documented for later.

3. STRICT OUT-OF-SCOPE
Do NOT touch:
- A1 Colombia shipping zone / primary market.
- B1 payments / Wompi.
- B2 legal page creation or legal redirects.
- B3 analytics connection.
- A3 Search & Discovery installation/OAuth.
- A4 owner media uploads.
- A5 wishlist app installation/OAuth.
- C6 collection ordering.
- C7 COP/USD selector.
- C8 English /en decision.
- D1 XL variant decision.
- D2 inventory decision.
- D3 customer/order/coupon/newsletter migration decision.
- D4 domain/cutover decision.
- D5 versioning/back-up authorization for shopify-migration.
- catalog writes, inventory writes, collection reordering, customer data, orders, coupons, newsletter data.
- Production, Staging, Vercel, Neon, main, merge, PR, DNS, commercial Shopify store.

4. TEST BEFORE UPLOAD
For the local candidate:
- Theme Check target: 0 errors / 0 warnings.
- Add/adjust focused regression tests for each behavior changed in 03H.
- Full theme regression must remain 100% PASS.
- Add targeted mutants where meaningful so tests prove the changed behavior rather than merely execute lines.
- Secret scan only changed/generated 03H artifacts plus final package; no need to rescan unrelated historical trees unless the tool requires it.

If any fix causes unrelated regression, fix only the regression caused by 03H. Do not expand into unrelated cleanup.

5. BUILD RC1.9 ONLY IF ALL TESTS PASS
If and only if the five fixes pass:
- build deterministic RC1.9;
- create/update its release manifest;
- record SHA-256;
- build twice and confirm identical hash;
- preserve RC1.8 as historical rollback artifact.

6. DEV STORE UPLOAD — UNPUBLISHED ONLY
Upload RC1.9 only to the existing Radaelli unpublished theme in the Development Store.
Never publish.
After upload verify remote parity against the RC1.9 ZIP for every theme file.
Record exact remote-vs-ZIP count, not an assumed 96/96 if the file count changes.

7. TARGETED LIVE QA ONLY
Validate the affected Home/footer surfaces after upload.
Widths: 320, 390, 768, 1440.
Check specifically:
- hero CTA target;
- promo CTA target;
- editorial card presentation;
- newsletter CTA text;
- footer brand name/description;
- footer Contact dropdown;
- no new horizontal overflow;
- no broken images;
- no untranslated Liquid keys introduced by 03H.

Do NOT rerun the full 136-case 03G responsive sweep unless a 03H failure indicates a broader regression.

8. CLOSE THE TWO 03G VERIFICATION DEBTS WITHOUT AGENTS
The adversarial agents for the commercial migration plan and post-launch monitoring did not finish in 03G.
Perform one local/deterministic review of each existing document, without subagents or workflows:
- launch/03G-commercial-store-migration-plan.md
- launch/03G-post-launch-monitoring.md

Goal:
- confirm no invented provider, Shopify plan, price, DNS value, TTL, KPI, owner decision, or unsupported fact;
- confirm dependencies/rollback language is internally consistent;
- correct only factual/structural defects if found.

Do not rewrite them for style.
Record PASS or the exact corrections in the 03H report.

9. FINAL SAFETY CHECK
Before handoff confirm:
- Horizon still live and untouched.
- Radaelli still unpublished.
- Payments still OFF.
- No owner-only setting changed.
- No Production/Staging/Vercel/Neon/main/merge/PR touched.
- No background agent/workflow/process remains active.

10. REPORT
Create:
shopify-migration/theme/03H-theme-convergence-report.md

Report at least:
1 model
2 elapsed
3 usage if available
4 entry state
5 HP-03 result
6 HP-07 result
7 HP-08 result
8 HP-09 result
9 HP-22 result
10 files changed
11 Theme Check
12 focused tests
13 full theme regression
14 mutants added/detected
15 RC1.9 hash and deterministic build result
16 remote = ZIP parity
17 targeted responsive/live QA
18 03G migration-plan verification debt result
19 03G monitoring verification debt result
20 secret scan
21 Horizon untouched
22 Radaelli unpublished
23 payments OFF
24 owner-only actions performed: NO
25 Production/Staging/Vercel/Neon/main touched: NO
26 residual blockers/decisions
27 READY FOR 03I YES/NO
28 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

HANDOFF
When complete:
- update ai-handoff/claude-result.md with the full 03H report;
- create ai-handoff/archive/03H-result.md;
- update ai-handoff/status.md to LAST_COMPLETED_PHASE: 03H / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03I / STATUS: READY_FOR_CHATGPT_REVIEW;
- push only the ai-handoff handoff files to branch ai-handoff using the established bridge procedure;
- send exactly: HANDOFF READY 03H;
- perform only the established finite +1 / +2 / +5 minute checks;
- STOP after handoff. Do not begin 03I without READY_FOR_CLAUDE_03I.
