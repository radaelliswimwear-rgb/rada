# Checklist previo a la Development Store — Fase 02M

Qué hay que hacer, y en qué orden, **después** de 02M. **Nada de esto se ejecutó.** Claude no crea tiendas, no inicia sesión en Shopify, no sube el theme ni crea apps.

- Release candidate: `shopify-migration/dist/radaelli-shopify-theme-rc1.zip` (SHA-256 `a5340e0f8d29222b92e4968a4b079d94334d6c0bf383a6c898932d81f1bc09bf`).
- Detalle técnico: `theme/offline-release-candidate-report.md`.
- Cuentas y favoritos: `theme/customer-accounts-decision.md`.

> **Estado 03E (2026-09-29, 14:20).** La lista vigente de acciones de la dueña es **`theme/03E-owner-actions-one-shot.md`** (reemplaza a esta tabla para el trabajo pendiente).
> - Bloqueos críticos medidos en vivo:
>   - (1) el mercado principal sigue en EE. UU.;
>   - (2) Colombia no tiene zona de envío → **todo el catálogo figura agotado para Colombia**.
> - Release vigente: **RC1.5** `1a506a41ae482d7c1426dc9228e5a16f4659631a338804c1680f5de1317cf2e2`.
>
> **Estado 03D (2026-09-29).** Estas notas corrigen filas de la tabla de abajo:
> - **C.1 Tags de color:** no hacen falta en los 29. Solo 2 productos no tienen el color en el título, y esos 2 ya tienen su tag (`color:BLANCO` confirmado; `color:MOSTAZA`, a re-medir).
>   - El índice de búsqueda quedó estancado tras la importación masiva. Se desbloqueó con un toque neto cero: 27/29 a las 11:36.
>   - Ver `theme/03D-search-index-report.md`.
> - **D.1:** sin Search & Discovery, Shopify **sí** ofrece dos filtros: Disponibilidad y Precio. Talla y color sí requieren la app.
>   - La instalación es **owner-only** (concesión de permisos OAuth).
>   - "Disponibilidad" queda oculto por el ajuste `collection_show_availability_filter`, apagado: con inventario no rastreado, todo figura "En existencia".
> - **F:** hecho en la Dev Store:
>   - Política de reembolso con el texto verbatim de `/devoluciones`;
>   - página visible `garantia`;
>   - colección "Destacados".
>
>   Pendiente (owner): páginas Privacidad, Términos, Envíos y Cookies (HTML verbatim en `content/legal/`) y la columna "Ayuda" del footer.
> - **H, envío gratis:** el umbral **queda en 299900**, pero ahora la promesa depende de `free_shipping_rate_confirmed`, que va **apagado** hasta que exista la tarifa gratis en Shopify. Recién después se enciende la barra del carrito (`cart_free_shipping_progress`).
> - **H, media:** Hero, tarjetas, banners y guía de tallas tienen fuente exacta en `content/media/media-migration-manifest.csv`. Subirlos a Archivos es owner-only.
> - Release vigente: **RC1.4** `dist/radaelli-shopify-theme-rc1.4.zip`, SHA-256 `cba89ac9926ca2256c637139b2524ed5110196aefdfcd508ae3e9de258c5a9ca`. Remoto = ZIP, 96/96.

**Quién:**
- **Daniela**: acción manual en Shopify.
- **Claude**: se puede hacer con Claude una vez que Daniela conecte la tienda y autorice explícitamente esa fase.
- **Ambos**: Daniela ejecuta, Claude prepara y verifica.

**Riesgo:** Bajo / Medio / Alto (qué tan caro es equivocarse).

| # | Paso | Quién | Prerrequisito | Riesgo | Criterio de éxito |
|---|---|---|---|---|---|
| **A** | **Crear Development Store** (Partner Dashboard o tienda de desarrollo del plan elegido) | Daniela | Decisión de plan. Cuenta Partner o plan pago | Bajo | Tienda creada, protegida con contraseña. Moneda COP, idioma español, zona horaria de Colombia |
| **B** | **Activar New Customer Accounts** (Configuración > Cuentas de cliente) y opciones de ingreso | Daniela | A | Bajo | Ingreso con código por email funciona en la tienda de prueba. Menú `customer-account-main-menu` existe |
| B.1 | GO/NO-GO de cuentas: los 9 puntos de `customer-accounts-report.md` § 20 | Ambos | B + theme subido (G) | Medio | `customer` se llena en Liquid tras cada vía de ingreso. `/account/login` y `/account/register` van a las páginas de Shopify |
| **C** | **Importar catálogo** (29 productos, 98 variantes, 95 imágenes) desde `shopify-migration/shopify-import/` | Ambos | A | Medio | Conteos iguales al snapshot. Opción de talla llamada "Talla" (el theme la detecta por nombre). Inventario con seguimiento de Shopify. Precios en COP |
| C.1 | Tags de color en cada producto (búsqueda por color: Predictive Search no indexa metafields) | Ambos | C | Bajo | Buscar "negro" devuelve los productos negros |
| **D** | **Crear colecciones objetivo**: Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño (NO Accesorios/Hombre/Mujer/Niños/Calzado) | Ambos | C | Bajo | 4 colecciones con los handles del inventario SEO y sus productos |
| D.1 | Instalar/activar **Search & Discovery** y los filtros (talla, precio, disponibilidad) | Daniela | D | Bajo | El panel de filtros aparece en la colección (sin la app no se muestra, no da error) |
| **E** | **Crear metafields y metaobjects** (ver el inventario de datos del reporte § 14) | Ambos | C, D | Medio | Definiciones creadas en Admin con el namespace/key exactos. `custom.wishlist` de cliente creada **pero sin encender la sincronización** |
| **F** | **Menús y páginas**: `main-menu`, menú del footer, `customer-account-main-menu`. Página "Favoritos" con plantilla `page.wishlist`. Páginas de envíos/devoluciones/garantía. Políticas | Daniela | D | Bajo | El header muestra las 4 colecciones. El footer muestra su menú. `/pages/favoritos` funciona |
| **G** | **Subir el theme RC1** (Tienda online > Temas > Agregar tema > Subir ZIP). **No publicar** | Daniela | A | Bajo | El theme aparece como no publicado, sin errores de subida. El SHA-256 del ZIP coincide con el del manifiesto |
| **H** | **Configurar el Theme Editor** | Daniela (Claude puede guiar) | F, G | Bajo | Logo, favicon, colores, tipografía (Poppins por defecto) y secciones del inicio (categorías, colecciones de los carruseles, hero, banner). Favoritos: `wishlist_page` = Favoritos. Envío gratis: umbral en 299900, barra de progreso **apagada** hasta tener la tarifa gratis configurada. `wishlist_account_sync` **apagado** |
| H.1 | Regresión en la tienda real: las 13 superficies (A–M del reporte § 9) en 9 anchos, teclado, sin JS | Ambos | H | Medio | Mismos resultados que el harness offline. Diferencias documentadas |
| **I** | **App custom de favoritos**: definición `custom.wishlist`, app proxy, función sin estado, app embed con el transporte | Ambos (Claude construye con autorización) | B.1 aprobado, E | Alto | GO/NO-GO de cuentas en verde. Escrituras con identidad firmada y `compareDigest`. Recién después encender `wishlist_account_sync` en la tienda de prueba |
| **J** | **Customer Account extension** "Mis favoritos" (full-page, menú de la cuenta) | Ambos | I, plan con UI extensions (Basic+) | Medio | Página en el menú de la cuenta. Lista la misma cuenta. "Quitar" funciona |
| **K** | **Prueba de Wompi** como medio de pago en Shopify (app/gateway de Colombia) | Daniela | A, C | Alto | Pago de prueba aprobado y reflejado en el pedido. Nada de credenciales en el theme |
| **L** | **Analytics** (Customer Events / pixels, GA4/Meta) usando los eventos del theme (`cart:*`, `wishlist:*`, `search:*`, `product:*`) | Ambos | G, H | Medio | Eventos llegan sin PII. Consentimiento de cookies respetado |
| **M** | **Redirects SEO** (Tienda online > Navegación > Redirecciones de URL): inventario `seo/current-url-inventory.csv` + rutas de cuenta/favoritos del reporte § 13 | Ambos | C, D, F | Alto | Cada URL vieja responde 301 a su nueva. Sin cadenas ni loops |
| **N** | **QA integral** (compra de punta a punta, mobile real, accesibilidad, velocidad, emails de Shopify) | Ambos | G–M | Medio | Checklist de QA firmado por Daniela |
| **O** | **Tienda comercial y cutover**: plan pago, dominio, DNS, publicar el theme, apagar el sitio actual | Daniela (con decisión explícita) | N aprobado | Alto | Dominio apuntando a Shopify, redirects activos, pedidos entrando, sitio viejo en modo lectura |

## Estado después de 03A (2026-09-28)

- **A. Hecho** (Daniela): Development Store "Radaelli Swimwear Dev" (`radaelli-swimwear-dev.myshopify.com`), plan de prueba Basic.
- **G. Hecho** (Claude, por CLI): theme **Radaelli RC1** `189072474431` subido **sin publicar**. Su contenido equivale a **RC1.1** (`dist/radaelli-shopify-theme-rc1.1.zip`). Horizon sigue live.
- **B. Parcial:** New Customer Accounts **ya vienen activas** en la dev store (`<shopify-account>` renderiza). Faltan los GO/NO-GO de cuentas.
- **Nuevo antes de H** (hallado en 03A):
  - poner **español** como idioma principal (hoy EN);
  - mercado/moneda **Colombia/COP** (hoy US/USD);
  - decidir la **página de contraseña** (el theme no trae `password.json` ni `layout/password.liquid`).
- **Antes de cada push**, correr `node shopify-migration/scripts/audit-theme-limits.mjs shopify-migration/theme-src` además de Theme Check: Shopify rechaza límites que Theme Check no ve.

Detalle: `theme/03A-development-store-upload-report.md`.

## Estado después de 03B (2026-09-29)

- **Hecho** (lo de "Nuevo antes de H"):
  - español predeterminado del dominio (`/`), inglés en `/en`;
  - COP, mercado Colombia (región de respaldo Colombia), Bogotá, métrico/kg;
  - página de contraseña propia (`layout/password.liquid` + `templates/password.json` + `main-password`);
  - `theme_support_email` real;
  - página `favoritos`;
  - menú principal "Inicio".
- **B. Parcial:**
  - GO/NO-GO #9 **parcial**: GET legacy → login nuevo = GO; el POST legacy a `/account` queda sin probar.
  - GO/NO-GO #1 **diferido**: falta que Daniela escriba el código del login de cliente en su Chrome. Producto y colección, después de 03C.
  - La sincronización de cuenta sigue OFF.
- **Diferido a la publicación:**
  - asignar la plantilla `page.wishlist` a la página Favoritos (el Admin solo ofrece plantillas del theme publicado; mientras tanto el header usa `?view=wishlist`). **Hacerlo antes de activar los redirects de `/favoritos` (paso M) y en el mismo paso del cutover (O).**
  - cambiar el **idioma principal de la tienda** a Español (Shopify reescribe también Horizon).
- **Decisiones de negocio abiertas:**
  - entidad y dirección de la tienda en EE. UU.;
  - mercado United States activo;
  - tono voseo o tuteo.
- **Siguiente fase:** 03C (catálogo), cuando ChatGPT la habilite. Envíos, impuestos y pagos siguen sin tocar.

Detalle: `theme/03B-store-foundation-report.md`.

## Orden y checkpoints

- A → B → C → D → E → F → G → H → H.1 → **checkpoint de Daniela** → I → J → K → L → M → N → **checkpoint de Daniela** → O.
- I y J no empiezan sin el GO/NO-GO de cuentas (B.1) en verde.
- O no empieza sin decisión explícita de Daniela.
- **Phase 03** (validación en Development Store): tienda conectada en 03A y configurada en 03B. Cada subfase la habilita ChatGPT con `READY_FOR_CLAUDE_<fase>`.
