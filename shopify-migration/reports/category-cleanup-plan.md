# Plan de limpieza segura de taxonomía (sección 7, Fase 01B — actualizado Fase 01E con datos reales)

**NO ejecutado. Solo evidencia y plan.** Nada de este documento se aplicó — ni en la base de datos actual, ni en ningún borrador de Shopify (no existe tienda Shopify todavía).

Fuente: `category-taxonomy-audit.md`, `shopify-target-taxonomy.md`, lectura de `lib/admin/categories-actions.ts`, `app/sitemap.ts`, y (Fase 01E) lectura pública real de las 9 páginas de colección de `radaelliswimwear.com` — ver `../source-of-truth/public-scrape-raw.json`.

## BEFORE (estado actual, 9 categorías posibles)

Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño, Accesorios, Hombre, Mujer, Niños, Calzado — las 9 rutas reales que existen hoy en `app/`. Ver matriz completa en `category-taxonomy-audit.md`.

**Conteo real confirmado (Fase 01E, 2026-09-28)**: Oasis Natural = 10 productos, Aurora Viva = 12, Espuma de Ola = 7 (total 29). **Salidas de Baño, Accesorios, Hombre, Mujer, Niños y Calzado = 0 productos reales cada una**, confirmado directamente visitando las 9 páginas de colección reales.

## AFTER (estado objetivo, propuesta)

4 colecciones: Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño. Accesorios queda **pendiente de decisión** (ver abajo) — no se asume su destino, aunque hoy no tiene productos activos.

## PRODUCTS AFFECTED

**0 productos activos confirmados** en las categorías a retirar/decidir (Salidas de Baño, Accesorios, Hombre, Mujer, Niños, Calzado) — confirmado por lectura directa de las 9 páginas de colección reales el 2026-09-28. **Esto simplifica enormemente la limpieza**: no hace falta reasignar ningún producto visible hoy.

**Salvedad honesta, no resuelta todavía**: este conteo cubre productos **activos** únicamente (lo único visible en una página pública). Si existiera algún producto con `active=false` "aparcado" en alguna de estas categorías (invisible en la tienda, pero todavía en la base), esta lectura no lo detecta — sigue siendo un `MANUAL_STEP_REQUIRED` de menor urgencia (ver ese archivo), no un bloqueo para avanzar con la limpieza de lo que sí se ve.

## REASSIGNMENT

**Actualizado Fase 01E: no hace falta reasignar ningún producto** — las 5 categorías candidatas a retiro/decisión (Hombre, Mujer, Niños, Calzado, Accesorios) confirmaron 0 productos activos reales el 2026-09-28. La limpieza, en la práctica, se reduce a: (1) decidir el destino formal de la categoría `Accesorios` (¿se retira igual, o se deja lista para uso futuro?), y (2) marcar `active=false` en las 4 ya archivadas si no lo están ya (no verificable el valor exacto de `active` sin `MANUAL_STEP_REQUIRED.md`, pero sin impacto visible porque ya no tienen productos ni aparecen en nav/sitemap).

No existe hoy, de todas formas, una función de "mover en masa" productos de una categoría a otra en el Panel Admin — la edición de `Product.categoryId` se hace producto por producto desde `/admin/productos/[id]`. Queda documentado por si en el futuro aparecen productos nuevos mal categorizados, aunque hoy no aplica.

## SEO IMPACT

- Oasis Natural / Aurora Viva / Espuma de Ola / Salidas de Baño: **ningún impacto SEO adicional** más allá del ya documentado en `docs/shopify/seo-analytics.md` (cambio de prefijo `/slug` → `/collections/slug`, ya cubierto).
- Hombre / Mujer / Niños / Calzado: **ya están excluidas del sitemap actual** (confirmado en `app/sitemap.ts` Y en la lectura real del `sitemap.xml` en vivo) y **confirmado con 0 productos reales** — el impacto de retirarlas del todo en Shopify es bajo. Sigue sin poder confirmarse sin Google Search Console si conservan tráfico orgánico residual (backlinks viejos) — mismo punto ya señalado en `seo/seo-notes.md`.
- Accesorios: sí sigue apareciendo como URL en el sitemap actual (`app/sitemap.ts` la incluye siempre, indistintamente de si tiene productos), pero **confirmado con 0 productos reales** el 2026-09-28 — si se retira, el impacto SEO es mínimo (no hay páginas de producto individuales apuntando ahí para perder), aunque la propia URL de colección sí conviene redirigir.

## REDIRECT NEEDED

| Categoría | Redirect needed |
|---|---|
| Hombre/Mujer/Niños/Calzado | NO obligatorio (ya fuera del sitemap, tráfico esperado bajo) — REQUIERE_DECISION si Search Console muestra tráfico real |
| Accesorios | **SÍ, si se retira** — está indexada activamente hoy |
| Oasis Natural/Aurora Viva/Espuma de Ola/Salidas de Baño | SÍ (mismo redirect estructural de slug → `/collections/slug` que ya aplica a cualquier colección que se mantenga) |

## NAV IMPACT

El navbar ya lee `Category.active` dinámicamente (`components/layout/navbar/index.tsx` + `app/layout.tsx`) — **desactivar una categoría (`active=false`) ya la saca del menú sin tocar código**, es el mecanismo que el propio equipo ya usó para archivar Hombre/Mujer/Niños/Calzado tras el rebrand. Retirar Accesorios (si así se decide) usaría exactamente el mismo mecanismo, ya probado.

## SITEMAP IMPACT

Hombre/Mujer/Niños/Calzado: ninguno (ya excluidas). Accesorios: se debe quitar la línea correspondiente de `app/sitemap.ts` si se retira — cambio de una línea, trivial, pero es código, así que no se toca en esta fase de auditoría.

## ROLLBACK

- **Reactivar una categoría archivada es instantáneo y sin riesgo**: `Category.active = true` de vuelta (un solo `UPDATE`, sin migración, sin pérdida de datos) — el patrón ya existe y ya se revirtió en el pasado sin incidentes conocidos.
- **Reasignar productos es lo único con fricción de rollback real**: si se reasigna `Product.categoryId` de una categoría legada a una de las 4 oficiales y luego hay que deshacerlo, hace falta el listado de qué producto tenía qué categoría ANTES del cambio — por eso el export de esta fase (`catalog-snapshot.json`/`products-master.csv`, con columna `current_category` ya agregada, ver sección 10) debe correr y guardarse **antes** de reasignar nada, para que exista una fotografía exacta de "antes" a la que volver.
- Ninguna fila de `Category` se borra en ningún escenario de este plan — el rollback de "borrar una categoría" no aplica porque este plan explícitamente no borra ninguna (ver hallazgo estructural en `category-taxonomy-audit.md`: el código no tiene ni siquiera una función para hacerlo).

## Próximo paso

Nada de esto se ejecuta todavía. Antes de tocar una sola fila de datos: (1) resolver `MANUAL_STEP_REQUIRED.md` para tener el conteo real de productos por categoría, (2) que Daniela confirme el destino de Accesorios, (3) recién ahí decidir si la reasignación se hace a mano o con un script puntual de una sola vez.
