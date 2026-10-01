# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03P_LAB_CERT
PHASE: 03P-LAB-CERTIFICATION — FINAL TEST LAB BEFORE NEW STANDARD STORE
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

OWNER INTENT
Daniela clarified the original strategy: the existing Client Transfer Store is the TEST LAB, not the final paid store. Its purpose is to prove the Shopify version works correctly, run as many safe launch-critical tests as possible, fix issues here for free, and only then create the NEW normal Shopify merchant store to use the current new-store promotion if that store actually shows it.

HARD RULES
- DO NOT transfer, subscribe, pay for, publish, delete, or convert the current Client Transfer Store.
- DO NOT create or activate the new standard promo store in this phase.
- Keep current source/lab PRIVATE, password-protected, Wompi TEST MODE, no real money, no production DNS.
- One active process only. No subagents. No workflows. No main/merge/PR.
- Do not repeat already-proven tests unless a changed configuration could invalidate them; use existing evidence where still valid.

CURRENT LAB BASELINE ALREADY PROVEN
- Colombia / COP / America-Bogota / metric-kg.
- RC1.10 UNPUBLISHED, deterministic hash recorded, remote parity 98/98.
- Catalog 29 products / 98 variants / 95 images.
- Inventory 98/98 tracked, provisional total 128 units; XL KEEP.
- Collections/metafields/navigation/51 redirects prepared.
- 4 legal pages exist; legal 404 count 0; Shopify Terms of Service + Shipping Policy fields are now filled with approved text.
- Search & Discovery targeted smoke PASS.
- Wompi official Shopify route sandbox E2E PASS previously on this lab (#1002), Wompi TEST MODE, no real money.
- Envia linked.
- Free shipping >= COP 299,900 previously PASS.
- Previous live Envia rate below threshold failed, but this is no longer a launch blocker because owner selected Basic + regional flat rates.
- Package remains provisional 15 x 10 x 5 cm / 500 g per variant.

NEW COMMERCIAL DECISIONS TO TEST IN LAB
- Final commercial store will target Shopify Basic.
- subtotal < COP 299,900 => fixed standard shipping rates by Colombian region.
- subtotal >= COP 299,900 => free shipping.
- Envia remains for fulfillment/labels + representative quoting, NOT live CCS at checkout.

PRIMARY OBJECTIVE
Close every remaining test gap that can be safely tested on the private lab. Produce a PASS/FAIL/DEFERRED certification matrix. Fix deterministic safe defects. Do not start the new promo store until ChatGPT reviews the lab result.

OWNER INTERACTION
Claude does all routine navigation, test execution, reversible configuration, documentation and safe fixes.
Daniela only handles owner-only auth/secret entry if unavoidable. Never ask her to send passwords, MFA codes, card data, API keys or Wompi secrets in chat.

TEST SUITE — EXECUTE ONE SECTION AT A TIME

A. LAB INTEGRITY / REPRODUCIBILITY
1. Reconfirm private/untransferred/unpaid lab state.
2. Reconfirm Colombia/COP/Bogota/kg.
3. Reconfirm RC1.10 unpublished, Theme Check/build integrity, deterministic hash and remote parity.
4. Reconfirm exact catalog counts 29/98/95, inventory 98/98 tracked and total 128.
5. Refresh privacy-safe backup/rollback evidence before new tests.

B. FULL LINK / MEDIA / REDIRECT INTEGRITY
1. Validate ALL known storefront/menu/help/legal links, not just a small sample.
2. Validate ALL 51 redirects resolve to expected non-404 destinations; report exact failures.
3. Validate all product/collection/page URLs expected from migration return successful storefront responses.
4. Check all 95 migrated product images/media references for broken/missing responses where technically possible.
5. Check header/footer navigation and legal links, including checkout-linked policies where preview/test checkout allows.

C. RESPONSIVE STOREFRONT SMOKE
Use safe preview/private storefront. Test at minimum widths representative of:
- ~390 mobile
- ~768 tablet
- ~1440 desktop
For each width test Home, one Collection, Search, one representative PDP, Cart and legal/footer navigation.
Check: no overflow/cutoff, menus usable, buttons usable, text not overlapping, images not broken, variant controls usable, cart drawer/page usable.
Do not redesign. Known owner-deferred C4 contrast issue remains accepted unless a new functional defect appears.

D. CATALOG / PDP / INVENTORY BEHAVIOR
1. Automated/structured pass across all 29 products for title/handle/status/price/images/variants/metafields expected.
2. Representative interactive PDP checks across collections and variant structures.
3. Verify selecting size/color variant updates intended variant and can add to cart.
4. Verify cart quantity increment/decrement/remove.
5. Verify inventory tracking/availability behavior on representative low-stock variants; do not intentionally sell real stock.
6. Confirm no duplicate handles/SKUs or obvious migration collisions.

E. SEARCH / COLLECTION / FILTER BEHAVIOR
1. Re-run Search & Discovery smoke because this is final lab certification.
2. Search known terms (at least marea + another product/color term) and one no-result term.
3. Validate Oasis Natural / Aurora Viva / Espuma de Ola memberships against prepared counts.
4. Verify availability/price filters if configured and sorting behavior where present.
5. Verify search/collection links land on valid PDPs.

F. LEGAL / CHECKOUT CONTENT
1. Verify Privacy / Terms / Shipping / Cookies pages render and old redirected URLs resolve.
2. Verify Shopify-native Terms of Service and Shipping Policy fields contain the same owner-approved texts now entered.
3. Verify checkout footer/legal links surface correctly where Shopify test checkout exposes them.
4. Check contact/support references are coherent and no accidental English auto-policy replaced owner-approved Spanish text.

G. REGIONAL FLAT-RATE SHIPPING LAB TEST
This is the NEW strategy and must be proven here before new-store creation.
1. Use Envia quote capability/account if available to obtain representative quotes for provisional package 15x10x5 cm / 500 g from actual origin to at least: Barranquilla/metro, Cartagena, Santa Marta, Monteria, Bogota, Medellin, Cali, Bucaramanga, Pereira or Manizales, one additional intermediate city, and 1-2 remote/high-cost destinations.
2. Do NOT invent commercial rates. Build a proposal of 4-5 simple regions and rounded fixed prices from real quote evidence.
3. Present proposal to Daniela for TEXT approval before setting final lab rates if final amounts are not already approved.
4. After approval, configure the regional flat rates in the LAB only, while preserving free shipping >= COP 299,900.
5. Checkout-test representative addresses for every configured region using non-sensitive test data.
6. Boundary tests: just below threshold (<299,900) must show regional paid rate; at/above 299,900 must show free shipping. Use feasible cart combinations close enough to prove condition logic; document exact tested subtotals.
7. Verify there is no accidental no-shipping gap for ordinary covered Colombia addresses.
8. Remote/excluded areas: document intentional behavior; do not promise universal coverage if quotes/service do not support it.

H. WOMPI PAYMENT PIPELINE REGRESSION
Previous sandbox E2E #1002 passed, so do not create excessive duplicate test orders.
After shipping-rule changes, run ONE controlled Wompi sandbox E2E only if needed to prove shipping + payment coexist correctly on the final lab configuration.
Required evidence if run:
- COP checkout
- correct shipping rule
- Wompi sandbox approval
- Shopify order created exactly once
- no real money
- order archived after evidence
- verify no duplicate order from webhook/return race
Keep Wompi TEST MODE ON.

I. ORDER / INVENTORY / NOTIFICATION REGRESSION
If a new sandbox order is created in H:
1. Verify order line item/variant, subtotal, shipping and total are correct.
2. Verify inventory decrements only as expected; restore test-caused inventory change deterministically afterward if appropriate so lab baseline remains intentional.
3. Verify confirmation timestamp/timezone behavior where visible.
4. Verify expected customer/admin notification configuration or test evidence without exposing private email content in GitHub.
If no new order is necessary, reuse #1002 evidence and note which points cannot be re-proven after new shipping config without another order.

J. CHECKOUT FIELD / ERROR HANDLING
Using test checkout only:
1. Validate required customer email/phone/shipping fields behave as configured.
2. Try one missing/invalid required field and confirm useful validation appears.
3. Verify Colombia remains the intended shipping country/market for launch.
4. Verify cart survives normal back/forward return from checkout where feasible.
5. No real payment.

K. BASIC PERFORMANCE / TECHNICAL HEALTH
1. Theme Check/build/test suite already established: rerun final relevant checks and record counts.
2. Check browser console/network for obvious recurring JS errors on Home/PDP/Cart/Search during final smoke if tooling permits.
3. Record page-load/render blockers only; do not start an unrelated performance redesign.
4. Secret scan all new artifacts.

L. APPS / PERMISSIONS SANITY
1. Search & Discovery installed and functioning.
2. Envia remains linked enough for fulfillment/quote role; do not require CCS.
3. Wompi remains installed TEST MODE.
4. Record app permissions that are broader than needed as cleanup notes, not blockers, unless they pose a concrete launch risk.

M. EXPLICITLY DEFERRED / NOT TESTABLE IN FREE LAB
Do NOT pretend these are proven:
- the new-store promo itself (must be verified on NEW normal store UI);
- production DNS/domain cutover;
- public storefront after password removal;
- Wompi production/live-money transaction;
- real carrier fulfillment/label purchase unless owner later authorizes;
- historical customer/order migration if source export/access is not yet available;
- any Basic-plan-only behavior that Shopify disables specifically on Client Transfer Store and cannot be simulated here.
List each deferred item with reason and exact new-store/final-launch test that will cover it.

FIX POLICY
- Fix only deterministic, reversible, clearly in-scope defects found by these tests.
- Re-run the exact failing test after each fix.
- If theme files change, increment RC sequentially (RC1.11 etc.), rerun Theme Check/build/parity, preserve RC1.10 rollback.
- Do not make aesthetic redesigns without owner request.

LAB_CERTIFIED GATE
Mark LAB_CERTIFIED = YES only if:
1. all testable launch-critical rows are PASS;
2. any remaining DEFERRED rows are genuinely impossible/inappropriate to prove before new standard store and have an exact later verification step;
3. no unresolved critical FAIL remains;
4. regional Basic shipping logic is proven in lab or explicitly blocked solely by quote/owner-rate approval with no other defect;
5. Wompi sandbox evidence remains valid, and if shipping config changed materially one final bounded regression confirms coexistence or is explicitly justified as deferred;
6. source store remains private/untransferred/unpaid;
7. backup and secret scan PASS.

REPORT / HANDOFF
Create `shopify-migration/theme/03P-lab-certification-report.md` with a concise matrix of every section A-M: PASS/FAIL/DEFERRED + evidence + fixes.
Also include:
- current RC/hash/parity
- exact test counts
- shipping region proposal/test results
- Wompi evidence
- all deferred production/new-store tests
- remaining blockers count
- LAB_CERTIFIED YES/NO
- READY_FOR_NEW_STANDARD_STORE YES/NO
- confirmation no transfer/payment/publication/DNS/live Wompi occurred
- ZERO BACKGROUND TASKS

When and only when LAB_CERTIFIED = YES:
- update `ai-handoff/claude-result.md`;
- archive the lab result;
- set status LAST_COMPLETED_PHASE: 03P-LAB-CERTIFICATION / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03P-NEW-STANDARD-STORE / STATUS: READY_FOR_CHATGPT_REVIEW;
- push handoff;
- send exactly `HANDOFF READY 03P-LAB-CERT`;
- wait for ChatGPT before creating the new standard promo store.

FAIL-SAFE
Do not start the promo clock yet. Do not transfer/pay the old store. Do not publish. Do not touch production DNS. Do not turn Wompi live. Do not invent shipping rates. Keep one active process only.