# Validación de Purchase con la PRIMERA VENTA REAL (decisión de la dueña en el chat, 2026-10-02 ~14:03 Bogotá)

**Decisión:** la dueña NO quiere hacer una compra de prueba. Purchase se valida con el primer pedido real. Hasta entonces: `READY_FOR_PAID_MEDIA = NO` y **no se lanzan anuncios pagados de Meta**. Ya probado en vivo (Test Events, 13:49–13:51): PageView, ViewContent, AddToCart (value 199920 COP) e InitiateCheckout. El producto temporal de COP 5.000 se creó y se **borró sin venderse** (0 pedidos nuevos; catálogo 29/98/95).

## Qué mirar cuando llegue el primer pedido real (hacerlo en los 30 minutos siguientes y repetir a las 24 h)
1. **Shopify (solo lectura):** `node first-order-check.mjs` (carpeta `r03/monitor/`): pago real Wompi SALE/SUCCESS, IVA 0, envío vs 5 tarifas, dirección completa (sí/no), inventario vs línea base y **atribución** (primera/última visita + UTM). Anotar número de pedido y total.
2. **Meta Events Manager** → portfolio Radaelli_Swimwear → ad account «Radaelli Swimwear - Publicidad» (1085190508806751) → Conjuntos de datos → «Radaelli Swimwear Web» (1415307240666037) → **Resumen**:
   - Fila **Comprar (Purchase)**: «Última recepción» de hoy; **fuentes Navegador Y Servidor** (si solo aparece una, anotar cuál falta).
   - Abrir el evento (detalles): **valor = total del pedido de Shopify** y **moneda = COP**; identificador `sh-…`; ¿el recuento de Purchase = 1 por pedido? Revisar «eventos desduplicados» / calidad de coincidencia: el navegador y el servidor deben compartir el mismo `event_id` y contarse **una sola vez**.
   - Comparar: nº de Purchase en Meta (ventana de la hora del pedido) = nº de pedidos pagados de Shopify en la misma ventana.
3. **Atribución:** si la compradora llegó con UTM (anuncio/enlace de prueba), la fila «atribucion» de first-order-check debe mostrar esas UTM; si llegó directo/orgánico, aparece `direct`/`ninguna` (no es falla).
4. **Consentimiento:** con data access «Optimizado» + banner activo, si la compradora pulsó **Rechazar** no habrá evento de navegador ni de marketing: eso NO es un error; anotarlo. Si el pedido es real y Meta no registra Purchase y ella aceptó cookies → es anomalía.

## Cuándo escalar a ChatGPT (`CHATGPT_REVIEW_REQUIRED_META` en `claude-result.md` + entrada `META_ERROR_<n>`)
Purchase no aparece; aparece duplicado (2 por pedido); valor o moneda incorrectos; navegador y servidor no deduplican (mismo `event_id` contado dos veces); se detecta un pixel/dataset distinto de 1415307240666037; el consentimiento bloquea de forma inesperada; Shopify registra la venta y Meta no (o al revés); se pierden las UTM; la única solución aparente sería código/CAPI personalizado.

## Qué NO hacer
No crear otro pixel/dataset; no activar «Always on» sin decisión de la dueña (D13); no lanzar campañas; no usar el pedido real para probar reembolsos; no tocar Wompi LIVE.

## Puertas pendientes para `HANDOFF READY 03R-PAID-MEDIA-MEASUREMENT-CERTIFICATION`
Purchase observado (1 por pedido, COP y valor correctos, dedup), eventos de servidor observados, UTM→pedido, dominio verificado en el portfolio (acción de la dueña en Configuración del negocio), decisión GA4 (G-P4CEL2LM5E no conectado) y tablero actualizado. Mientras falte una = **GAP, no PASS**.
