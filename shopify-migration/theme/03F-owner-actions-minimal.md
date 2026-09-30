# 03F — Acciones de la dueña, mínimas (reemplaza a `03E-owner-actions-one-shot.md`)

**No se pide nada de esto hasta que Daniela diga que está lista.** Todo lo demás lo hace Claude. Claude nunca escribe códigos de ingreso, contraseñas ni llaves, y no acepta permisos OAuth por la dueña.

*(Actualizado en 03G: se agregaron C6–C8 y la sección D. A1–A5, B1–B4 y C1–C5 no cambiaron.)*

*(Actualizado en 03I, solo con hechos medidos hoy en el Admin: el paso de mercado de A1 se acorta; A1 y D1/D2 dejan de compartir nombres con el runbook de envío (ahora **SH-D1…SH-D5**); B1 pasa a decir qué ruta es viable hoy; A4 incluye logo y favicon; D2 tiene hoja lista; se agrega la tabla de orden y el punto E1. Detalle y evidencia: `launch/03I-a1-preflight.md`, `launch/03I-b1-preflight.md` y `launch/03I-blocker-matrix.md`.)*

*(Actualizado en 03J: A1a y B1a se ejecutaron con la dueña presente; ver la tabla de orden y `theme/03J-owner-checkpoint-report.md`.)*

*(**Actualizado en 03K — esta lista quedó reemplazada por el lote mínimo consolidado en `launch/03K-blocker-matrix.md` § 2.** El cálculo de envío en vivo y Wompi pasan a `FINAL-STORE ONLY`: se hacen en la tienda comercial final de Colombia, no en la Dev Store, que es solo un sandbox de QA. Las filas siguientes se conservan como historial y como detalle de cada acción; el orden y lo que sigue abierto ya no son los de esta tabla. D5 y la parte de respaldo de G03 quedaron hechos: rama `shopify-migration-backup`.)*

**Camino más corto para ver la tienda funcionando en Colombia (ya recorrido en 03J):** solo el punto **A1a** (≈ 40–65 min de la dueña: sucursal + zona de envío con sus tarifas). Con eso el catálogo deja de verse agotado y Claude puede volver a probar todo. El paso de mercado que antes sumaba 15–30 min **ya no hace falta como estaba escrito** (ver A1).

## Orden de ejecución recomendado (una sola lista, una acción a la vez)

Ordenada por valor de desbloqueo y dependencia; **A1 → B1 → validación que hace Claude → el resto**. Los puntos marcados «OK 1 min» solo piden un OK y liberan trabajo que Claude corre mientras la dueña sigue con la secuencia principal. **No se pide nada de esto hasta que Daniela diga que está lista.** El detalle de cada fila está en las tablas de más abajo.

| # | Punto | Qué se pide | Tiempo (dueña) |
|---|---|---|---|
| 1 | **A1** | **A1a y A1b HECHOS en 03J (2026-09-30), con la dueña:** sucursal en Barranquilla; zona Colombia con «Envío estándar gratis» desde $299.900; **entidad comercial y dirección de la tienda cambiadas de EE. UU. a Colombia** (persona física; ella escribió sus datos y guardó). Verificado: catálogo 29/29 disponible, checkout `es-co`. **Pendiente: SH-D2**, la tarifa por debajo de $299.900 (la dueña la averigua con su mensajería; hasta entonces una prenda suelta no se puede pagar) | SH-D2: la que tarde averiguarlo |
| 2 | **B1** | **B1a HECHO en 03J (dos veces: antes y después de alinear la entidad; el cambio de entidad apagó la pasarela y hubo que reactivarla):** pasarela de prueba de Shopify activa; pedidos de prueba, rechazo, falla y reembolso verificados. **B1b (Wompi) pendiente:** no aparece en la lista de proveedores externos ni con todo en Colombia; falta explorar su instalación por App Store | B1b ≈ 2 h, solo si hay vía |
| — | *(Claude)* | Verifica A1 y B1: catálogo, checkout `es-co`, pedido de prueba, reembolso | — |
| 3 | **A4** | OK para descargar 12 archivos y subir media, logo y favicon | OK 1 min |
| 4 | **D5** | OK para respaldar el trabajo (rama + copia fuera de esta máquina) | OK 1 min |
| 5 | **D1** | ¿Existe la talla XL de `alba-dorada-cafe-claro`? | 1 min |
| 6 | **D2** | Inventario: completar la hoja de 98 filas o decidir vender sin límite | 10–30 min + el conteo |
| 7 | **B2** | Legales: 4 páginas + razón social, NIT y dirección | ≈ 20 min |
| 8 | **A2** | Código de ingreso de clienta | 2 min |
| 9 | **A3** | Instalar Search & Discovery | ≈ 5 min |
| 10–17 | **C1–C8** | Decisiones editoriales (meta de la Home, «Recomendado», voseo/tuteo, contraste, limpieza, orden, selector USD, inglés) | minutos cada una |
| 18 | **D3** | Datos de clientas: qué se migra | 15 min |
| 19 | **D4** | Tienda comercial, dominio y corte | 10 min |
| 20 | **A5** | App de favoritos de cuenta (o lanzar «solo invitada») | 90–120 min con Claude |
| 21 | **B3** | Analítica | ≈ 15 min |
| 22 | **B4** | Publicar (al final) | — |
| 23 | **E1** | Correo de marketing y boletín (decisión) | minutos |

Por qué B1 sigue después de A1: sin zona de envío con país Colombia no se llega al pago en Colombia (checkout `es-us`), y una prueba con dirección de EE. UU. no representa a la clienta. Dentro de B1 la pasarela de prueba va **primero** porque el Admin ya la ofrece hoy y no exige cambiar dirección ni entidad; Wompi hoy **no aparece** en la lista (ver B1).

## A. NECESARIO PARA DESBLOQUEAR LA DEV STORE

| # | Qué hace la dueña | Tiempo (dueña) | Qué desbloquea | Qué hace Claude justo después | Runbook |
|---|---|---|---|---|---|
| **A1** | **Envío y mercado de Colombia**, en este orden:<br>**A1a**<br>1. Dirección de la sucursal en Colombia (**SH-D1**: la dirección real de despacho).<br>2. Zona Colombia con la tarifa gratis desde $299.900.<br>3. **Decidir la tarifa por debajo de $299.900** (**SH-D2**: no existe un valor real en ninguna fuente; el sitio actual cotiza a mano).<br>*(Claude verifica: catálogo disponible con país CO y tarifas)*<br>**A1b (solo si Claude lo pide tras medir)**<br>4. Dirección de la tienda a Colombia. *Ya no se pide «Convertir en mercado principal» ni pasar EE. UU. a Borrador:* en el Admin de hoy Colombia ya es un mercado **Activo, en COP, con todo el catálogo**, la moneda y la región de respaldo ya son Colombia, y ese menú no ofrece esa acción (`launch/03I-a1-preflight.md` F1–F5). Existía además una «entidad comercial» en EE. UU.: **se cambió a Colombia en 03J** (la dirección de la tienda la siguió sola; Shopify apagó entonces la pasarela de prueba) | **40–65 min** para A1a (estimación de Claude); **+5–10 min** si hace falta A1b | Catálogo **disponible** para Colombia (hoy 29/29 agotados) · checkout `es-co` con "$ 199.920" · lista de pagos de Wompi | Verifica con país CO (carrito, checkout, zona, `/` y `/en`); enciende `free_shipping_rate_confirmed` al final; prueba las 12 combinaciones de tarifa | `shipping/03F-owner-shipping-runbook.md` y `theme/03F-owner-market-colombia-runbook.md` |
| **A2** | **Código de ingreso de clienta** (llega por email; lo escribe ella) | 2 min | Objeto `customer`, cuenta real, GO/NO-GO #1 | Verifica cabecera, `/account` y cierre de sesión | `theme/03D-search-accounts-wishlist-report.md` § F |
| **A3** | **Instalar Search & Discovery** (app oficial y gratuita; acepta permisos OAuth) | ≈ 5 min de permisos (Claude puede hacer el resto, con su OK) | Filtros de **talla y color**, como en el sitio actual | Configura Talla, Color y Precio (sin Disponibilidad) y corre la matriz de QA (45–60 min) | `theme/03F-search-discovery-owner-runbook.md` |
| **A4** | **OK para descargar 12 archivos del Cloudinary propio** (~20,7 MB) y subirlos a Contenido > Archivos, **más subir el logo y el favicon** (archivos que ya están en el repo: no requieren descarga; su cableado exige un RC nuevo, RC1.10) | 1 min | Hero, tarjetas de categorías, banners y guía de tallas | Corre `prepare-media-package.mjs --download`, sube los archivos, y `apply-media-wiring.mjs` conecta el theme | `content/media/03F-media-owner-runbook.md` |
| **A5** | **App de favoritos de cuenta:** cuenta de desarrolladora, custom distribution (**irreversible**), instalar aceptando permisos, elegir dónde vive el backend | 90–120 min con Claude | Favoritos sincronizados y "Mis favoritos" | Despliega, prueba unión invitada → cuenta y entre dispositivos; enciende `wishlist_account_sync` solo en el theme sin publicar | `theme/03F-owner-wishlist-install-runbook.md` |

## B. NECESARIO ANTES DEL LANZAMIENTO COMERCIAL

| # | Qué hace la dueña | Tiempo (dueña) | Qué desbloquea | Qué hace Claude justo después | Runbook |
|---|---|---|---|---|---|
| **B1** | **Pagos de prueba.** *Medido hoy en el Admin:* la lista de proveedores externos **ya ofrece «(for testing) Bogus Gateway»** (la pasarela de prueba de Shopify) y **Wompi no aparece** con la entidad y la dirección de la tienda en EE. UU. Por eso:<br>**B1a** activar la pasarela de prueba (sin facturación) y hacer el pedido de prueba, el rechazo y el reembolso;<br>**B1b** (después, solo si Wompi aparece tras A1b): instalar la app oficial de Wompi (OAuth), cargar las llaves de **prueba** (las escribe ella en el formulario de la app) y configurar la URL de eventos | ≈ 30 min (B1a) a 2 h (B1b) | Primer pago de prueba y pedido en el Admin | Guía el checkout de prueba (lo tipea ella), verifica el pedido, reembolso y estados | `payments/03F-wompi-owner-runbook.md` |
| **B2** | **Legales:** aprobar las 4 páginas pendientes (Privacidad, Términos, Envíos, Cookies) y entregar **razón social, NIT y dirección** | ≈ 20 min | Páginas legales, menú "Ayuda" completo y 4 redirecciones más | Pega el texto verbatim, verifica por hash, agrega los links al menú y las 4 filas de redirect | `theme/03F-legal-owner-runbook.md` |
| **B3** | **Analítica:** ID de medición de **GA4**, dataset de **Meta**, e instalar las apps oficiales (OAuth) | ≈ 15 min | Embudo anuncio → compra (recién tiene sentido después de A1 y B1) | Verifica cada evento y la no duplicación | `analytics/03F-analytics-owner-runbook.md` |
| **B4** | **Publicar** (más adelante): dominio, idioma principal en español, plantilla `page.wishlist` en Favoritos, redirecciones de la tienda comercial, apagar el sitio Next.js en la ventana de corte | — | Lanzamiento | `curl -I` de las redirecciones y matriz final | `seo/03F-seo-final-validation.md` |

## C. OPCIONAL / EDITORIAL (sin apuro)

| # | Decisión | Qué desbloquea |
|---|---|---|
| **C1** | Meta description de la **Home** (tu texto) | SEO de la portada. Hoy queda vacía (no se inventa) |
| **C2** | **"Recomendado para vos":** curar una colección o dejar la sección oculta | Home completa |
| **C3** | **Voseo o tuteo** (los textos legales mezclan ambos) | Coherencia de tono |
| **C4** | **Color de los botones blancos sobre arena** (contraste 1,69:1, idéntico al sitio actual): texto oscuro, o un arena más oscuro | Accesibilidad AA |
| **C5** | Limpiar de la Tienda online las páginas y colecciones creadas por Shopify (`/pages/contact` en inglés, `data-sharing-opt-out`, colección "Home page") | Sitemap más limpio |
| **C6** *(03G)* | **Orden de las colecciones y de "Destacados":** aceptar el orden actual de la Dev Store o pedir que se iguale al del sitio actual (listas exactas en `launch/03G-collection-parity.md`, C-02) | Home y colecciones con el mismo primer producto que hoy |
| **C7** *(03G)* | **Selector COP/USD** del encabezado del sitio actual: ¿se conserva? (con un solo mercado en COP puede no hacer falta) y ¿las redes van también en la cabecera? | Paridad del encabezado (`theme/03G-home-parity.md` HP-10) |
| **C8** *(03G)* | **Inglés (`/en`):** despublicarlo o traducirlo; hoy las URLs en inglés muestran textos en español | SEO limpio (HP-12) |

## D. DECISIONES Y DATOS QUE DESCUBRIÓ 03G (ninguna hoy; se piden junto con el lote)

Salen de `launch/03G-reproducibility-gap-audit.md` y de la paridad de productos. No cambian A1–A5, pero **sin ellas no se puede lanzar**.

| # | Qué hace la dueña | Tiempo | Qué desbloquea | Detalle |
|---|---|---|---|---|
| **D1** | **Talla XL de `alba-dorada-cafe-claro`:** ¿existe? La Dev Store la ofrece (98 variantes) y el sitio actual solo muestra S, M y L (97) | 1 min | Que la tienda comercial venda solo lo que existe | `launch/03G-product-parity.md` F-01 |
| **D2** | **Inventario:** cantidades por variante (98) o decidir vender sin límite. Hoy ninguna fuente lo confirma y la Dev Store no rastrea inventario. **Hoja lista (03I):** `import/inventory-template.csv` (98 filas, columna `cantidad_a_cargar` vacía; instrucciones en `import/inventory-template.README.md`) | 10–30 min + el conteo | Que el checkout no venda de más | `launch/03G-reproducibility-gap-audit.md` G02 |
| **D3** | **Datos de clientas del sitio actual:** decidir qué se migra o se archiva (clientas y direcciones, pedidos históricos, cupones/descuentos, suscriptores del newsletter, blog). Las contraseñas no se pueden importar: las clientas entrarían por código | 15 min de decisión | Que no se pierda la base de clientas ni el newsletter | `launch/03G-reproducibility-gap-audit.md` tabla C, G01 y G11 |
| **D4** | **Dominio y corte:** proveedor de DNS y acceso, plan de Shopify de la tienda comercial, ventana de corte y quién la ejecuta | 10 min | Plan de corte y de vuelta atrás con datos reales | `launch/03G-cutover-runbook.md` (D-CT1 a D-CT5) |
| **D5** | **OK para respaldar el trabajo de migración:** hoy vive solo en carpetas de esta máquina, sin versionar (`git status`: `?? shopify-migration/`). Propuesta: commit en una rama dedicada y una copia fuera de esta máquina; más una copia local de las 95 fotos de producto que hoy dependen del Cloudinary del sitio actual | 1 min de OK (descarga: tamaño NOT_AVAILABLE) | Que perder la carpeta o cambiar el Cloudinary no rompa la migración | `launch/03G-reproducibility-gap-audit.md` G03 y G04 |

## E. Decisión documentada en el plan que faltaba en este lote (03I)

| # | Qué hace la dueña | Qué desbloquea | Detalle |
|---|---|---|---|
| **E1** | **Correo de marketing y boletín:** qué plataforma se usa (Resend u otra), qué pasa con el aviso «Avísame» de reposición y con la lista de suscriptores (esto último, junto con D3) | Notificaciones y boletín coherentes; se puede lanzar sin ella | D20 y D11 de `launch/03G-commercial-store-migration-plan.md` (AC-33); fila E1 de `launch/03I-blocker-matrix.md` |

## Estado de lo que ya no depende de la dueña

Las **47 redirecciones** ya están importadas y probadas en la Dev Store (`seo/03F-redirect-import-result.md`), y el theme **RC1.9** (`fa68a9a9…533c`, 96 archivos, igual al remoto) y la app **0.1.2** están listos y verificados. La dueña no necesita hacer nada más con ellos. **Herramientas de verificación ya listas para cuando termine A1 y B1** (`launch/tools/03i-*`): verificador post-A1, sonda y evaluador del checkout, evaluador de resultados de pedidos de prueba. El arnés de regresión del theme ya vive en el repo (`theme-harness/`).
