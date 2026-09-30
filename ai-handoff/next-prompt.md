# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03K
PHASE: 03K — OWNER CHECKPOINT 2 + SHIPPING COMPLETION + WOMPI SANDBOX
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03J APPROVED BY CHATGPT.

AUTHORITATIVE 03J RESULT:
- Colombia fulfillment origin configured in Barranquilla, Atlántico (do not expose full private address in handoff files).
- Colombia market active, COP, catalog 29/29 products and 98/98 variants available.
- Colombia checkout opens at `es-co` in COP.
- Free shipping is configured for Colombia at/above COP 299,900, 3–5 business days.
- Shipping below COP 299,900 remains unresolved; one-item orders cannot currently complete checkout.
- Shopify `(for testing) Bogus Gateway` is active with explicit owner approval.
- Test E2E passed: one successful test order, failed/rejected cases did not create orders, full test refund completed.
- RC1.9 unchanged and unpublished.
- Horizon remains live and untouched.
- Radaelli remains unpublished.
- Production/Staging/Vercel/Neon/main/DNS/commercial store untouched.
- Wompi still did not appear in Shopify Admin provider search.

IMPORTANT NEW VERIFIED INFORMATION FROM CHATGPT WEB REVIEW:
Wompi Colombia's official developer site explicitly lists a native Shopify integration and links to an official PDF titled “¿Cómo activar Wompi en Shopify?”. The official guide provides a direct Shopify alternative-provider route and instructs merchants to connect/install Wompi, enter Wompi sandbox public/private keys, enable test mode, configure the Wompi event URL, and then activate Wompi in Shopify.
Official direct Shopify login/provider URL shown by Wompi documentation:
https://accounts.shopify.com/store-login?redirect=%2Fadmin%2Fsettings%2Fpayments%2Falternative-providers%2F11927553
Official Wompi event URL shown by the guide:
https://wompi-integracion-ecommerce-api-prod.conexa.ai/wompi/event
The Wompi guide explicitly supports sandbox/test keys and test mode.
Therefore: the fact that “Wompi” does not appear in Shopify Admin search is NOT sufficient evidence that Wompi cannot be integrated. Use the official direct route before considering business-entity changes or store recreation.

OWNER-BATCH RULE:
Daniela confirmed we are doing the manual batch now.
Guide ONE decision/action at a time.
Do not dump the full remaining batch.
After Daniela provides a business value or approval, Claude should perform routine Admin actions itself when technically possible.
Never ask Daniela to paste passwords, private keys, API secrets, card data, MFA codes or other credentials into chat. If credentials are required, instruct her to enter them directly into the official Shopify/Wompi screen while Claude does not read, copy, store, echo, screenshot, log or commit them.

EFFICIENCY RULES:
- One active process at a time.
- NO subagents.
- NO workflows.
- NO broad audit/crawl.
- Reuse 03I/03J tooling and evidence.
- Do not rebuild RC1.9 unless theme code changes.
- Do not touch unrelated owner items until shipping below threshold and Wompi sandbox path are resolved or conclusively blocked.

PRIMARY OBJECTIVE:
1. Make a one-item Colombia order shippable below COP 299,900 using the real Radaelli shipping method/decision.
2. Attempt the official Wompi Shopify integration in SANDBOX only.
3. Validate Colombia checkout with Wompi sandbox if the official integration succeeds.
4. Preserve all production/launch safety boundaries.

STEP 1 — IDENTIFY THE REAL SHIPPING METHOD, ONE QUESTION ONLY
Ask Daniela only:
“¿Qué mensajería utilizas actualmente para los envíos de Radaelli: Envía Colvanes (envia.co), Envia.com u otra? Si es otra, dime solo el nombre.”

Do not ask the shipping price in the same message.
Do not guess which “Envia” is used from old documents.

STEP 2 — DETERMINE THE SAFEST SHIPPING IMPLEMENTATION
After Daniela identifies the carrier/method:
- inspect the official carrier/service documentation and Shopify-supported path if available;
- determine whether the practical launch path should be:
  A. a flat Shopify rate below COP 299,900; or
  B. a carrier/app-calculated rate.
- Prefer the simplest reliable launch-safe path that matches the owner's actual operation.
- Do not introduce a paid Shopify plan/add-on/app solely to calculate rates without Daniela's explicit approval.
- Shopify's current official documentation states third-party carrier-calculated shipping has plan requirements; do not assume the Dev Store or future production plan includes it.

If exact real-time carrier calculation is not available or would require a paid plan/app/contract, explain that in one short sentence and ask Daniela for ONE flat standard shipping amount in COP for orders below COP 299,900.
Do not invent a rate.

STEP 3 — COMPLETE SHIPPING BELOW THRESHOLD
Once Daniela has chosen/provided the rate or approved carrier integration:
- configure the Colombia shipping option below COP 299,900;
- retain free shipping at/above COP 299,900 unless Daniela explicitly changes that business rule;
- preserve 3–5 business days only if it remains accurate for the selected method;
- verify at least one one-item cart and one >= COP 299,900 cart in Colombia;
- expected: both have an eligible shipping method and checkout can continue;
- do not create an order yet solely for shipping verification.

STEP 4 — CLOSE AC-08 IF POSSIBLE
Ask Daniela only whether the Shopify test order confirmation email from order #1001 arrived in her inbox/spam.
Record YES/NO/NOT_FOUND.
Do not ask her to forward the email or expose its contents.

STEP 5 — PREPARE WOMPI SANDBOX SAFELY
Before changing payment providers:
- verify the official Wompi direct provider route above still resolves to the expected Shopify/Wompi connection flow;
- verify it is Wompi-branded/official and not a third-party impersonation;
- read the exact permissions/installation screen before owner approval;
- do NOT change business entity, legal address, NIT, billing profile or commercial store merely because Wompi was absent from provider search;
- do NOT create a new Shopify store.

If the official route is valid, explain to Daniela in one concise message that Wompi has an official Shopify integration and ask explicit approval to install/connect it in the Development Store for SANDBOX testing only.

STEP 6 — WOMPI INSTALL/CONNECT WITH OWNER CREDENTIAL BOUNDARY
After explicit approval:
- if Bogus Gateway must be disabled before Wompi can activate, document and disable it only when necessary;
- open the official Wompi/Shopify install/connect flow;
- when authentication, OAuth, Wompi login or sandbox public/private keys are requested, Daniela enters them directly on the official screen;
- Claude MUST NOT read/copy/store/log/screenshot/commit private keys, passwords, MFA codes or credentials;
- public key should also remain out of public handoff files even if technically non-secret;
- configure only SANDBOX/test mode;
- configure the official event URL required by Wompi exactly as the current Wompi guide specifies, but verify the current screen before saving;
- do NOT enable Wompi production mode;
- do NOT use real card details.

If the official Wompi direct route rejects the Dev Store or shows a country/entity restriction, capture only the non-sensitive exact error text and stop the Wompi path for ChatGPT review. Do not mutate business entity as a workaround without a separate owner decision.

STEP 7 — WOMPI SANDBOX E2E
Only if Wompi sandbox is successfully connected:
- run the minimum safe Colombia checkout E2E using test/sandbox data supported by Wompi;
- use synthetic customer data;
- validate that checkout remains `es-co` and COP;
- validate successful and failed/pending behaviors only as supported by Wompi sandbox documentation/tooling;
- verify Shopify order/payment state synchronization and Wompi sandbox transaction visibility where safely observable;
- do not use production keys or real money;
- do not publish the theme.

STEP 8 — FINAL PAYMENT STATE
At the end:
- if Wompi sandbox is validated, leave the Development Store in the safest useful sandbox-test state and document which test provider is active;
- do not leave two conflicting payment providers active if Shopify/Wompi does not support it;
- if Wompi sandbox could not be connected, restore/retain Bogus Gateway if needed for continued QA and document the exact blocker.

STRICT OUT OF SCOPE FOR 03K:
- Wompi production activation;
- production/private Wompi keys in chat/files/logs;
- real card/payment;
- commercial Shopify store creation;
- DNS/domain cutover;
- publishing Radaelli;
- Production/Staging/Vercel/Neon/main/merge/PR;
- changing business entity/legal/tax identity merely to force Wompi;
- legal approval, Search & Discovery OAuth, wishlist OAuth, analytics connection, inventory quantities, XL decision, customer/order/coupon/newsletter migration, and unrelated C/D/E items.

REPORT / HANDOFF
Create `shopify-migration/theme/03K-shipping-wompi-sandbox-report.md` with privacy-safe output and at least:
1 model
2 elapsed
3 carrier/method identified
4 shipping implementation chosen
5 shipping below 299,900 configured YES/NO + rate only if non-sensitive business pricing
6 one-item shipping verification
7 >=299,900 free-shipping verification
8 AC-08 email arrival YES/NO/NOT_FOUND
9 official Wompi direct route valid YES/NO
10 owner Wompi sandbox install approval YES/NO
11 Wompi installed/connected YES/NO
12 credentials exposed/stored NO
13 Wompi sandbox enabled YES/NO
14 event URL configured YES/NO
15 Wompi sandbox E2E result
16 Shopify/Wompi state sync result
17 final active test payment provider
18 RC1.9 changed YES/NO
19 Horizon untouched
20 Radaelli unpublished
21 Production/Staging/Vercel/Neon/main/DNS/commercial store touched NO
22 remaining blockers
23 READY FOR 03L YES/NO
24 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

When complete:
- update ai-handoff/claude-result.md with the privacy-safe 03K report;
- create ai-handoff/archive/03K-result.md;
- update status.md to LAST_COMPLETED_PHASE: 03K / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03L / STATUS: READY_FOR_CHATGPT_REVIEW;
- push only handoff files to ai-handoff via the established bridge;
- send exactly HANDOFF READY 03K;
- perform finite +1 / +2 / +5 minute checks;
- continue automatically only after ChatGPT publishes READY_FOR_CLAUDE_03L.
