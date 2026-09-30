# 03L — Migración a la tienda de lanzamiento (Client Transfer Store de Colombia)

- **Fecha:** 2026-09-30. Primer intento 09:25–09:45 (Bogotá), detenido en el paso 1 porque la tienda creada era una Dev Store; **reanudada 10:20 → ~11:10** tras crear la dueña la tienda correcta.
- **Destino:** «Radaelli Swimwear Colombia Launch» (`radaelli-swimwear-colombia-launch-1jeqp0yj`). Es la **única tienda de lanzamiento**; las dos Dev Stores quedan como sandbox de QA.
- **Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`). Un solo proceso a la vez, **sin subagentes ni workflows** (el prompt los prohíbe).
- **Método:** olas deterministas por Admin GraphQL (`launch/tools/03l-migrate.mjs`, con `shopify store execute` y la autorización que aprobó la dueña); cada ola comprueba si el recurso ya existe y se verifica antes de la siguiente. Evidencia: `launch/evidence/03L-migration-summary.json` (sin cookies, tokens, contraseña de la tienda ni datos personales).

## Los 23 puntos

| # | Punto | Resultado |
|---|---|---|
| 1 | Modelo | **Sonnet 5.5** (`claude-sonnet-5-5`) |
| 2 | Tiempo | Reanudación 10:20 → ~11:10 (Bogotá) ≈ 50 min; más el primer intento (09:25–09:45) |
| 3 | Tiendas de QA preservadas | **SÍ, las dos.** `radaelli-swimwear-dev` (Horizon `[live]`, Radaelli RC1 `[unpublished]`) y `radaelli-swimwear-colombia` (Dev Store con contexto de EE. UU. que la dueña creó primero): **0 escrituras** en 03L en ambas; no se eliminó ninguna |
| 4 | Destino verificado como Client Transfer | **SÍ.** Dev Dashboard: Tipo «Para transferir a clientes», plan «Transferencia de cliente»; filtro `type = client_transfer` lista exactamente esta tienda. (La tienda `radaelli-swimwear-colombia`, en cambio, es «En desarrollo» y no se usó) |
| 5 | País Colombia | **SÍ.** Entidad comercial en Colombia; dirección de la tienda y sucursal en Colombia (la sucursal ya traía la dirección de despacho: se guardó sin reescribirla y sin copiarla a ningún documento); API: `shopAddress.countryCodeV2 = CO` |
| 6 | Compromiso de pago | **NO.** API: plan «Development» (`partnerDevelopment: true`, `shopifyPlus: false`); no se transfirió, no se eligió plan, no se abrió facturación |
| 7 | Base de Colombia / COP / Bogotá / español | COP ✔ (`currencyCode`); **Bogotá** ✔ (`America/Bogota`, corregida desde «Hora del este (EE. UU. y Canadá)» en Configuración > General); métrico y kilogramo ✔; mercado Colombia activo (único) ✔; **español**: publicado y **predeterminado del dominio** (la raíz sirve `lang="es"`, el inglés queda en `/en`), igual que en la Dev Store; el idioma principal de la tienda sigue siendo inglés (cambiarlo reescribe los temas; se decide al publicar). Tienda **con contraseña de visitante** (no pública); sin proveedor de pagos real (PayPal inactivo, ningún otro); sin DNS |
| 8 | Paridad RC1.10 | **PASS 98/98** (82 archivos idénticos byte a byte y 16 JSON iguales en contenido). SHA-256 `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`. Subido con `theme push --unpublished` como «Radaelli RC1.10» (id `188720808190`), **sin publicar**; Horizon sigue live en la tienda nueva. RC1.9 y RC1.10 locales intactos |
| 9 | Catálogo 29/98/95 | **PASS.** 29 productos, 98 variantes, 95 imágenes (43 fotos de más de 25 MP con la corrección `c_limit` del paquete). `parity` Q1 y Q2: handle, título, vendor, tipo, SKU, talla, precio y compare-at, inventario sin seguimiento con política «denegar», alt de cada imagen, color y publicación en Tienda online, todo igual al paquete. **Sin inventar cantidades; la XL `LG-AUR-000001-XL` quedó como en el paquete y sigue `PENDING_OWNER`** |
| 10 | Colecciones | **PASS.** Oasis Natural 10, Aurora Viva 12, Espuma de Ola 7, Salidas de Baño 0 y Destacados 7, manuales, con **el mismo orden que la Dev Store**, la descripción del sitio actual y `description_tone` (moss, linen, fog, sand). «Home page» (automática) vaciada: Shopify le agregó solo un producto al crearlo (hallazgo L10 de 03C) |
| 11 | Metafields y metaobjeto | **PASS.** Metaobjeto `size_guide` (imagen + texto enriquecido, acceso de tienda) y 8 definiciones (`product.custom.color`, `product.custom.size_guide`, y en colección `cover_image`, `cover_video`, `image_pos_x`, `image_pos_y`, `zoom`, `description_tone`), todas con acceso público de lectura; valores de `color` en los 29 productos. **Omitida a propósito** `customer.custom.wishlist` (solo con la app de favoritos: OAuth pendiente) |
| 12 | Contenido y navegación | Páginas **Garantía** (texto idéntico al verbatim) y **Favoritos** (plantilla `wishlist`, aceptada aunque el tema aún no está publicado) y política de **reembolso** con el texto verbatim de `content/legal/devoluciones.html`. Menús: `main-menu` (5), `comprar` (4) y `ayuda` (2: Devoluciones y Garantía). **No se crearon** Privacidad, Términos, Envíos ni Cookies (esperan datos legales y aprobación de la dueña; no se expone contenido legal incompleto); sus 4 ítems del menú Ayuda se agregan cuando existan. Enlaces internos de los menús y del pie: los verifica `03k-content-links-check.mjs` (9/9) y el smoke |
| 13 | Redirecciones 51/51 | **PASS.** 51 creadas y comprobadas contra el CSV final (origen y destino). Shopify guarda el origen en minúsculas (`/producto/COSTA-ESMERALDA-AZUL`). Los 4 destinos legales (`/pages/envios`, `/pages/terminos`, `/pages/privacidad`, `/pages/cookies`) darán 404 hasta que existan sus páginas: es esperado y está documentado |
| 14 | Smoke y responsive dirigido | **PASS 20/20 combinaciones** (Home, Oasis Natural, PDP `marea-natural`, Búsqueda y Carrito × 320, 390, 768 y 1440 px, con la vista previa del tema sin publicar): 0 desbordes, 0 imágenes rotas, 0 claves sin traducir, 0 texto de EE. UU./USD, 1 `h1`, 0 saltos de encabezado, 0 controles sin nombre, 0 `id` duplicados, `lang="es"`, 0 errores de JS propios (el `Script error.` opaco de scripts de Shopify se cuenta aparte, como en 03K). Precios en formato COP (`$183.920,00`); JSON-LD de la Home = Organization + WebSite y de la ficha = ProductGroup + BreadcrumbList; módulo de movimiento reducido cargado. Prueba de carrito: `add.js` 200, país CO, moneda COP, carrito vaciado. **No medido:** checkout con un pago (la tienda no tiene envío ni pago configurados: `FINAL-STORE ONLY`) y LCP/FCP/CLS reales (ventana de Chrome oculta) |
| 15 | Escaneo de secretos | **0 bloqueantes** en la copia que se sube al respaldo (`03g-secret-scan.mjs`: 459 archivos de texto; 79 coincidencias permitidas = contacto público de la marca, que incluye el enlace público de WhatsApp dentro del texto verbatim de las políticas del sitio actual; 6 datos sintéticos de pruebas). Sin la dirección de la dueña, sin la huella de la base de datos, sin tokens. La herramienta nueva no lee, imprime ni guarda el token del CLI; la contraseña de visitante no se leyó, escribió ni guardó |
| 16 | Rama de respaldo actualizada | **SÍ** (`shopify-migration-backup`; el hash del commit va en el handoff porque este reporte va dentro del respaldo) |
| 17 | Envío | **`FINAL-STORE ONLY`.** Sin zona ni tarifas nuevas, sin app de mensajería, sin plan de pago; el tema mantiene apagados `free_shipping_rate_confirmed` y la barra de envío gratis, así que **no promete** un envío que la tienda no cobra todavía |
| 18 | Wompi | **`FINAL-STORE ONLY`.** No se instaló ni se tocó ninguna pantalla de pagos; el modo de prueba y las llaves las escribe la dueña más adelante |
| 19 | Interrupciones a la dueña en el 03L reanudado | **3 clics de dueña:** (1) aprobar el acceso del CLI a la tienda (OAuth), (2) aprobar de nuevo el acceso al agregar permisos de políticas legales (la primera solicitud venció sin respuesta) y (3) abrir la vista previa del tema desde el Admin, porque la tienda tiene contraseña de visitante y esa contraseña no la manejo yo. Ninguna pregunta rutinaria. Una confusión: abrí «Ver tu tienda online», que le mostró a la dueña la pantalla de contraseña de visitante; se le aclaró que no debía escribir nada |
| 20 | Bloqueos restantes | **Dueña / tienda final:** nombre comercial real, transferencia y plan al transferir, facturación (`BILLING/PLAN`); datos legales y aprobación de 4 textos (`LEGAL DATA`); XL sí o no e inventario (`OWNER DECISION`); qué datos de clientas migrar (`OWNER DECISION`); contraste de botones (`OWNER DECISION`); tarifa de envío y Wompi (`FINAL-STORE ONLY`); Search & Discovery, analítica, favoritos de cuenta y código de ingreso (`OWNER AUTH/OAUTH`); OK de descarga de la media (`OWNER AUTH/OAUTH`); DNS, publicar y quitar la contraseña (`FINAL CUTOVER`). Detalle y lote mínimo: `launch/03K-blocker-matrix.md` (D4 actualizado: la tienda ya existe) |
| 21 | Preparación de la migración al destino | **≈ 95 %** (estimación por inventario: las 13 compuertas del paso 6 están en PASS, con estas salvedades: idioma principal aún en inglés, 4 páginas legales y sus ítems de menú sin crear, definición de favoritos de cuenta omitida y checkout sin probar por falta de envío y pago). No es la preparación para lanzar: eso depende de los bloqueos del punto 20 |
| 22 | LISTO PARA 03M | **SÍ.** Todo el trabajo permitido está hecho y verificado; lo que queda es de la dueña o del corte |
| 23 | CERO TAREAS DE SEGUNDO PLANO ACTIVAS | **CERO TAREAS DE SEGUNDO PLANO ACTIVAS.** Sin servidores ni procesos `node`, sin autorizaciones pendientes (las dos terminaron), mis pestañas de Chrome cerradas (queda solo la de ChatGPT de Daniela), sin agentes ni workflows. Solo quedan las esperas finitas del handoff (+1 / +2 / +5 min) |

## Detalle de las olas

| Ola | Qué hizo | Comprobación |
|---|---|---|
| `defs` | Metaobjeto `size_guide` y 8 definiciones | `parity` Q4 |
| `collections` | 5 colecciones manuales con descripción y tono | `parity` Q3 |
| `products` | 29 productos con 98 variantes y 95 imágenes por `productSet` (una prueba con `marea-natural` antes de las otras 28) | `parity` Q1 y Q2 |
| `membership` | Pertenencia y orden de las colecciones | `parity` Q3 |
| `publish` | 29 productos y 5 colecciones en «Tienda online» | `parity` Q2 |
| `pages` / `policies` | Garantía, Favoritos y reembolso | `parity` Q6 |
| `menus` | `main-menu`, `comprar`, `ayuda` | `parity` Q7 |
| `redirects` | 51 redirecciones | `parity` Q5 |
| Base | Zona horaria de Bogotá (Admin), español publicado y predeterminado del dominio (API + Admin), sucursal guardada | `parity` Q8 y el smoke |

## Notas y límites

- **Contraseña de visitante:** la tienda nueva está protegida y así debe seguir hasta el corte. Para probarla usé la vista previa del tema que abrió la dueña desde el Admin; **no** escribí ni leí la contraseña.
- **Permisos concedidos al CLI** (lista exacta): productos, contenido, navegación de la tienda online, definiciones y entradas de metaobjetos, canales de publicación, idiomas y políticas legales, todos de lectura y escritura. El token en línea lo guarda el CLI; no hay ningún token en el repositorio.
- **Efecto colateral del CLI:** al ejecutar un comando, el CLI se actualizó solo a 4.8.3 de forma global; el resto del proyecto siguió usando `@shopify/cli@4.8.2` con `npx`.
- **Nombre de la tienda:** la tienda se llama «Radaelli Swimwear Colombia Launch»; el logo de texto del encabezado usa ese nombre hasta que la dueña defina el nombre comercial (HP-01).
- **No se afirma** que el checkout, el envío o Wompi funcionen en esta tienda, ni que la tienda esté lista para publicarse.

## Respaldo y escaneo

`launch/tools/03l-migrate.mjs`, `launch/evidence/03L-migration-summary.json`, este reporte, el runbook actualizado y la matriz de bloqueos con D4 actualizado se copian a `shopify-migration-backup` tras el escaneo de secretos (`launch/tools/03g-secret-scan.mjs`) y la búsqueda de la dirección de la dueña, de la contraseña de visitante y de la huella de la base de datos (0 coincidencias).
