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

- Phase 02J — Search
- Selected model: OPUS 5.5 ULTRACODE
- STATUS: READY_FOR_CLAUDE_02J

## NEXT

- 02J — Search
- 02K — scope to be defined by ChatGPT after 02J review

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
