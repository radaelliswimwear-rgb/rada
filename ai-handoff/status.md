PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-LAB-FINAL-DEEP-AUDIT
CURRENT_PHASE: 03P-NEW-STANDARD-STORE
NEXT_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_MODEL: SONNET 5.5
STATUS: OWNER_ACTION_BATCH_COMPLETE_READY_FOR_OWNER
USER_ABSENCE_MODE: OWNER_LEAVING_GYM_60MIN_CHATGPT_RELAYS_QUESTIONS

READ FIRST — OWNER BATCH HANDSHAKE
- Daniela is NOT yet released to leave for the gym.
- Immediately read `ai-handoff/owner-absence-window.md` from origin; ChatGPT has strengthened the protocol.
- DO NOT ask Daniela another individual manual question.
- Perform a deliberate sweep of ALL remaining lanes and collect every foreseeable owner-only action for the rest of 03P + immediate 03Q preparation.
- Create/update `ai-handoff/owner-action-batch.md` with ONE consolidated checklist.
- When and only when that checklist is complete, set STATUS exactly to `OWNER_ACTION_BATCH_COMPLETE_READY_FOR_OWNER`.
- Until that exact marker exists, all owner-only findings are appended to the batch and Claude continues independent safe work.
- After the exact marker, ChatGPT will verify the batch and Daniela will perform the consolidated manual block once before leaving.

WHAT COUNTS AS OWNER-ONLY
Only:
- login/authentication/Google/passkey/consent that Claude cannot safely perform;
- direct entry of secrets/credentials into Shopify/Wompi/Envia;
- explicit billing/plan approval after exact terms are shown;
- domain/DNS/password-removal/theme-publication approval;
- Wompi LIVE/real-payment authorization;
- a genuine business-choice decision that cannot be inferred from the certified baseline.
Everything else stays with Claude.

CURRENT OFFICIAL STORE CHECKPOINT
- Global stopwatch start: 2026-10-02 07:36:21 America/Bogota.
- Store: `wgcvpd-ib.myshopify.com`, owner `radaelliswimwear@gmail.com`, normal Shopify trial store.
- Promo captured: 3 free days, then USD 1/month x3 months; Basic USD 25/month + tax after promo; billing NOT submitted.
- Colombia origin verified and corrected before migration: country CO, COP, America/Bogota, kg, Colombia market active; no US market.
- Theme RC1.10 uploaded UNPUBLISHED with parity 98/98.
- Major migration done: 29 products / 98 variants / 95 images; inventory 98/98 tracked / 128 units; 500g x98; collections; pages/policies; menus; 51 redirects; S&D filters Talla/Color/Precio; shipping 5 zones/33 provinces; Envia installed+linked.
- No publish, no DNS/domain cutover, no password removal, no live Wompi, no real money.

BATCH SWEEP MUST INCLUDE AT MINIMUM
1. Shopify plan/billing exact approval terms and whether required now.
2. Wompi TEST credential/secret/owner authorization needs.
3. Envia login/reauthorization needs.
4. Verified sender and staff-notification recipient actions.
5. Any Shopify reauthentication/consent that cannot be automated.
6. Known owner business decisions for 03Q: announcement bar, copy tone, meta descriptions, empty Salidas collection/menu, favorites wording, optional legacy handle renames, historical migration handling.
7. Any owner-only need discovered by parity, regression, payments, email, domain or notification preparation.

PRIORITY WHILE ASSEMBLING THE BATCH
1. Sweep every remaining lane for owner-only dependencies.
2. Re-run deterministic parity and fix safe mismatches.
3. Storefront regression including Instagram/Facebook/TikTok/WhatsApp destinations.
4. Wompi TEST preparation and all non-secret/read-only work.
5. Notification/email review and safe previews.
6. Historical-data assessment.
7. Theme Check/build/secret scan and responsive/cart/search/legal/404/account-route checks.
8. Assemble report/timing evidence + `owner-action-batch.md`.
9. Set `OWNER_ACTION_BATCH_COMPLETE_READY_FOR_OWNER` only when the batch is genuinely complete.

HARD STOPS
- No paid plan/billing submission without Daniela explicit approval.
- No secret entry by Claude if owner-only.
- No Wompi LIVE or production credentials.
- No real payment/order/Envia label.
- No domain/DNS/password removal/theme publish.
- No deletion/touching of certified lab or inactive launch store.
- No main/merge/PR.

NEXT OWNER CONTACT
None until the exact marker `OWNER_ACTION_BATCH_COMPLETE_READY_FOR_OWNER` is written. Do not contact Daniela multiple times.

CLAUDE_BATCH_HANDSHAKE 08:40:12: ai-handoff/owner-action-batch.md is COMPLETE. Official store state: plan Basic monthly ACTIVE (subscribed by owner ~08:12 after exact terms); Wompi connected with TEST keys by owner, test mode ON, events URL set in prod+test; Envia installed+linked (balance 0, no label); PayPal Express DEACTIVATED by Claude (was showing an unconfigured PayPal button; not in baseline); checkout settings: contact email, shipping phone required (Wompi doc); location address replicated from lab. Verified: data parity 7/8 (Q8 by design: plan trial/Basic vs development), Lane D content 7/7, theme 98/98 unpublished, inventory 98/98 tracked 128 uds, 500g x98, shipping 16/16 + exact checkout proof 299,899 -> 9,900 (total 309,799) and 299,900 -> free (total 299,900) with temp products deleted (29 products, 0 leftovers), storefront regression: 29/29 PDP at 390px + 98/98 variants coherent (6 lazy-image false positives retested clean), routes/collections 10/12/7/0/7/7 + all 24+5, search 2/2/3/0, filters Talla XL=11 / Color NEGRO=6 / Price, 404s, 51/51 redirects, 14/14 header-footer links + 4 social destinations HTTP 200, responsive 390/768/1440 no overflow/broken images/errors. ONLY remaining owner-only item that blocks 03P: B1 = sandbox card payment by the owner in the prepared checkout tab (Claude cannot type card numbers). Everything else is 03Q or decisions with defaults. ChatGPT: you can relay owner questions; Claude will poll this repo at 1/2/5 min intervals for your replies.

