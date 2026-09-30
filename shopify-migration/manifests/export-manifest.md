# Manifiesto de archivos generados (sección 12, actualizado Fase 01E)

Generado: 2026-09-28. Datos reales de catálogo obtenidos por **lectura pública GET** de `radaelliswimwear.com` (sitemap + JSON-LD + páginas de colección) — sin `DATABASE_URL`, sin autenticación. Checksums SHA-256 sobre el contenido real de cada archivo en este snapshot.

| Archivo | Tamaño | Estado | SHA-256 |
|---|---|---|---|
| `README.md` | 6187 B | doc | `38549c5a48043f17f9242aed45db9346d23cc32eb72a255a872c2da4e0282591` |
| `MANUAL_STEP_REQUIRED.md` | 11190 B | doc — **actualizado Fase 01E**, bloqueo reducido a stock exacto/inactivos/id/featured/coupons | `51c50ef6c848d72d4e4e69fe6d7668fee0fe6595a6f8341c6fe2a764ee050183` |
| `source-of-truth/data-model-audit.md` | 7711 B | doc (sin cambios) | `5af9dcba78b11fef5e4b94daf53839d971ed54730159208f37be3709d36d2010` |
| `source-of-truth/public-scrape-raw.json` | 27696 B | **NUEVO** — dataset crudo de los 29 productos reales | `2597dc35928600f9774613ac75d158e172eda520c7ec2083216707950911458d` |
| `source-of-truth/catalog-snapshot.json` | 56864 B | **REAL_EXPORT_PUBLIC_SCRAPE** — 29 productos reales | `5da8746a48713873e6dfb9b74c09bea2f92c3941ecb593699f6d915dd1edd2a7` |
| `catalog/Radaelli_Catalogo_Master.xlsx` | 187406 B | **POBLADO con datos reales** (29 productos, 6 hojas) | `54ee362f950994d47a6015cb151345da962ca4ec7d6720f48321e4a43745bf29` |
| `catalog/products-master.csv` | 26718 B | **POBLADO** — 29 filas reales | `865c51e674c553bfd4e778f63799a00c1f58021da0169499fcd9bab5552ef940` |
| `catalog/variants-master.csv` | 20567 B | **POBLADO** — una fila por talla real (sin cantidad exacta) | `b5712d5fac46a490e00b13e4df9c9cdd0a0450b5f3f1e6d5db5f692cd9c2b7e6` |
| `images/images-manifest.csv` | 22256 B | **POBLADO** — todas las imágenes reales (Cloudinary) | `64f5327b2861e97b4bee2dda261c111c1b0efb11df41f33596dfe671b4ac48d9` |
| `images/image-migration-plan.md` | 3490 B | doc (sin cambios) | `b9c05cf9daf6286f4d48e42abd75149d5cb9e2df09d722f7384cd45a0616eeea` |
| `collections/collections-master.csv` | 1873 B | **POBLADO** — 9 categorías con conteos reales | `9b01ca6f577f958e8f33aab7579ccf61d1196e6289d4c1a3ff04a2e7e2c13fd3` |
| `seo/current-url-inventory.csv` | 14250 B | **POBLADO** — 29 URLs de producto reales + estructurales | `a9f0918c830b0945e1c6f5bd250492a6d7d557e665c7bc2b38332d644f64ed05` |
| `seo/seo-notes.md` | 1945 B | doc (sin cambios) | `13236c817e458b8c096f87b8ca5bf4df17f8e017f9c63b30f1748159810a957a` |
| `shopify-import/catalog-field-mapping.md` | 6170 B | doc (sin cambios) | `9c8a7b8deb94800fadb2a957838e09b7652bab305e0bd78ad432737c06e73625` |
| `shopify-import/shopify-target-taxonomy.md` | 2859 B | doc (sin cambios) | `c23dff33e01453bce1ba64881df5431c5eef9b962a25c3102267f53974cde0d4` |
| `shopify-import/shopify-products-DRAFT.csv` | 218 B | header only, sin cambios | `1eb25360ee8446cf78f3f28865e1435bfb877271a1f3bee70110e048b2385b5a` |
| `reports/catalog-quality-report.md` | 8155 B | doc — **hallazgos reales agregados** (3 inconsistencias detectadas) | `a12e76e1358aeb81a5c3c2f33faadb96865c80d1ee570f5e04223c6954e27df6` |
| `reports/category-taxonomy-audit.md` | 6569 B | doc (sin cambios desde Fase 01B) | `77429467b2a10ac642f188992c52dc4dd703ebd1ea813a125b036bb419822c6c` |
| `reports/category-cleanup-plan.md` | 6723 B | doc — **actualizado**, 0 productos afectados confirmado | `c788f6f879099c2e6a53bc522c3f891d6a70ccdb11f90210c0b8b266712444d6` |
| `scripts/export-radaelli-catalog-for-shopify.mjs` | 11524 B | script Prisma read-only, sin cambios, no ejecutado | `67da183a72ff1db2a1457ef083fbd25ab0640b456e7d30262062d046ec2c7fb7` |
| `scripts/build-from-public-scrape.mjs` | 12179 B | **NUEVO** — transforma el scrape crudo en todos los maestros | `4dcca61bb444ddf60027834a81e91250993373abc96ec16c5d125d6d2f428403` |
| `scripts/build-catalog-workbook.mjs` | 11847 B | **actualizado** — soporta 3 modos (template/db_real/public_scrape) | `d3b39a9b4eb769bc99a43641286d7a103cb7d206497619a28f5cae2373614dba` |
| `scripts/package.json` | 275 B | sin cambios | `ec93034f6c66dc4575e35cd759800553d8e1b699da2f54b3d3e8a72847d7abef` |
| `scripts/package-lock.json` | 3722 B | sin cambios | `8495c4025f6093728f191471195f0fbf50c2dc3b3018361e159e974faf5867db` |

`scripts/node_modules/` sigue excluido vía `scripts/.gitignore`.

## Qué cambió respecto al manifiesto de la Fase 01B

**El catálogo comercial real ya está poblado**, por primera vez en esta migración — 29 productos, 100% de las 3 categorías con inventario real, 0 productos en las 6 categorías candidatas a retiro/decisión (confirmado, no inferido). Método: lectura pública pasiva del sitio real, sin tocar ninguna base de datos ni revelar ningún secreto. El único trabajo pendiente real es de menor escala: cantidad exacta de stock, productos inactivos, y algunos metadatos internos no públicos — ver `MANUAL_STEP_REQUIRED.md`.
