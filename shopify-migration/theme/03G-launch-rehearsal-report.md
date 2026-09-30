# 03G — Ensayo de lanzamiento, paridad y paquete de migración a la tienda comercial

- **Fecha:** 2026-09-29, 17:21 → 18:52 (Bogotá), pausa por límite de uso de 5 h 58 min, y cierre el 2026-09-30, 00:50 → 00:54.
- **Tienda:** Development Store `radaelli-swimwear-dev`. Theme Radaelli (`189072474431`) **sin publicar**; Horizon (`189072113983`) live y sin tocar.
- **Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`).
- **Método:**
  - capturas de solo lectura de la Dev Store (storefront y Admin) y rastreo GET del sitio actual (70 URLs);
  - análisis con scripts deterministas y offline guardados en `launch/tools/`;
  - 2 workflows de agentes con verificación adversarial (paridad y paquete de lanzamiento);
  - un defecto real del theme corregido con prueba y mutante (RC1.8).
- **Regla de la dueña respetada:** Daniela sigue ocupada. **No se le pidió ninguna acción.** Todo lo owner-only quedó diferido en `theme/03F-owner-actions-minimal.md`, que **no se le presenta** hasta que diga que está lista.
- **Cierre de alcance (instrucción de hoy):** desde la pausa no se abrieron subagentes ni workflows nuevos; los 7 arreglos de theme que quedan son para 03H y **no se implementaron**.

## Resumen ejecutivo

1. **Si el lanzamiento fuera hoy: NO-GO.** Checklist de aceptación de 35 gates: 3 `PASS`, 10 `BLOCKED`, 15 `PENDING OWNER`, 7 `NOT YET EXECUTED` (`launch/03G-launch-acceptance-checklist.md`). Todo lo bloqueado sale de dos acciones de la dueña, en este orden: **A1** (zona de envío y mercado Colombia) y **B1** (pago).
2. **Defecto real corregido: RC1.8.** La miga de pan, el enlace "Volver a…" y el JSON-LD `BreadcrumbList` de la ficha usaban `product.collections.first`, cuyo orden Shopify no garantiza: 4 fichas de Espuma de Ola mostraban "Destacados". Ahora usan la colección de categoría del producto, como el sitio actual. Un solo archivo (`sections/main-product.liquid`); remoto = ZIP 96/96; re-medido en vivo.
3. **La paridad de datos es alta y sus diferencias son concretas.** Los 29 productos coinciden en título, colección, SKU, precio, orden de imágenes y descripción (29/29). Diferencias reales: la talla **XL de `alba-dorada-cafe-claro`** existe en Dev y ya no en el sitio actual (98 contra 97 variantes); el **orden por defecto** de las colecciones es distinto (0 de 29 posiciones iguales); el **inventario** no se rastrea; falta el **selector COP/USD** del encabezado.
4. **Bloqueo de cutover que el sitio actual ya tiene y la Dev no:** `/envios`, `/terminos`, `/privacidad` y `/cookies` responden 200, están en el sitemap y enlazadas desde el pie, pero en Dev dan 404 y no están entre las 47 redirecciones (B2 de la dueña).
5. **Lo más riesgoso para lanzar está fuera del catálogo** (`launch/03G-reproducibility-gap-audit.md`, 17 brechas): los datos de clientas, pedidos, cupones y newsletter no tienen ningún artefacto de migración; no hay fuente de inventario; y **`shopify-migration/` no está versionado** (`?? shopify-migration/`).
6. **Barrido responsive por DOM: 136/136 limpio** (8 anchos × 17 superficies). La ventana de Chrome sigue oculta: LCP/FCP/CLS reales y checkout a 390 px no se midieron.
7. **Paquete completo:** línea base del sitio actual, paridad de rutas / productos / colecciones / Home, plan Dev → tienda comercial (S01–S17), runbook de cutover, plan de rollback, checklist de aceptación, monitoreo de 24 h, snapshot de la Dev Store, auditoría de reproducibilidad y congelamiento de RC1.8.

## Los 33 puntos

| # | Punto | Resultado |
|---|---|---|
| 1 | Modelo | **Sonnet 5.5** (`claude-sonnet-5-5`) |
| 2 | Tiempo | 2026-09-29 17:21 → 18:52 (≈ 1 h 31 min de trabajo) + pausa por límite de uso de 5 h 58 min + cierre 2026-09-30 00:50 → 00:54 (≈ 95 min) |
| 3 | Uso | Total de la sesión: UNAVAILABLE. Subagentes (tokens que reportó cada workflow): paridad **4,03 M** (10 agentes, 1.494 usos de herramientas, 57 min); paquete de lanzamiento **5,06 M** (10 agentes, 1.496 usos, 58 min; 2 verificadores —plan y monitoreo— cortados por el límite de uso); checklist de aceptación **0,51 M** (1 agente, 70 usos; cortado por el límite al final, pero el documento ya estaba escrito y luego lo verifiqué con su script) → **≈ 9,6 M**. Mi trabajo directo no se mide por separado |
| 4 | Línea base del sitio actual | **Hecha.** `launch/03G-current-site-baseline.md` (594 líneas): rastreo de 70 URLs (54 con 200, 16 con 404, 0 redirecciones; 52 páginas medidas). 20 hallazgos: 1 BLOCKER, 2 DEFECT, 8 DIFFERENCE, 9 NOTE. Destacan: las 4 legales indexables sin destino en Dev; el contador "N vistas" que muestra 6 × las vistas reales en 29/29; el filtro de precio del sitio actual que no segmenta; el blog con contenido de otra marca |
| 5 | Paridad de rutas | **101 filas** (`launch/03G-route-parity.csv`, cabecera exacta): `PASS` 1 · `PASS_WITH_INTENTIONAL_CHANGE` 42 · `BLOCKED_BY_OWNER` 33 · `MISSING` 5 · `NOT_APPLICABLE` 20. `visual_parity` nunca es `MATCH` (no se midió lo visual). Validador: 108 controles OK, 0 fallas. 17 hallazgos (2 BLOCKER, 5 DEFECT, 6 DIFFERENCE, 4 NOTE) |
| 6 | Paridad de productos 29/29 | **29/29 reconciliados a nivel de registro:** 13 `RECONCILED` + 15 `RECONCILED_WITH_INTENTIONAL_DIFFERENCE` + **1 `DIFFERENCE`** (talla XL de `alba-dorada-cafe-claro`). El estado final de los 29 es `DIFFERENCE` porque hay dos diferencias abiertas para todos y sin decidir: posición en el orden por defecto e inventario. Totales Dev **29 / 98 / 95**; sitio actual 29 / **97** / 95. Título, colección, SKU, precio (= 80 % del anterior, sin doble descuento), orden de imágenes y descripción: 29/29. Verificador independiente: 0 problemas |
| 7 | Paridad de colecciones | Membresía **igual en las 6** (Oasis 10, Aurora 12, Espuma 7, Salidas 0, Destacados 7, Home page 0). **Orden por defecto distinto** en las 3 con productos (0 de 29 posiciones iguales); "Destacados": mismo conjunto de 7, otro orden. Banners sin imagen (media pendiente A4). Filtros: Dev solo Precio; el sitio actual Talla, Color y Precio (dependencia A3). Ordenar: 9 opciones frente a 3. 29/29 tarjetas iguales. Verificador: 0 fallas |
| 8 | Paridad de la Home | **39 filas:** `matched` 12 · `sourced-but-owner-upload-pending` 3 · `editorial-pending` 8 · `intentionally-hidden` 3 · `DIFFERENCE` 13. 23 hallazgos (1 BLOCKER: el nombre "Radaelli Swimwear Dev" visible; 2 DEFECT; 14 DIFFERENCE; 6 NOTE). `theme/03G-home-parity.md` |
| 9 | Barrido responsive | **136/136 limpio** (320, 375, 390, 430, 768, 1024, 1280, 1440 × Home, 4 colecciones, Destacados, 5 fichas, búsqueda, carrito, Favoritos, Garantía, Reembolso, Password): 0 desbordes, 0 imágenes rotas, 0 claves sin traducir, 0 textos de EE. UU./USD, 1 h1 por página. Medición por DOM/layout (ventana oculta): sin paint. Hallazgo H-01: contraste bajo (≈ 2,9:1) en la tarjeta de categoría **sin imagen** ("Salidas de Baño"). `launch/03G-responsive-sweep.md` |
| 10 | Precondiciones de checkout | **Auditadas sin ejecutar A1 y sin crear pedidos.** Con país US: `add.js` 200 y checkout en `es-us` con "Esta tienda no puede aceptar pagos en este momento". Con país CO: 3/3 variantes agotadas, `add.js` 422, "Producto agotado". Restaurado país US y carrito vacío. **0 rutas legacy de Wompi** ni del checkout antiguo en el theme. `launch/03G-checkout-precondition-audit.md` |
| 11 | Snapshot de la Dev Store | **Hecho, sin secretos:** `launch/03G-dev-store-snapshot.json` (themes, idiomas, moneda, mercados, envíos, pagos, cuentas, catálogo, colecciones, páginas, menús, 47 redirecciones, apps, definiciones de metacampos y metaobjetos, flags del theme). Límite: los ajustes de pantalla de pago no cargaron en la ventana oculta (NOT_VERIFIED) |
| 12 | Release freeze | **RC1.8 congelado** (`launch/03G-release-freeze.md`, 2026-09-30 00:52): SHA-256 de 50 archivos (theme, app, catálogo, redirecciones, legales, media, scripts, analítica) y del conjunto de `theme-src` (96 archivos); 0 archivos faltantes |
| 13 | Plan Dev → tienda comercial | **Hecho.** `launch/03G-commercial-store-migration-plan.md` (1.072 líneas): 17 pasos S01–S17 con sus 8 campos, 20 decisiones (D1–D20), 34 lecciones de la Dev Store y 15 marcas de irreversible. Controlado por script: 15/15. Su verificador adversarial no llegó a correr (límite de uso): la comprobación fue por script y por búsqueda de datos inventados (sin planes de Shopify, precios, TTL ni proveedores de DNS) |
| 14 | Brechas de reproducibilidad | **17 brechas** (3 críticas, 6 altas, 7 medias, 1 baja): **no se puede reconstruir hoy una tienda equivalente a la Dev.** Sí se reconstruyen byte a byte el catálogo y su CSV, el ZIP del theme, el ZIP de la app, las 47 redirecciones y los legales. Críticas: G01 datos de clientas, pedidos, cupones y newsletter sin artefacto ni decisión; G02 inventario sin fuente; G03 el repo no está versionado. Verificada por un verificador adversarial (14 correcciones; 8 datos sin fuente quitados). `launch/03G-reproducibility-gap-audit.md` |
| 15 | Runbook de cutover | **Hecho** (`launch/03G-cutover-runbook.md`, 639 líneas): T-24h, T-4h, T-1h, T-15m, T0, T+15m, T+1h, T+24h con acciones CT-##, criterio pasa/no pasa y GO/NO-GO; DNS, proveedor y TTL: `NOT_AVAILABLE`. Verificado por un verificador adversarial (13 correcciones; 8 datos sin fuente quitados). **No se ejecutó** |
| 16 | Plan de rollback | **Hecho** (`launch/03G-rollback-plan.md`, 675 líneas): theme, DNS, pagos, envíos, apps, redirecciones, retorno al sitio actual, pedidos y datos de cuenta/favoritos; lo irreversible marcado. Verificado por un verificador adversarial (14 correcciones; 11 datos sin fuente quitados). **No se ejecutó** |
| 17 | Checklist de aceptación | **Hecho:** 35 gates (los 25 pedidos + 10 añadidos): **`PASS` 3 (AC-02, AC-11, AC-27) · `BLOCKED` 10 · `PENDING OWNER` 15 · `NOT YET EXECUTED` 7.** Veredicto: NO-GO hoy. Su verificador por script: 33/33 controles OK (corregí una fila residual, AC-02, que decía `BLOCKED` con evidencia de `PASS`) |
| 18 | Monitoreo post-lanzamiento | **Hecho** (`launch/03G-post-launch-monitoring.md`): 12 áreas (MO-00 a MO-11), 52 chequeos, puntos T+15m / T+1h / T+4h / T+24h. **Sin KPIs ni metas de negocio inventadas** (solo "cualquier ocurrencia" y comparaciones relativas; los umbrales de rollback son decisión de la dueña). Agrega T+4h, que el cutover no tenía. Su verificador adversarial no llegó a correr; la revisión fue por búsqueda de cifras y datos sin fuente |
| 19 | Lote de la dueña cambiado | **SÍ.** `theme/03F-owner-actions-minimal.md`: se agregaron **C6–C8** (orden de colecciones, selector COP/USD, inglés `/en`) y la **sección D** (D1 talla XL, D2 inventario, D3 datos de clientas, D4 dominio y corte, D5 respaldo del trabajo). A1–A5, B1–B4 y C1–C5 no cambiaron. **No se le presentó a Daniela** |
| 20 | Escaneo de secretos | **0 bloqueantes** en 385 archivos (ZIP de RC1.8 extraído, ZIP de la app extraído, `launch/`, `theme/`, analítica, legales, catálogo, SEO, envíos, pagos, importación, colecciones, `app/`). 78 coincidencias permitidas: contacto público de la marca en configuración del theme, legales y HTML público rastreado. 8 datos sintéticos de tests (3 archivos: `cas.test.mjs`, `session-token.test.mjs`, `event-map.test.mjs`), evidentemente falsos. Sin tokens, cookies, llaves privadas, URLs de checkout con token ni PII de clientas. `launch/tools/03g-secret-scan.mjs` |
| 21 | Theme Check | **0 errores / 0 warnings** (60 archivos, en `theme-src` y en el ZIP RC1.8 extraído) |
| 22 | Regresión del theme | Arnés offline (Liquid real) **74/74** (70 + 4 nuevas de la miga). **Mutantes 7, 18, 19, 21, 50 y 51 detectados** (51 = nueva; cae exactamente en las 2 pruebas de la miga y no en las de respaldo). Acumulado de mutantes de theme desde 03D: 11–51, todos detectados |
| 23 | Tests de la app | **156/156** (re-ejecutados hoy) |
| 24 | Mutantes de la app | **20/20** detectados (re-ejecutados hoy) |
| 25 | Catálogo 29/98/95 | **SÍ** (29 productos, 98 variantes, 95 imágenes; captura en vivo el 2026-09-29 17:24; sin escrituras de catálogo en 03G) |
| 26 | Redirects 47/47 | **SÍ.** Admin: lista "1-47"; validador `seo/validate-redirects.mjs` PASS (0 errores, 47, 102 URLs clasificadas); 38 destinos con 200 medido hoy y 9 `/cuenta*` hacia el dominio de cuentas (no seguibles por `fetch`) |
| 27 | Horizon sin tocar | **SÍ** (`theme list` del 2026-09-30 00:54: `189072113983 [live] Horizon`) |
| 28 | Radaelli sin publicar | **SÍ** (`theme list` del 2026-09-30 00:54: `189072474431 [unpublished] Radaelli RC1`) |
| 29 | Pagos activados | **NO** |
| 30 | Producción / Staging / `main` tocados | **NO** (tampoco Vercel, Neon, Wompi, DNS, tienda comercial, apps, OAuth, mercado, envíos, merge ni PR) |
| 31 | Bloqueos para 03H | Ver § C: A1 y B1 (owner); decisiones D1–D5 y C6–C8; 5 arreglos de theme reservados (7 filas de la Home); 4 legales; respaldo/versionado del trabajo (G03); las 2 verificaciones adversariales que no corrieron |
| 32 | READY FOR 03H | **SÍ**, para planificar y para los arreglos de theme; la ejecución de A1/B1 y de las decisiones depende de que Daniela diga que está lista |
| 33 | CERO TAREAS DE SEGUNDO PLANO ACTIVAS | **CERO TAREAS DE SEGUNDO PLANO ACTIVAS.** Los 3 workflows terminaron (los cortados por el límite de uso no se relanzaron); servidores del arnés y vista previa detenidos; 0 procesos `node`; mi pestaña de la Dev Store cerrada (queda solo la pestaña de ChatGPT de Daniela); los puertos en escucha son de Windows y AnyDesk. Solo quedan las esperas finitas del handoff (+1 / +2 / +5 min) |

## A. Cambio del theme en 03G (RC1.7 → RC1.8)

| Cambio | Archivo | Prueba |
|---|---|---|
| La miga de pan, "Volver a…" y `BreadcrumbList` usan la colección cuyo título es igual al `product.type` (Oasis Natural, Aurora Viva, Espuma de Ola); sin coincidencia se conserva el comportamiento anterior. Se evita `nil == blank` (no lo modela liquidjs; en Shopify sí valdría) usando verdad/falsedad directa | `sections/main-product.liquid` | 4 pruebas nuevas en el arnés (74/74); **mutante 51** detectado; en vivo: las 4 fichas afectadas y 6 de control |

- **RC1.8** `e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67`, 173.654 bytes, 96 archivos, determinista (construido dos veces). Remoto = ZIP 96/96.
- **RC1.7** (`5bea536f…4b0b`) queda como histórico; su manifiesto se regeneró (`dist/release-manifest-rc1.7.json`) reproduciendo RC1.7 con su archivo original y verificando el mismo hash.
- Orden de push: solo el archivo de sección (no cambia ninguna plantilla JSON).

## B. Hallazgos que cambian conclusiones o supuestos previos

1. **Idioma predeterminado de la Dev Store = Inglés** (Admin > Idiomas), con Español "publicado, sin traducciones"; el storefront sirve español en `/` por el mercado y el theme. La tienda comercial debe crearse con español como idioma principal (P5 del checkout, S02).
2. **Los dos mercados ya existen y figuran "Activo"** (Colombia y Estados Unidos), y la región de respaldo es Colombia. Lo que falta para A1 es la zona de envío de Colombia y convertir a Colombia en el mercado principal (hoy lo es Estados Unidos).
3. **La única app instalada es *Translate & Adapt*** (de Shopify). Contraseña de la tienda activa. Cuentas de cliente nuevas (con crédito de tienda activado y devoluciones de autoservicio apagadas).
4. **`/policies/privacy-policy` responde 200 con una política autogenerada por Shopify** (no es el texto del sitio actual); `/policies/terms-of-service` y `/policies/shipping-policy` dan 404.
5. **El Admin trae restos por defecto en inglés:** páginas `Contact` y `Your Privacy Choices`, y el menú "Footer menu" sin uso (C5).
6. **Colección `Home page` (`frontpage`)** existe con 0 productos, es indexable y sale en el sitemap.
7. **El 20 % ya es un precio**, no una regla: precio = 80 % del anterior en 29/29; la Dev muestra el precio anterior tachado y "−20 %".
8. **El sitio actual publica datos que no se migran** (contador "N vistas" = 6 × vistas reales, stock por talla, blog con contenido heredado de otra marca): decisiones de la dueña, no defectos de la migración.
9. **El enlace de repositorio en `theme_documentation_url`** (metadato del theme visible solo en el editor) apunta al repositorio del proyecto (N-01 del checkout); decisión de la dueña.

## C. Bloqueos y pendientes para 03H

**Owner-only (no presentados a Daniela):**
- **A1** zona de envío y mercado Colombia → desbloquea catálogo disponible, checkout `es-co` y toda medición de compra; **B1** pago (Wompi o pasarela de prueba).
- **B2** legales (4 páginas + razón social, NIT y dirección) y sus 4 redirecciones; **B3** analítica; **A3** Search & Discovery; **A4** media (12 archivos + logo, favicon e imagen social que el manifiesto aún no tiene); **A5** app de favoritos.
- **Decisiones nuevas:** D1 talla XL, D2 inventario, D3 datos de clientas, D4 dominio y corte, D5 respaldo; y C6–C8.

**Trabajo de Claude reservado para 03H (no hecho por instrucción):** 5 arreglos de theme = 7 filas de la Home (`theme/03G-home-parity.md` § 4, filas 8, 14, 18, 21, 27, 28 y 38):

| Id | Arreglo | Filas |
|---|---|---|
| HP-03 | CTA del hero y del promo: `#categorias` → `#productos` | 8, 18 |
| HP-07 | Editorial: quitar insignia de categoría y "Ver producto" (parametrizar el snippet) | 14 |
| HP-08 | Newsletter: texto del botón "Quiero enterarme" | 21 |
| HP-09 | Pie: `brand_name` y descripción de marca del sitio actual | 27, 28 |
| HP-22 | Pie, desplegable de Contacto: usuario/número como texto y quitar "Contacto" repetido | 38 |

Van juntos en un posible **RC1.9** (con su regresión y mutantes). Opcional: H-01 (contraste de la tarjeta de categoría sin imagen).

**Trabajo de verificación pendiente:** los verificadores adversariales del plan de migración y del monitoreo no corrieron (límite de uso); la mitigación fue por script (plan 15/15) y búsqueda de datos sin fuente. Re-capturar la Home, colecciones y rutas de la Dev con RC1.8 y país CO cuando exista A1.

**Respaldo del trabajo (G03):** todo `shopify-migration/` sigue sin versionar; se necesita el OK de la dueña (D5) para un commit en una rama dedicada y una copia externa. En 03G no se hizo ningún commit de estos archivos.

## D. Qué no se hizo y por qué

- **LCP/FCP/CLS reales, checkout a 390 px y capturas por ancho:** la ventana de Chrome está oculta y no es redimensionable.
- **Ajustes de la pantalla de pago del Admin, formas de pago manuales, impuestos, dominios y eventos del cliente:** no cargaron o no se abrieron (NOT_VERIFIED).
- **Checkout en Colombia, envíos, Wompi, pedido y correo de confirmación:** dependen de A1 y B1 (owner).
- **Los 7 arreglos de theme, el reordenamiento de colecciones y cualquier escritura de catálogo en la Dev:** reservados para 03H.
- **Ejecutar cutover, rollback o migración a la tienda comercial:** solo documentados; nada se ejecutó.

## E. Documentos de 03G

- `launch/03G-current-site-baseline.md`, `03G-route-parity.csv` (+ `.md` y `-detail.csv`), `03G-product-parity.csv` (+ `.md`, `.summary.json`, `-verify.json`), `03G-collection-parity.md`, `theme/03G-home-parity.md`, `03G-responsive-sweep.md`, `03G-checkout-precondition-audit.md`, `03G-dev-store-snapshot.json`, `03G-release-freeze.md`, `03G-commercial-store-migration-plan.md`, `03G-reproducibility-gap-audit.md`, `03G-cutover-runbook.md`, `03G-rollback-plan.md`, `03G-launch-acceptance-checklist.md`, `03G-post-launch-monitoring.md`.
- Herramientas deterministas: `launch/tools/03g-*.mjs` (rastreo, extractores, paridades y sus verificadores, snapshot, freeze, escaneo de secretos, comprobadores del plan y del checklist).
- Evidencia: `launch/evidence/` (capturas de la Dev Store, rastreo del sitio actual, documentos de referencia de la auditoría de viabilidad).
- Theme: `dist/radaelli-shopify-theme-rc1.8.zip`, `dist/release-manifest-rc1.8.json` y `dist/release-manifest-rc1.7.json`.
