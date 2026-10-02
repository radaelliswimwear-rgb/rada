# 03P — Certificación del laboratorio (Dev Store gratuita) — 2026-10-01

**Laboratorio:** `radaelli-swimwear-dev.myshopify.com` (Dev Store gratuita de la cuenta Partner `daniradaelli01@gmail.com`; nunca será la tienda oficial).
**Contexto:** Soporte de Shopify (asesor humano) respondió que una transferencia ya aceptada NO se revierte. La tienda «launch» quedó inactiva en la cuenta del comerciante (no se pagó, no se tocó). La dueña eligió reutilizar esta Dev Store (opción F1).

## Veredicto
- **LAB_CERTIFIED = YES**
- **READY_FOR_NEW_STANDARD_STORE = YES**
- Dinero real: ninguno. Sin pagos, sin tienda oficial, sin publicación, sin DNS, Wompi solo en modo prueba, contraseña de visitante activa.
- **ZERO BACKGROUND TASKS** (ningún proceso en segundo plano al cierre).
- RC vigente: **RC1.10** (sin publicar), tema 189149511999, SHA-256 del ZIP `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`, paridad remoto = ZIP **98/98**; paridad de datos `03l-migrate parity` **8/8 PASS**.
- Secret scan de estos artefactos: sin llaves, PIN de soporte, datos de tarjeta ni datos personales (el pedido de prueba usa datos ficticios `example.com`).

## Qué se aplicó (solo diferencias reales frente al paquete validado)
| Cambio | Resultado |
|---|---|
| Tema RC1.10 (`theme push --unpublished`, tema 189149511999) | paridad 98/98 (82 idénticos + 16 JSON equivalentes), SHA-256 del ZIP `e0f67590…2410c` |
| Inventario (hoja 03O) | 98/98 con seguimiento, 128 unidades, 0 discrepancias |
| Peso | 500 g en 98 variantes |
| Colecciones | orden MANUAL y orden exacto (Oasis 10 / Aurora 12 / Espuma 7 / Salidas 0 / Destacados 7) |
| Redirecciones | 47 → 51 |
| Páginas legales (privacidad, términos, envíos, cookies) + políticas de Shopify (Términos, Envío, Privacidad; la gestión automática de Privacidad se apagó en el Admin) | 200 |
| Menús | main-menu 5, comprar 4, ayuda 6 |
| Mercado de EE. UU. | pasado a DRAFT; queda solo Colombia |
| Zonas de envío | ver abajo |
| Envia | instalada y vinculada (cuenta de la dueña) |
| Wompi | estaba ACTIVO con modo prueba APAGADO → modo prueba ACTIVADO y guardado |
| Search & Discovery | instalada; filtros Talla, Color (custom.color) y Precio, sin Disponibilidad; orden Talla, Color, Precio |

Paridad `03l-migrate parity`: **8/8 PASS** (Q1 29/98/95, Q2 SKU/precio/inventario, Q3 colecciones, Q4 metafields+size_guide, Q5 51 redirecciones, Q6 páginas, Q7 menús, Q8 COP/Bogotá/kg/CO).

## Matriz de certificación
| Sección | Estado | Evidencia |
|---|---|---|
| A. Baseline/paridad | PASS | 8/8; tema 98/98; inventario 98/98 |
| B. Enlaces y redirecciones | PASS | 51/51 no dan 404 (las 9 `/cuenta/*` redirigen a cuentas de cliente, igual que `/account`); 19/19 enlaces de menú y pie; 4/4 enlaces sociales externos responden 200 y coinciden con el tema |
| C. Imágenes | PASS | 95/95 cargan |
| D. Responsive | PASS | **390 px reales** (marco de 390 px, innerWidth=390; el navegador solo baja a 500 px), 500, 768 y 1440 px: Home, colección, PDP, carrito, búsqueda, legal sin desbordes ni imágenes rotas |
| E. Catálogo | PASS | 29 productos / 98 variantes / 95 imágenes; 0 SKU o handles duplicados; todas con precio; 29 PDP responden 200 |
| F. PDP/carrito/stock | PASS | 98/98 variantes se agregan; cantidades y quitar; el stock limita la cantidad; aviso «Últimas unidades» |
| G. Búsqueda/colecciones/filtros | PASS | marea 2, verde 2, terracota 3, vacío 0; orden precio/A–Z; filtros S&D: Talla XL=11, Color NEGRO=6, Precio funciona |
| H. Legal/políticas | PASS | 4 páginas + 4 políticas 200; textos aprobados |
| I–K. Envío regional | PASS | ver tabla |
| L. Wompi sandbox E2E | PASS | pedido #1003 test=true PAGADO COP 169.820 (envío 9.900), Wompi VENTA exitosa, un solo pedido, sin duplicados |
| M. Pedido/inventario | PASS | inventario bajó 1 y se restauró (+1, clave idempotente nueva; la clave fija de la herramienta de hoja no reaplica); pedido #1003 y antiguos #1001/#1002 cerrados |
| N. Campos del checkout | PASS | avisos en español para correo, nombre, apellidos, dirección, ciudad, departamento; teléfono y postal opcionales |
| O. Técnico | PASS | Theme Check 0 observaciones (61 archivos); 0 errores de JavaScript en consola; secret scan 0 |
| P. Apps | PASS | S&D instalada y configurada; Envia vinculada (rol cotización/guías, sin CCS); Wompi instalado en modo prueba |

## Envíos regionales (valores aprobados por la dueña por escrito)
Subtotal menor a COP 299.900: tarifa fija por zona; desde COP 299.900: «Envío estándar gratis». Envío pagado hasta 299.899 y gratis desde 299.900 (condiciones leídas de la configuración guardada). 33 departamentos cubiertos.
| Zona | Departamentos | Tarifa | Costo Envia (cotizado, origen Barranquilla, 15×10×5 cm, 0,5 kg) |
|---|---|---|---|
| 1 Barranquilla/Atlántico | ATL | 9.900 | 7.900–9.100 |
| 2 Resto del Caribe | BOL, MAG, COR, SUC, LAG, CES | 12.900 | 7.900–11.350 |
| 3 Ciudades principales | DC, ANT, VAC, SAN, RIS, CAL, QUI, CUN, NSA | 17.900 | 14.570–17.300 |
| 4 Resto del país | BOY, TOL, HUI, MET, NAR, CAU, CAQ, ARA, CAS, CHO, PUT | 21.900 | 16.940–22.350 (muestra Sogamoso) |
| 5 San Andrés y Amazonía | SAP, AMA, VAU, GUA, GUV, VID | 44.900 | 41.780–58.750 |
Pruebas en checkout real: con carrito de 199.920 cada zona dio su tarifa; con 319.840 solo «Envío estándar gratis». El catálogo solo tiene 4 precios (159.920 a 199.920), sin combinación cercana a 299.900; el borde exacto se probó después con productos temporales (299.899 paga $9.900; 299.900 gratis) y además se leyeron las condiciones guardadas.

## Micropruebas finales (solicitadas por ChatGPT) — todas PASS
1. **Enlaces sociales externos del pie (4):** los valores de la tienda son idénticos a los del tema `settings_data.json` (`social_instagram`, `social_facebook`, `social_tiktok`, `social_whatsapp`). Los 4 responden HTTP 200: Instagram `instagram.com/Radaelli_swimwear` (título «RADAELLI | Vestidos de Baño (@radaelli_swimwear)»), Facebook `facebook.com/Radaelli_Swimwear` (200, muro de inicio de sesión), TikTok `tiktok.com/@RadaelliSwimwear` (200, el servidor no entrega título a bots) y WhatsApp `wa.me/573135359668` (abre `api.whatsapp.com` con ese número). Limitación: Facebook y TikTok no permiten confirmar sin sesión que el perfil exista; el destino es el configurado por la dueña y no se modificó.
2. **Móvil real de 390 px:** el navegador impone ancho mínimo de 500 px y NO se rotula 500 como 390. Evidencia más fuerte disponible: cada página se renderizó dentro de un marco de **exactamente 390 px** (el `innerWidth` medido fue 390, por lo que las reglas de diseño adaptable se evalúan a 390). Home, colección, ficha, búsqueda, carrito y legal/pie: **0 desbordes horizontales** (ancho de contenido 375 + barra de desplazamiento 15), **0 imágenes rotas**, **0 botones recortados** y control de menú presente. Los elementos que aparecen fuera del ancho en Home y ficha son carruseles/galería con desplazamiento horizontal por diseño. Captura visual de la ficha a 390 px: título, precio, aviso de stock, tallas, «Añadir al carrito» y acordeones, todo dentro del ancho.
3. **Umbral exacto de envío en checkout real:** con dos productos temporales **no publicados al catálogo real, sin seguimiento de inventario y borrados al terminar** (`zz-test-umbral-299899` y `zz-test-umbral-299900`, dirección en Atlántico): **COP 299.899 → «Envío estándar» $9.900** (total $309.799); **COP 299.900 → «Envío estándar gratis»** (total $299.900). Rollback verificado: productos borrados, carrito vacío, paridad `03l-migrate parity` **8/8 PASS**, 29/98/95 exactos, inventario 98/98 con 128 unidades y 0 discrepancias. No se completó ningún pedido en estas pruebas.

## Hallazgos
1. US market activo en la dev store (no existe en la validada): corregido (DRAFT).
2. Wompi ACTIVO con modo prueba APAGADO: corregido y verificado.
3. La herramienta de inventario (`03m-post-decision`) usa clave `@idempotent` fija: no reaplica una hoja idéntica; para restaurar se usó ajuste con clave nueva.
4. El storefront aplica límite 429 por IP: las pruebas se espaciaron.
5. La barra de anuncio del tema dice «20 % DE DESCUENTO EN TODA LA TIENDA»: es texto del tema RC1.10, igual que en la tienda validada; a revisar por la dueña antes de publicar.

## Diferido a la tienda oficial (no probable en el laboratorio)
Que la promoción de tienda nueva aparezca; dominio/DNS y quitar la contraseña; Wompi en vivo; compra real de guías de Envia (saldo $0); migración de datos históricos (necesita exportación autorizada y permisos de pedidos/clientes). La tienda «launch» no se usa.

## Pendientes menores (no bloquean)
- Ninguno abierto. Los enlaces sociales y el borde exacto de COP 299.900 quedaron probados (ver micropruebas); solo persiste la limitación de que Facebook/TikTok no confirman la existencia del perfil sin sesión.

## FINAL DEEP AUDIT (03P-LAB-FINAL-DEEP-AUDIT) — 2026-10-01

**Veredicto: LAB_FINAL_DEEP_AUDIT = PASS — 29/29 PDP y 98/98 variantes sin defectos reproducibles; 0 correcciones; 0 regresiones; 3 observaciones y los pendientes exclusivos de la dueña quedan documentados**

Laboratorio auditado: `radaelli-swimwear-dev.myshopify.com` (RC1.10 sin publicar). Auditoría autónoma de Claude, sin la dueña presente; **sin pagos, sin dinero real, sin tienda oficial, sin publicación/DNS, Wompi solo TEST, tienda `launch` inactiva sin tocar**. **No se modificó ningún dato, configuración ni código del tema** (0 correcciones necesarias; ver "Bugs").

### Método y limitaciones
- Páginas reales de la tienda, cargadas con la sesión de la contraseña de visitante en el Chrome de la dueña (un solo proceso, sin subagentes). Peticiones espaciadas ≥ 1,3 s; Shopify aplicó límite 429 por IP en ráfagas (sobre todo tras respuestas 422 repetidas): se respetó con esperas y reintentos, no es un defecto de la tienda.
- 390 px **real**: la ventana del navegador no baja de 500 px, por lo que cada PDP se renderizó en un iframe de EXACTAMENTE 390 px (`innerWidth` medido = 390) con ganchos de errores inyectados. Los errores propios del iframe (`storefrontBaseUrl`, `replaceState` SecurityError por `srcdoc`) se clasificaron como artefactos de la técnica, no de la tienda.
- Ninguna orden nueva ni cambio de inventario: las pruebas de carrito se limpian al final (carrito vacío).

### A. Matriz de las 29 páginas de producto (sin muestreo)
Por cada PDP, en iframe de 390 px: carga completa sin quedarse cargando; `h1` = título; precio mostrado = precio API (COP); galería ≥ 1 imagen y todas cargan; botón «Añadir al carrito»; 5 acordeones que abren/cierran; `canonical` correcto; JSON-LD válido; `og:title/og:image`; sin `undefined/NaN/null/placeholder`; sin desbordamiento horizontal; 0 errores de consola propios; 0 recursos fallidos; **todas sus variantes** seleccionables con ID/precio/botón coherentes.

| # | Handle | Producto | Variantes | Precio COP | Uds | Media | Resultado | Nota |
|---|--------|----------|-----------|-----------|-----|-------|-----------|------|
| 1 | `brisa-natural-beige` | BRISA NATURAL BEIGE | 3 (S/M/L) | $199.920 | 6 | 3 | PASS | — |
| 2 | `costa-esmeralda-azul` | COSTA ESMERALDA AZUL | 3 (S/M/L) | $183.920 | 6 | 3 | PASS | — |
| 3 | `entero-golden-hour` | ENTERO GOLDEN HOUR | 3 (S/M/L) | $183.920 | 3 | 3 | PASS | — |
| 4 | `costa-esmeralda-negro` | COSTA ESMERALDA NEGRO | 3 (S/M/L) | $183.920 | 6 | 3 | PASS | — |
| 5 | `oasis-serena-azul` | OASIS SERENA AZUL | 3 (S/M/L) | $199.920 | 6 | 3 | PASS | — |
| 6 | `brisa-natural-naranja` | BRISA NATURAL NARANJA | 3 (S/M/L) | $199.920 | 6 | 3 | PASS | — |
| 7 | `arena-dorada-negro` | ARENA DORADA NEGRO | 3 (S/M/L) | $183.920 | 6 | 3 | PASS | — |
| 8 | `oasis-serena-negro` | OASIS SERENA NEGRO | 3 (S/M/L) | $199.920 | 6 | 3 | PASS | — |
| 9 | `marea-natural-naranja` | MAREA NATURAL NARANJA | 3 (S/M/L) | $183.920 | 6 | 3 | PASS | — |
| 10 | `bikini-shadow-azul-marino` | BIKINI SHADOW NEGRO | 3 (S/M/L) | $159.920 | 3 | 3 | PASS | handle conserva `azul-marino` (URL original), título/color = NEGRO |
| 11 | `alba-dorada-lila` | ALBA DORADA LILA | 4 (S/M/L/XL) | $167.920 | 4 | 4 | PASS | — |
| 12 | `raices-del-sol-azul-oscuro` | RAÍCES DEL SOL AZUL OSCURO | 4 (S/M/L/XL) | $167.920 | 4 | 4 | PASS | — |
| 13 | `camiseta-solar-waves-negro` | CAMISETA SOLAR WAVES NEGRO | 3 (S/M/L y XL) | $159.920 | 3 | 3 | PASS | — |
| 14 | `amanecer-dorado-terracota` | AMANECER DORADO TERRACOTA | 4 (S/M/L/XL) | $167.920 | 4 | 3 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 15 | `sol-interno-beige-suave` | SOL INTERNO BEIGE SUAVE | 4 (S/M/L/XL) | $167.920 | 4 | 4 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 16 | `sol-interno-cafe-claro` | SOL INTERNO CAFÉ CLARO | 4 (S/M/L/XL) | $167.920 | 4 | 4 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 17 | `enterizo-shadow-palm-azul-marino` | ENTERIZO SHADOW PALM NEGRO | 3 (S/M/L) | $183.920 | 3 | 3 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas; handle conserva `azul-marino` (URL original), título/color = NEGRO |
| 18 | `amanecer-dorado-lila` | AMANECER DORADO LILA | 4 (S/M/L/XL) | $167.920 | 4 | 4 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 19 | `aurora-total-azul-oscuro` | AURORA TOTAL AZUL OSCURO | 4 (S/M/L/XL) | $183.920 | 4 | 3 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 20 | `bikini-waves-terracota` | BIKINI WAVES TERRACOTA | 3 (S/M/L) | $159.920 | 3 | 3 | PASS | — |
| 21 | `aurora-total-terracota` | AURORA TOTAL TERRACOTA | 4 (S/M/L/XL) | $183.920 | 4 | 4 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 22 | `bikini-foam` | BIKINI FOAM | 3 (S/M/L) | $159.920 | 3 | 3 | PASS | — |
| 23 | `bikini-waves-verde-oliva` | BIKINI WAVES VERDE OLIVA | 3 (S/M/L) | $159.920 | 3 | 3 | PASS | — |
| 24 | `alba-dorada-beige-suave` | ALBA DORADA BEIGE SUAVE | 4 (S/M/L/XL) | $167.920 | 4 | 3 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 25 | `arena-dorada-beige` | ARENA DORADA BEIGE | 3 (S/M/L) | $183.920 | 6 | 3 | PASS | — |
| 26 | `marea-natural` | MAREA NATURAL BEIGE | 3 (S/M/L) | $183.920 | 6 | 3 | PASS | handle sin color (URL original), título = MAREA NATURAL BEIGE |
| 27 | `alba-dorada-cafe-claro` | ALBA DORADA CAFÉ CLARO | 4 (S/M/L/XL) | $167.920 | 4 | 5 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 28 | `raices-del-sol-beige-suave` | RAÍCES DEL SOL BEIGE SUAVE | 4 (S/M/L/XL) | $167.920 | 4 | 3 | PASS | imágenes lazy marcadas en 1.ª pasada (pestaña oculta) → re-test con espera: 0 pendientes / 0 rotas |
| 29 | `bikini-palm-verde-oliva` | BIKINI PALM VERDE OLIVA | 3 (S/M/L) | $159.920 | 3 | 3 | PASS | — |

Totales: **29/29 PDP PASS**; 98 variantes; 95 imágenes (95/95 cargan); desbordamiento a 390 px: 0; recursos fallidos: 0; errores de consola propios: 0.

### B. Las 98 variantes (sin muestreo)
- Selección (clic real en la opción) → `variant id` correcto, precio coherente y botón habilitado/deshabilitado coherente con `available`: **98/98 sin fallos**.
- Añadir **cada** variante al carrito con su stock exacto: **98/98 aceptadas; carrito final = 98 líneas, 128 unidades, cada línea = su inventario (allMatch = true), 0 duplicados**; carrito vaciado al terminar.
- Tope de inventario (ruta AJAX del tema: FormData `id`+`quantity`, cabecera `X-Requested-With`): (1) **Aceptación de stock exacto en las 98 variantes: 98/98 OK** (carrito = 98 líneas / 128 uds, cada línea = su inventario). (2) **Pedir stock + 1 → 422 y la línea queda exactamente en su stock** en la corrida limpia registrada: 14 variantes (`LG-ESP-000007` S/M/L, `LG-HOM-000001` S/M/L/XL, `LG-AUR-000001` S/M/L/XL, `RSONBI032` S/M/L con stock 2/3/1) → 14/14 422, carrito resultante 14 líneas / 17 uds = 11×1 + 2 + 3 + 1. Pruebas puntuales adicionales: `RSONEN022-M` (stock 3) pedir 4 → 422 «solo se añadieron 3 artículos», línea 3; `LG-ESP-000007-S` pedir 2 → 422, línea 1; añadir 1 y luego 1 → 422 «Tu carrito ya tiene la cantidad máxima de este artículo». Política de inventario por API: **98/98 DENY y rastreadas**. **Limitación honesta**: Shopify aplicó su límite anti-abuso (429, página «Un momento…») tras ráfagas de respuestas 422, por lo que el barrido de *rechazo* no se extendió a las 98 variantes (el de *aceptación* sí); no se inventa PASS para las 84 restantes.
- Cantidad/quitar: `change.js` a una cantidad > stock → 422 «Debido a la disponibilidad…»; quitar (qty 0) elimina la línea; el cambio de cantidad en la UI del carrito muestra «Cantidad máxima disponible para este producto: N».
- URL de variante (`?variant=ID`) y atrás/adelante del navegador: estado de variante, carrito y colección se conservan (PASS).

### C. Rutas, páginas e interacciones
- **Home, 6 colecciones** (Oasis Natural 10, Aurora Viva 12, Espuma de Ola 7, Destacados 7, Todos 29 en 2 páginas, Salidas de Baño 0 por diseño): 0 enlaces/imágenes rotos; filtros S&D (Talla/Color/Precio) presentes en las 5 colecciones con productos (la vacía no muestra filtros). Ordenamiento y filtro de disponibilidad PASS.
- **Búsqueda**: positivos (`marea` 2, `verde` 2, `terracota` 3), vacío/negativo (0 resultados con mensaje), `/search.json` 200.
- **Carrito / cajón**: vacío con mensaje y «Seguir comprando»; añadir/cambiar/quitar; contador del header; persistencia al navegar y al volver con «atrás».
- **Legales/políticas**: `/pages/garantia`, `/pages/envios`, `/pages/terminos`, `/pages/privacidad`, `/pages/cookies`, `/pages/favoritos` y `/policies/refund-policy` → HTTP 200 (verificadas como destino final de las redirecciones); políticas de Shopify (términos, envíos, privacidad) configuradas.
- **Favoritos**: página y plantilla 200; añadir/quitar con `localStorage` (clave `radaelli:wishlist`) y miniatura cargada.
- **Cuenta**: `/account*` → cuentas de cliente nuevas de Shopify (302); `/cuenta/*` (9 redirecciones) → `/account`, `/account/login`, `/account/register`, `/pages/favoritos` según tabla.
- **Contraseña** (sin sesión: `/` → 302 `/password`); **404** deliberado en producto/colección/página inexistentes: página de no encontrado correcta (HTTP 404).
- **Navegación**: enlaces internos únicos de header/footer/menú de la Home **14/14 HTTP 200** (más 19/19 de la certificación); 4 enlaces externos sin cambios; menú móvil abre/cierra; cajón de filtros abre/cierra con `aria-expanded`; **51 redirecciones**: **51/51 PASS** (42 con destino en la misma tienda: HTTP 200 y ruta final = destino de la tabla; 9 `/cuenta/*` → `/account*`: la redirección se dispara hacia las cuentas de cliente de Shopify, verificada con `redirect: manual`; la API lista exactamente 51).
- **Atrás/adelante**: colección → PDP → atrás → adelante conserva la colección (12 productos) y la PDP.

### D. Formularios y notificaciones
- **Boletín (footer/home)**: `contact[email]` es `type=email` + `required` (vacío no valida en el navegador). Envío forzado al servidor con un correo inválido: HTTP 400, **sin crear cliente**. No se ejecutó la ruta de éxito (evita inscribir correos reales).
- **Búsqueda** (2 formularios `GET /search?q=`): OK. La página Contacto no contiene formulario propio (solo datos/enlaces; coincide con el sitio original).
- **Notificaciones — evidencia del pedido de prueba #1003 (Wompi TEST)**: eventos de Shopify: «Se envió un correo electrónico de confirmación de pedido a Prueba Laboratorio» (plantilla de confirmación al cliente enviada, locale es-CO) y «Se ha recibido un nuevo pedido #1003» (notificación al personal generada). «Enviar prueba» desde Configuración → Notificaciones solo envía al correo del personal (daniradaelli01@gmail.com). **Limitaciones**: la bandeja de la dueña no se leyó (regla de privacidad), por lo que la *entrega física* no se probó; el destinatario de la compra de prueba es `prueba.lab@example.com` (no entregable por diseño).
- Hallazgos de notificaciones (OWNER_ACTION_REQUIRED en la tienda oficial): correo del remitente `radaelliswimwear@gmail.com` **sin verificar** como remitente propio (Gmail no puede ser remitente personalizado → usar remitente verificado o dominio propio); destinatarios de «Nuevo pedido» por definir en la tienda oficial (hoy solo daniradaelli01@gmail.com); plantillas del personal en inglés.

### E. Responsive / UI
- 29/29 PDP a 390 px reales (iframe) PASS (A). Home, colección, búsqueda, carrito y legal a 390/768/1440: sin desbordamiento, imágenes rotas ni botones recortados (certificación + micropruebas).
- Menú abrir/cerrar, cajón de filtros (abre/cierra, `aria-expanded`), galería (todas las imágenes cargan en las 29 PDP) y controles de carrito (añadir/cantidad/quitar): PASS. Contraste/estética: diferido por la dueña (no es bloqueo funcional).
- Observación UX (no bloquea): al abrir el campo de búsqueda del header se superpone al último elemento del menú en anchos medianos.

### F. Técnico y contenido
- Escaneo de recursos/404: sin 404 en activos críticos; consola: 0 errores JS propios recurrentes; redes: 0 fallos críticos. PDP ≈ 275 recursos por carga (informativo, sin bloqueo).
- Duplicados: 0 handles ni SKUs duplicados; 0 precios vacíos; moneda COP; 0 imágenes faltantes; metacampo `custom.color` presente en 29/29.
- Meta/SEO: `canonical` y JSON-LD válidos en 29/29 PDP; **sin meta description** en Home, Destacados y Todos (decisión de copy pendiente; sugerencia: reutilizar el texto del footer).
- Sin productos/artefactos temporales visibles (catálogo exacto 29/98/95); mercado Colombia/COP/Bogotá/kg correcto y mercado US en DRAFT.
- Theme Check 0 ofensas / 61 archivos (sin cambios de código en esta fase); escaneo de secretos/PII de los artefactos nuevos: limpio.

### G. Envíos y pago
Sin cambios que los afecten → no se repitió el pago. Se mantienen aceptados: 5 zonas/33 departamentos, tarifa 9.900–44.900, **299.899 paga / 299.900 gratis**, Wompi TEST #1003 PAID. Verificación del ceiling: el checkout reconcilia cantidades por encima del inventario.

### Bugs encontrados, correcciones y regresiones
**Defectos reproducibles y deterministas: 0. Correcciones aplicadas: 0. Regresiones: 0.** Observaciones (no son defectos de la tienda):
1. **OBS-1 (informativa, sin acción) — El tope de inventario depende de la ruta de alta (comportamiento nativo de Shopify)**. Evidencia (variante `LG-ESP-000007-S`, stock 1):
   - **Interfaz real (lo que ve la clienta) — PASS**: botón «Añadir al carrito» de la PDP (AJAX + cajón): 1.ª vez → línea 1; 2.ª vez → mensaje rojo en línea «Tu carrito ya tiene la cantidad máxima de este artículo.» y el carrito sigue en 1; botón «+» del cajón → «Debido a la disponibilidad, solo se añadió un artículo al carrito.» y sigue en 1.
   - AJAX del tema (FormData, `X-Requested-With`), `items[]` con `Accept: json`: **422** «Debido a la disponibilidad, solo se añadió un artículo al carrito» → línea = 1.
   - Solo por rutas que la interfaz no usa (formulario nativo `POST /cart/add` sin JavaScript, o JSON de un solo ítem sin `Accept`): **200** → línea = 2 (por encima del stock); la página del carrito no muestra aviso y el campo de cantidad no tiene `max`.
   - **Checkout lo reconcilia siempre**: diálogo «Actualización de cantidad — Las cantidades disponibles de estos artículos cambiaron y se actualizaron en tu carrito (2 artículos → 1 artículo)». **No hay sobreventa.**
   - Clasificación: **informativa**; no es un defecto alcanzable desde la interfaz con JavaScript. Mejora opcional futura (DEFERRED): aviso por línea en la página `/cart` sin JavaScript. No se tocó el tema (RC1.10 validado intacto).
   - Nota de trazabilidad: una corrida previa de mi propio script mostró 200 en todas las variantes porque enviaba la forma «JSON de un ítem sin `Accept`»; repetida con la ruta real del tema el resultado es el de arriba.
2. **OBS-2 — Handles heredados**: `bikini-shadow-azul-marino` y `enterizo-shadow-palm-azul-marino` (título/color NEGRO) y `marea-natural` (título «…BEIGE») conservan el handle exacto de la URL original por paridad (`shopify-url-parity.csv`). Decisión de la dueña si algún día quiere renombrar + redirigir.
3. **OBS-3 — Servidor del boletín**: correo inválido forzado → 400 de Shopify (la validación visible está en el navegador).

### DEFERRED / OWNER_ACTION_REQUIRED (restantes)
- OWNER_ACTION_REQUIRED (tienda oficial, mañana 2026-10-02 08:00 America/Bogota bajo radaelliswimwear@gmail.com): remitente de correos verificado; destinatarios de «Nuevo pedido»; textos del personal en español; aprobación de promoción/plan antes de pagar; Wompi llaves de producción (solo la dueña); Envia (cuenta/tarifas en vivo); dominio/DNS y retirada de contraseña (no hoy).
- DECISIÓN DE NEGOCIO: barra de anuncio «20% DE DESCUENTO EN TODA LA TIENDA» (no hay descuento configurado) antes de publicar; voseo del copy (verbatim del sitio) vs tuteo colombiano; meta descriptions de Home/Destacados/Todos; colección «Salidas de Baño» vacía en el menú principal (0 productos por diseño); mensaje «Solo quedan N» es el total del producto, no de la talla.
- NO VERIFICABLE sin sesión: perfiles de Facebook/TikTok (HTTP 200 detrás de muro de login); entrega física de correos; migración de datos históricos (requiere exportación autorizada y permisos `write_orders`/datos protegidos).
- Mejora opcional OBS-1 (arriba). Etiquetas «Agregar a favoritos» vs «Añadir a favoritos» (consistencia de copy).

### Línea base final restaurada y verificada
- Catálogo: **29 productos ACTIVE / 98 variantes / 95 imágenes** (API); inventario **98/98 rastreadas, 128 unidades, 0 discrepancias** (`03o-inventory-verify`); **51 redirecciones**; paridad de datos **8/8 PASS** (`03l-migrate parity`).
- Tema: **Radaelli RC1.10 sin publicar**; paridad remoto = ZIP **98/98** (82 exactos + 16 JSON semánticamente iguales; solo ZIP 0, solo remoto 0, distintos 0). Temas de la tienda: Horizon [live], Radaelli RC1 y Radaelli RC1.10 [unpublished]; sin temas extra.
- Tienda: COP / America/Bogota / kg; mercado Colombia ACTIVE, US DRAFT.
- Pedidos: solo #1001–#1003 (de prueba, cerrados/archivados); **ningún pedido nuevo** en esta fase → **0 dinero real**; Wompi sin tocar (TEST; #1003 PAID sandbox).
- Estado del navegador de pruebas: carrito vacío y favoritos vacíos.

**ZERO BACKGROUND TASKS.** Ningún proceso activo; carrito vaciado; sin productos/artefactos temporales; la tienda queda estable en RC1.10 sin publicar.
