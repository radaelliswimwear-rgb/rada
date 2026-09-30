# 03N — Ruta oficial de Wompi y compresión final de bloqueos de la dueña

**Tienda:** Client Transfer Store «Radaelli Swimwear» (lanzamiento). Sin transferir, sin plan de pago, contraseña de la tienda puesta.
**No se tocó ni se hizo:** Producción, Staging, Vercel, Neon, DNS, facturación, Horizon, `main`; transferir la tienda, elegir plan, tarjeta de facturación, quitar la contraseña, publicar RC1.10, Wompi en vivo, dinero real, comprar etiquetas.

## Los 23 puntos

| # | Punto | Resultado |
|---|---|---|
| 1 | Modelo / tiempo | Sonnet 5.5 (`claude-sonnet-5-5`). Sin subagentes ni workflows. Tiempo exacto no medido; la mayor parte fue esperar acciones de la dueña (Wompi, Envia). |
| 2 | Base de la tienda | Colombia / COP / America-Bogota / métrico-kg intactos (parity Q8 PASS, 8/8 tras todos los cambios de 03N). |
| 3 | Wompi, ruta A (proveedor tradicional, enlace oficial) | **INSTALABLE AHORA.** El enlace de la documentación oficial (proveedor alternativo 11927553) abre la ficha «Wompi» y su botón «Instalar» lleva a la pantalla de permisos de «Wompi Pagos» (Wompi Co). Sin bloqueo por tipo de tienda, plan o transferencia. La dueña pulsó «Instalar». En 03M se dijo «no disponible» por buscar en la lista de proveedores; era un error de método, no de la plataforma. |
| 4 | Wompi, ruta B («Wompi Tarjetas») | Ficha existente (apps.shopify.com/wompi-native), desarrolladora Wompi Co, gratis, funciona con «Pago». **No instalada a propósito**: el manual de Wompi dice configurar primero la tradicional y confirmar su checkout. Pendiente opcional. |
| 5 | Decisión de Wompi | **INSTALLABLE NOW / TEST MODE WORKS.** Wompi «Activa», «El modo de prueba está activado» y métodos Visa, Mastercard, Amex, Bancolombia, Nequi, DaviPlata, PSE. Pago sandbox de punta a punta: pedido **#1002**, COP 367.840, envío gratis, «¡Gracias por tu compra!», pedido creado y pagado. Las llaves las escribió la dueña; no se leyeron ni se guardaron. **Hallazgo:** sin la URL de eventos en el panel de Wompi, el pago aprobado NO crea el pedido (dos intentos con `transaction.updated` en Error en el Debugger); con la URL guardada en Sandbox, el tercer intento funcionó. Esa URL hay que repetirla en PRODUCCIÓN. Evidencia: `launch/evidence/03N-wompi-e2e.json`. |
| 6 | Search & Discovery | **INSTALADA** (clic de la dueña). Filtros por defecto (Disponibilidad y Precio). No se añadieron filtros: el editor embebido no respondió de forma fiable por automatización. Humo de búsqueda/colección no ejecutado (requiere la vista previa con contraseña). Opcional. |
| 7 | Envia, cuenta | La dueña creó la cuenta (saldo $0) tras resolver un problema de contraseña (enlace de recuperación vencido) e inició sesión. |
| 8 | Envia, tarifas en vivo antes de transferir | **NO funcionan hoy.** La app muestra «No encontramos tu tienda» y «Continuar» no avanza (probado 3 veces). La ayuda oficial de Envia atribuye ese error a que el envío calculado por transportista (CCS) no esté habilitado en Shopify; Shopify exige para CCS de terceros plan Advanced/Plus, o Grow con cargo adicional o facturación anual. **La causa no está confirmada de forma independiente.** No se eligió plan ni se pagó nada. Se dejan los pasos de activación para después de transferir (A2 del lote). |
| 9 | Brecha de peso y medidas | Las 98 variantes tienen 0,0 kg y no hay medidas de paquete válidas. Modelo mínimo que Envia pide (su ayuda): origen, **peso y tamaño de cada producto** y el empaque. Shopify ya tiene «1 caja» por defecto, sin medidas verificadas. Un paquete estándar puede cubrir la mayoría de prendas, pero el peso por producto/talla sigue siendo dato de la dueña. No se inventó nada; va al lote (A3). |
| 10 | Envío gratis ≥ 299.900 | **PASS** otra vez: #1002 (COP 367.840) con «Envío estándar gratis». |
| 11 | Envío bajo 299.900 | **Sin método de envío** (no se inventó tarifa). Regla de la dueña ya decidida: el cliente paga el envío real calculado; depende de A2/A3/B1/B3. |
| 12 | 404 legales intencionales | **Exactamente 4:** `/envios`, `/terminos`, `/privacidad`, `/cookies`. Control de enlaces 9/9 PASS. |
| 13 | Bloque de datos legales | Listo en `launch/03m/owner-final-data-form.md` (F1–F4, D2) y en el lote A4. No se publicó ninguna página incompleta. |
| 14 | Bloque inventario / XL / datos de clientas | Listo (F6, D1, D3) y en los lotes A5 y A6; herramienta `03m-post-decision.mjs` lista y sin datos inventados. |
| 15 | Idioma principal | Sigue inglés; español publicado y por defecto en el dominio raíz. No se cambió (aplica traducciones a «Pago y Sistema» y al tema). La advertencia exacta es la de 03M; no se volvió a abrir en 03N. Secuencia segura del corte en `launch/03n/final-owner-batch.md` (§Idioma). |
| 16 | Pasarela de prueba | Pasarela de prueba de Shopify **activa** (la única posible antes de Wompi) y Wompi **en modo prueba**. Al corte se apagan ambas (C1). |
| 17 | Dinero real | **NO.** |
| 18 | Plan de pago / transferencia / DNS / publicar | **NO tocados.** |
| 19 | Lote final por momento | **A (antes de transferir): 7 · B (durante): 3 · C (después, antes de publicar): 5 · D (opcional): 6.** `launch/03n/final-owner-batch.md`. |
| 20 | Preparación | **Migración: ~95 %** (catálogo, colecciones, metafields, 51 redirecciones, tema RC1.10 sin publicar 98/98, checkout con Wompi de prueba, Search & Discovery, apps). **Publicación: bloqueada** hasta: datos legales (A4), inventario/XL (A5), datos de clientas (A6), contraste (A7), transferencia + plan (B1, B2), tarifa bajo $299.900 (B3), llaves/URL de producción de Wompi (A1, C1) y dominio (C3). Sin más trabajo autónomo útil antes de que la dueña responda el lote. |
| 21 | Escaneo de secretos / respaldo | Escaneo de artefactos nuevos: 0 hallazgos (ver handoff). Respaldo en `shopify-migration-backup` (sin `main`, sin PR). |
| 22 | ¿Listo para 03O? | **SÍ.** |
| 23 | Tareas de segundo plano | **CERO TAREAS DE SEGUNDO PLANO ACTIVAS** (pestañas propias cerradas; quedan abiertas solo las de Envia y Search & Discovery de la dueña). |

## Riesgos y notas

1. **Sin método de envío bajo COP 299.900** y sin tarifas en vivo hasta que exista plan con CCS o se decida otra cosa: es lo que más afecta al lanzamiento.
2. **URL de eventos de Wompi**: hay que guardarla también en producción; su ausencia deja pagos aprobados sin pedido en Shopify.
3. Los pedidos #1001 y #1002 (prueba) quedan archivados; la numeración real empezará en #1003.
4. Envia tiene permisos amplios (clientes, productos, pedidos) y está instalada sin vincular; si la dueña no va a usarla, conviene desinstalarla.
5. Las reseñas públicas reportan búsquedas irregulares de Search & Discovery en Colombia (dato de terceros): probar antes de publicar.
