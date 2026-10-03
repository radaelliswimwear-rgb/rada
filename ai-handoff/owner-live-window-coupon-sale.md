# OWNER LIVE WINDOW — CUPÓN + VENTA REAL DE VALIDACIÓN

Fecha: 2026-10-03 America/Bogota
Estado: OWNER ONLINE / AVAILABLE NOW

## Instrucción general
Daniela está disponible ahora para resolver de inmediato cualquier bloqueo verdaderamente owner-only. Claude debe CONTINUAR trabajando sin pausas y pedir intervención solo para autenticación/MFA/passkey/captcha, autorización de permisos, decisiones jurídicas/negocio no inferibles, movimientos de dinero, recargas/guías, o acciones que Shopify/Meta/Envia fuerce a la propietaria.

No pedirle inspecciones rutinarias ni clics que Claude pueda hacer.

## CUPÓN PARA VENTA REAL DE VALIDACIÓN
La próxima compra real será de una amiga en Bogotá y debe servir simultáneamente para validar:
- funcionamiento de CUPONES;
- tarifa real de envío a Bogotá;
- Wompi LIVE;
- decremento real de inventario de la variante comprada;
- emails/notificaciones;
- Meta Purchase (browser + server/native) con deduplicación;
- valor y moneda COP;
- UTM / atribución del pedido;
- preparación y flujo real de Envia.

### Reglas del cupón
1. NO cambiar el precio público normal del producto.
2. Cuando Daniela indique producto/color/talla exactos, crear un CUPÓN PRIVADO DE UN SOLO USO que deje el SUBTOTAL DEL PRODUCTO en exactamente COP 55.000 antes del envío.
3. Restringirlo al producto/variante elegida cuando Shopify lo permita de forma segura.
4. Uso máximo global = 1.
5. Si es práctico, restringir al correo de la compradora; si ello introduce fricción o riesgo innecesario, no es obligatorio.
6. Código no predecible/no genérico. No usar AMIGA, 50OFF, etc.
7. Envío se cobra APARTE y debe salir de la configuración real de Shopify para Bogotá; no falsear ni sobreescribir la tarifa para la prueba.
8. Después de la compra, dejar el cupón desactivado/agotado y documentar configuración y resultado.
9. Esta venta debe quedar etiquetada como `validacion-meta-envio-amiga` o equivalente claro.
10. NO borrar ni falsificar la orden: es una venta real y se despacha realmente.

### Métricas
Esta venta NO debe formar parte del baseline comercial oficial para AOV/CPA/ROAS/MER/rentabilidad del lanzamiento de pauta, porque el precio en Shopify será excepcional y parte del valor económico del producto se pagará por fuera mediante transferencia directa a Daniela.

Registrar por separado:
- valor cobrado en Shopify/Wompi;
- descuento aplicado;
- envío cobrado;
- valor final de la orden Shopify;
- costo/comisión Wompi si visible;
- transferencia externa como dato contable pendiente de Daniela, sin inventar monto;
- tag de exclusión de baseline.

## VALIDACIÓN META OBLIGATORIA CON ESTA ORDEN
Tras el pago real, comprobar y reportar:
- Purchase presente en Meta;
- timestamp actual;
- currency = COP;
- value = valor real cobrado por Shopify que corresponda al evento;
- order/event identifiers disponibles;
- browser received sí/no;
- server/native received sí/no;
- deduplicación correcta: 1 Purchase lógico por 1 orden;
- UTM/source/medium/campaign en Shopify customerJourneySummary o superficie equivalente;
- concordancia Shopify ↔ Wompi ↔ Meta;
- si hay discrepancia, usar formato META_ERROR_<n> y marcar CHATGPT_REVIEW_REQUIRED_META antes de cambios arquitectónicos.

NO iniciar pauta pagada hasta que ChatGPT revise el handoff final de Purchase.

## ENVÍO / POLÍTICA
Aplicar la decisión aprobada por Daniela para la política de envíos:
- Radaelli prepara y entrega el pedido a transportadora normalmente el mismo día hábil o, como máximo, el siguiente día hábil después de confirmarse el pago.
- El tiempo de transporte/entrega depende del destino y transportadora.
- Cuando exista una estimación disponible, comunicarla al comprador.
- Mantener el marco legal: cumplir el plazo informado/aceptado y, cuando no exista uno distinto, respetar el máximo legal de 30 días calendario.
- No prometer todavía un plazo nacional exacto hasta validar tiempos reales de Envia.

Daniela confirma que puede responder PQR/reclamos con número de radicado, fecha y hora.

## PENDIENTES QUE CLAUDE DEBE AVANZAR AHORA SIN ESPERAR
Continuar todas las lanes seguras y cerrar/avanzar:
1. Legal objetivo ya aprobado: envíos/términos/contacto-PQR; verificar que el texto nuevo esté realmente en español/inglés/checkout.
2. Preparar publicación del enlace visible a SIC y “Preferencias de cookies” en footer si es objetivamente correcto; si requiere autorización owner-only, pedirla ahora.
3. Corregir link de privacidad/cookies que daba 404.
4. Resolver la traducción automática antigua de privacidad en español; si Shopify pide scope/permiso extra, pedir a Daniela la autorización de un clic ahora.
5. Mantener banner cookies activo y Meta en acceso Optimizado mientras se resuelve cualquier duda legal; no cambiar a Always On sin nueva revisión.
6. Mantener devoluciones/retracto/garantía bajo revisión de ChatGPT; NO publicar una exclusión genérica de retracto por “higiene” para swimwear sin base suficiente.
7. Verificar dominio Meta `radaelliswimwear.com`; si la pantalla exige owner, pedir a Daniela que haga únicamente la acción necesaria ahora.
8. Envia: preparar todo lo posible. Si RUT, login, recarga o compra de guía real requieren owner, pedirlo en un solo bloque cuando sea oportuno. La guía real se compra solo para esta venta real o una posterior real, no para pruebas ficticias.
9. Verificar estado final de #1002/Wompi y que no quede cobro pendiente ni reembolso inconcluso; si hay movimiento de dinero, pedir aprobación explícita.
10. Shopify billing: el cobro esperado de USD 1 del 2026-10-06 se confirma cuando llegue la fecha; no inventar ni adelantar cargo.
11. R2/unit economics: si siguen faltando datos de costos que solo Daniela conoce, agrupar las preguntas en UNA sola tanda clara y corta mientras ella está disponible.
12. Monitoreo 72h y handover/downgrade readiness continúan sin pausa.

## MODO DE INTERACCIÓN MIENTRAS DANIELA ESTÁ DISPONIBLE
Si aparece un bloqueo manual, usar exactamente:
`OWNER_ACTION_REQUIRED_NOW`
y luego solo:
- qué pantalla/acción debe hacer;
- por qué Claude no puede hacerlo;
- qué resultado debe esperar;
- sin pedir secretos en chat.

Después de resolverlo, Claude retoma automáticamente sin esperar otro “sigue”.

## HANDOFF FINAL DE ESTA VENTA
Tras la compra real, actualizar `ai-handoff/claude-result.md` con el resultado completo de cupón + tarifa Bogotá + Wompi + inventario + emails + Meta Purchase + UTM + Envia y escribir:
`HANDOFF READY 03R-PURCHASE-COUPON-SHIPPING-CERTIFICATION`
para revisión independiente de ChatGPT antes de habilitar anuncios pagados.
