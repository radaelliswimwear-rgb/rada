# Sprint 5 — Carrito funcional

## Objetivo

Hasta este punto, el ícono de carrito solo mostraba un toast "próximamente" en todo el sitio. El carrito original de Shopify (`components/cart/*`) sigue arquitectónicamente correcto pero depende de credenciales que no existen. Se construyó un carrito paralelo, funcional de verdad, sin tocar esa arquitectura.

## Qué se implementó

- `components/cart-drawer/cart-store.tsx` — Context (`LocalCartProvider` / `useLocalCart`), persistido en `localStorage` (clave `lago-cart`). Expone `lines`, `totalQuantity`, `totalAmount`, `addItem`, `removeItem`, `updateQuantity`, `openCart`/`closeCart`.
- `components/cart-drawer/cart-drawer.tsx` — panel lateral (mismo patrón visual que el `CartModal` original de Shopify: Headless UI, cantidad +/-, quitar producto, subtotal).
- `app/layout.tsx` — se sumó `LocalCartProvider`, anidado **dentro** del `CartProvider` de Shopify existente (no se quitó).
- Navbar y menú móvil: el botón de carrito pasó de toast a abrir el panel real, con contador dinámico (oculto en 0).
- `components/product-detail/product-variant-picker.tsx` — "Añadir al carrito" pasó de toast a agregar de verdad y abrir el panel. Al estar este componente también dentro de Quick View (Sprint 4.5), el flujo de compra rápida quedó conectado automáticamente ahí también.
- "Finalizar compra" muestra un toast "próximamente" — un checkout real requiere Shopify o un backend propio (ver [ROADMAP.md](../ROADMAP.md)).

## Decisión técnica

Este carrito **no sigue** el patrón de adaptador (tipos + storage-adapter + Context) que se adoptó recién en el Sprint 6 — habla directo con `localStorage` desde el Context. Queda anotado como deuda técnica a alinear (ver [ARCHITECTURE.md](../ARCHITECTURE.md)).

## Verificación

`npm run build` → 35/35 páginas. Probado en navegador: agregar con talla, contador en tiempo real, persistencia tras recarga y navegación, +/- cantidad, quitar producto, flujo completo desde Quick View, menú móvil.

## Qué quedó para después

- Wishlist sin página propia ni sincronización entre componentes → Sprint 6.
- Alinear este carrito al patrón adaptador introducido en el Sprint 6 → pendiente, sin sprint asignado todavía.
