# Auditoría de taxonomía actual (sección 5, Fase 01B)

Objetivo de negocio (instrucción explícita de esta fase): conservar únicamente **3 colecciones oficiales actuales + Salidas de Baño**, e identificar (sin borrar ni modificar todavía) qué pasa con el resto.

Fuente: lectura directa de `lib/catalog/types.ts`, `lib/categories.ts`, `lib/admin/categories-actions.ts`, `components/layout/navbar/index.tsx`, `app/sitemap.ts`, y los 9 directorios reales de ruta bajo `app/`. **Sin acceso a datos reales** (ver `../MANUAL_STEP_REQUIRED.md`) — `PRODUCT COUNT` y `PRODUCTS` no se pueden completar todavía.

## Hallazgo estructural clave (antes de la matriz)

`lib/admin/categories-actions.ts` documenta explícitamente: *"a propósito solo permite renombrar, no crear ni eliminar. Las categorías de catálogo están hardcodeadas como rutas estáticas (`app/hombre`, `app/mujer`, `app/accesorios`, etc. + `CATEGORY_LABELS`/`CATEGORY_SLUG_BY_LABEL` en `lib/catalog/types.ts`)"*. Esto significa:

- **No existe ninguna función en el código actual para borrar una categoría.** El conjunto de 9 categorías posibles está fijo por el código (9 carpetas de ruta), no es dinámico.
- Lo único que el Panel Admin permite hoy es: renombrar (`Category.name`), activar/desactivar (`Category.active`), y editar imágenes/descuento.
- El comentario de `lib/catalog/types.ts` confirma que Hombre/Mujer/Niños/Calzado **ya están "archivadas"** (fuera de nav/home) desde el rebrand a Radaelli Swimwear — el mecanismo de archivo ya existe y ya se usó antes para exactamente este tipo de limpieza.
- Consecuencia directa para la sección 7 (plan de limpieza): "retirar" una categoría hoy solo puede significar **reasignar sus productos + marcarla `active=false`** (patrón ya usado) — un borrado real de la fila `Category` en Postgres requeriría además que ningún `Product` la referencie (`Product.categoryId` es una FK obligatoria sin `onDelete: Cascade`), y no hay ninguna herramienta en el admin para hacerlo. Esto no es una limitación de esta auditoría — es una limitación real de la arquitectura actual, confirmada leyendo el código.

## Matriz de taxonomía

| CURRENT CATEGORY | SLUG | PRODUCT COUNT | PRODUCTS | VISIBLE IN NAV | VISIBLE IN SITEMAP | VISIBLE IN FILTERS | KEEP/REMOVE/REASSIGN | TARGET CATEGORY | RISK |
|---|---|---|---|---|---|---|---|---|---|
| Oasis Natural | `oasis-natural` | NOT_AVAILABLE | NOT_AVAILABLE | Depende de `Category.active` real (código: candidata activa) | **SÍ** (hardcodeado en `app/sitemap.ts`) | N/A — la página de categoría ES el filtro (no hay selector de categoría dentro del catálogo) | **KEEP** — una de las 3 colecciones oficiales (ver razonamiento abajo) | Oasis Natural (sin cambio) | Bajo |
| Aurora Viva | `aurora-viva` | NOT_AVAILABLE | NOT_AVAILABLE | Depende de `Category.active` real | **SÍ** | N/A | **KEEP** — oficial | Aurora Viva (sin cambio) | Bajo |
| Espuma de Ola | `espuma-de-ola` | NOT_AVAILABLE | NOT_AVAILABLE | Depende de `Category.active` real | **SÍ** | N/A | **KEEP** — oficial | Espuma de Ola (sin cambio) | Bajo |
| Salidas de Baño | `salidas-de-bano` | NOT_AVAILABLE | NOT_AVAILABLE | Depende de `Category.active` real | **SÍ** | N/A | **KEEP** — nombrada explícitamente por Daniela | Salidas de Baño (sin cambio) | Bajo |
| Accesorios | `accesorios` | NOT_AVAILABLE | NOT_AVAILABLE | Depende de `Category.active` real | **SÍ** | N/A | **REQUIRES_DECISION** — no es una de las 3 oficiales ni es "Salidas de Baño", pero puede tener inventario real activo | REQUIRES_DECISION (¿colección propia en Shopify, o reasignar por producto?) | **Medio** — si tiene productos activos con ventas, retirarla sin plan de reasignación deja esos productos sin colección visible |
| Hombre | `hombre` | NOT_AVAILABLE | NOT_AVAILABLE | **NO** (archivada tras el rebrand, confirmado en comentario del código) | **NO** (excluida a propósito, confirmado en `app/sitemap.ts`) | N/A | **REMOVE** (ya archivada — confirmar si además se reasignan productos o se dejan huérfanos pero inactivos) | Ninguna / retirar | **Medio** — ruta sigue siendo accesible por URL directa aunque no esté en nav/sitemap; si tiene productos reales, definir su destino antes de tocar nada |
| Mujer | `mujer` | NOT_AVAILABLE | NOT_AVAILABLE | **NO** | **NO** | N/A | **REMOVE** | Ninguna / retirar | Medio (mismo motivo que Hombre) |
| Niños | `ninos` | NOT_AVAILABLE | NOT_AVAILABLE | **NO** | **NO** | N/A | **REMOVE** | Ninguna / retirar | Medio (mismo motivo) |
| Calzado | `calzado` | NOT_AVAILABLE | NOT_AVAILABLE | **NO** | **NO** | N/A | **REMOVE** | Ninguna / retirar | Medio (mismo motivo) |

## Cómo se identificaron las "3 colecciones oficiales"

No se inventó esta lista — se derivó de dos fuentes de código independientes que coinciden:

1. `lib/catalog/types.ts`, comentario explícito: *"Hombre, Mujer, Niños y Calzado quedan archivadas... se reemplazan en la navegación por **las 4 colecciones de trajes de baño**"* — las 4 categorías restantes relacionadas con trajes de baño son exactamente Oasis Natural, Aurora Viva, Espuma de Ola y Salidas de Baño (Accesorios queda fuera de ese conteo de "4" porque no es una prenda de baño).
2. Coincide exactamente con la instrucción de Daniela de esta fase: "3 colecciones oficiales + Salidas de Baño" = 4 — mismo número, mismos nombres si Salidas de Baño es la que se nombra aparte.

Aun así, **esto se marca como INFERENCIA bien corroborada, no como confirmación de negocio** — no hay ningún documento de negocio en el repo que liste "las 3 colecciones oficiales" con ese nombre exacto. Se pide **una sola confirmación de una palabra** en el informe final (ver `MANUAL_STEP_REQUIRED.md` — no es el mismo bloqueo que el acceso a la base de datos, es una confirmación de negocio de 5 segundos, no técnica).

## Riesgo de productos huérfanos

No se puede cuantificar sin datos reales (`PRODUCT COUNT`/`PRODUCTS` pendientes). Estructuralmente, el riesgo real es bajo por diseño: `Product.categoryId` es una relación obligatoria (`Category` FK no-nullable) — **no puede existir un producto sin categoría** en el esquema actual. El riesgo real no es "productos sin categoría" (imposible), sino **productos activos y con ventas dentro de una categoría que se va a marcar inactiva/retirar sin habérselos reasignado antes** — quedarían con una categoría que ya no aparece en ningún lado de la navegación, aunque la fila `Category` y el producto sigan existiendo intactos en la base.
