# NEXT PROMPT

STATUS: READY_FOR_MAX_PARALLEL_AUTONOMOUS_03P_NEW_STANDARD_STORE_AT_0730
PHASE: 03P-NEW-STANDARD-STORE — OFFICIAL NORMAL SHOPIFY STORE
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — OFFICIAL STORE EXECUTION PLAN

## 0. OPERATING MODE — MAXIMUM SAFE PARALLELISM
Daniela wants MAXIMUM PRIORITY and the fastest safe execution. Run this phase with ONE coordinator/orchestrator plus as many subagents/workers as are useful for independent tasks.

The coordinator owns:
- global state machine / gates;
- ordering of Shopify mutations;
- reconciliation of subagent findings;
- prevention of duplicate/conflicting writes;
- final evidence consolidation into GitHub;
- the authoritative stopwatch/timing ledger.

Parallelize aggressively where independent. Do NOT parallelize conflicting mutations.

SAFE PARALLEL LANES after G0/G1 pass may include:
- Lane A: theme/source preparation + Theme Check + parity tooling;
- Lane B: product/metafield migration preparation and non-overlapping product batches;
- Lane C: media/image verification and upload validation;
- Lane D: collections/navigation/pages/legal/redirect preparation;
- Lane E: Search & Discovery / SEO / metadata verification;
- Lane F: shipping-map preparation + rate/threshold validation plan;
- Lane G: Envia installation/readiness assessment;
- Lane H: Wompi TEST integration preparation (no secrets exposed);
- Lane I: email/notification configuration assessment;
- Lane J: historical-data assessment and blocker documentation;
- Lane K: report/evidence assembly and parity comparison.

SERIALIZE these critical operations:
- store creation;
- Colombia-origin verification;
- final inventory writes/reconciliation;
- final shipping-profile mutation;
- Wompi store-specific configuration and payment test;
- billing/plan commitment;
- production domain/DNS;
- theme publication/password removal;
- Wompi LIVE/real payment.

No two agents may concurrently write the same Shopify object set, inventory quantities, payment settings, shipping profile, same theme settings file, or same GitHub handoff file. If agents prepare mutations, coordinator applies them deterministically with duplicate/idempotency checks.

Daniela intervenes only for actions that technically/legally require owner control:
- login/authentication/Google/passkey/consent that cannot be performed safely by Claude;
- direct entry of secrets/credentials into Shopify/Wompi/Envia;
- explicit approval of billing/plan terms;
- production domain/DNS/password-removal/theme-publish approval;
- Wompi LIVE/real-payment authorization;
- true business-choice decisions.

DO NOT ask Daniela to do ordinary clicks, copy/paste values, fill routine forms, test pages, navigate settings, compare counts or capture screenshots if Claude can do them.

If blocked on one owner-only action, set `OWNER_ACTION_REQUIRED_<SHORT_NAME>` in status, describe exactly one owner action, and keep every independent parallel lane running that does not depend on it.

No main/merge/PR.

## 1. TIME GATE — OWNER ADVANCED START
The previous 08:00 instruction is SUPERSEDED.
Do NOT create/register the official store before **2026-10-02 07:30 America/Bogota**.
At or after **07:30**, begin immediately.

### MANDATORY STOPWATCH / SPEED ACCOUNTING
Daniela wants exact timing for every meaningful step and does not want avoidable idle time.

- Start the GLOBAL WALL-CLOCK stopwatch immediately before the first signup/create-store action.
- Use America/Bogota timestamps, preferably with seconds.
- Every gate and every material task/lane must record:
  - `START_TIME`
  - `END_TIME`
  - `ELAPSED`
  - `BLOCKED_OR_WAIT_TIME`
  - blocker/wait reason
  - retries
  - result PASS/FAIL/DEFERRED/OWNER_ACTION_REQUIRED
- Parallel lanes keep their own timers; coordinator records the true overall wall-clock elapsed separately so parallel task durations are NOT added together as total project time.
- Explicitly time at minimum: G0 signup + Colombia origin; promo capture; G1 baseline; theme; products/metafields; media; inventory; collections/navigation/legal/redirects; Search & Discovery; shipping; Envia; Wompi TEST setup; billing gate if reached; sandbox E2E; notifications/email; historical assessment; parity G6; storefront regression; report/handoff.
- Log every avoidable delay/retry >60 seconds and its cause.
- Do not skip safety, parity or evidence to improve the stopwatch.
- Final report must include a timing table plus `TOTAL_WALL_CLOCK_TIME` from first signup action to `HANDOFF READY 03P-NEW-STANDARD-STORE`.

## 2. CREATE THE RIGHT STORE — GATE G0
Create a **SEPARATE NEW NORMAL Shopify merchant store** through standard merchant signup under:
`radaelliswimwear@gmail.com`

ABSOLUTELY NOT:
- a Dev Store;
- a Client Transfer Store;
- the inactive transferred `launch` store;
- a new store under the Partner account.

If owner authentication is required, ask Daniela only to authenticate; resume immediately after.

### COLOMBIA ORIGIN — HARD BLOCKING REQUIREMENT
The store MUST be born as a Colombia-based merchant store.
Before any migration/app install/billing/catalog import, verify and record:
- business/store country or region = Colombia;
- currency = COP;
- timezone = America/Bogota;
- weight = kg;
- Colombia intended market ACTIVE;
- US market DRAFT/inactive.

If country/region is not Colombia, STOP all mutation/migration lanes. Correct through the proper Shopify flow first. If owner action or account recreation appears necessary, set `OWNER_ACTION_REQUIRED_COLOMBIA_ORIGIN`. Never create another replacement store without explicit ChatGPT + Daniela instruction.

Record:
- exact store name;
- exact `.myshopify.com` identifier;
- owner account (no secrets);
- creation timestamp America/Bogota;
- whether store is private/password-protected;
- clean-store themes/apps/channels snapshot;
- Colombia-origin evidence.

## 3. PROMO/TRIAL CAPTURE — BEFORE BILLING
Public Shopify Colombia marketing checked by ChatGPT on 2026-10-02 still advertises a 3-day free trial and promotional US$1/month for 3 months, but account-specific eligibility is not guaranteed.

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
If the offer is missing/different/materially worse, set `OWNER_ACTION_REQUIRED_PROMO` and report exact terms. Continue independent migration/preparation work if Shopify permits.

## 4. CLEAN BASELINE — GATE G1
Before importing anything:
- snapshot initial products/collections/pages/menus/redirects/themes/apps/markets/shipping/payments/policies;
- re-confirm Colombia / COP / America-Bogota / kg;
- Colombia ACTIVE / US DRAFT or appropriate inactive state;
- keep storefront private/password protected;
- do not connect production domain/DNS;
- do not publish RC theme.

Record any Shopify-generated demo/default objects so they can be safely distinguished from migrated data.

After G1 passes, coordinator may release parallel lanes.

## 5. SOURCE OF TRUTH
Certified lab/source artifacts are authoritative:
- lab: `radaelli-swimwear-dev.myshopify.com` — READ-ONLY reference now;
- backup head at final lab approval: `3a13b02500bc7c44d95512d17bca088ac17872ed`;
- final report `shopify-migration/theme/03P-lab-certification-report.md`;
- final evidence `shopify-migration/launch/evidence/03P-final-deep-audit.json`;
- certified theme RC1.10 ZIP/source SHA-256 `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`.

Do not rediscover/reinvent content that already exists in the certified artifacts. Replicate deterministically.

## 6. MIGRATION WAVES — GATE G2
Use parallel independent lanes but coordinator serializes conflicting writes and validates each dependency.

### WAVE A — Theme
- Upload/push RC1.10 as UNPUBLISHED.
- Do not publish.
- Verify remote theme source parity 98/98 with certified ZIP/source.
- Run Theme Check.
- Preserve announcement bar text exactly for now: `20 % DE DESCUENTO EN TODA LA TIENDA`.

### WAVE B — Product model/metafields
- Create required definitions/metafields first, including color/size-guide dependencies.
- Replicate 29 products / 98 variants / 95 images.
- Non-overlapping product batches may be prepared/executed by parallel agents ONLY if coordinator guarantees no duplicate handles/SKUs and each product belongs to exactly one lane.
- Preserve handles, SKUs, option names/order, titles, descriptions, prices, images/media order, product types/tags/statuses and theme-required metafields.
- Preserve known legacy handles even when wording differs; do not rename during migration.
- Verify 0 duplicate handles/SKUs before moving on.

### WAVE C — Inventory/physical data
- Serialize final inventory mutation/reconciliation through coordinator.
- Track inventory 98/98.
- Total inventory target = 128 units.
- Weight = 500 g x98 variants unless certified artifact says otherwise.
- Preserve XL KEEP variant and all certified quantities.
- Do not invent stock.

### WAVE D — Collections/order
Replicate collection membership and MANUAL ordering exactly from certified lab.
Do not alter empty Salidas collection yet because that is an owner business decision.

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
One agent may prepare/validate the mapping while coordinator performs the final shipping-profile write.
Validate stored conditions and representative checkout behavior when checkout is available.
If safe, prove exact 299,899 -> paid and 299,900 -> free using reversible test-only artifact, then delete it and reconfirm baseline.

Do NOT upgrade plan merely to obtain carrier-calculated shipping. Envia is fulfillment/labels/quote reference, not live CCS.

## 8. ENVIA
Envia lane may run in parallel once G1 passes.
Install/link Envia to the new official store if supported.
- Use owner account link only when necessary.
- Daniela enters credentials herself if a secret/login is unavoidable.
- Do not expose credentials in chat/GitHub.
- Do not buy a real label.
- Validate connection/configuration only.

## 9. WOMPI TEST ONLY — GATE G4
Preparation may occur in parallel, but final store-specific payment configuration and E2E are serialized through coordinator.

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
Email lane may run in parallel once core store exists.
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
Parallel agents may compute/check independent parity dimensions. Coordinator consolidates one authoritative gate result.
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

Any mismatch: investigate deterministic cause, fix safe/reversible differences and rerun only affected checks.

## 12. OFFICIAL STOREFRONT REGRESSION
Parallel read-only testing is encouraged here. Partition routes/pages to avoid redundant load/throttling.
Run enough regression to prove the official store behaves like the certified lab:
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

If any new official-store-only bug appears, widen testing as needed.

## 13. HISTORICAL DATA
Run as independent assessment lane.
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
- owner commercial decisions still pending;
- detailed timing table and total wall-clock elapsed.

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
Only the coordinator writes `ai-handoff/status.md`, `claude-result.md`, `next-prompt.md` and the authoritative official-store report. Subagents return findings to coordinator; they do not race writes to the handoff files.

Continuously keep privacy-safe evidence in `shopify-migration-backup`.
Create/update:
`shopify-migration/theme/03P-new-standard-store-report.md`

The report must include:
- store identifier + owner account (no secrets);
- creation time;
- Colombia-origin evidence;
- promo/trial terms as actually shown;
- whether billing/plan was activated;
- clean baseline snapshot;
- every migration lane/wave result;
- timing table for every gate/material lane;
- total wall-clock time;
- blocked/wait time and causes;
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

If a true owner-only action is needed, update status to the exact `OWNER_ACTION_REQUIRED_*` state and continue all independent lanes.

When official store migration/testing is complete:
- `LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE`
- `CURRENT_PHASE: WAITING_FOR_CHATGPT`
- `NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION`
- `STATUS: READY_FOR_CHATGPT_REVIEW`
- send `HANDOFF READY 03P-NEW-STANDARD-STORE`
- stop before any public/live action.

## 18. FAIL-SAFE PRINCIPLE
MAXIMUM SPEED does not override correctness. When uncertain, choose the reversible/private/test path and document it. Do not make a business decision for Daniela. Do not expose credentials. Parallelize independent work aggressively; serialize any operation whose collision could corrupt store state.