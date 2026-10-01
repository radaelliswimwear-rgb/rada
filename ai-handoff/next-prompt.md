# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_AUTONOMOUS_FINAL_DEEP_AUDIT
PHASE: 03P-LAB-FINAL-DEEP-AUDIT
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

AUTONOMOUS MODE — OWNER UNAVAILABLE ~2 HOURS
Daniela will be busy for approximately two hours. Work autonomously from this handoff without waiting for intermediate owner or ChatGPT replies. Use ONE active process only; no subagents/workflows. Continue through every safe/reversible validation and deterministic fix. If something requires owner-only authentication, secret entry, billing, an irreversible action, or a genuine business decision, document it as OWNER_ACTION_REQUIRED and continue every other independent test instead of stopping the whole audit.

DO NOT CREATE THE OFFICIAL STORE TONIGHT
Official normal-store creation remains scheduled for 2026-10-02 08:00 America/Bogota under radaelliswimwear@gmail.com to preserve the 3-day trial window. Do not register/create it now.

LAB TO AUDIT
`radaelli-swimwear-dev.myshopify.com` only.
Certified starting baseline: LAB_CERTIFIED=YES; RC1.10 unpublished; theme 98/98; data parity 8/8; 29 products / 98 variants / 95 images; inventory 98/98 tracked / 128 units; 51 redirects; S&D Talla/Color/Precio; regional shipping with exact 299,899 paid / 299,900 free; Envia linked; Wompi TEST E2E #1003 PASS; 390/768/1440 responsive PASS; Theme Check/console/secret scan clean.

OWNER'S FINAL QUALITY REQUEST
Treat this as the last deep QA pass before the official store. Daniela specifically wants every product opened and validated product-by-product to catch hidden loading/rendering bugs. Do not rely only on aggregate API counts.

A. ALL 29 PRODUCT PAGES — NO SAMPLING
For every PDP:
- open the storefront page and let critical content/network settle with paced requests to avoid 429;
- verify successful response and complete critical render;
- title, price/COP, description/content, gallery/media, stock message, size/color selectors, add-to-cart, accordions/help blocks and canonical product destination;
- no blank/undefined/NaN/placeholder content, perpetual loading, missing controls, unusable partial render, wrong media/product association, broken lazy-load or critical failed asset;
- collect console + failed network evidence sufficient to cover all 29 PDPs and distinguish harmless third-party noise from reproducible storefront bugs;
- validate product media actually loads; preserve/reconfirm 95/95;
- run true 390 px programmatic viewport validation on all 29 PDPs for horizontal overflow, clipped buttons/text/selectors, broken images, unusable gallery/cart controls.
Create a per-product matrix with all 29 product handles/names and PASS/FAIL plus concise evidence/bug note.

B. ALL 98 VARIANTS — NO SAMPLING
- verify each option combination is selectable/reachable and maps to the correct variant state/ID;
- switching options keeps price/availability/stock/media state coherent;
- add every variant to cart using paced automation; verify correct line item/variant, quantity/remove, stock ceiling and no duplicate-line/error bug;
- exercise representative back/forward/variant URL state if variant history/URL is used;
- use cart-only tests; do not complete 98 orders and do not alter certified inventory baseline.

C. ROUTES/PAGES/INTERACTIONS
Revalidate, with emphasis on hidden bugs rather than redoing expensive discovery:
- Home;
- every collection and collection product link;
- Search positive/negative terms, sorting and S&D Talla/Color/Precio;
- Cart/cart drawer;
- all legal/policy pages;
- Favorites page/template;
- accessible customer/account routes and the 9 `/cuenta/*` redirects;
- password page;
- deliberate 404/not-found page;
- header/footer/mobile navigation;
- all internal menu/footer links and all 51 redirects;
- browser back/forward and cart persistence on representative end-to-end navigation.

D. FORMS + NOTIFICATIONS
- Test safe client-side/server validation for visible newsletter/contact/search/other forms without sending spam to real customers.
- Close the previously missing notification evidence: customer order-confirmation template/behavior and admin new-order notification template/behavior, preferring preview/test-send/existing test order #1003 rather than another order.
- Do not send to real customers. If Dev Store prevents actual-delivery proof, document exact technical limitation and strongest safe evidence. Never invent PASS.

E. RESPONSIVE/UI ROBUSTNESS
- All 29 PDPs at true 390 px automated checks.
- Representative Home/collection/search/cart/legal at 390/768/1440.
- menu open/close, filters drawer, gallery controls, cart controls.
- Ignore the already owner-deferred color-contrast/aesthetic issue unless it creates a functional blocker; no redesign.

F. TECHNICAL + CONTENT SANITY
- broken asset/404 scan;
- recurring console JS errors and critical failed network requests;
- duplicate handles/SKUs, missing prices, wrong currency, missing images, missing theme-required metafields;
- basic canonical/meta/structured-data presence sanity where available; flag malformed/empty/obviously wrong values only;
- confirm no temporary test products/artifacts remain visible;
- confirm Colombia/COP/Bogota/kg and US market DRAFT remain correct;
- Theme Check/build and secret scan after any code change.

G. SHIPPING/PAYMENT — ONLY IF IMPACTED
Existing 5-zone shipping, exact 299,899/299,900 edge and Wompi TEST #1003 remain accepted if untouched. Do not rerun payment unnecessarily. If a discovered/fixed bug or configuration change could affect checkout/payment/shipping, rerun only the affected regression with Wompi TEST and zero real money.

H. FIX AUTONOMOUSLY WHEN SAFE
For each reproducible deterministic bug:
- capture before evidence;
- make the smallest safe/reversible LAB-only fix;
- rerun the affected test;
- capture after evidence;
- if theme code changed, increment RC appropriately and rerun Theme Check/theme parity/data parity;
- no aesthetic redesign, campaign/promotion decisions, billing, DNS or production actions.
If owner action is required, document it and continue the rest.

I. FINAL RESTORE + REPORT
Before closeout:
- remove/rollback any temporary test artifact/session state;
- confirm exact baseline 29 products / 98 variants / 95 images;
- inventory 98/98 tracked / 128 units;
- 51 redirects;
- data parity 8/8;
- correct RC/theme parity;
- Wompi still TEST; no real money;
- secret/PII scan evidence.
Update remote `shopify-migration-backup` report `shopify-migration/theme/03P-lab-certification-report.md` with a `FINAL DEEP AUDIT` section containing:
- 29-product per-PDP matrix;
- 98-variant coverage result;
- page/route/forms/notification/mobile/technical results;
- bugs found, exact fixes and regressions;
- remaining DEFERRED/OWNER_ACTION_REQUIRED items;
- final restored baseline and ZERO BACKGROUND TASKS.
Push privacy-safe evidence/tools needed to support the result and verify remote fetchability.

HARD RULES
- Do not create/register official store tonight.
- No billing/plan/payment.
- No theme publication, domain/DNS, password removal.
- Wompi TEST only; zero real money.
- No real Envia label.
- Do not touch inactive `launch` store.
- No main/merge/PR.
- One active process only.

When exhaustive safe testing is complete:
- set CURRENT_PHASE: WAITING_FOR_CHATGPT;
- STATUS: READY_FOR_CHATGPT_FINAL_LAB_AUDIT_REVIEW;
- send exactly `HANDOFF READY 03P-FINAL-DEEP-AUDIT`;
- stop and leave the lab stable. Do not start tomorrow's official-store phase early.