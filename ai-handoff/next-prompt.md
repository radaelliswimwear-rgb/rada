# NEXT PROMPT

STATUS: READY_FOR_03Q_OWNER_GO
PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
MODEL: SONNET 5.5

03P is formally approved by ChatGPT after micro-verification. Do NOT repeat 03P work unless a 03Q check finds a concrete regression.

ABSOLUTE GATE
Do not execute any public/live/irreversible launch step until Daniela explicitly gives GO in chat for 03Q launch/cutover.

When owner GO is received:

1. Re-read `ai-handoff/status.md`, `ai-handoff/owner-action-batch.md`, and `ai-handoff/launch-today-runbook.md` from origin.
2. Keep ONE coordinator and parallelize only safe independent verification lanes.
3. Resolve/document pre-launch business decisions before public opening:
   - D8 taxes/IVA: owner/accountant decision only; never infer or silently change `taxesIncluded`.
   - seller identity/contact/legal notice if owner supplies/approves details;
   - announcement bar 20% decision;
   - verified sender/staff recipient decisions as applicable.
4. Preserve the Vercel site and rollback DNS values until Shopify public launch is fully verified.
5. Before DNS cutover, confirm no owner-visible pending/in-flight old-site orders that require manual handling.
6. Wompi LIVE is owner-only. If enabled, perform the agreed minimal real-payment smoke test only with explicit owner authorization and owner-entered card/consent. Verify payment/webhook/order/email/refund/cancel cleanup before DNS cutover.
7. Connect the existing domain in Shopify and read the exact records Shopify shows before editing DNS. Never rely only on generic target values when authoritative store-specific UI is available.
8. Modify only the minimum DNS records required for web cutover. Preserve MX/TXT/email records. Keep exact rollback values recorded.
9. Wait for Shopify domain verification/SSL. Do not remove the password or publish RC1.10 until domain health is acceptable and the owner GO still stands.
10. Publish RC1.10, set intended primary domain, remove storefront password, and immediately run post-launch certification on the REAL custom domain.
11. Post-launch certification must include at minimum: HTTPS apex + www redirect, root Spanish behavior, canonical/hreflang, Home, collection, representative PDPs, cart/checkout, Search & Discovery, 51 redirects, 4 social destinations, responsive 390/768/1440, console/network critical errors, shipping behavior, Wompi LIVE presence, inventory baseline and no temporary artifacts.
12. If any critical check fails, re-enable password / rollback DNS to Vercel as appropriate before accepting traffic or payments.
13. Do not buy an Envia real label unless there is an actual real order and the owner explicitly authorizes funding/purchase.
14. Historical-data migration remains a separate later project unless the owner explicitly authorizes it.
15. Create final 03Q launch report + privacy-safe evidence on `shopify-migration-backup`, update handoff, and send `HANDOFF READY 03Q-FINAL-LAUNCH-CERTIFICATION`.

HARD STOPS UNTIL OWNER GO
- No DNS/domain cutover.
- No password removal.
- No theme publication.
- No Wompi LIVE.
- No real payment.
- No real Envia label.
- No deletion/touching of certified lab or inactive launch store.
- No main/merge/PR.
