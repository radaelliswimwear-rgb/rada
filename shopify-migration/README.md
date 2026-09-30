# Radaelli Swimwear — Fuente maestra de migración a Shopify

**Estado actual (Fase 02 cerrada): Fase 01 CERRADA con catálogo real poblado (29 productos, ver Fase 01E abajo) + Fase 02 — Theme Architecture & Storefront Blueprint completa (ver `theme/`).** No se creó ninguna tienda Shopify, ningún archivo Liquid funcional, ni se instaló nada — esta fase es 100% arquitectura/documentación.

**Historial de fases**:
- **Fase 01** — Source of Truth + Master Catalog Export (estructura + plantillas).
- **Fase 01B** — descubrimiento automático de fuente real + limpieza de taxonomía (auditoría de las 9 categorías, ver `reports/category-taxonomy-audit.md`, `reports/category-cleanup-plan.md`, `shopify-import/shopify-target-taxonomy.md`).
- **Fase 01C** — se evaluó un mecanismo de Preview temporal para exportar sin revelar `DATABASE_URL`; se detuvo en el gate de verificación (no se pudo confirmar Deployment Protection) — nunca se creó nada.
- **Fase 01D** — se confirmó, vía el endpoint admin ya existente `/api/admin/diagnostico-conexion`, el fingerprint de conexión de Production (`ep-<REDACTADO-en-el-respaldo>`), sin revelar secretos.
- **Fase 01E — la más importante para el estado actual**: se obtuvo el **catálogo comercial real completo (29 productos)** leyendo únicamente páginas públicas de `radaelliswimwear.com` (sitemap + JSON-LD + páginas de colección), sin `DATABASE_URL`, sin autenticación. Confirmó además que las 6 categorías candidatas a retiro (Salidas de Baño, Accesorios, Hombre, Mujer, Niños, Calzado) tienen **0 productos reales** — la limpieza de taxonomía no requiere reasignar nada. Ver `MANUAL_STEP_REQUIRED.md` para lo poco que sigue pendiente (stock exacto, productos inactivos).
- **Fase 02 — Theme Architecture & Storefront Blueprint** (este README): blueprint completo del futuro theme Shopify, en `theme/` — ver esa sección abajo.

Este directorio es una copia portable e independiente del catálogo actual de Radaelli Swimwear, pensada para servir de INPUT a una futura migración a Shopify. No depende de Shopify, no depende de una Development Store, y sobrevive aunque nunca se cree ninguna tienda Shopify.

## Qué NO es esta fase

- No es un theme de Shopify.
- No es una tienda de Shopify.
- No modifica la web actual (`radaelliswimwear.com`), Production, Staging, Vercel, Neon, Wompi, Resend ni Cloudinary.
- No migra datos a ningún lado. Solo los documenta y, donde fue posible de forma inequívocamente segura, los exporta a archivos locales.

## Estado real de esta fase (léase antes de usar cualquier archivo de acá)

**No se pudo conectar a la base de datos real de producción durante esta fase.** El único `DATABASE_URL` accesible desde este entorno de trabajo (`.env.local` del proyecto) está explícitamente etiquetado `DATABASE_ENV_LABEL="development"` / `APP_ENVIRONMENT="development"`, y las credenciales de Wompi en el mismo entorno son de sandbox. La regla de esta fase es explícita: *"Si no puedes demostrar de forma inequívoca que una conexión/consulta es read-only y apunta a la fuente correcta: MANUAL STEP REQUIRED y DETENTE antes de conectarte."* No hay forma, desde este entorno, de demostrar que esa base de datos de desarrollo contiene el catálogo real (los mismos productos que hoy ve una clienta en radaelliswimwear.com) — podría ser una copia, podría tener datos de prueba, podría estar desactualizada. Conectarse igual y presentar el resultado como "el catálogo real" violaría directamente la regla de esta fase.

**Por lo tanto**: todo en este directorio está construido por **inspección directa del código y del esquema de Prisma** (`prisma/schema.prisma`, `lib/catalog/*`, `lib/seo/*`, rutas de `app/*`), no por una consulta real a producción. Las plantillas (Excel, CSVs, JSON) tienen la ESTRUCTURA exacta y final, con los nombres de columna reales del esquema — pero las FILAS de datos están vacías o marcadas `NOT_AVAILABLE`, listas para llenarse en cuanto exista una conexión de solo lectura confirmada contra la base de datos correcta.

Ver `MANUAL_STEP_REQUIRED.md` para el paso exacto que Daniela (o quien tenga acceso a las variables de entorno de Vercel) tiene que dar para desbloquear el resto de esta fase.

## Estructura

```
shopify-migration/
├── README.md                          este archivo
├── MANUAL_STEP_REQUIRED.md            el único bloqueo real de esta fase, y cómo resolverlo
├── source-of-truth/
│   ├── data-model-audit.md            sección 2: modelo de datos exacto (Prisma)
│   └── catalog-snapshot.json          plantilla del JSON canónico (sección 6) — vacío hasta tener datos reales
├── catalog/
│   ├── Radaelli_Catalogo_Master.xlsx  workbook de 6 hojas (sección 4) — estructura real, filas vacías
│   ├── products-master.csv
│   └── variants-master.csv
├── inventory/
│   └── (reservado para snapshots de stock puntuales una vez haya datos reales)
├── images/
│   ├── images-manifest.csv
│   └── image-migration-plan.md        sección 7
├── collections/
│   └── collections-master.csv
├── seo/
│   ├── current-url-inventory.csv      sección 8
│   └── seo-notes.md
├── content/
│   └── (reservado para contenido de páginas/blog una vez exportado)
├── shopify-import/
│   ├── catalog-field-mapping.md       sección 9
│   ├── shopify-target-taxonomy.md     Fase 01B, sección 6 — 4 colecciones objetivo
│   └── shopify-products-DRAFT.csv     NOT READY FOR PRODUCTION IMPORT
├── scripts/
│   ├── export-radaelli-catalog-for-shopify.mjs   sección 11 — read-only, no ejecutado todavía
│   ├── build-catalog-workbook.mjs                genera el .xlsx a partir del JSON canónico
│   └── package.json                              dependencias AISLADAS de estos scripts (no toca el ecommerce)
├── reports/
│   ├── catalog-quality-report.md      sección 10 — hallazgos reales (Fase 01E) + estructurales (Fase 01)
│   ├── category-taxonomy-audit.md     Fase 01B, sección 5 — matriz de las 9 categorías actuales
│   └── category-cleanup-plan.md       Fase 01B/01E, sección 7 — 0 productos afectados confirmado
├── manifests/
│   └── export-manifest.md             sección 12
└── theme/                             Fase 02 — Theme Architecture & Storefront Blueprint
    ├── storefront-blueprint.md        páginas, visual, PDP/collection/cart/wishlist/cuenta/contenido/nav/perf/a11y/SEO
    ├── theme-file-map.md              estructura de archivos Liquid propuesta (nada creado todavía)
    ├── design-tokens.md               colores/tipografía/spacing reales, EXACT vs. PROPUESTO
    ├── react-to-liquid-map.md         componente por componente, con dificultad
    ├── interaction-map.md             las 8 interacciones no triviales, verificadas contra código real
    ├── data-architecture.md           color/talla/colección: Option vs. metafield, justificado
    ├── theme-editor-plan.md           qué será editable por Daniela sin Claude
    └── implementation-roadmap.md      16 fases (02A-02P) para la futura construcción del theme
```

## Cómo continuar (Fase 01, parte 2 — una vez exista acceso confirmado)

1. Confirmar con Daniela (o con quien administre Vercel) cuál es el `DATABASE_URL` de **producción** real, y obtener temporalmente una cadena de conexión de **solo lectura** (idealmente un usuario Postgres con permisos `SELECT` únicamente, o al menos confirmación explícita por escrito de que ese es el entorno correcto).
2. Ejecutar `node shopify-migration/scripts/export-radaelli-catalog-for-shopify.mjs` desde la raíz del repo con esa variable de entorno — el script es estrictamente de lectura (ver su cabecera) y falla cerrado si detecta `APP_ENVIRONMENT`/`DATABASE_ENV_LABEL` de desarrollo.
3. Ejecutar `node shopify-migration/scripts/build-catalog-workbook.mjs` para regenerar `Radaelli_Catalogo_Master.xlsx` ya con datos reales.
4. Actualizar `reports/catalog-quality-report.md` y `manifests/export-manifest.md` con los resultados reales.

Ningún paso de esta lista se ejecutó en esta fase — quedan documentados para la siguiente vez que haya acceso confirmado.
