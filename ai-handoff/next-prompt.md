# NEXT PROMPT

STATUS: READY_FOR_03R_POST_LAUNCH_REVENUE_MEASUREMENT_AND_STABILIZATION
PHASE: 03R-POST-LAUNCH-REVENUE-MEASUREMENT
MODEL: SONNET 5.5

03Q launch is complete and has passed post-launch certification on the real domain. DO NOT repeat 03P/03Q work unless a concrete regression is detected.

OWNER OPERATING RULE — MINIMIZE DANIELA'S INVOLVEMENT
Claude executes EVERYTHING technically possible. Daniela intervenes ONLY for true owner-only blockers:
- login/authentication/MFA/passkeys/captcha;
- entering private credentials/secrets directly into provider UI;
- explicit approval of real-money spend, refunds, charges or Envia funding/labels;
- legally consequential owner/business decisions that cannot be inferred;
- actions a provider technically restricts to the account owner.
Do NOT ask Daniela to click through routine settings, copy values, inspect dashboards, run tests, or perform work Claude can do from the browser/admin/code/tools. Accumulate unavoidable owner actions into the smallest possible batch.

NO GLOBAL PAUSE
If one lane is blocked by owner authentication or platform delay, park only that lane and continue all other safe lanes. Keep one coordinator and use maximum safe parallelism for independent read-only/reversible tasks.

PRIMARY BUSINESS OBJECTIVE
Radaelli is live. The next objective is to make revenue measurable and operations stable so Daniela can spend on acquisition without flying blind. NO PAID META ADS until attribution is independently validated and duplicate Purchase events are ruled out.

LANE A — CLOSE LAUNCH TEST #1002
1. Verify current Shopify order #1002 state and the corresponding LIVE Wompi transaction.
2. If Wompi still offers same-day annulment and owner confirmation is required, surface exactly one owner action. Otherwise use Shopify refund only if appropriate and explicitly authorized if money movement requires consent.
3. Verify final payment/refund/annulment state in both Shopify and Wompi.
4. Verify inventory and accounting side effects are correct.
5. Permanently delete the temporary test product if still archived/present and safe to delete.
6. Record actual LAUNCH TEST COST (including unrecovered Wompi/provider/Shopify fees if any) instead of estimates.
7. Preserve privacy-safe evidence.

LANE B — META / FACEBOOK & INSTAGRAM OFFICIAL SHOPIFY INTEGRATION
Goal: configure the standard/native Shopify-supported Meta integration with minimum custom code.
1. Before changing settings, consult CURRENT official Shopify and Meta documentation for the supported integration flow, data-sharing options, pixel/dataset behavior and purchase deduplication. Do not rely on stale docs or memory.
2. Install/enable the official Facebook & Instagram sales channel/app if not already installed.
3. Daniela should only handle Facebook/Meta login, MFA, authorization and any asset-selection decision that truly requires her identity. Claude handles every other screen.
4. Connect the correct business portfolio, Facebook Page, Instagram account, ad account, pixel/dataset and commerce assets for Radaelli Swimwear. Do NOT create duplicate pixels/datasets/assets if a correct existing one exists.
5. Prefer the highest standard/native data-sharing level that is appropriate and officially supported, while respecting consent/privacy requirements.
6. Verify domain ownership/verification; preserve the existing facebook-domain-verification TXT.
7. Confirm the production custom domain is the tracked domain.
8. Do NOT launch campaigns or spend money.

LANE C — ATTRIBUTION / EVENT VALIDATION
Claude must PROVE measurement works; 'connected' is not sufficient.
Minimum funnel to validate:
- session / landing-page visit
- product view / ViewContent equivalent
- add to cart
- begin checkout
- purchase
- purchase value and currency
- order ID / event identifiers where available

Testing requirements:
1. Use browser/dev tools/Shopify/Meta diagnostics/test-event tooling as appropriate.
2. Run controlled test sessions with identifiable UTM parameters that contain no personal data, e.g. source/medium/campaign/content test labels.
3. Prove UTMs survive intended redirects and can be reconciled to Shopify/session/order analytics where the platform exposes them.
4. Verify ONE logical Purchase per real order. Check browser + server/CAPI/native events for deduplication; prove duplicates are not counted as separate purchases.
5. Verify purchase value = Shopify order revenue amount and currency = COP.
6. Verify test/internal orders can be identified so they do not contaminate commercial reporting where practical.
7. If Meta requires a real purchase for complete validation, reuse already-authorized evidence from #1002 where supported before proposing another paid test. Do not create another real-money transaction unless truly necessary and owner explicitly approves the exact amount/cost.
8. Capture diagnostics/screens/evidence privately and summarize results numerically in GitHub.

ACCEPTANCE GATE BEFORE PAID META SPEND
Do not mark READY_FOR_PAID_MEDIA until all are true:
- official Meta integration connected to correct assets;
- production domain verified;
- ViewContent/product view observed;
- AddToCart observed;
- InitiateCheckout/begin checkout observed;
- Purchase observed with correct COP value;
- no duplicate Purchase counting across browser/server/native sources;
- campaign/UTM attribution path tested;
- Shopify revenue/order data reconcilable to the test evidence;
- owner dashboard/reporting workflow documented.
If any item cannot be proven, mark it GAP with exact blocker and continue every other lane.

LANE D — SHOPIFY ANALYTICS / OWNER REVENUE DASHBOARD
Create and validate a nontechnical weekly owner view that answers:
1. ad spend;
2. sessions/landing views;
3. product views;
4. add-to-cart rate;
5. checkout-start rate;
6. purchase conversion rate;
7. orders/purchases;
8. revenue;
9. AOV;
10. CPA/CAC;
11. ROAS;
12. MER = total revenue / total ad spend;
13. refunds/cancellations;
14. performance by campaign/creative/product where source data supports it;
15. where the funnel leaks.
Do not invent data or profitability thresholds.

LANE E — UNIT ECONOMICS / BREAK-EVEN
Use the existing unit-economics CSV/template. Populate only verified real inputs. Identify FALTA_DATO for owner/business values not yet known.
Required inputs where applicable:
- product selling price after discount;
- landed/product cost;
- Shopify external-payment transaction fee currently applicable;
- Wompi actual fee structure for this merchant;
- shipping paid by customer vs merchant subsidy;
- packaging/handling cost;
- expected/actual refunds or returns;
- app/monthly platform allocations where useful.
Then calculate per product/offer:
- contribution before ads;
- maximum break-even CPA;
- break-even ROAS;
- contribution after ads at sample CPA levels.
Do NOT call a campaign profitable using revenue-only ROAS if these costs are missing.

LANE F — COOKIE/PRIVACY/CONSENT D13
This is not cosmetic. Resolve before paid advertising if tracking depends on consent rules.
1. Research CURRENT Colombian requirements and current Shopify/Meta behavior using authoritative sources; distinguish legal requirement from platform recommendation.
2. Audit Shopify Customer Privacy / cookie settings and current storefront behavior for Colombia.
3. Audit the privacy policy because the current report notes stale old-stack vendor references. Update only with accurate current processors/integrations; do not invent vendors or legal claims.
4. If consent banner/configuration is required or prudent for the chosen tracking setup, implement it with minimal UX friction and prove analytics/Meta behavior before/after consent as applicable.
5. If a legal choice truly needs Daniela, summarize the exact choice in plain Spanish and ask once; otherwise Claude implements.

LANE G — 72-HOUR POST-LAUNCH MONITORING
Monitor and document without repeatedly bothering the owner:
- domain/DNS/SSL health;
- storefront availability and major routes;
- checkout/Wompi LIVE availability;
- order creation and inventory integrity;
- critical storefront JS/network errors;
- email/notification behavior;
- analytics/event continuity;
- unexpected 404s/redirect regressions;
- no accidental password re-enable/theme change;
- no unexpected tax/IVA line.
Record meaningful incidents only. Do not generate unnecessary real orders.

LANE H — FIRST REAL CUSTOMER ORDER / ENVIA READINESS
Prepare everything Claude can prepare now. When the first true customer order arrives:
- verify paid status, address, SKU/variant, inventory decrement and shipping rate;
- prepare Envia shipment/label workflow;
- owner only funds/purchases the real label if money authorization is required;
- document the exact simple owner SOP.
Do not buy labels for test orders.

LANE I — HANDOVER / DOWNGRADE READINESS BEFORE 2026-10-20
Finish and validate the simple-Spanish owner package:
- OWNER MAINTENANCE MANUAL;
- DNS/domain recovery and rollback;
- Wompi troubleshooting/reconciliation;
- Envia first-order/label workflow;
- inventory/order sanity-check guide;
- product creation/edit guide;
- refunds/cancellations/returns guide;
- promotion/announcement/discount guide;
- theme-safe-edit guide;
- email/sender/notification guide;
- backup/restore strategy;
- credential/secret LOCATION map without secrets;
- app/service/cost/renewal-date register;
- post-launch monitoring checklist;
- common failure playbook;
- CLAUDE-DOWNGRADE-READINESS checklist proving routine maintenance is possible with lower-capacity AI support.
Simplify/standardize anything that unnecessarily depends on bespoke code.

IMPORTANT COMMERCIAL / STORE GUARDRAILS
- Keep Radaelli customer IVA at zero while owner remains NO RESPONSABLE DE IVA, unless owner/accountant later changes the instruction.
- Do not alter product design, variants, prices, discounts, shipping rates or inventory except when specifically required and authorized by the established business rules.
- Current 20% price-vs-compare-at promotion was verified truthful; do not change the commercial promise without owner approval.
- Do not start or publish paid ads.
- Do not touch/delete the certified lab/inactive launch store unless specifically instructed.
- Do not touch main/merge/PR.

REPORTING TO CHATGPT
Update `ai-handoff/claude-result.md` and/or status checkpoints with evidence after each meaningful milestone, not vague progress language. Include:
- what changed;
- exact assets connected (IDs/names only where privacy-safe; never secrets);
- test cases run;
- event counts/results;
- attribution/dedup findings;
- remaining gaps;
- owner blockers, if any;
- time accounting.
When Meta + analytics acceptance gates pass, write exactly:
`HANDOFF READY 03R-PAID-MEDIA-MEASUREMENT-CERTIFICATION`
so ChatGPT can independently review before any paid campaign begins.

TIME ACCOUNTING
Continue separating ACTIVE WORK, OWNER WAIT, PLATFORM WAIT, LAUNCH TEST COST and AVOIDABLE SYSTEM/ORCHESTRATION IDLE. Preserve the previously documented ~37m44s avoidable idle interval; do not hide it or reclassify it.
