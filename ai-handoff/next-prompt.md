# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03P_LAB_CERT_EXISTING_STORE_FIRST
PHASE: 03P-LAB-CERTIFICATION — EXISTING FREE DEV STORE FIRST
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

AUTHORITATIVE OWNER INTENT
Daniela does NOT authorize creating another Shopify store yet. She remembers an existing Colombia-configured store and wants us to reuse an existing free store if possible.

FIRST ACTION — STORE INVENTORY ONLY, NO CREATION
Before creating, modifying, paying or reactivating anything, enumerate every existing Shopify store visible from the Partner/Dev account now using daniradaelli01@gmail.com. For EACH store capture only non-secret facts:
- exact display name
- myshopify identifier/domain if visible
- store type: Dev Store / Client Transfer Store / normal merchant store
- country/region
- currency
- timezone if visible
- status: active/inactive
- whether Admin opens without selecting a paid plan
- whether it already contains Radaelli migration/theme/catalog data

Explicitly identify:
1. the old original QA Dev Store;
2. the store named similar to `Radaelli Swimwear Colombia`;
3. the store named similar to `Radaelli Swimwear Colombia Launch` / reclaimed launch store;
4. any other store visible.

DO NOT press Create store yet.

SELECTION RULE
- If an existing FREE Dev Store is usable and can be configured/reconfigured to Colombia/COP/America-Bogota/kg, use it as the lab, even if currently empty or in another regional setup, provided changing those safe dev settings is technically allowed.
- Prefer reusing the existing store Daniela remembers over creating another one.
- The inactive reclaimed/merchant store that asks for a paid plan must NOT be paid or reactivated just for testing.
- ONLY if no existing free Dev Store is technically suitable, explain exactly why each fails and ask Daniela for explicit approval BEFORE creating a new Dev Store.

After selecting an existing free Dev Store, recreate deterministically from existing backups/tooling:
- Colombia / COP / America-Bogota / kg.
- RC1.10 theme ZIP/source; verify parity/hash.
- 29 products / 98 variants / 95 images.
- Inventory tracked 98/98, provisional total 128; XL KEEP.
- Collections, metafields, navigation, 51 redirects.
- Approved legal pages + Shopify Terms/Shipping policy texts.
- Search & Discovery configuration.
- Wompi official route in test/sandbox if supported in Dev Store.
- Envia install/link if supported; use for quote reference/fulfillment only, not live CCS.
- Shipping strategy for launch: < COP 299,900 fixed rates by Colombian region; >= COP 299,900 free shipping.

PRIMARY OBJECTIVE
Use an EXISTING free Dev Store to exhaustively test everything safely testable before the official promo clock starts. Fix deterministic defects there. Produce a PASS/FAIL/DEFERRED certification matrix. Do not create the official store until ChatGPT reviews LAB_CERTIFIED = YES.

OWNER INTERACTION
Claude does routine navigation, setup, migration, testing and reversible fixes. Daniela only handles unavoidable owner authentication/secret entry. Never ask her to send passwords, MFA codes, card data, API keys or Wompi secrets in chat.

TEST SUITE AFTER STORE SELECTION
A. Recreate and verify baseline/parity.
B. Validate all storefront/menu/legal links and all 51 redirects.
C. Validate all 95 product images/media references where technically possible.
D. Responsive smoke at ~390 / 768 / 1440 on Home, Collection, Search, PDP, Cart, legal/footer.
E. Structured catalog audit across all 29 products, 98 variants, SKUs, handles, prices, images, metafields.
F. Interactive PDP/cart tests: variant selection, add/remove, quantity, stock behavior.
G. Search/collections/filters/sorting/no-result behavior.
H. Legal/checkout policy rendering and Spanish content consistency.
I. Regional flat-rate shipping design using real Envia quote evidence where available; present 4-5 zone proposal to Daniela before final values.
J. After approval, configure lab shipping zones and test representative addresses for each zone.
K. Boundary shipping tests around COP 299,900: below => paid regional rate; at/above => free shipping.
L. Wompi sandbox E2E on Dev Store if supported: shipping + payment + single Shopify order, no duplicates, no real money.
M. Order/inventory/notification regression if a sandbox order is created.
N. Checkout required fields and validation/error handling.
O. Theme Check/build/test suite, obvious browser console/network errors if tooling permits, secret scan.
P. App sanity: Search & Discovery, Envia, Wompi test mode.

DEV-STORE CONSTRAINTS
- Unlimited test orders/products are allowed.
- Test payments only; no real transactions.
- Password page remains; fine for lab.
- Dev Store cannot become production.
- If an app cannot fully operate in Dev Store because of Shopify/app billing restrictions, mark only that exact behavior DEFERRED and define the mandatory official-store test later.

LAB_CERTIFIED GATE
LAB_CERTIFIED = YES only if all testable launch-critical rows PASS, no unresolved critical/important bug remains, all deferred items are genuinely untestable in Dev Store with exact later verification steps, regional flat-rate logic is proven or only blocked by owner rate approval, Wompi sandbox evidence is valid if supported, and backup/secret scan PASS.

REPORT
Create/update shopify-migration/theme/03P-lab-certification-report.md with PASS/FAIL/DEFERRED matrix, evidence, fixes, current RC/hash/parity, test counts, shipping results, Wompi results, deferred official-store checks, remaining blockers, LAB_CERTIFIED YES/NO, READY_FOR_NEW_STANDARD_STORE YES/NO, and ZERO BACKGROUND TASKS.

When and only when LAB_CERTIFIED = YES:
- update ai-handoff/claude-result.md;
- archive result;
- set LAST_COMPLETED_PHASE: 03P-LAB-CERTIFICATION / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03P-NEW-STANDARD-STORE / STATUS: READY_FOR_CHATGPT_REVIEW;
- push handoff;
- send exactly HANDOFF READY 03P-LAB-CERT;
- wait for ChatGPT before creating the official promo store.

FAIL-SAFE
Do not create any new store without Daniela's explicit approval after inventorying all existing stores. Do not pay/reactivate the inactive reclaimed store. Do not create the official promo store yet. Do not publish. Do not touch production DNS. Do not turn Wompi live. Do not invent shipping rates. Keep one active process only.