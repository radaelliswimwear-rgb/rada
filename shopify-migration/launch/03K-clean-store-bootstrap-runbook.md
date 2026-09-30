# 03K — Procedimiento único de arranque de la tienda final (Colombia)

*Verificado por `launch/tools/03k-runbook-check.mjs` (15 pasos, 6 campos por paso, todo archivo citado existe). No inventa credenciales ni valores del negocio: lo que falta es un marcador `<...>` o un dato `PENDING_OWNER`.*

## 0. Lo que este documento es (y no es)

- **Es** el recorrido completo, en orden, para llevar el trabajo ya construido a una **tienda comercial limpia de Colombia**, con la herramienta o el comando de cada paso, la evidencia que lo prueba, el criterio de PASS y el rollback. Resume y ordena el plan largo de `launch/03G-commercial-store-migration-plan.md` (pasos S01–S17) usando los artefactos que existen hoy.
- **No es** una orden de ejecutar nada. La Development Store `radaelli-swimwear-dev` es un **sandbox de QA y construcción** (plan de desarrollo, no transferible): **no se convierte en la tienda final**. Todo lo marcado `FINAL-STORE ONLY` se hace en la tienda final, cuando la dueña la elija.
- **Quién** — *Dueña*: identidad, plan y facturación, OAuth, llaves, códigos, tarjetas de prueba, legales, DNS y publicación. *Claude*: el resto, con OK explícito por acción. Ni una llave, contraseña, código ni token pasa por un chat o un archivo.

**Artefactos que se reutilizan (no se reconstruye nada):**

| Artefacto | Valor |
|---|---|
| Theme final (RC1.10) | `dist/radaelli-shopify-theme-rc1.10.zip` — SHA-256 `1a40cb6c14163c852687a05c5741a079ed2ccd9bd316df218c0528c3c9034755`, 97 archivos, Theme Check 0/0, regresión 88/88, 12 mutantes nuevos detectados (66–77); manifiesto `dist/release-manifest-rc1.10.json` |
| Retorno (RC1.9) | `dist/radaelli-shopify-theme-rc1.9.zip` — SHA-256 `fa68a9a9e505b5dce9f8e128f28c6541903729b2a13c7bad6488c1070a06533c` |
| Catálogo | 29 productos / 98 variantes / 95 imágenes: `import/shopify-products-03c.csv` + segunda pasada `import/shopify-products-03c-images.csv` |
| Definiciones | `import/metafield-definitions.json` (9 metafields + 1 metaobjeto) |
| Legales | `content/legal/*.html` (6, texto verbatim del sitio actual) + `content/legal/owner-fields.json` (datos legales `PENDING_OWNER`) |
| Navegación y redirecciones | `content/navigation-final-store.json`; `seo/shopify-redirects-import-final-store.csv` (51 = 47 validadas + 4 legales) |
| Favoritos de cuenta | `app/` (156 pruebas, 20/20 mutantes) y `dist/radaelli-wishlist-app-0.1.2.zip` |
| Analítica | `analytics/custom-pixel/` (55 pruebas, apagado) y `analytics/03K-final-store-event-verification.md` |

---

## P01 — Crear o identificar la tienda correcta de Colombia (plan S01)

- **Quién:** Dueña (decisión, plan, facturación, entidad). Claude solo verifica lo que ella cree.
- **Herramienta:** Shopify Admin. Verificación de acceso: `npx shopify theme list --store <tienda-final> --json`.
- **Evidencia:** Configuración > General con la entidad comercial en Colombia, moneda COP y zona horaria de Bogotá; el handle `<tienda-final>` anotado por la dueña (sin datos personales en el repositorio).
- **Criterio PASS:** existe una tienda de Colombia que **no** es `radaelli-swimwear-dev`; el plan está elegido por escrito por la dueña; `theme list` responde con esa tienda.
- **Rollback:** cerrar o eliminar la tienda creada por error (solo la dueña); nada depende de ella todavía.
- **Estado:** `FINAL-STORE ONLY` · `BILLING/PLAN` · `OWNER DECISION` (decisión D6 del plan; bloquea todo lo demás).

## P02 — Base: idioma, moneda, zona de envío y mercado (plan S02)

- **Quién:** Dueña o Claude con OK (Admin). El cambio de entidad debe hacerse antes de configurar pagos (cambia la lista de proveedores y desactiva la pasarela de prueba; ver `theme/03J-owner-checkpoint-report.md`).
- **Herramienta:** Admin (español como idioma predeterminado desde el primer día, COP, sucursal, zona «Colombia» con los 33 departamentos **antes** de hacer a Colombia el mercado principal), luego `launch/tools/03i-post-a1-verify.js` (modo `G1` tras la zona, `AFTER` al final) y `launch/tools/03i-checkout-probe.js` + `node launch/tools/03i-checkout-text-check.mjs --expect after-a1`.
- **Evidencia:** veredicto `A1_UNLOCKED`; 29/29 productos y 98/98 variantes con país CO; `add.js` responde 200; el checkout se muestra en `es-co` con formato `$ 319.840,00`.
- **Criterio PASS:** los tres puntos anteriores, con la sesión de prueba en país CO (`Shopify.country = "CO"`).
- **Rollback:** `launch/03I-a1-preflight.md` y el runbook de envío § 12 (eliminar la zona o las tarifas nuevas); nada de esto es permanente si se sigue el orden.
- **Estado:** `FINAL-STORE ONLY` (herramientas listas y ya usadas en la Dev Store: `PREP_DONE`).

## P03 — Subir el theme final sin publicar (plan S03)

- **Quién:** Claude con OK.
- **Herramienta:** `npx shopify theme check --path theme-src` (0/0), extraer `dist/radaelli-shopify-theme-rc1.10.zip` a una carpeta `<zip-extraído>` y `npx shopify theme push --store <tienda-final> --unpublished --path <zip-extraído>`; después `npx shopify theme pull --store <tienda-final> --theme <id-theme> --path <carpeta-vacía>` y `node launch/tools/03k-theme-remote-parity.mjs <zip-extraído> <carpeta-vacía>`.
- **Evidencia:** SHA-256 del ZIP = el de la tabla de arriba; `theme list` muestra el theme como `unpublished`; salida de la paridad.
- **Criterio PASS:** `PARIDAD: PASS` (97/97 archivos: exactos o JSON semánticamente iguales) y el theme sigue sin publicar.
- **Rollback:** eliminar el theme no publicado; RC1.9 queda como retorno (`node launch/tools/03g-rollback-theme-diff.mjs`).
- **Estado:** `FINAL-STORE ONLY` (empaquetado, pruebas y paridad ya hechos en la Dev Store).

## P04 — Importar el catálogo 29/98/95 (plan S04, después de P05 parte A)

- **Quién:** Dueña (importar en el Admin) o Claude con OK. La decisión XL sigue pendiente (`import/xl-decision.json`): no se elimina ni se decide sola.
- **Herramienta:** antes, `node launch/tools/03k-catalog-package-check.mjs` (12 controles); Admin > Productos > Importar `import/shopify-products-03c.csv` (**desmarcar** «publicar en todos los canales»); segunda pasada con «Sobrescribir productos con handles coincidentes» `import/shopify-products-03c-images.csv` (43 fotos de más de 25 MP); después `node launch/tools/03g-product-parity.mjs` y `node launch/tools/03g-product-parity-verify.mjs`.
- **Evidencia:** 12/12 controles antes; después, paridad 29 productos, 98 (o 97 según D1) variantes y 95 imágenes, con 0 diferencias.
- **Criterio PASS:** conteos exactos, custom.color en los 29, ninguna imagen faltante, colecciones 10/12/7/0.
- **Rollback:** eliminar los productos importados (filtro por proveedor «Radaelli Swimwear»); aún no hay pedidos.
- **Estado:** `FINAL-STORE ONLY` · `OWNER DECISION` (D1, talla XL; D2, inventario).

## P05 — Colecciones, metafields y metaobjetos (plan S05, en dos partes)

- **Quién:** Claude con OK o dueña (Admin > Configuración > Metacampos y metaobjetos).
- **Herramienta:** parte A (**antes** de P04): crear las 9 definiciones y el metaobjeto de `import/metafield-definitions.json` y las 4 colecciones manuales (Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño); excluir el producto de la colección automática «Home page». Parte B (después de P04): `description_tone` por colección; portadas, videos y encuadres llegan con la media (P07).
- **Evidencia:** `node launch/tools/03k-catalog-package-check.mjs` control E11 (definiciones cubren lo que usa el theme); Admin con las 9 definiciones.
- **Criterio PASS:** E11 en PASS y las colecciones con 10 / 12 / 7 / 0 productos.
- **Rollback:** eliminar definiciones y colecciones (todavía sin datos ni pedidos).
- **Estado:** `FINAL-STORE ONLY`.

## P06 — Páginas legales, menús y redirecciones (plan S06)

- **Quién:** Dueña aprueba los textos legales y entrega los datos legales (`content/legal/owner-fields.json`); las páginas se crean en el Admin (un intento anterior de crearlas por automatización fue rechazado por el clasificador de permisos: no se reintenta por otra vía).
- **Herramienta:** páginas `/pages/privacidad`, `/pages/terminos`, `/pages/envios`, `/pages/cookies` y `/pages/garantia` desde `content/legal/*.html` (Reembolso es la política nativa `/policies/refund-policy`); menús desde `content/navigation-final-store.json`; redirecciones Admin > Navegación > Redirecciones > Importar `seo/shopify-redirects-import-final-store.csv` (51). Validar antes: `node launch/tools/03k-content-links-check.mjs` y `node seo/validate-redirects.mjs`.
- **Evidencia:** 9/9 controles de contenido; validador de redirecciones en PASS; hash por página igual al de `content/legal/manifest.json` (`theme/03F-legal-owner-runbook.md` § 11); `curl -I` de los 51 orígenes.
- **Criterio PASS:** 6 políticas con hash idéntico, 51 redirecciones activas con destino 200, ningún enlace roto en menús ni pie.
- **Rollback:** despublicar las páginas y eliminar las redirecciones importadas.
- **Estado:** `FINAL-STORE ONLY` · `LEGAL DATA` (razón social, NIT, dirección legal y fecha de publicación siguen `PENDING_OWNER`).

## P07 — Media: hero, categorías, banners, logo y favicon (plan S07)

- **Quién:** Dueña da el OK de descarga (12 archivos del Cloudinary propio, ~15,6 a 20,7 MB) y sube a Contenido > Archivos; Claude cablea.
- **Herramienta:** `node scripts/prepare-media-package.mjs` y, subidos los archivos, `node scripts/apply-media-wiring.mjs` (genera el RC siguiente: hay que repetir P03 con el RC nuevo); guía `content/media/03F-media-owner-runbook.md`.
- **Evidencia:** Home con media, colecciones con banner, sin imágenes rotas (`launch/tools/03k-surface-check.js`), hash del ZIP nuevo = remoto.
- **Criterio PASS:** `03k-surface-check.js` sin defectos y la imagen social (`social_share_image`) y el logo cargados: activan `og:image`, `twitter:image` y el logo del JSON-LD.
- **Rollback:** `node scripts/apply-media-wiring.mjs --restore=<snapshot>` y volver al ZIP anterior.
- **Estado:** `FINAL-STORE ONLY` · `OWNER AUTH/OAUTH` (OK de descarga).

## P08 — Favoritos de cuenta y app de favoritos (plan S09)

- **Quién:** Dueña, únicamente cuando lo autorice (cuenta de desarrolladora, distribución personalizada —irreversible—, instalación con permisos OAuth y elección del hosting del backend).
- **Herramienta:** `cd app && node --test test/` (156 pruebas) y `node test/mutants.mjs` (20/20); guía `app/OWNER-WORKFLOW.md`; paquete `dist/radaelli-wishlist-app-0.1.2.zip`; configuración externalizada en `app/.env.example` (solo nombres y marcadores).
- **Evidencia:** pruebas y mutantes en verde; con la app, una clienta de prueba agrega, quita y ve favoritos en `custom.wishlist`.
- **Criterio PASS:** E2E de cuenta en verde **o** decisión escrita de lanzar sin favoritos de cuenta: los favoritos de invitado (localStorage) funcionan sin la app y `wishlist_account_sync` queda apagado.
- **Rollback:** desinstalar la app; el metafield queda vacío y el theme lo ignora.
- **Estado:** `FINAL-STORE ONLY` · `OWNER AUTH/OAUTH` · no bloquea el lanzamiento.

## P09 — Envío: tarifa por debajo de $299.900 y envío gratis desde ese valor (plan S10)

- **Quién:** Dueña decide (tarifa fija en COP **o** cálculo en vivo de la mensajería) y contrata lo que corresponda; Claude carga y verifica.
- **Herramienta:** con la tienda y su plan ya elegidos: tarifa fija (Configuración > Envío y entrega, importe en COP entregado por la dueña) o tarifa calculada por transportadora/app (exige un plan de Shopify que la incluya, peso y medidas de los productos —hoy no existen— y la cuenta de la mensajería; una opción documentada es la app de Envia.com, `https://help.envia.com/en/shopify/`; en Colombia ese proveedor pide renombrar «Nombre de empresa» como «Nit/CC» en el checkout). El envío gratis desde `free_shipping_threshold` (299.900) se mantiene. Verificación: `launch/tools/03i-post-a1-verify.js` modo `AFTER`.
- **Evidencia:** carrito de una prenda con método de envío elegible en CO, y carrito de $299.900 o más con «Envío estándar gratis».
- **Criterio PASS:** ambos carritos con al menos un método elegible; el plazo de «3 a 5 días hábiles» solo se muestra si la mensajería lo respalda.
- **Rollback:** runbook de envío § 12: eliminar la tarifa nueva; el envío gratis desde $299.900 sigue funcionando.
- **Estado:** `FINAL-STORE ONLY` · `BILLING/PLAN` · `OWNER DECISION` (D2). No se contrata ni se instala nada en la Dev Store.

## P10 — Pagos: Wompi en modo prueba primero, producción solo con aprobación (plan S11)

- **Quién:** Dueña (login/OAuth de Wompi, llaves de prueba escritas por ella directamente en la pantalla oficial, tarjetas de prueba). Claude nunca lee, copia, guarda ni registra llaves, contraseñas o códigos.
- **Herramienta:** integración oficial de Wompi para Shopify (ruta y permisos en `payments/03E-wompi-shopify-feasibility.md` y `payments/03F-wompi-owner-runbook.md`; se re-verifica la pantalla vigente antes de aprobar), URL de eventos exactamente como indique la guía vigente; luego `node launch/tools/03i-checkout-text-check.mjs --expect after-b1-wompi` y `node launch/tools/03i-order-outcomes-check.mjs` (casos W1–W6).
- **Evidencia:** pedido de prueba pagado y sincronizado con Wompi; pago rechazado sin pedido; pago pendiente tratado como lo acepte la dueña por escrito (AC-06).
- **Criterio PASS:** `B1_E2E_VALIDATED` con Wompi en modo prueba y **un solo** proveedor activo (la pasarela de prueba de Shopify y Wompi no conviven).
- **Rollback:** desactivar Wompi en Configuración > Pagos y reactivar la pasarela de prueba; cancelar o reembolsar los pedidos de prueba.
- **Estado:** `FINAL-STORE ONLY` · `OWNER AUTH/OAUTH` (la tienda de desarrollo no lo ofrece: Wompi no aparece en su lista de proveedores externos, medido en 03J).

## P11 — Analítica (plan S12)

- **Quién:** Dueña conecta Google y Meta (OAuth y IDs); Claude verifica.
- **Herramienta:** plan `analytics/03E-analytics-plan.md`, runbook `analytics/03F-analytics-owner-runbook.md`, matriz de verificación `analytics/03K-final-store-event-verification.md`; el custom pixel de `analytics/custom-pixel/` queda **apagado** (`node --test analytics/custom-pixel/test/event-map.test.mjs`, 55 pruebas) salvo decisión contraria.
- **Evidencia:** los eventos de la matriz visibles en GA4 DebugView y en Meta Events Manager, con la tienda pública (con contraseña no registran).
- **Criterio PASS:** `view_item`, `add_to_cart`, `begin_checkout`, `purchase` y los eventos de favoritos y de cuenta de la matriz, sin doble disparo y respetando el consentimiento.
- **Rollback:** quitar las apps o el pixel (`analytics/03F-analytics-owner-runbook.md` § 16).
- **Estado:** `FINAL-STORE ONLY` · `OWNER AUTH/OAUTH`.

## P12 — E2E en la tienda final (plan S14)

- **Quién:** Claude ejecuta las mediciones; la dueña escribe las tarjetas de prueba y pulsa reembolsos.
- **Herramienta:** `launch/tools/03k-surface-check.js` (17 superficies × 320/390/768/1440 px), `launch/tools/03i-checkout-probe.js`, `node launch/tools/03i-checkout-text-check.mjs`, `node launch/tools/03i-order-outcomes-check.mjs`, `node launch/tools/03g-collection-parity-verify.mjs`, `node launch/tools/03g-home-parity-verify.mjs`.
- **Evidencia:** JSON de cada corrida (sin tokens ni datos personales) y la matriz de aceptación `launch/03G-launch-acceptance-checklist.md`.
- **Criterio PASS:** 0 desbordes, 0 imágenes rotas, 0 claves sin traducir, 1 `h1` por página, orden de encabezados correcto, 0 controles sin nombre; checkout con éxito, rechazo y falla; correo de confirmación recibido (`AC-08`, llegada a la bandeja: solo la dueña la confirma).
- **Rollback:** cancelar o reembolsar los pedidos de prueba.
- **Estado:** `FINAL-STORE ONLY`.

## P13 — Dominio: DNS y SSL (plan S15)

- **Quién:** Dueña (acceso al proveedor de DNS y ventana de corte). Irreversible en el sentido de que el sitio actual deja de recibir el tráfico.
- **Herramienta:** `launch/03G-cutover-runbook.md` (TTL bajo con antelación, registros de Shopify, comprobación de SSL) y `node launch/tools/03g-cutover-redirect-matrix.mjs`.
- **Evidencia:** dominio conectado y certificado SSL emitido en Configuración > Dominios; el sitio actual sigue respondiendo hasta el corte.
- **Criterio PASS:** SSL activo y el dominio resuelve a Shopify en la ventana acordada.
- **Rollback:** reapuntar el DNS al sitio actual (posible mientras el TTL sea bajo); `launch/03G-rollback-plan.md`.
- **Estado:** `FINAL CUTOVER` · `OWNER AUTH/OAUTH`.

## P14 — Publicar (plan S16)

- **Quién:** Dueña (publicar y quitar la contraseña); Claude verifica.
- **Herramienta:** congelar el RC final (`node launch/tools/03g-release-freeze.mjs`), publicar el theme, asignar la plantilla `page.wishlist` a Favoritos, activar las 51 redirecciones, quitar la contraseña; checklist `launch/03G-launch-acceptance-checklist.md`.
- **Evidencia:** todas las compuertas AC aprobadas o con decisión escrita; hash del theme publicado = hash del RC congelado.
- **Criterio PASS:** tienda pública con el theme del RC final, checkout con Wompi en el modo que la dueña haya aprobado y 0 regresiones en las superficies de P12.
- **Rollback:** republicar el theme anterior y devolver el DNS (`launch/03G-rollback-plan.md`).
- **Estado:** `FINAL CUTOVER` · `OWNER AUTH/OAUTH`.

## P15 — Monitoreo de las primeras 24 h (plan S17)

- **Quién:** Claude mide; la dueña decide qué hacer con cada alerta.
- **Herramienta:** `launch/03G-post-launch-monitoring.md` (puntos T+15 min, T+1 h, T+4 h y T+24 h y las decisiones D-MO1–D-MO7), `node launch/tools/03g-monitoring-404-baseline.mjs` y `node launch/tools/03h-verify-plan-monitoring.mjs`.
- **Evidencia:** conteo de 404 frente a la línea base, pedidos y pagos reales del período, eventos de analítica.
- **Criterio PASS:** sin 404 nuevos en URLs migradas, pagos y pedidos coherentes, y ninguna decisión D-MO abierta.
- **Rollback:** `launch/03G-rollback-plan.md` (RP-01 a RP-45).
- **Estado:** `FINAL CUTOVER`.

---

## Orden real de ejecución (camino crítico)

`P01 → P02 → P05(A) → P04 → P05(B) → P06 → P09 → P10 → P12 → P13 → P14 → P15`, con `P03`, `P07`, `P08` y `P11` corriendo en paralelo cuando sus dependencias estén listas. `P08` no bloquea el lanzamiento.

---

## 03L — Implementación ejecutable de P01 a P07 en la tienda de lanzamiento

Estado real: la tienda de lanzamiento existe (Client Transfer Store de Colombia) y los pasos P02 a P07 ya se ejecutaron en ella, salvo lo que exige a la dueña. Las olas están en `launch/tools/03l-migrate.mjs` (Admin GraphQL con `shopify store execute`; idempotentes; `--dry` no escribe):

| Paso | Ola |
|---|---|
| P05 parte A (definiciones) | `defs` |
| P05 (colecciones) | `collections`, `membership`, `publish` |
| P04 (catálogo 29/98/95) | `products` |
| P06 (páginas, políticas, menús, redirecciones) | `pages`, `policies`, `menus`, `redirects` |
| Verificación contra el paquete | `parity` (8 controles Q1–Q8) y `verify` |

Evidencia medida: `launch/evidence/03L-migration-summary.json` y `theme/03L-colombia-client-transfer-migration-report.md`. Autorización: la dueña aprueba una vez el acceso del CLI a la tienda (`shopify store auth`); el token lo guarda el CLI y nunca pasa por un chat ni por un archivo.
