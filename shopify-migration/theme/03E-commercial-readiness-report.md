# 03E — Preparación comercial y de lanzamiento (sin publicar)

- **Fecha:** 2026-09-29, 11:48 → 14:20 (Bogotá), con una pausa de ~25 min por límite de uso.
- **Tienda:** Development Store `radaelli-swimwear-dev`. Theme Radaelli (`189072474431`) **sin publicar**; Horizon (`189072113983`) live y sin tocar.
- **Método:**
  - pipeline de 14 agentes: 7 productores de escritorio más **7 verificadores adversariales**, que corrigieron cada entregable y confirmaron o refutaron cada bug;
  - pruebas en vivo en la tienda;
  - correcciones del theme con tests y mutantes.

## Resumen ejecutivo

1. **Dos bloqueos de lanzamiento, medidos en vivo** (`theme/03E-checkout-baseline-report.md`). Los resuelve la dueña en ~15 min (puntos 1–2 de `theme/03E-owner-actions-one-shot.md`):
   - **C1:** la tienda trata a todos los visitantes como **EE. UU.** El mercado principal sigue siendo EE. UU. y el checkout abre en `es-us`.
   - **C2:** para Colombia, **los 29 productos figuran AGOTADOS** (add-to-cart 422). El perfil de envío solo tiene la zona "Domestic – Estados Unidos" y la sucursal está en EE. UU.
2. **Pagos:** Wompi = **SUPPORTED VIA OFFICIAL APP/PROVIDER** (integración oficial de Wompi Co: redirección como proveedor alternativo en Configuración > Pagos + app "Wompi Tarjetas"). Shopify Payments no existe en Colombia y una app de pagos propia no es viable. Instalar = OAuth de la dueña. Que se pueda instalar **en esta tienda hoy** es NOT_VERIFIED: la lista de proveedores depende de la dirección de la tienda, hoy en EE. UU. (C1).
3. **Envíos:** no existe en ninguna fuente revisada (repo, historial git y reportes; la base de producción no se consultó) una tarifa real por debajo de $299.900. El sitio real **nunca cobra envío**: por debajo del umbral lo "coordina" a mano por pedido. La decisión D2 queda en la dueña. `free_shipping_rate_confirmed` sigue OFF.
4. **Búsqueda: 29/29 indexados** (incidente cerrado). Color resuelto con **1 tag plano** (`MOSTAZA`); los prefijos `color:` no eran buscables. Corregí mi conclusión de 03D.
5. **RC1.5:** 26 defectos confirmados por los verificadores o medidos en vivo, corregidos con tests (SEC-06 y A11Y-03 se resuelven con un mismo cambio):
   - 5 de seguridad;
   - 17 de accesibilidad o contraste;
   - noindex;
   - LCP de la primera fila;
   - metafields del banner;
   - copy.

   Arnés **69/69**; **27/27 mutantes** detectados; matriz real **63/63**; remoto = ZIP 96/96.
6. **App de favoritos 0.1.1:** SEC-05 corregido; 156/156 tests, 20/20 mutantes, zip determinista. Sigue sin instalar (owner).
7. **Owner-only:** una sola lista de 10 puntos, ordenada por desbloqueo: `theme/03E-owner-actions-one-shot.md`.

## Los 47 puntos

| # | Punto | Resultado |
|---|---|---|
| 1 | Modelo | Claude Opus 5.5 (`claude-opus-5-5`), ULTRACODE |
| 2 | Tiempo | 11:48 → 14:20 (Bogotá), ≈ 2 h 07 min efectivas (2 h 32 min de reloj menos la pausa de ~25 min por límite de uso) |
| 3 | Uso | Total de la sesión: UNAVAILABLE. Workflow de escritorio: 14 agentes, ~3,55 M tokens, 1439 tool uses. Una primera corrida del workflow se detuvo por el límite de uso y se relanzó completa |
| 4 | Cobertura final del índice | **29/29** desde las 11:49 (re-verificado a las 12:27; matriz de consultas a las 12:40). `theme/03E-search-final-report.md` |
| 5 | "mostaza" | **Encontrado** → `entero-golden-hour`, en predictive (12:27) y `/search` (12:40), por el tag plano `MOSTAZA`. El tag `color:MOSTAZA` no funcionaba. "blanco" funciona por la **descripción** (corrige 03D). Es el único tag del catálogo |
| 6 | Search & Discovery | **No instalada** (OAuth, owner). Preparación completa: `theme/03E-search-discovery-prep.md`. Talla con valores reales (S29/M29/L28/XL11/"L y XL"1), Color (`custom.color`, single_line_text soportado), Precio. **Sin** Disponibilidad. El theme no necesita cambios |
| 7 | Checkout baseline | Abre desde el carrito. Ítem, talla y subtotal correctos ($199.920 COP, sin doble descuento). Pago: "no puede aceptar pagos". **C1 (US) y C2 (CO agotado)**. Mobile no medido (ventana no redimensionable; UI nativa) |
| 8 | Wompi en Shopify | **SUPPORTED VIA OFFICIAL APP/PROVIDER**. `payments/03E-wompi-shopify-feasibility.md`, con evidencia por afirmación y árbol PATH A / PATH B. Instalable en esta tienda hoy: NOT_VERIFIED (la lista de proveedores se filtra por la dirección de la tienda, hoy EE. UU.) |
| 9 | Bloqueos de pago (owner) | Dirección y mercado en CO; instalar Wompi (OAuth) y credenciales en modo prueba; separar ambientes (URL de eventos vs. staging y sitio en vivo); checkout con email y teléfono obligatorio; comisión Shopify por proveedor externo según plan; reembolsos y pagos pendientes NOT_VERIFIED (preguntar a Wompi) |
| 10 | Fuente de verdad de envíos | **Tarifa por debajo del umbral: NO ENCONTRADA.** El real cobra 0 y cotiza a mano ("por coordinar", `Order.quotedShippingCost`). Envia, estándar 3–5 días hábiles y express 24–48 h (solo ciudades principales) sin precio. Sin pesos. `shipping/03E-shipping-source-of-truth.md` |
| 11 | Evidencia del umbral | **$299.900**: HTML en vivo de `/envios`, `lib/checkout/pricing.ts:45` (`>=`, después del cupón), `schema.prisma` default 299900 |
| 12 | Tarifa bajo el umbral | **NOT_SET** (decisión D2 de la dueña). Estructura del perfil lista para ejecutar |
| 13 | Legales migradas | **2 de 6** (Reembolso y Garantía, verificadas por hash en 03D). **Footer "Ayuda" activo** con esas 2 (menú `ayuda` + bloque, RC1.5). Links de legales subrayados |
| 14 | Bloqueos legales | 4 páginas owner-only (el clasificador de permisos denegó la escritura en 03D; no se reintentó); razón social, NIT y dirección NOT_AVAILABLE; revisar "Pago", terceros y cookies según pagos y analítica |
| 15 | Media preparada | Plan y script listos (`scripts/prepare-media-package.mjs`, dry-run: 12 descargas + 1 copia local, 1 omitida (póster del hero), ~20,7 MB esperados sin contar la entrega transformada de M13, 0 problemas). **Descargados: 0** (descargar requiere el OK explícito de la dueña) |
| 16 | Media subida | **0** |
| 17 | Hero | Mapa y script de cableado listos (`scripts/apply-media-wiring.mjs`, dry-run con mapa FAKE). **Bug latente corregido:** con video, el h1 del hero salía #171717 sobre video oscuro |
| 18 | Media de colecciones | Plan listo (metafields + bloques). **Bug latente corregido:** el banner leía los metafields sin `.value` (ancho y alto vacíos) → `.value`, probado con metafields como objetos (mutante 46 detectado) |
| 19 | Guía de tallas | Plan listo (`size_guide_image` + colección `oasis-natural`). Alt "Guía de tallas" corregido. Contenido de texto NOT_AVAILABLE |
| 20 | Plan de redirects | **47 filas** (`seo/shopify-redirects-import.csv`, formato exacto), **102 URLs clasificadas**, validador PASS (14 controles, 0 errores). 4 legales "pending" |
| 21 | Prueba de redirects en Dev | **No ejecutada:** la ventana de Chrome quedó en segundo plano y el Admin no renderiza. CSV listo; importar es 1 minuto (Claude, con la ventana visible, o al publicar) |
| 22 | Canonical | **PASS** en vivo: orden y filtros → canonical base; producto en colección → `/products/…`; `?view=wishlist` → `/pages/favoritos`; `/en` propio + hreflang. `theme/03E-seo-technical-audit.md` |
| 23 | Robots / sitemap | `robots.txt` de Shopify **no** bloquea `/search` → **noindex en búsqueda, favoritos y 404 (RC1.5, paridad real)**. Sitemap 200 (índice por tipo). Meta description de la Home vacía (copy de la dueña) |
| 24 | Arquitectura de analítica | **Opción A (recomendada; elegir A o B es decisión de la dueña, § 11 del plan):** GA4 con la app Google & YouTube; Meta con Facebook & Instagram (Mejorado/Máximo: pixel + CAPI en la compra); custom pixel Radaelli solo para huecos. Mapa de eventos completo (incluye wishlist). `analytics/03E-analytics-plan.md` |
| 25 | Implementación de analítica | `analytics/custom-pixel/` consent-aware, **apagado** (ENABLED:false, IDs vacíos): **55/55 tests**, 19/19 mutantes (temporales, en el scratchpad). Sin cuentas conectadas ni IDs inventados |
| 26 | Seguridad | **Listo con condiciones → condiciones cumplidas en RC1.5:** SEC-01/02/03/04/06 corregidos y probados. En vivo: P1, P1b, P2 y P3 con 0 inyecciones; P4 (`?vista=2%203`) → 3 columnas, 0 errores. P5 pendiente (necesita la app instalada, owner). SEC-05 (app) corregido. `theme/03E-shopify-security-readiness.md` |
| 27 | Escaneo de secretos | **0** en theme-src, app, `content/legal` y los ZIP RC1.5 y app 0.1.1; 0 `.env` en los paquetes |
| 28 | Rendimiento | `theme/03E-performance-baseline.md`: 0 JS bloqueante; 100% de imágenes con srcset, dimensiones y alt; ficha eager + fetchpriority; **colección y búsqueda: primera fila corregida a eager**. LCP no medible (ventana en segundo plano) |
| 29 | Accesibilidad | Auditoría estática verificada + DOM en vivo: 17 defectos corregidos en RC1.5 (incluido el **h1 invisible del banner de colección**). Pendiente de marca: CTA blanco sobre arena (1,69:1, idéntico al real) |
| 30 | App de favoritos | **156/156 tests** y **20/20 mutantes** (se sumó `transport-backslash-host`) |
| 31 | Paquete de la app determinista | **0.1.1**: `dist/radaelli-wishlist-app-0.1.1.zip`, SHA-256 `f14f068a962a617d255c9cfba6a9ba581496c5c6b3c7dc4713ac2b4bb1be1de8`, 35 entradas, mismo hash en 2 empaquetados. La 0.1.0 queda como histórico |
| 32 | Archivo one-shot de la dueña | **SÍ:** `theme/03E-owner-actions-one-shot.md` (10 puntos por desbloqueo) + `app/OWNER-WORKFLOW.md` |
| 33 | Theme cambiado | **SÍ:** 25 archivos (lista en § B) |
| 34 | Release | **RC1.5** `dist/radaelli-shopify-theme-rc1.5.zip`, SHA-256 `1a506a41ae482d7c1426dc9228e5a16f4659631a338804c1680f5de1317cf2e2`, 173.232 bytes, 96 archivos, determinista. Remoto = ZIP 96/96 |
| 35 | Theme Check | **0 errores / 0 warnings** (theme-src y ZIP extraído) |
| 36 | Regresión | Arnés offline **69/69** (54 de 03D + 15 nuevos) con **`eq` por identidad de nodos** (antes las aserciones de foco no comparaban nada: lo destapó el mutante 39). Mutantes 03E **27/27** (22–48), control 30/30 |
| 37 | JS fatal | **0 propios** (matriz 63/63 y navegación real). Solo el artefacto `preview-bar` de Shopify en srcdoc |
| 38 | Liquid fatal | **0** |
| 39 | Horizon sin tocar | **SÍ** (`189072113983 live Horizon`) |
| 40 | Radaelli sin publicar | **SÍ** (`189072474431 unpublished`) |
| 41 | Catálogo 29/98/95 | **SÍ** (14:14). Cambios de catálogo en 03E: tag `color:MOSTAZA` → `MOSTAZA` y se quitó `color:BLANCO` |
| 42 | Producción / Staging / main | **NO** |
| 43 | Pagos activados | **NO** |
| 44 | Owner-only | `theme/03E-owner-actions-one-shot.md`: mercado CO y dirección · zona de envío CO y tarifa D2 · proveedor de pago · código de login · OK para S&D · OK para descargar media · legales + NIT · IDs de analítica · app de favoritos · decisiones de marca/copy |
| 45 | Bloqueos para 03F | C1/C2 (owner) antes de cualquier prueba de checkout en Colombia; pagos (owner); resto en la lista única. Tareas de Claude pendientes: importar redirects en Dev con la ventana visible, y re-medir mobile y LCP con la ventana visible |
| 46 | READY FOR 03F | **SÍ.** Todo lo independiente quedó hecho; lo restante es owner-only o depende de la ventana visible |
| 47 | CERO TAREAS DE SEGUNDO PLANO ACTIVAS | Se confirma al cierre del handoff |

## A. Hallazgos que cambiaron conclusiones previas

- **03D, color por tag:** "blanco" funcionaba por la descripción, no por `color:BLANCO`.
  - El predictive **ignora `fields`** y busca en descripciones.
  - Los tags con prefijo `color:` no generan tokens; los planos sí.
- **QA de 03C/03D:** todo se probó con la sesión resuelta a **EE. UU.** Con Colombia, la tienda está agotada. Por eso C1/C2 son el primer punto de la lista owner-only.
- **Arnés:** su `eq()` comparaba nodos DOM con `JSON.stringify` (siempre `"{}"`).
  - Corregido y re-corrido: las aserciones de foco existentes eran correctas, pero no estaban probando nada.
  - El arnés ahora también modela los metafields como objetos `{value}` (antes crudos), que es lo que escondía el bug del banner.

## B. Cambios del theme en RC1.5 (25 archivos)

| Área | Cambio | Archivos |
|---|---|---|
| SEO | noindex en búsqueda, favoritos y 404 | `layout/theme.liquid` |
| LCP | Primera fila (4) de colección y búsqueda eager; secundaria siempre lazy | `sections/main-collection.liquid`, `sections/main-search.liquid`, `snippets/product-card.liquid` |
| Contraste | h1 del banner de colección y del hero heredan el color de la sección (EXACT real) | `assets/section-collection-banner.css`, `assets/section-hero.css` |
| Footer | Bloque "Ayuda" (menú `ayuda`: Devoluciones, Garantía) | `sections/footer-group.json` |
| SEC-01/03 | `sort_by` validado contra las opciones de Shopify; valores de filtro y etiquetas escapados | `snippets/collection-filters.liquid` |
| SEC-02 | `<title>`/`og:title` con `escape_once`; "tagged" → `general.meta.tags` | `layout/theme.liquid`, `locales/*.json` |
| SEC-03 | `shop.name`, `product.title` y `discount.title` escapados | `sections/header.liquid`, `sections/footer.liquid`, `sections/predictive-search.liquid`, `snippets/cart-summary.liquid`, `snippets/product-card.liquid` |
| SEC-04 | `?vista` con lista blanca | `assets/collection-filters.js` |
| SEC-06 + A11Y-03 | Orden sin JS inline; las flechas no navegan; Enter / "Aplicar" / mouse sí | `assets/collection-filters.js`, `snippets/collection-filters.liquid` |
| A11y | Precio anterior anunciado (+ `position:relative` contra overflow en carruseles), links subrayados, `role="group"`, `autocomplete`, sin "Vista rápida" inerte, overlay sin taps, foco hacia adentro, carrusel, contraste de sugerencias, live regions, `aria` del trigger / visor / header, alt de la guía, `aria-current` en chips | `snippets/price.liquid`, `assets/component-card.css`, `assets/base.css`, `sections/footer.liquid`, `sections/newsletter-home.liquid`, `assets/product-carousel.js`, `assets/section-header.css`, `assets/search.js`, `sections/main-collection.liquid`, `snippets/product-gallery.liquid`, `sections/header.liquid`, `sections/main-product.liquid` |
| Metafields | Banner con `.value` (imagen, video, encuadre) | `snippets/collection-banner.liquid` |
| Copy | "Free shipping on orders of {{ amount }} or more." (regla `>=`) | `locales/en.json` |

## C. Documentos de 03E

`theme/03E-search-final-report.md`, `theme/03E-checkout-baseline-report.md`, `theme/03E-seo-technical-audit.md`, `theme/03E-shopify-security-readiness.md`, `theme/03E-accessibility-static-audit.md`, `theme/03E-performance-baseline.md`, `theme/03E-search-discovery-prep.md`, `theme/03E-owner-actions-one-shot.md`, `payments/03E-wompi-shopify-feasibility.md`, `shipping/03E-shipping-source-of-truth.md`, `analytics/03E-analytics-plan.md` + `analytics/custom-pixel/`, `seo/03E-redirect-plan.md` + `seo/shopify-redirects-import.csv` + `seo/validate-redirects.mjs` + `seo/03E-seo-offline-review.md`, `content/media/03E-wiring-plan.md` + `scripts/prepare-media-package.mjs` + `scripts/apply-media-wiring.mjs`, `app/OWNER-WORKFLOW.md`, `catalog/color-search-tag-map.csv` (regenerado).
