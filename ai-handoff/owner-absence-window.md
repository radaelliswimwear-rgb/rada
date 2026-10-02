# OWNER ABSENCE WINDOW — GYM / BATCH MANUAL ACTIONS

EFFECTIVE: 2026-10-02 immediately after ChatGPT update
OWNER: Daniela Radaelli
DURATION TARGET: approximately 60 minutes
MODE: MAXIMUM SAFE AUTONOMY / ZERO ROUTINE OWNER INTERRUPTIONS

Daniela will be away for approximately one hour and wants Claude + ChatGPT to continue working without requesting scattered manual actions.

## AUTHORITATIVE RULE FOR THIS WINDOW
Do NOT interrupt Daniela for individual owner actions as they arise. Instead, collect ALL owner-only/manual requirements into ONE consolidated batch named:

`OWNER_ACTION_REQUIRED_BATCH`

Examples to batch together when applicable:
- Shopify plan/billing approval after exact terms are documented;
- direct entry of Wompi TEST credentials/secrets if truly required;
- Envia login/authorization if a fresh owner action is still required;
- verified sender / staff-notification recipient choice;
- any Shopify owner reauthentication, consent or secret entry that cannot be safely performed by Claude;
- any genuine business-choice decision that blocks final 03Q preparation.

## KEEP WORKING WHILE OWNER IS ABSENT
Continue every safe/reversible task that does NOT require Daniela, including as applicable:
- deterministic parity rerun and mismatch correction;
- theme parity / Theme Check / secret scan;
- product, variant, media, inventory, collection, metafield, menu and redirect verification;
- social links verification (Instagram, Facebook, TikTok, WhatsApp) against certified baseline;
- storefront regression and responsive checks;
- search / filters / cart / legal / 404 / account-route checks;
- shipping-zone and free-threshold verification that does not require billing;
- Wompi integration preparation and all non-secret configuration/read-only checks;
- notification-template review / safe preview where possible without owner action;
- historical-data assessment;
- evidence/report/timing-table assembly;
- preparation of the exact single owner-action batch.

If one branch becomes blocked by owner action, mark that branch blocked and immediately continue all independent lanes. Do NOT idle the whole project.

## HARD STOPS STILL APPLY
Even during this autonomous window, DO NOT:
- select/submit/accept a paid Shopify plan or billing commitment;
- enter, expose or fabricate owner secrets;
- turn Wompi LIVE or use production credentials;
- run real-money payments;
- connect/modify production domain or DNS;
- remove storefront password;
- publish RC1.10;
- buy a real Envia label;
- touch/delete certified lab or inactive launch store;
- make irreversible/public/live changes.

## BATCH-COMPLETION HANDSHAKE — REQUIRED BEFORE DANIELA LEAVES
Daniela is NOT considered released to leave for the gym until Claude has completed a deliberate sweep of all likely owner-only requirements and written this exact marker to `ai-handoff/status.md`:

`OWNER_ACTION_BATCH_COMPLETE_READY_FOR_OWNER`

Before writing that marker, Claude must inspect every remaining lane and identify ALL currently foreseeable owner-only actions for the rest of phase 03P and immediate 03Q preparation, including at minimum:
1. Shopify plan/billing approval and exact visible terms;
2. Wompi TEST secret/credential entry or owner authorization, if required;
3. Envia login/reauthorization, if required;
4. verified sender/staff-notification recipient actions;
5. any Shopify reauthentication/consent that cannot be automated;
6. owner business decisions already known to be pending;
7. any other owner-only blocker discovered in parity/regression/payment/email/domain preparation.

Claude must consolidate these into ONE checklist in `ai-handoff/owner-action-batch.md` with:
- exact screen/location;
- exact action Daniela must perform;
- why it is needed;
- dependency unlocked;
- whether it is required now or can wait until 03Q;
- exact amount/terms for any billing approval;
- no passwords/MFA/API keys pasted into chat/GitHub.

Until the marker `OWNER_ACTION_BATCH_COMPLETE_READY_FOR_OWNER` exists, Claude MUST NOT ask Daniela another individual manual question. If a new owner-only need appears, append it to the batch and keep working elsewhere.

Once the marker exists and ChatGPT verifies the batch is complete, Daniela may perform that consolidated block once, then leave for approximately 60 minutes. During the absence, no new owner request should be made unless an unforeseeable hard blocker makes all safe independent work impossible; if that exceptional case occurs, write it to GitHub and wait rather than repeatedly interrupting her.

## WHEN TO ASK DANIELA
Only after the batch-completion handshake above is satisfied and the consolidated batch is ready.

At that point, present ONE consolidated checklist, ordered to minimize context switching, with for each action:
- exact screen/location;
- exact action Daniela must perform;
- why it is needed;
- whether it unlocks another dependent step;
- any exact terms/amounts she must approve;
- explicit note never to send passwords/MFA/API keys in chat.

Use status:
`OWNER_ACTION_BATCH_COMPLETE_READY_FOR_OWNER`

Do not ask multiple times for actions that can be grouped.

## CURRENT SAFE WORK PRIORITY
Current checkpoint already has G0/G1 + major migration waves completed. Priority while preparing the batch:
1. deliberate sweep of all foreseeable owner-only actions;
2. rerun official-store parity;
3. storefront regression including 4 social destinations;
4. Wompi TEST prep without exposing secrets;
5. notification/email assessment;
6. historical-data assessment;
7. assemble report + stopwatch/timing evidence;
8. prepare `owner-action-batch.md` and set the exact ready marker.

ChatGPT will continue supervising through GitHub.