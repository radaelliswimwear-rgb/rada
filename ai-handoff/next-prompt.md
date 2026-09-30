# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03M
PHASE: 03M — PRE-LAUNCH INTEGRATIONS + BLOCKER BURN-DOWN
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03L APPROVED BY CHATGPT.

AUTHORITATIVE 03L RESULT
- ONLY launch target: `Radaelli Swimwear Colombia Launch` (Client Transfer Store).
- Country/entity/address context: Colombia.
- Currency: COP.
- Timezone: America/Bogota.
- Metric/kg.
- Spanish is published and default on root domain; English remains store primary language for now.
- No transfer, no paid plan, no DNS cutover, no real payment provider.
- RC1.10 unpublished, SHA-256 `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`, remote parity 98/98.
- Catalog: 29 products / 98 variants / 95 images.
- Collections: Oasis 10 / Aurora 12 / Espuma 7 / Salidas 0 / Destacados 7.
- 8 metafield definitions + `size_guide` metaobject.
- Safe sourced pages/menus migrated.
- Redirects: 51/51 present. Four legal destinations remain intentionally absent until legal owner data/approval, so those four redirects temporarily 404.
- Smoke/responsive: 20/20 PASS at 320/390/768/1440.
- Backup branch updated; secret scan 0 blocking findings.
- Both prior Dev Stores remain QA only.

CURRENT OFFICIAL PLATFORM FACTS — RECHECK BEFORE ACTING
Use current official Shopify/Wompi/Envia documentation and current UI as source of truth.
- A Client Transfer Store can run unlimited TEST orders but MUST NOT process real transactions before transfer.
- Free/partner-friendly apps can be installed before transfer; paid apps require a paid plan/card.
- Real shipping labels are not available before transfer.
- Wompi documents an official Shopify Colombia integration with test mode; its onboarding may require production credentials first and test credentials second. Any credential entry is OWNER-ONLY and secrets must never be read, logged, copied, screenshotted into handoff, or committed.

PRIMARY OBJECTIVE
Burn down as many remaining launch blockers as safely possible on the correct Colombia Client Transfer Store WITHOUT transferring ownership, selecting a paid plan, publishing the store, changing DNS, or processing real money.

CRITICAL OPERATING RULE — CLAUDE DOES THE WORK
Daniela wants Claude to perform all Shopify navigation/configuration/actions the authenticated session can perform.
Do NOT hand routine admin work back to Daniela.
Only interrupt her for ONE simple owner action when Shopify technically requires it, such as OAuth approval, MFA, legal acceptance, account selection, or secret credential entry.
After her click/input, resume automatically.

ONE ACTIVE PROCESS ONLY
- No subagents.
- No workflows.
- No broad rediscovery.
- One write/config wave at a time with verification.
- No main/merge/PR.
- Do not touch the two QA Dev Stores except read-only comparison if strictly needed.

STEP 1 — SAFE STORE IDENTITY / LOCALIZATION CLEANUP
On the launch target only:
1. Change the visible store name from `Radaelli Swimwear Colombia Launch` to `Radaelli Swimwear` if this is only the reversible display/store name and does NOT change the permanent `.myshopify.com` identifier. Do not rename the permanent slug.
2. Re-verify Colombia / COP / America-Bogota / metric / kg / Colombia Market.
3. Keep Spanish as the default root-domain storefront language.
4. Investigate changing the Shopify store PRIMARY language from English to Spanish. If Shopify can do this reversibly without rewriting/damaging theme content, do it and run targeted parity/smoke afterward. If Shopify warns that it will rewrite translations/themes or has material side effects, leave primary English and document it for final cutover; do not risk RC1.10.
5. Keep storefront private/password-protected.

STEP 2 — CHECKOUT SETTINGS NEEDED FOR COLOMBIA/WOMPI
Configure safe reversible checkout settings that do not require a payment provider:
- customer contact method = email, if compatible with current store requirements;
- shipping-address phone number = REQUIRED (Wompi official Shopify guidance);
- preserve Colombia address fields;
- do not invent company/NIT requirement unless the selected shipping/payment integration specifically and officially requires it and the field can be labeled/configured safely.
Verify no US-only checkout copy/settings remain.

STEP 3 — SHIPPING: MAXIMUM SAFE PRE-TRANSFER PROGRESS
Business rule from Daniela (authoritative):
- order subtotal >= COP 299,900 => FREE SHIPPING absorbed by Radaelli;
- order subtotal < COP 299,900 => CUSTOMER PAYS the real shipping amount, ideally live/destination-calculated;
- DO NOT invent a flat shipping price.

Do the following on the launch target:
A. Re-check existing Shipping & Delivery state.
B. Configure/verify Colombia shipping zone and the FREE SHIPPING rate for subtotal >= COP 299,900 if this can be done safely and reversibly now.
C. Research/verify the current official Envia.com Shopify app/integration in the live UI and official docs.
D. If Envia.com is FREE or partner-friendly, compatible with Client Transfer Store, and creates no billing commitment, install it. If Shopify requires owner OAuth approval, navigate to the exact approval screen and ask Daniela for that ONE click.
E. If Envia.com requires Daniela to log into/create an Envia account or enter private business/account data, navigate as far as safely possible and ask only for that owner action. Claude must not read/store credentials.
F. Configure all non-sensitive origin/package settings possible using existing authenticated project data. Do not expose the private address in GitHub.
G. Determine whether live checkout carrier rates can actually display before transfer and/or without a paid Shopify feature. If plan-gated, do NOT select a paid plan. Document the exact post-transfer switch/add-on required and leave all preconfiguration ready.
H. Do NOT buy/print a real shipping label.

If dynamic rates cannot be completed pre-transfer, DO NOT block 03M. Continue other work. For checkout testing, use an order >= COP 299,900 so the approved free-shipping rule can be exercised without inventing a below-threshold rate.

STEP 4 — WOMPI OFFICIAL SHOPIFY INTEGRATION: TEST MODE ONLY
Goal: get as far as safely possible on the correct Colombia store.
1. Re-check Wompi's current official Shopify installation route and verify the app/provider identity before installing.
2. If the official Wompi integration is free/partner-compatible and Shopify allows installation on Client Transfer Store, install it.
3. Do NOT use live mode or process real money.
4. Wompi may request production credentials first and test credentials second. These are OWNER-ONLY secrets:
   - navigate to the exact credential screen;
   - tell Daniela exactly which fields she must fill directly;
   - do NOT ask her to paste credentials into Claude/ChatGPT;
   - do NOT read, copy, log, screenshot, or persist the values.
5. Enable TEST MODE only if the integration explicitly supports it on Client Transfer Store.
6. If official Wompi cannot be installed/tested before transfer because of Shopify/Wompi limitations, document the exact blocker and exact post-transfer steps. Do not improvise another gateway as a replacement for production.

STEP 5 — CHECKOUT E2E TEST ON CLIENT TRANSFER STORE
Shopify officially permits unlimited TEST orders on Client Transfer Stores. Complete a test E2E without real money.
Preferred order of payment method:
A. Wompi TEST MODE, if successfully configured and explicitly supported; otherwise
B. Shopify Test payment gateway / supported test gateway.

Rules:
- NEVER use a real payment method/card.
- Use Shopify/Wompi documented test data only.
- Use a cart subtotal >= COP 299,900 so free shipping is valid if live below-threshold rates remain unavailable.
- Verify checkout country Colombia, departments, COP totals, required phone behavior, shipping rate, test payment result, order creation, confirmation page, order status, stock/inventory behavior, notification trigger.
- Clean up/archive/cancel test artifacts as appropriate; no real refund/money movement.
- If owner must open a browser checkout or approve a test gateway, ask for only the one click/action needed.

STEP 6 — SEARCH & DISCOVERY / FREE APP BLOCKERS
Attempt to reduce safe free-app blockers:
- Shopify Search & Discovery: if free/partner-friendly and supported on Client Transfer Store, install/configure relevant filters/recommendations using existing catalog data. If OAuth owner approval is required, ask for one click.
- Do NOT install paid apps.
- Wishlist account-sync custom/draft app: Shopify Client Transfer Store limitations currently prohibit custom/draft apps. Do NOT fight this. Keep guest wishlist working and classify account sync as POST-TRANSFER OWNER AUTH unless Shopify now officially permits the app type.

STEP 7 — ANALYTICS / EMAIL / OPERATIONS
Do all non-account-specific work now:
- verify existing custom pixel remains OFF unless a later explicit owner decision activates it;
- preserve analytics event spec and ensure theme data layer does not leak PII;
- test order notification trigger during E2E;
- if inbox delivery requires Daniela to confirm receipt, ask only after all other autonomous 03M work is exhausted, unless she is already actively present and the test email is time-sensitive;
- no paid analytics account creation.

STEP 8 — LEGAL / OWNER-DATA BLOCKERS: PREPARE, DO NOT INVENT
Do NOT invent NIT, legal name/entity, representative, legal address, or policy commitments.
- Keep Privacy, Terms, Shipping, Cookies pages unpublished/nonexistent until required owner data and approval exist.
- Validate that the four known redirects to those pages are the ONLY intentional 404s caused by missing legal pages.
- Prepare one compact owner-data form/list for the final phase with ONLY the exact missing fields and yes/no approvals; do not interrupt Daniela with it during 03M unless all other work is exhausted.

STEP 9 — INVENTORY / XL / CUSTOMER DATA
Do not invent stock counts or product-size decisions.
- Preserve current no-invented-quantity state.
- Preserve XL discrepancy as PENDING_OWNER.
- Do not migrate customer PII/orders/newsletter contacts without explicit owner decision.
- Prepare deterministic post-decision commands/imports so these can be applied immediately once Daniela decides.

STEP 10 — ACCESSIBILITY / FINAL SAFE FIXES
Re-check only known unresolved reversible issue(s), especially button contrast.
- If objective WCAG-compliant improvement can be made without materially changing brand-approved design, prepare the patch and evidence but do not publish it if it changes an owner-visible brand choice that was previously marked OWNER DECISION.
- No new broad design audit.

STEP 11 — DO NOT TRANSFER/PUBLISH YET
03M MUST NOT:
- transfer ownership;
- choose/activate a paid Shopify plan;
- enter billing card;
- remove storefront password/private mode;
- connect/cut over production domain/DNS;
- publish RC1.10;
- enable Wompi live mode;
- process real money;
- buy real shipping labels.
Those belong to final cutover after blockers are minimized and ChatGPT approves.

STEP 12 — FINAL BLOCKER MATRIX + 03N PREP
At end of 03M, regenerate the blocker matrix and reduce it to the smallest possible final owner/cutover batch.
Classify each remaining blocker as:
- DONE
- POST-TRANSFER REQUIRED
- OWNER FACT/DATA
- OWNER DECISION
- OWNER AUTH/OAUTH
- BILLING/PLAN
- FINAL CUTOVER
- OPTIONAL/DEFERRABLE

Explicitly report:
- whether Envia.com is installed/configured;
- whether below-threshold live rates work pre-transfer;
- whether >=299,900 free shipping works;
- whether Wompi official integration installed;
- whether Wompi TEST MODE works;
- whether checkout E2E passed and with which TEST gateway;
- whether Search & Discovery installed;
- exact intentional legal 404 count;
- exact owner decisions/data still needed;
- exact post-transfer-only items.

STEP 13 — BACKUP / REPORT / HANDOFF
Secret-scan new artifacts, then update `shopify-migration-backup`. No main, no PR.
Create `shopify-migration/theme/03M-prelaunch-integrations-report.md` with privacy-safe evidence.

When complete:
- update `ai-handoff/claude-result.md`;
- archive `ai-handoff/archive/03M-result.md`;
- set LAST_COMPLETED_PHASE: 03M / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03N / STATUS: READY_FOR_CHATGPT_REVIEW;
- push handoff via established bridge;
- send exactly `HANDOFF READY 03M`;
- perform finite +1/+2/+5 checks;
- continue only after ChatGPT publishes READY_FOR_CLAUDE_03N.

FAIL-SAFE
If one integration is blocked by owner auth, account absence, plan restrictions, or pre-transfer limitations, record the blocker ONCE and immediately continue with the next independent workstream. Do not sit idle and do not repeatedly ask Daniela the same question.
