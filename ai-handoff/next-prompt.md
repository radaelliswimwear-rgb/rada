# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03P_NEW_STANDARD_STORE
PHASE: 03P-REPLAN — NEW STANDARD SHOPIFY STORE + PROMO + DETERMINISTIC REMIGRATION
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

OWNER DECISION OVERRIDES THE PREVIOUS TRANSFER PLAN
Daniela does NOT want to pay the standard USD 25/month immediately on the existing Client Transfer Store. She wants the original launch strategy: create a NEW NORMAL merchant Shopify store from the standard Shopify signup, use the current Shopify Colombia promotion if the new store actually shows it, and reuse all migration/theme work already completed.

HARD RULES
- DO NOT transfer, subscribe, pay for, publish, delete, or otherwise convert the existing Client Transfer Store.
- Existing Client Transfer Store stays private/untransferred as SOURCE TEMPLATE + rollback until the new normal store passes full parity and checkout tests.
- Final merchant owner login = radaelliswimwear@gmail.com.
- Target plan = Shopify Basic monthly after the promo; current standard price shown to Daniela is USD 25/month.
- Launch shipping rule is now: subtotal < COP 299,900 => standard fixed shipping rate by Colombian region; subtotal >= COP 299,900 => free shipping.
- Envia remains for fulfillment/label generation and for obtaining representative quotes used to design the regional flat rates. Live third-party CCS is NOT a launch requirement on Basic.
- One active process only. No subagents. No workflows. No main/merge/PR.

OFFICIAL FACTS VERIFIED BY CHATGPT ON 2026-10-01
1. Shopify Colombia currently advertises: 3 days free, then USD 1/month for 3 months for normal new-store signup.
2. Client Transfer Stores are explicitly excluded from promotions/free trials after transfer.
3. Shopify supports uploading a theme ZIP into another store.
4. Theme ZIP does NOT contain products, collections, menus, pages, articles, store Files, or other store-level content. Those must be migrated separately.
5. Shopify supports product import/export by CSV; existing deterministic tooling/backups may be reused for the rest of the store data.
6. Do NOT assume the promo is guaranteed until the NEW normal store's own signup/billing screen visibly shows the offer.

SOURCE STORE / TEMPLATE BASELINE
- Client Transfer Store `Radaelli Swimwear`.
- Colombia / COP / America-Bogota / metric-kg.
- RC1.10 UNPUBLISHED, SHA-256 e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c, parity 98/98.
- 29 products / 98 variants / 95 images.
- Inventory tracked 98/98, total provisional stock 128 units; XL KEEP.
- Collections / metafields / navigation / 51 redirects already prepared.
- Legal pages Privacy / Terms / Shipping / Cookies approved and published in private source; Shopify Terms of Service + Shipping Policy fields also filled with approved text.
- Search & Discovery installed/configured.
- Wompi official Shopify route sandbox E2E previously PASS on SOURCE only; new store requires fresh install/configuration/test.
- Envia linked on SOURCE only; new store requires fresh install/link/configuration.
- Package provisional 15 x 10 x 5 cm; 500 g per variant.
- Historical data owner decision = MIGRATE all. Historical orders should be imported as real Shopify orders where technically supported; archive only as backup.

PRIMARY OBJECTIVE
Create or prepare the NEW standard Shopify merchant store under Daniela's normal Shopify account, confirm the promotional offer in the NEW store before any paid commitment, then deterministically recreate the validated source-store state in the new store while keeping it private. Leave a NEW_STORE_MIGRATION_READY gate before any public launch.

OWNER INTERACTION
Claude performs all routine navigation/configuration possible.
Daniela only handles owner-only authentication, account creation confirmation, card entry, MFA/passkey, or irreversible subscription acceptance.
Never ask for passwords, codes, card data, Wompi keys or other secrets in chat.
If an owner-only click is needed, navigate to the exact screen and ask only for that one action.

STEP 1 — FREEZE SOURCE STORE
1. Reconfirm source remains private, untransferred, RC1.10 unpublished.
2. Make a fresh privacy-safe backup of source migration artifacts/theme ZIP if needed.
3. Do not modify source except read-only export/backup actions needed to reproduce it.
4. Preserve old Client Transfer Store as rollback/reference.

STEP 2 — NEW NORMAL STORE SIGNUP
Use standard Shopify merchant signup at shopify.com, NOT Dev/Partner Dashboard.
- Owner account must be radaelliswimwear@gmail.com.
- If account-role cleanup from the previous Partner-email plan is still needed before this signup, use only the already support-approved safe sequence and owner-only actions; do not improvise.
- Create a normal Colombia merchant store.
- Before entering billing or choosing a paid plan, capture/verify the exact promo shown in THIS new store.
PASS target: UI clearly shows a trial/promo equivalent to 3 days free then USD 1/month for 3 months, or current equivalent explicitly offered to this store.
If the new store does NOT show the expected promotion, STOP before paid commitment and report the exact UI/offer. Do not silently accept USD 25.

STEP 3 — INITIAL STORE BASELINE
Before content migration, set only safe non-financial basics:
- Store name Radaelli Swimwear.
- Country/region Colombia.
- Currency COP.
- Timezone America/Bogota.
- Metric units / kg.
- Keep storefront private/password-protected during migration.
- Do not connect production domain yet.

STEP 4 — THEME MIGRATION
- Use RC1.10 ZIP/source files already validated.
- Upload into NEW store as UNPUBLISHED draft.
- Do not assume ZIP duplicates store-level data.
- Verify deterministic file parity 98/98 and hash/equivalence against the validated source candidate.
- Theme remains unpublished until final launch phase.

STEP 5 — STORE DATA REMIGRATION
Reuse existing deterministic migration tooling/backups rather than rebuilding manually.
Migrate/recreate in safe order:
1. products + variants + images: target 29 / 98 / 95;
2. inventory strategy/quantities: tracked 98/98, target provisional total 128, XL KEEP;
3. metafield definitions/values;
4. collections and memberships;
5. pages and approved legal content;
6. menus/navigation;
7. 51 redirects;
8. policies/checkout-linked legal fields;
9. Search & Discovery configuration.
Verify counts/parity after each material wave. Do not commit customer PII to GitHub.

STEP 6 — APPS / PAYMENTS / SHIPPING REINSTALL
NEW store requires fresh setup; source app state does not count as proof.
A. Wompi
- install official supported Shopify route;
- use sandbox/test mode first;
- Daniela enters any secret keys directly if required;
- configure required Events URL(s) without exposing secrets;
- no live money.
B. Envia
- install/link new store;
- use for fulfillment/labels and quote reference;
- do NOT require live CCS on Basic.
C. Search & Discovery
- install/configure if not already recreated in Step 5.

STEP 7 — REGIONAL FLAT-RATE SHIPPING FOR BASIC
Owner decision: Basic + regional standard shipping.
Keep free shipping >= COP 299,900.
For subtotal < COP 299,900, DO NOT use live carrier-calculated checkout rates.
Before setting final values:
- use Envia quoting tools/account where available to obtain representative rates for the provisional 15 x 10 x 5 cm / 500 g package from the actual shipping origin;
- sample at least Barranquilla/metro, Cartagena, Santa Marta, Monteria, Bogota, Medellin, Cali, Bucaramanga, Pereira/Manizales, another intermediate city, and 1-2 remote/high-cost destinations;
- propose 4-5 simple Colombia shipping zones with rounded fixed prices designed to reduce under-collection without obvious overcharging;
- present the proposal to Daniela BEFORE finalizing the rate values.
Do not invent rates.

STEP 8 — PROMO / BASIC PLAN GATE
Do not select or pay for any plan until the NEW store's actual offer is visible and Daniela explicitly approves it.
Target commercial choice: Basic monthly under the current new-store promo, then standard Basic monthly pricing after promo.
Before owner approval, show Daniela:
- exact promo text;
- amount charged now;
- when standard billing begins;
- standard recurring amount shown by Shopify;
- any taxes/fees displayed.
Daniela enters billing details herself.

STEP 9 — CHECKOUT TESTS WHILE PRIVATE
After Basic/promo activation and configuration:
- store remains private;
- Wompi stays TEST MODE;
- verify one sub-COP299,900 checkout shows the correct regional flat rate for representative destinations;
- verify >= COP299,900 shows free shipping;
- run one controlled Wompi sandbox E2E only if needed to prove the NEW store payment integration;
- archive any test order;
- no real money.

STEP 10 — HISTORICAL DATA
Do not block the initial promo/store recreation on historical data if source export is not yet ready.
Owner decision remains MIGRATE all:
- customers;
- historical orders as real Shopify orders where technically supported;
- discounts/coupons where supported;
- newsletter subscribers;
- blog/content history.
Use Shopify-supported import/API path and never expose customer PII in GitHub. Preserve archive backup as secondary evidence only.

STEP 11 — NEW_STORE_MIGRATION_READY GATE
03P-REPLAN is complete only when:
1. NEW standard merchant store exists under the correct merchant owner account;
2. expected promo was confirmed before paid commitment, or exact discrepancy documented before paying;
3. Basic plan/promo active only with Daniela's explicit approval;
4. Colombia/COP/Bogota/kg correct;
5. RC1.10-equivalent theme uploaded UNPUBLISHED with parity PASS;
6. catalog/images/variants parity PASS (29/98/95 unless a documented owner-approved change occurs);
7. inventory/collections/metafields/pages/navigation/redirects parity PASS;
8. legal policies intact;
9. Wompi sandbox/test integration works on NEW store;
10. Envia installed/linked for fulfillment/quoting;
11. regional flat-rate shipping <299900 configured and tested;
12. free shipping >=299900 preserved and tested;
13. no real money;
14. storefront remains private;
15. production domain/DNS untouched;
16. source Client Transfer Store remains intact as rollback/reference.

STEP 12 — REPORT / BACKUP / HANDOFF
Create/update a 03P new-standard-store migration report with:
- promo evidence;
- owner/store identity (non-secret only);
- plan/billing basis (no card info);
- theme parity;
- catalog/data counts;
- apps/payment/shipping test results;
- remaining launch blockers;
- confirmation source store was not transferred/deleted;
- secret scan + backup;
- ZERO background tasks.

Only when NEW_STORE_MIGRATION_READY = YES:
- update ai-handoff/claude-result.md;
- archive result;
- set LAST_COMPLETED_PHASE: 03P / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03Q / STATUS: READY_FOR_CHATGPT_REVIEW;
- push handoff;
- send exactly HANDOFF READY 03P.

FAIL-SAFE
- Never pay/transfer the old Client Transfer Store.
- Never delete the old source store before the new store is fully validated and Daniela later authorizes cleanup.
- Never assume promo eligibility; verify the NEW store UI.
- Never publish/connect production domain/enable real Wompi during 03P.
- Never ask for or store secrets.
- Never invent shipping rates.
- Keep one active process only.