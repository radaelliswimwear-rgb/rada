# WOMPI — INVESTIGACIÓN OPERATIVA DE REEMBOLSOS / ANULACIONES / REVERSIÓN

Fecha: 2026-10-03 America/Bogota
Prioridad: después de cerrar el paquete legal actualmente en curso; NO detener otras lanes seguras.

## Motivo
Daniela informa que con la compra real de prueba COP 5.000 se intentó devolver el dinero y no fue posible desde el flujo que tenían disponible. Antes de fijar el procedimiento definitivo de devoluciones de Radaelli, Claude debe determinar exactamente cómo se devuelve dinero con la CUENTA WOMPI REAL + integración Shopify de Radaelli.

## Hallazgos oficiales que deben verificarse contra la cuenta real
1. Wompi documenta que para pagos con tarjeta puede existir `Anular transacción` si se hace el mismo día y la red lo permite. Si la red ya no permite anular, Wompi indica solicitar la reversión por sus canales de soporte con datos de la transacción.
2. Wompi documenta reembolsos para ciertas transacciones con tarjeta. Para un reembolso total, la comisión y el IVA de la comisión no necesariamente se devuelven al comercio; el comercio necesita saldo `Disponible` cuando aplique.
3. El reglamento de Wompi contempla que el comercio puede solicitar reembolsos por las opciones de la Wompi Cuenta u otros canales habilitados.
4. Wompi tiene documentación API de reembolsos y anulación, pero NO asumir que esa API esté disponible/sea apropiada para esta integración Shopify ni usar llaves privadas sin necesidad. Primero comprobar el flujo soportado por la cuenta/integración oficial.
5. `Reembolso comercial`, `anulación` y `reversión del pago` son conceptos distintos. No mezclarlos en política ni operación.

## Investigación obligatoria de Claude
Claude debe entrar a Wompi con la sesión ya autorizada de Daniela y determinar, sin mover dinero:
- modelo de la cuenta/integración actual de Radaelli (Agregador/Gateway/u otro que Wompi muestre);
- medios de pago habilitados y, para cada uno, si admite anulación/reembolso/reversión y por qué canal;
- si una orden Shopify pagada vía Wompi permite `Refund` desde Shopify y qué efecto real produce en Wompi;
- si Wompi Cuenta muestra botón de Anular/Reembolsar para una transacción real;
- si soporte Wompi puede procesar reembolso/reversión cuando el botón no existe;
- si existe una ruta de API oficialmente soportada para PRODUCCIÓN en esta cuenta/integración y si requiere configuración adicional;
- si los reembolsos pueden ser totales/parciales por cada medio de pago;
- tiempos esperados;
- qué costos/comisiones NO se recuperan;
- qué saldo disponible exige Wompi;
- cómo registrar/reconciliar Shopify + Wompi + contabilidad cuando la devolución se hace por transferencia bancaria manual;
- qué evidencia debe conservarse para PQR/retracto/garantía/reversión.

## Caso #1002
Usar #1002 como caso de diagnóstico, pero NO ejecutar otro movimiento de dinero sin autorización expresa de Daniela.
Documentar:
- medio de pago real;
- estado Wompi actual;
- si existe Anular/Reembolsar;
- por qué falló el intento anterior;
- alternativa oficial disponible ahora;
- comisión/costo que quedó retenido, si Wompi lo muestra;
- si el dinero ya fue desembolsado a la cuenta bancaria de Daniela.

## Regla de operación provisional
Hasta terminar esta investigación:
- NO prometer en la política pública que el reembolso siempre regresa automáticamente por Wompi o por el mismo medio de pago.
- Sí mantener el compromiso legal de devolver el dinero dentro del plazo aplicable.
- Si Wompi no puede procesar el reembolso por el canal original, preparar procedimiento manual seguro: verificar titular/pedido, obtener datos bancarios directamente por canal privado si hacen falta, transferir desde la cuenta de Radaelli, guardar comprobante, registrar el reembolso en Shopify/Wompi/notas del pedido sin falsear estados, y enviar confirmación a la clienta.
- Nunca pedir datos bancarios sensibles por GitHub.

## Reporte requerido a ChatGPT
Crear sección `WOMPI_REFUND_INVESTIGATION` en `ai-handoff/claude-result.md` con:
- modelo de cuenta;
- medios de pago;
- tabla por medio: anulación / refund / reversión / canal / plazo / costos;
- resultado concreto de #1002;
- procedimiento recomendado para Radaelli;
- cambios necesarios a política pública (si alguno);
- cambios necesarios al manual operativo;
- cualquier owner action que realmente sea necesaria.

No ejecutar reembolso, reversión ni transferencia real sin autorización explícita de Daniela.