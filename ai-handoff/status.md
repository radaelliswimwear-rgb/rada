PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-LAB-FINAL-DEEP-AUDIT
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CHATGPT_FINAL_LAB_AUDIT_REVIEW
USER_ABSENCE_MODE: AUTONOMOUS_2H_COMPLETED
OWNER_INTERACTION_RULE: Daniela will be unavailable for approximately two hours. Claude must continue autonomously through every safe/reversible lab validation and deterministic fix without waiting for owner responses. Only stop on an owner-only authentication/secret/billing/irreversible action; otherwise document blockers and continue with all remaining tests. Never request or expose passwords, MFA codes, card details, API secrets, Wompi keys, support PINs, or payment credentials.

AUTHORITATIVE OWNER INTENT — 2026-10-01:
- Use the remaining time today for one last exhaustive quality audit of the FREE certified lab `radaelli-swimwear-dev.myshopify.com`.
- Daniela specifically wants every product inspected product-by-product for loading/completeness and hidden bugs, not merely aggregate counts.
- Do NOT create/register the official normal Shopify store before 2026-10-02 08:00 America/Bogota. Preserve the 3-day trial window.
- Work autonomously; do not wait for intermediate copy/paste or ChatGPT responses. One active process only, no subagents/workflows.

CERTIFIED BASELINE — MUST END UNCHANGED UNLESS A REAL BUG REQUIRES A DOCUMENTED FIX:
- LAB_CERTIFIED=YES / READY_FOR_NEW_STANDARD_STORE=YES before this extra audit.
- Colombia/COP/America-Bogota/kg; US market DRAFT.
- RC1.10 unpublished; theme parity 98/98; data parity 8/8.
- 29 products / 98 variants / 95 images.
- Inventory 98/98 tracked, 128 units; weight 500 g x98.
- 51 redirects; legal/policies; menus; S&D filters Talla/Color/Precio.
- Regional shipping exact threshold PASS: 299,899 paid / 299,900 free.
- Envia linked; Wompi TEST E2E #1003 PASS, one order/no duplicate/zero real money.
- Responsive 390/768/1440 PASS; Theme Check 0; JS console 0; secret scan clean.

FINAL DEEP AUDIT — EXHAUST EVERYTHING SAFE/TESTABLE:
1. PRODUCT-BY-PRODUCT STOREFRONT AUDIT — ALL 29 PDPs, no sampling:
   - Open each PDP and wait for full critical render/network settle using safe pacing to avoid 429.
   - Verify HTTP success, title, price, product media/gallery, description/content blocks, size/color selectors, stock/availability messaging, add-to-cart control, accordions/help content and expected product URL/canonical behavior.
   - Detect broken/blank sections, perpetual spinners, partial renders, missing controls, layout jumps that leave content unusable, placeholder/undefined/NaN text, incorrect currency, stale variant state, wrong product media, broken lazy-load or missing assets.
   - Check browser console and failed network requests per PDP or in a reliable automated pass covering all 29; distinguish harmless third-party noise from reproducible storefront defects.
   - Verify every product image/media reference needed by those PDPs loads successfully; preserve 95/95 evidence.
   - Verify true mobile 390 behavior on every PDP through safe automated viewport validation for overflow/cutoff/broken controls; visual/manual deeper check on representative layouts if all products share template, but still programmatically cover all 29.

2. VARIANT-BY-VARIANT AUDIT — ALL 98 variants:
   - Ensure each variant is reachable/selectable from its PDP and option combination maps to the correct variant ID/state.
   - Price/availability/stock state must remain coherent when switching options.
   - Add each variant to cart using paced automation; verify correct product/variant, quantity behavior, no invalid/out-of-stock overrun, no duplicate line bug, no cart error.
   - If variant selection is represented in URL/history, ensure it does not break navigation/back-forward.
   - Do not consume/reset real inventory through completed orders; cart-only tests are preferred. Restore carts/session as needed.

3. PAGE/ROUTE COMPLETENESS:
   - Home, all collections, Search, Cart, legal/policy pages, Favorites page/template, customer/account routes that are accessible in dev context, password page, 404/not-found behavior, header/footer/navigation.
   - All internal menu/footer links and all 51 redirects.
   - Search positive/negative terms; S&D Talla/Color/Precio filters; sorting; empty-state behavior.
   - Browser back/forward and cart persistence on representative flows.

4. FORMS/INTERACTION VALIDATION WITHOUT REAL CUSTOMER CONTACT:
   - Newsletter/contact/search/other visible forms: required-field and invalid-input validation, safe test/preview only; do not spam or send to real customers.
   - Checkout required-field validation already passed; only rerun if a related defect/change is found.
   - Verify customer order-confirmation notification/template and admin new-order notification behavior using safest available preview/test-send/existing test-order evidence. If actual delivery cannot be proven safely in Dev Store, document exact platform limitation and strongest evidence; do not invent PASS.

5. RESPONSIVE/UI ROBUSTNESS:
   - Reconfirm Home/collections/search/cart/legal at 390/768/1440.
   - All 29 PDPs at true 390 programmatic width for horizontal overflow, clipped buttons/text, broken selector/cart controls, broken images.
   - Check menu open/close, cart drawer/page, filter drawer, image gallery controls where applicable.
   - Known owner-deferred contrast issue remains deferred; do not redesign aesthetics.

6. TECHNICAL/SEO SANITY SAFE TO TEST:
   - Theme Check/build/secret scan after any code change.
   - Broken asset/404 scan, recurring console JS errors, failed critical network requests.
   - Product handles/SKUs duplicates, price/currency anomalies, missing images, missing metafields required by theme.
   - Canonical/meta/structured-data presence sanity where theme exposes it; flag malformed/empty/obviously wrong values, but do not redesign SEO strategy.
   - Confirm no test-only artifact remains visible and no unexpected US-market/public state reappears.

7. SHIPPING/PAYMENT/ORDER REGRESSION — DO NOT REPEAT EXPENSIVELY UNLESS NEEDED:
   - Existing exact threshold and five-zone evidence remains valid if configuration untouched.
   - Existing Wompi TEST #1003 remains valid if payment/shipping config untouched.
   - Only rerun checkout/Wompi if a discovered/fixed bug or config change could affect them.
   - No real money, no live Wompi, no real Envia label.

8. FIX POLICY:
   - If a reproducible deterministic bug is found and the fix is safe/reversible, fix it autonomously in the LAB only, record before/after evidence, rerun the affected test, and if theme code changes increment RC appropriately and rerun Theme Check/theme parity/data parity.
   - Do not make aesthetic redesigns or business/promotion decisions.
   - If a fix requires owner choice/authentication/secret/irreversible action, mark OWNER_ACTION_REQUIRED but continue every other independent test.

9. FINAL RESTORATION/GATE:
   - End with no temporary products/carts/test artifacts that alter baseline.
   - Confirm 29 products / 98 variants / 95 images, inventory 98/98 tracked / 128 units, 51 redirects, parity 8/8 and correct RC/theme parity.
   - Secret/PII scan all new evidence before push.
   - Update `shopify-migration/theme/03P-lab-certification-report.md` with a FINAL DEEP AUDIT section including per-product matrix for all 29, all-98 variant result, route/form/notification/technical results, every bug found/fixed, remaining DEFERRED/OWNER_ACTION_REQUIRED items, and exact baseline restoration.
   - Push privacy-safe evidence to remote `shopify-migration-backup` and verify fetchability.

HARD STOP / TIMING:
- Do NOT create/register official store tonight.
- Do NOT activate/pay/select any plan.
- Do NOT publish theme, remove password, connect DNS/domain, enable live Wompi, process real money, buy Envia label, touch main/merge/PR, or alter inactive `launch` store.
- When exhaustive audit is complete, set CURRENT_PHASE: WAITING_FOR_CHATGPT / STATUS: READY_FOR_CHATGPT_FINAL_LAB_AUDIT_REVIEW and send exactly `HANDOFF READY 03P-FINAL-DEEP-AUDIT`.
- Then stop. Tomorrow's official-store creation remains scheduled for 2026-10-02 08:00 America/Bogota after ChatGPT reviews this final audit.

CLAUDE_FINAL_DEEP_AUDIT_03P (2026-10-01): FINAL DEEP AUDIT = PASS. 29/29 PDP (iframe exactly 390 px) and 98/98 variants (selection/id/price/button coherent; exact-stock add 98/98 -> cart 98 lines/128 units) with 0 reproducible defects, 0 fixes, 0 regressions; NO theme/data/config change in this phase. 51/51 redirects (42 same-origin 200 + 9 /account redirects fired), 14/14 internal header/footer links, forms (newsletter client validation + forced invalid POST 400, no customer), notification evidence from order #1003 (customer confirmation + staff new-order events; physical inbox delivery not verifiable). Over-stock: real UI blocks with Spanish messages; AJAX path 422 on 14 variants exercised (Shopify 429 throttle stopped further 422 sweep; remaining 84 not claimed); non-UI routes (native POST /cart/add, single-item JSON w/o Accept) accept qty>stock but CHECKOUT reconciles (no oversell) - informational/optional. Baseline restored and verified: 29/98/95, inventory 98/98 tracked 128 units, 51 redirects, data parity 8/8, RC1.10 unpublished remote=ZIP 98/98, Colombia ACTIVE/US DRAFT, orders only #1001-#1003 (no new orders, zero real money), Wompi untouched (TEST), cart/favorites empty. Remote evidence: shopify-migration-backup head 3a13b02500bc7c44d95512d17bca088ac17872ed (was c232715); report 03P-lab-certification-report.md has the FINAL DEEP AUDIT section (29-PDP matrix); evidence 03P-final-deep-audit.json; tools 03p-final-audit-*.js. OWNER_ACTION_REQUIRED/DEFERRED for the official store listed in claude-result.md. Official store NOT created (scheduled 2026-10-02 08:00 America/Bogota). ZERO BACKGROUND TASKS.
