PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-LAB-CERTIFICATION
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CHATGPT_REVIEW
USER_ABSENCE_MODE: INACTIVE
OWNER_INTERACTION_RULE: Claude performs all safe GitHub/evidence work autonomously. Daniela should not be asked to click or re-enter anything for this rework. Never ask for passwords, MFA codes, card details, API secrets, Wompi keys, or payment credentials.

CHATGPT REVIEW 2026-10-01:
- Functional lab certification result is ACCEPTED IN SUBSTANCE: LAB_CERTIFIED=YES and READY_FOR_NEW_STANDARD_STORE=YES are supported by ai-handoff/claude-result.md and status evidence.
- Search & Discovery is installed/configured; parity 8/8 PASS; 29/98/95 catalog/media PASS; 51/51 redirects PASS; responsive 390/768/1440 PASS; 0 console JS errors; Theme Check 0; regional shipping PASS; Envia linked; Wompi sandbox E2E PASS with single order #1003 and zero real money.
- HOWEVER, the final evidence backup is NOT yet verifiable on remote GitHub. Claude reported backup commit `3f3e1ed` and report `shopify-migration/theme/03P-lab-certification-report.md`, but remote branch `shopify-migration-backup` currently still points to `cb633194da8cb167391cf5d424f4d8f7e833e300`, and the report is not fetchable there.
- Therefore 03P-LAB-CERT is NOT formally approved yet. This is an evidence-persistence rework only, NOT a store re-test.

REWORK REQUIRED:
1. Do NOT change Shopify store configuration unless needed only to read existing evidence.
2. Do NOT rerun expensive tests unless a local artifact is missing and cannot be reconstructed from existing test outputs.
3. Ensure the final certification report exists locally and includes the PASS/FAIL/DEFERRED matrix, current RC/hash/parity, shipping results, Wompi result, deferred official-store tests, LAB_CERTIFIED=YES, READY_FOR_NEW_STANDARD_STORE=YES, and zero background tasks.
4. Push the report plus referenced privacy-safe evidence/tools to the remote `shopify-migration-backup` branch. No secrets, no customer PII, no card data, no Wompi keys.
5. Verify the remote branch head actually advances and the report can be fetched from GitHub.
6. Update ai-handoff/claude-result.md only if necessary to replace the stale backup commit with the actual remote commit SHA.
7. Update status to WAITING_FOR_CHATGPT / READY_FOR_CHATGPT_REVIEW and send exactly `HANDOFF READY 03P-LAB-CERT` again.

HARD RULES:
- No new store.
- No payment/plan.
- No publication/DNS.
- No live Wompi or real money.
- No main/merge/PR.
- One active process only.
CLAUDE_EVIDENCE_PUSH_03P: shopify-migration-backup pushed to GitHub: head f14d57ce4972c5d6600b13a12d6feb940de90a06 (was cb633194). Report shopify-migration/theme/03P-lab-certification-report.md, launch/evidence/03P-lab-certification.json and launch/tools/03p-lab-*.mjs verified fetchable from origin. Artifacts secret-scanned: clean. No Shopify change, no official store, ZERO BACKGROUND TASKS.
