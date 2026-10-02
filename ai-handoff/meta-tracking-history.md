# META / ANALYTICS — HISTORIAL PREVIO PARA DIAGNÓSTICO 03R

Fecha de consolidación: 2026-10-02
Objetivo: dar a Claude antecedentes reales del proyecto para diagnosticar la integración Meta/Shopify actual sin repetir errores antiguos ni asumir que la causa será la misma.

## Hechos recuperados del proyecto anterior

1. Meta Dataset/Pixel existente:
   - Nombre: `Radaelli Swimwear Web`
   - ID: `1415307240666037`
   - Vinculado previamente al entorno publicitario `Radaelli Swimwear - Publicidad`.
   - NO crear otro Pixel/Dataset si este sigue siendo el activo correcto del negocio.

2. GA4 previamente creado:
   - Measurement ID: `G-P4CEL2LM5E`
   - En el stack anterior estaba preparado, pero no necesariamente activo en producción.

3. En la implementación custom anterior, Pixel browser + Meta CAPI quedaron PREPARADOS pero APAGADOS porque `ANALYTICS_RUNTIME_ENABLED` no estaba habilitado en producción.
   - Consecuencia histórica importante: el código podía existir y verse “correcto”, pero no emitía requests reales a Meta/GA4.
   - Por eso, en 03R no aceptar “está configurado” como prueba. Hay que observar eventos reales en producción.

4. Purchase en el stack anterior usaba deduplicación browser + servidor/CAPI:
   - `event_id = purchase:<order.id>`
   - outbox `MarketingEventOutbox`
   - objetivo: un solo Purchase lógico aunque browser y servidor envíen el mismo evento.
   - En Shopify actual usar preferentemente la integración oficial/native y comprobar que Meta deduplica correctamente. NO replicar custom CAPI salvo necesidad demostrada.

5. Gates/consentimiento del stack anterior:
   - Analytics requería `analytics=true`.
   - Meta Pixel/CAPI requería `marketing=true` y que la orden no estuviera excluida.
   - Tráfico interno estaba bloqueado para los destinos de analytics.
   - Los errores de analytics no debían bloquear commerce.
   - En producción no se observaron requests Meta/GA4 mientras el runtime permanecía apagado.

6. Antecedente de checkout/pago que puede confundir Purchase:
   - En una prueba Wompi anterior, Wompi Sandbox mostró APPROVED pero el Payment de la app siguió `PENDING`, sin `wompiTransactionId`/`orderId` finalizados.
   - La causa identificada fue que LocalTunnel murió durante el retorno aunque Next/localhost seguían vivos; al recuperar el mismo hostname se continuó.
   - Lección para 03R: no inferir Purchase solo porque el PSP diga APPROVED. Reconciliar siempre Meta/Shopify con pedido real + pago real + identificador de orden.

## Cómo usar este historial ahora

Este historial NO prueba que el problema actual sea el mismo. Úsalo como árbol de diagnóstico:

A. ¿La integración oficial está realmente activa en producción o solo configurada?
B. ¿El Pixel/Dataset correcto es `Radaelli Swimwear Web` y no un duplicado nuevo?
C. ¿ViewContent / AddToCart / InitiateCheckout / Purchase aparecen en Meta y con timestamps actuales?
D. ¿Purchase llega una sola vez lógicamente aunque exista browser+server/native?
E. ¿Purchase tiene COP y valor correcto?
F. ¿El Purchase corresponde a un pedido Shopify real y pagado?
G. ¿Consentimiento/cookies/privacy está impidiendo eventos de marketing?
H. ¿Tráfico interno/test está siendo filtrado o clasificado distinto?
I. ¿UTM/campaign params sobreviven hasta Shopify/order attribution?
J. ¿Hay bloqueos del navegador/ad blocker/cross-domain/checkout que expliquen diferencias browser vs server?

## Reporte obligatorio de anomalías a ChatGPT

Para CADA error/anomalía encontrada durante 03R, Claude debe registrar en `ai-handoff/claude-result.md` una entrada con este formato:

### META_ERROR_<n>
- Fecha/hora America/Bogota:
- Paso exacto:
- Evento esperado:
- Evento observado:
- Superficie donde se observó: Shopify / Meta Events Manager / navegador / red / checkout / pedido / otro
- Browser recibido: sí/no/desconocido
- Server/native recibido: sí/no/desconocido
- Event ID / Order ID (si aplica; no secretos):
- Valor / moneda:
- UTM presentes: sí/no/no aplica
- Duplicado: sí/no/desconocido
- Consentimiento/cookie state:
- Error textual/código exacto:
- Evidencia:
- Hipótesis actual:
- ¿Coincide con historial anterior?: sí/no/parcial + explicación
- Acción tomada:
- Resultado después de la acción:
- Estado: RESUELTO / ABIERTO / BLOQUEADO_OWNER / BLOQUEADO_PLATAFORMA

No afirmar “funciona” hasta tener evidencia positiva del funnel completo y Purchase deduplicado.

## Regla de escalamiento a ChatGPT

Si Claude encuentra cualquiera de estos casos, debe actualizar inmediatamente `claude-result.md` y marcar `CHATGPT_REVIEW_REQUIRED_META` antes de seguir cambiando arquitectura:
- Purchase no aparece;
- Purchase aparece duplicado;
- currency/value incorrectos;
- browser y server no deduplican;
- se está usando un Pixel/Dataset distinto sin justificación;
- consentimiento bloquea medición de forma inesperada;
- Shopify registra compra pero Meta no;
- Meta registra compra pero Shopify/order no corresponde;
- UTM se pierde;
- la única solución aparente es custom code/CAPI adicional.

Claude puede seguir con otras lanes seguras mientras ChatGPT revisa; no global pause.
