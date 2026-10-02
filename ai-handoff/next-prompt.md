# NEXT PROMPT

STATUS: WAIT_UNTIL_2026-10-02_08AM_THEN_START_OFFICIAL_STORE
PHASE: 03P-NEW-STANDARD-STORE
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

PRECONDITION
ChatGPT formally approved the final deep audit of the free Dev Store lab. The lab is stable, certified and must remain intact as rollback/reference.

DO NOT START EARLY
Daniela explicitly scheduled creation of the official normal Shopify store for **2026-10-02 at 08:00 America/Bogota** to maximize the 3-day trial window.
Before that time: STOP. Do not create/register any official store, do not activate billing, do not start a trial.

AT OR AFTER 08:00 — ONE ACTIVE PROCESS ONLY
Create the intended official commercial store as a **SEPARATE NEW NORMAL Shopify merchant store** through standard Shopify signup under `radaelliswimwear@gmail.com`.
Do NOT use a Dev Store. Do NOT use/reactivate/pay the inactive transferred `launch` store.

STEP 1 — CREATE / VERIFY STANDARD STORE
- Use normal Shopify merchant signup under `radaelliswimwear@gmail.com`.
- If owner authentication/Google sign-in is unavoidable, ask Daniela only for that owner action. Never request password, MFA code, passkey, recovery code or secret in chat.
- Keep the new store private/password-protected.
- Confirm Colombia / COP / America-Bogota / kg.
- Keep US market DRAFT / Colombia intended market.
- Record exact `.myshopify.com` identifier.
- BEFORE any billing/plan commitment, capture the exact trial/promo wording shown inside THIS new store/account UI.

HARD PROMO/BILLING GATE
- Public Shopify Colombia marketing observed on 2026-10-01 advertised 3 free days then 3 months at USD 1/month, but this is NOT proof of account-specific eligibility.
- If the offer shown in the new store is absent, different, expired, or materially changes commitment, STOP and report to Daniela/ChatGPT.
- Do NOT select/activate a paid plan or enter billing until Daniela explicitly approves after seeing: exact promo wording, amount charged now, trial end, promo duration, when standard billing begins, monthly/annual commitment, and visible taxes/fees.
- Target paid plan after promo remains Basic monthly unless owner changes it.

STEP 2 — PRE-MIGRATION SNAPSHOT
- Record clean-store baseline, theme/app state and core shop settings.
- No production domain/DNS yet.
- Do not publish RC1.10 yet.

STEP 3 — DETERMINISTIC REPLICATION FROM CERTIFIED LAB
Use existing certified artifacts/tooling; do not rediscover or manually rebuild what already exists. Replicate only missing state.
Target exact baseline:
- RC1.10 theme source/ZIP, unpublished; theme parity 98/98.
- 29 products / 98 variants / 95 images.
- Inventory 98/98 tracked, 128 units; weight 500 g x98; XL KEEP.
- Collections/manual order; metafields + size guide.
- Menus and 51 redirects.
- Approved legal pages and Shopify native policies.
- Search & Discovery: Talla, Color, Precio; no Disponibilidad.
- Shipping zones: ATL 9,900; resto Caribe 12,900; principales 17,900; resto país 21,900; San Andrés/Amazonía 44,900; free >=299,900.
- Envia install/link if supported; fulfillment/labels/quote reference only, no live CCS.
- Wompi official route in TEST mode only. Daniela enters secrets directly only if unavoidable; never expose secrets in chat/GitHub.

STEP 4 — OFFICIAL-STORE PARITY / REGRESSION
Run deterministic parity first, then only necessary official-store regression:
- data parity 8/8;
- 29/98/95 and 95/95 media;
- 51/51 redirects;
- inventory 98/98 / 128 units;
- collections/menus/legal/policies/metafields/S&D;
- representative responsive 390/768/1440;
- cart/search/filter/legal smoke;
- representative shipping zones + exact 299,899/299,900 threshold if safely testable without polluting final catalog;
- Theme Check/build/secret scan.
Do not repeat broad expensive lab discovery unless a difference appears.

STEP 5 — WOMPI TEST REGRESSION IN OFFICIAL STORE
After shipping + Wompi TEST are configured, perform ONE controlled sandbox E2E if technically supported:
- COP checkout;
- correct regional shipping;
- Wompi visibly TEST/sandbox;
- approved sandbox transaction;
- exactly one Shopify order, no duplicate;
- correct subtotal/shipping/total;
- inventory decrement and restoration when appropriate;
- close/archive test order;
- zero real money.
Keep Wompi TEST afterwards.

STEP 6 — NOTIFICATIONS / EMAIL OWNER REVIEW
The lab proved Shopify generated customer order-confirmation and staff new-order events, but physical inbox delivery was not directly verifiable in the Dev Store test setup.
In the official store, verify safe notification configuration and sender/staff recipients before launch. Do not send to real customers. If test-send/preview is available, use it safely and document result.

STEP 7 — HISTORICAL DATA
Historical customers/orders/newsletter/content remain a separate migration item unless authorized source export + required permissions are available. Do not fabricate or manually recreate PII. Document blockers precisely.

STEP 8 — PRE-LAUNCH HOLD
Even after migration/testing:
- do NOT connect production domain/DNS;
- do NOT remove password;
- do NOT publish RC1.10;
- do NOT turn Wompi live;
- do NOT run a real payment;
- do NOT buy a real Envia label;
- do NOT delete certified lab or inactive launch store.
Those belong to final launch phase 03Q after ChatGPT review.

KNOWN OWNER REVIEW BEFORE PUBLICATION
Preserve the current announcement bar during replication: `20 % DE DESCUENTO EN TODA LA TIENDA`. Before public launch, explicitly ask Daniela whether it stays, changes or is removed. Do not silently change it.
Other owner/commercial decisions to keep visible: verified sender/staff recipients, optional URL-handle renames + redirects, copy tone, meta descriptions, empty Salidas collection/menu choice, favorites wording, historical migration.

REPORT
Create/update `shopify-migration/theme/03P-new-standard-store-report.md` with:
- new store identifier and owner account (no secrets);
- exact visible promo/trial terms and billing status;
- baseline/parity/migration counts;
- app/payment/shipping results;
- Wompi sandbox evidence if run;
- notification config/test evidence;
- historical-data state/blockers;
- deferred 03Q items;
- unresolved blockers count;
- READY_FOR_FINAL_LAUNCH_CERTIFICATION YES/NO;
- ZERO BACKGROUND TASKS.

When fully replicated/tested and no owner billing action remains pending:
- update `ai-handoff/claude-result.md`;
- set LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION / STATUS: READY_FOR_CHATGPT_REVIEW;
- send exactly `HANDOFF READY 03P-NEW-STANDARD-STORE`;
- wait for ChatGPT.

If billing/promo approval is required before proceeding, set explicit OWNER_APPROVAL_REQUIRED status and ask only that single decision.

FAIL-SAFE
No launch, no production DNS, no live Wompi, no real money, no paid plan without explicit owner approval, no new Dev Store, no touching inactive `launch`, no destruction of certified lab, no main/merge/PR.