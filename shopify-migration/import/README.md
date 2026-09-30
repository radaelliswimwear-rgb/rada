# Importación del catálogo real (Fase 03C)

CSV para el importador oficial de Shopify (**Admin → Productos → Importar**), generado de forma determinista desde las fuentes de la Fase 01.

## Cómo se genera

```
node shopify-migration/scripts/build-shopify-product-csv.mjs
```

- **Entradas:**
  - `catalog/products-master.csv`
  - `catalog/variants-master.csv`
  - `images/images-manifest.csv`
- **Salidas:**
  - `import/shopify-products-03c.csv` (99 filas: 29 productos, 98 variantes, 95 imágenes)
  - `import/color-mapping.csv`
  - `catalog/shopify-handle-mapping.csv`
  - `import/checksums.txt` (SHA-256 de entradas y salidas)
- **Compuertas duras:** el script aborta si no se cumplen 29 / 98 / 95, colecciones 10 / 12 / 7 / 0, handles y SKU únicos, precio > 0 y compare-at > precio.
- **Mismo input, mismos bytes:** se verificó con 2 corridas y el mismo SHA.

## Reglas de mapeo

| Campo Shopify | Fuente | Nota |
|---|---|---|
| `URL handle` | `slug` en minúsculas | 1 cambio: `COSTA-ESMERALDA-AZUL` → `costa-esmeralda-azul`, registrado para redirect |
| `Title` | `name` | Exacto (mayúsculas como hoy) |
| `Description` | `description` | Texto → HTML: párrafos `<p>` y viñetas "•" → `<ul><li>`. Sin agregar ni quitar palabras |
| `Vendor` | — | `Radaelli Swimwear`: marca única del sitio. Sin esto Shopify pondría el nombre de la tienda de desarrollo |
| `Type` | `target_shopify_collection` | El theme lo muestra como etiqueta de categoría (igual que `product.category` del sitio actual) |
| `Option1 name` / `value` | `Talla` / `size` | Orden S → M → L → XL. "L y XL" se preserva exacto |
| `SKU` | `variant_identifier` | Exacto, incluidos `LG-HOM-*` y "LG-AUR-000009-L y XL" |
| `Price` | `calculated_sale_price` | Lo que el sitio cobra hoy |
| `Compare-at price` | `price_cop` | Precio de lista que hoy se ve tachado (-20%). **Sin** descuento automático, para no aplicarlo dos veces |
| `Inventory tracker` | vacío | **No rastreado**: no existe snapshot de cantidades. La disponibilidad en Dev **no** es inventario real |
| `Product image URL` / `Image position` / `Image alt text` | manifest (Cloudinary) | Posición base 1; el alt es el nombre del producto (el sitio usa lo mismo) |
| `Collection` | `target_shopify_collection` | Las 4 colecciones existen antes de importar (manuales, modelo nuevo) |
| `Color (product.metafields.custom.color)` | `color` en MAYÚSCULAS | La definición `custom.color` (single line text) existe antes de importar |
| SEO title / description | vacíos | En la fuente son los valores efectivos (= nombre / = descripción), que Shopify ya usa por defecto |
| `Published on online store` / `Status` | `true` / `active` | Al importar se desmarcó "publicar en todos los canales": queda **solo en la Tienda online**, para el QA en el preview (tienda con contraseña) |

## Lo que NO se importa

- Stock, pesos, códigos de barras, costo, descuentos, reseñas ni tags. Los tags de color se decidieron después de probar la búsqueda real (ver el reporte 03C).
- Productos de Accesorios, Hombre, Mujer, Niños y Calzado (0 en la fuente).
