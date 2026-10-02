# NEXT PROMPT

STATUS: READY_FOR_AUTONOMOUS_03P_NEW_STANDARD_STORE_AT_08AM
PHASE: 03P-NEW-STANDARD-STORE — OFFICIAL NORMAL SHOPIFY STORE
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — OFFICIAL STORE EXECUTION PLAN

## 0. OPERATING MODE — OWNER MINIMAL INTERVENTION
Daniela wants this phase run like the final lab audit: Claude works autonomously, ChatGPT supervises through GitHub handoff, and Daniela intervenes only for actions that legally/technically require the owner.

OWNER-ONLY actions include ONLY:
- login/authentication/Google/passkey/consent that cannot be performed safely by Claude;
- direct entry of secrets/credentials into Shopify/Wompi/Envia (never reveal them in chat/GitHub);
- explicit approval of billing/plan terms;
- production domain/DNS/password-removal/theme-publish approval;
- Wompi LIVE/real-payment authorization;
- true business-choice decisions.

DO NOT ask Daniela to do ordinary clicks, copy/paste values, fill routine forms, test pages, navigate settings, compare counts or capture screenshots if Claude can do them.

If blocked on one owner-only action, set `OWNER_ACTION_REQUIRED_<SHORT_NAME>` in status, describe exactly one owner action, and continue every independent safe task that is not blocked. Do not idle unnecessarily.

One active process only. No subagents/workflows. No main/merge/PR.

## 1. TIME GATE
Do NOT create/register the official store before **2026-10-02 08:00 America/Bogota**.
At or after 08:00, begin immediately.

## 2. CREATE THE RIGHT STORE — GATE G0
Create a **SEPARATE NEW NORMAL Shopify merchant store** through standard merchant signup under:
`radaelliswimwear@gmail.com`

ABSOLUTELY NOT:
- a Dev Store;
- a Client Transfer Store;
- the inactive transferred `launch` store;
- a new store under the Partner account.

If owner authentication is required, ask Daniela only to authenticate; resume immediately after.

Record:
- exact store name;
- exact `.myshopify.com` identifier;
- owner account (no secrets);
- creation timestamp America/Bogota;
- whether store is private/password-protected;
- clean-store themes/apps/channels snapshot.

## 3. PROMO/TRIAL CAPTURE — BEFORE BILLING
ChatGPT checked official Shopify Colombia sources on 2026-10-02. Public marketing still advertises a 3-day free trial and promotional US$1/month for 3 months, but Shopify Help explicitly says the actual trial duration/promotional pricing depends on the account/time of signup.

Immediately after store creation, capture the exact offer visible INSIDE THIS STORE/account:
- trial duration;
- promotional amount;
- promotional duration;
- plans eligible;
- amount due now;
- whether card/billing details are required now;
- when first charge occurs;
- when standard Basic price begins;
- monthly vs annual commitment shown;
- taxes/fees if visible.

Do NOT select a paid plan, submit billing, or accept a commitment yet.
If the offer is missing/different/materially worse, set `OWNER_ACTION_REQUIRED_PROMO` and report exact terms. Continue independent migration work if Shopify permits.

## 4. CLEAN BASELINE — GATE G1
Before importing anything:
- snapshot initial products/collections/pages/menus/redirects/themes/apps/markets/shipping/payments/policies;
- confirm business location Colombia;
- currency COP;
- timezone America/Bogota;
- weight kg;
- Colombia intended ACTIVE market;
- US market DRAFT/inactive as appropriate;
- keep storefront private/password protected;
- do not connect production domain/DNS;
- do not publish RC theme.

Record any Shopify-generated demo/default objects so they can be safely distinguished from migrated data.

## 5. SOURCE OF TRUTH
Certified lab/source artifacts are authoritative:
- lab: `radaelli-swimwear-dev.myshopify.com` — READ-ONLY reference now;
- backup head at final lab approval: `3a13b02500bc7c44d95512d17bca088ac17872ed`;
- final report `shopify-migration/theme/03P-lab-certification-report.md`;
- final evidence `shopify-migration/launch/evidence/03P-final-deep-audit.json`;
- certified theme RC1.10 ZIP/source SHA-256 `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`.

Do not rediscover/reinvent content that already exists in the certified artifacts. Replicate deterministically.

## 6. MIGRATION WAVES — GATE G2
Perform in controlled waves, verify each wave before next.

### WAVE A — Theme
- Upload/push RC1.10 as UNPUBLISHED.
- Do not publish.
- Verify remote theme source parity 98/98 with certified ZIP/source.
- Run Theme Check.
- Preserve announcement bar text exactly for now: `20 % DE DESCUENTO EN TODA LA TIENDA`.

### WAVE B — Product model/metafields
- Create required definitions/metafields first, including color/size-guide dependencies.
- Replicate 29 products / 98 variants / 95 images.
- Preserve handles, SKUs, option names/order, titles, descriptions, prices, images/media order, product types/tags/statuses and theme-required metafields.
- Preserve known legacy handles even when wording differs; do not rename during migration.
- Verify 0 duplicate handles/SKUs.

### WAVE C — Inventory/physical data
- Track inventory 98/98.
- Total inventory target = 128 units.
- Weight = 500 g x98 variants unless certified artifact says otherwise.
- Preserve XL KEEP variant and all certified quantities.
- Do not invent stock.

### WAVE D — Collections/order
Replicate collection membership and MANUAL ordering exactly from certified lab.
Expected certified counts include the same validated collection states; do not alter empty Salidas collection yet because that is an owner business decision.

### WAVE E — Navigation/content/legal
- main menu / Comprar / Ayuda menus;
- footer/internal links/social settings;
- 51 redirects;
- approved pages: privacy, terms, shipping, cookies, warranty where applicable;
- Shopify native policies aligned with approved content;
- keep automatic privacy generation state consistent with certified setup.

### WAVE F — Search & Discovery
Install/configure Shopify Search & Discovery if required.
Filters EXACTLY:
1. Talla
2. Color
3. Precio
No Disponibilidad.
Validate known filter results against certified baseline where applicable.

## 7. SHIPPING / MARKETS — GATE G3
Configure fixed regional shipping — NOT live carrier-calculated checkout shipping.

Subtotal < COP 299,900:
- Atlántico/Barranquilla: 9,900
- Resto Caribe: 12,900
- Ciudades principales: 17,900
- Resto Colombia: 21,900
- San Andrés/Amazonía: 44,900

Subtotal >= COP 299,900:
- free shipping.

Cover all 33 departments according to the certified mapping.
Validate stored conditions and representative checkout behavior when checkout is available.
If safe, prove exact 299,899 -> paid and 299,900 -> free using reversible test-only artifact, then delete it and reconfirm baseline.

Do NOT upgrade plan merely to obtain carrier-calculated shipping. Envia is fulfillment/labels/quote reference, not live CCS.

## 8. ENVIA
Install/link Envia to the new official store if supported.
- Use owner account link only when necessary.
- Daniela enters credentials herself if a secret/login is unavoidable.
- Do not expose credentials in chat/GitHub.
- Do not buy a real label.
- Validate connection/configuration only.

## 9. WOMPI TEST ONLY — GATE G4
Install/configure the intended Wompi payment route for THIS NEW STORE.
Store-specific configuration must be redone; do not assume lab/launch webhook/event URLs transfer.

Rules:
- TEST/SANDBOX only.
- Never put production keys in GitHub/chat.
- Daniela enters keys directly only if needed.
- Confirm TEST mode visibly ON before any checkout test.
- Keep Wompi TEST after all tests.

If Shopify requires plan selection/billing commitment before checkout/payment can be tested, STOP only at the billing gate and present Daniela the exact visible terms. Do not bypass or improvise.

Once checkout is available, run ONE controlled sandbox E2E:
- fictitious customer data only;
- COP checkout;
- correct regional rate;
- Wompi visibly sandbox/test;
- approved sandbox transaction;
- exactly one Shopify order;
- no duplicate;
- correct subtotal/shipping/total;
- inventory decrements appropriately;
- restore certified inventory when test is complete;
- close/archive test order;
- zero real money.

## 10. EMAIL / NOTIFICATIONS — GATE G5
Configure official-store notification settings.
Owner/admin addresses relevant for operations:
- radaelliswimwear@gmail.com
- info@radaelliswimwear.com

Do not assume both should receive every notification if Shopify UI has different roles; preserve/store exact configuration and ask Daniela only when a business choice is necessary.

Verify:
- customer order-confirmation template;
- staff new-order notification;
- safe test-send/preview when available;
- verified sender/domain requirements;
- no email to real customers during tests.

Do not claim physical delivery unless actual test inbox evidence is available.

## 11. OFFICIAL-STORE PARITY GATE — G6
After migration, run deterministic comparison against certified lab BEFORE broad manual testing.
Required:
- data parity 8/8;
- theme parity 98/98;
- 29 products / 98 variants / 95 images;
- 95/95 images available;
- inventory 98/98 tracked / 128 units;
- 500g x98;
- collections/order exact;
- metafields/size guide exact;
- menus exact;
- 51/51 redirects;
- pages/policies/legal exact;
- Colombia/COP/America-Bogota/kg;
- US DRAFT;
- S&D exact filters;
- shipping zones/threshold exact.

Any mismatch: investigate deterministic cause, fix safe/reversible differences and rerun only affected parity checks.

## 12. OFFICIAL STOREFRONT REGRESSION
Do not repeat the entire expensive laboratory discovery unless migration differences justify it. Run enough regression to prove the official store behaves like the certified lab:
- Home;
- all collections;
- representative and edge PDPs;
- cart/drawer;
- search positive/negative;
- Talla/Color/Precio filters;
- legal/policies;
- 404/password/account paths as applicable;
- responsive 390/768/1440;
- console/critical network errors;
- internal links + redirects;
- Theme Check/build/secret scan.

If any new official-store-only bug appears, test wider as needed.

## 13. HISTORICAL DATA
Assess what historical data must still move from the previous/original source:
- customers;
- orders;
- newsletter consent/subscribers;
- discounts if applicable;
- blog/content if applicable.

Do not recreate PII manually and do not put PII in GitHub.
If export/permissions are unavailable, record exact blocker and keep it on launch checklist; it must not silently disappear.

## 14. BILLING GATE — OWNER ACTION
A paid plan may become necessary to activate checkout/public sales. Target remains **Shopify Basic monthly** unless Daniela explicitly changes it.

Before asking for approval, show Daniela EXACTLY:
- offer wording from this store;
- plan name;
- amount due today;
- trial end date/time if shown;
- promotional monthly amount and duration;
- standard amount after promo;
- monthly vs annual commitment;
- taxes/fees;
- cancellation/renewal detail visible.

Then ask one decision only: approve or do not approve.
Do not submit plan/billing before explicit approval.

## 15. FINAL PRE-LAUNCH HOLD — DO NOT CROSS WITHOUT CHATGPT + OWNER GO
Even when store is technically perfect, DO NOT yet:
- connect/point production domain;
- modify DNS;
- remove password/private mode;
- publish RC1.10;
- turn Wompi LIVE;
- run a real transaction;
- buy a real Envia label;
- delete certified lab;
- delete/touch inactive launch store.

Set READY_FOR_FINAL_LAUNCH_CERTIFICATION only after migration + official-store tests pass.

## 16. 03Q FINAL LAUNCH CERTIFICATION — CHECKLIST TO PREPARE
Prepare evidence for ChatGPT to review:
- official-store identifier;
- exact promo/billing status;
- parity results;
- storefront regression results;
- Wompi sandbox evidence;
- shipping threshold evidence;
- Envia state;
- notification state;
- historical-data state;
- unresolved blockers;
- owner commercial decisions still pending.

Known decisions to surface before public launch:
1. Keep/change/remove `20 % DE DESCUENTO EN TODA LA TIENDA`.
2. Verified sender and staff notification recipients.
3. Voseo vs tuteo consistency.
4. Home/Destacados/Todos meta descriptions.
5. Empty Salidas de Baño collection/menu choice.
6. Optional legacy handle renames + redirects.
7. Favorites wording.
8. Historical migration handling.

## 17. REPORTING / HANDOFF PROTOCOL
Continuously keep privacy-safe evidence in `shopify-migration-backup`.
Create/update:
`shopify-migration/theme/03P-new-standard-store-report.md`

The report must include:
- store identifier + owner account (no secrets);
- creation time;
- promo/trial terms as actually shown;
- whether billing/plan was activated;
- clean baseline snapshot;
- every migration wave result;
- parity counts;
- shipping/Envia/Wompi/email results;
- test order details with no PII/card/secret;
- historical-data state;
- bugs found/fixed;
- owner actions requested/completed;
- deferred 03Q steps;
- unresolved blockers count;
- READY_FOR_FINAL_LAUNCH_CERTIFICATION YES/NO;
- ZERO BACKGROUND TASKS when stopping.

If a true owner-only action is needed, update status to the exact `OWNER_ACTION_REQUIRED_*` state and continue all independent tasks.

When official store migration/testing is complete:
- `LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE`
- `CURRENT_PHASE: WAITING_FOR_CHATGPT`
- `NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION`
- `STATUS: READY_FOR_CHATGPT_REVIEW`
- send `HANDOFF READY 03P-NEW-STANDARD-STORE`
- stop before any public/live action.

## 18. FAIL-SAFE PRINCIPLE
When uncertain, choose the reversible/private/test path and document it. Never trade safety for speed. Do not make a business decision for Daniela. Do not expose credentials. Do not start another process in parallel.