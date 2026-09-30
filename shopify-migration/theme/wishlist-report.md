# Wishlist / Favoritos — Fase 02K

Modelo: **Opus 5.5** (`claude-opus-5-5`). Inicio 13:09, fin de validación 13:24 (2026-09-28).

## 1. Favoritos reales auditados (lectura directa del código ejecutable)

Archivos leídos:

- `components/wishlist/`: `wishlist-store.tsx`, `wishlist-heart-button.tsx`, `wishlist-page.tsx`, `wishlist-item-card.tsx`, `use-favorite-products.ts`
- `lib/wishlist/`: `wishlist-actions.ts`, `storage-adapter.ts`, `types.ts`
- `lib/guest-identity.ts`
- `components/product-detail/product-wishlist-button.tsx`
- `components/layout/navbar/index.tsx`, `components/layout/navbar/mobile-menu.tsx`
- `app/favoritos/page.tsx`, `app/cuenta/favoritos/page.tsx`
- `components/catalog/catalog-product-card.tsx`

### Arquitectura real encontrada: HÍBRIDA y EN SERVIDOR (no localStorage)

Los comentarios de `storage-adapter.ts` dicen que pasó de localStorage (Sprint 6) a Postgres (Sprint 13). El código ejecutable lo confirma.

| Caso | Comportamiento real |
|---|---|
| Invitada | Tabla `Wishlist` en Postgres, identificada por la cookie **httpOnly** `lago-wishlist-id` (180 días, UUID sin datos personales). Solo un guardado crea la cookie; las lecturas no, por un bug de carrera corregido en sept. 2026. |
| Con sesión | `Wishlist.userId` (una por cuenta), **sincronizada entre dispositivos**. |
| Al iniciar sesión o registrarse | `mergeGuestWishlistIntoUserAction`: **unión** de productos, sin duplicados, y se borra la de invitada. |
| Ítem | Solo `productId` + `createdAt`. Precio, foto y stock se piden al catálogo en vivo (`getByIds`). |
| Guardado | Optimista, **sin rollback**. Reemplaza la lista entera. Rate limit 100/15 min por dueña, con descarte silencioso. |
| Analytics | Solo `add_to_wishlist { product_id }`. No hay evento de quitar ni de ver. |

### Interfaz real

- **Tarjeta** (`WishlistHeartButton`): 32 px `bg-white/90`, "Añadir a favoritos" / "Quitar de favoritos", `aria-pressed`, corazón lleno `red-500` y "pop" de framer-motion (spring 400/15, tap 0.8).
- **Ficha** (`ProductWishlistButton`): píldora "Agregar a favoritos" ↔ "Guardado" (borde/fondo/texto rojos), `aria-pressed`.
- **Header desktop:** corazón que es **link a `/favoritos`** (`aria-label="Favoritos"`, `hidden lg:flex`) con **badge de cantidad** igual al del carrito, oculto en 0.
- **Menú mobile:** "Favoritos" / "Favoritos (n)".
- **Página `/favoritos`:**
  - Miga "Inicio / Favoritos", eyebrow "Tu selección", h1 "Favoritos", "N producto(s) guardado(s)".
  - Caja vacía "Tu lista de favoritos está vacía." + "Guardá las prendas…" + "Explorar colección" → `/#categorias`.
  - Grilla de `WishlistItemCard` horizontal: foto, nombre, "Color: X", papelera "Eliminar de favoritos", precio con descuento, disponibilidad y "Ver producto" + "Agregar al carrito" (abre vista rápida) / "Agotado".
- **Fallas del real:**
  - mientras carga muestra "0 productos" y la caja vacía;
  - los productos borrados se filtran en silencio y no se pueden quitar;
  - el CTA vacío tiene blanco sobre nude (1.7:1);
  - la papelera en neutral-400 (2.5:1).
- **`/cuenta/favoritos`:** la misma lista dentro del área de cuenta. Queda para 02L.

## 2. Decisión Shopify: regla C (híbrido), solo la parte garantizable offline

- **Se implementa:** favoritos de **invitada por navegador**, que es el caso real sin sesión. Van en `localStorage` detrás de un **adaptador** (`localAdapter` en `assets/wishlist.js`: `init/load/save/subscribe`).
- **No se implementa** (queda para **02L**): la sincronización entre dispositivos de la clienta con sesión y la unión invitada → cuenta. Necesitan Customer Accounts más un backend (metafields de cliente vía app propia o una app de terceros), todo fuera de alcance.
- **Por qué no se finge nada:**
  - en Shopify no hay dónde guardar favoritos de servidor sin app ni cuenta;
  - la cookie httpOnly del real no tiene equivalente offline (el theme no puede escribir cookies de servidor);
  - `localStorage` da la misma experiencia de invitada (por navegador, sin login) sin prometer sincronización.
- **Qué deberá decidirse en 02L:**
  - dónde viven los favoritos con cuenta;
  - si al iniciar sesión se hace la unión como el real;
  - qué pasa en `/cuenta/favoritos`.

  El adaptador permite sumar un segundo origen sin tocar la UI.

## 3. Modelo de almacenamiento

- **Clave versionada** `radaelli:wishlist`: `{ "v": 1, "items": [{ "id": "<product id>", "handle": "<handle>" }] }`.
- **Qué guarda:** `id` (numérico de Shopify) es la identidad; `handle` sirve para pedir el producto. No guarda precio, stock, HTML, datos personales ni timestamp (el orden del array ya es el orden de alta, que es lo que usa el real).
- **Tope:** 100 productos. Al llegar, no se agrega y se anuncia "Tu lista de favoritos llegó al máximo de productos."
- **Limpieza al leer:** se quitan duplicados, ids no numéricos y basura.
- **JSON corrupto o versión desconocida:** se descarta y se sigue sin errores (verificado).
- **Almacenamiento no disponible** (bloqueado, modo privado estricto o cuota llena): funciona en memoria durante la pestaña, y la página avisa "Este navegador no permite guardar favoritos: se van a perder al cerrar la pestaña."

## 4. Fuente de verdad de los datos del producto

El navegador **nunca** es fuente de precio, stock ni foto. La página pide cada favorito a Shopify con la **Section Rendering API en contexto de producto**: `GET <root>/products/<handle>?section_id=wishlist-item` → `sections/wishlist-item.liquid`.

- **Datos del momento:** precio (snippet `price`, con compare-at nativo), foto, color (`custom.color`) y disponibilidad (mismo criterio que la ficha de 02H, sin estimar stock).
- **Requests:** hasta 4 a la vez; sin cache entre visitas (evita precios viejos); sin requests duplicados.
- **Producto borrado (404):** fila "Este producto ya no está disponible." con botón para quitarlo. El real lo ocultaba sin poder quitarlo.
- **Handle cambiado:** Shopify redirige al nuevo, se muestra el producto y **se actualiza el handle guardado** (verificado).
- **Handle reutilizado por otro producto:** se detecta (id distinto) y se trata como no disponible.
- **Error de red o 500:** fila "No pudimos cargar este producto. Recargá la página para intentar de nuevo." con opción de quitar.
- **A validar en la Development Store:** que Shopify exponga `product` a una sección pedida por `section_id` en una URL de producto (es el patrón de Dawn para refrescar la ficha).

## 5. Integraciones

- **Tarjeta** (`snippets/product-card.liquid`): el corazón placeholder de 02F pasa a ser un toggle real.
  - Estado: `aria-pressed`, nombre dinámico "Añadir a favoritos" / "Quitar de favoritos", corazón lleno `#ef4444` y "pop" CSS (curva con rebote que aproxima el spring real, anulado por reduced-motion); `:active` escala 0.8.
  - Es hermano del link (0 anidados) y sin doble evento.
  - **32 px visibles (EXACT) + área táctil de 44 px** con un pseudo-elemento.
- **Ficha** (`sections/main-product.liquid`): la píldora de 02H es un toggle real "Agregar a favoritos" ↔ "Guardado", con el mismo estado y evento. Texto guardado en #b91c1c: el `red-600` real da 4.4:1 sobre `red-50`, no llega a AA.
- **Header** (`sections/header.liquid`): el botón inerte de 02C pasa a ser **link** a la página de favoritos (EXACT del real) con badge igual al del carrito, `aria-hidden` porque la cantidad ya está en el texto oculto "Favoritos (n)". Menú mobile: "Favoritos (n)". URL: setting `wishlist_page` o `/pages/favoritos` con el prefijo de idioma.
- **Página:** `templates/page.wishlist.json` → `sections/main-wishlist.liquid` (`<wishlist-page>`). Es ruta Shopify estándar: Daniela crea la página "Favoritos" con esa plantilla. Copy, estructura y tarjeta horizontal EXACT del real.
  - "Agregar al carrito" lleva a la ficha porque el theme no tiene vista rápida (02F).
  - Mientras carga, "Cargando tus favoritos…" (el real mostraba vacío).

## 6. Primer render / hidratación

- **Corazones:** nacen **`hidden`** y el JS los muestra ya con el estado correcto: 0 corazones con estado falso y 0 layout shift, porque en la tarjeta son absolutos y en la ficha la fila es `space-between`.
- **Badge:** nace oculto, así que nunca aparece un número falso.
- **Sin JS:** no quedan corazones que no hacen nada. El link del header funciona y la página explica que hace falta JavaScript.

## 7. Eventos y analytics

Un solo contrato, en `document` y sin datos personales:

| Evento | Detalle | Equivalente real |
|---|---|---|
| `wishlist:updated` | `{ count, ids, source: init \| toggle \| page \| storage, persistent }` | |
| `wishlist:add` | `{ productId, handle }` | `add_to_wishlist` |
| `wishlist:remove` | `{ productId, handle, source }` | |
| `wishlist:view` | `{ count }` | |

- Un solo listener delegado para todos los corazones del sitio.
- `syncTriggers()` se aplica una vez por cambio, sin listeners por tarjeta ni tormentas de eventos.
- API mínima para fases futuras: `window.Radaelli.wishlist.{has, items, sync}`.

## 8. Varias pestañas

Evento nativo `storage` (sin BroadcastChannel). Otra pestaña que agrega o quita actualiza corazones, badge y la página abierta, que pide los nuevos y quita los que salieron. Verificado con dos pestañas reales.

## 9. Accesibilidad

- **Estado:** `aria-pressed` sincronizado en todos los triggers del mismo producto, con nombre dinámico y el estado también en forma y texto, no solo en color.
- **Teclado:** Enter y Espacio alternan el corazón (con foco en él). El foco visible es un outline de 2 px.
- **Quitar en la página:** anuncia "Producto quitado de favoritos." (región `status`) y el foco pasa al siguiente favorito o al título.
- **Contador:** no se lee dos veces (badge `aria-hidden`).
- **Contraste:** CTA vacío con texto oscuro sobre nude (10.6:1); papelera #737373; estados emerald-700 / amber-700 / red-600, todos ≥ 4.5:1.
- **Tamaños:** corazón con 44 px táctiles; papelera 32 px; botones de la tarjeta 32 px de alto.

## 10. Regresión de la grilla mobile (heredada de 02J)

**Confirmada** contra el código real. `CatalogGrid` usa `GRID_CLASSES`:

| Columnas | Mobile | Desde 640 | Desde 768 |
|---|---|---|---|
| 2 | 1 | 2 | 2 |
| 3 | **2** | 2 | 3 |
| 4 | **2** | 3 | 4 |

Gap `gap-4 sm:gap-6`. El theme tenía 1 columna en mobile, y 3/4 columnas recién desde 1024.

**Corregida de forma aislada** con la clase `grid--catalog` (solo Colección y Búsqueda; el blog no cambia):

- Breakpoints y gaps EXACT (16 px → 24 px desde 640).
- Revalidado en 320/375/390/430 (2 columnas, 0 desborde) y en 640/768/1024/1280/1440.

**Efecto colateral detectado y corregido:** con tarjetas de 136 px, el corazón de 44 px tapaba la etiqueta de categoría (medido: -42 px con "Salida de baño"). Ahora el corazón mide 32 px visibles (EXACT) con área táctil de 44 px, y la etiqueta se recorta con "…". Distancia mínima medida: 12 px.

Además, "Agotado" (02F) compartía la esquina con el corazón: ahora baja debajo.

## 11. Responsive, performance y settings

**Responsive** (medido, 9 anchos):

- Header: corazón `lg`, EXACT.
- Tarjetas: sin superposiciones.
- Página: 1 columna en mobile y 2 desde 640; foto 96×112 → 112×144.
- Ficha: píldora sin desborde en 320.

**Performance:**

| Recurso | Sin comprimir | gzip | Se carga |
|---|---|---|---|
| `wishlist.js` | 14.6 KB | 4.8 KB | Global, solo si `wishlist_enabled` |
| `section-wishlist.css` | 8.1 KB | 2.1 KB | Solo en la página de favoritos |

- Almacenamiento: 1 lectura al cargar, 1 escritura por cambio.
- Red: 0 requests fuera de la página de favoritos; en la página, 1 por favorito (4 en paralelo).

**Settings (grupo Wishlist):**

| Setting | Default | Nota |
|---|---|---|
| `wishlist_enabled` | true | Apagado: no hay corazones, links ni JS |
| `wishlist_page` | vacío | Selector de página; vacío = `/pages/favoritos` |

Los textos vienen de los locales, sin toggles de más.

## 12. Privacidad

- **Guardado:** solo ids y handles de productos públicos, en el navegador de la clienta. Sin email, id de cliente, tokens ni cookies propias.
- **En el real:** la invitada quedaba en Postgres bajo un UUID en cookie httpOnly. Con cuenta, ligado al usuario. Al migrar se pierde ese historial de servidor, salvo que 02L decida importarlo (no hay export en esta fase).

## 13. Verificación

- **Theme Check:** 0 errores / 0 warnings (57 archivos). `node --check` en los 12 JS: OK. 16 JSON válidos.
- **Escaneo:** secrets, dominios e IDs = 0; Next/React/Prisma/Neon/Wompi/Vercel/Cloudinary = 0; `innerHTML` y `document.cookie` = 0.

**Harness aislado:**

- **Montaje:**
  - Servidor Node en el scratchpad, solo `127.0.0.1:4176`.
  - Sirve los CSS/JS **reales** del theme; el HTML es espejo a mano de los `.liquid`.
  - Simula la Section Rendering en contexto de producto, un 404 (borrado), un 301 (handle renombrado) y un 500 inyectable.
- **Aislamiento:**
  - Navegador en modo URL: **ninguna launch config ejecutada**; `launch.json` sin cambios.
  - Puerto 3000 cerrado todo el tiempo; 0 bases de datos tocadas.
  - Servidor detenido al terminar.

**Resultado: 20/20 PASS**

| # | Prueba | Resultado | Input |
|---|---|---|---|
| 1 | Agregar desde tarjeta | Marcado, rojo, "pop", `localStorage` mínimo | Clic real |
| 2 | Quitar desde la otra tarjeta | Desmarca las dos | Clic real |
| 3 | La ficha refleja el estado | "Guardado"; toggle actualiza el badge | Sintético |
| 4 | Header | Badge, "Favoritos (n)" y menú mobile | |
| 5 | Mismo producto en 2 tarjetas | Sincronizado | |
| 6 | Recarga | Persistencia | |
| 7 | Segunda pestaña | Agrega y quita en la página abierta | Dos pestañas reales |
| 8 | `localStorage` bloqueado | Memoria + aviso | |
| 9 | JSON corrupto y versión desconocida | Recuperación sin errores | |
| 10 | Duplicados e id inválido | Descartados | |
| 11 | Producto borrado / renombrado / 500 | Fila no disponible + quitar / handle actualizado / fila de error | |
| 12 | Quitar desde la página | Foco, anuncio, contador y header | Sintético |
| 13 | Vacío | Copy EXACT + CTA, foco al título | |
| 14 | Teclado | Tab + Enter + Espacio | Teclas reales |
| 15 | `aria-pressed` | Sincronizado en todos los triggers | |
| 16 | Foco visible | Outline de 2 px | |
| 17 | Mobile | 2 columnas, corazón 32/44, sin superposiciones | |
| 18 | Sin desborde | 9 anchos | |
| 19 | Reduced-motion | Regla global anula el "pop" | |
| 20 | Sin JS | Corazones ocultos, link funcional, aviso en la página | |

**Límites honestos:**

- La ventana del navegador dejó de dibujarse a mitad de las pruebas: desde el toggle de la ficha, los clics fueron sintéticos (`element.click()`, mismo handler delegado). Las teclas y los clics de los tests 1, 2 y 14 fueron reales.
- No se pudo emular `prefers-reduced-motion`: se verificó por inspección de reglas.
- "Sin JS" = página servida sin scripts.
- La Section Rendering en contexto de producto es un espejo: hay que confirmarla en una Development Store.

## 14. Fidelidad visual estimada

**~92%**. Corazones, píldora, header, página y tarjeta horizontal EXACT.

**Diferencias deliberadas:**

- 3 correcciones de contraste: CTA vacío, papelera y "Guardado".
- Estado de carga visible.
- Fila para quitar favoritos inexistentes.
- "Agregar al carrito" lleva a la ficha (no hay vista rápida).
- La etiqueta de categoría se recorta en tarjetas angostas.

## 15. Dependencia de Customer Accounts (02L)

**Decisión requerida de Daniela** antes de 02L:

1. Tipo de cuentas de Shopify: New Customer Accounts (código por email, sin contraseña) o Classic (contraseña, como el real).
2. Si los favoritos con cuenta deben sincronizarse entre dispositivos como hoy (requiere app o backend) o si alcanza con favoritos por navegador.
3. Si al iniciar sesión se unen los favoritos del navegador con los de la cuenta (como el real).
4. Qué pasa con `/cuenta/favoritos`.

Hasta entonces: favoritos por navegador, sin login y sin redirigir a la cuenta.

**Resuelto en 02L (2026-09-28):** Daniela eligió New Customer Accounts (código por email), favoritos sincronizados entre dispositivos, unión al ingresar y "Mis favoritos" dentro de la cuenta sin forzar `/cuenta/favoritos`. Ver `theme/customer-accounts-decision.md` y `theme/customer-accounts-report.md`.
