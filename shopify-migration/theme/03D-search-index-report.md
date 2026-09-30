# 03D — Re-test del índice de búsqueda de Shopify

La medición se hizo en la Development Store, con el theme Radaelli RC1.3 en preview, el 2026-09-29.

## Método

- `/search?type=product&options[prefix]=last&q=…`: la página de resultados del theme. Se cuentan los handles únicos que aparecen en `main`.
- `/search/suggest.json?…&resources[options][fields]=title,product_type,tag`: los mismos campos que usa el predictive del theme (`assets/search.js:28`).
- **Cobertura:** para cada uno de los 29 productos se busca su título exacto en el predictive y se verifica que aparezca su propio handle.

## Resultados

### Cobertura por título exacto

| Hora (Bogotá) | Indexados | No indexados |
|---|---|---|
| 10:28 | **8 / 29** | 21 |

Productos indexados a las 10:28:
- bikini-palm-verde-oliva
- alba-dorada-cafe-claro
- arena-dorada-beige
- bikini-waves-verde-oliva
- enterizo-shadow-palm-azul-marino
- brisa-natural-naranja
- oasis-serena-azul
- brisa-natural-beige

### Matriz de consultas

La columna "Esperado por título/tipo" cuenta los productos cuyo título o tipo contiene el término. `/search` también busca en la descripción, así que puede superar ese número.

| Consulta | Esperado por título/tipo | /search | Predictive |
|---|---|---|---|
| BRISA NATURAL BEIGE | 1 | 2 | 2 |
| brisa | 2 | 2 | 2 |
| bikini | 5 | 4 | 4 |
| enterizo | 1 | 4 | 4 |
| negro | 6 | 1 | 1 |
| blanco | 0 (título) | 0 | 0 |
| mostaza | 0 (título) | 0 | 0 |
| beige | 6 | 2 | 2 |
| naranja | 2 | 1 | 1 |
| azul | 4 | 1 | 1 |
| aurora viva | 12 | 1 | 1 |
| RSONEN022 (SKU) | — | 1 | 1 |

Mediciones previas en 03C:
- 09:44 y 10:12: "negro" 1, "beige" 2, "bikini" 4.
- El índice no avanzó de forma apreciable en ~45 minutos.

### Evolución en 03D

| Hora (Bogotá) | Indexados | Qué pasó antes |
|---|---|---|
| 10:28 | 8 / 29 | Importación CSV 09:30 (03C) |
| 10:48 | 8 / 29 | Shopify marcó `updated_at` 10:48 en los 29 productos (proceso propio de Shopify); sin efecto en el índice |
| 11:08 | 8 / 29 | — |
| 11:12 | 10 / 29 | 11:03: se agregaron 7 productos a la colección nueva "Destacados" |
| 11:17 | 12 / 29 | Ya están indexados 6 de los 7 de "Destacados"; ningún producto sin tocar entró al índice |
| 11:23 | 13 / 29 | Entró `bikini-foam` (tag `color:BLANCO` guardado a las 11:12) |
| 11:24–11:26 | — | **Toque neto cero** sobre los 29: "Agregar etiquetas" `reindex-03d` y después "Eliminar etiquetas" `reindex-03d`. Verificado: 0 con la etiqueta temporal; 29/98/95 intacto |
| 11:29 | 20 / 29 | — |
| 11:31 | 23 / 29 | — |
| 11:35–11:36 | **27 / 29** | En cola: `bikini-waves-terracota` y `sol-interno-beige-suave` |

### Experimento de tags de color

- **Diseño:** solo 2/29 productos no tienen el color en el título (`catalog/color-search-tag-map.csv`). Son exactamente los 2 del experimento:
  - `entero-golden-hour` → `color:MOSTAZA`;
  - `bikini-foam` → `color:BLANCO`.
- **`color:BLANCO`: funciona.** "blanco" → `bikini-foam` en el predictive, también con `fields=tag` solo, y en `/search`.
- **`color:MOSTAZA`: no todavía.** El producto está indexado, pero "mostaza" da 0 a las 11:36: la entrada del índice es anterior al tag. Re-medir en 03E.
- **Decisión:** no se aplican tags a los 29, porque sería redundante con el título. Se mantienen los 2.

### Matriz de consultas (11:36)

| Consulta | /search | Predictive |
|---|---|---|
| negro | 6 | 6 |
| beige | 5 | 5 |
| azul | 4 | 4 |
| naranja | 2 | 2 |
| bikini | 18 | 10 (límite) |
| enterizo | 8 | 8 |
| blanco | 1 | 1 |
| mostaza | 0 | 0 |
| aurora viva | 11 | 10 (límite) |
| RSONEN022 (SKU) | 1 | 1 |

**Hallazgo (evidencia fuerte, n=7):**
- La importación masiva dejó el índice de búsqueda **incompleto y estancado**: más de 1 h 40 min sin cambios.
- **Actualizar un producto dispara su indexación** en unos 10–15 minutos. En este caso bastó con sumarlo a una colección.
- Los productos que no se tocaron siguen sin indexar.

Remedio **aplicado en 03D**: el toque neto cero de las 11:24–11:26, que llevó el índice a 27/29 a las 11:36.

## Conclusión

- **Cierre de 03D: 27/29 y completándose.** La importación masiva dejó el índice estancado en 8/29. Se desbloqueó tocando los productos, y los 2 restantes están en cola.
- **Estado a las 10:28 (histórico):** el índice de búsqueda de Shopify cubría solo 8 de 29 productos más de 1 h después de importar.
- **No es un problema del theme.** La página `/search` y el predictive devuelven y dibujan correctamente todo lo que el índice contiene.
- **El SKU sí se indexa** (RSONEN022 encontrado).
- **Los tags de color no se pueden evaluar** mientras el índice base esté incompleto: un "antes/después" confundiría la indexación pendiente con el efecto del tag.
- **Acción:**
  - repetir la medición de cobertura antes de decidir sobre los tags (ver `03D-search-accounts-wishlist-report.md`);
  - (histórico, superado por el toque neto cero de las 11:24–11:26).
