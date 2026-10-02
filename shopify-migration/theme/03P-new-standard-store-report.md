# 03P — Tienda oficial normal de Shopify (Radaelli Swimwear) — informe vivo

Estado: **EN CURSO** — actualizado 08:44 (America/Bogota, 2026-10-02). Pendiente de 03P: solo **B1** (pago sandbox Wompi por la dueña) y su cierre. `READY_FOR_FINAL_LAUNCH_CERTIFICATION: NO` hasta cerrar B1 + restauración de inventario.
Evidencia/herramientas (sin secretos ni PII): `shopify-migration/launch/official-03p/`.

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
| Idioma | `es` publicado y por defecto (raíz `/`), `en` alternativo `/en/` — igual que el laboratorio |
| B productos | 29 productos / 98 variantes / 95 imágenes (95/95 media READY); definiciones de metafields (8) + metaobjeto size_guide; 0 duplicados |
| C inventario | 98/98 rastreadas, **128 unidades**, 0 discrepancias; peso **500 g × 98**; XL conservada |
| D colecciones | oasis-natural 10 · aurora-viva 12 · espuma-de-ola 7 · salidas-de-bano 0 · destacados 7; orden manual exacto; «Home page» vaciada |
| E navegación/legal | menús main-menu 5 / comprar 4 / ayuda 6; 6 páginas (garantía, favoritos, privacidad, términos, envíos, cookies); políticas Reembolso, Privacidad (gestión automática APAGADA), Términos, Envío; **51 redirecciones** |
| F S&D | filtros exactamente **Talla, Color, Price/Precio** (sin Disponibilidad) en ese orden |
| Etiqueta | `MOSTAZA` en entero-golden-hour (como el laboratorio) |
| Sucursal | dirección Calle 93 #72-71, Barranquilla 080001 replicada del laboratorio |

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
- **E2E sandbox (G4)**: checkout preparado (BIKINI FOAM S, cliente ficticio, total $169.820 = 159.920 + 9.900, método Wompi). **Pendiente B1**: la dueña teclea la tarjeta de prueba. Después: cerrar/archivar pedido, restaurar inventario, comprobar 0 dinero real.

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
| Notificaciones/correos (evaluación) | ≈08:40 | ≈08:55 | ≈15 m | cierre inesperado del navegador (~3 m) | 1 | evaluado; entrega física no verificable |
| Históricos (Lane J, agente) | 08:03 | 08:08 | 5 m | — | 0 | BLOQUEADO (documentado) |
| Regresión oficial (29 PDP + variantes) | ≈08:14 | ≈08:31 | ≈17 m | límite anti-ráfagas de Shopify (pausas) | 1 (re-test imágenes) | PASS |
| Regresión rutas/búsqueda/filtros/redirects/enlaces | ≈08:31 | ≈08:35 | ≈4 m | — | 0 | PASS |
| Responsive 390/768/1440 | ≈08:36 | ≈08:40 | ≈4 m | — | 0 | PASS |
| Umbral 299.899/299.900 | ≈08:44 | ≈08:48 | ≈4 m | — | 0 | PASS |
| E2E sandbox (G4) | pendiente | — | — | owner: B1 (teclear tarjeta de prueba) | — | PENDIENTE |

**TOTAL_WALL_CLOCK_TIME**: parcial a 08:44: desde 07:36:21 = ver hora; se fija al emitir `HANDOFF READY 03P-NEW-STANDARD-STORE`. El tiempo de espera de la dueña acumulado ≈ 20 min (OTP, llaves/URL Wompi, plan/pago, cierre de navegador); espera de plataforma ≈ 10 min (login CLI, throttling).

## 12. Acciones de la dueña
Pedidas/completadas: código de acceso (hecho), llaves Wompi de prueba + URL de eventos (hecho), aprobación y pago del plan Basic (hecho). Pendiente: **B1** pago sandbox. Resto en `ai-handoff/owner-action-batch.md` (03Q y decisiones D1–D12).

## 13. Diferido a 03Q
Dominio/DNS · remitente verificado · Wompi LIVE · primera guía real de Envia · quitar contraseña y publicar RC1.10 · decisiones de negocio D1–D12 · datos históricos.
**Bloqueos sin resolver:** 1 (B1, owner-only). `ZERO BACKGROUND TASKS` se declarará al cierre.
