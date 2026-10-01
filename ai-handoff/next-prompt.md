# NEXT PROMPT

STATUS: REWORK_REQUIRED_03P_LAB_CERT_FINAL_GAPS
PHASE: 03P-LAB-CERTIFICATION — FINAL MICRO-TESTS ONLY
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

ChatGPT confirms the previous evidence-persistence issue is fixed. The remote backup branch now contains the final report and evidence. Functional certification is accepted in substance.

OWNER STANDARD
Daniela explicitly asked to test everything possible before the official store. Therefore close the few remaining safe/testable gaps before formal LAB_CERTIFIED approval.

DO ONLY THESE MICRO-TESTS
1. EXTERNAL FOOTER LINKS
- Verify all 4 social/external footer links point to the intended destinations and resolve successfully.
- Do not alter anything unless there is a deterministic link bug.

2. TRUE MOBILE ~390 PX
- Run a genuine ~390 px viewport test using safe supported device emulation/viewport tooling if available.
- Check Home, one collection, one representative PDP, Search, Cart, footer/legal.
- Verify no horizontal overflow, clipped text/buttons, unusable menu/variant/cart controls, or broken images.
- If the environment truly cannot provide ~390 px, document the exact limitation and strongest equivalent evidence. Do NOT label 500 px as 390 px.

3. EXACT SHIPPING THRESHOLD — IF SAFELY FEASIBLE
- Prove checkout behavior at exactly COP 299,899 and COP 299,900 using a temporary TEST-ONLY/nonpublic artifact or other reversible method that does not contaminate production-intended catalog.
- Expected: 299,899 => paid regional shipping; 299,900 => free shipping.
- Remove/rollback any temporary artifact and confirm baseline restored: 29 products / 98 variants / 95 images, inventory 128, parity still PASS.
- If Shopify prevents an exact-boundary checkout test without polluting state, document the limitation and preserve the already-verified stored-condition evidence; do not invent success.

4. CLOSEOUT
- Re-run only checks affected by these micro-tests.
- Update `shopify-migration/theme/03P-lab-certification-report.md` and privacy-safe evidence on remote `shopify-migration-backup`.
- Secret scan; no PII/secrets/card data/keys.
- Verify remote fetchability and record actual backup SHA.
- If all safe/testable gaps are PASS (or exact boundary is genuinely not executable but documented), set LAB_CERTIFIED=YES / READY_FOR_NEW_STANDARD_STORE=YES.
- Set LAST_COMPLETED_PHASE: 03P-LAB-CERTIFICATION / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03P-NEW-STANDARD-STORE / STATUS: READY_FOR_CHATGPT_REVIEW.
- Send exactly `HANDOFF READY 03P-LAB-CERT` again.

DO NOT
- create official store;
- pay/activate plan;
- publish/connect DNS;
- turn Wompi live or use real money;
- rerun full expensive suite;
- touch main/merge/PR.

One active process only.
