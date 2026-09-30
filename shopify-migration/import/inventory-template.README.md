# `inventory-template.csv`: hoja de inventario para la decisión D2 (creada en 03I)

**Qué es:** las 98 variantes (29 productos) tal como están en `import/shopify-products-03c.csv`, con una columna **`cantidad_a_cargar` vacía** para que la dueña la complete. Es **una propuesta de hoja**: no es el formato de importación de inventario de Shopify (ese formato es `NOT_VERIFIED` y se convierte después, con la doc oficial vigente, cuando las cantidades estén completas).

**Qué NO trae:** ninguna cantidad. Ninguna fuente actual confirma stock (`launch/03G-reproducibility-gap-audit.md` G02: 98/98 `NOT_AVAILABLE`); el sitio actual solo dice "disponible / agotado". Claude no inventa cantidades.

| Columna | Contenido |
|---|---|
| `sku`, `handle`, `producto`, `talla`, `precio_cop` | Los del CSV de importación (no cambiar) |
| `disponible_sitio_actual_2026_09_28` | "Disponible" si la talla se muestra hoy en el sitio actual (rastreo de 03G); **97 de 98** |
| `cantidad_a_cargar` | **La completa la dueña.** Un número por variante; `0` = agotado |
| `nota` | Una sola fila marcada: `LG-AUR-000001-XL` (XL de `alba-dorada-cafe-claro`, decisión **D1**: el sitio actual solo muestra S, M y L) |

**Alternativa a completar 98 números:** decidir **vender sin límite** (la Dev Store hoy no rastrea inventario). En ese caso no hay que completar la hoja: solo dejarlo por escrito (`launch/03G-launch-acceptance-checklist.md` AC-12).

**Abrir el archivo:** en Google Sheets o Excel (viene con BOM UTF-8 para conservar tildes; si Excel en español lo abre en una sola columna, usar Datos > Texto en columnas con coma). No cambiar el orden ni borrar filas.

**Regenerar / verificar:** `node launch/tools/03i-build-inventory-template.mjs` (`--check` compara el archivo con lo que sale de los insumos; la hoja **completada** por la dueña va en otro archivo, nunca sobre este).

**Después (lo hace Claude, con OK):** convertir al formato oficial vigente de importación de inventario, activar el seguimiento con una ubicación, cargar y comprobar 98/98; y un snapshot final de stock justo antes del corte de DNS (`launch/03G-cutover-runbook.md`).
