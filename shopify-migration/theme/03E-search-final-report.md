# 03E — Búsqueda: cierre del incidente de índice y decisión de tags de color

Development Store, theme Radaelli en preview. Mediciones del 2026-09-29.

## 1. Cobertura del índice: **29/29 (CERRADO)**

| Hora (Bogotá) | Indexados | Evento |
|---|---|---|
| 10:28–11:08 | 8/29 | Índice estancado tras la importación masiva por CSV (03C) |
| 11:03 | — | 7 productos sumados a "Destacados" → se indexan en unos 10–15 min |
| 11:24–11:26 | — | Toque neto cero en los 29: etiqueta temporal `reindex-03d` agregada y quitada en bloque |
| 11:36 | 27/29 | — |
| **11:49** | **29/29** | Incidente cerrado |
| 12:27 | 29/29 | Re-verificado |

**Método:** para cada producto, el predictive con su título exacto devuelve su propio handle.

## 2. Lo que se aprendió de la búsqueda de Shopify (medido, no supuesto)

1. **El parámetro `resources[options][fields]` del predictive se ignora en esta tienda.**
   - "calidez", "drapeado" y "suavidad" (palabras que solo están en descripciones) devuelven los mismos productos con `fields=tag`, `fields=title` o sin `fields`.
   - Por lo tanto la búsqueda **sí incluye la descripción**.
2. **Los tags con prefijo `color:` no generan tokens buscables.**
   - Con `color:MOSTAZA` en ENTERO GOLDEN HOUR, "mostaza" daba 0 incluso con el producto ya indexado.
   - "color" tampoco traía los 2 productos tageados.
3. **Los tags planos sí son buscables.**
   - Se reemplazó por `MOSTAZA` (11:52).
   - Desde las 12:27 el predictive devuelve "mostaza" → `entero-golden-hour`; `/search` también desde las 12:40.
   - Ni el título ("ENTERO GOLDEN HOUR"), ni el tipo ("Espuma de Ola"), ni la descripción contienen "mostaza", así que el único origen posible es el tag.
4. **Corrección de 03D:** 03D atribuyó "blanco" → `bikini-foam` al tag `color:BLANCO`. En realidad lo encuentra por la **descripción** ("…este bikini blanco…"). Se quitó ese tag, que no aportaba nada.

## 3. Decisión de tags (convención final)

- **Regla:** tag **plano** con el valor de `custom.color`, **solo** si el color no aparece ni en el título, ni en el tipo, ni en la descripción.
- `scripts/build-color-search-tag-map.mjs` lo calcula de forma determinista desde `import/shopify-products-03c.csv` → `catalog/color-search-tag-map.csv`.
- **Resultado:** 1 de 29 lo necesita, `entero-golden-hour` → `MOSTAZA`. Es exactamente el estado actual de la tienda.
- **Tags en el catálogo hoy:** solo `entero-golden-hour: MOSTAZA`. No hay tags duplicados ni términos SEO inventados.

## 4. Matriz de consultas (medida a las 12:40, después del cierre)

| Consulta | Predictive | /search | Nota |
|---|---|---|---|
| negro | 6 | 6 | Por título: los 6 NEGRO, incluidos 2 cuyo handle dice "azul-marino" |
| beige | 6 | 6 | Por título |
| azul | 4 | 4 | Por título |
| naranja | 2 | 2 | Por título |
| blanco | 1 (`bikini-foam`) | 1 (`bikini-foam`) | Por descripción |
| mostaza | 1 (`entero-golden-hour`) | 1 (`entero-golden-hour`) | Por tag plano `MOSTAZA` |
| golden hour / ENTERO GOLDEN HOUR | 1 | 1 | Por título exacto y parcial |
| enterizo | 8 | 8 | Título o descripción |
| bikini | 10 (límite del predictive) | 20 | `/search` incluye descripciones |
| oasis natural (colección) | 10 | 10 | Tipo de producto = colección |
| RSONEN022 (SKU) | 1 | 1 | SKU indexado |

## 5. Search & Discovery

- **No instalada** (concesión OAuth owner-only).
- Preparación completa en `theme/03E-search-discovery-prep.md`.
