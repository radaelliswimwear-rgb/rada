# Arquitectura

## Idea central: dos capas de datos conviviendo a propósito

El proyecto tiene **dos tracks paralelos** que nunca se pisan entre sí:

1. **Track Shopify (original del template, dormido)** — `lib/shopify/*`, `components/cart/*`, `components/product/*`, `app/product/[handle]`, `app/search/*`, `app/[page]`. Código 100% funcional pero inactivo porque no hay credenciales de Shopify configuradas. Se conserva intacto para cuando se decida conectar Shopify de verdad.
2. **Track de datos de ejemplo (activo, lo que el usuario ve hoy)** — `lib/placeholder-data.ts`, `lib/categories.ts`, `components/catalog/*`, `components/product-detail/*`, `components/cart-drawer/*`, `components/wishlist/*`, `components/auth/*`, `components/account/*`, `app/hombre|mujer|accesorios`, `app/producto/[slug]`, `app/favoritos`, `app/buscar`, `app/cuenta/*`. Construido sprint a sprint sobre datos en memoria, con la persistencia de usuario (carrito, wishlist, cuentas, direcciones) en `localStorage`.

Esta separación existe porque cada vez que hizo falta una funcionalidad que el track Shopify no podía cumplir sin credenciales reales (catálogo, ficha de producto, carrito, wishlist), se construyó una **ruta y componentes nuevos en paralelo** en vez de forzar datos de ejemplo dentro del código pensado para Shopify. Resultado: nada de lo que ya funcionaba se rompió, y ambos tracks pueden fusionarse más adelante sin reescritura.

## Árbol de decisión: ¿de dónde vienen los datos hoy?

```
Producto / Categoría / Precio     → lib/placeholder-data.ts, lib/categories.ts (en memoria)
Carrito (líneas, cantidades)      → localStorage, detrás de un adaptador (Sprint 8)
Wishlist (productos guardados)    → localStorage, detrás de un adaptador (Sprint 6)
Usuarios / sesión / contraseñas   → localStorage, detrás de adaptadores (Sprint 9)
Direcciones                       → localStorage, detrás de un repositorio (Sprint 9)
Pedidos                           → generados en memoria, deterministas por usuario (Sprint 9)
Menú, páginas de contenido        → lib/shopify (dormido, sin uso real hoy)
```

## Cadena de providers (`app/layout.tsx`)

```tsx
<CartProvider cartPromise={getCart()}>       {/* Shopify, dormido — getCart() es seguro sin config */}
  <LocalCartProvider>                        {/* Sprint 5/8 — carrito real, patrón adaptador */}
    <WishlistProvider>                       {/* Sprint 6 — wishlist real, localStorage vía adaptador */}
      <AuthProvider>                         {/* Sprint 9 — sesión real, localStorage vía adaptadores */}
        <Navbar />
        <main>{children}</main>
        <Toaster />
      </AuthProvider>
    </WishlistProvider>
  </LocalCartProvider>
</CartProvider>
```

`CartProvider` (Shopify) se mantiene como el más externo porque es el original del template; los dos providers nuevos se anidan adentro sin modificarlo.

## Patrón de capa de datos: Context + Adaptador (introducido en Sprint 6)

A partir del Sprint 6, toda funcionalidad que en el futuro necesite un backend real (Postgres + Prisma) sigue este patrón de 3 capas:

```
lib/<dominio>/types.ts             → forma del dato, ya pensada como fila de tabla
lib/<dominio>/storage-adapter.ts   → única pieza que sabe "dónde vive" el dato hoy (localStorage)
components/<dominio>/<dominio>-store.tsx → Context con API 100% async, consumido por la UI
```

**Por qué importa:** cuando exista autenticación + Postgres, el adaptador pasa de leer `localStorage` a hacer `fetch` contra una API interna respaldada por Prisma. Como la API del Context ya es async (`Promise<void>` en los métodos de mutación) y los tipos ya tienen forma de fila de base de datos, **ningún componente de UI necesita cambiar** — el único archivo a reemplazar es el adaptador.

Implementado así hoy:
- ✅ **Wishlist** (`lib/wishlist/`, `components/wishlist/wishlist-store.tsx`) — sigue el patrón completo.
- ✅ **Carrito** (`lib/cart/`, `components/cart-drawer/cart-store.tsx`) — alineado al patrón en el Sprint 8. `CartLine` solo guarda `productId`/`size`/`quantity`/`createdAt` (normalizado, sin duplicar nombre/imagen/precio del producto); el Context resuelve esos datos en vivo contra `lib/placeholder-data.ts` vía `getProductById`, evitando que un carrito guardado quede con precios/imágenes obsoletos si el catálogo cambia.
- ✅ **Autenticación** (`lib/auth/`, `components/auth/auth-store.tsx`) — sigue el patrón: `users-storage.ts`, `session-storage.ts` y `reset-tokens-storage.ts` son los adaptadores; `AuthProvider` expone una API 100% async (`login`, `register`, `logout`, `requestPasswordReset`, `resetPassword`, `updateProfile`).
- ✅ **Direcciones** (`lib/addresses/addresses-repository.ts`) — mismo patrón, con `listByUser` en vez de `getAll` (ya modela una FK a usuario).
- ⚠️ **Pedidos** (`lib/orders/orders-repository.ts`) — expone `listByUser(userId)` async, pero hoy **genera** datos simulados deterministas en vez de leer una fuente persistida (no hay checkout real todavía que genere pedidos de verdad). Es un repositorio, no un adaptador de storage — el reemplazo futuro es una consulta real (Prisma o API de Shopify Orders), misma firma.
- 💤 **Shopify** (`lib/shopify/index.ts`) — ya es, en los hechos, un "adaptador" real (habla con una API externa por GraphQL), solo que apunta a Shopify en vez de a un backend propio. Sigue el mismo espíritu de separación.

### Seguridad de contraseñas (limitación conocida)

`lib/auth/password.ts` hashea con SHA-256 vía Web Crypto, sin salt, **en el cliente**. Sirve para simular el flujo completo de auth sin backend, pero no es apto para producción. Al conectar Prisma + Auth.js/Clerk, el hashing (bcrypt/argon2 con salt) debe hacerse server-side — `lib/auth/password.ts` y `users-storage.ts` son las piezas a reemplazar.

### Protección de rutas privadas (limitación conocida)

`components/auth/require-auth.tsx` protege `/cuenta/*` (excepto login/registro/recuperación) verificando `isAuthenticated` **client-side** y redirigiendo con `router.replace`. No hay sesión server-side todavía, por lo que esto no es protección real contra acceso directo a datos (no hay API que proteger aún: todo el estado vive en el propio navegador del usuario). Al conectar Auth.js/Clerk, la protección correcta pasa a middleware verificando una cookie de sesión server-side.

## Renderizado

- **React Server Components por defecto.** Los `page.tsx` son `async function` que leen datos directo (de `lib/placeholder-data.ts` o de `lib/shopify`), sin API routes intermedias propias.
- **Client Components** solo donde hace falta interactividad: carrito, wishlist, filtros, galería, selector de variantes, menús, animaciones.
- **PPR (Partial Prerendering)** activado en `next.config.ts`. Las páginas de catálogo (`/hombre`, `/mujer`, `/accesorios`) y la ficha de producto (`/producto/[slug]`, con `generateStaticParams`) se benefician de esto: shell estático + partes dinámicas en streaming.
- **`"use cache"` de Next 15** se usa únicamente dentro de `lib/shopify/index.ts` (track dormido). Los datos de ejemplo no lo necesitan: ya están en memoria.

## Rutas activas vs. rutas dormidas

| Función | Ruta activa (datos de ejemplo) | Ruta original (Shopify) |
|---|---|---|
| Catálogo por categoría | `/hombre`, `/mujer`, `/accesorios` | `/search/[collection]` |
| Búsqueda | `/buscar` | `/search` |
| Ficha de producto | `/producto/[slug]` | `/product/[handle]` |
| Páginas de contenido | *(no implementadas)* | `/[page]` (catch-all) |
| Cuenta / autenticación | `/cuenta/*` (login, registro, recuperar/restablecer contraseña, dashboard, perfil, direcciones, pedidos) | *(no existe en el template original)* |

Las rutas originales de Shopify siguen en el código y compilan, pero muestran la pantalla de error genérica (`app/error.tsx`) si se navegan sin credenciales configuradas — comportamiento esperado, no es un bug.

## Componentes reutilizados entre tracks

Algunos componentes son genéricos y se usan en ambos mundos sin cambios:
- `components/product/gallery.tsx` (`Gallery`) — usado tanto por `/product/[handle]` (Shopify) como por `/producto/[slug]` (datos de ejemplo).
- `components/layout/footer.tsx`, `components/layout/navbar/*` — compartidos por toda la app.

## Patrón de modales/diálogos (Headless UI)

Todos los overlays (carrito, Quick View, menú móvil) usan `Dialog` de Headless UI, pero **no** el patrón `<Transition show={isOpen}><Dialog onClose={...}>` documentado como "legacy" — ese patrón tiene un bug reproducible con la versión instalada (`@headlessui/react@2.2.10` + React 19) donde el diálogo nunca se desmonta al cerrar, aunque el estado de React sí se actualiza correctamente (ver [SPRINT-07](./sprints/SPRINT-07.md) para el detalle de la investigación).

**Patrón correcto a usar en cualquier diálogo nuevo:**

```tsx
if (!isOpen) return null;

return (
  <Dialog open onClose={closeFn} className="relative z-50">
    <Transition.Child as={Fragment} enter="..." enterFrom="..." enterTo="...">
      {/* backdrop */}
    </Transition.Child>
    <Transition.Child as={Fragment} enter="..." enterFrom="..." enterTo="...">
      <Dialog.Panel>{/* contenido */}</Dialog.Panel>
    </Transition.Child>
  </Dialog>
);
```

El desmontado lo controla React (`if (!isOpen) return null`), no la transición interna de Headless UI — esto garantiza el cierre siempre, a costa de no tener animación de salida (la de entrada, vía `Transition.Child`, sí funciona normalmente).

## Estilo visual

- Paleta: negro / blanco / `neutral-100` (`#F5F5F5` — coincide exactamente con el gris de Tailwind).
- Tipografía: Geist Sans, sin serif (decisión tomada en el rebranding para alinear con Zara/COS/Apple).
- Logo: `public/logo/logo-principal.png`, usado en Navbar, menú móvil y Footer vía `next/image`.

## Documentos relacionados

- [DATABASE.md](./DATABASE.md) — detalle de cada modelo de datos y la propuesta de esquema Prisma.
- [API.md](./API.md) — rutas y Server Actions.
- [ROADMAP.md](./ROADMAP.md) — plan de conexión a Postgres/Prisma/Cloudinary/Admin Panel.
