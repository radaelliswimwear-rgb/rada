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

## CURRENT

- Phase 02H — Product Page
- MODEL: OPUS 5.5 ULTRACODE
- STATUS: READY_FOR_CLAUDE_02H

## NEXT

- 02F Product Card
- 02G Collection
- 02H Product Page
- 02I Cart

## MODEL STRATEGY

02A–02G:
SONNET 5 ULTRACODE

02H:
OPUS 5.5 ULTRACODE — prueba controlada de calidad/consumo.

Después de 02H:
STOP para evaluación antes de decidir el modelo de 02I.

para medir:
- calidad
- consumo
- velocidad
- profundidad
- conveniencia para 02I y fases complejas

## HANDOFF PROTOCOL — ACTIVE CONTINUOUS MODE

Daniela NO debe actuar como intermediaria mientras el flujo esté activo.

Al terminar cada fase 02E, 02F y 02G:

1. Claude actualiza origin/ai-handoff:
   - ai-handoff/claude-result.md
   - ai-handoff/archive/<FASE>-result.md
   - ai-handoff/status.md

2. Claude activa a ChatGPT enviando en la conversación:
   HANDOFF READY <FASE>

3. Después de enviar HANDOFF READY, Claude NO debe declarar MANUAL STEP REQUIRED solo porque ChatGPT tarde en responder.

4. Claude debe permanecer activo en primer plano y verificar periódicamente:
   - origin/ai-handoff/status.md
   - origin/ai-handoff/next-prompt.md

5. Frecuencia objetivo durante un handoff activo:
   cada 20–30 segundos.

6. En cuanto status cambie a READY_FOR_CLAUDE_<FASE>, Claude lee inmediatamente next-prompt.md y ejecuta la nueva fase sin pedir permiso adicional a Daniela.

7. Claude continúa así automáticamente:
   02E → 02F → 02G.

8. Claude solo debe detener el ciclo si ocurre una de estas condiciones:
   - Daniela interrumpe explícitamente;
   - aparece un error real que haga inseguro continuar;
   - una acción requiere credenciales/permisos que Claude no puede obtener de forma legítima;
   - 02G termina y status debe quedar WAITING_FOR_MODEL_SWITCH_TO_OPUS.

9. NO detenerse por timeouts artificiales de 2–3 minutos.
   El protocolo anterior de máximo 2 comprobaciones queda sustituido por este ACTIVE CONTINUOUS MODE.

10. Mientras espera respuesta de ChatGPT:
   - no rehacer trabajo;
   - no avanzar a una fase no autorizada;
   - no inventar prompts;
   - limitarse a comprobar status/next-prompt y mantener el flujo activo.

11. No usar procesos detached u ocultos que sobrevivan al cierre de la sesión.
   El polling debe permanecer ligado a la sesión/agente activo de Claude.

12. Después de 02G:
   - publicar resultado;
   - enviar HANDOFF READY 02G;
   - dejar status WAITING_FOR_MODEL_SWITCH_TO_OPUS;
   - DETENERSE.
   NO iniciar 02H.

## PERMANENT SAFETY RULES

- una fase a la vez
- no Production
- no Staging
- no Vercel
- no Neon
- no Wompi
- no DNS
- no Shopify comercial todavía
- no secrets
- no push a main
- no merge
- no PR
- no extraer cookies/tokens/credenciales
