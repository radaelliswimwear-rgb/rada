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

- Phase 03C — Real catalog import + collections + metafields + data QA
- Selected model: OPUS 5.5 ULTRACODE
- STATUS: READY_FOR_CLAUDE_03C

## NEXT

- 03C — real catalog import + collections + metafields + real product QA
- 03D — scope to be defined after 03C review

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


## TEMPORARY USER ABSENCE — WORK CONTINUATION RULE

Daniela is away until approximately 13:00 Colombia time today.

During this window:
- Claude + ChatGPT should keep advancing all safely authorized work.
- If one subtask hits a manual owner-only blocker, defer that specific blocker and continue every independent task in the current approved phase.
- Do not idle waiting for Daniela.
- Do not repeatedly ask for manual intervention.
- Never bypass authentication, legal acceptance, billing, or irreversible production controls.
- Manual blockers should be consolidated into one prioritized list for Daniela when she returns.
- Between phases, keep using the finite GitHub checks: +1 minute, +2 minutes, +5 minutes.
- Claude must not invent a next phase; ChatGPT must first review the handoff and write READY_FOR_CLAUDE_<NEXT_PHASE>.


## ABSOLUTE TEMPORARY RULE — NO MANUAL REQUESTS BEFORE 13:00 COLOMBIA

This supersedes any older instruction that says MANUAL STEP REQUIRED during Daniela's temporary absence.

Before approximately 13:00 Colombia time today:
- Claude must not ask Daniela to perform routine or owner-only steps.
- If auth/MFA/email code/legal/billing/owner confirmation is encountered, defer that exact subtask, preserve state safely, and continue every independent authorized task.
- A single blocked subtask must never freeze the whole phase.
- Do not wait on login/code screens.
- Do not ask Daniela to reply LISTO.
- Do not repeat manual requests.
- Consolidate all unavoidable owner-only blockers into one checklist for Daniela after she returns.
- Continue phase-to-phase through ChatGPT handoffs whenever READY_FOR_CLAUDE_<NEXT> is available.


## PHASE 03B RESULT

- Storefront Spanish default; English secondary.
- Currency COP.
- Colombia market active; fallback Colombia.
- Timezone America/Bogota; metric/kg.
- Password page implemented and validated.
- Favorites page exists; temporary ?view=wishlist workaround active until publish.
- New Customer Accounts enabled.
- Customer login-code test remains DEFERRED_OWNER_ONLY_BLOCKER and must not block catalog work.
- Theme current release: RC1.2, SHA-256 00f008b97c8e9097c88079863e565f93a429eb3ffe0485a7a329590263f7c86f.
- Theme Check 0/0.
- Products still 0 at start of 03C.


## PHASE 03B RESULT

- Storefront Spanish default PASS; English remains /en.
- COP PASS.
- Colombia market active; fallback Colombia.
- America/Bogota; metric/kg.
- Password page implemented and validated.
- Favorites page created; temporary ?view=wishlist workaround validated until publish.
- New Customer Accounts enabled.
- Customer login-code test deferred owner-only; does not block 03C.
- Horizon remains live; Radaelli theme unpublished.
- Current Radaelli release RC1.2.
- Theme Check 0/0.
- Catalog still empty at 03B completion.


## ACCELERATED / OVERNIGHT EXECUTION — USER AUTHORIZED

Daniela authorizes accelerated work, including overnight, to reach 100% Development Store readiness as quickly as safely possible.

Rules:
- maximize progress per hour;
- one phase boundary at a time;
- independent subtasks inside a phase may run in parallel using multiple agents/workflows when they do not conflict;
- never run conflicting Shopify writes in parallel;
- prefer scripts, bulk operations, deterministic imports, and batch QA over repetitive manual work;
- do not skip QA gates or lower quality for speed;
- keep rollback/mapping artifacts before bulk writes;
- verify after each bulk write wave;
- if an owner-only blocker appears, defer that exact blocker and continue all independent work;
- overnight, do not repeatedly notify Daniela for blockers that can wait;
- consolidate owner-only blockers for the next time Daniela is available;
- continue normal phase handoffs using +1m / +2m / +5m checks;
- never publish, change DNS/domain, enable real payments, accept charges/billing, or perform irreversible production actions without Daniela.


## PLANNED NIGHT HANDOFF CADENCE — NOT ACTIVE YET

Daniela wants a wider overnight handoff cadence because she will be asleep.

IMPORTANT:
- Do NOT change the current cadence yet.
- Keep current +1m / +2m / +5m checks during the day.
- Only when Daniela explicitly says tonight to activate night mode, change the handoff cadence to:
  - Check 1: +2 minutes
  - Check 2: +5 additional minutes
  - Check 3: +8 additional minutes
- Total maximum handoff wait in night mode: ~15 minutes.
- Still finite: no fourth check, no watcher loop, no indefinite waiting.
- If next prompt is ready at any check, continue immediately.
- Overnight, defer owner-only blockers and keep working on every independent safe task.

Before night mode, when Daniela is back home, prioritize clearing as many unavoidable manual/owner-only blockers as possible so overnight work can continue without her.
