# SESSION STATE

PROJECT:
Radaelli Swimwear — Shopify Migration

## CURRENT STRATEGY

La web custom actual se conserva intacta.
Shopify se construye en paralelo.
Theme Shopify se construye offline.
No existe Shopify comercial todavía.
No existe Development Store todavía.

## CATALOG SNAPSHOT

29 productos
98 variantes/tallas
95 imágenes

## TARGET COLLECTIONS

- Oasis Natural
- Aurora Viva
- Espuma de Ola
- Salidas de Baño

## DO NOT MIGRATE AS TARGET COLLECTIONS

- Accesorios
- Hombre
- Mujer
- Niños
- Calzado

## COMPLETED

- Phase 01 — catalog/source of truth
- Phase 02 — architecture/blueprint
- Phase 02A — theme skeleton
- Phase 02B — global styles
- Phase 02C — header/navigation
- Phase 02D — footer
- Phase 02E — Home
- Phase 02F — Product Card
- Phase 02G — Collection Page
- Phase 02H — Product Page

## CURRENT

- Phase 03B — Development Store foundation config + password page + customer account real check
- Selected model: OPUS 5.5 ULTRACODE
- STATUS: READY_FOR_CLAUDE_03B

## NEXT

- 03B — store foundation + Spanish/COP + password page + real Customer Accounts validation
- 03C — catalog/data import scope to be defined after 03B review

## MODEL STRATEGY

02A–02G:
SONNET 5 ULTRACODE

02H:
OPUS 5.5 ULTRACODE — controlled quality/resource test.

02I:
OPUS 5.5 ULTRACODE — completed.

02J:
OPUS 5.5 ULTRACODE — ready to execute.

## HANDOFF PROTOCOL — FINITE 1/2/5 MINUTE CHECKS

Daniela should not need to act as intermediary during an active phase handoff.

When Claude finishes a phase and sends:

HANDOFF READY <PHASE>

Claude must use exactly THREE finite verification attempts for ChatGPT/GitHub response.

CHECK 1:
- wait 1 minute after sending HANDOFF READY;
- read origin/ai-handoff/status.md;
- read origin/ai-handoff/next-prompt.md;
- if status is READY_FOR_CLAUDE_<NEXT_PHASE>, immediately execute the new prompt.

CHECK 2:
- only if Check 1 is not ready;
- wait 2 additional minutes after Check 1;
- total elapsed time from HANDOFF READY is approximately 3 minutes;
- read status.md and next-prompt.md again;
- if ready, immediately continue.

CHECK 3:
- only if Check 2 is not ready;
- wait 5 additional minutes after Check 2;
- total elapsed time from HANDOFF READY is approximately 8 minutes;
- read status.md and next-prompt.md one final time;
- if ready, immediately continue.

If after Check 3 the handoff is still not ready:
- DO NOT keep waiting indefinitely;
- DO NOT create more checks;
- DO NOT use watchers;
- DO NOT create an infinite loop;
- report:
  MANUAL STEP REQUIRED — CHATGPT HANDOFF TIMEOUT AFTER 8 MINUTES
- then STOP safely.

This 1 + 2 + 5 minute schedule REPLACES:
- the old 20–30 second continuous polling rule;
- the old 2–3 minute / 2-check rule;
- any indefinite waiting behavior.

While waiting:
- do not redo completed work;
- do not invent the next phase;
- do not use an old next-prompt;
- do not advance without READY_FOR_CLAUDE status;
- keep waits finite and tied to the active Claude session.

If Daniela explicitly interrupts either agent:
STOP.

## PERMANENT SAFETY RULES

- one phase at a time
- no Production
- no Staging
- no Vercel
- no Neon
- no Wompi
- no DNS
- no Shopify commercial store yet
- no secrets
- no push to main
- no merge
- no PR
- no extracting cookies/tokens/credentials
- no detached watchers
- no infinite loops
- no indefinite waits


## CUSTOMER ACCOUNTS CHECKPOINT

After Phase 02K:
- Claude must send HANDOFF READY 02K.
- Claude must STOP.
- Phase 02L — Customer Accounts must NOT start automatically.
- Daniela must explicitly decide the Shopify Customer Accounts UX before 02L.


## CUSTOMER ACCOUNTS DECISION — APPROVED

Daniela approved:
- Shopify New Customer Accounts.
- Passwordless email verification/code.
- Guest wishlist remains available before login.
- Logged-in wishlist must sync across devices.
- Guest favorites merge into the account on login.
- After successful merge, account wishlist is the source of truth.
- "Mis favoritos" remains part of the account experience, using the officially supported Shopify architecture rather than forcing a legacy URL.
- No Classic/legacy password accounts.


## PRE-DEVELOPMENT-STORE CHECKPOINT

After Phase 02M:
- Claude must send HANDOFF READY 02M.
- Claude must STOP.
- Phase 03 must NOT start automatically.
- No Development Store may be created by Claude.
- Daniela must manually create/connect the authorized Development Store before Phase 03.


## DEVELOPMENT STORE — CREATED

Daniela manually created the authorized Shopify Development Store:
- display name: Radaelli Swimwear Dev
- type: Dev
- test plan: Basic
- demo/test data: not generated
- feature preview: not enabled
- visible admin slug: radaelli-swimwear-dev

Phase 03A may now connect via official Shopify CLI.
Any browser authentication/authorization remains a manual Daniela step.
Do not use the Admin "Importar" button unless CLI upload proves impossible.


## PHASE 03A RESULT

- Radaelli RC1 uploaded as unpublished theme ID 189072474431.
- Horizon remains live and untouched.
- Shopify server-side schema limits exposed RC1 issues; corrected.
- RC1 superseded by deterministic RC1.1.
- RC1.1 SHA-256: 28e0f7a026bd15d77582b1473cac4a4da01c40b2210b874c8f09524a90f54df7.
- Real Shopify shell smoke passed.
- Development Store currently uses English / US / USD and must be changed to Spanish / Colombia / COP in 03B.
- New Customer Accounts are already enabled by default; real passwordless login/customer Liquid behavior remains to be verified.


## CONNECTED-PHASE HANDOFF RULE — ACTIVE

From 03B onward, while no manual Shopify/security checkpoint blocks progress:
- Claude sends HANDOFF READY <PHASE> to ChatGPT.
- Claude performs only the finite GitHub checks: +1 min, +2 min, +5 min.
- ChatGPT reviews the handoff and writes the next phase prompt/status.
- If READY_FOR_CLAUDE_<NEXT> appears during those checks, Claude continues automatically.
- Daniela should not need to relay HANDOFF READY messages or say "continue" between normal technical phases.
- Daniela intervenes only for legitimate manual actions such as Shopify authentication, email verification codes, plan/account approvals, or a business decision that cannot be safely inferred.
- After 8 minutes with no ready prompt, Claude stops safely instead of waiting indefinitely.


## AUTONOMOUS SHOPIFY EXECUTION — USER DIRECTIVE

Daniela explicitly wants Claude + ChatGPT to continue without using her as a routine operator.

From 03B onward:
- Claude must perform routine Shopify Admin work itself whenever technically possible through Shopify CLI, official APIs, or the authenticated browser/Admin session.
- Do NOT ask Daniela to manually change language, currency, timezone, units, Pages, templates, menus, navigation, theme settings, metafields/metaobjects, catalog imports, or other routine configuration that Claude can perform.
- A missing CLI command is NOT by itself a reason for a manual step; use the authenticated Admin UI when available.
- Do NOT ask Daniela to reply "LISTO" after routine admin configuration.

Daniela is interrupted only for:
1. login/MFA/device-code/email verification;
2. owner-only legal/permission acceptance;
3. billing/paid plan/charge/payment approval;
4. irreversible production actions such as final publish/domain cutover/real payments;
5. a genuinely new business decision not already decided;
6. a hard permission/tool boundary.

After any necessary manual checkpoint, resume automatically.
Between normal phases, use the finite GitHub handoff checks 1m + 2m + 5m and continue without Daniela relaying messages.
