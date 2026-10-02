# NEXT PROMPT

STATUS: READY_FOR_03Q_OWNER_GO_WITH_MINIMUM_LEGAL_IDENTITY_GATE
PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
MODEL: SONNET 5.5

03P is formally approved. Continue NO-GLOBAL-PAUSE and revenue-first execution.

ABSOLUTE PUBLIC GATE
Do not execute public/live/irreversible launch steps until Daniela explicitly gives GO in Claude chat.

IMPORTANT CHATGPT REVIEW UPDATE — D9 IS NOT OPTIONAL FOR PUBLIC OPENING
Current SIC guidance applying Article 50 of Colombia's Ley 1480 requires an e-commerce provider in Colombia to disclose, clearly and accessibly, its identity including at minimum: name or business name, NIT, judicial-notice address, telephone, email and other contact data. Do NOT open publicly while the storefront lacks this minimum seller identification.

Minimize owner effort: request ONLY the minimum owner-supplied public data needed for launch, not all F1-F19. Daniela may type sensitive/legal identifiers directly into the provider/admin UI if preferred; do not ask for passwords, MFA, payment card data or secrets in chat/GitHub.

MINIMUM OWNER DATA FOR D9 BEFORE PUBLIC OPENING
- seller legal name / name used on RUT (or company name if applicable)
- NIT as it should be publicly displayed
- judicial-notice/public address
- public telephone/WhatsApp
- public email (prefer info@radaelliswimwear.com if operational; otherwise use the approved current public contact)

Claude must use those values to publish/complete the minimum seller identity/contact information in an accessible location before password removal/public opening. Do not invent any legal identity data.

ALREADY RESOLVED / VERIFIED
- D8 zero IVA: owner states NO RESPONSABLE DE IVA; taxesIncluded=false, taxShipping=false, no Colombian tax rate, fresh checkout with no tax line, prices unchanged.
- Old Vercel site: owner confirms no real customer orders; visible orders are tests only, so L2 is non-blocking.
- radaelliswimwear.com connected inside Shopify as NON-primary/non-public preparation; DNS still Vercel.
- Authoritative Shopify records currently shown for this store: A @ -> 23.227.38.65 and CNAME www -> shops.myshopify.com; no AAAA shown. Re-read the Shopify domain page immediately before cutover and use EXACT store-specific requirements shown then. Preserve MX/TXT/email records and exact Vercel rollback values.
- Meta attribution is required before paid Meta spend, but does not have to block public opening if no paid campaign starts before Purchase attribution + duplicate-event validation.

WHEN OWNER GO IS RECEIVED, EXECUTE SERIAL CRITICAL PATH
1. Confirm D9 minimum seller identity is published/accessibly visible.
2. Wompi LIVE: owner-only toggle/authorization. Keep secrets private.
3. Minimal real-money smoke test only with owner approval of exact amount and disclosure that refund/annulment may still leave a small provider fee. Attempt immediate annulment first if supported; otherwise refund/cancel/cleanup and record actual launch-test cost.
4. Verify real payment flow: order, Wompi status, webhook/event, inventory, customer/staff notifications, cleanup.
5. Re-read exact Shopify domain requirements, then edit only required web DNS records in Hostinger; preserve MX/TXT/email records and rollback values.
6. Wait for Shopify verification/SSL healthy state.
7. Set intended custom domain primary, publish RC1.10, remove storefront password.
8. Immediately run PL-1.0/post-launch certification on REAL custom domain: HTTPS apex/www redirect, Spanish root/canonical/hreflang, home/collections/PDPs/cart/checkout/search/filters/redirects/social links/responsive/critical console-network errors/shipping/Wompi LIVE/inventory/no temp artifacts.
9. On critical failure, re-enable password and/or rollback DNS before accepting traffic/payments.
10. After public launch, connect/validate Meta official integration before any paid campaign; verify funnel + Purchase and no duplicate purchase events.
11. Continue manuals, maintenance, first-order/Envia guide, recovery runbook and Claude-downgrade readiness through 2026-10-20.

OWNER-ONLY ACTIONS
- explicit GO
- provide/enter D9 minimum legal identity/contact data
- Wompi LIVE toggle/authorization if UI requires owner
- enter real card/payment consent for smoke test
- login/MFA/passkey for Shopify/Hostinger/Meta/Wompi if requested
- authorize real spend/Envia funding/label purchases
Everything else: Claude executes.

TIME ACCOUNTING
Continue recording ACTIVE WORK, OWNER WAIT, PLATFORM WAIT, LAUNCH TEST COST, and AVOIDABLE SYSTEM/ORCHESTRATION IDLE separately. Preserve the ~37m44s avoidable idle interval already documented.
