# 08 · Gestión de estado

No hay Redux, Zustand, Jotai ni similares. El proyecto combina **cuatro fuentes de estado** distintas, cada una con su propósito específico. Entender cuál usar para qué es clave para no introducir inconsistencias al extender la app.

## 1. Estado de servidor (Shopify vía RSC)

La mayoría del "estado" de la app (catálogo, precios, contenido) **no vive en el cliente en absoluto**: se lee en cada request dentro de Server Components (`async function Page()`) y se cachea con las APIs de Next 15 (`"use cache"`, `cacheTag`, `cacheLife`). No hay sincronización manual — Next.js decide cuándo re-renderizar según los tags invalidados por el webhook de revalidación.

→ Ver [06-DATABASE.md](./06-DATABASE.md) y [02-ARCHITECTURE.md](./02-ARCHITECTURE.md).

## 2. Estado del carrito: Context + `useOptimistic`

`components/cart/cart-context.tsx` es el único store de cliente "real" del proyecto:

```
CartContext { cartPromise: Promise<Cart | undefined> }
        │  (pasado sin await desde app/layout.tsx)
        ▼
useCart()
  const initialCart = use(cartPromise)              ← React 19 `use()`
  const [optimisticCart, updateOptimisticCart] =
        useOptimistic(initialCart, cartReducer)
```

- **`cartReducer`** (función pura local) maneja dos acciones: `ADD_ITEM` y `UPDATE_ITEM` (plus/minus/delete), recalculando cantidades y totales en el cliente **antes** de que la Server Action confirme contra Shopify.
- Cada componente que muta el carrito (`AddToCart`, `EditItemQuantityButton`, `DeleteItemButton`) sigue el mismo patrón dual:
  1. Llama al optimistic updater (`addCartItem` / `updateCartItem`) → UI cambia al instante.
  2. Dispara la Server Action real (`components/cart/actions.ts`, `"use server"`) dentro de un `<form action={...}>`.
- Las Server Actions usan `updateTag(TAGS.cart)` al terminar, así que el próximo `getCart()` (con `"use cache: private"`) refleja el estado real de Shopify — el optimismo es solo para la percepción inmediata, no reemplaza la fuente de verdad.
- El **`cartId`** vive en una cookie (`components/cart/actions.ts: createCartAndSetCookie`), no en el Context — por eso el carrito sobrevive a recargas de página sin necesitar `localStorage`.

**Regla a mantener**: cualquier nueva mutación de carrito debe seguir el mismo patrón (optimistic update local + Server Action + `updateTag`), para no romper la consistencia entre lo que ve el usuario y lo que hay en Shopify.

## 3. Estado en la URL (`searchParams`)

Varias interacciones que en otros proyectos serían `useState` acá se modelan como **parámetros de URL**, aprovechando que Next.js App Router permite leer/escribir `searchParams` de forma barata:

| Componente | Parámetro | Por qué en la URL y no en useState |
|---|---|---|
| `VariantSelector` | `?color=azul&talla=m` | La combinación de variante elegida es *compartible/enlazable* y sobrevive a refresh; además permite pre-seleccionar variante desde un link externo |
| `Gallery` | `?image=2` | Igual razón: la imagen activa es parte de la URL "canónica" del producto |
| `Search` (navbar) | `?q=...` | Búsqueda es navegación real (`GET /search`) |
| `FilterList` / `FilterItem` | `?sort=price-asc` | El orden aplicado es parte del estado de la página, indexable/compartible |

Estos componentes usan `useRouter().replace(...)` (no `push`) con `{ scroll: false }` para no ensuciar el historial del navegador ni saltar el scroll en cada cambio.

**Implicación práctica**: si se agregan nuevos filtros (talla, color, precio — ver roadmap), el patrón correcto es extenderlos como `searchParams`, no como estado de componente, para mantener consistencia con lo existente y habilitar SSR de resultados filtrados.

## 4. Estado local de UI efímero (`useState`)

Reservado para interacciones puramente visuales, sin necesidad de persistencia ni de servidor:

- `MobileMenu` → `isOpen` (drawer abierto/cerrado)
- `CartModal` → `isOpen` (panel abierto/cerrado), más un `useRef` (`quantityRef`) para detectar *incrementos* de cantidad y auto-abrir el carrito
- `FilterItemDropdown` → `openSelect`, `active` (dropdown mobile)

## Resumen — qué patrón usar según el caso

| Necesitás... | Usá |
|---|---|
| Mostrar datos de Shopify (catálogo, contenido) | Fetch directo en Server Component + `"use cache"` |
| Una mutación que debe reflejarse en Shopify (carrito) | Server Action + optimistic update vía `useOptimistic` en `cart-context.tsx` |
| Una selección que debería ser compartible/persistir en refresh (variante, imagen, filtro, búsqueda) | `searchParams` + `router.replace` |
| Un toggle puramente visual sin impacto en datos (modal, drawer, dropdown) | `useState` local en el Client Component |

## Documentos relacionados

- [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)
- [04-COMPONENTS.md](./04-COMPONENTS.md)
- [06-DATABASE.md](./06-DATABASE.md)
