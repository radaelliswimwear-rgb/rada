# Plan de migración de imágenes (sección 7)

Basado en lectura de `prisma/schema.prisma` (`ProductImage`, `Category.coverImage*`/`bannerImage*`) y de `lib/cloudinary/*` (`cloudinary-repository.ts`, `upload-actions.ts`, `client.ts`, `video-url.ts`, `staging-mock-upload.ts`).

## Dónde viven hoy las imágenes

**Proveedor principal: Cloudinary.** Toda imagen subida desde el Panel Admin (`/admin/productos`, `/admin/categorias`) pasa por `lib/cloudinary/upload-actions.ts` y queda con `publicId` no nulo en `ProductImage`/`Category.coverImagePublicId`/`bannerImagePublicId`.

**Excepción documentada en el propio esquema**: imágenes sembradas por `lib/placeholder-data.ts` (datos de ejemplo/seed, no reales) usan URLs externas de Unsplash y tienen `publicId = null` — el comentario del esquema es explícito: *"null para imágenes sembradas desde Unsplash... que no viven en Cloudinary y por lo tanto no deben intentar borrarse ahí"*. Esto importa para el manifiesto de imágenes: `publicId = null` en una fila real puede significar (a) es una imagen de seed/placeholder que no debería estar en producción, o (b) un caso legítimo no contemplado — solo se puede distinguir con los datos reales.

## Qué NO se pudo determinar sin datos reales

- Número total de imágenes reales (productos + categorías).
- Imágenes duplicadas (misma URL/publicId en más de un producto).
- URLs rotas (requeriría al menos un `HEAD` request pasivo contra cada URL real, fuera de alcance sin la lista real).
- Cuántas imágenes son placeholders de Unsplash vs. reales de Cloudinary en el catálogo actual.

Todo esto queda pendiente de `MANUAL_STEP_REQUIRED.md` — una vez exista el export real, `images-manifest.csv` se puede llenar y estas preguntas se responden con una consulta simple (agrupar por `url`/`publicId`, contar duplicados).

## Lo que sí se puede afirmar por diseño del esquema (sin datos)

- **No existe campo ALT** en `ProductImage` ni en los campos de imagen de `Category` — el ALT text no es un dato que "falte llenar", es un dato que **no se puede migrar porque nunca existió**. Cualquier ALT en Shopify tendrá que generarse en el momento del import (ver `catalog-field-mapping.md`), no migrarse.
- El orden de galería (`ProductImage.position`) sí existe y se preserva sin ambigüedad.
- Las imágenes de categoría (`coverImage*`, `bannerImage*`) tienen un mecanismo de recorte con zoom (`posX`/`posY`/`zoom`) que es un workaround custom de un bug real de CSS (`object-fit` + `transform:scale`, documentado en el propio esquema) — esto **no migra** a Shopify como dato de imagen: es lógica de presentación que habría que reconstruir en el theme si se quiere el mismo control de encuadre (ver `docs/shopify/architecture-map.md` de la auditoría de viabilidad, ya cubierto ahí).

## Recomendación (sin decidir todavía)

1. Una vez exista el export real: agrupar por `publicId`/`url` para detectar duplicados exactos antes de subir nada a Shopify.
2. **Mantener Cloudinary como fuente para las imágenes durante la migración** (referenciar la URL externa desde Shopify) en vez de re-subir todo a Shopify Files de entrada — reduce trabajo y evita duplicar almacenamiento mientras el proyecto sigue siendo "paralelo, no comprometido". Re-subir a Shopify CDN puede hacerse más adelante, cuando/si se decide cortar Cloudinary.
3. No se descarga ninguna imagen en esta fase (instrucción explícita de la fase) — esto es solo el plan, no la ejecución.
