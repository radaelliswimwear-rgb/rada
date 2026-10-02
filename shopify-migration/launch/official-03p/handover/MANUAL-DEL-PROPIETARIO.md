# MANUAL DEL PROPIETARIO — Radaelli Swimwear (tienda Shopify)

Para: Daniela. Escrito para usarlo sola, sin saber de tecnología.
Estado al escribir: 2026-10-02, actualizado en la tarde. **La tienda es pública en `https://radaelliswimwear.com` desde ~11:23 de hoy**, con el tema Radaelli RC1.10, pagos reales con Wompi y sin contraseña. Todavía no hay pedidos reales de clientas. Los datos marcados `PENDIENTE_DUEÑA` o `CONFIRMAR_EN_ADMIN` no están confirmados: no los des por ciertos.
Los nombres de menús son los que se vieron en tu Admin al configurar la tienda. Si un nombre cambió, usa la lupa de búsqueda arriba del Admin y escribe la palabra (por ejemplo "Notificaciones").

## 1. Datos clave (una mirada)

| Tema | Valor |
|---|---|
| Tienda | Radaelli Swimwear · `wgcvpd-ib.myshopify.com` · Admin: `https://admin.shopify.com/store/wgcvpd-ib`. **Pública desde ~11:23 del 2026-10-02** en `https://radaelliswimwear.com` |
| Plan | Shopify Basic (pago mensual). Hoy en la prueba de 3 días con plan y tarjeta registrados; US$1/mes hasta 2027-01-04 y luego US$25/mes (+ impuestos). Costos y fechas: documento 09 |
| País / moneda / hora | Colombia · COP · America/Bogota · kilos |
| Catálogo | 29 productos · 98 variantes (tallas) · 128 unidades de inventario inicial |
| Precios | Precio actual = 80 % del precio tachado (promoción "20 % de descuento en toda la tienda"). Documento 05 |
| Impuestos | Eres NO RESPONSABLE DE IVA: la tienda NO cobra IVA. No cambies esto sin tu contador |
| Envío | 5 zonas con tarifa fija: $9.900 · $12.900 · $17.900 · $21.900 · $44.900. Gratis desde $299.900 |
| Pagos | Wompi (tarjetas, PSE, Nequi, Daviplata, Bancolombia), en modo REAL ("Activa", modo de prueba apagado). Comisiones por venta: Shopify 2 % + Wompi 2,65 % + $700 + IVA 19 % sobre la comisión de Wompi (neto real de una venta de $5.000 por Nequi: $4.009,33). Reembolsos: NO son automáticos. Documento 02 |
| Transportadora | Envia.com (guías con saldo prepago; saldo hoy $0, lo recargas tú). Documento 03 |
| Tema (diseño) | "Radaelli RC1.10" publicado (Horizon queda de borrador: no lo borres). Respaldo y reglas: documentos 06 y 08 |
| Dominio | `radaelliswimwear.com`: principal, certificado válido hasta 2026-12-31, DNS en Hostinger (se cambiaron solo el A `@` y el CNAME `www`). Documento 01 |
| Medición y anuncios | App "Facebook & Instagram" instalada (gratis); falta conectar el dataset de Meta con tu inicio de sesión: `PENDIENTE_DUEÑA` (GAP-26) |
| Tablero semanal | Página privada "Tablero Radaelli Swimwear": `https://claude.ai/artifact/Di9pTQW3cvGhCzG8eSV1GN` (dice "seguir probando" mientras falten tus costos reales) |
| Panel de Wompi | `https://login.wompi.co` (entras tú con tus credenciales; la sesión caduca rápido). Documento 02, sección 3.1 |
| Monitoreo | Script de solo lectura del equipo (`monitor.mjs`) y su guía `monitoring-runbook-es.md`; primera corrida 2026-10-02 12:19: TODO OK. Documento 10, sección 4.1 |

## 2. Reglas de oro (QUÉ NO HACER)

1. NO compartas contraseñas, códigos de acceso, llaves de Wompi ni datos de tarjeta por chat, correo ni GitHub.
2. NO toques los registros MX ni TXT del dominio: ahí vive tu correo `info@`.
3. NO borres productos: usa "Archivar". Borrar no se puede deshacer.
4. NO edites el código del tema. Solo el editor visual (documento 06).
5. NO cambies país, moneda, impuestos ni zonas de envío sin ayuda.
6. NO instales apps nuevas sin preguntar: cada una pide permisos sobre tus datos y puede cobrar.
7. NO actives dos formas de pago de tarjeta a la vez.
8. NO compres guías de Envia para pedidos de prueba.
9. NO subas el plan de Shopify ni aceptes cobros que no entiendas (si aparece una página "Subscribe to Basic Plan" u otro aviso de pago: captura y pregunta antes de pulsar).
10. NO pulses el botón rojo "Desactivar" de Wompi (Configuración > Pagos > Wompi). Para frenar ventas en una emergencia usa la contraseña de la tienda (documento 10, sección 5).
11. NO prometas reembolsos "automáticos": el reembolso de Shopify a Wompi no está comprobado y la comisión de Wompi no se devuelve. Sigue el documento 02, sección 6.
12. NO abras ni cambies el otro dominio que vive en tu misma cuenta de Hostinger: no es de la tienda.
13. Ante la duda: captura de pantalla (sin claves) y pregunta.

## 3. Rutinas

### Cada día (5 min) — documento 04 tiene el detalle
1. Admin > Pedidos: ¿hay pedidos nuevos "Pagado" sin cumplir? Atiéndelos el mismo día.
2. Compara con el panel de Wompi (`https://login.wompi.co`, entras tú): cada pago APROBADO debe tener un pedido.
3. Admin > Productos > Inventario: ¿alguna talla en 0 o en negativo?
4. Admin > Pedidos > Checkouts abandonados: ¿alguno con un pago aprobado en Wompi? Si sí: documento 02.
5. Mira tu Gmail (incluye spam): avisos de Shopify, Wompi y Envia.
6. Abre la tienda en el celular: ¿carga, se ve el precio, agrega al carrito?

### Cada semana (20 min)
1. Exporta pedidos y productos (documento 08).
2. Revisa saldo de Envia y costo real de las guías contra lo cobrado de envío (documento 03).
3. Revisa Admin > Análisis: visitas, agregados al carrito, compras. Y mira tu tablero semanal (`https://claude.ai/artifact/Di9pTQW3cvGhCzG8eSV1GN`); mientras diga "seguir probando", no decidas gastos grandes con esas cifras.
4. Revisa que la barra de anuncio y la promoción sigan siendo ciertas (documento 05).
5. Revisa que no haya pedidos "Pendiente de pago" viejos.
6. Apunta cuánto te costaron esa semana Shopify, Wompi (comisiones) y Envia (guías): las comisiones se ven en "Entradas contables" de Wompi (documento 02, sección 3.1). Si alguien del equipo corre el monitor (documento 10, sección 4.1), pídele el resultado.

### Cada mes (45 min)
1. Admin > Configuración > Facturación: cobro de Shopify correcto.
2. Respaldo completo: productos, clientes, pedidos (documento 08) y copia a tu Drive.
3. Haz una compra de prueba SIN pagar: llega hasta Wompi y mira que aparezca y que el envío sea el correcto.
4. Revisa costos de Envia, Wompi y Meta (documento 09).
5. Pide ayuda si hay una alerta de Shopify en el Admin.

### Cada año
Renovar dominio y plan de Hostinger (fechas `PENDIENTE_DUEÑA`: apúntalas hoy; si el dominio vence se cae la tienda y el correo), revisar con tu contador si sigues siendo NO RESPONSABLE DE IVA, revisar textos legales (privacidad y cookies se reemplazaron el 2026-10-02; pide a un abogado colombiano que los revise: no es asesoría legal).

## 4. Tu primer pedido real (paso a paso)

1. Te llega un correo "Nuevo pedido" de Shopify a tu Gmail.
2. Admin > Pedidos > abre el pedido. Debe decir "Pagado". Si dice "Pendiente" o "Cancelado": documento 02.
3. En el panel de Wompi (`https://login.wompi.co` > Transacciones > "Ver más"), busca el pago: estado APROBADO, mismo valor y misma hora. En "Entradas contables" ves la comisión y lo que realmente te llega (documento 02, sección 3.1 y 7).
4. Revisa dirección, ciudad y teléfono del cliente. Si algo está raro, escríbele.
5. Mira Admin > Productos > Inventario: la talla vendida bajó 1.
6. Empaca la prenda.
7. Abre Envia (Admin > Aplicaciones > Envia.com) y compra la guía con TU saldo (documento 03). Solo tú compras guías reales.
8. Pega la guía y entrega el paquete a la transportadora (o pide recolección).
9. Verifica que el pedido pase a "Cumplido" con número de guía y que el cliente reciba el correo de envío. Si no pasa solo: Pedidos > pedido > "Marcar como cumplido" > agrega el número de guía.
10. Anota en una hoja: pedido, valor, costo de la guía, diferencia contra el envío cobrado.
11. El primer pedido real: tómale captura a cada pantalla importante (sin datos de tarjeta) por si hay que pedir ayuda.

## 5. Dónde está cada cosa

| Tema | Ruta en el Admin | Quién / qué |
|---|---|---|
| Pedidos | Pedidos | Tú. Detalle: doc 04 |
| Pagos fallidos / sin pedido | Pedidos > Checkouts abandonados + panel Wompi | Tú; doc 02 |
| Inventario | Productos > Inventario | Tú; doc 04 |
| Productos y precios | Productos | Tú; cuidado con precios (doc 05) |
| Descuentos | Descuentos | Tú; doc 05 |
| Barra de anuncio | Tienda online > Temas > Personalizar | Tú; doc 05 y 06 |
| Menús y páginas | Contenido > Menús / Tienda online > Páginas (`CONFIRMAR_EN_ADMIN`) | Tú; cuidado |
| Diseño del tema | Tienda online > Temas | Doc 06 |
| Contraseña de la tienda | Tienda online > Preferencias (hoy está QUITADA: la tienda es pública) | Solo para cerrar la tienda en una emergencia (doc 10, sección 5) |
| Dominio | Configuración > Dominios | Doc 01; el DNS se edita en Hostinger hPanel: Dominios > DNS ("Editor de zona DNS") > `radaelliswimwear.com` > "Administrar registros DNS" > lápiz de la fila. No toques el otro dominio de esa cuenta |
| Pagos (Wompi) | Configuración > Pagos > Wompi ("Activa", modo de prueba apagado; muestra "Cargo por transacción de 2 %") | Doc 02; llaves solo las escribes tú. NUNCA pulses el botón rojo "Desactivar" |
| Panel de Wompi (transacciones, "Entradas contables", "Dinero enviado") | `https://login.wompi.co` | Tú; doc 02, sección 3.1. Con Nequi no hay "Anular" |
| Checkout | Configuración > Checkout (`CONFIRMAR_EN_ADMIN`) | Contacto por correo y teléfono obligatorio: no cambiar |
| Envío (zonas y tarifas) | Configuración > Envío y entrega > Perfil general | Doc 10 si falla |
| Guías (Envia) | Aplicaciones > Envia.com | Doc 03 |
| Impuestos | Configuración > Impuestos y aranceles | NO tocar |
| Correos y destinatarios | Configuración > Notificaciones | Doc 07 |
| Políticas legales | Configuración > Políticas (publicadas: «Información de contacto» y «Aviso legal» con tus datos de vendedor, enlazadas en el pie de página desde el menú «Ayuda») | Doc 07; devoluciones: doc 12; pendientes legales: `CLAUDE-DOWNGRADE-READINESS` (GAP-12) |
| Política de privacidad y de cookies | Texto de privacidad: Configuración > Políticas y página `/pages/privacidad`. Cookies: página `/pages/cookies`. **Reemplazadas el 2026-10-02** por textos actualizados (Ley 1581 de 2012; nombran a Shopify, Wompi, Envia/transportadora, Gmail, WhatsApp, hCaptcha y Meta si aceptan cookies). Los textos anteriores quedaron respaldados | Pendiente: revisión de un abogado colombiano (no es asesoría legal) y que la dirección nativa `/policies/privacy-policy` muestre el texto nuevo (todavía mostraba el texto automático de Shopify a las 12:50: GAP-27) |
| Banner de cookies | Configuración > Privacidad del cliente > Banner de cookies | "Usar configuración automatizada" APAGADO; regiones: 31 europeas + Colombia; muestra Aceptar / Rechazar / Administrar preferencias en español. "Network Intelligence" de Shopify queda ENCENDIDO (Search & Discovery lo necesita). No lo cambies sin ayuda |
| Eventos de clientes (píxeles) | Configuración > Eventos de clientes | Ya aparece el píxel "Facebook & Instagram" (app instalada el 2026-10-02). Falta que tú conectes el dataset de Meta (GAP-26) |
| Monitoreo automático | Carpeta `r03/monitor/` del paquete (`monitor.mjs`, `monitoring-runbook-es.md`) | Solo lectura; lo corre quien te ayude; doc 10, sección 4.1 |
| Tablero semanal | `https://claude.ai/artifact/Di9pTQW3cvGhCzG8eSV1GN` | Página privada de tu cuenta de Claude; doc 09 |
| Plan y cobros | Configuración > Facturación / Plan | Doc 09 |
| Usuarios | Configuración > Usuarios | Solo personas de confianza |
| Filtros talla/color | Aplicaciones > Search & Discovery | No tocar |
| Redireccionamientos de URL (51) | Admin > Redireccionamientos de URL (dirección `https://admin.shopify.com/store/wgcvpd-ib/redirects`; confirmado 2026-10-02). Los menús están en Contenido > Menús | No borrar |
| Aplicaciones instaladas | Configuración > Aplicaciones y canales de venta | Messaging, Search & Discovery, Envia, Shopify CLI Connector App, Facebook & Instagram (y Wompi como pasarela). Doc 09, sección 2 |
| Respaldos | GitHub rama `shopify-migration-backup` + tu Drive | Doc 08 |
| Estadísticas | Análisis | Medición de anuncios (Meta): la app "Facebook & Instagram" ya está instalada (2026-10-02) y el píxel aparece en Configuración > Eventos de clientes, **pero falta conectar el dataset de Meta con tu inicio de sesión**: `PENDIENTE_DUEÑA` (`CLAUDE-DOWNGRADE-READINESS`, GAP-14 y GAP-26). No gastes en anuncios sin medición |

## 6. Cuándo pedir ayuda (y a quién)

| Situación | A quién | Qué llevar |
|---|---|---|
| No puedes entrar / cobro raro del plan | Soporte de Shopify (icono "?" del Admin > Contactar) | Captura, correo de la cuenta |
| Un enlace del Admin dice que tu cuenta "no tiene permiso" | Tú: "Cambiar de cuenta" y elige el Gmail de la marca (doc 10, sección 14.1) | Captura si persiste |
| Un pago no genera pedido | Doc 02 primero; luego Wompi (canal `PENDIENTE_DUEÑA`) | Referencia Wompi, hora, valor |
| Una clienta pide reembolso | Doc 12 y doc 02, sección 6 (no es automático; devuelve el dinero por Wompi o transferencia y deja nota en el pedido) | Número de pedido, referencia de Wompi |
| Guía o transportadora | Soporte de Envia (canal `PENDIENTE_DUEÑA`) | Número de guía, pedido |
| Tienda caída, aviso de seguridad, "Un momento..." | Doc 10, luego IA o Shopify | Captura, hora, qué hiciste |
| Cambios de diseño, promos, cupones, precios en bloque | IA de bajo costo con este manual | Documento correspondiente |

Cuando preguntes a la IA, pega: qué querías hacer, qué viste (captura sin claves) y el número de documento que seguiste.
URGENTE (nadie puede comprar o hay dinero en riesgo): primero pon la tienda en pausa (doc 10, "Contención"), luego pide ayuda.

## 7. Glosario

- **Admin**: el panel donde administras la tienda.
- **Tema**: el diseño de la tienda (Radaelli RC1.10).
- **Variante**: una talla de un producto (hay 98).
- **Precio de comparación / tachado**: el precio anterior que se ve tachado.
- **Inventario "Disponible"**: unidades que se pueden vender ahora.
- **Checkout**: la pantalla de pago.
- **Checkout abandonado**: alguien empezó a pagar y no terminó (a veces pagó y el pedido no se creó).
- **Cumplir pedido**: marcarlo enviado y registrar guía.
- **Perfil de envío**: tarifas por zona.
- **DNS**: la "agenda" que dice a qué servidor va tu dominio.
- **Registro A / CNAME**: líneas del DNS que apuntan el dominio a Shopify.
- **MX / TXT**: líneas del DNS para el correo. No tocar.
- **SSL (candado)**: certificado que muestra "https".
- **Webhook / URL de eventos**: aviso automático de Wompi a Shopify cuando alguien paga.
- **Modo de prueba**: Wompi no cobra dinero real. Hoy Wompi está en modo real (LIVE).
- **Entradas contables** (Wompi): la cuenta de un pago: lo que pagó la clienta, la comisión de Wompi, el IVA de esa comisión y lo que te llega.
- **Banner de cookies**: el aviso que pide a las visitantes aceptar o rechazar cookies (Aceptar / Rechazar / Administrar preferencias).
- **Píxel / dataset de Meta**: la conexión que le cuenta a Meta qué hacen las visitantes de tu tienda, para medir anuncios. Falta conectarlo (lo haces tú con tu inicio de sesión de Meta).
- **Contraseña de la tienda**: la pantalla que impide ver la tienda. Hoy está quitada; solo se vuelve a poner en una emergencia.
- **Tablero**: tu página privada con las cifras de la semana.
- **Monitor**: script de solo lectura del equipo que revisa que la tienda esté sana.
- **Rollback**: volver al estado anterior.
- **Respaldo**: copia para restaurar.
- **429 / "Un momento..."**: Shopify frena muchas visitas seguidas.

## 8. Los 12 documentos del paquete

(Actualizados el 2026-10-02 en la tarde tras el lanzamiento: 01, 02, 04, 06, 07, 09, 10, 11, 12 y este manual; el 03 y el 08 solo con el estado de Envia y una fila de respaldo. Los documentos 03 y 05 siguen válidos tal cual hasta que pruebes Envia con un pedido real.) 01 DNS y rollback · 02 Wompi · 03 Envia · 04 Inventario y pedidos · 05 Promociones · 06 Editar el tema · 07 Correos · 08 Respaldo · 09 Credenciales, apps y costos · 10 Monitoreo y fallas · 11 Agregar un producto nuevo · 12 Devoluciones y cambios. El documento `CLAUDE-DOWNGRADE-READINESS` (la lista de GAPs) prueba que puedes operar con ayuda de bajo costo después del 2026-10-20.
