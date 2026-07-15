# Sprint 7 — Búsqueda funcional + fix crítico de diálogos

## Objetivo

El buscador del Navbar y del menú móvil solo mostraban un toast "próximamente". Se conectó a una búsqueda real sobre los datos de ejemplo, siguiendo el mismo patrón de capa de datos ya establecido.

## Qué se implementó

- `lib/placeholder-data.ts` — nueva función `searchProducts(query)`: busca por texto libre sobre nombre, categoría, color y descripción de los 20 productos.
- Ruta nueva **`/buscar`** (`app/buscar/page.tsx`), en paralelo a `/search` (Shopify, sin tocar). Reutiliza `CatalogGrid` para los resultados (mismas tarjetas, Quick View y wishlist que el resto del sitio). Tres estados: sin query, con resultados, sin resultados — cada uno con su propio mensaje. `robots: noindex` (resultados de búsqueda no deben indexarse).
- `components/layout/navbar/search.tsx` y el buscador dentro de `mobile-menu.tsx`: pasaron de un `<form>` con toast a `<Form action="/buscar">` (de `next/form`), navegación real con prefetch.

## Bug crítico encontrado y corregido (no relacionado a la búsqueda)

Al verificar que el menú móvil cerrara correctamente después de buscar, se descubrió que **ningún modal del sitio se podía cerrar**: ni el carrito, ni el Quick View, ni el menú móvil — el botón de cerrar, el click en el fondo (backdrop) y la navegación por Enter no cerraban el diálogo visualmente, aunque el estado de React (`isOpen`) sí cambiaba correctamente a `false` (confirmado con logging temporal).

**Causa raíz:** el patrón `<Transition show={isOpen}><Dialog onClose={...}>` (API de Headless UI v1, usada desde el Sprint 1 en los tres componentes) no está desmontando el `Dialog` al pasar `show={false}`, a pesar de que el prop se actualiza correctamente — comportamiento reproducido de forma consistente en pestañas nuevas y con el caché de build completamente limpio, por lo que no es un artefacto de Fast Refresh.

**Fix aplicado:** en vez de depender de la transición interna de Headless UI para desmontar, el desmontado se controla directo desde React: `if (!isOpen) return null;` antes del `<Dialog open onClose={...}>`. Esto garantiza el cierre siempre, a costa de perder la animación de salida (la de entrada se conserva). Aplicado a los tres componentes afectados:

- `components/cart-drawer/cart-drawer.tsx`
- `components/catalog/quick-view-modal.tsx`
- `components/layout/navbar/mobile-menu.tsx`

Este bug existía **desde el Sprint 1** y nunca se había detectado porque las verificaciones anteriores comprobaban el *efecto* de cerrar (por ejemplo, el contador del carrito) pero no la *desaparición del diálogo en sí*.

## Verificación

`tsc --noEmit` y `npm run build` limpios (37/37 páginas). Probado en navegador: búsqueda por nombre, categoría y color; estados sin query y sin resultados; cierre confirmado explícitamente (no solo su efecto secundario) en los tres diálogos corregidos, incluyendo el flujo completo "agregar al carrito → se abre el panel → cerrar".

## Qué quedó para después

- La animación de salida de los modales se perdió con este fix — si se quiere recuperar, habría que investigar más a fondo la causa exacta del bug de Headless UI (posible incompatibilidad con React 19) o migrar a los componentes `DialogPanel`/`DialogBackdrop` con transición nativa vía atributos `data-*`, la API recomendada actual de Headless UI v2.
- Sigue pendiente alinear el carrito (Sprint 5) al patrón adaptador (ver [ARCHITECTURE.md](../ARCHITECTURE.md)).
