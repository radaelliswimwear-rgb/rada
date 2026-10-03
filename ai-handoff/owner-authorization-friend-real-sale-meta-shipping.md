# OWNER AUTHORIZATION — REAL FRIEND SALE FOR META + SHIPPING VALIDATION

Date: 2026-10-03 America/Bogota
Owner: Daniela Radaelli
Store: Radaelli Swimwear

Daniela explicitly authorizes using one genuine purchase by her friend in Bogota as the next real-order validation instead of spending COP 5,000 on another synthetic payment test.

BUSINESS INTENT
- This is a genuine product sale to a real customer/friend who will receive the swimsuit.
- The purchase should validate the real storefront funnel end to end: Shopify checkout, Wompi LIVE payment, Meta Purchase, UTM/order attribution, inventory decrement, shipping rate to Bogota, customer/staff emails, first-order operational checks, and Envia workflow/readiness.
- Do NOT launch paid ads before ChatGPT independently reviews the Purchase evidence and clears the paid-media gate.

PRICE / PAYMENT INSTRUCTION
- Daniela wants the amount charged through Shopify/Wompi for the PRODUCT to be COP 55,000, plus whatever real shipping rate Shopify calculates for the Bogota destination under the certified shipping configuration.
- The remainder of the agreed product price will be transferred directly to Daniela outside Shopify.
- IMPORTANT: this means Shopify/Meta/Wompi will only record the on-platform amount (COP 55,000 + shipping), not the customer's full economic payment. Document this explicitly so it is NOT used as a normal AOV/ROAS/profitability datapoint.

SAFE IMPLEMENTATION PREFERENCE
Do NOT publicly change the normal catalog price of the chosen product/variant to COP 55,000.
Prefer a one-time/private discount applied to the ACTUAL selected product/variant so:
- the real SKU/variant/content_id is used;
- the genuine inventory unit decrements and remains decremented because the product will actually be delivered;
- shipping rules are evaluated normally for Bogota;
- public shoppers never see an incorrect temporary price;
- the order still flows through the normal storefront checkout and Meta partner integration.

Configure the discount as narrowly as Shopify permits: single use, non-combinable, limited to the chosen product/variant and/or customer, with an unguessable code or equivalent safe mechanism. The final product subtotal in the checkout should be COP 55,000 before shipping. Do not alter normal sitewide prices or the 20% pricing baseline.

If Shopify's discount mechanics cannot safely achieve exactly COP 55,000 without changing public pricing, STOP only this lane and report the safest alternative before exposing any wrong public price. Do not silently use a draft-order/invoice flow if that would bypass the normal storefront/browser Meta funnel; the purpose is to validate the real public checkout.

METRICS / ACCOUNTING CLASSIFICATION
Tag/identify this order internally as a validation/friend sale, e.g. `validacion-meta-envio-amiga` or equivalent.
- It IS a real order and should test operational fulfillment.
- It should NOT be included in Daniela's post-launch baseline profitability, normal AOV, ROAS, CPA or 'official launch' commercial performance cohort.
- Preserve it in Shopify/accounting records as the real transaction it is; do not falsify or delete the order after fulfillment.
- In dashboards/reports, create a clearly documented exclusion/filter for this pre-launch validation order when evaluating official paid-media performance.
- Meta will legitimately record Purchase using the Shopify/Wompi on-platform value only; note that this value is intentionally discounted and not representative of normal selling price.

EXECUTION TIMING
The friend has not yet specified the exact product/variant or exact purchase time. Do not prepare irreversible order-specific changes until Daniela provides the chosen item/variant and says the friend is ready to purchase.

OWNER-ONLY ACTIONS
Daniela/friend only handle what truly requires them: entering customer/shipping information, payment credentials/consent, MFA/captcha if prompted, and any real-money/Envia-label authorization.
Claude handles all configuration, monitoring, evidence capture, cleanup of the one-time discount, and reporting.

MANDATORY VALIDATION AFTER PAYMENT
For the resulting real order, prove and report:
1. correct selected real product/variant/SKU and inventory decrement;
2. checkout product subtotal = COP 55,000 before shipping;
3. shipping destination Bogota and exact Shopify shipping rate selected/calculated;
4. Wompi LIVE payment successful and reconciled to the same Shopify order;
5. Meta Purchase observed with current timestamp;
6. Purchase value and currency exactly matching the Shopify order value Meta is expected to report (state clearly whether shipping is included in the event value based on observed payload, do not assume);
7. browser + server/native event behavior and one logical Purchase after deduplication;
8. event/order identifiers available for dedup/reconciliation;
9. UTM / source / customer journey attribution preserved from landing through order when tested;
10. customer and staff notification emails;
11. domain/checkout remain healthy and zero customer IVA remains intact;
12. Envia can read/import the actual order and produce the expected shipping workflow/quote; do not buy a label without owner authorization;
13. one-time discount disabled/deleted after successful use;
14. order remains tagged as validation and excluded from official performance baseline.

If Purchase is missing, duplicated, wrong COP value/currency, Meta/Shopify disagree, UTM is lost, or shipping is wrong, mark `CHATGPT_REVIEW_REQUIRED_META` (and/or shipping equivalent) and do NOT enable paid ads.

When complete, update `ai-handoff/claude-result.md` with the full evidence and request independent ChatGPT review before paid-media GO.
