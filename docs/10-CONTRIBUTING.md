# 10 · Guía de contribución

## Requisitos

- Node.js compatible con Next.js 15 / React 19.
- **pnpm** (el proyecto usa `pnpm-lock.yaml` como lockfile canónico; evitar mezclar con `npm install`, que generaría/actualizaría `package-lock.json` — ya hay uno presente por una instalación mixta previa, conviene decidir un único gestor y eliminar el otro lockfile).
- Cuenta y tienda de Shopify con Storefront API habilitada.

## Puesta en marcha local

```bash
pnpm install
pnpm dev        # http://localhost:3000, con --turbopack
```

Sin un `.env` con `SHOPIFY_STORE_DOMAIN` y `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, la app corre pero el catálogo se muestra vacío (comportamiento esperado, ver [06-DATABASE.md](./06-DATABASE.md)).

Scripts disponibles (`package.json`):

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm prettier` | Formatea todo el repo |
| `pnpm prettier:check` | Verifica formato sin modificar (usado como `pnpm test`) |

No hay linter (ESLint) ni tests unitarios/E2E configurados en este template.

## Reglas de oro antes de tocar código

1. **No reinventar el acceso a datos.** Toda lectura/escritura a Shopify pasa por `lib/shopify/index.ts`. Si necesitás un dato nuevo, extendé la query/mutation correspondiente en `lib/shopify/queries|mutations/` y el tipo en `lib/shopify/types.ts` — no hagas `fetch` directo desde un componente.
2. **Respetá la frontera Server/Client.** Por defecto, todo componente nuevo es Server Component. Agregá `"use client"` solo cuando necesites hooks de interacción (`useState`, `useEffect`, `useRouter`, event handlers). Ver [04-COMPONENTS.md](./04-COMPONENTS.md) para el criterio ya aplicado en el proyecto.
3. **Mutaciones de carrito = Server Action + optimistic update.** Cualquier cambio nuevo al carrito debe seguir el patrón existente en `components/cart/actions.ts` + `cart-context.tsx` (ver [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md)), incluyendo `updateTag(TAGS.cart)` al final.
4. **Selecciones "compartibles" van en la URL, no en `useState`.** Si el nuevo estado debería sobrevivir a un refresh o ser parte de un link (filtro, variante, orden, imagen activa), seguí el patrón de `VariantSelector`/`Gallery`/`FilterList` (`searchParams` + `router.replace`).
5. **Cachear con intención.** Si agregás una función nueva en `lib/shopify/index.ts` que lee datos de catálogo/contenido, decidí explícitamente su `cacheTag` y `cacheLife` siguiendo la tabla de [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) — no lo dejes sin cachear "porque sí".
6. **No rompas las convenciones de import.** Usá imports absolutos (`components/...`, `lib/...`) tal como está configurado en `tsconfig.json` (`baseUrl: "."`), no relativos largos (`../../..`).

## Archivos que requieren especial cuidado

Ver el detalle completo en [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) y [06-DATABASE.md](./06-DATABASE.md), resumen rápido:

| No tocar sin entender el impacto | Por qué |
|---|---|
| `lib/shopify/index.ts`, `queries/`, `mutations/`, `fragments/`, `types.ts` | Rompe el fetch de datos en cascada en toda la app |
| `app/api/revalidate/route.ts` | Cambios mal hechos dejan el catálogo desactualizado o abren un hueco de seguridad en la revalidación |
| `next.config.ts` (flags `experimental`) | `ppr`/`useCache`/`inlineCss` son features de borde de Next 15; tocarlas sin saber qué hacen puede romper build o caché |
| `tsconfig.json` (`baseUrl`) | Sostiene todos los imports absolutos del proyecto |
| Versiones de `next`/`react`/`react-dom` en `package.json` | Son versiones canary/RC específicas requeridas por `"use cache"`, PPR y `useOptimistic` — un bump automático puede romper la app |

Zona segura para personalizar sin miedo: `app/globals.css`, componentes puramente de presentación (`grid`, `price`, `label`, navbar/footer visual), `fonts/`, metadata textual, y todo el contenido administrado desde Shopify (catálogo, menús, páginas).

## Estilo de código

- TypeScript en modo `strict` — no introducir `any` salvo casos ya existentes y justificados (ej. `formAction: any` en algunos props de carrito, heredado del template).
- Formateo con Prettier (`prettier-plugin-tailwindcss` ordena automáticamente las clases de Tailwind) — correr `pnpm prettier` antes de cada commit.
- Seguir el patrón `clsx` para clases condicionales, consistente con el resto del código (ver [07-STYLING.md](./07-STYLING.md)).
- Sin comentarios explicativos de "qué hace" el código — el código del template es autodescriptivo por nombres; si agregás lógica de negocio no obvia, comentá el *por qué*, no el *qué*.

## Flujo recomendado para cambios grandes (branding, filtros, wishlist, etc.)

1. Revisar el [09-ROADMAP.md](./09-ROADMAP.md) para ubicar en qué fase encaja el cambio.
2. Si el cambio toca el modelo de datos (nuevos filtros, wishlist, etc.), confirmar primero qué soporta la Storefront API de Shopify (metafields, `productFilters`, etc.) antes de escribir código — evita rehacer trabajo.
3. Extender tipos (`lib/shopify/types.ts`) y capa de datos (`lib/shopify/index.ts`) primero, UI después.
4. Verificar manualmente en navegador (claro/oscuro, mobile/desktop) — no hay tests automatizados que cubran esto.
5. Formatear (`pnpm prettier`) antes de subir cambios.

## Documentos relacionados

Este documento cierra el set — para cualquier duda de arquitectura, datos o componentes, volver a:

- [01-PROJECT.md](./01-PROJECT.md)
- [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)
- [03-FOLDER-STRUCTURE.md](./03-FOLDER-STRUCTURE.md)
- [04-COMPONENTS.md](./04-COMPONENTS.md)
- [05-ROUTES.md](./05-ROUTES.md)
- [06-DATABASE.md](./06-DATABASE.md)
- [07-STYLING.md](./07-STYLING.md)
- [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md)
- [09-ROADMAP.md](./09-ROADMAP.md)
