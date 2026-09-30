# Product Page (PDP) — Fase 02H

Modelo: **Opus 5.5** (`claude-opus-5-5`, esfuerzo `xhigh`, confirmado por los metadatos de la sesión en la app). Duración: 11:23 → 11:50 (~27 min).

## 1. Componentes/rutas reales auditados (lectura completa, directa)

`app/producto/[slug]/page.tsx`, `components/product-detail/` (product-detail, product-variant-picker, product-lightbox, product-meta, size-guide-modal, back-in-stock-button, product-wishlist-button, live-viewers, product-view-analytics, view-tracker), `components/product/gallery.tsx`, `components/grid/tile.tsx`, `components/ui/accordion.tsx`, `components/catalog/recently-viewed.tsx`, `components/cart-drawer/cart-store.tsx` (qué pasa tras "Añadir al carrito"), `lib/catalog/catalog-actions.ts` (`listRelatedProductsAction`).

## 2. Layout real replicado

Link "Volver a {colección}" + miga de pan con "/" → tarjeta `rounded-lg border p-8 md:p-12`, galería 4/6 + info 2/6 desde lg → título h1 `text-3xl md:text-4xl` → precio `text-2xl` + píldora "Agregar a favoritos" → disponibilidad (Disponible / Últimas unidades + "Solo quedan N" / Agotado) + SKU → "Color — X" → tallas → botón de compra → 4 acordeones (Descripción, Cuidados, Envíos/devoluciones/garantía, Métodos de pago) → "También te puede interesar" (4 productos).

## 3. Arquitectura

| Archivo | Rol |
|---|---|
| `sections/main-product.liquid` | Orquestador; acordeones como bloques |
| `sections/product-recommendations.liquid` | Relacionados (sección aparte) |
| `snippets/product-gallery.liquid` | Galería + visor |
| `snippets/product-variant-picker.liquid` | Opciones/tallas |
| `assets/product-form.js` | Variantes, precio, compra, diálogos |
| `assets/product-gallery.js` | Navegación, swipe, lupa, sync con variante |
| `assets/product-lightbox.js` | Visor: zoom, pan, pinch, teclado |
| `assets/section-product.css`, `component-product-gallery.css`, `component-variant-picker.css` | Estilos |

Los 3 CSS + 3 JS de la PDP se cargan **solo en el template de producto** (las fases anteriores cargaban todo en todas las páginas).

## 4. Variantes / talla / color

- Resolución de variante en JS a partir de un JSON mínimo por variante (id, opciones, disponible, precio ya formateado con `money`, compare-at, SKU, media). No se incrusta el `product | json` completo.
- Talla detectada por nombre (talla/size/tamaño), no por posición. Radios reales en `<fieldset>` (el real usa `<button aria-pressed>`).
- EXACT del real: con varias tallas arranca sin selección; tallas agotadas se pueden elegir (tachadas) y el botón queda en "Talla agotada"; sin talla muestra "Elegí una talla antes de continuar." (texto real).
- Opciones de un solo valor ("Única") no se muestran y quedan elegidas solas (igual que el real).
- Color: texto "Color — X" desde `custom.color` (color es producto, no variante, según data-architecture.md). Si alguna Option es de color, se muestra como píldoras de texto — nunca swatches inventados.
- `?variant=<id>` con `history.replaceState` (no rompe "atrás"). Disponibilidad por valor recalculada según lo elegido en las otras opciones (sirve para 1..3 opciones).

## 5. Precio / disponibilidad / compra

- `price.liquid` ganó un modo `interactive` (retrocompatible: la tarjeta de producto no cambia). Rango "Desde X" solo si no hay variante elegida y los precios difieren.
- No se trae la cascada de descuentos del backend Next: se usa `compare_at_price` nativo.
- "Últimas unidades"/"Solo quedan N" (umbral 5, igual que el real) **solo si Shopify rastrea el inventario de todas las variantes sin vender en negativo** — si no, nunca se estima. Dependencia real: la cantidad exacta de stock sigue pendiente desde la Fase 01E.
- Compra: `{% form 'product' %}` nativo → `/cart/add` → `/cart`. Evento cancelable `product:add-to-cart` para que el drawer AJAX de 02I lo intercepte sin reescribir nada. Sin cantidad (el real no tiene selector de cantidad: siempre 1). Estado de carga, bloqueo de doble envío, recuperación desde bfcache, y `<noscript>` para comprar sin JS.

## 6. Galería / visor / zoom

- Galería EXACT: caja cuadrada con tope 550/640px, contain, contador y píldora de flechas (escritorio), puntos afuera (mobile), miniaturas de 112px (escritorio), clic abre el visor ya en x2.5.
- Media: imagen, video Shopify, video externo; modelo 3D muestra su vista previa (sin visor 3D — el catálogo real es solo fotos).
- Swipe mobile con scroll-snap nativo (el real detecta el gesto a mano); navegación circular; foto de la variante elegida se muestra sola.
- Lupa escritorio: 220% por `background-position` usando `currentSrc` (la imagen ya descargada, 0 descargas extra).
- Visor: `<dialog>` nativo (foco, Escape, fondo inerte, top layer por el navegador); scroll bloqueado solo con CSS (`:root:has(dialog[open])`); zoom 1–4x (rueda ±0.3, botones/teclado ±0.5, tap alterna 2.5x); Pointer Events unificados para arrastre y **pinch real**; **límites de arrastre** (el real no tiene); caja "contain" por unidades de container query (el real usa ResizeObserver + cálculo a mano); fotos grandes bajo demanda (el real pide todas al abrir).

## 7. Guía de tallas

Prioridad: metaobject vía `product.metafields.custom.size_guide` (tipo `size_guide`: `image` file_reference, `content` rich_text opcional). Respaldo: imagen + texto en la sección, restringible a una colección (el real solo la muestra en Oasis Natural). `<dialog>` nativo, cierra con Escape/botón/fondo, devuelve el foco. No se creó ningún metaobject.

## 8. Acordeones / relacionados / wishlist

- `<details>` nativo, "+" que gira 45°; animación de altura solo CSS (`::details-content`) donde el navegador lo soporta, instantáneo donde no. Cuidados: la lista real como bloque editable. Métodos de pago: íconos nativos `shop.enabled_payment_types` en vez del texto real que nombra Wompi (sería falso en Shopify).
- Relacionados: puerto server-side del algoritmo real (misma colección, +2 mismo color, +1 precio ±30%, +1 con stock, máx. 4). Desempate por orden de colección (el real, al azar). No usa el endpoint nativo de Shopify (otro algoritmo).
- Favoritos: inerte (`data-wishlist-trigger`), igual que header y tarjeta.

## 9. No migrado a propósito

- **Vistas** (suma vistas reales + "promocionales" cargadas a mano) y **"N personas viendo esto"** (el backend real devuelve 5 cuando solo está la clienta): prueba social inventada. Se eliminó el setting muerto `show_live_viewers`.
- **"Avísame cuando vuelva"**: requiere backend de emails (app o Shopify Flow). **"Vistos recientemente"**: localStorage. Dependencias futuras documentadas.
- Tallas de calzado (CO·US·UK·CM): categoría retirada, 0 productos.

## 10. Accesibilidad

h1 único; radios en fieldset con legend; agotado comunicado con tachado + texto oculto (no solo color); región `role="status"` anuncia talla/precio/disponibilidad; roving tabindex en la galería; visor y guía navegables solo con teclado. Divergencias de contraste deliberadas: texto de talla agotada (#d4d4d4, 1.5:1 en el real → 5.7:1), borde de agotada elegida (2.5:1 → 4.7:1), SKU (#a3a3a3, 2.5:1 → 5.7:1).

## 11. Verificación

- Theme Check: 0 errores / 0 warnings (49 archivos). `node --check` en los 3 JS: OK.
- Harness de interacción aislado (en el scratchpad, fuera del repo) con los CSS/JS reales del theme cargados como módulos: **20/20 pruebas PASS** con clics, teclado y arrastre reales + pinch sintético (el navegador de prueba no hace multi-touch): error sin talla + foco, cambio de precio/compare/-%/SKU/URL, talla agotada, sync de foto por variante, hook de compra cancelable, carga + doble envío + bfcache, visor (abre en foto visible a x2.5, foco, bloqueo de scroll, contain 299×299 y 224×299), límites de arrastre exactos (0 / 224.25px), tap, flechas circulares, tope 1–4x, rueda, Escape + devolución de foco, reapertura por teclado, cierre por fondo, pinch (x2.5 exacto, tope 4x, paneo con un dedo), layout escritorio, flechas/miniaturas/roving tabindex, lupa, guía de tallas (Escape/fondo/botón/foco), 320px sin desborde, swipe + snap, reglas de reduced-motion.
- Secrets 0, dominios/IDs de tienda 0, referencias funcionales a Next/React/Prisma/Neon/Wompi/Vercel/Cloudinary 0.

## 12. Dependencias para 02I

Escuchar `product:add-to-cart` (cancelable) para el drawer AJAX; el header ya tiene `data-cart-drawer-trigger`. Back-in-stock y Vistos recientemente quedan fuera de 02I salvo decisión explícita.

## 13. Fidelidad visual estimada

**~90%**: estructura, medidas, copy y estados EXACT; las diferencias son deliberadas (contraste, carga diferida, límites de pan) o de plataforma (media no-imagen, relacionados sin azar).
