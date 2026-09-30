# 03F — Pasada de eficiencia (Sonnet) · redirects · rendimiento · preparación de bloqueos de la dueña

- **Fecha:** 2026-09-29, 14:33 → 15:07 (Bogotá).
- **Tienda:** Development Store `radaelli-swimwear-dev`. Theme Radaelli (`189072474431`) **sin publicar**; Horizon (`189072113983`) live y sin tocar.
- **Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`).
- **Método:**
  - trabajo en vivo en la Dev Store (redirects, revisión de SEO, favoritos);
  - 5 agentes de escritorio en paralelo que redactaron runbooks y endurecieron scripts, y cuyo trabajo verifiqué yo (hashes, tests y dry-run re-ejecutados);
  - correcciones del theme con tests y mutantes.
- **Regla de la dueña respetada:** Daniela está en casa pero ocupada. **No se le pidió ninguna acción owner-only.** Todo lo que requiere su login, OAuth, instalación de apps, aprobación legal, descarga de media, decisión de tarifas, pagos, analítica, facturación o identidad del negocio quedó consolidado en **un solo archivo** (`theme/03F-owner-actions-minimal.md`) que se le presenta solo cuando diga que está lista.

## Resumen ejecutivo

1. **Redirects: 47/47 importados y probados en la Dev Store** (antes: 0). 38 destinos exactos responden 200 y las 9 rutas `/cuenta*` redirigen igual que `/account`. Sensibilidad a mayúsculas, query y barra final verificadas. El código 301 exacto es NOT_VERIFIED (el navegador no lo expone).
2. **Rendimiento real: parcial y con límite claro.** LCP, FCP y CLS **no se pueden medir** porque la ventana de Chrome está oculta (no se le roba el foco a la dueña ni se extraen tokens de vista previa). En su lugar hice una auditoría determinista de `srcset`/`sizes` a 390 px @3x y a 1280 px @1x: **0 imágenes sobredimensionadas** (máximo 1,34×; umbral 1,6×), 0 subdimensionadas, primera fila eager, secundaria lazy, ficha con `fetchpriority=high`, **0 desbordes horizontales**.
3. **Checkout móvil (390 px): NO MEDIBLE** por la misma razón (más: el checkout no se puede incrustar en un iframe y para Colombia el catálogo sigue agotado por C2). Quedaron documentados los 2 minutos de pasos de cierre.
4. **Ocho runbooks para los bloqueos de la dueña**, escritos por agentes y revisados (mercado/país, envío, Wompi, Search & Discovery, media, legales, analítica, app de favoritos), más el archivo mínimo unificado. Los agentes destaparon **11 hallazgos que corrigen supuestos de 03E** (sección A).
5. **Theme RC1.7** (dos correcciones mínimas: `noindex` también en Favoritos por handle; enlace a Garantía en el acordeón de la ficha). Regresión **70/70**, **mutantes 49–50 detectados**, Theme Check **0/0**, remoto = ZIP 96/96.
6. **App de favoritos 0.1.2** (solo documentación; 6 correcciones de docs). **156/156 tests, 20/20 mutantes**, ZIP determinista (mismo hash en 2 empaquetados). Sigue sin instalar (owner).
7. **Script de cableado de media endurecido** (dry-run por defecto, escritura atómica todo-o-nada, respaldo con `--restore`): **68/68** chequeos con mapas FALSOS sobre copias temporales; `theme-src` no se alteró.
8. **Bloqueo crítico único:** A1 (zona de envío de Colombia y luego mercado principal). Mientras no exista, el catálogo se ve agotado para Colombia y no se puede probar checkout ni Wompi.

## Los 34 puntos

| # | Punto | Resultado |
|---|---|---|
| 1 | Modelo | **Sonnet 5.5** (`claude-sonnet-5-5`) |
| 2 | Tiempo | 14:33 → 15:07 (Bogotá), ≈ 34 min de reloj |
| 3 | Uso | Total de la sesión: UNAVAILABLE. Agentes de escritorio (tokens reportados por cada uno): Wompi + Search & Discovery ~248 k, mercado + envío ~264 k, legales + analítica ~328 k, app de favoritos ~264 k, media ~479 k → **≈ 1,58 M**. Trabajo propio (redirects, SEO, RC1.6/1.7, app 0.1.2, reporte): no medido por separado |
| 4 | Redirects importados | **47/47** en la Dev Store (lista previa: 0). Vía Admin > Contenido > Menús > "Redireccionamientos de URL" (`/content/redirects`), CSV `seo/shopify-redirects-import.csv`. `seo/03F-redirect-import-result.md` |
| 5 | QA de redirects | **38** destinos exactos → 200. **9** `/cuenta*` → redirigen igual que `/account` (control `/cuenta-inexistente-xyz` → 404). Sin distinción de mayúsculas; conserva query; acepta barra final. Código 301 exacto: NOT_VERIFIED. Rollback: borrar todos desde la lista del Admin |
| 6 | Rendimiento móvil (390) | LCP/FCP/CLS **NOT MEASURABLE** (ventana oculta, sin entradas de paint). Auditoría determinista @3x: máximo 1,34× (umbral 1,6×), 0 sobre/sub-dimensionadas, primera fila eager, secundaria lazy, ficha eager + `fetchpriority=high`, Home con 0 imágenes sobre el pliegue, 0 desborde horizontal. `theme/03F-performance-final.md` |
| 7 | Rendimiento desktop (1280) | Igual criterio, @1x: mismas conclusiones, 0 desborde. Sin métricas de paint por la misma razón |
| 8 | Baseline de checkout móvil | **NOT MEASURABLE** (ventana oculta no redimensionable; checkout no incrustable; C2 agotado). Recapitula resultados de escritorio de 03E y deja 2 minutos de pasos de cierre. `theme/03F-mobile-checkout-baseline.md` |
| 9 | Runbook de mercado/país (C1) | **Listo.** `theme/03F-owner-market-colombia-runbook.md` (493 líneas). Corrige el orden: **zona de envío primero, luego mercado principal** |
| 10 | Runbook de envío (C2) | **Listo.** `shipping/03F-owner-shipping-runbook.md` (459). No inventa la tarifa bajo el umbral (decisión D2 de la dueña) |
| 11 | Runbook de Wompi | **Listo.** `payments/03F-wompi-owner-runbook.md` (441). Compuertas G1/G2, ruta Shopify Payments-test alternativa, comisión, estados |
| 12 | Runbook de Search & Discovery | **Listo.** `theme/03F-search-discovery-owner-runbook.md` (373). Talla, Color y Precio; sin Disponibilidad; matriz de QA |
| 13 | Runbook de media | **Listo.** `content/media/03F-media-owner-runbook.md` (1183 líneas). 12 descargas + 1 copia local, ~20,7 MB, M13 con transformación a 3333×5000 (~2,96 MB) |
| 14 | Script de cableado endurecido | **SÍ.** `scripts/apply-media-wiring.mjs`: dry-run por defecto, todo-o-nada, respaldo + `--restore`, validación de duplicados / formatos / archivos faltantes. `scripts/test/test-apply-media-wiring.mjs`: **68/68**, mapas FALSOS sobre copias temporales; re-ejecutado por mí (pasa) y `theme-src` sin cambios (RC1.7 se reconstruye con el mismo hash) |
| 15 | Runbook legal | **Listo.** `theme/03F-legal-owner-runbook.md` (419). 4 páginas pendientes verbatim (sin reescribir); razón social, NIT y dirección NOT_AVAILABLE |
| 16 | Runbook de analítica | **Listo.** `analytics/03F-analytics-owner-runbook.md` (483). Píxel custom **apagado**; GA4 y Meta por apps oficiales |
| 17 | Runbook del owner de favoritos | **Listo.** `theme/03F-owner-wishlist-install-runbook.md` (472). Cuenta de desarrolladora, distribución custom (irreversible), backend, pruebas |
| 18 | Tests de la app | **156/156** |
| 19 | Mutantes de la app | **20/20** detectados |
| 20 | Paquete y hash de la app | **0.1.2** `dist/radaelli-wishlist-app-0.1.2.zip`, SHA-256 `19c8c0df68a30533b6e3b953729d525afd784a4518e2dbb6691bc8ddc919e4b2`, 35 entradas, 253.247 bytes, idéntico en 2 empaquetados, 0 `.env`, 0 secretos. Histórico: 0.1.1 `f14f068a…1de8`, 0.1.0 `559c346a…296a` |
| 21 | Theme Check | **0 errores / 0 warnings** (theme-src y ZIP extraído) |
| 22 | Regresión del theme | Arnés offline **70/70** (Liquid real con liquidjs). **Mutantes 49–50 detectados** (49: sin `noindex` por handle en Favoritos; 50: sin `warranty_url`). Acumulado de mutantes de theme desde 03D: 11–50, todos detectados |
| 23 | Paquete y hash del theme | **RC1.7** `dist/radaelli-shopify-theme-rc1.7.zip`, SHA-256 `5bea536f102a80fd206de797b0c59dff4687558e75232d5833f541709cdc4b0b`, 173.398 bytes, 96 archivos, **determinista** (reconstruido de nuevo al cierre: mismo hash). Remoto = ZIP 96/96 |
| 24 | Validación SEO final | **Hecha.** 29/29 productos (canonical, hreflang x-default/es/en, JSON-LD ProductGroup + BreadcrumbList), colecciones, sitemap (29 productos, 9 sitemaps hijos), `noindex` en búsqueda, Favoritos (simple y `?view=wishlist`) y 404. Hallazgos abiertos para la dueña en `seo/03F-seo-final-validation.md` (limpieza del sitemap, meta description de la Home) |
| 25 | Lote mínimo de la dueña | **`theme/03F-owner-actions-minimal.md`** (reemplaza a `03E-owner-actions-one-shot.md`): A (desbloqueo de la Dev Store) A1–A5, B (antes de lanzar) B1–B4, C (opcional) C1–C5. **No se le presenta hasta que diga que está lista** |
| 26 | Bloqueos críticos de la dueña | **A1** (zona Colombia + tarifa + mercado principal; 55–95 min) es el único que desbloquea todo lo demás. Después: A2 código de login (2 min), A3 Search & Discovery (~5 min), A4 OK de media (1 min), A5 app de favoritos (90–120 min). Antes del lanzamiento: Wompi, legales + identidad del negocio, analítica, publicación |
| 27 | Catálogo 29/98/95 | **SÍ** (29 productos, 98 variantes, 95 imágenes), verificado a las 14:52; no hubo escrituras de catálogo desde entonces. Único tag: `MOSTAZA` |
| 28 | Horizon sin tocar | **SÍ** (`theme list` a las 15:05: `189072113983 [live] Horizon`) |
| 29 | Radaelli sin publicar | **SÍ** (`189072474431 [unpublished] Radaelli RC1`) |
| 30 | Pagos activados | **NO** |
| 31 | Producción / Staging / main tocados | **NO** (tampoco Vercel, Neon, Wompi, DNS, tienda comercial, merge ni PR) |
| 32 | Bloqueos para 03G | Todo lo independiente de la dueña quedó hecho. Lo restante: (a) **owner-only** (lote mínimo A1–A5, B1–B4); (b) **necesita ventana visible** (LCP/FCP/CLS reales y checkout a 390 px); (c) **depende de A1** (probar catálogo y checkout en Colombia, encender `free_shipping_rate_confirmed`) |
| 33 | READY FOR 03G | **SÍ.** ChatGPT decide si 03G espera el lote de la dueña o si conviene una fase corta de verificación con ventana visible |
| 34 | CERO TAREAS DE SEGUNDO PLANO ACTIVAS | **CERO TAREAS DE SEGUNDO PLANO ACTIVAS.** Servidores del arnés y de rendimiento detenidos, vista previa detenida, los 5 agentes terminaron; sin procesos `node`; los puertos en escucha son de Windows y AnyDesk, no míos. Las únicas esperas que se abren son las verificaciones finitas del handoff (+1 / +2 / +5 min) |

## A. Hallazgos de los agentes que cambian conclusiones o supuestos previos

Verificados por los agentes contra documentación oficial y por mí contra el repo; los que no pude confirmar en vivo están marcados.

1. **Orden de C1/C2 (corrige 03E § 5.3, que ponía "Mercados" antes de "Zona Colombia").** Hay que crear **primero la zona de envío de Colombia** y **después** convertir a Colombia en mercado principal. Con Colombia como país por defecto y sin zona de envío, los 29 productos figuran **agotados** para todos los visitantes (medido en 03E). Respaldo en la documentación oficial de Shopify citada en el runbook: los mercados solo se activan para países con tarifas de envío.
2. **PSE no tiene estado "pendiente" en el sandbox de Wompi.** El flujo de pago pendiente no se puede probar ahí; hay que decidirlo por lectura de documentación (NOT_VERIFIED en vivo).
3. **Base de la comisión de Shopify por proveedor externo:** (productos − descuentos) + impuestos + envío, no solo productos.
4. **Wompi carga primero credenciales de producción** en su documentación (compuerta G2). Las llaves de prueba las escribe la dueña; Claude nunca las ve.
5. **La pasarela de prueba de Shopify** sirve en la Dev Store pero **no coexiste** con un proveedor de tarjeta activo.
6. **Analítica en la Dev Store:** no se puede probar GA4 ni Meta mientras la tienda esté protegida con contraseña.
7. **Política de cookies:** el texto "Hoy no las usamos" puede ser inexacto con las cookies propias de Shopify. No se reescribe (regla de la dueña); queda marcado como **decisión legal**.
8. **Google & YouTube documenta 11 eventos**; `GA4_EXTRA_STANDARD_EVENTS` debe quedar vacío para no duplicar.
9. **`warranty_url` y `shipping_url`** son necesarios cuando el bloque de la ficha enlaza páginas. → RC1.7 (ver § B).
10. **Media:** solo **M13** excede los límites (4672×7008; con `c_limit,w_5000,h_5000,q_95` queda en 3333×5000 y 2.964.788 bytes). **4 videos son HEVC** (M08 es vertical `.mov` 1080×1920); las variantes servidas por el sitio son H.264, así que se recomienda subir la variante servida. Que Shopify acepte HEVC es NOT_VERIFIED. Red estimada 15,6 MB con videos servidos frente a 23,6 MB con originales.
11. **`collection-banner.liquid` con `.value`:** confirmado en el remoto (RC1.7).

## B. Cambios del theme en 03F (RC1.6 y RC1.7)

| Versión | Cambio | Archivo | Prueba |
|---|---|---|---|
| RC1.6 | `noindex` también cuando la página es Favoritos por **handle** (`page.handle == 'favoritos'`), no solo por sufijo de plantilla: hoy la página vive como página normal hasta que se asigne `page.wishlist` | `layout/theme.liquid` | Mutante 49; en vivo: Favoritos simple y `?view=wishlist` con `noindex` |
| RC1.7 | Enlace a `/pages/garantia` en el acordeón "Envíos, devoluciones y garantía" de la ficha (antes solo se veía el de devoluciones) | `templates/product.json` (`warranty_url`) | Mutante 50; en vivo: el acordeón muestra "Política de devoluciones" y "Política de garantía" |

- **Orden de push:** primero archivos de código, luego JSON de plantilla (Shopify descarta en silencio los settings nuevos si el código aún no los declara). Verificado con `pull` + comparación.
- **RC1.6** `3e3a1283…e694`. **RC1.7** `5bea536f…4b0b` (vigente). Manifiestos en `dist/release-manifest-rc1.{3,4,5,6}.json`.
- `theme-src/README.md` actualizado a RC1.7.

## C. App de favoritos 0.1.2 (solo documentación)

- Código sin cambios respecto de 0.1.1 (SEC-05 ya corregido en 03E).
- Correcciones de documentación: título y versiones del README, cantidad de errores ("20"), `OWNER-WORKFLOW.md` (versión 0.1.2, sin auto-hash, grupo de ajustes "Wishlist"), comentario de `shopify.app.toml` (0.1.x).
- Recheck de agente: `node --check` 26/26, sintaxis JSX con TypeScript 5.8.2 (0 diagnósticos), coherencia de configuración PASS.
- Los runbooks de 03F viven en `theme/`, **no** en `app/`, para que el ZIP siga siendo reproducible (un documento no puede contener el hash de su propio ZIP).

## D. Verificación al cierre

| Invariante | Resultado |
|---|---|
| Horizon | `189072113983 [live]`, sin tocar |
| Radaelli RC1 | `189072474431 [unpublished]`; remoto = ZIP RC1.7 (96/96) |
| Catálogo | 29 / 98 / 95 (14:52) |
| País de la sesión | restaurado a EE. UU.; carrito vacío (pruebas con CO revertidas) |
| Pagos, Wompi, apps, OAuth, facturación | nada activado ni instalado |
| Escaneo de secretos / PII | 0 en `theme-src`, app, docs 03F y ZIP; sin teléfonos ni correos en los reportes |
| Píxel custom | apagado (`ENABLED:false`, IDs vacíos) |

## E. Qué no se hizo y por qué

- **LCP / FCP / CLS reales y checkout a 390 px:** la ventana de Chrome está oculta y no se le roba el foco a la dueña; el checkout no es incrustable. Alternativas descartadas por seguridad: navegador sin interfaz, servidor local (Chrome 154 bloquea `fetch` a localhost desde https) y enlaces de vista previa compartibles (requieren extraer un token).
- **Instalar o configurar apps, activar pagos, subir media, crear las 4 páginas legales, decidir tarifas:** owner-only (OAuth, aprobación, decisión de negocio). El clasificador de permisos ya negó las 4 páginas legales en 03D; no se reintenta por otra vía.
- **Código 301 exacto de los redirects:** no expuesto por el navegador (NOT_VERIFIED).

## F. Documentos de 03F

`seo/03F-redirect-import-result.md`, `seo/03F-seo-final-validation.md`, `theme/03F-performance-final.md`, `theme/03F-mobile-checkout-baseline.md`, `theme/03F-owner-actions-minimal.md`, `theme/03F-app-recheck-results.md`, `theme/03F-owner-market-colombia-runbook.md`, `shipping/03F-owner-shipping-runbook.md`, `payments/03F-wompi-owner-runbook.md`, `theme/03F-search-discovery-owner-runbook.md`, `theme/03F-owner-wishlist-install-runbook.md`, `theme/03F-legal-owner-runbook.md`, `analytics/03F-analytics-owner-runbook.md`, `content/media/03F-media-owner-runbook.md`, `scripts/apply-media-wiring.mjs` + `scripts/test/test-apply-media-wiring.mjs`, `dist/radaelli-shopify-theme-rc1.7.zip`, `dist/radaelli-wishlist-app-0.1.2.zip`.
