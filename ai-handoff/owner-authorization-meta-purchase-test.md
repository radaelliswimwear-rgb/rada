# OWNER AUTHORIZATION — META PURCHASE VALIDATION TEST

Date: 2026-10-02 America/Bogota
Owner: Daniela Radaelli
Status: AUTHORIZED

Daniela explicitly authorizes ONE real-money minimal purchase test now for the sole purpose of validating the Meta Purchase event and closing the paid-media measurement gate.

Constraints:
- Use the minimum practical amount, target COP 5,000 unless a lower valid amount is already supported without creating new risk.
- Do not alter real catalog prices, real inventory, shipping rules, tax settings, or customer-facing products.
- Use a temporary internal/test product only if needed, then remove/delete it after validation.
- Daniela herself enters card/payment data and gives final payment consent.
- No paid ad campaign may be launched as part of this test.
- After payment, verify Shopify order/payment, Wompi LIVE transaction, customer/staff notifications as applicable, and cleanup.
- Meta validation must prove Purchase with correct COP value, correct order correlation, no duplicate logical Purchase across browser/server/native delivery, and UTM/order attribution path where testable.
- If Purchase is missing, duplicated, wrong value/currency, UTMs are lost, or browser/server do not deduplicate, write CHATGPT_REVIEW_REQUIRED_META before architectural changes.
- Attempt same-day annulment first if available and owner approval is required; otherwise use the least-cost safe cleanup path and record actual LAUNCH/META TEST COST.
- Record exact evidence and timestamps in ai-handoff/claude-result.md.

This authorization supersedes the earlier owner decision to postpone Purchase validation until the first real customer order.
