# Deployment

## Estado actual: no desplegado

El proyecto no tiene ningún despliegue configurado. Corre localmente en modo desarrollo (`npm run dev`) y el build de producción (`npm run build`) se verifica en cada sprint, pero no hay CI/CD ni hosting conectado.

## Scripts disponibles (`package.json`)

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con Turbopack (`next dev --turbopack`) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run prettier` | Formatea todo el repo |
| `npm run prettier:check` | Verifica formato sin modificar (usado como `npm test`) |
| `npm run db:migrate` | Aplica `prisma/migrations/` a la base de `DATABASE_URL` (`prisma migrate dev`) |
| `npm run db:seed` | Carga categorías, productos, usuarios de prueba y un pedido demo (`prisma/seed.ts`) |
| `postinstall` (automático) | `prisma generate` — regenera el cliente Prisma tras `npm install` |

## Variables de entorno (`.env.example`)

```
COMPANY_NAME="LAGO"
# SITE_NAME ya no se lee del entorno -- ver lib/seo/site.ts (SEO técnico, sep. 2026)
DATABASE_URL="postgresql://user:password@localhost:5432/lago?schema=public"
SHOPIFY_REVALIDATION_SECRET=""
SHOPIFY_STOREFRONT_ACCESS_TOKEN=""
SHOPIFY_STORE_DOMAIN="[your-shopify-store-subdomain].myshopify.com"
```

Las variables de Shopify no son necesarias. **`DATABASE_URL` sí es necesaria desde el Sprint 12**: sin ella, `npm run build` funciona igual (Prisma solo necesita el schema para generar tipos, no una conexión viva; `generateStaticParams` y las Server Actions de solo lectura degradan a resultados vacíos, ver [ARCHITECTURE.md](./ARCHITECTURE.md#server-actions--prisma-sprint-1213)), pero sin una base real conectada catálogo, carrito, wishlist, login, checkout y pagos no tienen datos que mostrar. Este comportamiento se verificó explícitamente en desarrollo: con Postgres inalcanzable, la app carga sin Runtime Error ni Hydration Error, y cada dominio muestra su estado vacío correspondiente.

`lib/payments/config.ts` ya lee una variable opcional, `NEXT_PUBLIC_PAYMENT_PROVIDER` (`stripe` | `wompi`, por defecto `stripe`), para elegir la pasarela activa — hoy no hace falta configurarla porque ambos adaptadores están simulados. Al conectar credenciales reales hará falta además, según el proveedor elegido: `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` (Stripe) o `WOMPI_PRIVATE_KEY` + `WOMPI_PUBLIC_KEY` (Wompi) — ver [ARCHITECTURE.md](./ARCHITECTURE.md#pasarela-de-pago-simulada-limitación-conocida-sprint-11).

## Particularidad a tener en cuenta: Next.js canary

`package.json` fija `next` en `15.6.0-canary.60`. Esto provoca conflictos de peer dependencies con `geist` al instalar paquetes nuevos:

```bash
npm install <paquete> --legacy-peer-deps
```

Este flag es necesario en **todas** las instalaciones de dependencias nuevas mientras el proyecto siga en esta versión canary. No afecta al build de producción en sí, solo a `npm install`.

## Plataforma objetivo (sugerida, no configurada)

El proyecto hereda de Next.js Commerce cierto acoplamiento histórico a **Vercel** (imágenes optimizadas, badges de deploy en el `README.md` original), pero ya no depende de ninguna variable exclusiva de Vercel para su configuración funcional: `lib/utils.ts` (`getAppBaseUrl()`) usa `APP_BASE_URL`, y `lib/payments/guard-real-payments.ts` usa `APP_ENVIRONMENT` — ambas variables propias del proyecto (ver `.env.example`), portables a Railway, Render, Fly.io, AWS o cualquier otro hosting compatible con Next.js App Router. Vercel sigue siendo un ejemplo válido de hosting, no un requisito arquitectónico — el hosting final todavía no está decidido.

## Checklist para un primer despliegue

- [ ] Elegir plataforma de hosting (Vercel u otra).
- [ ] Decidir si se conecta Shopify antes o después del primer deploy (ver [ROADMAP.md](./ROADMAP.md)).
- [ ] Si se conecta Shopify: cargar las variables de entorno de `.env.example` en la plataforma elegida.
- [ ] Configurar dominio propio.
- [ ] Si se conecta Shopify: apuntar el webhook de revalidación (`products/*`, `collections/*`) a `/api/revalidate?secret=...` (ver [API.md](./API.md)).
- [ ] Aprovisionar Postgres en producción (Vercel Postgres, Neon, Supabase, RDS...), cargar `DATABASE_URL` y correr `npx prisma migrate deploy` como parte del pipeline de deploy (no `migrate dev`, que es solo para desarrollo).
- [ ] Correr `npm run db:seed` una sola vez contra la base de producción si se quiere el catálogo/usuarios de demo (normalmente no, en producción real).
- [ ] Al conectar Stripe/Wompi de verdad: cargar sus claves de API como variables de entorno y reemplazar `lib/payments/providers/*-gateway.ts` por los SDKs reales (ver [ROADMAP.md](./ROADMAP.md)).
- [ ] Configurar CI (lint, `tsc --noEmit`, `next build`) — hoy no existe.

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
