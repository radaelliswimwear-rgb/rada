# 03G — Plan de migración: Development Store → tienda comercial (S01 a S17)

- **Fecha:** 2026-09-29, 18:00 (Bogotá).
- **Estado: PLAN, NO EJECUTADO.** Este archivo solo documenta. No se tocó ninguna tienda, theme, DNS, Vercel, Wompi, Neon ni el sitio en producción. No se hizo ningún GET nuevo a `https://radaelliswimwear.com`: la evidencia guardada en `launch/evidence/` alcanzó.
- **Origen:** Development Store `radaelli-swimwear-dev.myshopify.com` (theme Radaelli RC1.8 sin publicar, id `189072474431`; Horizon `189072113983` es el theme live y no se toca) → tienda comercial (aún no existe).
- **Raíz de trabajo:** `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration`. Todas las rutas de este documento son relativas a esa raíz.
- **Verificación del documento:** `node launch/tools/03g-check-migration-plan.mjs` (offline y de solo lectura: lee este archivo y los artefactos y documentos hermanos que cita, y comprueba estructura, rutas, huellas SHA-256, conteos, IDs cruzados, coherencia de dependencias y ausencia de datos personales).
- **Documentos hermanos de 03G, leídos completos (todos de hoy):** `launch/03G-cutover-runbook.md` (el corte, acciones `CT-##`), `launch/03G-rollback-plan.md` (pasos `RP-##`), `launch/03G-post-launch-monitoring.md` (monitoreo tras el corte, áreas `MO-##`), `launch/03G-reproducibility-gap-audit.md` (brechas `A##`, `B##`, `C##`, `G##`), `launch/03G-current-site-baseline.md` (`B-##`), `launch/03G-route-parity.md`, `launch/03G-product-parity.md`, `launch/03G-collection-parity.md` (`C-##`), `theme/03G-home-parity.md` (`HP-##`) y `launch/03G-responsive-sweep.md`. Este plan **no los repite**: los cita por su ID. Como cada documento numera sus hallazgos por separado, las citas llevan siempre el archivo (por ejemplo, "F-01 de `launch/03G-product-parity.md`"). Esos documentos se siguieron corrigiendo después del primer borrador de este plan; el plan se reconcilió con sus versiones vigentes (miga F-02 re-medida, conteos de rutas y de la Home, D-CT18 y D-CT19, DIF-08 a DIF-12 del corte, RP-43 y D-16 del rollback). `launch/03G-launch-acceptance-checklist.md` y `theme/03G-launch-rehearsal-report.md` los nombran otros documentos y no existían a las 18:00 (NOT_AVAILABLE).

## 0. Cómo leer este documento

### 0.1 Etiquetas de evidencia

| Etiqueta | Significa |
|---|---|
| `[MEDIDO-03G]` | Medido o capturado hoy (2026-09-29) en la Dev Store o en el sitio actual; sale de `launch/03G-dev-store-snapshot.json`, `launch/03G-checkout-precondition-audit.md` o `launch/evidence/` |
| `[DOC:<archivo>]` | Afirmación tomada de un documento del repo. La ruta va relativa a la raíz de trabajo |
| `[INFERIDO]` | Razonado a partir de las fuentes; se dice el razonamiento |
| `[PRÁCTICA-GENERAL]` | Práctica técnica genérica, sin cifras específicas de la marca |
| `[NOT_VERIFIED]` | No se pudo comprobar con una fuente permitida; se indica la prueba que lo resuelve |
| `NOT_AVAILABLE` | El dato no existe en las fuentes; lo entrega la dueña o no existe |
| `(D#)` | Decisión pendiente de la dueña (tabla del § 4) |

### 0.2 Convenciones de cada paso

- **Quién.** "Dueña" hace lo que exige su identidad: cuentas, plan y facturación, consentimientos OAuth, llaves de Wompi, códigos de ingreso, tarjetas de prueba, publicación y cualquier decisión. "Claude" hace lo demás y **solo con OK explícito por acción**; Claude no crea cuentas, no acepta OAuth ni facturación y no escribe llaves, códigos ni datos de pago [DOC:theme/03F-owner-actions-minimal.md; payments/03F-wompi-owner-runbook.md].
- **Reversibilidad.** Reversible, reversible con trabajo, o **irreversible** (en negrita, con la razón).
- **Evidencia de éxito.** Un comando o una pantalla concreta, con el conteo esperado. Nada se marca "PASS" sin evidencia.
- **Sesión de prueba.** Toda prueba de storefront y checkout se hace con el país de la sesión en **CO** (`Shopify.country = "CO"`), nunca con la sesión en EE. UU. [DOC:launch/03G-checkout-precondition-audit.md § 1; theme/03E-commercial-readiness-report.md § A].
- **Comandos.** Los de los runbooks 03F se citan por archivo y sección; solo se copian aquí los que definen el paso. Donde el handle de la tienda comercial es necesario, se escribe `<tienda-comercial>` (**NOT_AVAILABLE** hasta S01).
- **Nombres que se parecen (no confundir).** `S01` a `S17` son los pasos canónicos; los runbooks 03F usan `S0` a `S13` (envío), `S1` a `S12` (Search & Discovery), `M0` a `M10`, `P0` a `P10` y `P-1` a `P-26`, y se citan siempre con el nombre del runbook. **`G1` a `G8`** son los puntos GO/NO-GO del corte; el **control de disponibilidad para Colombia** de este plan también se llama G1 (así lo nombran los runbooks de mercado y envío: § 3.2), y las compuertas del runbook de Wompi son **`W-G1`, `W-G2` y `W-G3`** (así las renombra el runbook de corte). `D1` a `D20` son las decisiones de este plan (§ 4); la sección D de `theme/03F-owner-actions-minimal.md` (D1 a D5) y las `D-CT##`, `DR-##` y `D-MO#` de los otros documentos 03G son otras listas, cruzadas en el § 4.1.

### 0.3 Los 17 pasos canónicos

| ID | Paso | ID | Paso |
|---|---|---|---|
| S01 | Crear la tienda comercial (plan, cuenta, país/moneda base) | S10 | Envíos (tarifas, decisión D2) |
| S02 | Base: país/moneda/idioma predeterminado español/zona de envío/mercado | S11 | Wompi (pagos) |
| S03 | Theme (subir RC1.8 sin publicar) | S12 | Analítica |
| S04 | Catálogo (import CSV 29/98/95) | S13 | Cuentas de cliente |
| S05 | Colecciones, metafields y metaobjetos | S14 | E2E en la tienda comercial (pedidos de prueba) |
| S06 | Menús, páginas y redirecciones | S15 | Dominio (DNS/SSL) |
| S07 | Media (hero, categorías, banners, guía de tallas) | S16 | Publicar |
| S08 | Apps oficiales (Search & Discovery, Google & YouTube, Facebook & Instagram) | S17 | Post-lanzamiento |
| S09 | App de favoritos (wishlist) | | |

## 1. Resumen ejecutivo

1. **El plan replica lo ya validado en la Dev Store**, con los mismos artefactos y hashes, pero cambia el orden en cuatro lugares por lo aprendido allí (detalle en los § 3 y § 6):
   - **S05 se ejecuta en dos partes**: la parte A (definiciones de metafields y colecciones vacías) va **antes** de S04; la parte B va después. 03C creó las definiciones y las colecciones antes de importar el CSV [DOC:theme/03C-catalog-import-report.md].
   - **La zona de envío de Colombia se crea dentro de S02, antes de que Colombia sea el mercado principal**; de lo contrario los 29 productos figuran agotados para Colombia (medido 0/29 y `add.js` 422) [DOC:theme/03F-owner-market-colombia-runbook.md § 3.2 H1; MEDIDO-03G].
   - **S15 y S16 se ejecutan intercaladas en una sola ventana** (§ 7): el theme se publica al final y el DNS se cambia dentro de la misma ventana.
   - **La validación de analítica (parte de S12) ocurre con la tienda pública**, es decir en la ventana de S16 y en S17; con contraseña, GA4 no registra y la app de Meta no se puede terminar [DOC:analytics/03F-analytics-owner-runbook.md § 2].
2. **Camino crítico:** D6 y D1 → S01 → S02 → S05.A → S04 → S05.B → S06 → S10 → S11 → S14 → S15.a → ventana (S16.a → S15.b → S15.c → S16.b) → S17. S03, S07, S08, S12 (configuración) y S13 corren en paralelo cuando sus dependencias están listas; **S09 no bloquea el lanzamiento** (los favoritos de invitada funcionan sin la app) [DOC:theme/03F-owner-actions-minimal.md: A5 no figura en la lista B "antes del lanzamiento"].
3. **Decisiones que más bloquean:** D6 (plan y tipo de tienda), D1 (dirección de Colombia), D2 (tarifa bajo $299.900), D8 (pagos y ambientes de Wompi), D9 (legales e identidad) y D16 (dominio y corte). Sin D2 una compra de una prenda no tiene método de envío y no puede pagarse.
4. **Hallazgos de 03G que entran al plan** (§ 9):
   - El sitio actual hoy no lista la talla XL de `alba-dorada-cafe-claro` (97 variantes allí frente a 98 en Shopify); la causa no está demostrada.
   - Las colecciones tienen el mismo conjunto de productos pero **0 de 29 posiciones coinciden**, y eso cambia la Home.
   - El sitio actual publica stock por talla y Shopify no rastrea inventario.
   - Las migas de 4 fichas usaban "Destacados" (medido con RC1.7); RC1.8 lo corrige y se re-midió en vivo en esas 4 y en 6 fichas de control. Queda repetirlo en las 29 fichas de la tienda comercial (S14).
   - Cuatro páginas legales, el blog (4 URL) y `/accesorios` responden 200 hoy y no tienen destino.
   - "Radaelli Swimwear Dev" sale en título, logo y pie; el logo y el favicon no están en el plan de media.
   - Los cambios de theme que 03G deja pendientes (HP-02, HP-03, HP-07, HP-08, HP-09 y HP-22; y HP-11 y HP-23 si la dueña decide el título de la Home) producirán un release posterior a RC1.8, que esos documentos llaman RC1.9 (D-CT18 fija cuál se congela).
   - **`shopify-migration/` no está versionado en git** y las 95 imágenes dependen del Cloudinary vivo del sitio actual (§ 3.3).
5. **Riesgos abiertos de mayor peso:**
   - **Cobro sin pedido con Wompi** si la clienta no vuelve a la tienda (caso 5 de las pruebas; no existe cron equivalente al del sitio actual) [DOC:payments/03F-wompi-owner-runbook.md § 9].
   - **La app de favoritos 0.1.2 solo obtiene token de Admin si la tienda está en la misma organización de la app**; una tienda comercial creada fuera de esa organización es NO-GO hasta un cambio de código [DOC:app/README.md § 9.8, § 11.8].
   - **La Dev Store no se convierte a producción** si es del Dev Dashboard; su tipo exacto es `[NOT_VERIFIED]` [DOC:payments/03E-wompi-shopify-feasibility.md E25, E35].
6. **No se inventó ningún plan de Shopify, precio, KPI, TTL, proveedor de DNS, registro DNS, IP ni fecha.** Lo que falta figura como `NOT_AVAILABLE` o como decisión de la dueña.

## 2. Punto de partida

### 2.1 Estado medido de la Dev Store (2026-09-29) [MEDIDO-03G]

Fuente: `launch/03G-dev-store-snapshot.json` y `launch/03G-checkout-precondition-audit.md`.

| Área | Estado hoy |
|---|---|
| Themes | Horizon `189072113983` live, sin tocar. Radaelli RC1.8 `189072474431` sin publicar: ZIP SHA-256 `e893b386…9e67`, 96 archivos, remoto = ZIP 96/96, Theme Check 0 errores / 0 warnings (60 archivos) |
| Tienda | Protegida con contraseña. Nombre visible "Radaelli Swimwear Dev" (sale en título, `og:site_name` y logo de texto) |
| Idiomas | Admin: Inglés predeterminado. Español publicado ("Sin traducciones"). El storefront sirve `/` = es y `/en` = en; hreflang `x-default /`, `es /`, `en /en`. Translate & Adapt instalada |
| Moneda | COP; formato `$ {{amount_no_decimals_with_comma_separator}}` |
| Mercados | Colombia (Activo) y Estados Unidos (Activo); el principal sigue siendo EE. UU.; región de respaldo Colombia; dirección de la tienda y entidad en EE. UU.; checkout en `es-us` |
| Envío | 1 perfil general, 1 sucursal, 1 zona (Estados Unidos). **No existe zona de Colombia.** Tarifa bajo $299.900: NOT_SET (D2). Sin entrega local ni recogida; sin transportadoras |
| Pagos | Ningún proveedor activo; Shopify Payments no configurado; Wompi no instalado; el checkout dice "Esta tienda no puede aceptar pagos en este momento" |
| Cuentas | Cuentas de cliente nuevas (alojadas por Shopify); enlaces de ingreso ON; código de ingreso: `DEFERRED_OWNER_ONLY_BLOCKER` |
| Catálogo | 29 productos, 98 variantes, 95 imágenes, 29 publicados. Tipos: Aurora Viva 12, Oasis Natural 10, Espuma de Ola 7. Opción "Talla". Inventario **no rastreado**. Único tag: `MOSTAZA` (`entero-golden-hour`) |
| Colecciones | `oasis-natural` 10, `aurora-viva` 12, `espuma-de-ola` 7, `salidas-de-bano` 0, `destacados` 7, `frontpage` ("Home page", automática) 0. Ninguna con imagen de banner |
| Menús | `main-menu` (Inicio + 4 colecciones), `comprar` (4 colecciones), `ayuda` (Devoluciones, Garantía), `Footer menu` de Shopify (sin uso), `Customer account main menu` (Orders, Profile) |
| Páginas | `garantia` (verbatim), `favoritos` (`noindex` por handle; plantilla `page.wishlist` sin asignar), `contact` y `data-sharing-opt-out` (por defecto de Shopify, en inglés) |
| Políticas | `/policies/refund-policy` 200 (verbatim); `/policies/privacy-policy` 200 (**autogenerada por Shopify**, no es el texto del sitio actual); términos, envíos y contacto 404 |
| Redirecciones | 47 importadas (`seo/shopify-redirects-import.csv`); 38 destinos exactos verificados en 200 |
| Apps | Solo Translate & Adapt. Sin instalar: Search & Discovery, Wompi, App de favoritos, Google & YouTube, Facebook & Instagram. `/apps/wishlist` responde 404 (el proxy de la app es `/apps/radaelli/wishlist`: el snapshot midió otra ruta) [DOC:launch/03G-rollback-plan.md § 15 D-02; app/shopify.app.toml] |
| Definiciones | Producto: Color (texto de una línea, 29 productos), Guía de tallas (referencia a metaobjeto, 0 productos). Colección: Description tone (4 colecciones), Cover image, Cover video, Zoom, Image pos x, Image pos y (0 colecciones). Metaobjeto `size_guide`: 0 entradas |
| Archivos | Solo imágenes de productos; sin hero, banners, categorías ni guía de tallas |
| Búsqueda | Índice 29/29; "bikini" = 20 resultados, "mostaza" = 1; filtros nativos: Precio (Disponibilidad oculta) |
| Flags del theme | `free_shipping_rate_confirmed` false; `cart_free_shipping_progress` false; `wishlist_enabled` true; `wishlist_account_sync` false; píxel personalizado apagado (`ENABLED:false`, IDs vacíos) |
| Modo de falla del checkout | Con país US: `add.js` 200, checkout `es-us`. Con país CO: 3 variantes de `marea-natural` `available:false`, `add.js` 422 "ya está agotado" |

**Advertencia de versión.** Las capturas `launch/evidence/dev-*.json(l)` declaran RC1.7 (se guardaron a las 17:31 y el ZIP RC1.8 se construyó a las 17:34); RC1.7 y RC1.8 difieren solo en `sections/main-product.liquid`, y la única medición ya repetida con RC1.8 es la miga de las fichas (`dev-products.jsonl` guarda la de RC1.8 en `crumbs` y la vieja en `crumbsRC17`). El campo `remoteEqualsZip` del snapshot es texto transcrito a mano; que el remoto sea RC1.8 no se re-midió por otra vía [DOC:launch/03G-reproducibility-gap-audit.md § 2; launch/03G-product-parity.md F-02].

**No medido en 03G** [NOT_VERIFIED]: ajustes de pantalla de pago (`settings/checkout`), formas de pago manuales, impuestos, dominios y eventos del cliente; LCP, FCP y CLS; checkout a 390 px; total de archivos en Contenido > Archivos [DOC:launch/03G-dev-store-snapshot.json `_meta.limits`].

### 2.2 Qué viaja con el theme y qué no

El ZIP RC1.8 lleva código, plantillas y valores por defecto. **Todo lo demás es configuración de la tienda y hay que recrearlo.** 03A y 03B lo descubrieron por partes: el idioma, la moneda, los menús y las páginas nacían distintos en la tienda y el theme no los traía [DOC:theme/03A-development-store-upload-report.md § 40; theme/03B-store-foundation-report.md].

| Elemento | ¿Viaja en el ZIP RC1.8? | Cómo se recrea en la tienda comercial | Paso |
|---|---|---|---|
| 96 archivos del theme (`assets`, `config`, `layout`, `locales`, `sections`, `snippets`, `templates`) | Sí | Subir el ZIP o `theme push` sin publicar | S03 |
| Flags de `config/settings_data.json` | Sí, con los valores por defecto (los de arriba) | Se cambian solo en su paso y con `theme pull` previo | S09, S10, S12 |
| Referencias por handle a colecciones en `templates/index.json` | Sí (`oasis-natural`, `aurora-viva`, `espuma-de-ola`, `salidas-de-bano`, `destacados`) | Las colecciones deben existir con esos handles | S05 |
| Referencias a media (`hero_video`, `image` y `video` de tarjetas, `size_guide_image`) | No (vacías) | Se generan al subir los archivos | S07 |
| Formato de dinero, idiomas publicados, dirección, zona horaria | No (ajustes de tienda) | Configuración > General e Idiomas | S02 |
| Definiciones de metafields y metaobjetos | No | Configuración > Metacampos y metaobjetos | S05.A |
| Productos, variantes, imágenes, tag `MOSTAZA` | No | CSV + reimportación de imágenes | S04 |
| Colecciones y Destacados | No | Manuales | S05 |
| Menús, páginas, políticas, redirecciones | No | Contenido, Configuración > Políticas | S06 |
| Envío, mercados, pagos, checkout, impuestos | No | Configuración | S02, S10, S11 |
| Cuentas de cliente | No | Configuración > Cuentas de cliente | S13 |
| Analítica (banner de cookies, píxeles) | No | Configuración > Privacidad del cliente, Eventos del cliente | S12 |
| Contraseña de la tienda | No (el theme trae `layout/password.liquid` y `templates/password.json`) | Ajuste de la Tienda online | S16 |
| Asignación de `page.wishlist` a la página Favoritos | No | Solo se puede asignar con el theme publicado | S16 |
| Dominio y DNS | No | Configuración > Dominios y proveedor de DNS | S15 |

## 3. Orden de ejecución y dependencias

### 3.1 Orden real frente a la numeración canónica

La numeración S01 a S17 es la del plan y se usa en todos los documentos. **El orden de ejecución difiere en cuatro puntos**, todos por lecciones de la Dev Store (§ 6):

| Orden real | Paso | Por qué está aquí |
|---|---|---|
| 1 | S01 | Nada existe sin tienda. Se fijan país, moneda e idioma desde el primer día (L2, L3) |
| 2 | S02 | Base de la tienda. **La zona de envío de Colombia va antes de convertir a Colombia en mercado principal** (L1) |
| 3 | S03 | El theme sube sin publicar (L6). Conviene después de S02 para que el idioma predeterminado ya sea español |
| 4 | **S05.A** | Definiciones de metafields y colecciones vacías **antes** del CSV (L10) |
| 5 | S04 | CSV en dos pasadas, "toque" de indexación y control G1 de disponibilidad con país CO (L8, L9) |
| 6 | **S05.B** | Destacados, `description_tone`, orden de colecciones |
| 7 | S06 | Menús, páginas, políticas y redirecciones |
| 8 | S07, S08, S13 | En paralelo entre sí, después de sus dependencias |
| 9 | S10 | Tarifas definitivas (D2), QA T0..T12 y, al final, el cerrojo `free_shipping_rate_confirmed` |
| 10 | S11 | Pagos en modo prueba |
| 11 | S12 (configuración) | Banner de cookies con Colombia y cuentas; **sin** validar eventos todavía (tienda privada) |
| 12 | S09 | Opcional; no bloquea el lanzamiento |
| 13 | S14 | E2E con pedidos de prueba |
| 14 | S15.a | Preparación de dominio (reversible) |
| 15 | **Ventana:** S16.a → S15.b → S15.c → S16.b | Publicar, cambiar el DNS y verificar en una sola ventana (§ 7) |
| 16 | S17 | Post-lanzamiento; aquí se cierra la validación de S12 |

### 3.2 Tabla de dependencias

"Duro" = el paso no puede empezar o no puede probarse sin eso. "Blando" = conviene por lo aprendido en Dev, pero se puede adelantar con un costo que se dice en el paso.

| Paso | Depende de (duro) | Depende de (blando) | Decisiones que lo bloquean | Desbloquea |
|---|---|---|---|---|
| S01 | Ninguno (más PT1 y PT2 del § 3.3) | Ninguno | D1, D6, D7 (idioma), D11 (número inicial de pedidos) | S02, S03 |
| S02 | S01 | Ninguno | D1, D2 (o modo parcial), D4, D7, D9 (impuestos) | S03, S04, S10, S11 |
| S03 | S01 | S02 (idioma predeterminado) | D7 | S06, S07, S09, S13, S14 |
| S05.A | S01, S02 | Ninguno | D12 | S04 |
| S04 | S02, S05.A | S03 | D12 | S05.B, S06, S07, S08, S10, S14 |
| S05.B | S04 | Ninguno | D12 (c), D20 | S06, S07, S08 |
| S06 | S03, S04, S05.B | S02 | D2 y D5 (texto de Envíos), D9, D12 (g), D15, D17 | S10 (página Envíos), S12 (textos), S15 (redirecciones) |
| S07 | S03, S05 (A y B) | S04 (probar la guía de tallas) | D13 | S14, S16 |
| S08 | S04 (índice 29/29), S05 (`custom.color`) | S03, S06 | D10, D12 (d, e, f) | S12, S14 |
| S09 | S03, S13 | S06, S10 (el cerrojo de envío se aplica antes: orden de los JSON) | D14 | S16 (opcional) |
| S10 | S02, S04 | S03, S06 (página Envíos) | D1, D2, D3, D5 | S11, S14, S16 (cerrojo) |
| S11 | S02 (dirección de Colombia), S10 | S04 | D1, D6, D8, D9 (párrafo "Pago") | S12 (purchase), S14, S16 |
| S12 | S02 (región del banner), S06 (textos legales) | S08, S11 | D8 (purchase), D9, D10 | S16 (P-6 y P-7 son duros; la validación es S16.b), S17 |
| S13 | S03 | S04 (GO/NO-GO #1 b), S06 (redirecciones `/cuenta*`) | D1, D11 | S09, S14 |
| S14 | S03, S04, S05, S06, S10, S11, S13 | S07, S08, S09, S12 | D2, D8, D11, D19 | S15.a |
| S15 | S06 (redirecciones), S14; para S15.b y S15.c también S16.a | S12 (banner) | D15, D16, D17 | S16.b |
| S16 | S14, S15.a, S12 (solo P-6 y P-7: textos de cookies y privacidad, y banner); para S16.b también S15.b | S09, S12 (resto) | D2 (cerrojo), D5, D7 (hreflang), D8, D9, D16, D17, D19 | S17 |
| S17 | S16 | Ninguno | D11, D18 | Ninguno |

**Sin ciclos.** Las dependencias blandas nunca se cierran en círculo (S06 y S10 comparten la página de Envíos, pero S06 solo la copia y S10 ajusta su texto según D2 y D5). A nivel de sub-paso el orden es: S15.a → S16.a → S15.b → S15.c → S16.b (§ 7).

**Controles compartidos (no son pasos):**

- **G1 (disponibilidad para Colombia):** con la sesión en CO, `/products.json` debe mostrar 29/29 productos y 98/98 variantes con `available:true`, y `POST /cart/add.js` debe responder 200. Se corre al terminar S04 (con el catálogo cargado) y se repite en S10. Definición: V4 y V5 de `theme/03F-owner-market-colombia-runbook.md` § 8 [DOC].
- **`theme pull` antes de cualquier push de JSON:** hay tres escritores del theme (Editor, CLI y scripts de cableado). Cada cambio hecho en el Editor (S07, S09, S10) se trae a una carpeta temporal antes de empujar de nuevo [DOC:theme/03D-free-shipping-audit.md § 4.3; theme/03F-owner-wishlist-install-runbook.md § 3, paso 8].

### 3.3 Precondiciones transversales (no son pasos)

Cada una se cierra antes del paso que dice la columna "Cierra antes de"; solo PT1 y PT2 protegen algo que hoy existe en una sola copia, así que van antes de S01.

| # | Precondición | Evidencia | Quién | Cierra antes de |
|---|---|---|---|---|
| PT1 | **Versionar y respaldar `shopify-migration/`.** Hoy es una carpeta local sin versionar (`?? shopify-migration/`), los ZIP de `dist/` no se commitean y el arnés de regresión del theme vive en un scratchpad efímero. Propuesta de la auditoría: commit en una rama dedicada (sin `scripts/node_modules`, con `dist/`) y copia fuera de esta máquina | [DOC:launch/03G-reproducibility-gap-audit.md A18, A19, G03]; [DOC:theme-src/README.md] | Claude con OK de la dueña | S01 |
| PT2 | **No apagar Cloudinary del sitio actual.** Las 95 imágenes del CSV y 13 de los 14 medios viven en `res.cloudinary.com` y el repo tiene 0 archivos de imagen o video; la importación de S04 y la descarga de S07 dependen de que siga vivo. La auditoría propone un manifiesto de respaldo con SHA-256 (108 filas: 95 imágenes y 13 medios). **Advertencia (G21 de la misma auditoría):** la única copia local posible de los originales (una carpeta de fotos en OneDrive) está mezclada con archivos cuyo nombre indica códigos de recuperación de cuentas; si se respalda, se copian **solo las subcarpetas de producto, nunca la carpeta entera**, y la dueña mueve esos archivos a un gestor de credenciales (un secreto ya copiado a un repo o respaldo compartido obliga a rotarlo `[PRÁCTICA-GENERAL]`) | [DOC:launch/03G-reproducibility-gap-audit.md A04, G04, G21] | Dueña (OK y los archivos de códigos); Claude (copia selectiva, con OK) | S01 |
| PT3 | **Copiar antes de re-correr las herramientas de 03G.** `03g-crawl-current-site.mjs` y `03g-product-parity.mjs` escriben siempre en rutas fijas (`launch/evidence/current-site/`, `launch/03G-product-parity.csv` y `.json`) y **sobrescriben la línea base de hoy**. Además, el rastreo lleva escrita la ruta absoluta de este worktree y resuelve su carpeta de una forma que solo funciona en Windows (G18): desde otro clon o carpeta hay que corregirlo antes, con OK | [DOC:launch/03G-cutover-runbook.md § 5.1; launch/03G-reproducibility-gap-audit.md G18] | Claude | S04 (pre-vuelo) y S16.a punto 1 |
| PT4 | **Regresión del theme.** El arnés offline con `liquidjs` no está en el repo: la suite (70/70 con RC1.7 y 74/74 con RC1.8) y los mutantes (49 y 50, y 51 con RC1.8) no se pueden volver a correr. Antes de cualquier release nuevo hay que reconstruir una suite mínima | [DOC:launch/03G-reproducibility-gap-audit.md A19, G15; launch/03G-product-parity.md F-02] | Claude | Primer release nuevo (S07 punto 10, S10 punto 8 o D20) |
| PT5 | **Decidir qué significa "apagar el sitio actual".** 03E y 03F dicen "apagar el sitio Next.js"; la auditoría de viabilidad dice conservarlo varias semanas. Este plan y el runbook de corte lo leen como **dejar de recibir ventas**, no dar de baja la infraestructura; la dueña lo confirma en D16 y D18 | [DOC:launch/03G-cutover-runbook.md § 3 DIF-01; launch/03G-rollback-plan.md § 15 D-03] | Dueña (D16, D18) | S15 (D16) y S17 (D18) |

## 4. Decisiones pendientes de la dueña (D1 a D20)

Los números D1 a D5 conservan el significado del runbook de envío 03F [DOC:shipping/03F-owner-shipping-runbook.md § 3]. D2 es **la tarifa bajo $299.900**. Las decisiones legales (D-L1 a D-L7), las de Search & Discovery (D1 a D3 de su runbook) y las de Wompi (W-G1 a W-G3, que son G1 a G3 del runbook de Wompi) se agrupan aquí bajo un ID propio y conservan su ID de origen entre paréntesis.

| ID | Decisión | Estado | Bloquea | Si no se decide |
|---|---|---|---|---|
| **D1** | Dirección real de despacho y de la tienda, en Colombia (origen: D1 del runbook de envío y del de mercado) | NOT_AVAILABLE | S01, S02, S10, S11, S13 | La tienda nace con la dirección equivocada: checkout `es-us`, proveedores de pago filtrados por esa dirección, login de cuentas con región EE. UU. [DOC:theme/03F-owner-market-colombia-runbook.md § 9; MEDIDO-03G] |
| **D2** | Qué cobra Shopify por debajo de $299.900: (a) tarifa fija propia, (b) costo 0 con nombre honesto de "por coordinar", (c) envío gratis para todos. No existe un valor real en ninguna fuente; el sitio actual nunca cobra envío y lo coordina a mano | NOT_SET | S02 (modo parcial si falta), S10, S14 (T1, T2, T10), S16 (cerrojo), página de Envíos (S06) | Una compra de 1 prenda (precios 159.920, 167.920, 183.920, 199.920) queda sin método de envío y no puede pagarse. No es lanzable [DOC:shipping/03F-owner-shipping-runbook.md § 7.1] |
| **D3** | Envío Express (24 a 48 h, solo ciudades principales): precio y lista de ciudades | NOT_SET | Solo la creación de la tarifa Express | No se crea Express. `content/legal/envios.html` lo menciona: requiere D5 |
| **D4** | ¿Se vende fuera de Colombia y se ofrece precio en USD? En la tienda comercial no hay por qué crear un mercado ni una zona de EE. UU.; el sitio actual vende solo "dentro de Colombia" pero **tiene un selector COP/USD** en la cabecera que el theme no replica (route-parity F-12, HP-10). Shopify: las monedas locales exigen Shopify Payments o Adyen, que no existen aquí | Pendiente | S02 (mercados) | Si Shopify crea una zona o mercado por defecto, queda con tarifas de fábrica y monedas no verificadas [DOC:shipping/03E-shipping-source-of-truth.md § 5.1 D4]; sin decisión, el selector de USD se pierde [DOC:theme/03F-owner-market-colombia-runbook.md § 11] |
| **D5** | Textos que dependen de D2: `threshold_note` de la ficha, `content/legal/envios.html`, promesa de envío gratis del banner, la ficha y la barra del carrito | Pendiente | S10 (cerrojo), S06 (página Envíos), S16 | Se enciende una promesa que el checkout no cumple |
| **D6** | Tienda comercial: nueva o transferir/convertir la Dev Store; plan de Shopify y facturación (mensual o anual); cuentas de staff necesarias; nombre de la tienda (hoy "Radaelli Swimwear Dev": HP-01 es BLOCKER) | NOT_AVAILABLE | S01 y todo lo demás | No hay tienda. Insumos en S01 |
| **D7** | Idioma: confirmar **español como idioma predeterminado desde el día 1**; mantener o no el inglés en `/en` (exige Translate & Adapt; el sitio actual **no tiene** versión en inglés y `/en` publica URLs en inglés con textos de contenido en español: HP-12); tono de los textos, voseo o tuteo (C3 de 03F; la mezcla ya está en la Home actual: HP-15) | Pendiente | S01, S02 (idiomas), S03, S16 (hreflang) | Se hereda el inglés predeterminado de la Dev Store [DOC:theme/03B-store-foundation-report.md Resumen 3] |
| **D8** | Pagos: proveedor final (Wompi por redirección, Wompi Tarjetas u otro); qué pasa con "Continuar por WhatsApp" del checkout actual (en Shopify solo se replica como método de pago manual: `payments/03E-wompi-shopify-feasibility.md` § 4); si se puede conectar Wompi solo en modo prueba (W-G2); ambientes de Wompi frente al staging del pentest y al sitio en vivo (W-G3: A secuenciar, B segundo comercio, C cambio temporal); teléfono obligatorio en el checkout; prueba E2E con la pasarela de prueba de Shopify (que exista en una tienda de pago es `[NOT_VERIFIED]`) o con Wompi en prueba; producto y monto de la compra real de bajo monto (CT-47, propuesta `[INFERIDO]`: el de menor precio) y cómo se reembolsa | Pendiente | S11, S14, S16, S12 (`purchase`) | No hay pago posible; el checkout dice "no puede aceptar pagos" |
| **D9** | Legales e identidad del negocio: destino de Términos y Envíos (páginas o política nativa), qué hacer con la privacidad autogenerada, visibilidad de las páginas, proveedor final, D2, analítica final, identidad (D-L1 a D-L7); razón social, NIT, dirección, correo y teléfono públicos; impuestos (IVA) con su asesor | NOT_AVAILABLE | S06, S12 (puertas G-COOK y G-PRIV), S11 (párrafo "Pago"), S16 | Las 4 páginas legales no se publican; las 4 URL legales del sitio actual darían 404 al mover el DNS [DOC:seo/03E-redirect-plan.md § 4.3] |
| **D10** | Analítica: arquitectura A (apps oficiales + píxel de huecos) o B (solo píxel propio); nivel de datos de Meta (Standard, Enhanced o Maximum); cuentas e IDs de GA4 y Meta; si Colombia es país soportado para el canal de Meta; puente del theme (`Shopify.analytics.publish`); tráfico interno | Pendiente | S12, S08 (Google & YouTube y Facebook & Instagram) | La analítica queda apagada. Nunca se enciende sin banner con Colombia ni texto de cookies actualizado |
| **D11** | Datos de clientas y pedidos: migrar clientes por CSV o empezar de cero; cómo se comunica el cambio de acceso (Shopify usa código por correo, no contraseña); historial de pedidos (herramienta o no); **numeración de pedidos** (número inicial); pedidos `flaggedForReviewAt` sin resolver; suscriptores del boletín (viven en la tabla `NewsletterSubscriber`; cantidad y consentimiento NOT_AVAILABLE); favoritos de cuenta guardados; solicitudes de "Avísame cuando vuelva" | NOT_AVAILABLE | S13, S14 (los pedidos de prueba consumen números), S17 | Los pedidos de prueba avanzan el contador antes de decidirlo [DOC:launch/evidence/reference-docs/data-migration.md; launch/03G-reproducibility-gap-audit.md C01 a C07, C11, G01] |
| **D12** | Catálogo: (a) **XL de `alba-dorada-cafe-claro`** (F-01 de `launch/03G-product-parity.md`); (b) **inventario**: rastrear o no, y cantidades iniciales (F-04 del mismo documento); (c) orden de las colecciones y de Destacados frente al sitio actual (F-03; C-02 de `launch/03G-collection-parity.md`); (d) valor "L y XL" (origen D1 del runbook S&D); (e) mayúsculas de los colores (origen D2 S&D); (f) `bikini-shadow-azul-marino` y `enterizo-shadow-palm-azul-marino` con color NEGRO (origen D3 S&D, N-2); (g) qué pasa con `/accesorios` (404 hasta decidir con Search Console); (h) las 4 imágenes heredadas de baja resolución (F-05) | Pendiente | S04, S05, S08, S06 | Se importa la fuente tal cual: 98 variantes, inventario no rastreado, colores en mayúsculas, orden de importación invertido |
| **D13** | Media: OK explícito de descarga (12 archivos únicos: ≈15,6 MB por red con los videos servidos H.264; la acción A4 de `theme/03F-owner-actions-minimal.md` dice ≈20,7 MB, que es lo que imprime el modo en seco del script con los videos originales y sin contar la entrega transformada de M13), variante de video (servida H.264 o original HEVC, `[NOT_VERIFIED]`), M07 opcional, logo y favicon como imagen o texto (D-CT18) | Pendiente | S07 | Hero, tarjetas, banners y guía de tallas quedan con su respaldo (sin media) |
| **D14** | App de favoritos: antes o después del lanzamiento; organización del Dev Dashboard; hosting del backend; app de producción separada; plan que admita extensiones de cuenta | Pendiente | S09 | Los favoritos funcionan solo por navegador (modo invitada) |
| **D15** | Blog: migrar los 3 posts y el índice `/blog`, o dejarlos en 404. Los textos hablan de lana, lino, cuero y abrigo y parecen contenido de plantilla `[INFERIDO]` (baseline B-09); Shopify trae un blog por defecto `/blogs/news` en inglés e indexable | Pendiente | S06 (redirecciones y blog), S15 | Los 4 URL del blog dan 404 al mover el DNS; están en el sitemap actual; queda `/blogs/news` en inglés [DOC:launch/03G-route-parity.md F-03, F-10] |
| **D16** | Dominio y corte: proveedor de DNS (NOT_AVAILABLE), dominio primario apex o `www`, fecha y hora de T0 y ventana de decisión (D-CT1), pausa de ventas del sitio actual (D-CT2), quién ejecuta el cambio de DNS y cuándo; quién autoriza un rollback y con qué umbrales y método de contención (DR-01, DR-02, DR-05: las fuentes no traen KPIs y este plan no los inventa); qué hacer con los 301 cacheados si hay rollback total (DR-09) | NOT_AVAILABLE | S15, S16 | No hay lanzamiento |
| **D17** | SEO y visibilidad: regla por defecto de `robots.txt` sobre `/policies/` (aceptarla, quitarla con `templates/robots.txt.liquid` o usar páginas); limpiar `/pages/contact`, `/pages/data-sharing-opt-out`, `/blogs/news`, `/collections/frontpage` y `/collections/all` (que hoy salen indexables); título y meta description de la Home (el sitio actual ya tiene título "Trajes de baño de diseño en Colombia" y una descripción de 109 caracteres: la dueña confirma o cambia; C1); si la Home lleva el sufijo de marca que `layout/theme.liquid` agrega al `<title>` (HP-23: saldría "… – Radaelli Swimwear" frente al título actual sin sufijo); imagen social; `theme_documentation_url` que apunta al repositorio de GitHub (N-01) | Pendiente | S06, S15, S16 (calidad, no bloqueo duro) | El sitemap sale con páginas en inglés y colecciones vacías; la Home con título "Dev" y sin descripción [DOC:seo/03F-seo-final-validation.md § 2; theme/03G-home-parity.md HP-01, HP-11] |
| **D18** | Retiro del sitio actual: cuánto tiempo se mantiene intacto Vercel, Neon y su Wompi y con qué criterios se apaga ("varias semanas de operación estable" según la auditoría; el número lo fija la dueña) | Pendiente | S17 | No se desmantela nada |
| **D19** | Cupones y promociones: qué cupones activos se migran (lista NOT_AVAILABLE) y cómo se combinan; el −20 % ya está dentro del precio (Price = 80 % de Compare-at), no es un descuento de Shopify, y "20% de descuento en toda la tienda / Por tiempo limitado" no tiene fecha de fin en ningún lado (B-14); un descuento del 20 % creado encima duplicaría el descuento | Pendiente | S14 (pruebas de descuento), S16 | Solo existen los cupones de prueba de S10; al terminar la campaña hay que editar 98 variantes y el anuncio [DOC:launch/03G-reproducibility-gap-audit.md C04, G11] |
| **D20** | Editorial sin bloqueo: colección de "Recomendado para vos" (o dejar la sección oculta); color de los botones blancos sobre arena (contraste 1,69:1); boletín y correo de marketing (Resend u otro); aviso "Avísame cuando vuelva"; los cambios de theme de 03G que no son decisión de la dueña pero producen un release nuevo: CTA a `#productos` (HP-03), insignia y "Ver producto" de la editorial (HP-07), texto del botón del boletín (HP-08), `brand_name` y descripción del pie (HP-09), texto de usuario y número en el desplegable "Contacto" del pie (HP-22); columna "Empresa" del pie (3 marcadores); contador "N vistas" del sitio actual (6 × las vistas registradas: no se migra, confirmar); "Salidas de Baño" enlazada aunque esté vacía | Pendiente | Nada duro | La Home queda con la sección oculta; sin aviso de reposición; los CTA apuntan a categorías |

### 4.1 Cruce con las decisiones de los otros documentos de 03G

Cada documento de 03G numera sus decisiones por separado. Esta tabla las cruza para que ninguna se decida dos veces ni se olvide. **Ojo:** la sección D de `theme/03F-owner-actions-minimal.md` (D1 a D5) es otra lista con los mismos números: su D1 (talla XL) y su D2 (inventario) son las partes (a) y (b) de la D12 de este plan; su D3 (datos de clientas, cupones, newsletter y blog) son la D11, la D19 y la D15; su D4 (dominio, plan y corte) reúne la D6 y la D16; y su D5 (respaldo del trabajo) es PT1 y PT2. Este plan conserva los D1 a D5 del runbook de envío (D2 = tarifa bajo $299.900).

| Este plan | `launch/03G-cutover-runbook.md` § 4 | `launch/03G-rollback-plan.md` § 4 | Otros orígenes |
|---|---|---|---|
| D1 | (P1 de `launch/03G-checkout-precondition-audit.md`) | — | D1 de los runbooks de mercado y envío de 03F |
| D2, D3, D5 | D2 | — | D2, D3, D5 del runbook de envío |
| D4 | — | — | D4 del runbook de envío; F-12 de `launch/03G-route-parity.md`; HP-10 |
| D6 | D-CT5; D-CT18 (nombre de la tienda) | DR-11 | E25, E35 de `payments/03E-wompi-shopify-feasibility.md`; HP-01 |
| D7 | D-CT19 (inglés) | — | HP-12, HP-15; C3 y C8 de 03F |
| D8 | D-CT14 (compra real con reembolso) | DR-10 | W-G1, W-G2 y W-G3 (G1 a G3 del runbook de Wompi); B25 de `launch/03G-reproducibility-gap-audit.md` |
| D9 | D-CT7 | — | D-L1 a D-L7 del runbook legal |
| D10 | D-CT9 | — | G-ARQ, G-PUENTE del runbook de analítica |
| D11 | D-CT11 (comunicación a clientas), D-CT12 | DR-06 | C01 a C07, C11 de `launch/03G-reproducibility-gap-audit.md` |
| D12 | D-CT8 (XL, inventario) | DR-07 | F-01, F-03, F-04 de `launch/03G-product-parity.md`; C-02 de `launch/03G-collection-parity.md`; D-MO1 de `launch/03G-post-launch-monitoring.md` |
| D13 | D-CT18 (logo y favicon) | — | A4 de `theme/03F-owner-actions-minimal.md`; HP-02 |
| D14 | D-CT10 | — | P1 a P4 del runbook de favoritos |
| D15 | D-CT6 | — | F-03 de `launch/03G-route-parity.md`; B-09 |
| D16 | D-CT1, D-CT2, D-CT3, D-CT4, D-CT15, D-CT16 | DR-01 a DR-05, DR-09 | G-TIENDA del runbook de analítica |
| D17 | D-CT7 (regla de `/policies/`), D-CT18 (título, meta description, sufijo de marca, imagen social) | — | C1, C5 de 03F; F-10 de `launch/03G-route-parity.md`; HP-11, HP-23 |
| D18 | D-CT13 | DR-08 | § 18 de la auditoría de viabilidad |
| D19 | D-CT17 | — | C04, G11 de `launch/03G-reproducibility-gap-audit.md` |
| D20 | D-CT18 (qué release de theme se congela) | — | C2, C3, C4 de 03F; HP-03, HP-07, HP-08, HP-09, HP-22 |
| (sin ID propio; S17) | — | — | D-MO2 a D-MO7 de `launch/03G-post-launch-monitoring.md` (guardia y canal, reportes de clientas, exclusión de dominios de pago en GA4, archivo de la hoja, aviso interno de pedido nuevo, punto T+4h): se toman antes de T0 |

## 5. Secuencia S01 a S17

Cada paso lleva: qué se hace, quién, reversibilidad, dependencia, evidencia de éxito, rollback, riesgos conocidos y lo aprendido en la Dev Store que cambia el orden. Los IDs L# remiten a la tabla del § 6.

---

### S01 · Crear la tienda comercial (plan, cuenta, país/moneda base)

- **Qué se hace.**
  1. **Decidir D6 y D1.** Insumos documentados, sin recomendación:
     - La Dev Store del Dev Dashboard no se convierte en tienda de producción ni se transfiere; su tipo exacto es `[NOT_VERIFIED]`. El plan asume una **tienda nueva**. Otra ruta arrastraría el estado de la Dev Store del § 2.1 (dirección y entidad en EE. UU., mercado principal EE. UU., inglés predeterminado en el Admin, Horizon live) [DOC:payments/03E-wompi-shopify-feasibility.md E25, E35; analytics/03F-analytics-owner-runbook.md § 2].
     - La auditoría de viabilidad comparó Basic, Grow, Advanced y Plus con precios en USD del 2026-09-26, **no re-verificados hoy** `[NOT_VERIFIED]`. Dejó dos datos relevantes: Basic no incluye cuentas de staff adicionales y Grow incluye 5; y una cuenta de staff adicional era un requisito **supuesto** de esa auditoría, por confirmar con la dueña [DOC:launch/evidence/reference-docs/cost-comparison.md]. La comisión de Shopify por proveedor externo es 2 % (Basic), 1 % (Grow), 0,6 % (Advanced) y 0,2 % (Plus) [DOC:payments/03E-wompi-shopify-feasibility.md E20]. Shopify Payments no existe en Colombia, así que esa comisión aplica siempre [DOC:launch/evidence/reference-docs/wompi-payments.md § D, § G]. **Este documento no elige plan.**
  2. **Crear la cuenta y la tienda (dueña)** con: país y dirección de la tienda = **Colombia** (D1), moneda **COP**, idioma predeterminado **español**, zona horaria `America/Bogota`, sistema métrico y kg. Son los mismos valores que 03B dejó en la Dev Store, pero esta vez desde el inicio [DOC:theme/03B-store-foundation-report.md puntos 8 a 12]. Nombre de la tienda: D6. **El nombre "Radaelli Swimwear Dev" de la Dev Store sale hoy en el título, `og:title`, `og:site_name`, el logo de texto de la cabecera y el pie, y es un BLOCKER para lanzar** (HP-01 de `theme/03G-home-parity.md`); en la tienda comercial el nombre correcto se fija aquí.
  3. **Número inicial de pedidos (D11).** La auditoría dice que preservar la numeración exige configurarla al crear la tienda; dónde se fija es `[NOT_VERIFIED]` [DOC:launch/evidence/reference-docs/data-migration.md § Orders].
  4. **Snapshot "ANTES"** (solo lectura, capturas sin secretos): Configuración > General, Idiomas, Mercados, Envío y entrega (incluida cualquier zona creada por defecto), Sucursales, Pagos, Checkout, Impuestos, Cuentas de cliente, Apps, Contenido > Menús, Páginas y Archivos, y Tienda online > Temas (nombre del theme live por defecto: NOT_AVAILABLE). Es el equivalente de M0 y S0 de los runbooks 03F [DOC:theme/03F-owner-market-colombia-runbook.md § 4; shipping/03F-owner-shipping-runbook.md § 5]. El "antes" de mercados y envíos (SR-06 del plan de rollback) solo se puede tomar al iniciar S02 y S10 y no se reconstruye después [DOC:launch/03G-cutover-runbook.md § 5.4].
  5. **Confirmar el idioma predeterminado.** En Configuración > Idiomas debe figurar Español. Si figura otro, corregirlo ahora, **antes de cargar contenido**: con la tienda vacía no hay traducciones que perder `[INFERIDO]`. Cómo se fija al crear la tienda: `[NOT_VERIFIED]`.
  6. **Confirmar que la Tienda online está protegida con contraseña** antes de cargar nada. En la Dev Store lo estaba [MEDIDO-03G]; en una tienda nueva de pago `[NOT_VERIFIED]`.
  7. No instalar apps ni aceptar OAuth en este paso.
  8. **Antes de crear la tienda:** cerrar PT1 y PT2 del § 3.3 (respaldar `shopify-migration/` y no apagar Cloudinary; ojo con la advertencia G21). PT3 a PT5 se cierran donde dice su columna "Cierra antes de".
- **Quién.** Dueña: todo (cuenta, plan, facturación, país, moneda, dirección, nombre). Claude: prepara la lista de capturas, recibe el snapshot (sin secretos) y verifica en solo lectura al terminar.
- **Reversibilidad.** **IRREVERSIBLE en la práctica: país base, moneda y plan.** Razón: la Dev Store nació en EE. UU. y USD y esa herencia obligó a 03A, 03B, 03E y 03F a corregir idioma, moneda, mercado y dirección con runbooks completos; la dirección de la tienda filtra la lista de proveedores de pago y cambiar el país exige antes desactivar Shopify Payments, Balance, Capital y Credit [DOC:theme/03A-development-store-upload-report.md punto 40; theme/03F-owner-market-colombia-runbook.md § 7 M1; payments/03F-wompi-owner-runbook.md § 1]. **Contradicción explícita con 03F:** el runbook de mercado clasifica el cambio de dirección de la tienda como reversible; eso vale para la Dev Store sin pedidos. Este plan lo trata como irreversible en la tienda comercial por prudencia `[INFERIDO]`: afecta impuestos, facturación y proveedores de pago, y no hay evidencia de que se pueda deshacer con pedidos reales.
- **Depende de.** D6, D1, D7 (idioma) y D11 (número inicial de pedidos); PT1 y PT2 cerradas. Ningún paso previo.
- **Evidencia de éxito.**
  - Admin > General: país Colombia, moneda COP, zona horaria `America/Bogota`, métrico/kg (captura).
  - Admin > Idiomas: predeterminado = Español (captura).
  - Snapshot ANTES archivado.
  - Tienda online con contraseña activa (captura).
- **Rollback.** No hay rollback de país, moneda ni plan. Si algo quedó mal antes de cargar datos, crear otra tienda vacía; la cancelación de la suscripción `[NOT_VERIFIED]`. Pasos detallados en `launch/03G-rollback-plan.md`: RP-26 y RP-55; irreversibles I-05 e I-06.
- **Riesgos conocidos.** Nombre de la tienda distinto del comercial en títulos y `og:site_name` (HP-01); plan sin las cuentas de staff necesarias (B21 de `launch/03G-reproducibility-gap-audit.md`: la evaluación de planes usa "fundadora + al menos una persona más" como requisito, sin fuente propia); facturación aceptada por error (Claude no la acepta); tienda que nace pública; número inicial de pedidos que no se fijó a tiempo (D11).
- **Lo aprendido en la Dev Store que cambia el orden.** Español y Colombia/COP se fijan **al crear la tienda**, no al publicar (L2, L3). La comisión por proveedor externo entra en la decisión del plan (L5).

---

### S02 · Base: país/moneda/idioma predeterminado español/zona de envío/mercado

- **Qué se hace** (orden obligatorio; los cambios de Admin los hace la dueña):
  1. **Formato de dinero.** Configuración > General > formato de moneda: `$ {{amount_no_decimals_with_comma_separator}}`. Es ajuste de tienda, no del theme: sin él la Dev Store mostraba "$199.920,00" en lugar de "$ 199.920" [DOC:theme/03C-catalog-import-report.md Resumen 7]. Etiqueta en español `[NOT_VERIFIED]`.
  2. **Sucursal.** Configuración > Sucursales > "Shop location": dirección de despacho en Colombia (D1); dejar activado "cumplir pedidos online". **No quitar ni reemplazar la sucursal del perfil**: quitar la última ubicación de un grupo borra sus zonas y tarifas [DOC:shipping/03F-owner-shipping-runbook.md § 9].
  3. **Moneda y perfil general.** Confirmar COP antes de crear cualquier tarifa (la moneda de una tarifa no se actualiza sola); confirmar que el perfil general usa la sucursal del punto 2.
  4. **Zona de envío "Colombia" (país completo, todos los departamentos), antes de tocar mercados.**
     - Con D2 decidida, crear las tarifas definitivas según la tabla de S10. Con D2 pendiente, **modo QA parcial**: solo la opción "monto del pedido, mínimo 299900, máximo vacío, precio 0"; **no es lanzable** y `free_shipping_rate_confirmed` sigue en false [DOC:shipping/03F-owner-shipping-runbook.md § 7.1].
     - Importes sin separador de miles (`299900`) y comprobar cómo los muestra el Admin al guardar. **Nunca dejar un precio vacío: vacío es gratis.** No crear Express (D3) ni tarifas por peso (no existen pesos) [DOC:shipping/03F-owner-shipping-runbook.md § 6].
     - Si Shopify creó por defecto una zona "Domestic" u otra, capturarla antes de tocar nada y **no reutilizar ni editar sus tarifas** (moneda no verificada) [DOC:shipping/03F-owner-shipping-runbook.md § 8].
  5. **Mercados.** Colombia = mercado **principal** y activo, con una sola región y sin subcarpeta (un mercado con subcarpeta o con más de una región no puede ser principal); región de respaldo = Colombia. No crear mercado de EE. UU. (D4); si existe uno por defecto, ponerlo en **Borrador** y nunca usar "Eliminar mercado" [DOC:theme/03F-owner-market-colombia-runbook.md § 3.2 H6, § 6, § 7 M5–M7]. Que un visitante nuevo caiga en el mercado principal sin geolocalización (plan no Plus) es `[NOT_VERIFIED]` (V2). Si una tienda que nace en Colombia ya trae Colombia como mercado principal y activo es `[NOT_VERIFIED]`: en la Dev el orden importó porque nació en EE. UU. `[INFERIDO]`; si Colombia ya es el principal, el catálogo figura agotado para todas las visitantes hasta que exista la zona con tarifa, así que el punto 4 no se difiere.
  6. **Idiomas.** Español predeterminado (S01). Si D7 mantiene el inglés: instalar **Translate & Adapt** (app oficial y gratuita; Shopify la exige para agregar idiomas; OAuth de la dueña), agregar Inglés y publicarlo en `/en` [DOC:theme/03B-store-foundation-report.md Resumen 2].
  7. **Impuestos.** Capturar la pantalla antes y después del cambio de dirección; **no cambiar valores sin decisión (D9)**. En la Dev Store Colombia figuraba "sin recaudación de impuestos"; la auditoría de viabilidad anotó que Radaelli no cobra IVA; el efecto de la dirección sobre impuestos es `[NOT_VERIFIED]` [DOC:theme/03B-store-foundation-report.md punto 11; launch/evidence/reference-docs/architecture-map.md].
  8. **Solo mirar Configuración > Pagos** y capturar la lista de proveedores alternativos: es el dato que decide el camino de S11.
  9. Dejar la contraseña de la tienda activa.
- **Quién.** Dueña: los 9 puntos en el Admin. Claude: verificación de solo lectura (V1, V2, V7, V8) y, después de S04, G1. Claude no cambia la configuración de la tienda por ella [DOC:theme/03F-owner-market-colombia-runbook.md § 0].
- **Reversibilidad.**
  - Reversibles: formato de dinero, dirección de la sucursal, zona y tarifas (se eliminan), estado de un mercado (Activo/Borrador), región de respaldo, principal de mercado (se repite en el otro).
  - **IRREVERSIBLE: "Eliminar mercado"** (permanente; no se recupera). No se usa.
  - **DESTRUCTIVO: "Cambiar idioma predeterminado"** (borra las traducciones del idioma destino y reescribe todos los themes). No debería hacer falta si S01 lo dejó bien.
- **Depende de.** S01; D1, D2 (o modo parcial), D4, D7, D9 (impuestos).
- **Evidencia de éxito.**
  - Admin: sucursal en Colombia y activa; zona `Colombia` con sus tarifas, precios y **moneda visible COP**; Colombia principal y activa sin aviso de error de envío; región de respaldo Colombia; sin mercado ni zona de EE. UU. activos (capturas, comparadas con el snapshot ANTES).
  - Storefront con sesión (V1 y V2 del runbook de mercado): `country: "CO"`, `currency: "COP"`, `locale: "es"`; `/` 200 con `lang="es"`; si D7 mantiene inglés, `/en` 200 con `lang="en"` (V7) y hreflang `x-default`, `es`, `en` (V8) [DOC:theme/03F-owner-market-colombia-runbook.md § 8].
  - **La disponibilidad 29/29 con CO solo puede medirse con catálogo cargado: se comprueba al cerrar S04 (control G1).**
- **Rollback.** Runbook de mercado § 12 y runbook de envío § 12, en orden inverso: mercado (Borrador/principal), zona y tarifas, sucursal (restaurar la dirección capturada; no quitar la sucursal del grupo) [DOC:theme/03F-owner-market-colombia-runbook.md § 12; shipping/03F-owner-shipping-runbook.md § 12]. Pasos detallados en `launch/03G-rollback-plan.md`: RP-21 a RP-26.
- **Riesgos conocidos.**
  - Con Colombia como país por defecto y sin zona con tarifa, el catálogo figura agotado (medido en Dev: 0/29, `add.js` 422).
  - Hueco entre tramos: error de envío en el checkout.
  - Precio vacío = envío gratis.
  - Importes con separador de miles interpretados como decimales `[NOT_VERIFIED]`.
  - Mercado con subcarpeta: `/en` podría romperse (H6); se comprueba con V7.
  - Efecto de la dirección sobre impuestos `[NOT_VERIFIED]`.
- **Lo aprendido en la Dev Store que cambia el orden.** **Zona de envío primero, mercado principal después** (L1; corrige 03E § 5.3). Formato de dinero como ajuste de tienda (L11). Wompi aparece o no según la dirección de la tienda: se mira ahora, no se instala (L3, L13).

---

### S03 · Theme (subir RC1.8 sin publicar)

- **Qué se hace.**
  1. **Verificaciones offline previas (Claude):**
     - `sha256sum dist/radaelli-shopify-theme-rc1.8.zip` debe dar `e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67` (173.654 bytes, 96 archivos) [DOC:dist/release-manifest-rc1.8.json].
     - `node shopify-migration/scripts/audit-theme-limits.mjs shopify-migration/theme-src` (desde la raíz del worktree): Shopify rechaza del lado del servidor límites que Theme Check no ve (`theme_author` ≤ 25 caracteres, `header` ≤ 50) [DOC:theme-src/README.md; theme/03A-development-store-upload-report.md punto 20].
     - Theme Check 0/0 sobre `theme-src` y sobre el ZIP extraído (60 archivos inspeccionados) [DOC:dist/release-manifest-rc1.8.json].
  2. **Autenticar la CLI en la tienda comercial:** Shopify CLI 4.8.2, código de dispositivo aprobado por la dueña en su navegador; Claude no ve ni copia tokens [DOC:theme/03A-development-store-upload-report.md punto 5].
  3. **Subir sin publicar** (dos rutas equivalentes):
     - CLI: `npx @shopify/cli@4.8.2 theme push --unpublished --theme "Radaelli RC1" --store <tienda-comercial> --strict --json --path shopify-migration/theme-src --ignore README.md`. **Nunca** `--live`, `--publish` ni `--allow-live` [DOC:theme/03A-development-store-upload-report.md punto 12; theme-src/README.md].
     - Admin: Tienda online > Temas > Agregar tema > Subir archivo ZIP (dueña) [DOC:theme/pre-development-store-checklist.md paso G].
  4. **Revisar el JSON del push:** debe venir sin `warning` ni `errors`; el push termina con código 0 aunque Shopify rechace archivos [DOC:theme-src/README.md].
  5. **Paridad:** `shopify theme pull --theme <id> --path <carpeta temporal vacía> --nodelete` y comparar contra `dist/release-manifest-rc1.8.json`. Los archivos `.json` difieren en bytes por el formato de Shopify: comparar semánticamente (en 03A, 15 diferencias de bytes eran solo formato) [DOC:theme/03A-development-store-upload-report.md Resumen 6]. Esperado: 96/96.
  6. **Registrar** el id del theme nuevo, su rol `unpublished` y que el theme live por defecto de la tienda quedó intacto (`theme list`).
  7. **Smoke mínimo en el preview** (`https://<tienda-comercial>/?preview_theme_id=<id>`, con sesión de Admin; con la contraseña puesta el enlace directo lleva a `/password`): Home, búsqueda, carrito, favoritos, contraseña y `/en` a 1280, 390 y 320 px: 18/18 (6 superficies × 3 anchos) sin desbordes, errores propios de JS ni recursos fallidos, con 0 errores de Liquid y 0 traducciones faltantes [DOC:theme/03B-store-foundation-report.md puntos 40 y 42]. Colecciones y fichas no entran en esa matriz: se miden con catálogo en S14. Sin catálogo la Home renderiza sin errores (11 secciones) [DOC:theme/03A-development-store-upload-report.md punto 21].
- **Quién.** Claude: verificaciones, `push` y `pull`, con el OK de la dueña y su aprobación del código de dispositivo. Dueña: aprueba el código; o sube el ZIP ella.
- **Reversibilidad.** Reversible: el theme queda sin publicar y se borra o se vuelve a empujar. **Aquí no se publica nada.**
- **Depende de.** S01; D7. Conviene después de S02 para que el idioma predeterminado ya sea español (en 03A la tienda estaba en inglés y el theme usó `en.json` en lugar de `es.default.json`) [DOC:theme/03A-development-store-upload-report.md punto 40].
- **Evidencia de éxito.**
  - `shopify theme list --store <tienda-comercial>`: el theme Radaelli figura `[unpublished]` y el theme live por defecto sigue `[live]`.
  - JSON del push sin `warning` ni `errors`; paridad 96/96; SHA-256 del ZIP igual al del manifiesto.
  - Smoke 18/18.
  - Referencias a colecciones de `templates/index.json`: se revisan al cerrar S05; **si las secciones de la Home salen vacías con las colecciones ya creadas, reempujar solo `templates/index.json` (JSON después del código)**. Que Shopify conserve una referencia por handle a una colección que aún no existe es `[NOT_VERIFIED]`.
- **Rollback.** Borrar el theme sin publicar desde el Admin; el theme live no se tocó. Pasos detallados en `launch/03G-rollback-plan.md`: RP-04.
- **Riesgos conocidos.**
  - Límites de esquema del servidor (en 03A el primer push rechazó 3 archivos; RC1.8 ya los corrige).
  - `README.md` no va al theme (`--ignore README.md`).
  - `theme_documentation_url` apunta al repositorio de GitHub del proyecto y `social_whatsapp` es un enlace público de contacto: decisión de la dueña (D17) [DOC:launch/03G-checkout-precondition-audit.md § 3, N-01].
  - Nombre de la tienda en el logo de texto (D6) y `settings.logo` y `settings.favicon` vacíos (HP-02): ver S07.
  - **RC1.8 es la base validada, no necesariamente el release final.** Los cambios de theme que 03G deja pendientes (CTA a `#productos`, insignia de la editorial, texto del botón del boletín, `brand_name` del pie: HP-03, HP-07, HP-08, HP-09), el cableado de media (S07) y el cerrojo de envío (S10) modifican `theme-src` y producen un release nuevo, que los documentos de 03G llaman RC1.9. Cada cambio necesita autorización aparte y regresión; el arnés offline no está en el repo (PT4) [DOC:launch/03G-reproducibility-gap-audit.md A15, A19]. La igualdad exacta 96/96 contra el ZIP solo se exige aquí; después el corte admite diferencias anotadas y con hash (flags de `config/settings_data.json` y referencias de media en los 2 templates: DIF-09 y § 5.3 de `launch/03G-cutover-runbook.md`).
- **Lo aprendido en la Dev Store que cambia el orden.** El theme se sube **sin publicar** y se publica al final (L6). Con varios pushes: **código primero, JSON de plantillas después**, porque Shopify descarta en silencio los settings nuevos si el código aún no los declara (L7). El push no falla aunque rechace archivos: hay que leer el JSON (L7).

---

### S04 · Catálogo (import CSV 29/98/95)

- **Qué se hace.**
  1. **Pre-vuelo (Claude, lectura).** El sitio actual puede cambiar entre mediciones (F-01 de `launch/03G-product-parity.md`: dos mediciones públicas distintas, causa no demostrada porque el `lastmod` del sitemap no cambió): volver a rastrearlo y a correr la paridad justo antes de importar y otra vez en la ventana de S16. **Copiar antes `launch/evidence/current-site/` y los CSV de paridad** (PT3). `node launch/tools/03g-crawl-current-site.mjs` (70 GET de solo lectura a `radaelliswimwear.com`, con OK) y `node launch/tools/03g-product-parity.mjs` (offline); el verificador `node launch/tools/03g-product-parity-verify.mjs` debe terminar con `PROBLEMAS (0)`. **Límite de la herramienta de paridad (DIF-10 del corte):** lee las capturas de la Dev Store (`dev-products.jsonl`, `dev-collections.json`, `dev-routes.json`), no la tienda comercial; sirve para medir la deriva del sitio actual. El lado Shopify de la tienda comercial se re-captura aparte en solo lectura (`/products.json`, `/collections/<handle>/products.json` y una ficha por colección, con la ventana visible) y se compara con `launch/03G-product-parity.csv`; cómo se automatiza esa re-captura es `[NOT_VERIFIED]` y `scripts/capture-public-catalog.mjs` es una propuesta que no existe [DOC:launch/03G-cutover-runbook.md CT-03, DIF-10]. Resolver **D12 (a), (b) y (c)** antes de importar. Si D12 (a) elimina la XL, `catalog/variants-master.csv` y la compuerta 29/98/95 de `scripts/build-shopify-product-csv.mjs` (el script aborta si no da 98) deben ajustarse antes en una tarea aparte [DOC:import/README.md; launch/03G-cutover-runbook.md CT-03, CT-04, CT-43].
     - Importar `import/shopify-products-03c.csv`, **no** `shopify-import/shopify-products-DRAFT.csv` (218 bytes, solo encabezado) [DOC:launch/03G-reproducibility-gap-audit.md G17].
     - El CSV depende del Cloudinary vivo del sitio actual (PT2): no apagarlo hasta cerrar S04 y S07.
     - `scripts/export-radaelli-catalog-for-shopify.mjs` **sobrescribe** los 5 maestros del catálogo si se corre; no correrlo contra producción sin copia previa [DOC:launch/03G-reproducibility-gap-audit.md G01].
  2. **Primera pasada.** Admin > Productos > Importar: `import/shopify-products-03c.csv` (SHA-256 `42b05500ded688a247f38972c74042d798e3a5d9b26624c8a4c6b93cf5d32c1f`; 99 filas de datos: 29 productos, 98 variantes, 95 imágenes). **Desmarcar "publicar en todos los canales"**: queda solo en la Tienda online. Mapeo: `Vendor` = `Radaelli Swimwear`; `Type` = colección; opción `Talla`; `Price` = precio de venta; `Compare-at price` = precio de lista (−20 %); `Inventory tracker` vacío; `Color (product.metafields.custom.color)` en mayúsculas [DOC:import/README.md].
  3. **Segunda pasada (imágenes de más de 25 MP).** Importar con "Sobrescribir productos con handles coincidentes": `import/shopify-products-03c-images.csv` (SHA-256 `4358e5f210c4ee33d2f4c286fe14dc8e0493d578b07a80d9329747ca8825fbe8`; 48 filas de datos; 43 URLs con `c_limit,w_5000,h_5000,q_95`). Trazabilidad URL por URL en `import/image-resolution-fix.csv` (SHA-256 `cc3f5e3554bf5162feb51eb763e44a66f40d5b801780c282e0600d9f8ad3bfb3`; 44 filas) [DOC:theme/03C-catalog-import-report.md Resumen 5]. **Alternativa no probada** `[INFERIDO]`: una sola pasada con las 43 URLs ya reemplazadas en el CSV maestro; exigiría regenerar los CSV y sus checksums, por lo que este plan repite el procedimiento validado.
  4. **Después de importar (Claude, con OK y con el Admin visible):**
     - **Colección `frontpage` ("Home page").** Debe tener 0 productos. En 03C Shopify agregó el primer producto importado a esa colección; se excluyó sin borrar nada [DOC:theme/03C-catalog-import-report.md Resumen 6].
     - **Tag `MOSTAZA`** en `entero-golden-hour` (el CSV no lleva tags). Es el único tag del catálogo; los prefijos `color:` no generan tokens buscables [DOC:theme/03E-commercial-readiness-report.md punto 5; catalog/color-search-tag-map.csv].
     - **Toque neto cero de indexación.** Seleccionar los 29 productos > "Agregar etiquetas" con una etiqueta temporal > "Eliminar etiquetas" con la misma. Verificar que 0 productos conservan la etiqueta y que 29/98/95 siguen intactos [DOC:theme/03D-search-index-report.md].
     - **Medir la cobertura del índice** con el método de 03D: el título exacto de cada producto en `/search/suggest.json?…&resources[options][fields]=title,product_type,tag` debe devolver su propio handle, hasta 29/29.
     - **Inventario (D12 b).** Por defecto queda **no rastreado**, como en Dev: la disponibilidad no representa stock real y Shopify aceptaría pedidos sin límite. Si se decide rastrear, las cantidades necesitan una fuente verificada por la dueña: el sitio actual publica `sizeStock` por talla (27 fichas con 25 por talla; `bikini-foam` S24/M24/L25; `costa-esmeralda-azul` S24/M23/L25; el patrón uniforme sugiere un valor de carga, no un conteo físico `[INFERIDO]`) [MEDIDO-03G: F-04 de `launch/03G-product-parity.md`; B-13 de `launch/03G-current-site-baseline.md`]. La auditoría propone una plantilla `import/inventory-template.csv` con las 98 variantes (no existe todavía) [DOC:launch/03G-reproducibility-gap-audit.md G02].
     - **Control G1** con `Shopify.country = "CO"` (V4 y V5 del runbook de mercado).
- **Quién.** La dueña importa desde el Admin, o Claude con OK explícito y ventana visible (así se hizo en 03C). Claude verifica y mide.
- **Reversibilidad.** Reversible con trabajo antes de publicar y sin pedidos: despublicar, o borrar los productos y reimportar los CSV deterministas (ver el rollback). **IRREVERSIBLE: eliminar o renombrar un handle ya publicado.** Razón: rompe URLs indexadas y la tabla de 47 redirecciones; los 29 handles ya están mapeados en `catalog/shopify-handle-mapping.csv` (SHA-256 `24133383…c423`). Borrar un producto es permanente para ese objeto.
- **Depende de.** S02 (COP, formato de dinero, zona con tarifa), S05.A (definiciones y colecciones), D12; S03 recomendado.
- **Evidencia de éxito.**
  - `/products.json?limit=250` (V4): **29 productos, 98 variantes, 95 imágenes** (97 variantes si D12 a elimina la XL); con país CO, 29/29 productos y 98/98 variantes `available:true`; `POST /cart/add.js` responde 200.
  - SKU 98/98 únicos y con la forma `<SKU>-<talla>`; 29 handles únicos.
  - Precio 29/29 y compare-at 29/29; cuatro pares de precios: 249.900 → 199.920 (4 productos), 229.900 → 183.920 (10), 209.900 → 167.920 (9), 199.900 → 159.920 (6); siempre −20 % y `total_discount` = 0 [MEDIDO-03G].
  - Tipos: Aurora Viva 12, Oasis Natural 10, Espuma de Ola 7. Tallas: S 29, M 29, L 28, XL 11, "L y XL" 1 (suman 98) [DOC:theme/03F-search-discovery-owner-runbook.md § 4.1].
  - Imágenes: 52 con las mismas dimensiones que la fuente y 43 reducidas a 5000 px de lado largo, 0 sin explicar; 1 archivo con sufijo UUID (`amanecer-dorado-lila`) [MEDIDO-03G].
  - `catalog/shopify-post-import-audit.csv` re-corrida: 29/29 OK.
  - Ficha de `brisa-natural-beige` talla S: "$ 199.920" con "−20 %".
  - Búsqueda: "mostaza" = 1 resultado (`entero-golden-hour`); cobertura del índice 29/29.
  - `Type` de cada producto = título de su colección (RC1.8 elige la colección de la miga por ese tipo) [DOC:launch/03G-product-parity.md F-02].
- **Rollback.** Por defecto, **despublicar** productos del canal de la tienda online, nunca eliminarlos, y no renombrar handles (RP-43 y RP-44). Solo antes de S16, con la tienda bajo contraseña y sin pedidos, se admite "borrar los productos importados y reimportar los CSV": cada borrado es irreversible y su efecto sobre IDs internos, membresías de colecciones y referencias de metacampos es `[NOT_VERIFIED]` (D-16 del plan de rollback). Con la contraseña puesta, nada de esto es visible al público. Pasos detallados en `launch/03G-rollback-plan.md`: RP-43 y RP-44.
- **Riesgos conocidos.**
  - Primera pasada: 43 imágenes de 12 productos rechazadas (4672 × 7008 = 32,7 MP).
  - Índice de búsqueda estancado tras la importación masiva (en Dev: 8/29 después de más de 1 h 40 min sin cambios).
  - "Home page" contaminada.
  - Si no se pone `Vendor`, Shopify usa el nombre de la tienda.
  - Inventario no rastreado y "continuar vendiendo sin stock" en `deny`.
  - F-01: el sitio actual hoy no lista la XL de `alba-dorada-cafe-claro`; si se publica así, Shopify vendería una talla que la tienda actual no muestra y sin límite de stock.
  - 4 imágenes heredadas de baja resolución (lado largo menor de 1200 px) en 3 productos; en `brisa-natural-beige` y `arena-dorada-negro` la imagen principal es una de ellas (F-05 de `launch/03G-product-parity.md`).
  - Las meta descriptions de 2 productos con descripción larga (`marea-natural`, `marea-natural-naranja`) salen cortadas a 320 caracteres `[INFERIDO por el largo]` (N-8 del mismo documento).
  - El CSV no lleva columnas SEO ni `Tags`; el tag `MOSTAZA` y las descripciones SEO son pasos aparte (A01 y C09 de `launch/03G-reproducibility-gap-audit.md`).
  - `costa-esmeralda-azul`: handle en minúsculas frente a `COSTA-ESMERALDA-AZUL` del sitio actual; la redirección ya lo cubre.
- **Lo aprendido en la Dev Store que cambia el orden.** Las definiciones y colecciones van **antes** del CSV (L10). Las imágenes de más de 25 MP exigen la segunda pasada con `c_limit` (L9). Un import masivo deja el índice de búsqueda estancado y **tocar los productos** lo desbloquea (L8). El primer producto se cuela en "Home page" (L10). El color se busca con un tag plano (L12).

---

### S05 · Colecciones, metafields y metaobjetos (dos partes)

**Parte A: antes de S04.**

- **Qué se hace.**
  1. **Definiciones** (Configuración > Metacampos y metaobjetos) [DOC:theme/03C-catalog-import-report.md puntos 25 a 27; MEDIDO-03G]:
     - Producto: `custom.color` (texto de una línea, acceso Storefront) y `custom.size_guide` (referencia al metaobjeto `size_guide`).
     - Metaobjeto `size_guide`: campos `image` (archivo de imagen) y `content` (texto enriquecido), acceso Storefront. **0 entradas**: el contenido de texto es NOT_AVAILABLE.
     - Colección: `custom.cover_video` (archivo de video), `custom.cover_image` (archivo de imagen), `custom.image_pos_x`, `custom.image_pos_y` y `custom.zoom` (decimales), `custom.description_tone` (texto).
     - La definición de cliente `custom.wishlist` se crea solo en S09.
  2. **Colecciones manuales vacías** (modelo nuevo), con los handles exactos: `oasis-natural` "Oasis Natural", `aurora-viva` "Aurora Viva", `espuma-de-ola` "Espuma de Ola", `salidas-de-bano` "Salidas de Baño". El CSV las llena por la columna `Collection` [DOC:import/README.md]. `description_tone`: oasis-natural = `moss`, aurora-viva = `linen`, espuma-de-ola = `fog`, salidas-de-bano = `sand`. De dónde salió la descripción de cada colección en la Dev Store no está documentado en los reportes leídos `[NOT_VERIFIED]`; el snapshot mide meta description presente de 66, 69, 63 y 65 caracteres.
  3. La colección automática `frontpage` ("Home page") que crea Shopify: 0 productos; su tratamiento es la decisión D17.

**Parte B: después de S04.**

- **Qué se hace.**
  1. **Colección manual `destacados`** con 7 productos: `bikini-palm-verde-oliva`, `raices-del-sol-beige-suave`, `aurora-total-azul-oscuro`, `enterizo-shadow-palm-azul-marino`, `alba-dorada-lila`, `bikini-shadow-azul-marino`, `entero-golden-hour` (4 de Espuma de Ola y 3 de Aurora Viva). Es el mismo conjunto que muestra la Home actual; **el orden difiere** [MEDIDO-03G; DOC:theme/03D-missing-assets-audit.md § 5].
  2. **Orden de las colecciones (D12 c).** En las 3 colecciones con productos el conjunto es idéntico al del sitio actual pero **0 posiciones coinciden** (F-03 de `launch/03G-product-parity.md`; C-02 de `launch/03G-collection-parity.md`). Causa: el orden por defecto de una colección manual en la Dev es el **inverso del orden de filas del CSV de importación**; el sitio actual ordena por fecha de creación ascendente aunque el selector diga "Novedades" (el código del repo lo hace así; la fecha misma es NOT_AVAILABLE). Las listas exactas del orden actual están en `launch/03G-collection-parity.md` § 3.2 y en `launch/03G-product-parity.summary.json`; conviene volver a leerlas justo antes de reordenar porque son una foto del 2026-09-29. Reordenar a mano es un cambio de Admin con OK; no reordenar es aceptable si la dueña lo decide.
     - **Efecto en la Home:** la editorial "La belleza de sentirte tú" toma las 8 primeras de Oasis Natural. Con el orden de Dev salen `costa-esmeralda-azul` y `brisa-natural-beige` (ambos `featured=true` en el sitio actual) y entran `brisa-natural-naranja` y `oasis-serena-negro`; los dos productos que salen tampoco están en Destacados (HP-06).
  3. **"Recomendado para vos"** sin colección: la sección queda oculta (D20).
  4. Los metafields de portada y banner (`cover_image`, encuadre) quedan para S07, que necesita los archivos.
- **Quién.** Claude con OK explícito (como en 03C, con el Admin autenticado) o la dueña.
- **Reversibilidad.**
  - Definiciones sin datos: se pueden borrar. **Con datos no borrarlas** (el efecto sobre los valores es `[NOT_VERIFIED]`).
  - Colecciones: se pueden borrar. **IRREVERSIBLE en la práctica: renombrar o eliminar el handle de una colección publicada** (rompe menús, redirecciones y la Home).
- **Depende de.** Parte A: S01, S02. Parte B: S04. D12 (c), D20.
- **Evidencia de éxito.**
  - `/collections.json` y `/collections/<handle>/products.json`: `oasis-natural` 10, `aurora-viva` 12, `espuma-de-ola` 7, `salidas-de-bano` 0, `destacados` 7 y `frontpage` 0 [MEDIDO-03G]. Las 6 colecciones con 9 opciones de orden.
  - Definiciones: producto 2, colección 6, metaobjeto 1 con 0 entradas.
  - `description_tone` cargado en las 4 colecciones.
  - Home en el preview con las 4 tarjetas de categoría y "Productos destacados" con 7 tarjetas; "Recomendado para vos" oculta [MEDIDO-03G: launch/evidence/dev-home.json].
- **Rollback.** Despublicar las colecciones (RP-43) o vaciarlas; quitar un producto de `destacados`; borrar solo las definiciones sin datos. Borrar una colección solo antes de S16 y antes de enlazarla en menús o redirecciones, porque su handle no se recupera (RP-44). Pasos detallados en `launch/03G-rollback-plan.md`: RP-43 y § 8.8.
- **Riesgos conocidos.** Handle distinto del que espera el theme en `templates/index.json`; la sección de Home vacía si la referencia por handle no resuelve (`[NOT_VERIFIED]`, ver S03); Salidas de Baño con 0 productos deja su tarjeta sin media hasta S07 (M09 es crítica).
- **Lo aprendido en la Dev Store que cambia el orden.** La parte A **precede** a S04: 03C creó definiciones y colecciones antes del CSV (L10). "Destacados" se creó en 03D con los 7 productos y sirvió, además, para desbloquear el índice de búsqueda (L8). La colección `frontpage` aparece sola y contamina (L10).

---

### S06 · Menús, páginas y redirecciones

- **Qué se hace.**
  1. **Menús** (Contenido > Menús):
     - `main-menu`: Inicio, Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño (5 ítems). El header lee el ajuste `main_menu` cuyo valor por defecto es `main-menu` [DOC:theme-src/sections/header.liquid].
     - `comprar`: las 4 colecciones (columna del footer).
     - `ayuda`: Devoluciones (`/policies/refund-policy`) y Garantía (`/pages/garantia`). Se suman Envíos, Términos y condiciones, Privacidad y Cookies **solo si su página existe y su puerta está abierta**; orden del sitio real: Envíos, Devoluciones, Garantía, Términos y condiciones, Privacidad, Cookies (6 ítems) [DOC:theme/03F-legal-owner-runbook.md § 9, fase D].
     - `customer-account-main-menu`: ítems por defecto (Orders, Profile); "Mis favoritos" solo si se ejecuta S09.
     - El `Footer menu` de Shopify (Buscar, Your Privacy Choices) no lo usa el theme: D17.
  2. **Páginas y políticas:**
     - `favoritos`: título "Favoritos", handle `favoritos`, visible, plantilla por defecto hasta S16 (el header enlaza `/pages/favoritos?view=wishlist` mientras tanto); `noindex` por handle desde RC1.6 [DOC:theme/03F-sonnet-independent-completion-report.md sección B].
     - `garantia` ("Política de garantía", `content/legal/garantia.html` verbatim; 889 caracteres sin espacios, hash `b44d879a…`).
     - Política nativa de reembolso con `content/legal/devoluciones.html` verbatim (1618 caracteres, `c9c65d02…`), visible en `/policies/refund-policy`.
     - **Cuatro páginas legales** (Privacidad, Términos, Envíos, Cookies) con `content/legal/<archivo>.html` verbatim, handles fijos `privacidad`, `terminos`, `envios`, `cookies`. Procedimiento, decisiones (D-L1 a D-L7), puertas (G-PAY, G-ENV, G-COOK, G-PRIV) y QA Q1 a Q13 con hashes: `theme/03F-legal-owner-runbook.md`. Reglas: pegar en la vista de código (`<>`), nunca "Insert template" ni "Use automated policy". Una puerta cerrada **no** impide copiar la página (tienda privada); sí impide agregarla al menú y publicar con ella sin revisar.
     - **Privacidad:** en la Dev Store existe una política **autogenerada** publicada; no se pisa sin la decisión D-L2. En la tienda comercial que exista una autogenerada es `[NOT_VERIFIED]`.
     - **Quién escribe las páginas legales:** en 03D el clasificador de permisos denegó a Claude crearlas; modo 1, la dueña las pega ella; modo 2, aprobación específica por página en el chat [DOC:theme/03F-legal-owner-runbook.md § 2].
     - Páginas y colecciones que crea Shopify y salen indexables: `/pages/contact` (en inglés), `/pages/data-sharing-opt-out`, `/blogs/news` (en inglés), `/collections/frontpage`, `/collections/all` y `/collections/destacados` (sin meta description): D17 [DOC:launch/03G-route-parity.md F-10].
     - El pie de la Home actual enlaza Envíos, Términos, Privacidad y Cookies y una columna "Empresa" con 3 marcadores a `#contacto`; el pie del theme no tiene esos enlaces hasta que existan las páginas, ni la columna Empresa (HP-13, D20).
     - Enlaces del theme a las páginas: `shipping_url` = `/pages/envios` y `warranty_url` = `/pages/garantia` (RC1.7 ya trae este último) [DOC:theme/03F-legal-owner-runbook.md § 9, fase C].
  3. **Redirecciones.**
     - Antes: `node seo/validate-redirects.mjs` (desde `shopify-migration/`) → `RESULTADO: PASS -- 0 errores, 12 avisos, 47 redirects, 102 URLs clasificadas`; `--self-test` 16/16 [DOC:seo/03E-redirect-plan.md § 6].
     - Importar: Admin > Contenido > Menús > Redireccionamientos de URL > Importar `seo/shopify-redirects-import.csv` (47 filas; SHA-256 `ba3694678062c1f916166fb79e14640226aaa37b29cd4dc3ab183bc27818b1d6`; encabezado exacto `Redirect from,Redirect to`). En la vista previa: 47 filas y `/producto/COSTA-ESMERALDA-AZUL` conserva la ruta [DOC:seo/03E-redirect-plan.md § 7; seo/03F-redirect-import-result.md].
     - Probar como en 03F: 38 destinos exactos en 200 y 9 `/cuenta*` que redirigen (`opaqueredirect`, igual que `/account`); control `/cuenta-inexistente-xyz` = 404.
     - **Cuatro filas legales** (`/envios`, `/terminos`, `/privacidad`, `/cookies`) cuando existan sus páginas: seguir los 4 pasos de `seo/03E-redirect-plan.md` § 4.3, correr el validador e importar **solo esas 4** en un archivo aparte con el mismo encabezado → **51 en total**. Si D9 adopta la privacidad nativa, `/privacidad` → `/policies/privacy-policy`.
     - Blog (D15): 4 filas potenciales (`/blog`, `/blog/novedades-temporada`, `/blog/materiales-nobles-por-que-importan` y `/blog/guia-de-capas-para-el-invierno`) hacia `/blogs/<blog>/<handle>`. Los slugs salen del sitemap actual y las 4 URL dan 200 con `index, follow`; 03E los daba como NOT_AVAILABLE [MEDIDO-03G: launch/evidence/current-site/sitemap.xml.txt; current-site-probe/index.json]. El theme trae plantillas de blog y artículo.
     - **`/favoritos` y `/cuenta/favoritos`** son condicionales. 03E § 7.1 pedía activarlas con `page.wishlist` ya asignada; 03F las importó con las 47 antes de publicar y hoy resuelven en 200 con la plantilla genérica y `noindex`. Este plan **sigue 03F** (importa las 47 ahora) y **vuelve a comprobar esas dos en S16 después de asignar la plantilla**.
     - El código 301 exacto es `[NOT_VERIFIED]` con `fetch`; se comprueba con `curl -I` en S15.
  4. **Línea base de Search Console (dueña, antes del corte: CT-17).** Exportar la lista de URLs indexadas hoy y el estado de cobertura y de 404 del dominio, fuera del repo y sin datos personales, y cruzarla con los 47 orígenes, las 4 legales y los 9 sin destino. Que la dueña tenga la propiedad y su verificación es NOT_AVAILABLE; sin acceso se deja constancia escrita y se sigue sin línea base (riesgo aceptado por ella) [DOC:launch/03G-cutover-runbook.md CT-17].
  5. **Página de Envíos y decisión D2.** Aquí solo se **copia** `content/legal/envios.html` (verbatim); su texto y el de `threshold_note` se ajustan a D2 y D5 en S10 (punto 7), y la puerta G-ENV se abre al terminar S10 (tarifa gratis, cerrojo encendido y regla `>=` probada). Una puerta cerrada no impide copiar la página con la tienda privada; sí impide agregarla al menú y publicar con ella sin revisar [DOC:theme/03F-legal-owner-runbook.md § 3.2; launch/03G-cutover-runbook.md CT-05].
- **Quién.** Dueña: pega las páginas legales; importa redirecciones (en la Dev Store las importó Claude con el Admin visible). Claude: validador, hashes de texto, pruebas de redirección y QA de la sección 11 del runbook legal.
- **Reversibilidad.** Reversible: menús (editar), páginas (Oculta o Eliminar), redirecciones (seleccionar todas > Eliminar; vuelve a 0 sin afectar productos, colecciones ni theme). **Cambiar el handle de una página o eliminarla rompe los enlaces internos de los otros textos y las redirecciones que apuntan a ella.**
- **Depende de.** S03, S04, S05.B; S02; D2 y D5 (texto de Envíos), D9, D12 (g), D15, D17.
- **Evidencia de éxito.**
  - Menús: `main-menu` 5 ítems, `comprar` 4, `ayuda` 2 (6 con las legales).
  - Páginas: `garantia`, `favoritos` y, con D9, las 4 legales; QA Q1 (hash de texto: Privacidad 1295 caracteres `9be57105…`, Términos 941 `0979093c…`, Envíos 2345 `5395eba7…`, Cookies 1073 `e10bdc27…`) y Q9 (sin regresión en Reembolso y Garantía) [DOC:theme/03F-legal-owner-runbook.md § 11].
  - Redirecciones: 47 importadas (51 con las legales); 38 en 200 + 9 con redirección; validador PASS.
  - Home en el preview: header con 5 enlaces y footer con las columnas Comprar y Ayuda [MEDIDO-03G: launch/evidence/dev-home.json].
- **Rollback.** Runbook legal § 12 (páginas, menú, ajustes) y `seo/03F-redirect-import-result.md` § 5 (borrar todas las redirecciones). Pasos detallados en `launch/03G-rollback-plan.md`: RP-37 a RP-40 y RP-46.
- **Riesgos conocidos.**
  - Las redirecciones solo disparan en rutas que hoy dan 404 ("You can redirect only from broken URLs").
  - `robots.txt` de Shopify bloquea `/policies/` por defecto: `/devoluciones` → `/policies/refund-policy` lleva a una URL que Google no rastrea (D17).
  - Con páginas (no políticas nativas) el pie del checkout no enlaza Términos ni Envíos; solo Reembolso y Privacidad.
  - Sin descripción SEO, la meta description de una página sale con las palabras pegadas.
  - Si el dominio primario queda en `www`, cada URL vieja suma un salto (S15).
  - El texto de Cookies ("Hoy no las usamos") puede ser inexacto aun con GA4 y Meta apagados.
- **Lo aprendido en la Dev Store que cambia el orden.** Las redirecciones no distinguen mayúsculas, conservan el query y aceptan barra final (L17). Shopify crea por sí mismo `contact`, `data-sharing-opt-out` y `frontpage`, que ensucian el sitemap (L16). El clasificador de permisos impidió escribir las legales (L18). Los enlaces automáticos del checkout solo cubren políticas nativas (L19).

---

### S07 · Media (hero, categorías, banners, guía de tallas)

- **Qué se hace** (Ruta A del runbook `content/media/03F-media-owner-runbook.md`; los pasos P0 a P10 son los de ese documento):
  1. **P0.** Confirmar que el sitio actual no cambió su media desde la captura de 03D (ETag de M01 = M06 `b53a3029…`; los 13 tamaños iguales a 03D). Repetir los HEAD si pasó tiempo.
  2. **P1.** OK explícito de descarga de la dueña, con la variante de video (D13). El texto sugerido está en el runbook, § 7.
  3. **P2 (Claude, desde la raíz del worktree).**
     - En seco: `node shopify-migration/scripts/prepare-media-package.mjs`.
     - Con OK: `node shopify-migration/scripts/prepare-media-package.mjs --download --video-variant=served`.
     - Esperado: 13 líneas `OK` (12 descargas + copia local de M07), `Escrito: content/media/03E-upload-ready-manifest.csv (13 filas)`, 0 errores, **12 archivos únicos**, 13.516.595 bytes en disco (15.595.787 por red); M13 con `c_limit,w_5000,h_5000,q_95` = 3333 × 5000 y 2.964.788 bytes; los 4 videos en `avc1` sin aviso de HEVC.
  4. **P3 (dueña).** Contenido > Archivos > Subir archivos: los 12 únicos (11 sin M07; hasta 20 por tanda); **no** subir M02; esperar a que terminen de procesarse los videos.
  5. **P4 (dueña).** Editor del theme Radaelli **sin publicar** (`…/themes/<id>/editor`, nunca el theme live): Inicio > Hero > video M01; Categorías destacadas > 4 bloques (Oasis Natural M03 imagen + M04 video; Aurora Viva M05 + M06, que es el mismo archivo que M01; Espuma de Ola M07 opcional + M08; Salidas de Baño M09 imagen, **crítica** porque la colección tiene 0 productos); Producto > `size_guide_image` = M14 y `size_guide_collection` = Oasis Natural. Guardar.
  6. **P4b a P7 (Claude).** `shopify theme pull --theme <id> --only templates/index.json --only templates/product.json --path <carpeta temporal vacía> --nodelete`; `node shopify-migration/scripts/apply-media-wiring.mjs --template`; completar el mapa con los valores `shopify://…` que escribió el Editor; en seco con `--map=` (cobertura 12/12); luego `--write --snapshot-dir=<carpeta que sobreviva a los temporales>`. El script es todo o nada y deja snapshot con `--restore` [DOC:content/media/03F-media-owner-runbook.md § 7, § 11].
  7. **P8.** Solo para verificar paridad (o Ruta B): `shopify theme push --theme <id> --path shopify-migration/theme-src --only templates/index.json --only templates/product.json --nodelete`. Nunca al theme live.
  8. **P9 (dueña).** Metafields de las 4 colecciones (5 campos cada una = 20): Oasis Natural `cover_image` = M10, x `50`, y `26.68997669`, zoom `1`; Aurora Viva M11, x `43.932724252`, y `69.976846586`, zoom `1.4`; Espuma de Ola M12, x `53.682170543`, y `55`, zoom `1`; Salidas de Baño M13, x `61.627906977`, y `59.972144465`, zoom `1.15`; `cover_video` vacío en las 4. Prerrequisito: el theme con la lectura `.value` de los metafields (RC1.8 la incluye) y `collection_show_banner` en `true` [DOC:content/media/03F-media-owner-runbook.md § 5.3, § 12].
  9. **Logo y favicon (D13, D17).** La Dev Store usa el nombre de la tienda como logo de texto porque `settings.logo` y `settings.favicon` están vacíos [MEDIDO-03G]. El sitio actual muestra una imagen de logo en cabecera y pie; sus fuentes existen en el repo del sitio (`public/logo/radaelli-swimwear.png`, 229.512 bytes, `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`) **y no figuran en las 14 filas del manifiesto de media**: aunque se apruebe A4, la Home seguiría sin logo. La auditoría propone sumarlos como M15 y M16; hoy no existen en el manifiesto [DOC:theme/03G-home-parity.md HP-02; launch/03G-reproducibility-gap-audit.md A17, B16].
  10. **Rebuild del release.** El cableado modifica `theme-src/templates/*.json`: produce un release nuevo (RC1.9 en la numeración de 03G). Reconstruir el ZIP con `node shopify-migration/scripts/build-theme-rc.mjs` (misma versión de Node y zlib para reproducir bytes), volver a subirlo o empujar los 2 templates y comparar remoto = ZIP. La regresión offline no está en el repo (PT4) [DOC:launch/03G-reproducibility-gap-audit.md § 6 punto 4, A15].
  11. **P10.** Verificación en vivo (abajo).
- **Quién.** Dueña: OK de descarga, subida a Archivos, Editor y metafields. Claude: descarga con OK, wiring, pull/push de 2 templates y verificación.
- **Reversibilidad.** Reversible: vaciar los 9 settings, `--restore` del snapshot, vaciar los metafields. **Borrar archivos subidos es permanente**, y una referencia a un archivo borrado queda rota; no hace falta para el rollback.
- **Depende de.** S03, S05 (partes A y B), S04 (para probar la guía en fichas de Oasis Natural), D13.
- **Evidencia de éxito** (§ 10 del runbook, a 375 y 1280 px, país CO):
  - Videos del Hero y de 3 tarjetas: `readyState ≥ 3`, `paused: false`, `muted: true`, `loop: true`, `error: null`; respuestas 200 o 206 desde `cdn.shopify.com`.
  - Las 4 tarjetas con media (3 con video y Salidas de Baño con imagen). La Home usa 7 de los 12 archivos únicos: M01, M03, M04, M05, M07, M08 y M09 (HP-04, HP-05). Con la imagen de M09 desaparece el hallazgo H-01 de `launch/03G-responsive-sweep.md` (tarjeta de categoría sin imagen con contraste bajo: ≈ 2,9:1 en el título, estimado por el degradado).
  - Banners: `imageWidth`/`imageHeight` numéricos 2400/1600, 1920/800, 1920/800 y 3333/5000, con `posX`, `posY` y `zoom` iguales a los valores de P9.
  - Guía de tallas: botón en `/products/brisa-natural-beige` y `dialog.size-guide-dialog img` con URL de `cdn.shopify.com`; en una ficha de Aurora Viva no hay botón.
  - 0 errores propios de consola; sin desborde a 320 px.
  - P6 repetido con el mismo mapa: "nada que escribir"; `pull` del remoto = `theme-src` en los 2 templates.
- **Rollback.** Runbook § 9: vaciar settings en el Editor o `--restore`; vaciar los 4 metafields por colección; los archivos quedan sin efecto. Pasos detallados en `launch/03G-rollback-plan.md`: RP-45.
- **Riesgos conocidos.**
  - HEVC: que Shopify acepte y reproduzca los originales `[NOT_VERIFIED]`; por eso se sube la variante servida H.264.
  - M08 es vertical (1080 × 1920) y la tarjeta es 16:9: se ve una franja central.
  - En iPhone con ahorro de energía el autoplay puede quedar pausado.
  - La sonda de 03F hizo que Cloudinary generara la derivada `c_limit` de M13.
  - Shopify puede agregar un identificador al nombre si hay duplicados.
  - El formato `shopify://…` de las referencias es observado, no documentado: se copia del Editor.
  - Con video, el LCP de la Home será el video del Hero.
- **Lo aprendido en la Dev Store que cambia el orden.** Solo M13 excede los límites; las referencias se copian del Editor y luego se validan; el script de cableado es todo o nada (L20).

---

### S08 · Apps oficiales (Search & Discovery, Google & YouTube, Facebook & Instagram)

- **Qué se hace.**
  1. **Search & Discovery** (`theme/03F-search-discovery-owner-runbook.md`, pasos S1 a S12):
     - Instalar (app de Shopify, gratuita; OAuth de la dueña). **Capturar la pantalla de permisos antes de aceptar** y compararla con la tabla del § 2 del runbook; si pide clientes o pedidos, **no aceptar**.
     - Configurar: quitar Availability y cualquier filtro por defecto que no sea Precio; **Talla** (opción de producto `Talla`, orden Manual S, M, L, L y XL, XL, valores vacíos ocultos, sin agrupar "L y XL" salvo D12 d); **Color** (metafield `custom.color`, orden automático, sin renombrar ni agrupar); **Precio**; orden Talla, Color, Precio.
     - No tocar Search, Recommendations, Synonyms ni Boosts.
     - Correr la matriz QA1 a QA30 a 375 y 1280 px, anotando `Shopify.country` (CO) en cada corrida.
  2. **Google & YouTube:** instalar, conectar la cuenta de Google y la propiedad GA4 (pasos P-10 a P-13 de `analytics/03F-analytics-owner-runbook.md`). **No** conectar Merchant Center ni Google Ads. Con la tienda privada GA4 no registra nada [DOC:analytics/03F-analytics-owner-runbook.md § 2]. **Diferencia con ese runbook:** allí los pasos P-10 a P-13 van después de P-9 (tienda pública); el runbook de corte (CT-09) y este plan los adelantan a la tienda privada, con la app conectada y sin registrar. Que la app se pueda instalar y conectar con la contraseña puesta no está documentado `[INFERIDO, NOT_VERIFIED]`; si no se puede, P-10 a P-13 pasan a la ventana pública (S16) y GA4 queda sin datos hasta entonces.
  3. **Facebook & Instagram: diferida a la ventana pública** (S16). La app exige tienda no privada y activos de Meta (Página publicada, portafolio comercial, dataset); que Colombia sea país soportado para el canal es `[NOT_VERIFIED]` (riesgo R11). Nivel de datos **Standard** hasta que la política de privacidad declare el intercambio de datos (D10).
- **Quién.** Dueña: cuentas, OAuth y credenciales. Claude: configuración de S&D con OK explícito y QA; no entra a Google ni a Meta.
- **Reversibilidad.** Reversible: se desinstala. Qué pasa con los filtros al desinstalar no está en la documentación oficial (solo un indicio de 2022) `[NOT_VERIFIED]`: **el primer rollback es quitar filtros en la app, no desinstalar**. Reinstalar puede no restaurar la configuración.
- **Depende de.** S04 (índice 29/29), S05 (`custom.color` con acceso Storefront), S03; D10 y D12 (d, e, f).
- **Evidencia de éxito.**
  - Talla: S 29, M 29, L 28, "L y XL" 1, XL 11. Color: 12 valores que suman 29 (NEGRO 6, BEIGE 3, BEIGE SUAVE 3, TERRACOTA 3, AZUL 2, AZUL OSCURO 2, NARANJA 2, LILA 2, CAFÉ CLARO 2, VERDE OLIVA 2, MOSTAZA 1, BLANCO 1). Precio: $159.920 (6), $167.920 (9), $183.920 (10), $199.920 (4). **Sin Disponibilidad** [DOC:theme/03F-search-discovery-owner-runbook.md § 4].
  - QA1 a QA30 sin fallos en QA1 a QA19 (GO/NO-GO SD1 a SD4); `/products.json` sigue en 29/98/95 (QA30).
  - Lista de apps instalada capturada; los permisos capturados coinciden con la ficha.
- **Rollback.** Runbook S&D § 9, niveles 1 a 4 (filtro mal configurado, Disponibilidad visible, quitar Talla y Color, desinstalar). Pasos detallados en `launch/03G-rollback-plan.md`: RP-27.
- **Riesgos conocidos.**
  - La pantalla de permisos real puede diferir de la ficha.
  - El nombre del parámetro de talla (`filter.v.option.talla`) y la codificación de "L y XL" o "CAFÉ CLARO" en la URL son `[NOT_VERIFIED]` hasta QA4, QA12 y QA14.
  - En móvil cada chip recarga la página y el cajón vuelve cerrado (O1).
  - Los filtros del sitio actual (Talla con 6 opciones, Color con 8, Precio con 4 tramos y 3 órdenes) **no funcionan como parecen** (`?color=Beige` devuelve 0 y `?color=BEIGE` devuelve 3; `precio=menos-50` devuelve 0 y `precio=mas-200` devuelve los 10): no hay que reproducirlos, y con Search & Discovery la Dev queda mejor. Las URL viejas de filtro (`?talla=S`, `?color=BEIGE`…) conservan el query en la redirección pero Shopify no reconoce esos nombres: la colección abre sin filtrar [DOC:launch/03G-collection-parity.md C-12, C-13, C-14; launch/03G-cutover-runbook.md V-BÚSQUEDA].
  - El theme ofrece 9 opciones de orden y el sitio actual 3 (C-11): recortar la lista es un cambio de theme opcional, no decidido.
  - Los filtros de la app son de la tienda: el theme live por defecto de la tienda comercial también puede mostrarlos (en Dev pasaba con Horizon).
  - "L y XL" deja a esa camiseta fuera del filtro XL si no se agrupa.
- **Lo aprendido en la Dev Store que cambia el orden.** S&D solo sirve con el índice de búsqueda completo (L8). Google & YouTube no registra y Facebook & Instagram no se completa con contraseña, así que la validación real es pública (L15).

---

### S09 · App de favoritos (wishlist)

- **Qué se hace.** **No bloquea el lanzamiento**: `wishlist_enabled` en `true` con `wishlist_account_sync` en `false` deja los favoritos por navegador (invitada) funcionando en el theme; la app agrega sincronización con la cuenta y "Mis favoritos" dentro de la cuenta [DOC:theme-src/README.md; theme/03F-owner-actions-minimal.md]. La decisión es D14. Si se ejecuta, los 14 pasos del runbook `theme/03F-owner-wishlist-install-runbook.md` (orden real: P → 1 → 2 → 3 → 5 → 4 → 6 → 7 → 8 → 9a → 10 → 9b → interruptor → 11 → 12 → 13 → 14):
  1. **Paquete:** `dist/radaelli-wishlist-app-0.1.2.zip`, SHA-256 `19c8c0df68a30533b6e3b953729d525afd784a4518e2dbb6691bc8ddc919e4b2`, 35 entradas. La 0.1.2 solo cambia documentación respecto de la 0.1.1 que cita el runbook de favoritos [DOC:theme/03F-sonnet-independent-completion-report.md sección C]. Que este paquete congelado sirva sin cambios para la app de la tienda comercial (otra app del Dev Dashboard, con su propio identificador y dominio) es `[NOT_VERIFIED]`: el `config link` y el cambio de host modifican `shopify.app.toml` y `extensions/mis-favoritos/src/config.js`, y un cambio en el paquete es un release nuevo de la app (regla 7 de `launch/03G-cutover-runbook.md`, CT-10).
  2. **P y paso 1:** cuenta de desarrolladora y organización en el Dev Dashboard (la dueña); comprobar que la tienda comercial aparece en la **misma organización** que la app (`ADMIN_TOKEN_SOURCE=client_credentials`). **Si no aparece, es NO-GO**: la 0.1.2 no trae la ruta OAuth para un token offline [DOC:app/README.md § 5, § 9.8, § 11.8].
  3. **Paso 2:** `shopify app config link` (con copia previa de `app/shopify.app.toml` y reaplicación de sus secciones); `node --test test` debe dar **155/156** (única falla: la guarda "sin client_id").
  4. **Paso 3: distribución personalizada.** Crear una **app de producción separada** (la app DEV de la Dev Store queda atada a esa tienda). **Irreversible** (ver abajo).
  5. **Paso 5** (antes del 4): hosting Node ≥ 20 con HTTPS, una sola instancia siempre encendida, sin base de datos; opciones sin marca en el runbook.
  6. **Paso 4:** sustituir el host en `shopify.app.toml` y `extensions/mis-favoritos/src/config.js` (`node --test test` = **154/156**); dependencias de la extensión; `shopify app deploy --path . --message "<mensaje>"` (**nunca** `--allow-deletes`); "Allow network access"; instalar aceptando exactamente 5 scopes: `read_customers`, `write_customers`, `read_products`, `write_app_proxy`, `customer_read_customers`.
  7. **Paso 6:** variables `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET` (secreto: solo la dueña), `ALLOWED_SHOPS`, `ADMIN_TOKEN_SOURCE`; humo con 6 respuestas esperadas (`200` en `/`; `401 invalid_signature` en `POST /proxy/wishlist`; `405` en `GET /proxy/wishlist`; `204` en `OPTIONS /ca/wishlist`; `401 missing_token`; `401 invalid_signature` en `/webhooks`).
  8. **Paso 7:** definición de cliente `custom.wishlist` (lista de referencias a producto, acceso "Customer accounts" en lectura, **sin** `list.max`, no `$app`).
  9. **Pasos 8 y 9:** app embed "Favoritos en la cuenta" y extensión "Mis favoritos" en el menú de la cuenta; **paso 10:** código de ingreso (solo la dueña); 9b: URL de "Mis favoritos" en el embed.
  10. **Interruptor `wishlist_account_sync`:** el último; **solo desde el Editor del theme sin publicar** (grupo "Wishlist"), nunca por `theme push` de `settings_data.json`.
  11. **Pasos 11 a 14:** unión invitada → cuenta, prueba entre dispositivos, cierre de sesión, desinstalar y reinstalar.
- **Quién.** Dueña: cuenta de desarrolladora, distribución, instalación y OAuth, hosting y secretos, código de ingreso. Claude: config y pruebas con OK (deploy solo con OK explícito en el chat); nunca ve secretos ni códigos.
- **Reversibilidad.** Niveles del runbook § 7: interruptor OFF (instantáneo), embed OFF, detener la función, `shopify app release --version <anterior>`, desinstalar. **IRREVERSIBLE: elegir la distribución personalizada.** Razón: "no se puede cambiar el método de distribución una vez elegido" y la app queda atada a esa tienda [DOC:theme/03F-owner-wishlist-install-runbook.md § 3 paso 3]. **No reversible tampoco: borrar un producto de prueba (12.7) ni la definición `custom.wishlist` con datos.**
- **Depende de.** S03 (theme para el embed), S13 (código de ingreso), D14; S06 (menú de cuenta) y S10 (el cerrojo de envío se aplica antes, por el orden de los JSON) recomendados.
- **Evidencia de éxito.**
  - T1 = 155/156 y T2 = 154/156 (solo las guardas previas al deploy); 156/156 y 20/20 mutantes de origen [DOC:theme/03F-sonnet-independent-completion-report.md punto 18, 19].
  - Medir el proxy real: `/apps/radaelli/wishlist` (el snapshot de 03G midió `/apps/wishlist`, que no es la ruta de esta app) [DOC:launch/03G-rollback-plan.md § 15 D-02].
  - Las 6 respuestas del humo; los GO/NO-GO obligatorios 1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14 y W1 en verde; los pasos 11 a 13 sin `401 no_customer` ni `invalid_signature`.
  - Tras desinstalar, `custom.wishlist` y su valor sobreviven (paso 14); si no sobreviven, NO-GO.
- **Rollback.** Interruptor y embed en OFF; el theme vuelve al modo invitada sin perder datos. Pasos detallados en `launch/03G-rollback-plan.md`: RP-32 a RP-36; la distribución personalizada es I-01.
- **Riesgos conocidos.**
  - Token de Admin sin ruta offline (arriba).
  - Que la extensión de página completa funcione con distribución personalizada en el plan real es `[NOT_VERIFIED]` (GO/NO-GO 6).
  - Un `theme push` de `config/settings_data.json` apaga el embed y el interruptor porque `theme-src` no los tiene.
  - El runbook de favoritos cita la versión 0.1.1 (y su comando de deploy lleva ese número en el mensaje); `app/OWNER-WORKFLOW.md` y `app/README.md` ya dicen 0.1.2.
  - `theme.liquid` cambió el 2026-09-29; sus números de línea son solo orientativos.
- **Lo aprendido en la Dev Store que cambia el orden.** Se ejecuta **después de S10** para que el cerrojo de envío gratis ya esté aplicado y un push de JSON no lo pise (L7, L21). Una app DEV separada evita atar la producción a la Dev Store (L22).

---

### S10 · Envíos (tarifas, decisión D2)

- **Qué se hace** (runbook `shipping/03F-owner-shipping-runbook.md`; los pasos S0 a S13 son los de ese documento):
  1. **Precondición.** D2 y D5 decididas (D3 solo si se ofrece Express). La zona Colombia ya existe desde S02; si D2 estaba pendiente, tenía solo el tramo gratis.
  2. **Tarifas definitivas** en la zona Colombia según D2 (si D2 ya estaba decidida en S02, S02.4 las creó con esta misma tabla y aquí solo se verifican). Importes sin separador de miles; **nunca un precio vacío**:

     | D2 | Opciones a crear |
     |---|---|
     | a. Tarifa fija | Forma A: 1 opción plana, precio = X (NOT_SET), "Ofrecer envío gratis" con mínimo `299900`. Forma B: opción 1 "Monto del pedido" mín 0, máx 299899,99, precio X; opción 2 mín 299900, máx vacío, precio 0 |
     | b. Costo 0 con nombre honesto | Opción 1 "Monto del pedido" con un nombre que diga que se coordina y **no diga "gratis"**, mín 0, máx 299899,99, precio 0 escrito; opción 2 "Envío estándar gratis", mín 299900, máx vacío, precio 0 |
     | c. Gratis para todos | 1 opción plana "Envío estándar", precio 0 escrito, sin condiciones |
     | Todas | Tiempo de tránsito opcional ("días hábiles" `[NOT_VERIFIED]`); sin Express ni tarifas por peso |

  3. **G1** con país CO: 29/29 disponibles y `add.js` 200.
  4. **Cupones de prueba (dueña):** `QA-PCT10` (10 %), `QA-FIJO-19940` (monto fijo 19.940 COP) y `QA-FIJO-19941` (19.941 COP), de "monto en el pedido", sin compra mínima ni límite de usos. Revisar antes que ningún descuento existente interfiera.
  5. **QA T0 a T12** (Claude con los ayudantes `addItem`, `clearCart`, `cartInfo` y `estimate()`; la dueña tipea la dirección de prueba y aplica los códigos en T5 a T7 y T10; Claude **no escribe datos en el checkout**).
  6. **Borrar los 3 cupones de prueba.**
  7. **Textos de D5:** `threshold_note` de `templates/product.json` y `content/legal/envios.html` según D2; cargar `shipping_url` y, con el cerrojo, `shipping_policy_url` del banner.
  8. **Cerrojo `free_shipping_rate_confirmed`, solo al final** y solo si T1 a T7 y T10 dan "Pasa" para la opción D2 elegida. Pasos: `theme pull` a carpeta temporal si la dueña tocó el Editor; poner `free_shipping_rate_confirmed: true` (y `cart_free_shipping_progress: true` solo con OK) con `free_shipping_threshold: 299900`; empujar al theme sin publicar; verificar T11 [DOC:shipping/03F-owner-shipping-runbook.md § 13]. **Regla de JSON:** ese archivo también guarda el embed y el interruptor de S09; por eso S10 va antes que S09 y cualquier cambio del Editor se trae con `theme pull` antes de empujar.
- **Quién.** Dueña: zona y tarifas, cupones, dirección de prueba en el checkout, textos. Claude: G1, `estimate()`, T*, cerrojo, verificación.
- **Reversibilidad.** Reversible: cerrojo a `false`, cupones (desechables), tarifas y zona (se eliminan). Solo recrear la zona exige trabajo a mano.
- **Depende de.** S02, S04; S03 y S06 (página Envíos, D5) recomendados; D1, D2, D3, D5.
- **Evidencia de éxito** (tabla de resultados T0 a T12, todas "Pasa" o defecto documentado):
  - T0 = G1: 29/29 y 200. T1 (1 × `brisa-natural-beige` S, **199.920**) y T2 (1 × `bikini-shadow-azul-marino` M, **159.920**): según D2 (a: tarifa X; b: opción "por coordinar" de costo 0, anotando cómo la muestra el checkout; c: gratis); **con D2 pendiente: error de envío**.
  - T3 (2 × 159.920 = **319.840**) y T4 (**359.840**): envío gratis.
  - T5 (**287.856** con `QA-PCT10`): no gratis y sin error. T6 (**299.900** con `QA-FIJO-19940`): gratis; si no, bajar el mínimo a 299899,99 y repetir T6 y T7. T7 (**299.899**): no gratis y sin error.
  - T8: mismo resultado en Amazonas y San Andrés y Providencia (zona país completo). T9: registro de qué ve un visitante de otro país (región de respaldo; no compra); el runbook lo define con EE. UU. en Borrador y en la tienda comercial no hay mercado de EE. UU. `[INFERIDO]`, así que se prueba con otro país. T10: la dueña llega a la pantalla de pago sin pagar; ruta `…/es-co`, envío gratis, total 319.840. T11: promesas visibles y ciertas con el cerrojo, y en `/en` "Free shipping on orders of … or more". T12: registrar la diferencia entre la barra del carrito y el checkout con un código escrito en el checkout (menor).
  - Theme Check 0/0 y, si se cambia código y no solo settings, regresión (PT4). El hash del theme cambia respecto de RC1.8; el nombre del release lo decide la dueña.
  - La promesa "Envío gratis en compras desde $ 299.900" **ya está publicada hoy** en la Home, en las 29 fichas y en `/envios` del sitio actual (B-07 de `launch/03G-current-site-baseline.md`): S10 debe cerrarse antes del corte para que el sitio nuevo no calle ni incumpla lo que el actual promete.
- **Rollback.** Runbook § 12: cerrojo `false` y push; restaurar textos; borrar cupones; zona y tarifas; verificar con V2 y V4. Pasos detallados en `launch/03G-rollback-plan.md`: RP-21 a RP-23.
- **Riesgos conocidos.**
  - Precio vacío = gratis.
  - Un hueco entre tramos deja a una clienta sin método de envío.
  - Si el mínimo de Shopify es estricto, T6 falla (se corrige con 299899,99).
  - No se documenta sobre qué valor mide su mínimo "Ofrecer envío gratis" de una tarifa plana (T5 a T7 lo resuelven).
  - D2 b puede mostrar "Gratis" o "$ 0" junto a "por coordinar" y leerse como envío gratis bajo el umbral.
  - `threshold_note` y `envios.html` dejan de ser ciertos con D2 a o c.
  - Los cupones de prueba deben borrarse.
- **Lo aprendido en la Dev Store que cambia el orden.** Zona antes que mercado (L1). El cerrojo se enciende **solo al final** (L23). Si el Editor cambió el theme, `theme pull` antes de empujar (L21). Los importes se escriben sin separador de miles y se comprueba cómo los muestra el Admin.

---

### S11 · Wompi (pagos)

- **Qué se hace** (runbook `payments/03F-wompi-owner-runbook.md`, adaptado a la tienda comercial; los pasos P0 a P6 y P10 son los de ese documento):
  1. **Prerrequisito V1 a V4:** dirección de la tienda en Colombia (S01), Colombia como mercado principal (S02), zona de envío de Colombia con tarifa (S10) y una visitante nueva que resuelve a CO y agrega al carrito (S04). Sin eso no se sigue: no sirve probar pagos con la sesión en EE. UU. [DOC:payments/03F-wompi-owner-runbook.md § 1].
  2. **Fase 0.** Anotar el tipo de tienda y el plan (Configuración > Plan); hoja privada, fuera del repo, para los valores previos que se van a tocar (sin llaves); confirmar con quien lleva el pentest si el staging usa Wompi Sandbox.
  3. **Compuerta W-G1: ¿aparece Wompi en Configuración > Pagos con la dirección en Colombia?** Si no aparece, no se sigue con Wompi: preguntar a Wompi (P1) y a Soporte de Shopify y pasar a la ruta de pasarela de prueba (punto 11), cuya existencia en una tienda de pago es `[NOT_VERIFIED]`.
  4. **Lado Wompi (dueña).** Ubicar las llaves de **pruebas** (`pub_test_`, `prv_test_`); anotar el valor actual de la URL de eventos de pruebas; **resolver W-G3** (ambientes): A secuenciar después del pentest, B segundo comercio o ambiente sandbox para Shopify (pregunta P2), C cambio temporal con restauración; **nunca** apuntar la URL de producción a Shopify antes del corte.
  5. **Configuración > Checkout:** contacto por correo electrónico y teléfono de la dirección de envío **Requerido** (lo exige Wompi; cambia la experiencia de la clienta: D8). Anotar los valores previos.
  6. **Instalar.** Configuración > Pagos > Wompi > `Conectar` > `Instalar app`. **Capturar la pantalla de permisos sin aceptar**; el desarrollador esperado es "Wompi Co"; si aparece algo fuera de pagos (productos, clientes, pedidos, personal, temas), pausar y preguntar (P7); si aparece cualquier pantalla de facturación o plan, **parar** (R3).
  7. **Compuerta W-G2: ¿la app deja conectar solo con credenciales de prueba?** La doc de Wompi carga primero las de producción y después las de prueba. Si no deja, ver riesgos.
  8. **Credenciales de prueba (solo la dueña las escribe en el formulario de la app):** `Conectar en modo prueba`; habilitar los medios (tarjeta, PSE, Nequi, Daviplata, Botón Bancolombia, efectivo) y `Activar`. Ninguna llave va al chat, a capturas, al theme ni a documentos (R2).
  9. **URL de eventos** en Wompi > Desarrolladores > Seguimiento de transacciones, en el ambiente de **pruebas** y solo con W-G3 resuelta.
  10. **Pruebas (dueña tipea; Claude observa).** Casos del § 9 del runbook: 1 éxito (tarjeta `4242 4242 4242 4242`), 2 falla (`4111 1111 1111 1111`, PSE banco 2), 3 pendiente (PSE **no** tiene estado pendiente en el sandbox: usar Daviplata con OTP inválido o Botón Bancolombia; efectivo `[NOT_VERIFIED]`), 4 reembolso total y parcial, 5 la clienta no vuelve a la tienda, 6 duplicados.
  11. **Alternativa sin Wompi: pasarela de prueba de Shopify** (P10.1 a P10.5): se activa desactivando **antes** cualquier proveedor de tarjeta activo, incluido Wompi; tarjetas `1` (éxito), `2` (falla), `3` (excepción). No convive con un proveedor de tarjeta y no valida nada de Wompi. Las fuentes 03F la midieron para la Dev Store: que exista en una tienda de pago y que aparezca con la dirección en Colombia es `[NOT_VERIFIED]` (NV11 del runbook de Wompi; CT-08 del corte).
  12. **Preguntas a Wompi (las envía la dueña; Claude no envía mensajes por ella):** P1 a P9 del § 13 del runbook.
  13. **Producción (en la ventana de S16, no antes).** Credenciales `pub_prod_` y `prv_prod_` **solo en la tienda comercial**, URL de eventos de producción, y apagar Wompi en el sitio Next.js dentro de la misma ventana [DOC:payments/03E-wompi-shopify-feasibility.md § 6, PATH A paso 10]. Orden y detalle en `launch/03G-cutover-runbook.md`:
      - **CT-46:** la dueña escribe las llaves de producción en el formulario de la app; **las llaves se cargan antes de quitar la contraseña**, porque si la tienda saliera pública con llaves de prueba una clienta podría "pagar" con la tarjeta de prueba y generar un pedido sin cobro (`[INFERIDO]`, § 5.2 de ese documento).
      - **La URL de eventos de producción hacia Shopify** se mueve en T-1h solo con el sitio actual pausado (D-CT2 = A) y en T0 si se sigue vendiendo (D-CT2 = B): quien tenga esa URL recibe los eventos y solo hay una por ambiente.
      - **CT-47:** humo con dinero real, con la tarjeta de la dueña y reembolso posterior. Propuesta `[INFERIDO]` del runbook de corte: el producto de menor precio (`bikini-shadow-azul-marino` talla M = $159.920) más el envío que corresponda a D2; producto y monto los decide la dueña (D8, D-CT14). **Es irreversible en dinero y en comisión (PNR-1 y I-04 de `launch/03G-rollback-plan.md`):** el pedido y el cobro son reales, Shopify cobra su comisión de proveedor externo sobre pedidos reales, y el reembolso hacia Wompi es `[NOT_VERIFIED]` (NV6). Con D-CT2 = A se hace en T-1h con la contraseña puesta; con D-CT2 = B, en T+15m.
- **Quién.** Dueña: OAuth, llaves, tarjetas de prueba, mensajes a Wompi, decisión de ambientes. Claude: observa, registra, verifica el Admin en solo lectura y nunca ve llaves ni datos de tarjeta [DOC:payments/03F-wompi-owner-runbook.md reglas R1 a R7].
- **Reversibilidad.**
  - Pruebas: reversible; se desactiva o desinstala (la configuración puede no restaurarse al reinstalar).
  - **IRREVERSIBLE en efecto: cargar credenciales de producción y apuntar la URL de eventos de producción a la integración de Shopify.** Razón: Wompi admite **una URL de eventos por ambiente**, así que cortaría los eventos de `/api/webhooks/wompi` del sitio actual, y un webhook es un POST que ninguna redirección conserva; los pagos en curso se pierden [DOC:payments/03F-wompi-owner-runbook.md § 6; seo/03E-redirect-plan.md § 5.6].
- **Depende de.** S02 (la dirección de la tienda filtra la lista de proveedores), S10; S04 recomendado; D1, D6, D8, D9 (párrafo "Pago" de Términos).
- **Evidencia de éxito.**
  - Capturas de W-G1, W-G2 y W-G3 sin llaves; el checkout ofrece Wompi (o la pasarela de prueba) en lugar de "Esta tienda no puede aceptar pagos en este momento".
  - Tabla de los 6 casos con hora de pago, hora en que aparece el pedido, número de pedido y monto (Wompi trabaja en centavos: $199.920 = 19.992.000). Caso 1: pedido con pago **Pagado**, COP y sin comisión de Shopify. Caso 2: **ningún pedido** y mensaje a la clienta. Caso 5: **bloqueante** si Wompi muestra `APPROVED` y Shopify **ningún pedido** (cobro sin pedido).
  - Acordeón "Métodos de pago" de la ficha re-medido con el proveedor activo (`sections/main-product.liquid`, líneas 259 y 319 a 322 según 03E).
- **Rollback.** Desactivar en Configuración > Pagos; Configuración > Apps > Wompi > Desinstalar; restaurar la URL de eventos anotada y los valores de Checkout anotados [DOC:payments/03F-wompi-owner-runbook.md § 7]. Pasos detallados en `launch/03G-rollback-plan.md`: RP-01 y RP-15 a RP-20.
- **Riesgos conocidos.**
  - **Cobro sin pedido** si la clienta no vuelve: el sitio actual lo resuelve con un cron; en Shopify no hay equivalente y la conciliación es manual por pedido.
  - Reembolsos desde Shopify hacia Wompi por medio de pago: `[NOT_VERIFIED]`; la API de Reembolsos V2 de Wompi se titula "(Sandbox)".
  - Comisión de Shopify por proveedor externo: base **[(productos − descuentos) + impuestos + envío] × tasa**; no aplica a pedidos de prueba [DOC:payments/03F-wompi-owner-runbook.md § 11]. Wompi Plan Avanzado: 2,65 % + $700 + IVA por transacción exitosa; retenciones `[NOT_VERIFIED]` [DOC:payments/03E-wompi-shopify-feasibility.md E19].
  - Si W-G2 = NO en la tienda comercial: la regla R1 del runbook ("ninguna credencial de producción") es de la **Dev Store**. En la comercial el riesgo es otro: los ambientes (W-G3). Cargar credenciales de producción en la app sin activar ni configurar la URL de eventos no tocaría lo que recibe el sitio actual `[INFERIDO, NOT_VERIFIED]`; **solo se hace con la respuesta escrita de Wompi a P1 y decisión de la dueña (D8)**; mientras tanto, la prueba E2E de S14 usa la pasarela de prueba de Shopify **si existe en una tienda de pago (`[NOT_VERIFIED]`: las fuentes 03F la midieron para la Dev Store)**; si no existe, los casos 1 a 5 solo se harían con dinero real y eso exige decisión escrita de la dueña o NO-GO [DOC:launch/03G-cutover-runbook.md CT-08].
  - `conexa.ai` es un tercero que recibe los eventos de pago: hay que declararlo en la política de privacidad (P6).
  - Las reseñas de "Wompi Tarjetas" citan fallas de credenciales en modo prueba.
- **Lo aprendido en la Dev Store que cambia el orden.** La pasarela de prueba de Shopify **no coexiste** con un proveedor de tarjeta activo (L4). La comisión por proveedor externo entra en la decisión del plan (L5). Compuertas W-G1, W-G2 y W-G3 antes de instalar (L13). La lista de proveedores depende de la dirección de la tienda: por eso S01 fija Colombia (L3).

---

### S12 · Analítica

- **Qué se hace** (runbook `analytics/03F-analytics-owner-runbook.md`; los pasos P-1 a P-26 son los de ese documento):
  1. **Decidir D10** y cerrar las puertas: G-MKT (S02 y S10), G-PAGO (S11), G-TIENDA (en qué tienda se lanza y si tiene contraseña), G-ARQ (A o B), G-LEGAL, G-BANNER, G-PUENTE.
  2. **Antes de quitar la contraseña:**
     - Textos legales de Cookies y Privacidad revisados por la dueña (P-6; D9).
     - **Banner de cookies** en Configuración > Privacidad del cliente: desactivar los ajustes automáticos, elegir **Colombia** y cada mercado activo, textos en español (P-7). Sin Colombia en el banner rige "permitir todo".
     - Lista real de cookies con DevTools, sin aceptar y aceptando (P-8): es la evidencia de la frase "Hoy no las usamos".
  3. **En tienda privada (no registra; ver en S08 la diferencia con el orden del runbook y su `[NOT_VERIFIED]`):** crear la propiedad GA4 y el flujo web y anotar el ID de medición (P-10); Google & YouTube conectado (S08); confirmar 0 tags heredados: `theme-src` tiene 0 coincidencias de `gtag`, `googletagmanager`, `fbq(`, `fbevents` y `dataLayer` (P-15).
  4. **En la ventana pública (S16):** poner la tienda pública **solo si P-6 y P-7 están hechos** (P-9); instalar y terminar Facebook & Instagram (P-16 a P-19).
  5. **Píxel personalizado** `analytics/custom-pixel/`: **apagado** (`ENABLED:false`, IDs vacíos) hasta que el puente del theme (G-PUENTE) esté aplicado y los chequeos den verde solo con las apps. Si se activa: `MODE: "gaps_only"`, `GA4_EXTRA_STANDARD_EVENTS` y `META_EXTRA_STANDARD_EVENTS` vacíos, permiso "Required" y "Test" antes de "Connect" (P-20 a P-23).
  6. **Validación** (§ 8 a § 10 del runbook) en S16.b y S17, con la tienda pública.
  7. **IDs:** `GA4_MEASUREMENT_ID` y `META_PIXEL_ID` son NOT_AVAILABLE; los entrega la dueña y no se escriben en ningún documento. No se leyó ningún `.env`.
- **Quién.** Dueña: cuentas de Google y Meta, OAuth, IDs, banner y textos. Claude: observa y verifica; no entra a Google ni a Meta, no acepta OAuth, no escribe contraseñas ni IDs que la dueña no entregó.
- **Reversibilidad.** Reversible: desconectar la integración o desinstalar la app, `Disconnect` del píxel, volver a "Private" (corta GA4), reactivar los ajustes automáticos del banner. **Los eventos enviados con la tienda pública ya están en GA4 y Meta y no se retiran** `[INFERIDO]`; Meta en nivel Enhanced o Maximum comparte nombre, ubicación, correo y teléfono.
- **Depende de.** S02 (región del banner), S06 (textos legales), S11 (para `purchase`); la validación depende de S16; D8 (`purchase`), D9, D10.
- **Evidencia de éxito.**
  - Configuración (tienda privada): apps conectadas en el Admin (Claude no ve contraseñas); banner visible para una visita desde Colombia sin aceptar; lista real de cookies capturada; píxel apagado.
  - Validación (pública): 1 `page_view` y 1 `PageView` por carga; moneda `COP` (Google documenta `USD` por defecto si falta); `page_location` sin `q=`, sin correo ni token; embudo de **11 eventos de GA4 y 7 de Meta** que manda la app, cada uno una vez; consentimiento: K1 rechazar todo = 0 eventos en GA4 y Meta, K2 solo analítica = GA4 sí y Meta 0, K3 aceptar todo = ambos, K4 revocar = corte inmediato; D1 a D13 (sin doble disparo, con y sin píxel); compra: 1 `purchase` con `transaction_id` con valor y 1 `Purchase` deduplicado (V1 a V9); recargar la página de agradecimiento dos veces no suma otro.
  - `refund` **no** está en la lista de eventos de la app: los ingresos de GA4 no bajan al reembolsar (limitación registrada, V9).
- **Rollback.** Runbook § 16 (desconectar Google y Meta, `Disconnect` del píxel, "Private", banner automático). Pasos detallados en `launch/03G-rollback-plan.md`: RP-28 a RP-31; lo ya enviado es I-09.
- **Riesgos conocidos.** R1 a R13 del runbook: sin pasarela `purchase` es imposible; modo privado (sin datos en GA4); C1 y C2 sin resolver (moneda `USD`); sin Colombia en el banner; texto de cookies o de privacidad desactualizado; redirección de Wompi sin retorno (GA4 subcuenta ventas; comparar pedidos de Shopify con `purchase` de GA4 las primeras semanas); doble disparo por `MODE: "full"` o por extras; país no soportado para el canal de Meta (`[NOT_VERIFIED]` para Colombia); los eventos `radaelli:*` se pueden falsificar desde la consola y no se usan como conversión de optimización; que DebugView capture el checkout es `[NOT_VERIFIED]` (plan B: informe Realtime).
- **Lo aprendido en la Dev Store que cambia el orden.** Con contraseña, GA4 no registra, la app de Meta no se termina y el Pixel Helper de Shopify no funciona: la validación real es pública (L15). Banner con Colombia **antes** de quitar la contraseña. La política de Cookies dice "Hoy no las usamos" y Shopify lista cookies propias de analítica y marketing: hay que verificarlo en vivo.

---

### S13 · Cuentas de cliente

- **Qué se hace.**
  1. **Verificar o activar las cuentas de cliente nuevas** (Configuración > Cuentas de cliente). En la Dev Store: cuentas nuevas alojadas por Shopify, enlaces de ingreso ON, devoluciones de autoservicio OFF, crédito en tienda ON [MEDIDO-03G]. En la tienda comercial el valor por defecto es `[NOT_VERIFIED]`. El theme **no** necesita plantillas legacy (`templates/customers/*` no existen); el header usa `<shopify-account>` y el menú `customer-account-main-menu`.
  2. **Código de ingreso real (la dueña).** Abrir `https://<tienda-comercial>/?preview_theme_id=<id>` > ícono de cuenta > correo de la cuenta > escribir el código de 6 dígitos. **Claude no lo lee ni lo pide.** Después Claude verifica con ella: la cabecera muestra la sesión (la inicial); `/account` abre la cuenta nueva de Shopify; en ventana de incógnito `/account/login` y `/account/register` llevan a las páginas de Shopify, no a plantillas legacy [DOC:theme/03F-owner-wishlist-install-runbook.md § 3 paso 10].
  3. **GO/NO-GO de cuentas:** #1 (a) `customer` en Liquid con sesión y `<shopify-account>` en una página; (b) en ficha y colección (necesita el catálogo de S04); (c) otras vías (hoja de `<shopify-account>`, Shop, `storefront_login_url`) y vencimiento a las 24 h, como seguimiento. #9: el POST legacy a `/account` **no se prueba** (podría crear datos y Claude no puede borrarlos) [DOC:theme/03B-store-foundation-report.md puntos 23 a 29].
  4. **Datos de clientas y pedidos (D11): no ejecutable con lo que hay hoy.** El repo no contiene un export de clientes ni de pedidos; la base de producción no se consultó y el rol de solo lectura documentado en `MANUAL_STEP_REQUIRED.md` cubre catálogo. Lo que dice la auditoría de viabilidad [DOC:launch/evidence/reference-docs/data-migration.md]:
     - Clientes y direcciones: migrables por CSV nativo de Shopify.
     - **Contraseñas: no migrables** (hashes scrypt y SHA-256 sin sal); el modelo nuevo de Shopify usa código por correo. Todas las clientas con cuenta pasan a un primer ingreso con código: hay que comunicarlo, no improvisarlo.
     - Pedidos históricos: la herramienta está por decidir; preservar el número exige configuración explícita.
     - No migrar pedidos de prueba; resolver antes los pedidos con `flaggedForReviewAt` sin resolver.
     - Cupones: migrar solo los activos (lista NOT_AVAILABLE); el contador de usos se recrea.
  5. **Correos.** Shopify Notifications cubre confirmación de pedido y envío; el aviso de reposición no es nativo; el boletín del theme (`newsletter-home`) crea un cliente con la etiqueta `newsletter` mediante `{% form 'customer' %}`, y el marketing por correo es otra herramienta. La política de privacidad actual no menciona el boletín [DOC:launch/evidence/reference-docs/seo-analytics.md § 11; theme-src/sections/newsletter-home.liquid; theme/03F-legal-owner-runbook.md § 7.2].
- **Quién.** Dueña: código de ingreso, decisiones de D11, comunicación a clientas, cualquier importación. Claude: verificación posterior y GO/NO-GO.
- **Reversibilidad.** Configuración: reversible. **Importar clientes crea registros reales que Claude no puede borrar** (así lo dejó 03B con el POST legacy); solo la dueña puede eliminarlos desde el Admin. Si la importación envía correos de invitación es `[NOT_VERIFIED]`.
- **Depende de.** S03; S04 (GO/NO-GO #1 b) y S06 (redirecciones `/cuenta*`) recomendados; D1, D11.
- **Evidencia de éxito.** GO/NO-GO #1 (a) en verde con la dueña presente; los 9 `/cuenta*` redirigen (S06); `/account` y el ingreso funcionan en la tienda comercial; `customer` presente con sesión y ausente sin ella; el ingreso sale en español y con región de Colombia (en la Dev salía `es-US` por la entidad en EE. UU.) y `/cuenta/iniciar-sesion` y `/cuenta/recuperar-contrasena` terminan en el ingreso por código [DOC:launch/03G-cutover-runbook.md V-CUENTAS].
- **Rollback.** Cerrar sesión; la configuración de cuentas se revierte en el Admin. No hay rollback de clientes importados desde Claude. Pasos detallados en `launch/03G-rollback-plan.md`: RP-41 y RP-42.
- **Riesgos conocidos.** El código de ingreso solo lo escribe la dueña (bloqueo `DEFERRED_OWNER_ONLY_BLOCKER` en Dev desde 03B); `/account*` salta al dominio de cuentas de Shopify (un salto de plataforma, no de las redirecciones); fricción de UX por el cambio de contraseña a código; si la dirección de la tienda no es Colombia, el login sale con región EE. UU.
- **Lo aprendido en la Dev Store que cambia el orden.** Las cuentas nuevas ya venían activas y el theme no necesita plantillas legacy (L29). El código de ingreso bloqueó 03B durante todo el trabajo: agendar a la dueña temprano.

---

### S14 · E2E en la tienda comercial (pedidos de prueba)

- **Qué se hace** (con la contraseña activa, el theme sin publicar en preview y la sesión en CO):
  1. **Precondiciones:** S02, S04, S05, S06, S10 (tarifas definitivas y cerrojo), S11 (proveedor de prueba) y S13.
  2. **Elegir el modo de prueba (D8):** **una sola** pasarela activa a la vez. (A) Pasarela de prueba de Shopify: no valida Wompi. (B) Wompi en modo prueba: valida redirección y eventos. No coexisten.
  3. **Casos:**
     - **Checkout** abre en `es-co`, país Colombia, departamentos de Colombia y formato "$ 199.920" (V6; `[NOT_VERIFIED]` hasta medirlo); teléfono obligatorio si D8 lo decide.
     - **T0 a T12** (S10) y los **6 casos de pago** de S11 (o P10.1 a P10.5 con la pasarela de prueba): pedido en COP con el envío de la zona CO, página de agradecimiento, correo de confirmación de pedido (`[NOT_VERIFIED]`: necesita un pedido), reembolso y cancelación.
     - **Móvil a 390 px** con la ventana visible o el móvil real de la dueña: resumen del pedido, idioma y país por defecto, orden de los campos, botón de pago y volver al carrito. **No completar el pago** en esa comprobación [DOC:theme/03F-mobile-checkout-baseline.md § 4].
     - **Migas de las 29 fichas con RC1.8:** `Inicio / <colección> / <título>` en 29/29 y `BreadcrumbList` acorde. Hasta re-medir, 4 productos siguen en `DIFFERENCE` (F-02) [DOC:launch/03G-product-parity.md § 6].
     - **Paridad con el sitio actual**, contra los documentos de 03G, que dan el estado de partida:
       - Productos (`launch/03G-product-parity.md`): 24 de 29 sin diferencia no intencional en la ficha y 5 con una propia (F-01 y F-02); los 29 con F-03 (orden en la colección) y F-04 (inventario) abiertas, por lo que su `overall` es `DIFFERENCE` en los 29.
       - Rutas (`launch/03G-route-parity.md`): 101 filas: 1 `PASS`, 43 `PASS_WITH_INTENTIONAL_CHANGE`, 32 `BLOCKED_BY_OWNER`, 5 `MISSING`, 20 `NOT_APPLICABLE`; ninguna función quedó en `MATCH`.
       - Colecciones (`launch/03G-collection-parity.md`): membresía IGUAL en las 6; orden DISTINTO; banners sin imagen hasta S07; filtros hasta S08.
       - Home (`theme/03G-home-parity.md`): 37 filas: 12 `matched`, 3 `sourced-but-owner-upload-pending`, 9 `editorial-pending`, 2 `intentionally-hidden`, 11 `DIFFERENCE`; toda la evidencia de la Home es con país US, así que se recaptura con país CO (HP-18).
       - Criterios de aceptación de `launch/03G-launch-acceptance-checklist.md` (documento hermano; no existía a las 18:00).
     - **Regresión:** matrices responsive de 03C (78/78) y 03E (63/63) y el barrido de 03G (136/136: 8 anchos × 17 superficies, 0 desbordes, 0 imágenes rotas, 0 claves sin traducir) como referencia, con la salvedad de que es una medición de DOM con la ventana oculta y no visual [DOC:launch/03G-responsive-sweep.md]; repetir el smoke en Home, colección, ficha, carrito, búsqueda, favoritos y contraseña a 1280, 390 y 320 px; Theme Check 0/0.
     - **Ensayo del corte en la tienda protegida:** los pasos CT-21 a CT-33 del runbook de corte (pedido de prueba, fallo, pendiente, reembolso, la clienta no vuelve, teléfono real, ingreso por código, favoritos, búsqueda, humo del theme, redirecciones, deriva del sitio actual, TTL efectivo) son la versión con marcas de tiempo de este paso [DOC:launch/03G-cutover-runbook.md § 6, T-4h].
     - **SEO en el preview:** canonical propio, hreflang `x-default`/`es`/`en`, JSON-LD y `noindex` en búsqueda, favoritos y 404 [DOC:seo/03F-seo-final-validation.md § 1].
     - **LCP, FCP y CLS:** no se pudieron medir en Dev (ventana oculta, sin entradas de paint); se miden con la ventana visible o, ya público, con PageSpeed sobre la URL pública (S17) [DOC:theme/03F-performance-final.md § 1].
  4. **Limpieza:** cupones de prueba borrados, carritos vaciados, pedidos de prueba cancelados o archivados, sesión de vuelta en CO.
- **Quién.** Dueña: teclea la dirección, los datos de tarjeta de prueba y aplica los cupones. Claude no escribe datos en el checkout de una tienda que no es un host local de desarrollo; observa, mide y registra la tabla de resultados.
- **Reversibilidad.** Los pedidos de prueba **quedan en el historial y avanzan el contador de pedidos**; si se pueden eliminar o renumerar es `[NOT_VERIFIED]` (por eso D11 se decide antes). El resto se revierte (cancelar, borrar cupones, restaurar pasarela).
- **Depende de.** S03, S04, S05, S06, S10, S11, S13 (duros); S07, S08, S09, S12 (blandos); D2, D8, D11, D19.
- **Evidencia de éxito.** Tabla de resultados completa con "Pasa" o "Falla" y captura por fila: T0 a T12; casos de pago; 29/29 migas; 0 errores propios de JS; catálogo 29/98/95 sin cambios; lista de pedidos de prueba con su número. Nada se marca "PASS" sin la captura.
- **Rollback.** Cancelar pedidos de prueba, restaurar la pasarela, borrar cupones. Pasos detallados en `launch/03G-rollback-plan.md`: RP-18, RP-20 y § 8.10.
- **Riesgos conocidos.**
  - Los pedidos de prueba consumen números de pedido.
  - Un pedido real por error si se usan llaves de producción.
  - `es-co` y el formato de importes sin medir.
  - El correo de confirmación no se ha visto nunca.
  - F-02 de `launch/03G-product-parity.md` sin re-medir con RC1.8.
  - Toda la evidencia de Home, colecciones y fichas de 03G es con país US y con capturas de RC1.7.
- **Lo aprendido en la Dev Store que cambia el orden.** Siempre con país CO: la sesión guarda el país y con US todo parecía bien (L14). La pasarela de prueba no convive con Wompi (L4). LCP, FCP, CLS y checkout móvil no se pudieron medir con la ventana oculta (L24).

---

### S15 · Dominio (DNS/SSL)

S15 se divide en tres partes; la ventana completa está en el § 7.

- **Qué se hace.**
  - **S15.a: preparación (antes de la ventana; reversible).**
    1. Identificar el registrador y el proveedor de DNS de `radaelliswimwear.com` y quién tiene el acceso (D16). **NOT_AVAILABLE** en las fuentes; hoy el dominio apunta a Vercel [DOC:launch/evidence/reference-docs/migration-roadmap.md § 18].
    2. **Guardar una captura de todos los registros DNS actuales** (web, correo, verificaciones) para el rollback. No tocar registros de correo ni de verificación que no sean del sitio web `[PRÁCTICA-GENERAL]`.
    3. En el Admin de la tienda comercial (Configuración > Dominios; nombre en español `[NOT_VERIFIED]`), agregar `radaelliswimwear.com`. Shopify muestra los registros exactos que hay que crear: **NOT_AVAILABLE aquí** (no se escriben IPs ni valores en este documento) `[PRÁCTICA-GENERAL]`.
    4. **Dominio primario = apex** (`radaelliswimwear.com`), porque el sitio actual es apex. Si queda `www`, cada URL vieja suma un salto de dominio antes del redirect de ruta (cadena de 2; Google pide evitarlas) [DOC:seo/03E-redirect-plan.md § 5.4]. Qué hace `www`: D16.
    5. `[PRÁCTICA-GENERAL]` Bajar con antelación el TTL de los registros web que se van a cambiar (apex y `www`), para que un rollback tarde minutos y no horas. La antelación debe ser mayor o igual al TTL anterior: si el TTL anterior es mayor que el tiempo que falta hasta T0, **se mueve T0, no se acorta**. El valor lo fija la dueña con su proveedor (NOT_AVAILABLE); la auditoría solo dice que la propagación tarda "minutos a horas según TTL" [DOC:launch/evidence/reference-docs/migration-roadmap.md § 18.6; launch/03G-cutover-runbook.md CT-13, CT-33, V-DNS].
    6. Si existen registros CAA, comprobar que no impidan que Shopify emita su certificado; si lo impiden, ajustarlos antes de T0 `[PRÁCTICA-GENERAL]` [DOC:launch/03G-cutover-runbook.md V-DNS punto 3].
    7. **Acceso al sitio actual sin el dominio:** la dueña anota la URL propia del proyecto en Vercel y entra por ella a `/admin/pedidos`; tras T0, `radaelliswimwear.com/admin` ya no llega al sitio actual. Que el panel funcione por esa URL es `[NOT_VERIFIED]` (CT-14).
    8. Confirmar en Search Console que la dueña tiene la propiedad del mismo dominio; no hace falta "Change of Address" [DOC:seo/03E-redirect-plan.md § 7.5]. Estado de la propiedad: NOT_AVAILABLE.
    9. **Sondeo "antes"** (referencia para detectar la propagación): `curl.exe -sI https://radaelliswimwear.com/producto/bikini-foam` debe dar 200 (sitio actual; en Shopify daría 301) y `robots.txt` debe seguir siendo el del sitio actual (228 bytes hoy, frente a 3.642 en la Dev Store) [MEDIDO-03G; DOC:launch/03G-cutover-runbook.md CT-56].
  - **S15.b: cambio de DNS (dentro de la ventana; T0).** La dueña, o quien tenga el acceso al proveedor, edita **solo** los registros web (apex y `www`) con **exactamente** lo que muestra la pantalla de dominios de Shopify; no toca MX, TXT ni CAA; guarda los valores anteriores. **T0 es el instante en que guarda el cambio** [DOC:launch/03G-cutover-runbook.md § 2 punto 3, CT-61]. Después: verificar la conexión del dominio en Shopify y fijar el primario (CT-62); sondear la propagación con el mismo `curl` del punto 9 (pasa de 200 a 301) y `nslookup radaelliswimwear.com` contra dos resolvers públicos (CT-63).
  - **S15.c: SSL y verificación (dentro de la ventana).**
    1. El certificado de `https://radaelliswimwear.com` lo gestiona Shopify una vez que el DNS propaga `[PRÁCTICA-GENERAL]`; **no está documentado en el repo** `[NOT_VERIFIED]`, y hasta que se emita puede haber advertencias de certificado (duración NOT_AVAILABLE).
    2. Comprobar **sin `-k`** que `curl.exe -sSI https://radaelliswimwear.com/` y la misma llamada con `www` devuelven cabeceras sin error de certificado, que el certificado cubre apex y `www` y está vigente, que `http://` redirige a `https://` (comportamiento de Shopify `[NOT_VERIFIED]`) y que la variante no primaria da un salto al primario (V-SSL de `launch/03G-cutover-runbook.md`).
    3. **Redirecciones** [DOC:seo/03E-redirect-plan.md § 7 punto 4; herramienta offline `node launch/tools/03g-cutover-redirect-matrix.mjs [BASE_URL]`, que lee el CSV, comprueba los conteos e imprime los comandos sin hacer peticiones], desde `shopify-migration/`:

       ```sh
       tail -n +2 seo/shopify-redirects-import.csv | while IFS=, read -r from to; do
         code=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://radaelliswimwear.com$from")
         echo "$from -> $code (esperado 301 $to)"
       done
       ```

       Cada origen debe dar `301` con `Location` igual al destino y cada destino 200 (salvo `/account*`, que salta a otro dominio). Sumar a mano `/buscar?q=bikini` y `/producto/bikini-foam?talla=M` (query conservado), `/accesorios` y `/hombre` (404 esperado) y `/robots.txt` (regla por defecto sobre `/policies/`).
    4. Search Console: enviar el `/sitemap.xml` de Shopify.
- **Quién.** Dueña: registrador, DNS, dominio en Shopify. Claude: los `curl` de verificación (solo lectura) con OK.
- **Reversibilidad.**
  - S15.a: reversible.
  - **S15.b: IRREVERSIBLE por regla de este plan.** Razón: la auditoría de viabilidad lo describe como reversible volviendo a apuntar el DNS a Vercel mientras el sistema viejo siga intacto y pagado [DOC:launch/evidence/reference-docs/migration-roadmap.md § 18.7]; este plan lo trata como irreversible porque, una vez que entran pedidos en Shopify, volver reparte pedidos y pagos entre dos sistemas, y la propagación no es instantánea ni uniforme (durante el TTL y con cachés hay visitantes en ambos sitios) `[INFERIDO]`. Por eso D18 mantiene el sitio actual intacto.
- **Depende de.** S06 (redirecciones cargadas), S14 (E2E en verde); para S15.b y S15.c también S16.a (theme publicado dentro de la ventana); S12 (banner) recomendado; D15, D16, D17.
- **Evidencia de éxito.**
  - Las 47 redirecciones (51 con las legales) responden `301` a su destino y cada destino 200; `/accesorios` y `/hombre` responden 404.
  - `https://radaelliswimwear.com/` responde 200 con certificado válido; el dominio primario es el apex.
  - `robots.txt` y `sitemap.xml` de Shopify responden 200; `canonical` y hreflang con el dominio real.
  - El nombre "Radaelli Swimwear Dev" ya no aparece en títulos ni `og:site_name` (hallazgo 5 de `seo/03F-seo-final-validation.md`).
- **Rollback.** Volver a apuntar los registros del sitio web a Vercel según la captura de S15.a; restaurar la URL de eventos de Wompi de producción al sitio actual; no desmantelar Vercel, Neon ni el código; las redirecciones de Shopify quedan (no afectan al sitio viejo). Pasos detallados en `launch/03G-rollback-plan.md`: RP-08 a RP-14; el rollback total va en orden inverso al corte (§ 12 de ese documento).
- **Riesgos conocidos.**
  - Propagación y certificado.
  - Primario en `www` (cadena de 2).
  - Se rompe el correo si se tocan registros que no son del sitio web.
  - Pagos en curso y eventos de Wompi hacia `/api/webhooks/wompi` se pierden al mover el DNS.
  - Las 4 URL legales y las del blog dan 404 si faltan sus páginas o sus filas.
  - Volatilidad temporal de ranking aun con redirecciones perfectas (riesgo genérico de toda migración de URLs).
- **Lo aprendido en la Dev Store que cambia el orden.** Las redirecciones ya se probaron en el dominio de desarrollo; falta la prueba con `curl -I` en el dominio real (L17). El dominio real cambia los títulos y canonicals (L16).

---

### S16 · Publicar

- **Qué se hace** (dentro de la ventana del § 7). **Orden interno**, igual que en `launch/03G-cutover-runbook.md`: rastreo final del sitio actual (CT-43) → verificar el release (CT-44) → publicar el theme y asignar `page.wishlist` (CT-45) → Wompi a producción (CT-46) → humo con dinero real (CT-47, con D-CT2 = A) → quitar la contraseña (CT-51) → redirecciones y humo público sobre `<tienda>.myshopify.com` (CT-52, CT-53) → **T0: DNS (S15.b)** → verificación final (S16.b). Con D-CT2 = B (se sigue vendiendo en el sitio actual), la URL de eventos de CT-46 pasa a T0 y CT-47 a T+15m, ya con dominio público [DOC:launch/03G-cutover-runbook.md § 5.2].
  - **S16.a: publicar.**
    1. **Rastreo final del sitio actual y paridad** (CT-43): `03g-crawl-current-site.mjs` y `03g-product-parity.mjs`, con copia previa de sus carpetas (PT3). Aplicar en Shopify las diferencias de catálogo, precio o stock que aparezcan (D12). **Pasa** si solo cambió el stock por pedidos entrados; cualquier cambio de título, precio, tallas, imágenes o categoría se reconcilia en Shopify antes de seguir. Las cantidades por talla del sitio actual **no** se cargan sin la confirmación de la dueña.
    2. **Verificar el release congelado** (CT-44). Desde T-24h no cambia el theme, la app, el CSV de redirecciones ni `content/legal/*`. `theme pull` a carpeta temporal para capturar lo que el Editor cambió desde S07, S09 y S10 y comparar contra el ZIP del release final. Los cambios esperados respecto de RC1.8 son solo: referencias de media (S07), embed y `wishlist_account_sync` (S09, si se hizo), cerrojo de envío (S10), `shipping_url` (S06) y los cambios de theme que la dueña haya autorizado (D20). Registrar el hash del theme resultante (el nombre del release lo decide la dueña); Theme Check 0/0; `node launch/tools/03g-release-freeze.mjs "<HH:MM>"` genera `launch/03G-release-freeze.md` con los SHA-256 de lo congelado.
    3. **Publicar el theme Radaelli** (Admin > Tienda online > Temas > Publicar; la dueña).
    4. **Asignar la plantilla `page.wishlist` a la página `favoritos` en el mismo paso** (el Admin solo ofrece plantillas del theme publicado). Comprobar que el header enlaza `/pages/favoritos` limpio y que `/favoritos` y `/cuenta/favoritos` redirigen en 200 [DOC:theme/03B-store-foundation-report.md Resumen 5; seo/03E-redirect-plan.md § 7.1].
    5. Confirmar los flags: `free_shipping_rate_confirmed` según S10, `wishlist_account_sync` según S09, píxel personalizado apagado salvo decisión (S12).
    6. **SEO (D17):** meta description de la Home con el texto de la dueña; regla de `robots.txt` sobre `/policies/`; limpiar `/pages/contact`, `/pages/data-sharing-opt-out`, `/blogs/news`, `/collections/frontpage`, `/collections/all` y `/collections/destacados` según lo decidido; nombre de la tienda sin "Dev"; título de la Home, imagen social y JSON-LD de organización (HP-11).
    7. **Wompi de producción** (S11.13; CT-46 y CT-47): credenciales de producción **antes de quitar la contraseña**, URL de eventos de producción según D-CT2 y humo con dinero real; "apagar" Wompi en el sitio Next.js se lee como dejar de recibir ventas, no dar de baja la infraestructura (PT5).
    8. **Quitar la contraseña** (Tienda online, acceso "Public"; CT-51, en la marca T-15m), **solo si P-6 y P-7 de S12 están hechos** y con el theme ya publicado, G-BANNER y G-LEGAL cerradas y las 4 legales publicadas. Desde ese momento la tienda es pública en `<tienda>.myshopify.com` y un buscador puede rastrearla `[PRÁCTICA-GENERAL]`; es reversible con efecto.
  - **S16.b: verificación final** (después del cambio de DNS), sobre el dominio real:
    - 29/29 fichas: 200, canonical propio, hreflang `x-default`/`es`/`en`, JSON-LD `ProductGroup` + `BreadcrumbList`, 1 `h1`, meta description presente, sin `noindex`.
    - Colecciones (4 + Destacados): 200, canonical propio; con `?sort_by=` o filtros el canonical apunta a la URL base.
    - Legales: 200, canonical propio, indexables. `noindex` en búsqueda, favoritos (URL simple y `?view=wishlist`) y 404.
    - `sitemap.xml`: 29/29 productos, 0 faltantes; `robots.txt` bloquea `/cart`, `/checkout`, combinaciones de filtros y `sort_by`.
    - Home 200, `/en` (si D7), carrito, checkout abre en `es-co` (sin pagar).
    - Validación de analítica del § 8 a § 10 del runbook de S12.
    - Referencia de método: `seo/03F-seo-final-validation.md` § 1 [DOC].
- **Quién.** Dueña: publicar, quitar la contraseña, credenciales de producción de Wompi, DNS. Claude: congelamiento, rastreo, verificación y matriz; **no publica sin OK explícito de la dueña**.
- **Reversibilidad.** **IRREVERSIBLE: publicar el theme.** Razón: cambia lo que ven las clientas y dispara la indexación; volver a publicar el theme anterior desde el Admin es posible `[INFERIDO]`, pero no deshace lo ya rastreado, los pedidos ni la asignación de plantillas. Reversibles: asignar `page.wishlist` (se desasigna), quitar la contraseña (volver a "Private", que además corta GA4). **Credenciales de producción de Wompi y su URL de eventos: irreversibles en efecto** (S11).
- **Depende de.** S14, S15.a; S12 (P-6 y P-7 son duros: no se quita la contraseña sin ellos; el resto es blando) y S09 blandos; para S16.b también S15.b; D2 (cerrojo), D5, D7 (hreflang), D8, D9, D16, D17, D19.
- **Evidencia de éxito.**
  - `shopify theme list --store <tienda-comercial>`: Radaelli `[live]` y el theme anterior `[unpublished]`.
  - Matriz de S16.b en verde y tabla ANTES/DESPUÉS.
  - Catálogo 29/98/95 (o 29/97/95 si D12 a) sin cambios respecto de S14.
- **Rollback.** Publicar de nuevo el theme anterior; volver a "Private"; rollback de DNS de S15; desactivar Wompi de producción y restaurar la URL de eventos del sitio actual. Pasos detallados en `launch/03G-rollback-plan.md`: RP-03, RP-05 a RP-07 y RP-11.
- **Riesgos conocidos.**
  - El sitio actual cambió después del último rastreo (F-01 de `launch/03G-product-parity.md`).
  - Un push de `config/settings_data.json` desde `theme-src` apaga el embed y el interruptor de S09 y pisa el cerrojo si el Editor cambió algo.
  - Contraseña quitada antes del banner de cookies: rige "permitir todo".
  - Sitemap con páginas no deseadas.
  - Home sin meta description.
  - Publicar sin haber asignado `page.wishlist`: el header queda con `?view=wishlist`.
- **Lo aprendido en la Dev Store que cambia el orden.** El theme se publica **al final** (L6) y en ese mismo paso se asigna `page.wishlist`. Un push de JSON pisa lo hecho en el Editor: `theme pull` antes de empujar (L7, L21). El sitio actual deriva: rastrear otra vez justo antes del corte (L31).

---

### S17 · Post-lanzamiento

- **Qué se hace.**
  1. **Conciliación de pagos.** Comparar pedidos de Shopify con pagos de Wompi; conciliar a mano los pagos aprobados sin pedido (no existe un cron equivalente al del sitio actual) [DOC:payments/03E-wompi-shopify-feasibility.md § 4]. La compra real de bajo monto con reembolso, si D8 la decidió, ya se hizo en CT-47 (S16); aquí se concilian sus efectos (pedido, cobro, reembolso, comisión) y se sigue el primer pedido real de punta a punta (CT-85, CT-91).
  2. **Analítica.** Completar la validación de S12 si quedó pendiente; comparar `purchase` de GA4 y `Purchase` de Meta con los pedidos de Shopify durante las primeras semanas (riesgo R8); registrar las dimensiones personalizadas en GA4 (los datos aparecen 24 a 48 h después de que llegan los parámetros); decidir el puente del theme y el nivel de Meta.
  3. **SEO.** Vigilar en Search Console "No encontrada (404)" y "Página con redirección" durante 4 a 8 semanas; mantener las redirecciones **al menos 1 año**; decidir `/accesorios` con Search Console; revisar `robots.txt` y el sitemap [DOC:seo/03E-redirect-plan.md § 7.5, § 7.6].
  4. **Rendimiento.** LCP, FCP y CLS reales con PageSpeed sobre la URL pública y checkout a 390 px, que no se pudieron medir en Dev [DOC:theme/03F-performance-final.md § 1].
  5. **Facturación.** Configuración > Facturación > "Transaction fees" de la primera factura real (¿cobra Shopify la comisión de proveedor externo a Wompi?, NV14); revisar el plan. Claude no acepta facturación.
  6. **Wompi.** Respuestas por escrito a P1 a P9; reembolsos reales por medio de pago; retenciones.
  7. **Apps y favoritos.** Ejecutar S09 si se difirió; puente del theme (G-PUENTE); boletín y aviso de reposición (D20).
  8. **Legales.** Actualizar Términos ("Pago"), Privacidad (terceros, Meta, `conexa.ai`) y Cookies con la analítica y los pagos finales; cerrar la puerta G-PRIV y G-COOK.
  9. **Retiro del sitio actual (D18).** **No desmantelar** Vercel, Neon ni el código hasta tener "varias semanas de operación estable confirmada" en Shopify (el número lo fija la dueña); antes de apagar, exportar lo que D11 decida y retirar el webhook y el cron de Wompi del sitio viejo [DOC:launch/evidence/reference-docs/migration-roadmap.md § 18.7].
  10. **Documentación.** Marcar como resueltos en `analytics/03E-analytics-plan.md` § 13 y `payments/03E-wompi-shopify-feasibility.md` § 9 los NOT_VERIFIED que se cierren con lo medido; el reporte de cierre lo redacta Claude.
- **Quién.** Dueña: facturación, Search Console, Wompi, decisiones. Claude: mediciones, conciliación, documentación.
- **Reversibilidad.** Mayormente reversible. **Apagar o desmantelar el sitio actual es irreversible en la práctica**: por eso D18 exige criterios y tiempo antes de hacerlo.
- **Depende de.** S16; D11, D18.
- **Evidencia de éxito.**
  - Cada pago aprobado en Wompi tiene su pedido en Shopify; la diferencia entre `purchase` de GA4 y pedidos está explicada.
  - Search Console sin errores 404 nuevos en las URL indexadas antes del corte (sin umbral numérico: lo fija la dueña).
  - Las redirecciones siguen respondiendo 301.
  - Primera factura revisada; respuestas de Wompi archivadas.
- **Rollback.** Mientras el sitio actual siga intacto, el DNS puede apuntar de nuevo a Vercel (S15). Pasos detallados en `launch/03G-rollback-plan.md`: RP-47 a RP-55 y § 8.9.
- **Riesgos conocidos.** Cobro sin pedido; volatilidad temporal de ranking; inventario no rastreado (sobreventa) si D12 b no lo resolvió; reembolsos sin camino confirmado; documentos legales desactualizados; retiro prematuro del sistema viejo.
- **Lo aprendido en la Dev Store que cambia el orden.** Analítica y rendimiento reales solo se miden con la tienda pública (L15, L24). La conciliación de pagos es manual (L13).

---

## 6. Lecciones de la Dev Store aplicadas (índice)

Cada fila dice qué pasó en la Dev Store, dónde está documentado y cómo cambia este plan. Las citas de los reportes 03A, 03B, 03C y 03F usan "punto" o "Resumen" según su numeración interna.

| # | Qué pasó en la Dev Store | Documento de origen | Paso que cambia y cómo |
|---|---|---|---|
| L1 | Con Colombia como país por defecto y sin zona de envío, los 29 productos figuran agotados (0/29, `add.js` 422). El orden correcto es **zona de envío primero, mercado principal después**; 03E § 5.3 tenía el orden inverso | `theme/03F-owner-market-colombia-runbook.md` § 3.2 H1; `launch/03G-checkout-precondition-audit.md` § 1 y § 2 | S02: la zona con tarifa se crea antes de tocar mercados; el control G1 se corre al cerrar S04 |
| L2 | El idioma predeterminado del Admin quedó en Inglés porque "Cambiar idioma predeterminado" es destructivo: borra las traducciones del idioma destino y reescribe todos los themes, Horizon incluido | `theme/03B-store-foundation-report.md` Resumen 3; `theme/03F-owner-market-colombia-runbook.md` § 6 y § 10 | S01 y S02: español predeterminado **desde el primer día**, con la tienda vacía |
| L3 | La Dev Store nació en EE. UU. y USD: dirección y entidad en EE. UU., checkout `es-us`, login `es-US`, lista de proveedores de pago filtrada por la dirección de la tienda | `theme/03A-development-store-upload-report.md` punto 40; `theme/03B-store-foundation-report.md` punto 12; `payments/03F-wompi-owner-runbook.md` § 1 | S01: Colombia y COP al crear; S02 y S11 leen la lista de proveedores con la dirección correcta |
| L4 | La pasarela de prueba de Shopify **no coexiste** con un proveedor de tarjeta activo | `payments/03F-wompi-owner-runbook.md` § 10; `theme/03F-sonnet-independent-completion-report.md` sección A punto 5 | S11 y S14: una sola pasarela activa a la vez; la de prueba no valida nada de Wompi |
| L5 | La comisión de Shopify por proveedor externo existe siempre en Colombia (no hay Shopify Payments); su base es [(productos − descuentos) + impuestos + envío] × tasa; no aplica a pedidos de prueba | `payments/03F-wompi-owner-runbook.md` § 11; `payments/03E-wompi-shopify-feasibility.md` E20 a E22 | S01: entra en la decisión del plan; S17: se revisa en la primera factura |
| L6 | El theme se sube **sin publicar**; el Admin solo ofrece plantillas del theme publicado, así que `page.wishlist` no se pudo asignar y el header usa `?view=wishlist` | `theme/03B-store-foundation-report.md` punto 20 y Resumen 5; `theme/03A-development-store-upload-report.md` punto 14; `seo/03E-redirect-plan.md` § 7 | S03 sube sin publicar; S16 publica **al final** y asigna la plantilla en el mismo paso |
| L7 | **Shopify descarta en silencio los settings nuevos si el JSON se sube antes que el código**; el push termina en código 0 aunque rechace archivos (hay que leer su JSON); rechaza límites que Theme Check no ve; un push de `settings_data.json` apaga el embed y el interruptor de favoritos | `theme/03F-sonnet-independent-completion-report.md` sección B; `theme-src/README.md`; `theme/03A-development-store-upload-report.md` punto 20; `theme/03F-owner-wishlist-install-runbook.md` § 3 paso 8 | S03, S07, S09, S10, S16: código antes que JSON; `audit-theme-limits.mjs`; leer el JSON del push; `--only` o `theme pull` |
| L8 | La importación por CSV dejó el **índice de búsqueda estancado** (8/29 tras más de 1 h 40 min); **tocar los productos** lo desbloqueó (27/29 unos 10 min después del toque neto cero y 29/29 unos 23 min después, ilustrativo) | `theme/03D-search-index-report.md`; `theme/03E-commercial-readiness-report.md` punto 4 | S04: toque neto cero + medir 29/29 antes de S08 y de las pruebas de búsqueda |
| L9 | 43 imágenes de 4672 × 7008 px (32,7 MP) excedían el límite de Shopify (5000 px o 25 MP) y el importador las descartó en 12 productos; se reimportó la misma foto con `c_limit,w_5000,h_5000,q_95` y "sobrescribir" | `theme/03C-catalog-import-report.md` Resumen 5; `import/image-resolution-fix.csv` | S04: dos pasadas; 95/95 |
| L10 | Las definiciones de metafields y las colecciones se crearon **antes** del CSV; Shopify agregó el primer producto importado a "Home page" (`frontpage`) y hubo que excluirlo | `theme/03C-catalog-import-report.md` Resumen 4 y 6 | S05.A antes de S04; verificar `frontpage` |
| L11 | El formato de dinero (`$ 199.920` frente a `$199.920,00`) es ajuste de la tienda, no del theme | `theme/03C-catalog-import-report.md` Resumen 7 | S02 |
| L12 | El color se busca con un tag plano (`MOSTAZA`); los prefijos `color:` no generan tokens; "blanco" funcionaba por la descripción | `theme/03E-commercial-readiness-report.md` punto 5 y sección A | S04 |
| L13 | Wompi: la doc carga primero credenciales de producción; PSE no tiene pendiente en el sandbox; reembolsos, pendientes y "no vuelve" no están documentados; no hay cron de conciliación | `payments/03F-wompi-owner-runbook.md` § 0 y § 12; `theme/03F-sonnet-independent-completion-report.md` sección A puntos 2 a 4 | S11 (compuertas W-G1, W-G2, W-G3), S17 (conciliación manual) |
| L14 | Todo el QA de 03C y 03D se hizo con la sesión en EE. UU.; con Colombia todo estaba agotado; la sesión guarda el país | `theme/03E-commercial-readiness-report.md` sección A; `launch/03G-checkout-precondition-audit.md` § 1 | Todas las pruebas con `Shopify.country = "CO"`; restaurar la sesión al terminar |
| L15 | Con contraseña, GA4 no registra, la app de Meta no se termina y el Pixel Helper no funciona; la Dev Store no se convierte a producción y su contraseña no se quita | `analytics/03F-analytics-owner-runbook.md` § 2; `theme/03F-sonnet-independent-completion-report.md` sección A punto 6 | S12: configurar en privado, **validar en público** (S16.b y S17) |
| L16 | Shopify crea `contact` (en inglés), `data-sharing-opt-out`, `/blogs/news` y la colección `frontpage`, que aparecen en el sitemap | `seo/03F-seo-final-validation.md` § 2; `launch/03G-route-parity.md` F-10 | S06 y S16 (D17) |
| L17 | Las redirecciones no distinguen mayúsculas, conservan el query y aceptan barra final; el 301 exacto no se puede confirmar con `fetch` | `seo/03F-redirect-import-result.md` § 3 | S06 importa; S15.c comprueba con `curl` |
| L18 | El clasificador de permisos denegó a Claude escribir las 4 páginas legales; "Insert template" genera texto genérico en inglés; existe una política de privacidad autogenerada | `theme/03F-legal-owner-runbook.md` § 2 y § 8 | S06: la dueña pega, o aprueba por página |
| L19 | Shopify solo enlaza en el checkout las políticas nativas; con páginas hay que cargar `shipping_url` y `warranty_url` | `theme/03F-legal-owner-runbook.md` § 4.3 y § 14 | S06 y S10 |
| L20 | Solo M13 excede los límites; 4 videos son HEVC (se sube la variante H.264); el script de cableado es todo o nada con snapshot; las referencias `shopify://…` se copian del Editor | `content/media/03F-media-owner-runbook.md` § 0, § 4, § 7 y § 11 | S07 |
| L21 | Si el Editor cambió el theme, un push lo pisa: `theme pull` antes de empujar | `theme/03D-free-shipping-audit.md` § 4.3; `theme/03F-owner-wishlist-install-runbook.md` § 3 paso 8 | S07, S09, S10, S16 |
| L22 | La distribución personalizada de la app es irreversible y la ata a la tienda: una app DEV separada de la de producción | `theme/03F-owner-wishlist-install-runbook.md` P3 y paso 3 | S09 |
| L23 | El cerrojo `free_shipping_rate_confirmed` se enciende solo al final, cuando T1 a T7 y T10 pasan | `shipping/03F-owner-shipping-runbook.md` § 13 | S10 |
| L24 | LCP, FCP, CLS y el checkout a 390 px no se pudieron medir con la ventana oculta | `theme/03F-performance-final.md` § 1; `theme/03F-mobile-checkout-baseline.md` | S14 y S17 |
| L25 | El inventario no se rastreó (98/98 sin seguimiento): "disponible" no es stock real | `theme/03C-catalog-import-report.md` punto 19; `import/README.md` | S04 (D12 b) |
| L26 | En una Dev Store los visitantes ven siempre la página de contraseña de Shopify y no la del theme; el layout propio se revisa en el preview | `theme/03B-store-foundation-report.md` punto 17 | S03 (smoke) y S16; que un plan de pago muestre la del theme es `[NOT_VERIFIED]` |
| L27 | Shopify exige Translate & Adapt para agregar idiomas | `theme/03B-store-foundation-report.md` Resumen 2 | S02 (si D7 mantiene `/en`) |
| L28 | Mientras `favoritos` no tiene `page.wishlist`, el header enlaza `?view=wishlist` y la página lleva `noindex` por handle | `theme/03B-store-foundation-report.md` punto 20; `theme/03F-sonnet-independent-completion-report.md` sección B | S06 y S16 |
| L29 | Las cuentas nuevas ya venían activas; el theme no necesita plantillas legacy; el código de ingreso lo escribe solo la dueña y bloqueó 03B; el POST legacy no se probó | `theme/03A-development-store-upload-report.md` punto 32; `theme/03B-store-foundation-report.md` puntos 22 a 29 | S13 |
| L30 | La miga, "Volver a" y el `BreadcrumbList` dependían del orden no garantizado de `product.collections`: RC1.8 usa la colección cuyo título es igual al tipo del producto | `launch/03G-product-parity.md` F-02; `dist/release-manifest-rc1.8.json` | S04 (`Type` exacto) y S14 (re-medir 29/29) |
| L31 | El sitio actual cambia entre mediciones (XL de `alba-dorada-cafe-claro`): hay que re-rastrear antes del import y otra vez en la ventana | `launch/03G-product-parity.md` F-01 y § 2 | S04 y S16 |
| L32 | Las colecciones tienen el mismo conjunto que el sitio actual pero otro orden: el de la Dev es el inverso del orden de filas del CSV | `launch/03G-collection-parity.md` C-02 | S05.B (D12 c) |
| L33 | El repo no está versionado; el arnés de regresión del theme y los mutantes del píxel no están en él | `launch/03G-reproducibility-gap-audit.md` A18, A19, G03, G15 | § 3.3 PT1 y PT4 |
| L34 | Las 95 imágenes y 13 medios dependen del Cloudinary vivo del sitio actual | `launch/03G-reproducibility-gap-audit.md` A04, G04 | § 3.3 PT2; S04 y S07 |

## 7. Ventana de corte: cómo se intercalan S15 y S16

El detalle minuto a minuto, las compuertas y los criterios de "Pasa / No pasa" están en **`launch/03G-cutover-runbook.md`** (acciones `CT-##`, compuertas G1 a G8, disparadores de abortar `AB-##` y de rollback `RB-##`). Este plan no los duplica: los ordena contra los pasos canónicos. Las marcas T-24h a T+24h son **etiquetas de orden definidas en ese documento; este plan no fija ninguna hora** y T0 lo decide la dueña (D16). Hoy el veredicto de ese runbook es NO-GO, por los motivos de su § 1.

| Marca | Qué ocurre | Pasos de este plan | Acciones del runbook de corte |
|---|---|---|---|
| T-24h | Preparación y congelamiento del catálogo del sitio actual; confirmar S01 a S14 con evidencia; línea base del sitio actual; legales; redirecciones; mercado, idioma y envíos; Wompi en prueba; analítica; cuentas y favoritos; S&D; theme y media; **preparación de DNS (S15.a)** | S04 a S13, S15.a | CT-01 a CT-16, compuerta G1 |
| T-4h | Ensayo final en la tienda protegida (pedido de prueba, fallo, pendiente, reembolso, "no vuelve", teléfono real, ingreso por código, favoritos, búsqueda, humo del theme, redirecciones, deriva, TTL efectivo). **Desde aquí no cambian mercado, idioma, envíos, pagos ni el release** | S14 | CT-21 a CT-33, G2 |
| T-1h | Drenar y pausar ventas del sitio actual (si D-CT2 = A); foto final del sitio actual; verificar el release; **publicar el theme y asignar `page.wishlist`**; **Wompi a producción**; humo con dinero real (CT-47 pasa a T+15m si D-CT2 = B) | S16.a, S11.13, S04 | CT-41 a CT-47, G3 |
| T-15m | **Quitar la contraseña**; redirecciones y humo público sobre `<tienda>.myshopify.com`; analítica sin duplicados; dominio listo en Shopify; sondeo "antes" | S16.a, S06, S12, S15.a | CT-51 a CT-56, G4 |
| **T0** | **Cambio de DNS** (solo registros web). Verificar conexión, sondear propagación y HTTPS | S15.b, S15.c | CT-61 a CT-64, G5 |
| T+15m | Humo mínimo en el dominio real (redirecciones, checkout hasta la pantalla de pago sin pagar, canonical, hreflang, `robots.txt`, sitemap); conectar Meta | S15.c, S16.b, S12 | CT-71 a CT-75, G6 |
| T+1h | Humo completo (analítica, cuentas, favoritos, búsqueda y filtros, primer pedido real, Search Console) | S12, S13, S09, S08, S14, S17 | CT-81 a CT-86, G7 |
| T+24h | Conciliación (Shopify, Wompi, GA4 y Meta), Search Console, sitio actual conservado, TTL, comunicación y datos históricos, pendientes | S17 | CT-91 a CT-96, G8 |

**Por qué este orden.** El theme se publica y la contraseña se quita **antes** del DNS para que el DNS aterrice en una tienda pública que ya funciona; a cambio, la tienda es pública en `<tienda>.myshopify.com` durante un lapso corto y un buscador puede rastrearla `[PRÁCTICA-GENERAL]`. Antes de T0 el rollback es no avanzar (el sitio actual nunca dejó de servir); después de T0 es devolver el DNS, y su costo sube con cada pedido real que entre en Shopify [DOC:launch/03G-rollback-plan.md § 1 y § 3].

**Puntos de no retorno** (`launch/03G-rollback-plan.md` § 3): PNR-1 primer pedido real cobrado; PNR-2 primer correo a una clienta; PNR-3 primer dato a GA4 o Meta; PNR-4 distribución personalizada de la app; PNR-5 país o moneda base con pedidos; PNR-6 primer borrado permanente; PNR-7 primer 301 servido desde el dominio real. Este plan pide lo mismo que el rollback: ninguna acción que cree PNR-1 antes del go/no-go firmado entre S14 y S15 (§ 12.4 de ese documento). **Nota:** CT-47 (humo con dinero real, en T-1h) crea un pedido real y un cobro real, por lo que ya cruza PNR-1; la dueña lo decide con conocimiento (D8).

## 8. Coherencia con 03E, 03F y el snapshot: diferencias explícitas

Este plan no contradice los documentos 03E y 03F ni el snapshot sin decirlo. Estas son las diferencias y las precisiones, con su evidencia.

| # | Documento | Dice | Evidencia y decisión de este plan | Efecto |
|---|---|---|---|---|
| C1 | `seo/03E-redirect-plan.md` § 7 punto 1 | Importar las redirecciones con el theme ya publicado y `page.wishlist` asignada | 03F las importó en la Dev Store antes de publicar (47/47; 38 destinos en 200) [DOC:seo/03F-redirect-import-result.md]. El runbook de corte también las importa en T-24h (DIF-02). **Este plan sigue a 03F** y vuelve a comprobar `/favoritos` y `/cuenta/favoritos` después de asignar la plantilla | S06 importa temprano; S16 re-comprueba |
| C2 | `theme/03F-owner-market-colombia-runbook.md` § 6 | Cambiar la dirección de la tienda es reversible | Vale para la Dev Store sin pedidos. Este plan trata país y moneda base como **irreversibles** en la tienda comercial [INFERIDO]; coincide con `launch/03G-cutover-runbook.md` DIF-05 y `launch/03G-rollback-plan.md` I-05 y D-01 | S01 y S02 con más cautela |
| C3 | `theme/03F-owner-wishlist-install-runbook.md` y `theme/03F-owner-actions-minimal.md` | Citan la app 0.1.1 (`f14f068a…1de8`) y RC1.7 en varios puntos | Vigentes hoy: app 0.1.2 (`19c8c0df…e4b2`, solo cambia documentación) y RC1.8 (`e893b386…9e67`) [MEDIDO-03G] | S03 y S09 usan las versiones vigentes |
| C4 | `seo/03E-redirect-plan.md` § 4.1 fila 40 y § 5.5; `MANUAL_STEP_REQUIRED.md` | Los slugs del blog son NOT_AVAILABLE (solo viven en la base) | El sitemap actual capturado hoy lista los 3 posts y las 4 URL dan 200 [MEDIDO-03G] | D15; 4 filas potenciales en S06 |
| C5 | `MANUAL_STEP_REQUIRED.md` (Fase 01E); `theme/03C-catalog-import-report.md` punto 19 | No hay cantidades de stock: la web pública solo confirma disponible o agotado | El payload de cada ficha actual incluye `sizeStock` (27 fichas con 25 por talla; 2 con 23 o 24). Que sea inventario real es `[NOT_VERIFIED]` [MEDIDO-03G: F-04 de `launch/03G-product-parity.md`; B-13 de `launch/03G-current-site-baseline.md`] | D12 b |
| C6 | `theme/03C-catalog-import-report.md`, `theme/03F-sonnet-independent-completion-report.md` | Catálogo 29/98/95 | Vale para la Dev Store. El sitio actual hoy muestra 97 variantes (F-01) | D12 a; S04 acepta 98 o 97 |
| C7 | `theme/03B-store-foundation-report.md` Resumen 3 | El idioma principal se cambia al publicar | Era la salida para la Dev Store (evitar reescribir Horizon). En la tienda comercial el español se fija **al crear** (S01) y no se hace nada destructivo después | S01 y S02 |
| C8 | `payments/03F-wompi-owner-runbook.md` R1 | Ninguna credencial de producción | Aplica a la Dev Store. En la tienda comercial el riesgo son los ambientes (W-G3): las llaves de producción se cargan en el corte, antes de quitar la contraseña | S11.13 y S16.a |
| C9 | `launch/evidence/reference-docs/migration-roadmap.md` § 18 | El cambio de DNS es reversible | Se mantiene como hecho técnico, pero este plan lo marca **irreversible** por sus efectos (pedidos, 301 cacheados, señales de SEO, correos) [DOC:launch/03G-rollback-plan.md I-03] | S15.b |
| C10 | `theme/pre-development-store-checklist.md` paso O | Un solo paso "tienda comercial y cutover" | Lo reemplazan S01 a S17 | Todo el plan |
| C11 | `shipping/03E-shipping-source-of-truth.md` § 5.3 | Mercados antes que la zona de envío | Corregido por 03F (zona primero) [DOC:theme/03F-sonnet-independent-completion-report.md sección A punto 1] | S02 |
| C12 | `analytics/03E-analytics-plan.md` § 11 | Los pasos en la Dev Store sirven para QA técnico | 03F: con contraseña ni GA4 registra ni la app de Meta se termina | S12 valida en público |
| C13 | `theme/03F-owner-actions-minimal.md` B4 y `theme/03E-owner-actions-one-shot.md` | "Apagar el sitio Next.js en la ventana de corte" | La auditoría de viabilidad pide conservar Vercel y Neon varias semanas. Este plan y el runbook de corte lo leen como **dejar de recibir ventas** [DOC:launch/03G-cutover-runbook.md DIF-01] | PT5, D16, D18 |
| C14 | `launch/03G-cutover-runbook.md` (D-CT8) y `launch/03G-reproducibility-gap-audit.md` (C08) | Citan el inventario como "F-05" de `launch/03G-product-parity.md` | En la versión actual de ese documento, el inventario es **F-04** y F-05 es la baja resolución (se renumeró en su verificación). Este plan cita F-04 | Solo la cita |
| C15 | `launch/03G-dev-store-snapshot.json` (`themes[].remoteEqualsZip`, `wishlistApp.appProxy`) | RC1.8 remoto = ZIP 96/96; proxy `/apps/wishlist` | Campo transcrito a mano, y el proxy real es `/apps/radaelli/wishlist` [DOC:launch/03G-reproducibility-gap-audit.md § 2; launch/03G-rollback-plan.md D-02] | S03 y S09 re-miden |
| C16 | `launch/03G-product-parity.md` F-01 (primera versión) | La XL cambió "después del export" | La versión actual dice que la causa no está demostrada (el `lastmod` del sitemap no cambió). Este plan usa esa versión | D12 a |

## 9. Hallazgos de 03G que entran al plan

Estado de partida de la migración, por documento de 03G. La columna "Entra en" dice dónde este plan lo trata.

| Origen | Hallazgo | Entra en |
|---|---|---|
| `launch/03G-checkout-precondition-audit.md` CK-01, CK-02 | El checkout de Colombia no llega al pago: catálogo agotado (sin zona de envío) y sin proveedor de pago | S02, S10, S11 |
| ídem CK-03, CK-04, CK-05, CK-06 | Total en formato `es-us`; teléfono "(opcional)"; `theme_documentation_url` apunta al repositorio; `settings/checkout` sin leer | S02, S11, S14, D17 |
| `launch/03G-product-parity.md` F-01 | Talla XL de `alba-dorada-cafe-claro` en Shopify y no en el sitio actual; causa no demostrada | S04, D12 a |
| ídem F-02 | Miga "Destacados" en 4 fichas de Espuma de Ola (RC1.7); RC1.8 lo corrige y no se re-midió | S14 |
| ídem F-03, F-04 | Orden por defecto distinto en las 3 colecciones (0/29 posiciones); inventario no rastreado frente al stock publicado por talla | S05.B, S04, D12 b y c |
| ídem F-05, N-8 | 4 imágenes de baja resolución heredadas; meta descriptions cortadas en 2 productos | S04, D12 h |
| `launch/03G-route-parity.md` F-02, F-03, F-14 | 4 legales, blog (4 URL) y `/accesorios` con 200 y sin destino | S06, D9, D15, D12 g |
| ídem F-10 | `/pages/contact`, `/pages/data-sharing-opt-out`, `/blogs/news`, `/collections/frontpage`, `/collections/all`, `/collections/destacados` indexables | S06, S16, D17 |
| ídem F-12; `theme/03G-home-parity.md` HP-10 | Selector COP/USD y 4 redes de la cabecera del sitio actual, ausentes en el theme | D4, D20 |
| ídem F-13; HP-01, HP-11 | Título "Trajes de baño de diseño en Colombia" y meta description de 109 caracteres en el sitio actual; en Dev, título "Radaelli Swimwear Dev" y descripción vacía | S01, S16, D17 |
| `theme/03G-home-parity.md` HP-02 | Logo y favicon fuera del manifiesto de media; `settings.logo` vacío | S07, D13 |
| ídem HP-03, HP-07, HP-08, HP-09 | CTA a `#categorias` en lugar de `#productos`; insignia y "Ver producto" en la editorial; texto del botón del boletín; `brand_name` y descripción del pie | S03 (riesgo), S16.a, D20 |
| ídem HP-04, HP-05, HP-06 | Hero sin video, tarjeta de Salidas de Baño sin media, editorial con 6 de 8 productos en común | S07, S05.B |
| ídem HP-12, HP-13, HP-14, HP-18, HP-19 | Inglés `/en` sin contraparte actual; pie sin las 4 legales ni columna "Empresa"; "Recomendado para vos" oculta; evidencia de la Home solo con país US; suscriptores sin migrar | D7, S06, D20, S14, D11 |
| `launch/03G-collection-parity.md` C-02, C-07, C-12, C-13, C-16, C-18 | Orden; banners sin imagen; filtros de Talla y Color ausentes y filtros del sitio actual que no funcionan; Salidas de Baño vacía; 5 rutas no migrables vivas | S05.B, S07, S08, D12 |
| `launch/03G-current-site-baseline.md` B-01, B-07, B-08, B-09, B-13, B-14 | "N vistas" = 6 × vistas reales; envío gratis prometido hoy; 4 legales indexables; blog de aspecto de plantilla; stock público por talla; 20 % sin fecha de fin | D20, S10, S06, D15, D12 b, D19 |
| `launch/03G-responsive-sweep.md` H-01 | Tarjeta de categoría sin imagen con contraste bajo | S07 |
| `launch/03G-reproducibility-gap-audit.md` G01 a G05, G12, G13 | Datos de clientas, inventario, repo sin versionar, imágenes en Cloudinary, estado del Admin sin especificación ejecutable, orden de colecciones, imágenes en dos pasos | § 3.3, S04, S05, S13, D11 |

## 10. NOT_VERIFIED y NOT_AVAILABLE consolidados

| # | Tema | Estado | Se resuelve con |
|---|---|---|---|
| 1 | Tipo exacto de la Dev Store y si puede pasar a producción | `[NOT_VERIFIED]` | D6; Configuración > Plan; S01 |
| 2 | Plan de Shopify, facturación, cuentas de staff, precios vigentes | NOT_AVAILABLE / `[NOT_VERIFIED]` | D6 |
| 3 | Cómo se fija el idioma predeterminado al crear la tienda; si una tienda nueva de pago nace con contraseña | `[NOT_VERIFIED]` | S01 (captura) |
| 4 | Dirección real de despacho y de la tienda; razón social, NIT | NOT_AVAILABLE | D1, D9 |
| 5 | Que un visitante nuevo caiga en el mercado principal sin geolocalización; checkout `es-co` con "$ 199.920" | `[NOT_VERIFIED]` | S02 (V2), S14 (V6) |
| 6 | Efecto de la dirección de la tienda sobre impuestos; ajustes de `settings/checkout`, impuestos, notificaciones, dominios y eventos del cliente | `[NOT_VERIFIED]` | S01 (snapshot ANTES), S02 |
| 7 | Tarifa bajo $299.900 y Express | NOT_SET | D2, D3 |
| 8 | Si el mínimo de Shopify es inclusivo; sobre qué valor mide "Ofrecer envío gratis"; decimales en COP; "días hábiles" en el tránsito | `[NOT_VERIFIED]` | S10 (T5 a T7) |
| 9 | Que Shopify conserve una referencia por handle a una colección que aún no existe | `[NOT_VERIFIED]` | S03 y S05 |
| 10 | Wompi: aparece en la lista con dirección en Colombia (W-G1); conexión solo en prueba (W-G2); que exista una pasarela de prueba en una tienda de pago; aprobación de producción; reembolsos por medio de pago; pendientes; "no vuelve"; permisos OAuth; retenciones | `[NOT_VERIFIED]` | S11; preguntas P1 a P9 |
| 11 | Cobro aprobado sin pedido cuando la clienta no vuelve | `[NOT_VERIFIED]` | S11 caso 5; S17 |
| 12 | HEVC en Shopify; formato `shopify://…` de las referencias; nombre final de los archivos | `[NOT_VERIFIED]` | S07 |
| 13 | Que Colombia esté en el selector de regiones del banner; país soportado para el canal de Meta; consent mode sin banner; DebugView en el checkout | `[NOT_VERIFIED]` | S12 |
| 14 | Token de Admin de la app de favoritos (misma organización); extensión de página completa con distribución personalizada en el plan real | `[NOT_VERIFIED]` | S09 (P1, GO/NO-GO 6 y 7) |
| 15 | Registrador, proveedor de DNS, registros actuales, TTL, propagación y emisión del certificado; que el panel del sitio actual funcione por la URL del proyecto | NOT_AVAILABLE / `[NOT_VERIFIED]` | D16; S15.a |
| 16 | Que el deployment de producción vigente incluya `WRITES_PAUSED`; qué ve una clienta con la pausa activa | `[NOT_VERIFIED]` | D16; CT-42 |
| 17 | Código exacto de las redirecciones; `http` a `https` y `www` a apex en Shopify | `[NOT_VERIFIED]` | S15.c |
| 18 | Que existan estos documentos hermanos: `launch/03G-launch-acceptance-checklist.md`, `theme/03G-launch-rehearsal-report.md` | NOT_AVAILABLE a las 18:00 | — |
| 19 | Cantidades reales de inventario por talla; que `sizeStock` público sea stock real | `[NOT_VERIFIED]` | D12 b |
| 20 | Cantidad de clientas, pedidos, cupones activos, suscriptores y solicitudes de reposición; base de producción no consultada | NOT_AVAILABLE | D11, D19 |
| 21 | Que una política de privacidad autogenerada exista en la tienda comercial; que un plan de pago muestre la página de contraseña del theme | `[NOT_VERIFIED]` | S06, S16 |
| 22 | Si los pedidos de prueba se pueden eliminar o renumerar; dónde se fija el número inicial de pedidos | `[NOT_VERIFIED]` | D11; S01 |
| 23 | LCP, FCP y CLS reales; checkout a 390 px; correo de confirmación de pedido | `[NOT_VERIFIED]` | S14, S17 |
| 24 | Fecha de fin del 20 %; fecha de creación de los productos (orden actual); descripción de cada colección | NOT_AVAILABLE | D19, D12 c, S05.A |

## 11. Qué no cubre este plan

- **No ejecuta nada.** Es un documento; ninguna acción se realizó y ninguna se autoriza por estar escrita aquí.
- **No elige plan de Shopify, precios, TTL, proveedor de DNS ni fechas.** Lo que falta figura como NOT_AVAILABLE o como decisión de la dueña.
- **No define KPIs, umbrales de conversión ni criterios numéricos de rollback** (DR-01 y DR-02 de `launch/03G-rollback-plan.md`: las fuentes no los traen).
- **No migra clientes, pedidos históricos, cupones, suscriptores ni el blog:** no hay artefacto ni acceso a la base de producción; solo se dejan las decisiones (D11, D15, D19).
- **No construye** el middleware de reconciliación de pagos, la ruta OAuth de token offline de la app, el arnés de regresión ni un CSV de imágenes consolidado; son brechas señaladas por 03G.
- **Fuera de alcance de la auditoría de viabilidad:** storefront headless (Hydrogen), Shopify Plus, personalización profunda del checkout y Shopify Flow o Functions.
- **No redacta** textos legales, comunicaciones a clientas ni copy.

## 12. Anexos

### 12.1 Artefactos que este plan usa, con su huella (SHA-256, calculada a las 18:00)

| Artefacto | Paso | SHA-256 |
|---|---|---|
| `dist/radaelli-shopify-theme-rc1.8.zip` (173.654 bytes, 96 archivos) | S03 | `e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67` |
| `dist/release-manifest-rc1.8.json` | S03 | `0161d550bc061d51b58e41941605fca3d0d3cd5a7048515d4de969dc2ba6ba23` |
| `dist/radaelli-wishlist-app-0.1.2.zip` (253.247 bytes, 35 entradas) | S09 | `19c8c0df68a30533b6e3b953729d525afd784a4518e2dbb6691bc8ddc919e4b2` |
| `import/shopify-products-03c.csv` (99 filas de datos) | S04 | `42b05500ded688a247f38972c74042d798e3a5d9b26624c8a4c6b93cf5d32c1f` |
| `import/shopify-products-03c-images.csv` (48 filas de datos) | S04 | `4358e5f210c4ee33d2f4c286fe14dc8e0493d578b07a80d9329747ca8825fbe8` |
| `import/image-resolution-fix.csv` (44 filas de datos) | S04 | `cc3f5e3554bf5162feb51eb763e44a66f40d5b801780c282e0600d9f8ad3bfb3` |
| `catalog/shopify-handle-mapping.csv` | S04, S06 | `24133383207e340dc312ac42d21f23b2f2094894e8e79c1076f059c6c073c423` |
| `catalog/shopify-post-import-audit.csv` | S04 | `60ae4ec2ae1252b3fac94d059baa05f7ec652c2e507568e4948db8293ed0c3a1` |
| `seo/shopify-redirects-import.csv` (47 filas de datos) | S06 | `ba3694678062c1f916166fb79e14640226aaa37b29cd4dc3ab183bc27818b1d6` |
| `seo/validate-redirects.mjs` | S06 | `ed8004b53caaab0c62b9a0f2385fa4a997f1a7b9c7f3e5a77b4a82127111bb20` |
| `seo/current-url-inventory.csv` | S06, S15 | `a9f0918c830b0945e1c6f5bd250492a6d7d557e665c7bc2b38332d644f64ed05` |
| `content/media/media-migration-manifest.csv` (14 filas) | S07 | `401f757040c9368e8ade5bd507d31890ad0d86e040fb1469f6f91fa7d16f87a9` |
| `content/legal/privacidad.html` | S06 | `55547916c254c32868f5426be393f3392452a94f3be7c8e0f5e1ee3d9632174a` |
| `content/legal/terminos.html` | S06 | `7719ebd5a916491c5b53a8eb48183848dd9ac6f2653e05634cca62e94d8a5a30` |
| `content/legal/envios.html` | S06, S10 | `86866583b965cfe4f364434ef6bf6c3c1d06275436d054bfbafce2f5d8c81921` |
| `content/legal/cookies.html` | S06 | `3627198196f15246b96a7c7e37a48cdf387941a413074622ec3c7bb7a96c2ede` |
| `content/legal/garantia.html` | S06 | `f2dba6c63d5ac9c3cb1fdcb83a5732794062b7a2fe1a6a40ca0b9d8cc2c82f99` |
| `content/legal/devoluciones.html` | S06 | `b2148c0d8209c095d904485bfdb684133d740a931733bee34784105978c5d4e8` |
| `scripts/build-shopify-product-csv.mjs` | S04 | `5cc57aad151647ee8893b3abbd00a60b7c0d8c3bdd6ad0afb9c56964a696aa8a` |
| `scripts/build-shopify-image-fix-csv.mjs` | S04 | `e25d533c1ffaca610dc9e97e79424e60816096ce805fdca08716e92f95920aa0` |
| `scripts/audit-theme-limits.mjs` | S03 | `279aafe36202cff4408e530f4f50fedd65a48920e80fa8e4bf80912237739c8b` |
| `scripts/build-theme-rc.mjs` | S03, S07, S10 | `a59b8432e54f32d8e2d5f0e9fa4426f175c5ee620100105df90c879dd6373792` |
| `scripts/prepare-media-package.mjs` | S07 | `b96f80bafdd4fabbaf0f3c1e31df25f481706a8dc9ab06ee9bad47dc1e4411ec` |
| `scripts/apply-media-wiring.mjs` | S07 | `bff19a40f3dcea17cb627ffed5a9bd2a00c34c4e80d629371e70bede384975a1` |

Los hashes de texto normalizado de las páginas legales (los del QA del runbook legal) son otros y están en S06. Si un artefacto cambia, cambia su fila; `launch/tools/03g-release-freeze.mjs` genera la huella completa de lo congelado.

### 12.2 Comandos por paso (los que definen el paso; los demás están en los runbooks citados)

| Paso | Comando o artefacto |
|---|---|
| S03 | `sha256sum dist/radaelli-shopify-theme-rc1.8.zip`; `node shopify-migration/scripts/audit-theme-limits.mjs shopify-migration/theme-src`; `npx @shopify/cli@4.8.2 theme push --unpublished --theme "Radaelli RC1" --store <tienda-comercial> --strict --json --path shopify-migration/theme-src --ignore README.md`; `shopify theme pull --theme <id> --path <carpeta temporal vacía> --nodelete`; `shopify theme list` |
| S04 | `node launch/tools/03g-crawl-current-site.mjs`; `node launch/tools/03g-product-parity.mjs`; `node launch/tools/03g-product-parity-verify.mjs`; importar `import/shopify-products-03c.csv` y luego `import/shopify-products-03c-images.csv` (sobrescribir); `/products.json?limit=250` |
| S06 | `node seo/validate-redirects.mjs` (y `--self-test`); importar `seo/shopify-redirects-import.csv`; `node launch/tools/03g-cutover-redirect-matrix.mjs [BASE_URL]` |
| S07 | `node shopify-migration/scripts/prepare-media-package.mjs [--download --video-variant=served]`; `node shopify-migration/scripts/apply-media-wiring.mjs --template`, `--map=…`, `--write --snapshot-dir=…`, `--restore=…`; `node shopify-migration/scripts/build-theme-rc.mjs` |
| S09 | `shopify app config link`; `node --test test` (desde `app/`); `shopify app deploy --path . --message "<mensaje>"` |
| S10 | `shopify theme push --theme <id> --strict --path <theme-src> --ignore README.md` (sin `--live` ni `--publish`), con `theme pull` previo |
| S14, S16 | `node launch/tools/03g-release-freeze.mjs "<HH:MM>"` |
| S15 | `curl.exe -sI https://radaelliswimwear.com/producto/bikini-foam`; `curl.exe -sSI https://radaelliswimwear.com/`; `nslookup radaelliswimwear.com`; el bucle de redirecciones del § S15.c |

### 12.3 Fuentes leídas

- **Capturas y auditorías de 03G:** `launch/03G-dev-store-snapshot.json`, `launch/03G-checkout-precondition-audit.md`, `launch/evidence/` (`dev-*.json(l)`, `current-site/`, `current-site-probe/`, `03g-collection-filter-probe/index.json`, `current-site-extract.json`, `reference-docs/`), y los documentos hermanos del encabezado.
- **Reportes previos:** `theme/03A-development-store-upload-report.md`, `theme/03B-store-foundation-report.md`, `theme/03C-catalog-import-report.md`, `theme/03D-search-index-report.md`, `theme/03D-free-shipping-audit.md` (§ 4.3), `theme/03D-missing-assets-audit.md` (§ 4 y § 5), `theme/03E-commercial-readiness-report.md`, `theme/03F-sonnet-independent-completion-report.md`, `theme/03F-owner-actions-minimal.md`, `theme/03F-performance-final.md`, `theme/03F-mobile-checkout-baseline.md`, `theme/pre-development-store-checklist.md`, `MANUAL_STEP_REQUIRED.md`, `README.md`, `theme-src/README.md`.
- **Runbooks 03F:** `theme/03F-owner-market-colombia-runbook.md`, `shipping/03F-owner-shipping-runbook.md`, `payments/03F-wompi-owner-runbook.md`, `theme/03F-search-discovery-owner-runbook.md`, `theme/03F-owner-wishlist-install-runbook.md`, `theme/03F-legal-owner-runbook.md`, `analytics/03F-analytics-owner-runbook.md`, `content/media/03F-media-owner-runbook.md`.
- **SEO, pagos, envíos, analítica, datos:** `seo/03E-redirect-plan.md`, `seo/03F-redirect-import-result.md`, `seo/03F-seo-final-validation.md`, `payments/03E-wompi-shopify-feasibility.md`, `shipping/03E-shipping-source-of-truth.md`, `analytics/03E-analytics-plan.md`, `source-of-truth/data-model-audit.md`.
- **Release, app y catálogo:** `dist/release-manifest-rc1.8.json`, `app/README.md`, `app/shopify.app.toml`, `import/README.md`, `import/*.csv`, `catalog/*.csv`, `collections/collections-master.csv`, `content/legal/manifest.json`, `theme-src/config/settings_data.json`, `theme-src/sections/newsletter-home.liquid`, `theme-src/sections/header.liquid`, `theme-src/sections/footer-group.json`, `theme-src/templates/index.json`.
- **No se leyó ni se consultó:** Neon ni ninguna base de datos, Vercel, Wompi, DNS, ninguna tienda, ningún `.env`; no se hizo ningún GET nuevo a `radaelliswimwear.com`; no se usó git; no se ejecutó ningún paso del plan.
