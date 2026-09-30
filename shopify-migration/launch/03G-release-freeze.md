# 03G — Congelamiento de release (RC1.8)

- **Fecha de congelamiento:** 2026-09-30, 00:52 (Bogotá), después de la regresión final de 03G.
- **Generado por:** `launch/tools/03g-release-freeze.mjs` (determinista; lee los artefactos y calcula SHA-256).
- **Alcance:** lo que se congela es lo necesario para reconstruir la Dev Store y para migrar a la tienda comercial. Los documentos de `launch/`, `theme/` y `seo/03F-*` describen el estado; no forman parte del congelamiento.

## Qué significa congelar

- El theme vigente en la Dev Store es **RC1.8** y no cambia salvo un defecto real. Si aparece uno: corrección + prueba de regresión + mutante + Theme Check 0/0 + push solo al theme sin publicar + comparación remoto = ZIP + **RC1.9** con su manifiesto (RC1.8 queda como histórico).
- Ningún artefacto de catálogo, redirecciones, contenido legal ni media se modifica sin volver a correr sus validadores (`seo/validate-redirects.mjs`, `scripts/test/test-apply-media-wiring.mjs`, auditoría 29/98/95).
- Pasar de la Dev Store a la tienda comercial reutiliza estos mismos archivos; el plan está en `launch/03G-commercial-store-migration-plan.md`.
- Lo que existe **solo en el Admin** (y no en estos archivos) está listado en `launch/03G-reproducibility-gap-audit.md`.

## Qué cambió en 03G

- Theme: **RC1.7 → RC1.8** (un archivo: `sections/main-product.liquid`). Corrige la miga de pan, el enlace "Volver a…" y el JSON-LD `BreadcrumbList` de la ficha, que usaban `product.collections.first` (orden no garantizado por Shopify; 4 fichas de Espuma de Ola mostraban "Destacados"). Ahora usan la colección de categoría del producto.
- App: sin cambios (0.1.2). Catálogo, redirecciones, legales y media: sin cambios.

## Theme (release congelado)

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `dist/radaelli-shopify-theme-rc1.8.zip` | 173.654 | `e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67` |
| `dist/release-manifest-rc1.8.json` | 16.905 | `0161d550bc061d51b58e41941605fca3d0d3cd5a7048515d4de969dc2ba6ba23` |
| `dist/release-manifest-rc1.7.json` | 16.851 | `4f45f51cc4fc43b6bf61c36a0f3ccdd80d92a3007ca39e3171f5e4a5ba504603` |
| `dist/radaelli-shopify-theme-rc1.7.zip` | 173.398 | `5bea536f102a80fd206de797b0c59dff4687558e75232d5833f541709cdc4b0b` |

## App de favoritos (sin instalar)

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `dist/radaelli-wishlist-app-0.1.2.zip` | 253.247 | `19c8c0df68a30533b6e3b953729d525afd784a4518e2dbb6691bc8ddc919e4b2` |
| `dist/radaelli-wishlist-app-0.1.1.zip` | 253.148 | `f14f068a962a617d255c9cfba6a9ba581496c5c6b3c7dc4713ac2b4bb1be1de8` |
| `dist/radaelli-wishlist-app-0.1.0.zip` | 222.694 | `559c346a8121d822462f3622abfb77e38d55607a83cd263bde37d3421687296a` |

## Catálogo (29 productos / 98 variantes / 95 imágenes)

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `catalog/products-master.csv` | 26.718 | `865c51e674c553bfd4e778f63799a00c1f58021da0169499fcd9bab5552ef940` |
| `catalog/variants-master.csv` | 20.567 | `b5712d5fac46a490e00b13e4df9c9cdd0a0450b5f3f1e6d5db5f692cd9c2b7e6` |
| `catalog/shopify-handle-mapping.csv` | 6.214 | `24133383207e340dc312ac42d21f23b2f2094894e8e79c1076f059c6c073c423` |
| `catalog/shopify-post-import-audit.csv` | 4.064 | `60ae4ec2ae1252b3fac94d059baa05f7ec652c2e507568e4948db8293ed0c3a1` |
| `catalog/shopify-url-parity.csv` | 9.358 | `443fb8bc894f302b9f4bf2eb6441c7958b752169d64fa9b9664e13010c2bf384` |
| `catalog/color-search-tag-map.csv` | 2.039 | `1ad8a0017c9ec514dcb3935274c9de282e093321e6878e9dfcd4050f56c68ded` |
| `catalog/Radaelli_Catalogo_Master.xlsx` | 187.406 | `54ee362f950994d47a6015cb151345da962ca4ec7d6720f48321e4a43745bf29` |
| `collections/collections-master.csv` | 1.873 | `9b01ca6f577f958e8f33aab7579ccf61d1196e6289d4c1a3ff04a2e7e2c13fd3` |
| `import/shopify-products-03c.csv` | 32.167 | `42b05500ded688a247f38972c74042d798e3a5d9b26624c8a4c6b93cf5d32c1f` |
| `import/shopify-products-03c-images.csv` | 15.781 | `4358e5f210c4ee33d2f4c286fe14dc8e0493d578b07a80d9329747ca8825fbe8` |
| `import/image-resolution-fix.csv` | 16.536 | `cc3f5e3554bf5162feb51eb763e44a66f40d5b801780c282e0600d9f8ad3bfb3` |
| `import/color-mapping.csv` | 335 | `7657db5c9ebb602832c02c3c323d2b79149fce3a5822f4eaebb1784f73a286c0` |
| `import/image-dimensions.csv` | 12.619 | `4b94169f3553c438191e48eb8af4d2b7fc17d61e86073e116791b0baaf7cf118` |
| `source-of-truth/catalog-snapshot.json` | 56.864 | `5da8746a48713873e6dfb9b74c09bea2f92c3941ecb593699f6d915dd1edd2a7` |
| `source-of-truth/public-scrape-raw.json` | 27.696 | `2597dc35928600f9774613ac75d158e172eda520c7ec2083216707950911458d` |

## Redirecciones

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `seo/shopify-redirects-import.csv` | 2.504 | `ba3694678062c1f916166fb79e14640226aaa37b29cd4dc3ab183bc27818b1d6` |
| `seo/current-url-inventory.csv` | 14.250 | `a9f0918c830b0945e1c6f5bd250492a6d7d557e665c7bc2b38332d644f64ed05` |
| `seo/validate-redirects.mjs` | 31.097 | `ed8004b53caaab0c62b9a0f2385fa4a997f1a7b9c7f3e5a77b4a82127111bb20` |
| `seo/03E-redirect-plan.md` | 23.585 | `cbe7adb7024aecd4078ae6c445d6392e8b42adf999bb4efbe6bcb8c6a727ac1b` |

## Contenido legal (verbatim)

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `content/legal/manifest.json` | 2.291 | `2340814ed052419ff3ffb1fb481e7111820dcafdc9347f0232cbbc80ced18e55` |
| `content/legal/cookies.html` | 1.453 | `3627198196f15246b96a7c7e37a48cdf387941a413074622ec3c7bb7a96c2ede` |
| `content/legal/devoluciones.html` | 2.287 | `b2148c0d8209c095d904485bfdb684133d740a931733bee34784105978c5d4e8` |
| `content/legal/envios.html` | 3.134 | `86866583b965cfe4f364434ef6bf6c3c1d06275436d054bfbafce2f5d8c81921` |
| `content/legal/garantia.html` | 1.298 | `f2dba6c63d5ac9c3cb1fdcb83a5732794062b7a2fe1a6a40ca0b9d8cc2c82f99` |
| `content/legal/privacidad.html` | 1.730 | `55547916c254c32868f5426be393f3392452a94f3be7c8e0f5e1ee3d9632174a` |
| `content/legal/terminos.html` | 1.366 | `7719ebd5a916491c5b53a8eb48183848dd9ac6f2653e05634cca62e94d8a5a30` |

## Media

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `content/media/media-migration-manifest.csv` | 5.050 | `401f757040c9368e8ade5bd507d31890ad0d86e040fb1469f6f91fa7d16f87a9` |
| `content/media/03E-wiring-plan.md` | 33.778 | `fba2d51da8eb4d4647484a382f7748c61eb630743ab2a3bf16afdc708e262784` |
| `content/media/03F-media-owner-runbook.md` | 93.431 | `3fb65e6615f54117b519c79b832d54bfe3353f27e0c65cf48de9e5aacfb20e9f` |

## Scripts principales

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `scripts/build-theme-rc.mjs` | 6.263 | `a59b8432e54f32d8e2d5f0e9fa4426f175c5ee620100105df90c879dd6373792` |
| `scripts/apply-media-wiring.mjs` | 53.279 | `bff19a40f3dcea17cb627ffed5a9bd2a00c34c4e80d629371e70bede384975a1` |
| `scripts/prepare-media-package.mjs` | 29.983 | `b96f80bafdd4fabbaf0f3c1e31df25f481706a8dc9ab06ee9bad47dc1e4411ec` |
| `scripts/build-shopify-product-csv.mjs` | 10.353 | `5cc57aad151647ee8893b3abbd00a60b7c0d8c3bdd6ad0afb9c56964a696aa8a` |
| `scripts/build-shopify-image-fix-csv.mjs` | 6.992 | `e25d533c1ffaca610dc9e97e79424e60816096ce805fdca08716e92f95920aa0` |
| `scripts/build-color-search-tag-map.mjs` | 4.310 | `371cf5e929237ac355504c6d338dd561b5dccc0c6ef2b5c154076181531866a2` |
| `scripts/build-url-parity.mjs` | 4.803 | `36b47f5afb5f56a7a37e7cac8f3b80f2183baebf5fcac8f3b0a218de03aae229` |
| `scripts/audit-theme-limits.mjs` | 34.890 | `279aafe36202cff4408e530f4f50fedd65a48920e80fa8e4bf80912237739c8b` |
| `scripts/export-radaelli-catalog-for-shopify.mjs` | 11.524 | `67da183a72ff1db2a1457ef083fbd25ab0640b456e7d30262062d046ec2c7fb7` |
| `scripts/extract-legal-verbatim.cjs` | 3.868 | `f14b6cc96d074e314aeb6f10bb7cd7e8d0e2a613f8b4dc4735ac9f207871e90d` |
| `scripts/test/test-apply-media-wiring.mjs` | 29.268 | `0e9800beb681ebe747e7aee97cf3713f0c41acb1db9c928201bbe40c95a93495` |

## Esqueleto de analítica (apagado)

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `analytics/custom-pixel/README.md` | 10.317 | `6bb1d7e2e5b74227184686864d7d1009416fcb8146d2c1288b8f3728d383af0f` |
| `analytics/custom-pixel/event-map.js` | 36.238 | `ad217b90c713e9ba191570cd8a74f0709846ead5a774d6013dcb8f67786f30d0` |
| `analytics/custom-pixel/radaelli-pixel.js` | 45.780 | `32ddc43a608c07584479e6cbf556ac699aa029d6c9907d3b3371cc4c63695a4f` |

## Contenido del theme (theme-src desplegable)

- 96 archivos en los 7 directorios desplegables. Hash del conjunto (nombre + SHA-256 de cada archivo, orden alfabético): `4421391413038559042dd7f074c2139e24731f9857764d732ce48b6e717c2ba0`.
- Debe coincidir con el contenido del ZIP RC1.8 y con el theme remoto `189072474431` (comparación 96/96 hecha el 2026-09-29).
