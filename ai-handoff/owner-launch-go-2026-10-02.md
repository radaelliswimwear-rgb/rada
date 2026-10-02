# OWNER GO — 03Q FINAL LAUNCH

Date: 2026-10-02
Owner: Daniela

Daniela explicitly authorizes proceeding with the 03Q launch sequence as soon as the remaining pre-launch checks are complete.

This GO authorizes the staged critical path already defined in `ai-handoff/next-prompt.md` and `ai-handoff/launch-today-runbook.md`:

1. Publish/verify minimum seller identity/contact information already supplied by the owner.
2. Wompi LIVE activation/authorization, with owner-only interaction where required.
3. Minimal real-money smoke test only after the exact amount and possible provider fee are shown to the owner; owner enters card/payment consent herself.
4. Verify order/payment/webhook/inventory/notifications and cleanup.
5. Re-read exact Shopify domain DNS requirements and then cut over only the required web records, preserving MX/TXT/email records and rollback values.
6. Wait for Shopify domain verification and SSL health.
7. Set custom domain primary, publish RC1.10 and remove storefront password.
8. Run immediate post-launch certification on the real custom domain; rollback/re-protect on critical failure.
9. Connect/validate Meta attribution before any paid campaign spend.

Owner preference remains: Claude executes everything that does not strictly require owner identity, login/MFA, private secrets, payment-card entry or explicit real-money consent.

NO GLOBAL PAUSE: if one step is waiting on owner interaction, continue every other safe independent lane that remains.

Time accounting remains mandatory, including active work, owner wait, platform wait, launch-test cost and avoidable orchestration idle time.
