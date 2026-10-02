# 03P — Tienda oficial normal de Shopify (Radaelli Swimwear) — informe vivo

Estado: **03P COMPLETO** — actualizado 09:10 (America/Bogota, 2026-10-02). E2E sandbox cerrado, inventario restaurado, 0 bloqueos. `READY_FOR_FINAL_LAUNCH_CERTIFICATION: YES` (para la fase 03Q; nada público/live se ha ejecutado).
Evidencia/herramientas (sin secretos ni PII): `shopify-migration/launch/official-03p/`.

> **DECISIÓN PRE-LANZAMIENTO (D8 — IMPUESTOS, NO decidida por Claude):** la tienda oficial tiene `taxesIncluded = true` y el laboratorio `false`; no hay tasas configuradas y los totales de checkout son idénticos (159.920 + 9.900 = 169.820). Es una decisión de la dueña/su contador antes de abrir al público (¿precios con IVA 19 % incluido? ¿Shopify debe recaudar IVA?). No se modificó. Ver `owner-action-batch.md` D8 y L7.

## 1. Identificación
| Campo | Valor |
|---|---|
| Nombre | **Radaelli Swimwear** (Shopify lo creó como «My Store 2»; renombrada a las 07:41) |
| Identificador | `wgcvpd-ib.myshopify.com` (shop id 102428803371) |
| Cuenta propietaria | radaelliswimwear@gmail.com (cuenta Shopify 345688222) — sin secretos |
| Tipo | tienda **normal** (registro estándar de comerciante; NO Dev Store, NO Client Transfer, NO la tienda `launch` inactiva, NO cuenta Partner) |
| Creación | 2026-10-02 ~07:37 America/Bogota (cronómetro global iniciado 07:36:21) |
| Plan | prueba de 3 días → **Basic mensual activo** (suscrito por la dueña ~08:12 tras ver los términos exactos) |
| Privada/contraseña | **sí** (`/` → 302 `/password`); tema RC1.10 **sin publicar**; sin dominio propio |
| Snapshot inicial | tema Horizon [live] único; 0 productos; 1 colección «Home page»; página «Contact»; menús por defecto; política de privacidad automatizada; perfil de envío por defecto (Doméstico + Internacional); mercado `co` ACTIVO; sucursal «Shop location»; canales Tienda online + POS (g1-snapshot.json) |

## 2. Origen Colombia (GATE G0) — PASS 07:40:19
País/región del negocio **Colombia** (Admin > General y `shopAddress.countryCodeV2=CO`) · moneda **COP** · sistema métrico/**kg** · mercado Colombia (`co`) **ACTIVO** · **no existe mercado EE. UU.** (no hay nada que poner en borrador/inactivo; el perfil de envío fue limpiado a Colombia).
**Corrección realizada ANTES de migrar:** Shopify asignó por defecto la zona horaria `America/New_York`; se cambió a **America/Bogota** (Configuración > General) y se verificó por API (`ianaTimezone=America/Bogota`). Evidencia: g0-baseline.json.

## 3. Promoción / prueba (capturada ANTES de facturar)
Pantalla de alta («Start for free, stay for $1»): **hoy 3 días gratis; 5-oct USD 1/mes por 3 meses (precio normal USD 25 tachado); cancelación en cualquier momento; «Includes domain offer: USD 20 en créditos al comprar/conectar dominio»; renueva 3-ene-2027 con Basic USD 25/mes + impuestos**; medios: tarjeta, PayPal, Google Pay; «I'm selling from Colombia». Tarjeta omitida (Skip).
Pantalla de plan (Basic mensual, mostrada antes de aprobar): hoy gratis (prueba de 3 días) · **6-oct-2026 USD 1,00/mes** (etiqueta «3-month trial») · **4-ene-2027 USD 25,00/mes** + impuestos · monto a pagar USD 1,00 el 6-oct-2026 + impuestos · «Change or cancel your plan anytime» · comisión de proveedor de pagos externo en Basic 2 %. **La dueña aprobó y suscribió** (yo no ingresé datos de pago). API: plan `Basic`.

## 4. Migración (olas) — resultados
| Ola | Resultado |
|---|---|
| A tema | RC1.10 (ZIP SHA-256 `e0f67590…2410c`) subido **sin publicar** (id 191904514347); Theme Check 61 archivos / 0 ofensas; paridad remoto = ZIP **98/98** (82 exactos + 16 JSON semánticos, 0 distintos); Horizon sigue [live] |
| Idioma | **Idioma principal de la tienda (Shopify `shopLocales.primary`) = `en`** (igual que el laboratorio); `es` publicado como idioma **por defecto de la presencia web del mercado Colombia** → la raíz `/` sirve español (`html lang="es"`), `en` es alterno en `/en/` — igual que el laboratorio. Evidencia fresca en la sección 13 |
| B productos | 29 productos / 98 variantes / 95 imágenes (95/95 media READY); definiciones de metafields (8) + metaobjeto size_guide; 0 duplicados |
| C inventario | 98/98 rastreadas, **128 unidades**, 0 discrepancias; peso **500 g × 98**; XL conservada |
| D colecciones | oasis-natural 10 · aurora-viva 12 · espuma-de-ola 7 · salidas-de-bano 0 · destacados 7; orden manual exacto; «Home page» vaciada |
| E navegación/legal | menús main-menu 5 / comprar 4 / ayuda 6; 6 páginas (garantía, favoritos, privacidad, términos, envíos, cookies); políticas Reembolso, Privacidad (gestión automática APAGADA), Términos, Envío; **51 redirecciones** |
| F S&D | filtros exactamente **Talla, Color, Price/Precio** (sin Disponibilidad) en ese orden |
| Etiqueta | `MOSTAZA` en entero-golden-hour (como el laboratorio) |
| Sucursal | estaba **vacía** al crearse (solo país CO); se editó con `locationEdit` a Calle 93 #72-71, Barranquilla, Atlántico 080001, CO (idéntica al laboratorio). **El barrido `sweep-wgcvpd-ib.json` es anterior a esa edición (stale)**; consulta fresca en `sweep-wgcvpd-ib-final.json` (sección 13) |

## 5. Paridad (GATE G6)
- `03l-migrate parity`: **7/8 PASS**; Q8 falla **por diseño** (exige «plan de desarrollo»; la oficial es plan Basic). Los demás Q1–Q7: PASS.
- Lane D verificador de contenido: **7/7 PASS** (páginas, políticas, menús, redirecciones, destinos, SEO baseline).
- Inventario 98/98 · 128 uds · 500 g × 98: PASS.

## 6. Envíos y umbral (G3)
Perfil general: **5 zonas / 33 departamentos**, tarifas **9.900 / 12.900 / 17.900 / 21.900 / 44.900**, gratis desde **299.900** (condición pagada ≤ 299.899): verificador **16/16 PASS**. Prueba de checkout real con productos temporales (eliminados después, 29 productos y 0 residuos): **299.899 → «Envío estándar» $9.900, total $309.799; 299.900 → «Envío estándar gratis», total $299.900**.

## 7. Envia / Wompi / correos
- **Envia.com**: instalada y vinculada («Integración realizada», empresa #764546, saldo $0); **sin guías compradas**.
- **Wompi Pagos**: instalada; conectada por la dueña con llaves de **PRUEBA** (las tecleó ella); **modo de prueba ACTIVADO** (Admin > Pagos); URL de eventos `https://wompi-event-shopify.conexa.ai/api/v1/shopify/webhooks/event` configurada en Wompi (producción y pruebas). Ajustes de checkout según documentación de Wompi: contacto por correo; teléfono de envío obligatorio. **PayPal Express desactivado** (venía por defecto sin configurar y no está en la línea base).
- **Correos**: remitente = radaelliswimwear@gmail.com; Shopify avisa que Gmail no admite remitente personalizado → los clientes ven `store+102428803371@shopifyemail.com` con respuesta a Gmail hasta tener dominio propio (03Q). Destinatario de «Nuevo pedido»: radaelliswimwear@gmail.com (todos los pedidos). Plantillas de cliente en español (confirmación de pedido, envío…). La entrega física no se afirma sin bandeja real.
- **E2E sandbox (G4) — PASS**: checkout COP, cliente ficticio (`prueba.e2e@example.com`), BIKINI FOAM S, tarifa regional Barranquilla 9.900, Wompi visiblemente en modo prueba; la dueña tecleó la tarjeta de prueba publicada por Wompi (B1) ~08:45. **Exactamente un pedido #1001**: `test=true`, PAGADO, pasarela Wompi, transacción `SALE SUCCESS test=true`, subtotal 159.920 + envío 9.900 = **169.820 COP**, locale es-CO; eventos: «Se procesó un pago por 169.820 COP en Wompi», **«Se envió un correo electrónico de confirmación de pedido»** (cliente) y **«Se ha recibido un nuevo pedido #1001»** (personal). Sin duplicados. **Restauración**: pedido cancelado con reposición de inventario (sin avisar al cliente) y archivado → `available 1 / committed 0`; inventario 98/98 · 128 uds, 0 discrepancias; **0 dinero real**. Wompi sigue en modo prueba.

## 8. Regresión de la vitrina oficial (vista previa de administradora, tema RC1.10)
- **29/29 PDP** en iframe de **390 px reales**: carga completa, h1 = título, precio = API, galería, botón, 5 acordeones, canonical, JSON-LD, og; **0 desbordes, 0 errores de consola propios, 0 recursos fallidos**. 6 PDP salieron con imágenes «sin cargar» en la 1.ª pasada (pestaña oculta, mismo falso positivo del laboratorio); re-test con espera: **0 pendientes / 0 rotas**.
- **98/98 variantes**: selección → id, precio y botón coherentes; 0 fallos.
- Rutas 200: Inicio, 6 colecciones (10/12/7/0/7 y Todos 24 + 5), 7 páginas, 4 políticas, carrito, búsqueda; **404** correctos (colección/página/producto inexistentes). Búsqueda: marea 2 · verde 2 · terracota 3 · inexistente 0.
- Filtros: **Talla XL = 11**, **Color NEGRO = 6** (`filter.p.m.custom.color`), rango de precio OK.
- **51/51 redirecciones** (42 mismo origen → 200 y destino exacto; 9 `/cuenta/*` → `/account*`). Enlaces internos header/footer 14/14 HTTP 200; **4 destinos sociales HTTP 200** (Instagram, Facebook, TikTok, WhatsApp) iguales a la línea base.
- Responsive 390/768/1440 (Inicio, colección, búsqueda, carrito, política, PDP): 0 desborde de página, 0 imágenes rotas, 0 errores; los elementos «recortados» están dentro de carruseles de desplazamiento horizontal (igual que el laboratorio).

## 9. Datos históricos (Lane J)
Evaluación sin PII: clientes, direcciones, pedidos, cupones, suscriptores (con consentimiento) y blog **BLOQUEADOS** — falta exportación autorizada de la base anterior + permisos Shopify + decisión de consentimiento; **no bloquean el lanzamiento**. Plan propuesto: lanzar sin históricos, luego piloto de 3 pedidos (`launch/official-03p/laneJ__historical-assessment.md`).

## 10. Errores/hallazgos corregidos
1. Zona horaria por defecto `America/New_York` → corregida a America/Bogota antes de migrar.
2. Privacidad con gestión automática impedía escribir el texto → apagada en Admin y texto aplicado.
3. «Home page» auto-poblada con 1 producto → vaciada (Q3).
4. Falta etiqueta `MOSTAZA` → aplicada.
5. Sucursal sin dirección → replicada del laboratorio.
6. PayPal Express por defecto mostraba botón sin cuenta → desactivado.
7. Teléfono de envío opcional → obligatorio (requisito Wompi).
8. Impuestos: la oficial nació con «precios incluyen impuestos = SÍ», el laboratorio NO → no se tocó (sin tasas, totales idénticos); decisión D8.
9. Intento de lanzar el script de tema con `$ErrorActionPreference=Stop` falló por una línea informativa del CLI en stderr → se ejecutó el push/paridad con los comandos directos (sin efectos).

## 11. Tabla de tiempos (America/Bogota; los `≈` salen de marcas del registro)
| Gate / tarea | Inicio | Fin | Transcurrido | Espera/bloqueo (causa) | Reintentos | Resultado |
|---|---|---|---|---|---|---|
| G0 alta + origen Colombia | 07:36:21 | 07:40:19 | 3 m 58 s | owner: código de inicio de sesión (~1,5 m, antes del cronómetro) | 1 (passkey no disponible → código) | PASS |
| Captura promoción | ≈07:37:30 | ≈07:38:10 | ≈40 s | — | 0 | PASS |
| G1 línea base limpia | 07:40:19 | ≈07:45:05 | ≈4 m 46 s | plataforma: login del CLI de temas (~1 m) | 1 | PASS |
| Ola A tema (push + pull + paridad) | ≈07:44 | ≈07:46 | ≈2 m | — | 1 (script envoltorio falló en Theme Check por stderr) | PASS 98/98 |
| defs | 07:45:05 | 07:46:37 | 92,1 s | — | 0 | PASS |
| colecciones | 07:46:37 | 07:47:13 | 36,3 s | — | 0 | PASS |
| productos/metafields/media | 07:47:13 | 07:52:22 | 308,7 s | — | 0 | PASS |
| membresía/orden | 07:52:22 | 07:55:34 | 192 s | — | 0 | PASS |
| publicación | 07:55:34 | 07:57:48 | 133,6 s | — | 0 | PASS |
| páginas | 07:45:06 | 07:46:08 | 61,5 s | — | 0 | PASS |
| políticas | 07:46:08 / 07:48:35 | 07:46:46 / 07:49:13 | 38 s + 38 s | owner-toggle (apagar automatización) hecho por Claude en Admin | 1 | PASS |
| redirecciones | 07:47:28 | 07:47:49 | 21,4 s | — | 0 | PASS 51 |
| menús | 07:47:29 | 07:49:56 | 146,6 s | — | 0 | PASS |
| idioma es | ≈07:49 | ≈07:50 | ≈30 s | — | 0 | PASS |
| envíos (G3 escritura) | ≈07:50 | ≈07:51 | ≈1 m | — | 0 | PASS 16/16 |
| S&D filtros | ≈07:52 | ≈07:58 | ≈6 m | UI de Admin (clics) | 0 | PASS |
| Envia | ≈07:51 | ≈07:52 | ≈1 m | — | 0 | PASS |
| inventario | 07:53:43 | 07:59:35 | 352 s | — | 0 | PASS 98/98 · 128 |
| pesos 500 g | 07:59:35 | 08:01:05 | 90 s | — | 0 | PASS |
| paridad G6 (2 corridas) | 08:02 | 08:06 | ≈3 m c/u | — | 1 (Q3 → corrección) | 7/8 (Q8 por diseño) |
| Wompi TEST (instalación + llaves por dueña) | ≈08:00 | ≈08:10 | ≈10 m | owner: llaves de prueba y URL de eventos (≈8 m) | 1 (URL repetida por la dueña) | PASS |
| Facturación (puerta) | ≈08:06 | ≈08:12 | ≈6 m | owner: aprobación y pago (≈5 m) | 0 | PASS (Basic activo) |
| Notificaciones/correos (evaluación) | ≈08:35 | ≈08:41 | ≈6 m | cierre inesperado del navegador (~2 m) | 1 | evaluado; entrega física no verificable |
| Históricos (Lane J, agente) | 08:03 | 08:08 | 5 m | — | 0 | BLOQUEADO (documentado) |
| Regresión oficial (29 PDP + variantes + re-test imágenes) | ≈08:14 | ≈08:24 | ≈10 m | límite anti-ráfagas de Shopify (pausas) | 1 (re-test imágenes) | PASS |
| Regresión rutas/búsqueda/filtros/redirects/enlaces | ≈08:24 | ≈08:30 | ≈6 m | — | 0 | PASS |
| Responsive 390/768/1440 | ≈08:30 | ≈08:34 | ≈4 m | — | 0 | PASS |
| Umbral 299.899/299.900 | ≈08:37 | ≈08:40 | ≈3 m | — | 0 | PASS |
| E2E sandbox (G4): preparación + B1 de la dueña + cierre | ≈08:41 | ≈08:50 | ≈9 m | owner: B1 teclear tarjeta de prueba (≈3 m) | 0 | PASS |

**TOTAL_WALL_CLOCK_TIME**: de 07:36:21 (primera acción de alta) a 09:10 (cierre del informe). Fase 03P completa (último commit de 03P `df3793a`/micro-verificación `4e2c4c8` 08:59:46): **07:36:21 → 08:51:42 = 1 h 15 min 21 s** hasta el primer aviso de cierre.

### 11b. Contabilidad de tiempo por categoría (estimaciones salvo lo marcado «registro»)
| Categoría | Tiempo | Detalle |
|---|---|---|
| Trabajo activo (Claude y agentes en paralelo; no se suma) | ≈ 50 min de los 75 de 03P | olas, regresión, envíos, reportes (el tiempo de agentes corre en paralelo y NO se suma al total) |
| Espera de la dueña | ≈ 20 min en 03P | código de acceso (≈1,5 min antes del cronómetro), llaves/URL de Wompi (≈8 min), plan y pago (≈5 min), B1 (≈3 min), cierre accidental del navegador (≈2–3 min) |
| Espera de plataforma | ≈ 10 min | login del CLI de temas, límites anti-ráfagas (429) y esperas de carga del admin |
| **TIEMPO MUERTO EVITABLE (sistema/orquestación) — NO es trabajo productivo ni espera de la dueña** | **≈ 38 min (registro)** | **09:03:30 → 09:41:14** |

**Registro del tiempo muerto (reconciliado con git y el registro de la sesión):** último trabajo de Claude antes del hueco = commit `43011af` a las **09:02:31** (+ cierre del turno ≈ 09:03:30); primer trabajo posterior = `git fetch` a las **09:41:14** al recibir «Trabaja» de la dueña (primer checkpoint 03Q publicado 09:49:08). Causa: **Claude cerró su turno con un resumen final y quedó esperando entrada en lugar de seguir con el trabajo seguro disponible** (sondeo de GitHub / preparación 03Q) → clasificado como **orquestación/sistema (evitable)**; ChatGPT lo acotó a un máximo de 49 min 21 s (08:59:46 → 09:49:07) y la dueña confirmó >30 min. El hueco NO se fusiona con el tiempo de los agentes en paralelo. Mitigación aplicada desde 09:41: no cerrar el turno mientras haya líneas seguras; revisar GitHub a intervalos.

## 12. Acciones de la dueña
Pedidas/completadas: código de acceso (hecho), llaves Wompi de prueba + URL de eventos (hecho), aprobación y pago del plan Basic (hecho). B1 (pago sandbox) hecho ~08:45. Resto en `ai-handoff/owner-action-batch.md` (03Q y decisiones D1–D12).

## 13. Micro-verificación pedida por ChatGPT (2026-10-02 ≈08:57–09:00; sin dueña, sin cambios de configuración nuevos)
**1) Dirección de la Sucursal.** ANTES (consulta previa a la edición, registrada por `location-edit.mjs`): `address1/city/province/zip = null`, `countryCode = CO`. ACCIÓN: `locationEdit` a la dirección del laboratorio. DESPUÉS (consulta fresca 08:57:25, `sweep-wgcvpd-ib-final.json`): `Calle 93 #72-71 · Barranquilla · Atlántico (ATL) · 080001 · CO`, activa, atiende pedidos online. El `sweep-wgcvpd-ib.json` del repositorio es la foto **anterior** a la edición (stale). El laboratorio tiene la misma dirección.
**2) Idioma.** API fresca (`locales-wgcvpd-ib-final.json`): `shopLocales`: `en` publicado **primary**, `es` publicado **no primary**; `webPresences`: `defaultLocale = es`, `alternateLocales = [en]`, `rootUrls`: `es → https://wgcvpd-ib.myshopify.com/`, `en → …/en/`. Storefront con la vista previa de administradora del tema RC1.10 (09:00): `Shopify.locale = "es"`; `/` → HTTP 200, **`html lang="es"`**, canonical `https://wgcvpd-ib.myshopify.com/`, hreflang `x-default /`, `es /`, `en /en`; `/en/` → HTTP 200, `html lang="en"`, canonical `…/en`. Conclusión exacta: **el idioma primario de Shopify es inglés (como en el laboratorio); el español es el idioma por defecto del storefront (presencia web Colombia)**. El informe ya no dice «es primary».
**3) Impuestos.** Documentado como decisión pre-lanzamiento D8 (ver recuadro superior); no se cambió.
**Re-verificación posterior (≈08:58):** catálogo **29 productos ACTIVOS / 98 variantes / 95 imágenes**; inventario **98/98 rastreadas · 128 uds · 0 discrepancias**; Wompi **«Modo de prueba»** (Admin > Pagos: «Probando transacciones de Wompi. No se procesarán transacciones reales»; PayPal **Inactivo**); tienda **privada** (`/` sin sesión → 302 `/password`); tema **Radaelli RC1.10 [unpublished]**, Horizon [live]; **sin** DNS/dominio/publicación/live; pedidos: solo #1001 (test, archivado) → **0 dinero real**; mercado `co` ACTIVO; zona America/Bogota · COP · kg; 51 redirecciones.

## 14. Diferido a 03Q
Dominio/DNS · remitente verificado · Wompi LIVE · primera guía real de Envia · quitar contraseña y publicar RC1.10 · decisiones de negocio D1–D12 · datos históricos.
**Bloqueos sin resolver (03P):** 0. **ZERO BACKGROUND TASKS** al cierre (los agentes de preparación terminaron; ningún proceso activo).

## 15. 03Q — trabajo previo seguro y no público (aprobado por ChatGPT/dueña; ≈09:41–10:20)
- **D8 IVA — RESUELTA (dueña NO RESPONSABLE DE IVA):** Admin > Impuestos y aranceles: «Incluir impuesto sobre las ventas en el precio…» **apagado** y guardado → API `taxesIncluded=false`, `taxShipping=false` (= laboratorio); Colombia sin recaudación (Manual Tax), **sin tasa creada**, precios intactos. Checkout fresco: BRISA NATURAL BEIGE M 199.920 + envío 9.900 = **209.820, sin línea de impuesto** (carrito vaciado). Evidencia: `launch/official-03p/03q-prelaunch-evidence.json`.
- **Identidad del vendedor / legal (agente de solo lectura):** ningún texto aprobado ni ajuste de Shopify identifica al vendedor; «Información de contacto» y «Aviso legal» no existen; teléfono/empresa vacíos; datos requeridos F1–F19 y plantillas con marcadores en `launch/official-03p/laneK__legal-identity-audit.md`. Claude no inventó ningún dato.
- **Barra de anuncio 20 %:** 98/98 variantes con precio tachado y precio vigente = **exactamente 80 %**; oficial = laboratorio; pedido #1001 sin descuentos (códigos no legibles: falta `read_discounts`). Opciones en `laneK__announcement-bar-evidence.md`. Sin cambios.
- **Wompi LIVE (solo lectura):** Activa, modo de prueba ON, 7 métodos activos, PayPal inactivo; la validez de las llaves de producción no es comprobable sin que la dueña apague el modo de prueba. **LIVE no activado.**
- **Dominio (corrección de puerta de lanzamiento de ChatGPT, 10:09; aplicada ≈10:17 con autorización expresa de la dueña en el chat: «Sí, conéctalo ahora»):** `radaelliswimwear.com` **conectado dentro de Shopify como preparación NO pública** (id 179957956907, «Gestionado por Hostinger», estado «Requiere configuración», tipo «Redirige a wgcvpd-ib.myshopify.com» = **no es principal todavía**). **DNS NO editado; contraseña/tema/Wompi sin cambios.** Registros EXACTOS que Shopify muestra para esta tienda: **A @ 216.150.1.1 → 23.227.38.65** y **CNAME www e7eb3f32d99d3261.vercel-dns-017.com → shops.myshopify.com** (solo esos dos; sin AAAA — DNS público 1.1.1.1: apex sin AAAA, www sin AAAA). Conservar MX Hostinger, SPF, TXT google-site-verification y **facebook-domain-verification** (la verificación de dominio de Meta ya existe). Sitio público intacto tras conectar (apex HTTP 200 Vercel; www 308 → apex). En S7 hay que fijarlo como **principal** o los visitantes serían redirigidos a myshopify. Valores de rollback de Vercel registrados. Volver a leer la página justo antes del cambio.
- **Prueba de pago real (aviso de ChatGPT, 10:09):** NO es gratis garantizada: según soporte de Wompi, un reembolso completado puede dejar la comisión de la transacción + IVA de esa comisión a cargo del comercio; la anulación inmediata el mismo día puede evitarlo si la red lo permite. La dueña debe aprobar el monto exacto y el posible costo antes de pagar; se intenta primero anulación y cualquier costo real se registra como **COSTO DE PRUEBA DE LANZAMIENTO** (IVA de comisión del proveedor ≠ IVA al cliente, que es 0). Reflejado en `owner-action-batch.md` L4 y runbook S3.
- **Kit de certificación posterior al lanzamiento (agente de scripts; PL-1.0):** script de página `post-launch-cert-core` (fases catalog, routes, search, filters, redirects, links, locale, hostRedirect, responsive, cart, clean, all; GET-solo salvo `/cart/add.js`·`/cart/clear.js` con guardia), arnés de 29 PDP/98 variantes/95 imágenes a 390 px, ensamblador offline del informe (CERTIFIED/NOT_CERTIFIED/INCOMPLETE), README de 16 pasos, `rollback-and-health.md` (rollback DNS/tema, checklist de 5 min, comandos de solo lectura). Autopruebas offline: core 120/120 · PDP 42/42 · e2e 12/12 · ensamblador 23/23 · README 29/29. Copiado a `launch/official-03p/post-launch-cert/`.
- **Prueba real (solo lectura) del script en la vista previa de la tienda (10:12–10:19):** 110 solicitudes, **0 × HTTP 429**: catálogo **5/5** (29/98/95) · rutas **25/25** · búsqueda **4/4** (2/2/3/0) · filtros **3/3** · redirecciones **53/53** (51 + 2 de inventario) · enlaces **20/20** (14 internos + 4 sociales) · idioma/SEO **15/17** (1 fallo **por diseño** en vista previa: la pestaña está en myshopify.com; 1 aviso suave: `robots.txt` sin `Sitemap` — reevaluar en el dominio real) · carrito **7/7**, carrito vaciado. Fases `hostRedirect` y `responsive` no corridas aquí a propósito (host myshopify / pestaña oculta). Evidencia: `post-launch-cert/preview-smoke-2026-10-02.json`.
- **Lote único de acciones de la dueña (L1–L9)** consolidado y mostrado en el chat (~10:05) y en `owner-action-batch.md`: GO · pedidos del sitio viejo · Wompi LIVE + compra real mínima propia · 2 registros DNS en Hostinger · login de Meta para medición · (opcional) datos legales del vendedor.
- **Medición / mantenimiento (agentes aún en curso al corte):** plan de atribución Meta + panel de la dueña + CSV de economía unitaria; manual de mantenimiento y lista de preparación para la baja de plan del 2026-10-20. Eventos de clientes (Admin) vacío: **ningún píxel instalado** todavía.
- **Contabilidad de tiempo 09:41 → ≈10:20 (estimaciones):** trabajo activo ≈ 39 min (Claude + agentes en paralelo, no se suman); espera de la dueña ≈ 1–2 min (respuesta a la pregunta del dominio); espera de plataforma ≈ 3 min (pestaña congelada/CDP 45 s, carga lenta del admin); **tiempo muerto evitable adicional: 0** desde el reinicio 09:41:14 (el hueco 09:03:30–09:41:14 ≈ 37 min 44 s se mantiene por separado en 11b).
- **Salud previa:** inventario 98/98 · 128 · 0 discrepancias; paridad 7/8 (Q8 por diseño); envíos SHIPPING_VERIFIED; 29/98/95; tienda privada; RC1.10 sin publicar.
