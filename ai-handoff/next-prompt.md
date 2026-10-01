# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_NOTIFICATION_MICROCHECK_ONLY
PHASE: 03P-LAB-FINAL-NOTIFICATION-CHECK
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

OWNER TIMING DECISION
Do NOT create/register the official normal Shopify store before 2026-10-02 08:00 America/Bogota. Daniela wants to maximize the 3-day trial window. The official store will later be created under radaelliswimwear@gmail.com.

CURRENT LAB STATUS
The lab is formally certified and all major tests PASS: theme/data parity, catalog/media, redirects, responsive 390/768/1440, S&D, cart/search/legal, 5 regional shipping zones, exact 299,899/299,900 threshold, Envia linked, Wompi TEST E2E #1003 single order/no duplicate/zero real money, Theme Check/console/secret scan clean.

ONLY TASK NOW — NOTIFICATION MICROCHECK
The original certification intent included order-notification evidence, but the final report does not explicitly document it. Close only this gap today using the existing free Dev Store `radaelli-swimwear-dev`.

Verify, using the safest/lightest available method:
1. Customer order-confirmation notification/template for a test order or Shopify preview/test-send path.
2. Admin/new-order notification behavior/template for the configured admin recipient(s), without exposing addresses/PII in GitHub beyond generic evidence.
3. If Shopify Dev Store or sandbox limitations prevent actual delivery verification, document exactly what can/cannot be proven and capture the strongest safe evidence available. Do not invent PASS.
4. Prefer existing order #1003 evidence, notification preview, resend/test-send, or notification logs over creating another checkout/order.
5. Do not send to real customers. Do not use real money.
6. Confirm baseline remains unchanged: 29/98/95, inventory 128, parity 8/8.

REPORTING
Append a privacy-safe notification section to the existing certification evidence/report on `shopify-migration-backup`. Secret/PII scan. Push and verify remote fetchability.
Update handoff with NOTIFICATION_CHECK PASS or DEFERRED_WITH_REASON.
Then STOP. Do not create the official store tonight.

KNOWN PRE-PUBLISH OWNER REVIEW
RC1.10 announcement bar says `20 % DE DESCUENTO EN TODA LA TIENDA`. Preserve it for now; Daniela decides before publication whether it stays, changes, or is removed.

HARD RULES
- No official store before 2026-10-02 08:00 America/Bogota.
- No billing/plan/payment.
- No publication/DNS.
- Wompi remains TEST; no real money.
- No real Envia label.
- No main/merge/PR.
- One active process only.

When done, send exactly: `HANDOFF READY 03P-NOTIFICATION-CHECK`.