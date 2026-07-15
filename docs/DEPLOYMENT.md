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

## Variables de entorno (`.env.example`)

```
COMPANY_NAME="LAGO"
SITE_NAME="LAGO"
SHOPIFY_REVALIDATION_SECRET=""
SHOPIFY_STOREFRONT_ACCESS_TOKEN=""
SHOPIFY_STORE_DOMAIN="[your-shopify-store-subdomain].myshopify.com"
```

Ninguna de estas variables es necesaria para correr el proyecto hoy — la app funciona sin `.env` porque el catálogo activo es `lib/placeholder-data.ts`, no Shopify. Las variables de Shopify solo importan si se decide activar el track dormido.

## Particularidad a tener en cuenta: Next.js canary

`package.json` fija `next` en `15.6.0-canary.60`. Esto provoca conflictos de peer dependencies con `geist` al instalar paquetes nuevos:

```bash
npm install <paquete> --legacy-peer-deps
```

Este flag es necesario en **todas** las instalaciones de dependencias nuevas mientras el proyecto siga en esta versión canary. No afecta al build de producción en sí, solo a `npm install`.

## Plataforma objetivo (sugerida, no configurada)

El proyecto hereda de Next.js Commerce un fuerte acoplamiento a **Vercel** (imágenes optimizadas, `VERCEL_PROJECT_PRODUCTION_URL` usado en `lib/utils.ts` para calcular `baseUrl`, badges de deploy en el `README.md` original). Es la opción de menor fricción, pero no hay nada todavía que impida desplegar en otro proveedor compatible con Next.js App Router.

## Checklist para un primer despliegue

- [ ] Elegir plataforma de hosting (Vercel u otra).
- [ ] Decidir si se conecta Shopify antes o después del primer deploy (ver [ROADMAP.md](./ROADMAP.md)).
- [ ] Si se conecta Shopify: cargar las variables de entorno de `.env.example` en la plataforma elegida.
- [ ] Configurar dominio propio.
- [ ] Si se conecta Shopify: apuntar el webhook de revalidación (`products/*`, `collections/*`) a `/api/revalidate?secret=...` (ver [API.md](./API.md)).
- [ ] Cuando exista Postgres: agregar `DATABASE_URL` y correr las migraciones de Prisma como parte del pipeline de deploy.
- [ ] Configurar CI (lint, `tsc --noEmit`, `next build`) — hoy no existe.

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
