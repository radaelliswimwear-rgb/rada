# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03P_NEW_STANDARD_STORE
PHASE: 03P-NEW-STANDARD-STORE — CREATE OFFICIAL NORMAL SHOPIFY STORE FROM CERTIFIED LAB
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

AUTHORITATIVE OWNER DECISION
The free Dev Store laboratory is formally certified. Do not modify it except read-only reference unless a deterministic official-store comparison requires it.

Create the intended official commercial store as a SEPARATE NEW NORMAL Shopify merchant store through standard Shopify signup under `radaelliswimwear@gmail.com`.

The inactive transferred `launch` store is NOT the official target. Do not pay, reactivate, subscribe, delete, publish or otherwise alter it.

CURRENT PUBLIC PROMO CHECK
ChatGPT re-verified Shopify Colombia public pages on 2026-10-01: they currently advertise 3 days free followed by 3 months at USD 1/month. This is public marketing, NOT proof of account-specific eligibility.

HARD BILLING RULE
- Before any paid commitment, verify the exact offer shown in the NEW official store/account UI.
- If the expected promo is absent, different, expired, or requires a materially different commitment, STOP and report to Daniela/ChatGPT before selecting a plan or entering billing.
- Do NOT activate/select a paid plan or enter billing without Daniela's explicit approval after showing the exact terms/amount/date visible in the UI.
- Target plan after promo: Shopify Basic monthly unless owner changes it.

ONE ACTIVE PROCESS ONLY
No subagents. No workflows. No parallel prompts. No main/merge/PR.

PHASE GOAL
Create the new normal merchant store and deterministically replicate the certified lab baseline with minimal resource use. Do NOT rediscover or manually rebuild what already exists. Use the certified artifacts, tools and report as the source of truth.

STEP 1 — CREATE / VERIFY STANDARD STORE
- Use normal Shopify merchant signup, NOT Partner Dev Store creation and NOT Client Transfer Store.
- Account/owner target: `radaelliswimwear@gmail.com`.
- If owner authentication/Google sign-in is unavoidable, ask Daniela only for the owner action itself. Never request password, MFA code, passkey, recovery code or secret in chat.
- Keep the store private/password protected.
- Confirm Colombia / COP / America-Bogota / kg.
- Keep US market DRAFT / Colombia intended market.
- Record exact new `.myshopify.com` identifier.
- Record the exact trial/promo text shown in the new store UI before any billing.

STEP 2 — PRE-MIGRATION SNAPSHOT
- Record clean-store baseline and app/theme state.
- Do not connect production DNS/domain yet.
- Do not publish the RC theme yet.

STEP 3 — DETERMINISTIC REPLICATION FROM CERTIFIED LAB
Replicate the certified state using existing backups/tooling and TARGET_STORE-style configuration where available. Apply only missing state and verify each wave.
Target exact baseline:
- RC1.10 theme source/ZIP, unpublished; theme parity 98/98.
- 29 products / 98 variants / 95 images.
- 98/98 inventory tracked, 128 units; weight 500 g x98; XL KEEP.
- Collections/manual order, metafields + size guide.
- Menus and 51 redirects.
- Approved legal pages and Shopify native policies.
- Search & Discovery installed/configured: Talla, Color, Precio; no Disponibilidad.
- Shipping zones: ATL 9,900; resto Caribe 12,900; principales 17,900; resto país 21,900; San Andrés/Amazonía 44,900; free >=299,900.
- Envia installed/linked if technically supported on the new store; fulfillment/labels/quote reference only, not live CCS.
- Wompi official route installed and configured in TEST mode only. Secrets entered only by Daniela directly when owner entry is unavoidable; never expose secrets in chat/GitHub.

STEP 4 — OFFICIAL-STORE PARITY GATE
Run targeted deterministic parity first, then only the necessary official-store regression:
- 8/8 data parity.
- 29/98/95 and 95/95 media.
- 51/51 redirects.
- Inventory 98/98 / 128 units.
- Collections/menus/legal/policies/metafields/S&D.
- Responsive representative smoke at 390/768/1440.
- Cart/search/filter/legal smoke.
- Shipping representative zones + exact 299,899/299,900 threshold if safely testable without polluting final catalog.
- Theme Check/build/secret scan.
Do not repeat broad expensive discovery if deterministic parity already proves unchanged components.

STEP 5 — PAYMENT REGRESSION IN OFFICIAL STORE
After regional shipping is configured and Wompi TEST is ready, perform ONE controlled sandbox E2E if technically supported:
- COP checkout.
- Correct regional shipping.
- Wompi clearly TEST/sandbox.
- Approved sandbox transaction.
- Exactly one Shopify order, no duplicate.
- Correct subtotal/shipping/total.
- Inventory decrement and restoration to certified baseline when appropriate.
- Archive/close test order.
- Zero real money.
Keep Wompi TEST after test.

STEP 6 — HISTORICAL DATA
Historical customers/orders/newsletter/content remain a separate migration item unless authorized source export + required Shopify permissions are available. Do not fabricate or manually recreate PII. If blocked, document exact blocker and later action. This must not silently disappear from the launch checklist.

STEP 7 — BILLING / PROMO GATE
Do NOT activate billing merely because the store is ready.
Before any plan selection or payment authorization, show Daniela in chat:
- exact promo wording visible on this store;
- amount charged now;
- trial end / promo duration;
- when standard Basic billing starts;
- monthly vs annual commitment shown;
- any taxes/fees visible.
Then STOP for Daniela's explicit approval if a billing action is required.

STEP 8 — PRE-LAUNCH HOLD
Even after successful migration/testing:
- do NOT connect/point production domain;
- do NOT remove password;
- do NOT publish RC1.10;
- do NOT turn Wompi live;
- do NOT run a real payment;
- do NOT buy real Envia label;
- do NOT delete certified lab or inactive launch store.
Those belong to final launch phase 03Q after ChatGPT review.

KNOWN OWNER REVIEW BEFORE PUBLICATION
RC1.10 announcement bar says `20 % DE DESCUENTO EN TODA LA TIENDA`. Preserve it during replication. Before 03Q publication, explicitly ask Daniela whether this promotion should remain, change or be removed.

REPORT
Create/update `shopify-migration/theme/03P-new-standard-store-report.md` with:
- new store identifier and owner account (no secrets);
- exact visible promo/trial terms and whether billing was activated;
- baseline/parity results;
- migration counts;
- app/payment/shipping results;
- Wompi sandbox evidence if run;
- historical-data state/blockers;
- deferred 03Q items;
- unresolved blockers count;
- READY_FOR_FINAL_LAUNCH_CERTIFICATION YES/NO;
- ZERO BACKGROUND TASKS.

When the new standard store is fully replicated/tested and no owner billing action remains pending:
- update `ai-handoff/claude-result.md`;
- set LAST_COMPLETED_PHASE: 03P-NEW-STANDARD-STORE / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION / STATUS: READY_FOR_CHATGPT_REVIEW;
- send exactly `HANDOFF READY 03P-NEW-STANDARD-STORE`;
- wait for ChatGPT.

If billing/promo approval is required before the phase can proceed, set an explicit OWNER_APPROVAL_REQUIRED status and ask only that single decision.

FAIL-SAFE
No launch, no production DNS, no live Wompi, no real money, no paid plan without explicit owner approval, no new Dev Store, no touching the inactive `launch` store, and no destruction of the certified lab.