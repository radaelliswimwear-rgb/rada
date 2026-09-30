# Taxonomía objetivo para Shopify (sección 6, Fase 01B)

Nombres reales del catálogo actual (`lib/categories.ts`, `lib/catalog/types.ts`) — ninguno inventado. Complementa `category-taxonomy-audit.md` (qué se retira) y `catalog-field-mapping.md` (mapeo de campos general).

## Shopify Collections propuestas (4)

| Colección Shopify | Handle propuesto | SEO URL | Regla de asignación de producto | Manual vs. Automated | Metafields/tags sugeridos |
|---|---|---|---|---|---|
| **Oasis Natural** | `oasis-natural` | `/collections/oasis-natural` | Producto con `categoryId` → Category.slug `oasis-natural` | **Automated** (Smart Collection por tag o por metafield de categoría — ver nota abajo) | tag `coleccion:oasis-natural`; descripción actual: "Tonos tierra y vegetación exuberante" |
| **Aurora Viva** | `aurora-viva` | `/collections/aurora-viva` | `categoryId` → `aurora-viva` | Automated | tag `coleccion:aurora-viva`; descripción actual: "Colores luminosos para los primeros rayos del día" |
| **Espuma de Ola** | `espuma-de-ola` | `/collections/espuma-de-ola` | `categoryId` → `espuma-de-ola` | Automated | tag `coleccion:espuma-de-ola`; descripción actual: "Texturas suaves y tonos marinos" |
| **Salidas de Baño** | `salidas-de-bano` | `/collections/salidas-de-bano` | `categoryId` → `salidas-de-bano` | Automated | tag `coleccion:salidas-de-bano`; descripción actual: "Prendas ligeras para después del sol" |

**Por qué Automated y no Manual**: cada producto actual ya tiene exactamente una categoría (`Product.categoryId`, relación 1:1 obligatoria) — esto mapea limpio a una Smart Collection de Shopify con la condición "product tag is `coleccion:<slug>`" (asignando el tag en el momento del import, derivado de `categoryId`). Una colección Manual exigiría mantener la lista de productos a mano en Shopify, duplicando un dato que el catálogo actual ya resuelve solo.

## Qué NO se propone todavía (pendiente decisión de Daniela)

- **Accesorios**: no incluida en la tabla de 4 de arriba, a propósito — ver `category-taxonomy-audit.md`. Si Daniela decide mantenerla, se agrega como quinta colección con el mismo patrón; si decide disolverla, sus productos necesitan una regla de reasignación explícita (¿a cuál de las 4? ¿depende del tipo de producto?) antes de poder proponer un mapeo.
- **Hombre / Mujer / Niños / Calzado**: no se proponen como colecciones Shopify — son las categorías a retirar. Si tienen productos reales activos, esos productos necesitan reasignación explícita a una de las 4 colecciones (o a Accesorios, si sobrevive) antes del export final, no después.

## No se crea nada de esto en Shopify todavía

Esta fase es solo la propuesta de estructura — ninguna Collection, tag ni metafield se crea en ninguna tienda de Shopify (no existe ninguna tienda Shopify todavía).
