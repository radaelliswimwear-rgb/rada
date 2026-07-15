# Arquitectura

## Idea central: dos capas de datos conviviendo a propósito

El proyecto tiene **dos tracks paralelos** que nunca se pisan entre sí:

1. **Track Shopify (original del template, dormido)** — `lib/shopify/*`, `components/cart/*`, `components/product/*`, `app/product/[handle]`, `app/search/*`, `app/[page]`. Código 100% funcional pero inactivo porque no hay credenciales de Shopify configuradas. Se conserva intacto para cuando se decida conectar Shopify de verdad.
2. **Track de datos de ejemplo (activo, lo que el usuario ve hoy)** — `lib/placeholder-data.ts`, `lib/categories.ts`, `components/catalog/*`, `components/product-detail/*`, `components/cart-drawer/*`, `components/wishlist/*`, `components/auth/*`, `components/account/*`, `components/checkout/*`, `app/hombre|mujer|accesorios`, `app/producto/[slug]`, `app/favoritos`, `app/buscar`, `app/cuenta/*`, `app/checkout/*`. Construido sprint a sprint sobre datos en memoria, con la persistencia de usuario (carrito, wishlist, cuentas, direcciones, pedidos, pagos) en `localStorage`.

Esta separación existe porque cada vez que hizo falta una funcionalidad que el track Shopify no podía cumplir sin credenciales reales (catálogo, ficha de producto, carrito, wishlist), se construyó una **ruta y componentes nuevos en paralelo** en vez de forzar datos de ejemplo dentro del código pensado para Shopify. Resultado: nada de lo que ya funcionaba se rompió, y ambos tracks pueden fusionarse más adelante sin reescritura.

## Árbol de decisión: ¿de dónde vienen los datos hoy?

```
Producto / Categoría / Precio     → Postgres/Prisma (Sprint 13) para catálogo, búsqueda y ficha de producto;
                                     lib/placeholder-data.ts (en memoria, mismos IDs) para resolución
                                     síncrona en cliente (carrito, wishlist) — ver nota abajo
Carrito (líneas, cantidades)      → Postgres/Prisma, identificado por cookie de invitado (Sprint 12)
Wishlist (productos guardados)    → Postgres/Prisma, identificado por cookie de invitado (Sprint 13)
Usuarios / contraseñas            → Postgres/Prisma (Sprint 12); sesión sigue en localStorage (Sprint 9)
Direcciones                       → Postgres/Prisma (Sprint 12)
Pedidos                           → Postgres/Prisma (Sprint 12)
Checkout (envío, costos)          → lib/checkout/*, cálculo en memoria, sin persistencia propia (Sprint 10)
Pagos (intentos, estado)          → Postgres/Prisma, pasarela simulada intercambiable (Sprint 11/12)
Menú, páginas de contenido        → lib/shopify (dormido, sin uso real hoy)
```

## Cadena de providers (`app/layout.tsx`)

```tsx
<CartProvider cartPromise={getCart()}>
  {" "}
  {/* Shopify, dormido — getCart() es seguro sin config */}
  <LocalCartProvider>
    {" "}
    {/* Sprint 5/8 — carrito real, patrón adaptador */}
    <WishlistProvider>
      {" "}
      {/* Sprint 6 — wishlist real, localStorage vía adaptador */}
      <AuthProvider>
        {" "}
        {/* Sprint 9 — sesión real, localStorage vía adaptadores */}
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

- ✅ **Catálogo** (`lib/catalog/catalog-repository.ts`) — Postgres/Prisma desde el Sprint 13. Nuevo en este dominio: no hay Context/store (los datos se leen en Server Components, no hace falta estado de cliente), así que el "patrón de 3 capas" queda en 2 — `catalog-actions.ts` (Prisma) + `catalog-repository.ts` (Repository Pattern, mismo objeto público consumido por las páginas). Devuelve objetos con la forma exacta de `PlaceholderProduct` para que ningún componente de `components/catalog/*`, `components/product-detail/*` ni `components/home/*` cambie.
- ✅ **Wishlist** (`lib/wishlist/`, `components/wishlist/wishlist-store.tsx`) — Postgres/Prisma desde el Sprint 13 (antes localStorage, Sprint 6), mismo patrón "contenedor + cookie de invitado" que el carrito (ver más abajo).
- ✅ **Carrito** (`lib/cart/`, `components/cart-drawer/cart-store.tsx`) — Postgres/Prisma desde el Sprint 12 (antes localStorage, Sprint 8). `CartLine` sigue normalizado (`productId`/`size`/`quantity`/`createdAt`, sin duplicar datos del producto); el Context resuelve el resto en vivo contra `lib/placeholder-data.ts`.
- ✅ **Autenticación** (`lib/auth/`, `components/auth/auth-store.tsx`) — `users-storage.ts` (usuarios) es Postgres/Prisma desde el Sprint 12; `session-storage.ts` y `reset-tokens-storage.ts` siguen en `localStorage` (no hay modelo `Session`/`ResetToken` en el esquema todavía). `AuthProvider` expone la misma API 100% async de siempre. Desde el Sprint 14, `User`/`PublicUser` incluyen `role` (`"USER" | "ADMIN"`); `usersStorage.updateRole` es la única forma de cambiarlo (separada de `upsert`, que nunca lo toca).
- ✅ **Direcciones** (`lib/addresses/addresses-repository.ts`) — Postgres/Prisma desde el Sprint 12, mismo contrato (`listByUser`, `create`, `update`, `remove`).
- ✅ **Pedidos** (`lib/orders/orders-repository.ts`) — Postgres/Prisma desde el Sprint 12. El generador de pedidos simulados del Sprint 9/10 desapareció: ahora hay datos reales (`prisma/seed.ts` + pedidos creados desde `/checkout`).
- ✅ **Checkout** (`lib/checkout/*`, `components/checkout/*`) — sin cambios: sigue orquestando otros dominios (carrito, direcciones, pagos) sin persistencia propia. `lib/checkout/shipping-methods.ts` sigue siendo catálogo estático; `pricing.ts`/`validation.ts` siguen siendo funciones puras.
- ✅ **Pagos** (`lib/payments/`) — Postgres/Prisma desde el Sprint 12 (antes localStorage, Sprint 11). El gateway simulado (`providers/{stripe,wompi}-gateway.ts`) no cambió — sigue sin red real; solo la persistencia de cada intento pasa a la tabla `Payment`.
- ✅ **Panel Administrativo** (`lib/admin/`, `app/admin/*`, `components/admin/*`, Sprint 14) — Postgres/Prisma desde su creación, no una migración de otra fuente. Sigue el mismo patrón Server Actions + Repository que el resto, pero con un matiz a propósito: `lib/catalog/catalog-actions.ts` (lectura pública) atrapa sus errores y degrada a `[]`/`null`; `lib/admin/products-actions.ts`/`orders-actions.ts` (escritura/lectura administrativa) devuelven el error tal cual (`AdminActionResult`) porque quien administra necesita saber si algo falló, no ver una lista vacía silenciosa. Protegido por `RequireAdmin` (`components/auth/require-admin.tsx`), calco de `RequireAuth` que además exige `user.role === "ADMIN"`.
- ✅ **Imágenes de producto vía Cloudinary** (`lib/cloudinary/`, `components/admin/product-image-manager.tsx`, Sprint 15) — mismo patrón Server Actions + Repository (`cloudinary-repository.ts`). `ProductImage.publicId` (opcional) distingue imágenes de Cloudinary (subidas desde el panel) de las sembradas desde Unsplash (`publicId: null`), que nunca se intentan borrar ahí. La subida ocurre apenas se suelta/selecciona un archivo (no recién al guardar el producto), para poder mostrar la miniatura real como vista previa y poder limpiar Cloudinary de inmediato si se reemplaza o quita antes de guardar. El borrado en Cloudinary (al reemplazar, quitar, o eliminar un producto) es siempre best-effort: se ejecuta después de que Postgres confirma el cambio, nunca antes, y un fallo se loguea sin revertir la operación principal.
- 💤 **Shopify** (`lib/shopify/index.ts`) — ya es, en los hechos, un "adaptador" real (habla con una API externa por GraphQL), solo que apunta a Shopify en vez de a un backend propio. Sigue el mismo espíritu de separación.

### Server Actions + Prisma (Sprint 12/13)

Cada dominio migrado sigue el mismo patrón de dos archivos:

```
lib/<dominio>/<dominio>-actions.ts   → "use server", funciones async planas, únicas que tocan Prisma
lib/<dominio>/<dominio>-repository.ts (o storage-adapter.ts) → reagrupa esas funciones en el mismo objeto público que ya existía
```

Un archivo `"use server"` solo puede exportar funciones async al nivel superior (no objetos) — por eso las funciones viven en `*-actions.ts` y el archivo con el nombre histórico (`addresses-repository.ts`, `users-storage.ts`, `cart/storage-adapter.ts`, `wishlist/storage-adapter.ts`, `orders-repository.ts`, `payments-repository.ts`, `catalog-repository.ts`) solo reexporta, sin lógica propia. Next.js convierte cada función en un endpoint RPC invocable directo desde un Server o Client Component — por eso los componentes existentes no cambiaron: siguen llamando `cartStorage.getAll()`, `ordersRepository.create()`, `catalogRepository.listByCategory()`, etc. Solo los Server Components que antes leían `lib/placeholder-data.ts` directamente pasaron a importar `catalogRepository` (cambio esperado de "punto de entrada de datos", no de UI).

Un archivo `"use server"` no puede exportar nada más que funciones async al nivel superior — ni siquiera un objeto de mapeo o una función síncrona auxiliar. Cuando ese mapeo necesita reutilizarse desde otro dominio (Sprint 14: `lib/admin/orders-actions.ts` reutilizando la conversión DB↔dominio de pedidos), la solución es extraerlo a un archivo hermano sin la directiva — ver `lib/orders/order-mapping.ts` (contiene `toOrder`, `STATUS_FROM_DB`/`STATUS_TO_DB`, etc.), del que ahora importan tanto `lib/orders/orders-actions.ts` como `lib/admin/orders-actions.ts`.

`lib/prisma.ts` expone el singleton de `PrismaClient` (patrón estándar de Next.js para no reabrir conexiones en cada hot-reload). `lib/guest-identity.ts` centraliza la resolución de identidad de invitado por cookie, reutilizada por carrito y wishlist.

**Manejo de errores:** toda Server Action que puede correr sin interacción del usuario (montaje de providers, generación estática, listados de catálogo) envuelve su query en try/catch, loguea con `console.error` (no se oculta el fallo) y devuelve un valor por defecto seguro (`[]`, `null`, `{ products: [], total: 0 }`) — así una base de datos caída degrada la página a un estado vacío en vez de un Runtime Error. Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para el caso real que motivó este patrón.

### Seguridad de contraseñas (limitación conocida)

`lib/auth/password.ts` hashea con SHA-256 vía Web Crypto, sin salt, **en el cliente**. Sirve para simular el flujo completo de auth sin backend, pero no es apto para producción. Al conectar Prisma + Auth.js/Clerk, el hashing (bcrypt/argon2 con salt) debe hacerse server-side — `lib/auth/password.ts` y `users-storage.ts` son las piezas a reemplazar.

### Protección de rutas privadas (limitación conocida)

`components/auth/require-auth.tsx` protege `/cuenta/*` (excepto login/registro/recuperación) verificando `isAuthenticated` **client-side** y redirigiendo con `router.replace`. No hay sesión server-side todavía, por lo que esto no es protección real contra acceso directo a datos (no hay API que proteger aún: todo el estado vive en el propio navegador del usuario). Al conectar Auth.js/Clerk, la protección correcta pasa a middleware verificando una cookie de sesión server-side.

### Checkout sin sesión obligatoria (decisión de diseño, Sprint 10)

`/checkout` **no** está envuelto en `RequireAuth`: igual que el carrito, funciona para invitados. Si hay sesión, `ShippingAddressForm` ofrece las direcciones guardadas del usuario; si no, el usuario completa una dirección nueva y el pedido se crea con `userId = GUEST_USER_ID` (`lib/checkout/types.ts`). Los pedidos de invitado quedan persistidos (se pueden abrir vía `/checkout/confirmacion/[orderId]`) pero no aparecen en ningún historial de cuenta, porque `order-history.tsx` filtra por `userId` real. Es el mismo comportamiento que tendría un checkout de producción con "compra como invitado".

### Carrito y wishlist de invitado vía cookie (Sprint 12/13)

Carrito y wishlist siguen funcionando sin sesión, ahora sobre Postgres: `lib/guest-identity.ts` centraliza el patrón "resolver o crear un id de invitado en una cookie propia" (`resolveGuestId`), reutilizado por `lib/cart/cart-actions.ts` (cookie `lago-cart-id`) y `lib/wishlist/wishlist-actions.ts` (cookie `lago-wishlist-id`, Sprint 13). En ambos dominios el modelo sigue el patrón "contenedor + items" (`Cart`/`CartItem`, `Wishlist`/`WishlistItem`) y el `id` del contenedor **es** el valor de la cookie — así no hace falta una columna de identidad de invitado separada. `Cart.userId`/`Wishlist.userId` quedan `null` para invitados; no hay fusión a la cuenta al iniciar sesión todavía (mismo comportamiento que antes de migrar, ahora persistido server-side).

### Catálogo en Postgres, pero `lib/placeholder-data.ts` sigue vivo (decisión de diseño, Sprint 13)

Las páginas que renderizan catálogo (`/hombre`, `/mujer`, `/accesorios`, `/producto/[slug]`, `/buscar`, destacados de Home) leen de Postgres vía `catalogRepository`. Pero **no se borró** `lib/placeholder-data.ts`: sigue siendo la fuente síncrona que usan `components/cart-drawer/cart-store.tsx` (resolver `CartLine.productId` → datos de producto en un `useMemo`) y `components/wishlist/wishlist-page.tsx` (mismo problema con los items guardados). Ambos Contexts necesitan resolución **síncrona** dentro de render de cliente; convertirlos a async hubiese exigido reestructurar esos componentes, fuera de "no modifiques la UI salvo que sea estrictamente necesario". `prisma/seed.ts` siembra `Product`/`Category` con los **mismos IDs** que `lib/placeholder-data.ts`, así que ambas fuentes son consistentes entre sí — es una duplicación de datos deliberada y documentada, no deuda técnica oculta. Migrar esos dos últimos puntos (y poder borrar `lib/placeholder-data.ts` del todo) queda para un sprint futuro que además revise si conviene un Context de catálogo con caché en cliente.

`lib/categories.ts` (la grilla de 6 categorías de Home, con 3 sin catálogo real: Niños, Calzado, Novedades) **tampoco** se migró: es contenido editorial de portada, no taxonomía de catálogo — forzarlo dentro del modelo `Category` (que solo existe para las 3 categorías con productos reales) mezclaría dos responsabilidades distintas. El modelo `Category` de Postgres sigue siendo la taxonomía real que usan `/hombre`, `/mujer`, `/accesorios` y `Product.category`.

### Pasarela de pago simulada (limitación conocida, Sprint 11)

`lib/payments/providers/{stripe,wompi}-gateway.ts` no llaman a ningún SDK ni API externa: `confirmPayment` espera una latencia simulada (`simulateLatency`) y decide éxito/fallo según el número de tarjeta, replicando las tarjetas de prueba reales de Stripe (`4242...` éxito, `4000...0002` rechazo) para que la demo se sienta realista. Ningún dato de tarjeta se valida contra un emisor real ni se envía a ningún lado. Al conectar Stripe/Wompi de verdad, cada `providers/*-gateway.ts` se reemplaza por el SDK correspondiente (Payment Intents API de Stripe, API de transacciones de Wompi) sin tocar `payments-repository.ts` ni `components/checkout/payment-form.tsx` — mismo contrato `PaymentGateway`. La cancelación (botón "Cancelar pago" durante el procesamiento) es un aborto puramente local: no cancela nada del lado del proveedor real, solo descarta el resultado y marca el intento como `cancelled` en el registro local.

## Renderizado

- **React Server Components por defecto.** Los `page.tsx` son `async function` que leen datos directo (de `catalogRepository`, otros repositorios Prisma, o de `lib/shopify`), sin API routes intermedias propias.
- **Client Components** solo donde hace falta interactividad: carrito, wishlist, filtros, galería, selector de variantes, menús, animaciones.
- **PPR (Partial Prerendering)** activado en `next.config.ts`. Las páginas de catálogo (`/hombre`, `/mujer`, `/accesorios`) y la ficha de producto (`/producto/[slug]`, con `generateStaticParams`) se benefician de esto: shell estático + partes dinámicas en streaming.
- **`generateStaticParams` resiliente** (`app/producto/[slug]/page.tsx`): `catalogRepository.listSlugs()` está envuelto en try/catch dentro de la Server Action — si Postgres no está disponible en build time, `next build` genera 0 rutas estáticas de producto en vez de fallar, y cada `/producto/[slug]` cae a render dinámico on-demand (`dynamicParams` por defecto). Con una base real conectada en build, vuelve a generar todas las fichas como estáticas.
- **`"use cache"` de Next 15** se usa únicamente dentro de `lib/shopify/index.ts` (track dormido).

## Rutas activas vs. rutas dormidas

| Función                | Ruta activa (datos de ejemplo)                                                                           | Ruta original (Shopify)                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Catálogo por categoría | `/hombre`, `/mujer`, `/accesorios`                                                                       | `/search/[collection]`                                             |
| Búsqueda               | `/buscar`                                                                                                | `/search`                                                          |
| Ficha de producto      | `/producto/[slug]`                                                                                       | `/product/[handle]`                                                |
| Páginas de contenido   | _(no implementadas)_                                                                                     | `/[page]` (catch-all)                                              |
| Cuenta / autenticación | `/cuenta/*` (login, registro, recuperar/restablecer contraseña, dashboard, perfil, direcciones, pedidos) | _(no existe en el template original)_                              |
| Checkout               | `/checkout`, `/checkout/confirmacion/[orderId]`                                                          | `components/cart/actions.ts` (Server Actions de Shopify, dormidas) |

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
