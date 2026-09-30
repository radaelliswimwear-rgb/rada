# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03J
PHASE: 03J — OWNER CHECKPOINT + COLOMBIA CHECKOUT UNLOCK
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

03I APPROVED BY CHATGPT.

AUTHORITATIVE 03I RESULT:
- AUTONOMOUS_PRE_OWNER_WORK_EXHAUSTED = YES.
- RC1.9 remains unchanged and unpublished.
- RC1.9 SHA-256: fa68a9a9e505b5dce9f8e128f28c6541903729b2a13c7bad6488c1070a06533c
- theme-src = RC1.9 manifest 96/96; remote = ZIP 96/96.
- Horizon live and untouched.
- Radaelli unpublished.
- Payments OFF.
- No owner-only action was executed in 03I.
- No Production/Staging/Vercel/Neon/main/merge/PR/DNS/commercial store touched.
- A1 preflight shows Colombia is already Active, COP, full catalog; shipping is the missing checkout condition.
- B1 preflight shows Shopify test Bogus Gateway is available; Wompi is not currently offered.
- Post-A1 verifier and checkout/payment-result evaluators are ready.
- 03I blocker matrix and owner batch are authoritative for remaining dependencies.

CONTINUITY / OWNER CHECKPOINT RULE:
03J IS intentionally a manual-owner checkpoint. Do not manufacture autonomous work to avoid asking Daniela for a real decision.
Daniela is present now because she relayed HANDOFF READY 03I.
Work ONE owner decision/action at a time. Do not dump the full owner batch on her.
After each answer/action, continue immediately with the next dependency; do not ask her to say "LISTO" when the result is already visible to you.
If a routine Shopify Admin change is technically possible after Daniela provides the required business value/approval, Claude should perform it itself using the authenticated Admin/browser session and then verify it.
Never bypass authentication, billing, payment credentials, legal acceptance, irreversible production actions, or a genuinely new business decision.

EFFICIENCY RULES:
- One active process at a time.
- NO subagents.
- NO workflows.
- NO broad audit/crawl.
- Reuse 03I scripts and evidence.
- Do not rebuild RC1.9 unless 03J actually changes theme code.
- Do not touch A4/D5/etc before A1/B1 unless explicitly called for below.

PRIMARY OBJECTIVE:
Unlock a real Colombia test checkout path safely, using the smallest possible owner interaction, then execute deterministic validation. Target sequence:
SH-D1 -> SH-D2 -> A1 -> post-A1 validation -> B1a test gateway -> safe test E2E -> handoff.
Do NOT attempt real Wompi activation in 03J unless Daniela explicitly chooses it and all required credentials/owner approvals are already available; default 03J payment path is the Shopify test gateway because 03I proved it is available.

STEP 1 — ASK ONLY SH-D1
Ask Daniela for the REAL dispatch/origin address that Radaelli Swimwear will use for Shopify shipping in Colombia.
Explain in one short sentence why Shopify needs it.
Do not ask SH-D2 in the same message.
Do not guess the address from profile/location/memory.
Do not change Admin until she answers.

STEP 2 — SH-D2
After SH-D1 is answered, ask only for the standard shipping charge in COP for Colombian orders below the already documented free-shipping threshold of COP 299,900.
Do not invent the amount.
Confirm that orders at/above COP 299,900 should retain free shipping only if that is already the documented intended rule; if evidence is ambiguous, ask the minimum necessary question.

STEP 3 — EXECUTE A1
Once SH-D1 and SH-D2 are known:
- configure the required Colombia shipping origin/location/profile/zone/rates using the authenticated Shopify Admin when technically possible;
- preserve the existing US configuration unless changing it is strictly required for Colombia checkout and explicitly supported by the 03I evidence;
- do not change entity/legal/business address fields whose purpose/reversibility was NOT_VERIFIED in 03I;
- do not attempt the obsolete/nonexistent actions previously described as making Colombia primary or setting US to Draft unless the current Admin actually exposes a safe supported action and it is necessary;
- record every Admin write made.

STEP 4 — POST-A1 VERIFY
Run the prepared 03I post-A1 verifier.
Operational rule from 03I: maximum 2 consecutive full runs; respect Shopify throttling and restore session/cart/country state.
Required outcome before moving to B1a:
- Colombia product/variant availability permits add-to-cart for the tested in-stock/non-inventory-tracked catalog path;
- Colombia checkout opens to the expected stage without the prior shipping-unconfigured blocker;
- COP context is preserved;
- no real order is created;
- session/cart restoration is confirmed.
If the verifier fails, diagnose only the exact A1 failure. Do not broaden scope.

STEP 5 — B1a OWNER APPROVAL, ONE QUESTION
If A1 passes, ask Daniela for explicit approval to enable Shopify's `(for testing) Bogus Gateway` in the Development Store solely for test transactions.
Explain briefly that this is not a real payment provider and does not charge a real card.
Do not enable it before explicit approval.
Do not ask for Wompi credentials in 03J.

STEP 6 — ENABLE B1a AND RUN SAFE TEST E2E
After approval:
- enable only the Shopify test gateway in the Development Store;
- use the prepared checkout probe/evaluators;
- create only the minimum test order(s) required to validate the authorized test payment outcomes;
- use synthetic/test customer data, never real customer PII;
- validate at least the supported success/failure behavior the prepared tooling can safely exercise;
- document order IDs only if non-sensitive and needed for QA;
- verify order creation/status and confirmation behavior that is available under the test gateway;
- do not use a real card;
- do not enable Wompi;
- do not publish the theme.

STEP 7 — CLEANUP / STATE DECISION
After E2E:
- leave the Development Store in the safest documented test-ready state;
- if the test gateway should remain enabled for subsequent QA, document it clearly; if disabling it is safer and does not erase needed evidence, disable it and document that decision;
- empty test cart/session where appropriate;
- do not delete evidence needed for QA.

STRICT OUT OF SCOPE FOR 03J:
- real Wompi activation/credentials;
- commercial Shopify store creation;
- DNS/domain cutover;
- publishing Radaelli theme;
- Production/Staging/Vercel/Neon/main/merge/PR;
- legal page approval;
- Search & Discovery OAuth;
- wishlist app installation/OAuth;
- analytics account connection;
- media owner uploads;
- inventory quantities;
- XL variant decision;
- customer/order/coupon/newsletter migration;
- D5 repo/versioning approval;
- other C/D/E owner decisions not required to complete A1 + B1a test checkout.

REPORT / HANDOFF
Create `shopify-migration/theme/03J-owner-checkpoint-report.md` and report at least:
1 model
2 elapsed
3 SH-D1 value supplied YES/NO (do not duplicate full private address in public handoff; redact to city/region or state that it was configured)
4 SH-D2 shipping rate decision
5 A1 writes performed
6 post-A1 verifier result
7 Colombia checkout unlocked YES/NO
8 B1a explicit approval YES/NO
9 test gateway enabled YES/NO
10 test E2E outcomes
11 test orders created count
12 confirmation/order-state validation
13 final payment-gateway state
14 RC1.9 changed YES/NO
15 Horizon untouched
16 Radaelli unpublished
17 Production/Staging/Vercel/Neon/main/DNS/commercial store touched NO
18 blockers remaining after 03J
19 READY FOR 03K YES/NO
20 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

When 03J is complete:
- update ai-handoff/claude-result.md with a privacy-safe 03J report;
- create ai-handoff/archive/03J-result.md;
- update status.md to LAST_COMPLETED_PHASE: 03J / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03K / STATUS: READY_FOR_CHATGPT_REVIEW;
- push only handoff files to ai-handoff via established bridge;
- send exactly HANDOFF READY 03J;
- perform finite +1 / +2 / +5 minute checks;
- continue automatically only after ChatGPT publishes READY_FOR_CLAUDE_03K.

If Daniela is not actually available to provide SH-D1, do not consume time on unrelated work. Stop at the checkpoint safely and preserve state.