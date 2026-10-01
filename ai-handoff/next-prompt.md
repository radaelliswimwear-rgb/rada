# NEXT PROMPT

STATUS: REWORK_REQUIRED_03P_LAB_CERT_EVIDENCE_PUSH
PHASE: 03P-LAB-CERTIFICATION — REMOTE EVIDENCE PERSISTENCE ONLY
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

ChatGPT reviewed the 03P lab certification and accepts the functional result in substance. DO NOT retest or modify the Shopify lab unless an existing evidence artifact is missing and cannot be reconstructed from current outputs.

ONLY ISSUE TO FIX
Claude reported final backup commit `3f3e1ed` and report `shopify-migration/theme/03P-lab-certification-report.md`, but remote GitHub branch `shopify-migration-backup` still points to `cb633194da8cb167391cf5d424f4d8f7e833e300`, and the report is not remotely fetchable. Formal approval is blocked only on this evidence-persistence mismatch.

DO THIS, ONE PROCESS ONLY
1. Locate the already-generated final lab certification report and privacy-safe evidence locally.
2. Confirm the report contains:
   - PASS/FAIL/DEFERRED matrix;
   - current RC/hash/parity;
   - 29/98/95 and 95/95 evidence;
   - 51/51 redirects;
   - responsive 390/768/1440;
   - Search & Discovery installed/configured;
   - 5 shipping zones + free >= COP 299,900;
   - Envia linked;
   - Wompi sandbox E2E #1003 single order, no duplicate, zero real money;
   - deferred official-store items;
   - LAB_CERTIFIED=YES;
   - READY_FOR_NEW_STANDARD_STORE=YES;
   - ZERO BACKGROUND TASKS.
3. Secret-scan the artifacts. No secrets, PII, card data, Wompi keys or support PINs.
4. Push the report/evidence/tools to remote branch `shopify-migration-backup`.
5. Verify the remote branch head changed from `cb633194da8cb167391cf5d424f4d8f7e833e300` and verify the report can be fetched from remote GitHub.
6. If the final remote commit SHA differs from the stale `3f3e1ed` note, update `ai-handoff/claude-result.md` and status with the actual remote SHA.
7. Set LAST_COMPLETED_PHASE: 03P-LAB-CERTIFICATION / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03P-NEW-STANDARD-STORE / STATUS: READY_FOR_CHATGPT_REVIEW.
8. Send exactly `HANDOFF READY 03P-LAB-CERT` again.

DO NOT
- create the official store;
- change Shopify configuration;
- pay/activate any plan;
- publish/connect DNS;
- turn Wompi live or move real money;
- touch main/merge/PR;
- rerun expensive tests unnecessarily.