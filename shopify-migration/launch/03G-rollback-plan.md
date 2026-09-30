# 03G — Plan de rollback (documento; NO ejecutar)

- **Fecha:** 2026-09-29, 18:00 (Bogotá). Fase 03G, ensayo de lanzamiento.
- **Estado:** SOLO DOCUMENTO. No se ejecutó nada del plan: no se tocó ninguna tienda, DNS, Vercel, Wompi, Neon ni el sitio en producción; no hubo POST; **no se hizo ningún GET nuevo** a `radaelliswimwear.com` (la evidencia guardada de 03G alcanzó).
- **Único script:** `launch/tools/03g-rollback-theme-diff.mjs` (offline, lee `dist/`, no escribe). Comando: `node launch/tools/03g-rollback-theme-diff.mjs`.
- **Verificación adversarial:** un segundo revisor contrastó este plan con las fuentes y lo corrigió; el registro de cambios está en el § 18. Queda una diferencia abierta con el cutover (D-15: orden de RP-10, RP-11 y RP-52 respecto del DNS).
- **Se lee junto con** `launch/03G-cutover-runbook.md` (el corte). Ese archivo apareció mientras se terminaba este plan y se leyó completo: este documento se alineó con sus IDs (`CT-##`, `D-CT#`, `G1`–`G8`, `AB-##` y los disparadores `RB-01`…`RB-05`), con su orden real (S16 antes de S15) y con su mecanismo de pausa del sitio actual. El cruce está en el § 6.1 y el § 12.4. Como el cutover ya usa `RB-##` para sus disparadores, **los pasos de este plan se llaman `RP-##`**.
- **Alcance:** revertir, parcial o totalmente, lo que el plan de migración haya hecho en la tienda comercial (S01–S17), y volver al sitio custom Next.js/Prisma/Neon en Vercel. La Dev Store `radaelli-swimwear-dev` se usa como referencia de estado (03G) y como campo de ensayo (§ 14).

## 0. Cómo leer este documento

| Marca | Significa |
|---|---|
| `[MEDIDO-03G]` | Capturas de solo lectura del 2026-09-29 (`launch/03G-dev-store-snapshot.json`, `launch/03G-checkout-precondition-audit.md`, `launch/evidence/**`, script de esta fase) |
| `[DOC:<archivo>]` | Documento del repo (ruta relativa a `shopify-migration/`; los del sitio actual, fuera de esa carpeta, con su ruta desde la raíz del repo: `docs/…`, `lib/…`, `vercel.json`) |
| `[INFERIDO]` | Razonado a partir de lo anterior; se dice el porqué |
| `[PRÁCTICA-GENERAL]` | Práctica técnica genérica, sin cifras propias de la marca; no está en una fuente del repo |
| `[NOT_VERIFIED]` / `NOT_AVAILABLE` | No se pudo comprobar / el dato no existe en las fuentes |

**Identificadores de este plan:** `S01–S17` = pasos canónicos del plan de migración. `RP-##` = paso de rollback. `SY-##` = síntoma (§ 6). `DR-##` = decisión de la dueña (§ 4). `SR-##` = captura previa al corte (§ 5). `PNR-#` = punto de no retorno (§ 3). `CU-##` = componente del sitio custom que debe seguir vivo (§ 8.9). **Identificadores del cutover, que este plan solo cita:** `CT-##` acción, `G1`–`G8` compuertas, `D-CT#` decisiones, `AB-##` disparadores de abortar antes de T0, `RB-01`…`RB-05` disparadores de rollback después de T0.

**Nomenclatura (evita confusiones):** los runbooks 03F usan sus propios pasos (`M0–M10` mercado, `S0–S13` envío, `P0–P10` Wompi, `P-1–P-26` analítica, `S1–S12` Search & Discovery). Aquí siempre se citan con el nombre del runbook ("runbook de envío, S7"). Cuando este documento escribe `S07` sin más, es el paso canónico **Media**.

**Quién:** *Dueña* = DNS, credenciales, OAuth, aprobaciones, configuración de pagos y de la tienda comercial, decisiones `DR-##`. *Claude* = solo con OK explícito de la dueña en el chat para cada acción de escritura; verifica, prepara y empuja el theme por CLI (nunca con `--live`, `--publish` ni `--allow-live` `[DOC:theme/03A-development-store-upload-report.md]`), importa o borra redirecciones, redacta reportes; no escribe credenciales ni acepta OAuth `[DOC:theme/03F-owner-actions-minimal.md]`; no acepta facturación ni envía mensajes a clientas `[DOC:launch/03G-cutover-runbook.md § 2 punto 2]`; no consulta Neon (regla de esta fase).

**Regla de formato:** lo irreversible va en **negrita con su razón**. Cada paso lleva quién, si es reversible, dependencia, evidencia de que quedó bien y cómo deshacerlo (o por qué no se puede).

---

## 1. Resumen

1. **Principio rector.** `radaelliswimwear.com` sigue sirviendo el sitio custom sin cambios durante todo el proceso [DOC:launch/evidence/reference-docs/migration-roadmap.md § 18]. Consecuencias: (a) mientras el DNS (S15) no se haya movido, el rollback es **no avanzar**; (b) después, el rollback total es devolver el DNS y reabrir pedidos en el sitio custom; (c) todo lo demás (theme, envíos, pagos, apps, redirecciones) se revierte **por partes** sin tocar el DNS.
2. **Hoy no hay nada que revertir en producción** [MEDIDO-03G]: RC1.8 está sin publicar, Horizon es el theme live de la Dev Store, los pagos están apagados, la única app instalada es Translate & Adapt, y DNS, Vercel, Neon y Wompi no se han tocado [DOC:theme/03F-sonnet-independent-completion-report.md, punto 31]. Las escrituras hechas en la Dev Store por esta línea de trabajo son el theme RC1.x empujado por CLI sin publicar (el RC1.8, en 03G) `[MEDIDO-03G]` y la importación de las 47 redirecciones (03F) `[DOC:seo/03F-redirect-import-result.md]`; ambas son reversibles (RP-04, RP-38/RP-39).
3. **Lo que no vuelve atrás** (§ 9): pedidos reales y sus cobros, correos ya enviados, país/moneda base con pedidos, la distribución personalizada de la app, borrados permanentes y datos ya enviados a Google o Meta.
4. **Cuatro brechas hoy impiden un rollback limpio** (§ 15): (i) proveedor, registros y TTL del DNS, y la URL de eventos de Wompi de producción del sitio custom: `NOT_AVAILABLE`; (ii) no hay herramienta ni decisión para conciliar los pedidos creados en Shopify con el sitio custom (DR-06); (iii) el inventario **no** se rastrea en Shopify, mientras el sitio custom descuenta stock al iniciar el pago (DR-07); (iv) el caso "cobro aprobado en Wompi sin pedido en Shopify" (NV7) sigue sin resolver.
5. **Decide la dueña, y los umbrales también** (DR-01, DR-02). El cutover ya dice que la dueña decide cada rollback, que quién autoriza, los umbrales y el método de contención son su decisión D-CT15 (= DR-01, DR-02 y DR-05) y que la ventana de decisión tras T0 es D-CT1 `[DOC:launch/03G-cutover-runbook.md § 2, § 4, § 8.1]`. Las fuentes no traen KPIs, tiempos máximos de caída ni umbrales de conversión; este plan no los inventa.
6. **Primero contener, después decidir.** RP-01…RP-03 paran nuevas ventas sin decidir todavía si el rollback es parcial o total.
7. **Qué es rápido y qué no** (solo con fuente): el interruptor de favoritos es instantáneo [DOC:theme/03F-owner-wishlist-install-runbook.md § 1]; reimportar las 47 redirecciones toma ≈ 1 minuto [DOC:seo/03F-redirect-import-result.md § 4]; el DNS tarda "minutos a horas según TTL" [DOC:launch/evidence/reference-docs/migration-roadmap.md § 18]. Todo lo demás: `NOT_AVAILABLE`.

---

## 2. Punto de partida (verificado en 03G)

| Ítem | Estado hoy | Evidencia |
|---|---|---|
| Theme live (Dev Store) | Horizon `189072113983`, sin tocar | `[MEDIDO-03G]` snapshot `themes` (`shopify theme list`) |
| Theme Radaelli | `189072474431` ("Radaelli RC1"), release RC1.8, **sin publicar**, 96 archivos, SHA-256 del ZIP `e893b386…9e67`, remoto = ZIP 96/96, Theme Check 0/0 | `[MEDIDO-03G]` snapshot `themes` |
| Versión previa inmediata | RC1.7: `dist/radaelli-shopify-theme-rc1.7.zip`, SHA-256 `5bea536f…4b0b` (coincide con su manifiesto); difiere de RC1.8 en **1 de 96** archivos: `sections/main-product.liquid` (miga, "Volver a" y JSON-LD BreadcrumbList de la ficha) | `[MEDIDO-03G]` `launch/tools/03g-rollback-theme-diff.mjs`; `[DOC:dist/release-manifest-rc1.8.json]` |
| Acceso a la tienda | Protegida con contraseña | `[MEDIDO-03G]` snapshot `onlineStore` |
| Idioma y moneda | Admin en Inglés (predeterminado); storefront `/` en español y `/en` en inglés; COP | `[MEDIDO-03G]` snapshot `locales`, `currency` |
| Mercado | Principal EE. UU.; Colombia "Activo"; región de respaldo Colombia; dirección de la tienda en EE. UU. | `[MEDIDO-03G]` snapshot `markets` |
| Envíos | 1 perfil general, solo zona EE. UU.; **sin zona Colombia**; tarifa bajo $299.900 `NOT_SET` (D2); `free_shipping_rate_confirmed=false` | `[MEDIDO-03G]` snapshot `shipping`, `themeFlags` |
| Pagos | Ninguno activo; Wompi no instalado; el checkout dice "Esta tienda no puede aceptar pagos en este momento" | `[MEDIDO-03G]` snapshot `payments`; checkout audit § 1 |
| Redirecciones | 47 importadas en la Dev Store; CSV de 47 filas (SHA-256 `ba369467…18b1d6`, verificado hoy); 38 con destino 200 y 9 `/cuenta*` con redirección | `[MEDIDO-03G]` snapshot `redirects`; `[DOC:seo/03F-redirect-import-result.md]` |
| Apps | Solo Translate & Adapt. No instaladas: Search & Discovery, Google & YouTube, Facebook & Instagram, favoritos | `[MEDIDO-03G]` snapshot `apps` |
| Favoritos | App 0.1.2 (SHA-256 `19c8c0df…e4b2`) sin instalar; `wishlist_enabled=true` (modo invitada, en el navegador); `wishlist_account_sync=false` | `[MEDIDO-03G]` snapshot `wishlistApp`, `themeFlags` |
| Cuentas | New customer accounts; login por código: `DEFERRED_OWNER_ONLY_BLOCKER` (A2) | `[MEDIDO-03G]` snapshot `customerAccounts` |
| Catálogo | 29 productos / 98 variantes / 95 imágenes; **inventario NO rastreado** | `[MEDIDO-03G]` snapshot `catalog` |
| Analítica | Custom pixel APAGADO (`ENABLED:false`, IDs vacíos) | `[MEDIDO-03G]` snapshot `themeFlags.customPixel` |
| Pedidos en la Dev Store | 03G no creó ninguno; conteo total `NOT_VERIFIED` (03F esperaba 0) | `[MEDIDO-03G]` checkout audit (regla); `[DOC:theme/03F-owner-market-colombia-runbook.md]` A11 |
| Sitio actual | Rastreo 03G de 70 URLs: 54 con 200 (incl. `/`, colecciones, las 29 fichas, `/blog` y `/checkout`) y 16 con 404 (incl. `/cart` y `/carrito`); 3 posts de blog con 200 (sonda aparte); `robots.txt` propio de 228 bytes con `Host: https://radaelliswimwear.com` | `[MEDIDO-03G]` `launch/evidence/current-site/index.json`, `current-site-probe/index.json` |
| Bloqueo crítico | A1: zona de envío Colombia y luego mercado principal Colombia | `[MEDIDO-03G]` checkout audit § 1–2 |

**Conclusión:** el rollback vigente es "no publicar". Los pasos de abajo aplican desde S03 (parcial) y sobre todo desde S16 (público). Nada de este documento se ejecuta hoy.

---

## 3. Tipos de rollback y puntos de no retorno

| Tipo | Qué es | Cuándo se usa | Cómo se hace |
|---|---|---|---|
| **Contención (C0)** | Parar nuevas ventas sin decidir el rollback | Síntomas de dinero o datos en riesgo (SY-04…SY-06) | RP-01, RP-02, RP-03 |
| **Parcial** | Revertir un dominio (theme, envíos, pagos, apps, redirecciones); Shopify sigue siendo el sitio público | El fallo está acotado y hay arreglo | § 8.1, 8.3–8.8 |
| **Total** | Volver al sitio custom | El fallo no se acota, o la dueña lo decide por DR-02 | § 12 (DNS S15 + pagos S11 + pedidos) |

**Puntos de no retorno** (a partir de cada uno el rollback deja de ser gratis en datos):

| PNR | Momento | Por qué no vuelve | Efecto sobre el rollback |
|---|---|---|---|
| PNR-1 | Primer pedido real cobrado en la tienda comercial. **El cutover crea uno a propósito** (CT-47, en T-1h: la dueña paga con su tarjeta y reembolsa) `[DOC:launch/03G-cutover-runbook.md CT-47]` | El cobro y el pedido existen fuera del sitio custom; el reembolso hacia Wompi es `NOT_VERIFIED` (NV6) | Conciliación obligatoria (§ 8.10); registrar el pedido de CT-47 como "prueba de producción" |
| PNR-2 | Primer correo a una clienta desde Shopify (confirmación, código de acceso, invitación) | Un correo enviado no se retira | Comunicar a las clientas (RP-54) |
| PNR-3 | Primer dato de compra enviado a GA4 o Meta (Meta en Enhanced o Maximum comparte nombre, ubicación, correo y teléfono) | Lo enviado no se recupera | Desconectar solo frena lo futuro (RP-28…RP-31) [DOC:analytics/03F-analytics-owner-runbook.md § 16, P-18] |
| PNR-4 | Elegir custom distribution de la app de favoritos (S09) | Shopify no permite cambiarla después | **Irreversible** (§ 9) |
| PNR-5 | Cambiar país o moneda base de la tienda con pedidos creados | Sin fuente que garantice reversión (§ 9, I-05) | Tratar como irreversible |
| PNR-6 | Primer borrado permanente (producto, colección, mercado, archivo, handle, definición de metacampo con datos) | No se recupera | § 9 |
| PNR-7 | Primer 301 servido desde el dominio real | Navegadores y buscadores lo cachean [DOC:seo/03E-redirect-plan.md § 5.3] | RP-40 |

Antes de PNR-1 el rollback total no cuesta datos: es devolver el DNS. En el cutover, el único PNR-1 previo al DNS es el pedido propio de CT-47 (con D-CT2 = B, CT-47 pasa a T+15m, es decir, **después** del DNS `[DOC:launch/03G-cutover-runbook.md § 5.2]`); los demás pedidos reales llegan después de T0 `[DOC:launch/03G-cutover-runbook.md § 8.1: "el costo del rollback sube con cada pedido real tomado en Shopify después de T0"]`.

---

## 4. Decisiones de la dueña (DR-##) y su equivalente en el cutover

Ninguna tiene valor en las fuentes. Se cierran **antes de S15**: el cutover exige respuesta a D-CT1…D-CT12 y D-CT15…D-CT17 (o un "no aplica" escrito) en la compuerta G1 `[DOC:launch/03G-cutover-runbook.md § 6, criterio final de G1]`. Las equivalencias las fija el cutover en su § 4: D-CT2 = DR-04, D-CT3 = DR-03, D-CT5 = DR-11, D-CT8 = DR-07, D-CT12 = DR-06, D-CT13 = DR-08, D-CT15 = DR-01, DR-02 y DR-05, D-CT16 = DR-09 y DR-10.

| ID | Decisión | Equivale en el cutover | Estado |
|---|---|---|---|
| DR-01 | Quién autoriza un rollback y por qué canal | D-CT15; decide la dueña `[DOC:launch/03G-cutover-runbook.md § 2, § 4, § 8.1]` | Decisor definido; el canal es `NOT_AVAILABLE` |
| DR-02 | Umbrales que disparan el rollback total (tiempo sin poder cobrar, cobros sin pedido tolerados, errores de checkout) | D-CT15 (umbrales) y D-CT1 (ventana de decisión tras T0); criterios `RB-01`…`RB-05` del cutover (§ 8.3), sin cifras | `NOT_AVAILABLE`; **no se inventan** |
| DR-03 | Proveedor de DNS, TTL actual, TTL objetivo y cuándo bajarlo | D-CT3; CT-13 y CT-33 | `NOT_AVAILABLE` |
| DR-04 | Qué hace el sitio custom durante la ventana: pausado o vendiendo | D-CT2: **A** pausa con `WRITES_PAUSED` desde T-1h; **B** sigue vendiendo hasta el DNS `[DOC:launch/03G-cutover-runbook.md § 5.2]` | Mecanismo documentado; la elección de la dueña, pendiente; que el deployment de producción vigente incluya el interruptor: `NOT_VERIFIED` |
| DR-05 | Método de contención preferido: RP-01, RP-02 o RP-03 | D-CT15 y `RB-02` del cutover, que ya listan RP-01 (desactivar Wompi), RP-02 (quitar la zona) y RP-03 (contraseña) `[DOC:launch/03G-cutover-runbook.md § 4, § 8.3, CT-72]` | Pendiente |
| DR-06 | Conciliación de pedidos Shopify → sitio custom e importación de histórico | D-CT12; `[DOC:launch/evidence/reference-docs/data-migration.md]` (ORDERS): herramienta "REQUIERE DECISIÓN" | `NOT_AVAILABLE` |
| DR-07 | ¿Se rastrea inventario en Shopify? | D-CT8 (CT-04) | Pendiente |
| DR-08 | Condición y fecha de retiro del sitio custom (Vercel, Neon, Cloudinary, Resend) | D-CT13 (G8); el roadmap dice "varias semanas" sin fecha | `NOT_AVAILABLE` |
| DR-09 | Qué hacer con los 301 cacheados si hay rollback total (RP-40) | — (solo este plan) | Pendiente |
| DR-10 | Reembolsos de pedidos de Shopify pagados con Wompi: por Shopify o por el panel de Wompi | D-CT16 (y D-CT14 para el pedido de CT-47, CT-24); NV6 sin resolver (pregunta P3 a Wompi) | `NOT_VERIFIED` |
| DR-11 | En qué tienda se lanza: comercial nueva (S01) o Dev Store transferida o con plan pago | D-CT5 | `NOT_VERIFIED` `[DOC:analytics/03F-analytics-owner-runbook.md § 2–3]` |

---

## 5. Capturas previas al corte (SR-##): sin ellas no hay rollback

Guardarlas **fuera del repo**, sin claves y sin datos personales (las hojas de pedidos van en un lugar privado). Ninguna se puede reconstruir después del cambio. La hoja privada del cutover (§ 5.4) ya reúne SR-01 a SR-12 con estos mismos IDs y exige tenerla completa antes de T0 (G3) `[DOC:launch/03G-cutover-runbook.md § 5.4]`. Lo que queda por cerrar: SR-10 figura allí como "se toma en CT-43", pero CT-43 no describe la acción de capturar el stock, el último número de pedido ni el respaldo de la base `[DOC:launch/03G-cutover-runbook.md CT-43]`; el mecanismo del respaldo es de la dueña y hoy es `NOT_AVAILABLE`.

| ID | Qué capturar | Cómo | Quién | Estado hoy | Alimenta |
|---|---|---|---|---|---|
| SR-01 | Registros DNS **completos** (web de apex y `www`, correo/MX, TXT, CAA), TTL, proveedor y quién tiene acceso | Pantalla del proveedor de DNS | Dueña | `NOT_AVAILABLE` (cutover § 5.4) | RP-08, RP-12 |
| SR-02 | Proyecto de Vercel, dominios asignados, deployment de producción (commit) vigente, **valor previo de `WRITES_PAUSED`** y la URL del proyecto que no depende del dominio (CT-14). La base documentada es `a8ddc9d` `[DOC:source-of-truth/data-model-audit.md]`; que siga siendo la de producción es `NOT_VERIFIED` | Panel de Vercel (solo lectura; Claude solo lee con OK) | Dueña | `NOT_AVAILABLE` (cutover § 5.4) | RP-09, RP-10, CU-01 |
| SR-03 | URL de eventos de Wompi de **producción** y de **pruebas** vigentes (el staging del pentest usa Wompi Sandbox), estado de Wompi en el sitio custom | Panel de Wompi > Desarrolladores > Seguimiento de transacciones | Dueña | `NOT_AVAILABLE` (NV10; cutover § 5.4) | RP-11, RP-16 |
| SR-04 | ID y rol del theme vivo previo, ZIP RC1.8 y RC1.7 con hash, y `theme pull` del theme vivo antes de editarlo | `shopify theme list`; `dist/` | Claude | Dev Store: hecho (Horizon `189072113983`; RC1.7 y RC1.8 verificados hoy). Tienda comercial: `NOT_AVAILABLE` | RP-04…RP-07 |
| SR-05 | Lista de redirecciones de la tienda y `seo/shopify-redirects-import.csv` con hash; más las 4 filas legales cuando existan | Admin > Contenido > Menús > Redireccionamientos; `sha256sum` | Claude | CSV verificado hoy; filas legales pendientes (B2) | RP-37…RP-39 |
| SR-06 | Snapshot de mercados y envíos: A1–A11 (runbook de mercado, M0) y E1–E8 (runbook de envío, S0) | Admin, capturas (el cutover las toma en CT-47) | Dueña (o Claude con el Admin visible) | Pendiente (CAPTURAR AL INICIO) | RP-21…RP-26 |
| SR-07 | Ajustes de Configuración > Checkout previos (contacto, teléfono de envío) y lista de proveedores de pago | Admin | Dueña | Pendiente (`settings/checkout` no cargó en 03G: `NOT_VERIFIED`) | RP-19 |
| SR-08 | Lista de apps instaladas y su configuración no secreta: filtros de Search & Discovery, IDs de GA4/Meta por nombre, versión y distribución de la app de favoritos | Admin | Dueña + Claude | Hoy solo Translate & Adapt | RP-27…RP-36 |
| SR-09 | `settings_data.json` del theme vivo (`theme pull`) con los flags: `free_shipping_rate_confirmed`, `cart_free_shipping_progress`, `wishlist_enabled`, `wishlist_account_sync` | `shopify theme pull` | Claude | Dev Store: valores en § 2 | RP-07 |
| SR-10 | Stock y último número de pedido del sitio custom en el momento del corte; respaldo o export de la base (mecanismo de la dueña; Claude no consulta Neon). La retención de backups y del restore a un punto en el tiempo de Neon no está confirmada `[DOC:docs/production-recovery.md]` | Panel `/admin` del sitio custom; herramienta del proveedor de la base | Dueña | `NOT_AVAILABLE`; está en la hoja del cutover ("se toma en CT-43"), pero CT-43 no lo describe | RP-49, RP-52 |
| SR-11 | Propiedad de GA4 y dataset de Meta (IDs, por nombre) | Google Analytics; Events Manager | Dueña | `NOT_AVAILABLE`; está en la hoja del cutover (§ 5.4) | RP-28, RP-29 |
| SR-12 | Menús (5) y páginas (4) tal como están hoy | `launch/03G-dev-store-snapshot.json` (`menus`, `pages`) | Claude | Hecho en la Dev Store | RP-46 |

---

## 6. Matriz síntoma → decisión → rollback (parcial o total)

"Arreglar hacia adelante" = el síntoma se corrige sin revertir nada. Ningún umbral numérico aparece aquí: los fija la dueña (DR-02). El "cómo se confirma" son lecturas, no escrituras.

| ID | Síntoma | Cómo se confirma | Decide | Rollback recomendado | Tipo |
|---|---|---|---|---|---|
| SY-01 | Catálogo "agotado" para Colombia (`POST /cart/add.js` → 422; botón "Producto agotado") | Misma prueba de 03G: `PUT /localization` con CO + `add.js`; V4 y V5 del runbook de mercado `[MEDIDO-03G]` | Dueña corrige; Claude mide | No revertir theme ni DNS. Corregir zona de envío y mercado (S10/S02) | Arreglar hacia adelante |
| SY-02 | Checkout dice "Esta tienda no puede aceptar pagos en este momento" | `[MEDIDO-03G]` checkout audit § 1 | Dueña | Reactivar o reconfigurar S11. Si no se puede cobrar y la dueña no acepta la espera (DR-02): total | Parcial → Total por DR-02 |
| SY-03 | Carrito de 1 prenda sin método de envío (error de envío en el checkout) | T1/T2 del runbook de envío `[DOC:shipping/03F-owner-shipping-runbook.md § 7.1]` | Dueña (D2) | Crear la tarifa bajo $299.900 (S10). Mientras tanto RP-21 | Arreglar hacia adelante |
| SY-04 | **Cobro aprobado en Wompi sin pedido en Shopify** | Panel de Wompi (APPROVED) contra Pedidos y Checkouts abandonados `[DOC:payments/03F-wompi-owner-runbook.md § 9 caso 5, NV7]` | Dueña (DR-01/DR-02); Claude concilia | C0: RP-01; luego RP-20 y RP-50. Total si DR-02 lo exige | C0 → Parcial o Total |
| SY-05 | Shopify muestra "Reembolsado" y Wompi no muestra nada (o pedido "Pagado" sin transacción) | § 9 caso 4, "señal de riesgo" `[DOC:payments/03F-wompi-owner-runbook.md]` | Dueña | C0: RP-01; preguntar a Wompi (P3); RP-53 | C0 → Parcial |
| SY-06 | Dos pedidos o dos cobros por un solo pago | § 9 caso 6 `[DOC:payments/03F-wompi-owner-runbook.md]` | Dueña | C0: RP-01; RP-50. Total si se repite (DR-02) | C0 → Total |
| SY-07 | Theme roto: error JS propio, error de Liquid, "Finalizar compra" no funciona, layout roto | Consola sin errores propios (criterio de 03E) y `/` y fichas con 200 `[DOC:theme/03E-commercial-readiness-report.md]` | Claude propone; dueña autoriza | RP-05 (RC1.7 sin tocar el vivo) o RP-06 | Parcial |
| SY-08 | Ficha con miga o JSON-LD incorrecto tras RC1.8 | Miga y JSON-LD de las fichas `[DOC:seo/03F-seo-final-validation.md]` | Claude | RP-05 con RC1.7 (1 archivo distinto) | Parcial |
| SY-09 | Redirección mala: bucle, destino distinto de 200, código distinto de 301 | `curl.exe -I` sobre el CSV; `node seo/validate-redirects.mjs` `[DOC:seo/03E-redirect-plan.md § 7]` | Claude (con OK) | RP-37 (una fila) o RP-38 + RP-39 | Parcial |
| SY-10 | URL vieja indexada da 404 (p. ej. `/envios`, `/terminos`, `/privacidad`, `/cookies` sin fila) | `curl.exe -I` a esas 4 rutas `[DOC:seo/03E-redirect-plan.md § 4.3]` | Dueña + Claude | Crear la página y agregar la fila. No es rollback | Arreglar hacia adelante |
| SY-11 | Caída de posiciones o de cobertura en Search Console | Search Console > Páginas, durante 4–8 semanas `[DOC:seo/03E-redirect-plan.md § 7]` | Dueña (DR-02) | La volatilidad temporal es un riesgo documentado `[DOC:launch/evidence/reference-docs/seo-analytics.md § 9]`. Por sí sola no dispara el rollback total `[INFERIDO]`; sí si hay 404 masivos que no se corrigen (SY-09, SY-10) | Parcial (corregir redirecciones) |
| SY-12 | HTTPS inválido, dominio que no resuelve, o mezcla de sitios (unos ven Shopify, otros el custom) | § 13, VR-1. La propagación tarda "minutos a horas según TTL" `[DOC:launch/evidence/reference-docs/migration-roadmap.md § 18]`; que en ese lapso unos visitantes vean un sitio y otros el otro es `[INFERIDO]` | Dueña | Si es propagación: esperar. Si el certificado falla y no se corrige: rollback total, RP-10 → RP-13 (§ 12.2) | Total (o esperar) |
| SY-13 | Favoritos: `401 no_customer`, `415`, `400 missing_csrf_header`, `502 admin_error`, corazones sin sincronizar | Logs de la función y Network con filtro `apps/radaelli` `[DOC:theme/03F-owner-wishlist-install-runbook.md § 3, paso 11]` | Claude + dueña | RP-32 (interruptor OFF, instantáneo) | Parcial |
| SY-14 | Backend de favoritos caído o "Quitar" con error | Ídem | Dueña | RP-34 y, si hace falta, RP-33 | Parcial |
| SY-15 | Filtros de talla o color ausentes o mal | Panel de filtros contra `collection.filters` `[DOC:theme/03F-search-discovery-owner-runbook.md § 9]` | Claude + dueña | RP-27 niveles 1–3 (no desinstalar primero) | Parcial |
| SY-16 | Analítica: eventos duplicados, datos personales, sin eventos, o sin banner de cookies con Colombia | Pixel Helper / Tag Assistant; checklist de § 8–9 `[DOC:analytics/03F-analytics-owner-runbook.md]` | Dueña | RP-28…RP-31 | Parcial |
| SY-17 | Clientas no reciben el código de acceso o no pueden entrar | Prueba A2 (código por correo), que hoy sigue pendiente de la dueña (`DEFERRED_OWNER_ONLY_BLOCKER`, `[MEDIDO-03G]` snapshot `customerAccounts`) | Dueña | No hay rollback del tipo de cuenta (RP-42). Mitigar con RP-41 y compra como invitada | Parcial (mitigación) |
| SY-18 | Banner o ficha prometen envío gratis y el checkout no lo cumple | T11 y T12 `[DOC:shipping/03F-owner-shipping-runbook.md § 11]` | Claude | RP-21 | Parcial |
| SY-19 | Precio o talla distinto del sitio actual (caso conocido: la XL de `alba-dorada-cafe-claro`) | `[MEDIDO-03G]` `launch/03G-product-parity.md` F-01 | Dueña | Corregir el dato en Shopify (S04) y re-correr el rastreo justo antes del corte | Arreglar hacia adelante |
| SY-20 | Pedidos entrando en los dos sistemas (DNS mezclado o custom sin apagar) | Pedidos nuevos en el Admin de Shopify y en `/admin` del custom dentro de la misma ventana | Dueña (DR-04) | C0 en el sistema que no debe recibir (en Shopify: RP-01, RP-02 o RP-03; en el sitio actual: `WRITES_PAUSED` y redeploy, con la salvedad de D-13); RP-47…RP-52 | C0 + conciliación |
| SY-21 | **Handle renombrado o borrado por error**; destinos de redirección que ya no existen | `node seo/validate-redirects.mjs` y `curl.exe -I` | Claude (con OK) | RP-44. Si se borró: irreversible (§ 9, I-07) | Parcial |
| SY-22 | La tienda pública muestra la página de contraseña tras el corte | Visita sin contraseña; Tienda online en Privada | Dueña | Poner acceso Público (parte de S16). No es rollback | Arreglar hacia adelante |

### 6.1 Cruce con los disparadores del cutover

El cutover define **cuándo** se aborta o se hace rollback (`AB-##` antes de T0; `RB-01`…`RB-05` después) y remite a este plan para **cómo** `[DOC:launch/03G-cutover-runbook.md § 8]`. Aquí no se redefine ningún criterio ni umbral.

| Disparador del cutover | Qué dice el cutover | Qué hace este plan |
|---|---|---|
| `AB-01` a `AB-07` (antes de T0) | No se cambia el DNS. "Al abortar: volver a poner la contraseña si ya se quitó, quitar `WRITES_PAUSED` y redeployar el mismo commit, volver a llaves de prueba de Wompi y restaurar la URL de eventos anotada" (§ 8.2) | Contraseña: RP-03 · reanudar el sitio actual: RP-10 · llaves de prueba o desactivar Wompi: RP-15, RP-17 · URL de eventos: RP-16 · síntomas que solo se corrigen hacia adelante (AB-02, AB-04, AB-07): SY-01…SY-03, SY-09, SY-10 |
| `RB-01` el dominio no resuelve a Shopify o el HTTPS es inválido pasado el TTL previo | **Rollback de DNS**; todavía no hay pedidos: es el caso más barato | Total: RP-10 → RP-11 → RP-12 → RP-13 (§ 12.2) · SY-12 |
| `RB-02` ninguna clienta con Colombia puede comprar (agotado, sin envío, "no puede aceptar pagos", falla la redirección a Wompi) | Primero contener según DR-05 (RP-01, RP-02 o RP-03) y corregir; **rollback total si la corrección exige cambiar un artefacto congelado o la dueña no la logra dentro de los umbrales que fijó (D-CT15 = DR-02; ventana de decisión D-CT1)** | C0: RP-01, RP-02 o RP-03 · corregir: SY-01…SY-03 · total: § 12 si se cumple la condición |
| `RB-03` cobro sin pedido o doble cobro confirmado en producción | Detener la venta (desactivar Wompi) y **rollback** si no hay explicación inmediata | C0: RP-01 · conciliar: RP-20, RP-49, RP-50 · total: § 12 · SY-04, SY-06 |
| `RB-04` pagos aprobados que aparecen como pedidos abandonados de forma repetida | Ídem `RB-03` | Ídem `RB-03` |
| `RB-05` exposición de datos personales o secretos | **No es rollback de DNS:** desconectar la app o el pixel y corregir | RP-28…RP-30 · SY-16. Si se expuso un secreto: rotarlo (client secret de la app, llaves de Wompi) `[PRÁCTICA-GENERAL]` |
| "Se corrige adelante" (cutover § 8.4) | Redirección con 404 o 302, eventos duplicados, correo que no llega, canonical en `*.myshopify.com`, filtros o miga, Meta sin terminar, pedido rezagado | No es rollback: SY-09, SY-16, SY-08, SY-15; los pedidos rezagados se atienden según § 8.10 |

---

## 7. Contención (C0): parar nuevas ventas sin decidir aún el rollback

Elegir uno según DR-05. El cutover ya lista las tres opciones (RP-01 desactivar Wompi, RP-02 quitar la zona, RP-03 contraseña: D-CT15, `RB-02` y CT-72 `[DOC:launch/03G-cutover-runbook.md § 4, § 8.3]`). Ninguno detiene los pedidos del **sitio custom** (eso es DR-04).

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-01 | S11 | Dueña · Sí | Configuración > Pagos > Wompi > **Desactivar** (o la pasarela de prueba; etiqueta en español `NOT_VERIFIED`) | S11 hecho | Pagos sin proveedor activo; el checkout dice "Esta tienda no puede aceptar pagos en este momento" (texto medido hoy en la Dev Store sin proveedor, `[MEDIDO-03G]`; que la tienda comercial muestre el mismo texto es `[INFERIDO]`) | La clienta llega al último paso y falla. Deja pagos en vuelo (RP-20). Catálogo y SEO intactos. Deshacer: **Activar** |
| RP-02 | S10 | Dueña · Sí, recreando a mano | Eliminar la zona Colombia (o solo sus tarifas) del perfil general | S10; SR-06 | Con país CO, `/cart/add.js` responde 422 y la ficha dice "Producto agotado" (mismo síntoma que hoy, `[MEDIDO-03G]`) | **Todo** el catálogo figura agotado (también en favoritos) y cambia la disponibilidad que publican fichas y JSON-LD `[INFERIDO]`. Deshacer: recrear zona y tarifas con SR-06 (E3); no reutilizar tarifas de EE. UU. |
| RP-03 | S16 | Dueña · Sí | Tienda online: acceso en **Privada** (contraseña) `[DOC:analytics/03F-analytics-owner-runbook.md § 6 P-9, § 16]` | Tienda comercial. En la Dev Store la contraseña ya existe y **no se sabe si puede quitarse**: la fuente D1 dice que no y la D2 dice que sí tras transferir la tienda o pasar a un plan pago (`NOT_VERIFIED`) `[DOC:analytics/03F-analytics-owner-runbook.md § 2]` | Un visitante sin contraseña ve una página de contraseña (en la Dev Store, la de Shopify y no la del theme; que con un plan pago se muestre la plantilla propia del theme es una inferencia no verificada `[DOC:theme/03B-store-foundation-report.md]`). Es lo que el cutover llama "volver a poner la contraseña", CT-51 `[DOC:launch/03G-cutover-runbook.md]` | Corta todo el tráfico, también el de buscadores; efecto sobre buscadores y sobre checkouts ya abiertos: `NOT_VERIFIED`; GA4 deja de registrar `[DOC:analytics/03F-analytics-owner-runbook.md § 2, fuente G2]`. Deshacer: acceso Público |

**Cuándo usar cada uno** `[INFERIDO]`: RP-01 si el riesgo es dinero (SY-04…SY-06) y se quiere conservar catálogo y SEO; RP-02 si se quiere que la clienta no llegue al pago; RP-03 como último recurso, es lo más visible.

**Ojo con los canales de venta** `[INFERIDO]`: si el sitio actual sigue pausado (D-CT2 = A, `WRITES_PAUSED`) y además se contiene Shopify, la marca queda con **cero** canales de venta hasta que se ejecute RP-10 (reanudar el sitio actual) y el DNS vuelva. Por eso la contención se elige sabiendo si el sitio actual está pausado o no, y una contención de Shopify que se prolonga es el momento de decidir el rollback total (DR-02).

---

## 8. Rollbacks por dominio

### 8.1 Theme (S03, S16)

- **Disparadores:** SY-07, SY-08; cualquier defecto que Claude confirme en la tienda pública.
- **Tiempo:** `NOT_AVAILABLE` (no hay medición de cuánto tarda subir o publicar un theme).
- **Qué permite Shopify, según el repo:** la biblioteca guarda varios themes a la vez y uno tiene el rol `live` `[MEDIDO-03G]`; el repo **ejecutó** la subida por CLI: `shopify theme push --unpublished` crea el theme sin publicar y `--theme <id>` lo actualiza, nunca con `--live`, `--publish` ni `--allow-live` `[DOC:theme/03A-development-store-upload-report.md]`. La subida por el Admin (Tienda online > Temas > Agregar tema > Subir ZIP) solo consta como paso previsto, nunca ejecutado `[DOC:theme/pre-development-store-checklist.md, paso G]`; el Admin solo ofrece plantillas del theme publicado `[DOC:theme/03B-store-foundation-report.md]`.
- **No documentado en el repo (nunca se ejecutó):** publicar un theme y volver a publicar el anterior, y el historial de versiones del editor de código. Se marcan `[PRÁCTICA-GENERAL]` y se confirman en el Admin. Que Shopify conserve por sí mismo versiones completas anteriores del theme: `NOT_VERIFIED`; por eso la "versión previa" son los ZIP deterministas de `dist/` con su hash.
- **Reglas de empuje:** primero archivos de código y después JSON de plantilla (Shopify descarta en silencio los ajustes que el código aún no declara) `[DOC:theme/03F-sonnet-independent-completion-report.md § B]`; con `--ignore config/settings_data.json` si el editor ya se personalizó `[DOC:theme/03F-owner-wishlist-install-runbook.md paso 8]`; `theme pull` antes de editar si la dueña tocó el editor `[DOC:shipping/03F-owner-shipping-runbook.md § 13]`.

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-04 | S03 | Claude (OK) · Sí | **Antes de publicar:** corregir o reemplazar RC1.8 sin publicar con `shopify theme push --theme <id> --strict --path <theme-src> --ignore README.md` (más `--ignore config/settings_data.json` si aplica). Nunca `--live` | SR-04, SR-09 | `shopify theme list` mantiene el rol `unpublished`; `pull` + comparación con el ZIP = 96/96 (como en 03G, `[MEDIDO-03G]`) | Solo cambia la vista previa; nada público. Deshacer: empujar de nuevo el ZIP previo |
| RP-05 | S16 | Claude prepara, dueña publica · el theme sí; **sus consecuencias públicas no** | **Volver a RC1.7 sin tocar el theme vivo:** (1) crear un theme nuevo sin publicar con el contenido de `dist/radaelli-shopify-theme-rc1.7.zip` (por el Admin con Subir ZIP, o extrayendo el ZIP a una carpeta y `shopify theme push --unpublished --path <carpeta>`; ninguna de las dos vías se ejecutó nunca con RC1.7 `[INFERIDO]`); (2) confirmar SHA-256 `5bea536f102a80fd206de797b0c59dff4687558e75232d5833f541709cdc4b0b`; (3) vista previa y matriz mínima (§ 13, VR-6); (4) la dueña lo publica | SR-04. RC1.7 y RC1.8 difieren en 1 archivo | `shopify theme list` con el theme nuevo en `[live]`; `/` y 3 fichas con 200; la ficha muestra la miga de RC1.7 | Ver "Efectos laterales" abajo. Deshacer: publicar RC1.8 de nuevo |
| RP-06 | S16 | Dueña · el theme sí | Publicar el theme anterior a Radaelli: Dev Store → Horizon `189072113983` (sigue en la biblioteca); tienda comercial → el theme de fábrica de esa tienda (nombre `NOT_AVAILABLE`). Admin > Tienda online > Temas > Publicar `[PRÁCTICA-GENERAL]`. Es el "Rollback" de CT-45 en el cutover `[DOC:launch/03G-cutover-runbook.md CT-45]` | SR-04 | `shopify theme list` con `[live]` en el theme elegido; `/` con 200 | Se pierde la marca: no es un fallback "de marca". Usar solo si RC1.7 también falla |
| RP-07 | S09/S10/S16 | Claude (OK) · Sí | Revertir ajustes sin cambiar código: `free_shipping_rate_confirmed=false`, `cart_free_shipping_progress=false`, `wishlist_account_sync=false` (este último en Editor > Configuración del tema > Wishlist) | SR-09 | T11: banner, ficha y carrito no prometen envío gratis; hoy ambos `false` `[MEDIDO-03G]` | Un push de `settings_data.json` desde `theme-src` apaga también el embed de favoritos. Deshacer: reactivar en el editor |

**Efectos laterales de cambiar de theme**

- **Favoritos (`page.wishlist`):** el Admin solo ofrece plantillas del theme publicado `[DOC:theme/03B-store-foundation-report.md]`. En un theme sin esa plantilla, la página pasa a la plantilla por defecto `[INFERIDO]`; `?view=wishlist` deja de mostrar la vista de favoritos.
- **SEO:** `noindex` en búsqueda, favoritos y 404, canonical, hreflang y JSON-LD salen del theme Radaelli `[DOC:seo/03F-seo-final-validation.md]`; con otro theme cambian `[INFERIDO]`. El `robots.txt` de Shopify no bloquea `/search` `[DOC:theme/03E-commercial-readiness-report.md]`.
- **No cambian** (viven en la tienda, no en el theme) `[INFERIDO]`: productos, colecciones, menús, páginas, redirecciones, metacampos.
- **Textos:** `locales/es.default.json` es de RC1.8; otro theme puede mostrar textos en inglés `[INFERIDO]`.
- **Configuración hecha en el editor:** un theme nuevo arranca con lo que trae su ZIP. Lo personalizado después en el theme vivo (medios cableados en `templates/index.json` y `templates/product.json`, embed y ajustes de favoritos, flags de `settings_data.json`) no se copia solo: se reaplica desde el `theme pull` de SR-04/SR-09 y el snapshot de RP-45, empujando primero código y después JSON de plantilla, y con `--ignore config/settings_data.json` donde corresponda `[INFERIDO]`, con base en `[DOC:theme/03F-sonnet-independent-completion-report.md § B]` y `[DOC:theme/03F-owner-wishlist-install-runbook.md paso 8]`.
- **Checkout:** es nativo y no depende del theme `[MEDIDO-03G]` checkout audit § 4.
- **App embeds:** se activan por theme; en el theme nuevo vienen desactivados `[DOC:theme/03F-owner-wishlist-install-runbook.md paso 4 y paso 14]` (regla probada al instalar y reinstalar la app; para un cambio de theme es `[INFERIDO]`).

### 8.2 DNS, dominio y reanudación del sitio actual (S15, S16, S11)

- **Disparadores:** los del cutover RB-01 (el dominio no resuelve a Shopify o el HTTPS es inválido), RB-02 y RB-03 cuando la dueña decide el rollback total (§ 6.1); SY-12; SY-04…SY-06 con DR-02.
- **Tiempo:** propagación "minutos a horas según TTL" `[DOC:launch/evidence/reference-docs/migration-roadmap.md § 18]` `[DOC:launch/03G-cutover-runbook.md V-DNS]`. Duración del redeploy de Vercel: `NOT_AVAILABLE`. Proveedor de DNS y TTL: `NOT_AVAILABLE` (D-CT3).
- **Qué permite:** el roadmap describe el rollback como "volver a apuntar el DNS a Vercel" mientras el sitio actual no se haya desmantelado, y el cambio exige acceso de la dueña al proveedor `[DOC:launch/evidence/reference-docs/migration-roadmap.md § 17, § 18]`. En T0 el cutover cambia **solo** los registros web (apex y `www`) y no toca MX, TXT ni CAA `[DOC:launch/03G-cutover-runbook.md CT-61]`; el rollback restaura solo esos. El proveedor, los registros y las IPs no están en ninguna fuente y no se inventan.
- **Orden:** el cutover ejecuta S16 (publicar el theme en T-1h, CT-45; quitar la contraseña en T-15m, CT-51) **antes** de S15 (DNS en T0, CT-61). El rollback total va al revés. **Diferencia con el cutover (D-15):** el cutover pone la reanudación del sitio actual (RP-10) y el ajuste de su stock (RP-52) **después** de devolver el DNS: § 5.2 fila "Rollback" ("después de devolver el DNS"), CT-42 y § 8.3 ("devolver el DNS (RP-12, RP-13), reactivar Wompi y pedidos en el sitio actual (RP-11, RP-52, RP-10)") `[DOC:launch/03G-cutover-runbook.md]`. Este plan propone el orden inverso, con RP-10 y RP-52 **antes** de RP-12, por dos razones `[INFERIDO]`: (a) con el DNS todavía en Shopify, el sitio actual solo se alcanza por la URL del proyecto de Vercel, así que reanudarlo y ajustar su stock no lo expone a clientas; (b) con la pausa activa (D-CT2 = A) el panel `/admin` no puede escribir stock porque la pausa cubre "esta app entera" `[DOC:launch/03G-cutover-runbook.md § 5.2]`, de modo que RP-52 no se puede hacer antes de RP-10, y si RP-10 va después del DNS el checkout queda abierto antes de ajustar el stock. Costo de este orden: entre RP-16 (URL de eventos de vuelta) y RP-10 los eventos de Wompi llegan a un sitio todavía pausado (503; Wompi reintenta). Mientras el cutover y este plan no se alineen, vale la decisión escrita de la dueña.

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-08 | S15 | Dueña · Sí | **Antes de S15:** capturar SR-01 (todos los registros: web, correo, TXT, CAA) y el TTL; bajar el TTL de los registros web con una antelación mayor o igual al TTL anterior (si el TTL anterior es mayor que el tiempo que falta hasta T0, se mueve T0); no subirlo hasta cerrar la ventana de rollback `[DOC:launch/03G-cutover-runbook.md CT-13, CT-33, CT-94, V-DNS]` | SR-01, SR-02; D-CT3 | Pantalla del proveedor con registros y TTL nuevos; los resolvers ya muestran el TTL bajo (CT-33) | Más consultas al DNS `[PRÁCTICA-GENERAL]`. Deshacer: subir el TTL solo tras cerrar la ventana (CT-94) |
| RP-09 | S15/S16 | Claude (lectura) + dueña · Sí | **Comprobar que el sitio actual está listo para volver:** entrar al panel `/admin` por la URL del proyecto de Vercel, que no depende del dominio (CT-14: la app puede redirigir al dominio configurado, `[NOT_VERIFIED]`); el commit desplegado es el de SR-02; la cuenta y las llaves de Wompi siguen sin rotar `[DOC:launch/03G-cutover-runbook.md CT-14, § 9.1]`. Las rutas del sitio actual (`/`, `/oasis-natural`, una ficha, `/checkout`) se miran por esa URL, no por el dominio (que ya apunta a Shopify) | CU-01…CU-06; SR-02 | Panel accesible por la URL del proyecto; 200 en las rutas si la app no redirige al dominio | Solo lectura. Si el panel no abre por la URL del proyecto: resolverlo antes de mover el DNS. Con la pausa activa (D-CT2 = A), que el ingreso al panel funcione es `NOT_VERIFIED`: la pausa bloquea las escrituras de sesiones `[DOC:launch/03G-cutover-runbook.md § 5.2]` y no consta si el ingreso crea una sesión `[INFERIDO]` |
| RP-10 | S16/S11 | Dueña · Sí | **Reanudar escrituras del sitio actual** (solo si se pausó, D-CT2 = A): en Vercel (Production) quitar `WRITES_PAUSED` y redeployar el **mismo commit** que servía antes; en este plan va **antes** de devolver el DNS; el cutover lo pone **después** (§ 5.2, CT-42, § 8.3): ver D-15 y el "Orden" de este § 8.2 `[DOC:launch/03G-cutover-runbook.md]` | RP-09; SR-02 | Pantalla de Vercel: la variable ya no está y hay un deployment de producción **posterior** en estado listo. Prueba funcional sin crear datos: `NOT_AVAILABLE` | Con la pausa activa el webhook de Wompi responde 503 (Wompi reintenta) y los crons se saltan corridas `[DOC:docs/incident-response.md]`. El interruptor solo existe en el deployment que incluye `lib/system/write-pause.ts`; que el de producción vigente lo incluya es `NOT_VERIFIED`, y al redeployar hay que confirmar que se despliega el mismo commit. Duración: `NOT_AVAILABLE`. Deshacer: volver a poner `WRITES_PAUSED=true` y redeployar |
| RP-11 | S11 | Dueña · Sí | **Restaurar Wompi para el sitio actual:** desactivar Wompi en Shopify o volver a llaves de prueba (RP-15, RP-17) y poner la URL de eventos de **producción** en el valor de SR-03 (el webhook del sitio actual es `/api/webhooks/wompi` `[DOC:seo/03E-redirect-plan.md § 5.6]`); si el staging del pentest cedió su URL de pruebas, restaurarla | RP-15; SR-03 | Panel de Wompi con la URL restaurada; VR-5 | Es la misma acción que RP-16 en producción: se hace una vez. Mientras la URL apunte a Shopify, el sitio actual no recibe eventos `[DOC:launch/03G-cutover-runbook.md CT-46]`, y un redirect no sirve (el webhook es POST) `[DOC:seo/03E-redirect-plan.md § 5.6]`. Wompi reintenta a los 30 min, 3 h y 24 h `[DOC:payments/03F-wompi-owner-runbook.md § 5.1]`. Red de seguridad: el cron `release-stale-payments` corre una vez al día (`0 9 * * *`, `vercel.json`) y con la pausa activa se salta; un `PENDING` viejo se compara con el panel de Wompi y no se cancela a mano sin verificar allí `[DOC:launch/03G-cutover-runbook.md § 5.2]` |
| RP-12 | S15 | Dueña · técnicamente sí; **los efectos (PNR-1, PNR-7) no** | **Devolver los registros web (apex y `www`)** a los valores de la hoja privada (SR-01). No tocar MX, TXT ni CAA `[DOC:launch/03G-cutover-runbook.md CT-61, V-DNS]` | RP-09, RP-10, RP-11; decide la dueña (DR-01) | El proveedor muestra los valores de SR-01 y VR-1 responde como el sitio actual | Durante la propagación conviven los dos sitios y ambos pueden recibir pedidos `[INFERIDO]` (el roadmap solo advierte de una "ventana de inconsistencia de stock/pedidos" en el corte `[DOC:launch/evidence/reference-docs/migration-roadmap.md § 17 fase 10]`). Certificado HTTPS tras el cambio: `NOT_VERIFIED` (V-SSL). Deshacer: volver a apuntar a Shopify con los registros que muestre su pantalla de dominios (S15) |
| RP-13 | S15 | Claude (lectura) + dueña · n/a | Repetir VR-1 y `nslookup radaelliswimwear.com` contra dos resolvers públicos hasta que respondan como el sitio actual `[DOC:launch/03G-cutover-runbook.md V-DNS]`; luego un **pedido de bajo monto de la dueña**, completo de punta a punta y visible en `/admin` (CT-47 en sentido inverso) | RP-12 | VR-1, VR-2, VR-5 | Desde aquí hay pedidos posibles en dos sistemas: § 8.10. El pedido de prueba es real (mueve dinero y puede generar comisiones de la pasarela `[INFERIDO]`): registrarlo en la hoja de RP-49 |
| RP-14 | S15 | Dueña · Sí | **Después**, con el sitio actual estable: quitar el dominio de la tienda Shopify o dejarlo conectado. No quitarlo hasta cerrar § 8.10 | § 8.10 cerrada | Admin de Shopify, pantalla de dominios (nombre exacto `[NOT_VERIFIED]`, CT-55) | Los enlaces de estado de pedido enviados por correo pueden depender de ese dominio `[INFERIDO]`. Efecto de dejarlo conectado: `NOT_VERIFIED` |

**Efectos laterales del rollback de DNS**

- **301 cacheados (RP-40):** navegadores y buscadores cachean los 301 `[DOC:seo/03E-redirect-plan.md § 5.3]`; las rutas viejas (`/producto/<slug>`) que ya saltaron a `/products/<handle>` pueden seguir enviando a esa ruta, que el sitio actual no tiene `[INFERIDO]`.
- **Search Console:** es la misma propiedad de dominio (no hace falta Change of Address) `[DOC:seo/03E-redirect-plan.md § 7]`; la volatilidad de ranking puede repetirse en sentido inverso `[INFERIDO]`.
- **Carritos y sesiones no se transfieren** entre Shopify y el sitio actual `[INFERIDO]` (el sitio actual guarda el carrito en `localStorage` y Prisma `[DOC:launch/evidence/reference-docs/architecture-map.md]`).
- **Rutas que vuelven:** `/checkout` y el blog (3 posts) responden 200 hoy en el sitio actual `[MEDIDO-03G]`; `/api/webhooks/wompi` y `/checkout/wompi/retorno` existen en el sitio actual y dejan de existir al mover el DNS a Shopify `[DOC:seo/03E-redirect-plan.md § 5.6]` (03G no las midió: el webhook es POST); los crons se reactivan con el redeploy `[DOC:launch/03G-cutover-runbook.md § 9.1]`.
- **Rezagados por DNS:** con D-CT2 = B el sitio actual puede recibir pedidos rezagados tras T0 (CT-75); en el rollback pasa lo inverso con la tienda Shopify: los pedidos que lleguen a Shopify durante la propagación se atienden desde su Admin (§ 8.10).

### 8.3 Pagos (S11)

- **Disparadores:** SY-02, SY-04, SY-05, SY-06, SY-20.
- **Tiempo:** Shopify recomienda a las apps de pago que un pendiente venza en "3 días como máximo" `[DOC:payments/03F-wompi-owner-runbook.md § 9 caso 3]` `[DOC:payments/03E-wompi-shopify-feasibility.md E24]`; que la app de Wompi use ese estado pendiente y ese plazo es `NOT_VERIFIED` (03E, § 9 pendientes); Wompi reintenta eventos a los 30 min, 3 h y 24 h `[DOC:payments/03F-wompi-owner-runbook.md § 5.1]`. Lo demás: `NOT_AVAILABLE`.
- **Qué permite Shopify (fuente):** desactivar el proveedor en Configuración > Pagos y desinstalar la app; al reinstalar, la configuración puede no restaurarse `[DOC:payments/03F-wompi-owner-runbook.md N21]`; la pasarela de prueba no convive con un proveedor de tarjeta activo `[DOC:payments/03F-wompi-owner-runbook.md N8, N9]`; un reembolso desde el Admin llama a la app y, si esta falla, se reintenta a mano `[DOC:payments/03F-wompi-owner-runbook.md N13, N17]`.
- **Estado de referencia:** "ningún proveedor activo" `[MEDIDO-03G]`.

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-15 | S11 | Dueña · Sí | Configuración > Pagos > Wompi > **Desactivar** `[DOC:payments/03F-wompi-owner-runbook.md P4.5]`. Es la acción que el cutover pide en AB-03 y `RB-03` `[DOC:launch/03G-cutover-runbook.md § 8]` | S11 | Pagos sin proveedor; checkout con el mensaje de "no puede aceptar pagos" `[MEDIDO-03G]` | Pagos en vuelo sin pedido (RP-20). Deshacer: Activar |
| RP-16 | S11 | Dueña · Sí | Restaurar en el panel de Wompi la URL de eventos al valor de SR-03: pruebas (P2.2/P6.2 del runbook de Wompi) y producción (valor anotado al cortar) | SR-03 | El campo muestra el valor anotado | Hasta restaurar, la integración de Shopify o el sitio custom deja de recibir eventos. Deshacer: pegar de nuevo la URL de eventos de Shopify (sección 5.1 del runbook de Wompi) |
| RP-17 | S11 | Dueña · con pérdida de configuración | **Alternativa suave (la del cutover, CT-46 y AB-03):** volver a las llaves de **prueba** en el formulario de la app, sin desinstalar `[DOC:launch/03G-cutover-runbook.md CT-46]`. **Alternativa dura:** Configuración > Apps > Wompi > Desinstalar, tras borrar las llaves del formulario. Si hubo llaves de producción cargadas y hay duda de exposición, rotarlas en Wompi `[PRÁCTICA-GENERAL]` | RP-15, RP-16 | La app ya no figura (dura) o figura con llaves de prueba (suave); Pagos sin proveedor activo | Al reinstalar la configuración puede no volver `[DOC:payments/03F-wompi-owner-runbook.md N21]`. Deshacer: reinstalar y cargar llaves (solo la dueña) |
| RP-18 | S11/S14 | Dueña · Sí | Si está la pasarela de prueba, desactivarla `[DOC:payments/03F-wompi-owner-runbook.md P10.1]` | — | Pagos sin proveedor | Los pedidos de prueba existentes siguen; no cuentan en reportes ni pagan comisión `[DOC:payments/03F-wompi-owner-runbook.md N8, E22, E27]` |
| RP-19 | S11 | Dueña · Sí | Restaurar Configuración > Checkout a SR-07 (método de contacto, teléfono de envío) `[DOC:payments/03F-wompi-owner-runbook.md P3.1]`. Wompi exige teléfono `[DOC:payments/03F-wompi-owner-runbook.md E11]`: restaurar solo después de RP-15 | SR-07; RP-15 | El checkout muestra el teléfono como antes ("(opcional)" hoy, `[MEDIDO-03G]`) | Si la dueña decide dejar el teléfono obligatorio, no se restaura |
| RP-20 | S11 | Dueña + Claude · Sí; **los cobros reales no** | **Drenar pagos en vuelo:** (1) listar pedidos con pago Pendiente y Checkouts abandonados recientes con pago en Wompi; (2) listar transacciones del periodo en el panel de Wompi (APPROVED, PENDING, DECLINED, VOIDED, ERROR); (3) cruzar por referencia y monto (Wompi trabaja en centavos: $199.920 = 19.992.000 `[DOC:payments/03F-wompi-owner-runbook.md § 9 caso 1]`); (4) esperar a que venzan los pendientes; (5) los casos abiertos van a RP-50 | RP-15; SR-03 | Hoja de conciliación con 0 filas abiertas | Sin este paso quedan "cobros sin pedido" `[DOC:launch/evidence/reference-docs/wompi-payments.md § 6E]` |

### 8.4 Envíos, mercado, país, moneda e idioma (S02, S10)

- **Disparadores:** SY-01, SY-03, SY-18.
- **Tiempo:** `NOT_AVAILABLE`. Propagación tras crear una zona: `NOT_VERIFIED` `[DOC:shipping/03F-owner-shipping-runbook.md § 16]`.
- **Qué permite Shopify (fuente):** pasar un mercado a **Borrador** conserva sus ajustes y es reversible; **Eliminar** es permanente `[DOC:theme/03F-owner-market-colombia-runbook.md § 6]`; la dirección de la tienda se vuelve a escribir; convertir un mercado en principal se repite en el otro (que debe estar Activo); quitar la última sucursal del grupo **borra** sus zonas y tarifas `[DOC:shipping/03F-owner-shipping-runbook.md § 9]`; la moneda de una tarifa no se actualiza sola `[DOC:shipping/03F-owner-shipping-runbook.md § 4]`.
- **Orden:** el orden inverso de lo hecho. Antes de eliminar la zona Colombia, revertir el mercado: con Colombia como país por defecto y sin zona, todo el catálogo vuelve a figurar agotado `[DOC:shipping/03F-owner-shipping-runbook.md § 12]`.

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-21 | S10 | Claude (OK) · Sí | Cerrojo: `free_shipping_rate_confirmed=false` (y `cart_free_shipping_progress=false`), push al theme y restaurar `threshold_note` y `envios` `[DOC:shipping/03F-owner-shipping-runbook.md § 12 pasos 1–2]` | SR-09 | T11: banner, ficha y carrito no prometen envío gratis; hoy `false` `[MEDIDO-03G]` | Desaparece la promesa de $299.900 aunque la tarifa exista. Deshacer: encender cuando T1–T7 y T10 pasen `[DOC:shipping/03F-owner-shipping-runbook.md § 13]` |
| RP-22 | S10 | Dueña · Sí | Editar o eliminar **una** tarifa de la zona Colombia; nunca dejar *Price* vacío (vacío = gratis) `[DOC:shipping/03F-owner-shipping-runbook.md § 1, § 12]` | SR-06 | `estimate()` y T1–T7 del runbook de envío | Quitar el tramo bajo $299.900 deja sin envío las compras de 1 prenda (todas están bajo el umbral) `[DOC:shipping/03F-owner-shipping-runbook.md § 7.1]`. Deshacer: recrear con SR-06 |
| RP-23 | S10/S02 | Dueña · Sí, recreando a mano | Devolver la Dev Store al estado inicial: cerrojo → textos → cupones de prueba → zona EE. UU. → mercado (M7 y M5 al revés) → zona Colombia → sucursal → verificar `[DOC:shipping/03F-owner-shipping-runbook.md § 12]` | SR-06 | V2 y V4 del runbook de mercado con país US (29/29 disponibles) y con CO (agotado si se eliminó la zona) | Recrear la zona de EE. UU. exige la captura E3 (de fábrica: Standard 8,00, Express 15,00, gratis desde 70,00; moneda a confirmar `[DOC:shipping/03F-owner-shipping-runbook.md § 12 punto 4]`) |
| RP-24 | S02 | Dueña · Sí (Borrador); **Eliminar no** | Mercados: Colombia y EE. UU. entre Activo y Borrador; volver a hacer principal el que corresponda (M5/M7 al revés). **Nunca Eliminar** `[DOC:theme/03F-owner-market-colombia-runbook.md § 6, § 12]` | SR-06 | V2, V4, V7 (`/` y `/en` con 200) del runbook de mercado | Si `/en` pertenecía a un mercado con subcarpeta, su URL deja de funcionar al pasarlo a Borrador `[DOC:theme/03F-owner-market-colombia-runbook.md § 11]`. Deshacer: Activo |
| RP-25 | S02/S10 | Dueña · Sí | Restaurar la dirección de la tienda y de la sucursal a las capturas (A1, E4). **No** quitar la sucursal del grupo `[DOC:shipping/03F-owner-shipping-runbook.md § 9]` | SR-06 | Configuración > General y Sucursales con los valores capturados | La lista de proveedores de pago se filtra por la dirección de la tienda `[DOC:theme/03F-owner-market-colombia-runbook.md § 9]`; efecto sobre impuestos: `NOT_VERIFIED` |
| RP-26 | S01/S02 | — | **País, moneda base e idioma predeterminado de la tienda comercial: sin rollback** (§ 9, I-05 e I-06). Se fijan bien en S01/S02 antes del primer pedido | — | — | — |


### 8.5 Apps (S08, S09, S12)

- **Disparadores:** SY-13…SY-16.
- **Tiempo:** el interruptor de favoritos es instantáneo `[DOC:theme/03F-owner-wishlist-install-runbook.md § 1]`. Lo demás: `NOT_AVAILABLE`.
- **Qué permite Shopify (fuente):** desinstalar una app (la configuración puede no restaurarse al reinstalar `[DOC:theme/03F-search-discovery-owner-runbook.md S8]`); los app embeds vienen desactivados al instalar `[DOC:theme/03F-owner-wishlist-install-runbook.md paso 4]`; volver a una versión anterior de la configuración y extensiones de la app con `shopify app release --version <anterior>` (`INFERENCIA` `[DOC:theme/03F-owner-wishlist-install-runbook.md § 7]`).
- **Estado de referencia:** solo Translate & Adapt instalada (se instaló en 03B para agregar Español y **no se revierte**) `[MEDIDO-03G]` `[DOC:theme/03B-store-foundation-report.md]`.

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-27 | S08 | Dueña (OAuth) + Claude · Sí; desinstalar puede perder configuración | **Search & Discovery.** Nivel 1: editar o quitar el filtro mal configurado. Nivel 2: Disponibilidad oculta (`collection_show_availability_filter=false`, ya está `[MEDIDO-03G]`). Nivel 3: quitar Talla y Color. Nivel 4 (último recurso): desinstalar. Antes de desinstalar, capturar la lista de Filters (S12 del runbook de Search & Discovery) | SR-08 | El panel muestra solo lo que devuelve `collection.filters`; si está vacío el theme no dibuja ningún grupo y no da error `[DOC:theme/03F-search-discovery-owner-runbook.md § 9]` | Qué pasa con los filtros al desinstalar: `NOT_VERIFIED` (solo un indicio de 2022, S9). **No usar la desinstalación como primer rollback.** Deshacer: reinstalar (OAuth de la dueña) y reconstruir la lista capturada |
| RP-28 | S08/S12 | Dueña · Sí | **Google & YouTube:** en la app, desconectar la integración de Google Analytics, o desinstalar la app `[DOC:analytics/03F-analytics-owner-runbook.md § 16]` | SR-11 | La app figura desconectada; GA4 deja de recibir eventos | La propiedad de GA4 y su historial quedan en Google. Lo ya enviado no se retira (PNR-3). Deshacer: reconectar (OAuth de la dueña) |
| RP-29 | S08/S12 | Dueña · Sí | **Facebook & Instagram:** volver el nivel de Data sharing a **Standard** y/o desconectar la cuenta en el canal `[DOC:analytics/03F-analytics-owner-runbook.md § 16, P-18]` | SR-11 | Ajuste en Standard; canal desconectado | Lo ya compartido con Meta no se recupera (PNR-3). El dataset queda en Meta. Deshacer: reconectar |
| RP-30 | S12 | Claude (OK) o dueña · Sí | **Custom pixel:** Customer events > el pixel > **Disconnect** (deja de rastrear sin borrarlo) o `ENABLED:false` `[DOC:analytics/03F-analytics-owner-runbook.md § 16, P2]` | — | Hoy ya está apagado (`ENABLED:false`, IDs vacíos) `[MEDIDO-03G]` | Ninguno. Deshacer: Connect |
| RP-31 | S12/S16 | Dueña · Sí | **Banner de cookies:** reactivar los ajustes automáticos `[DOC:analytics/03F-analytics-owner-runbook.md § 16]`. Hacerlo **después** de RP-28…RP-30 | RP-28…RP-30 | Configuración > Privacidad del cliente > Banner de cookies con los ajustes automáticos | Fuera de UK y EEE, sin banner rige "permitir todo" `[DOC:analytics/03F-analytics-owner-runbook.md § 5]`: no dejar apps de analítica conectadas sin banner en Colombia |
| RP-32 | S09 | Dueña + Claude · Sí (instantáneo) | **Favoritos, nivel 1:** interruptor `wishlist_account_sync` en OFF en el Editor del theme Radaelli (Configuración > Wishlist). Nunca en Horizon; nunca por push de `settings_data.json` `[DOC:theme/03F-owner-wishlist-install-runbook.md § 3 "Interruptor"]` | S09 | El theme vuelve a modo invitada: corazones en el navegador y **ninguna** llamada a `/apps/radaelli/wishlist` (Network) | Sin pérdida de datos `[DOC:theme/03F-owner-wishlist-install-runbook.md § 4]`. Deshacer: encender solo tras los GO/NO-GO |
| RP-33 | S09 | Dueña + Claude · Sí | **Nivel 2:** app embed "Favoritos en la cuenta" en OFF (Editor > App embeds) | RP-32 | Con sesión, no se carga `wishlist-transport.js` | Sin transporte, `wishlist.js` ignora el bloque de cuenta `[DOC:theme/03F-owner-wishlist-install-runbook.md § 3 paso 14.5]` |
| RP-34 | S09 | Dueña · Sí | **Nivel 3:** detener la función (el backend de favoritos, alojado fuera de Shopify) | RP-33 | `curl.exe -i https://<HOST>/` deja de responder (host `NOT_AVAILABLE`) | Todo queda pendiente en el navegador sin perder nada; "Quitar" en la extensión da error `[DOC:theme/03F-owner-wishlist-install-runbook.md § 7]`. Deshacer: arrancar `node server/server.mjs` |
| RP-35 | S09 | Dueña + Claude · Sí (`INFERENCIA`) | **Nivel 4:** `shopify app release --version <anterior>` `[DOC:theme/03F-owner-wishlist-install-runbook.md § 7]` | RP-34 | Versión activa en el Dev Dashboard | `INFERIDO` como rollback: no se probó |
| RP-36 | S09 | Dueña · reinstalable; **la custom distribution no** | **Nivel 5:** Configuración > Apps > Radaelli Favoritos > Desinstalar | RP-32…RP-34 | Desaparecen la extensión "Mis favoritos" y su ítem de menú, el app proxy, el app embed y el token de Admin. **Verificar la ruta real del proxy, `/apps/radaelli/wishlist`** (el snapshot 03G midió `/apps/wishlist`: § 15, D-02) | Ver "Qué queda huérfano" abajo. Deshacer: reinstalar con el link de custom distribution; los embeds vuelven desactivados `[DOC:theme/03F-owner-wishlist-install-runbook.md § 3 paso 14.7]` |

**Qué queda huérfano por app**

| App | Queda huérfano | Fuente |
|---|---|---|
| Favoritos | Definición y valores de `custom.wishlist` (metacampo de clienta del comercio, namespace `custom`, no `$app`); que sobrevivan a la desinstalación es `INFERENCIA` hasta el paso 14 del runbook. El hosting de la función sigue corriendo (proveedor `NOT_AVAILABLE`). La app DEV en el Dev Dashboard, atada a la tienda por la custom distribution. Favoritos de invitada en los navegadores. El app proxy `/apps/radaelli/wishlist` deja de responder | `[DOC:app/README.md § 2]` · `[DOC:theme/03F-owner-wishlist-install-runbook.md § 3 paso 14, § 7]` |
| Search & Discovery | Configuración de filtros (efecto de desinstalar: `NOT_VERIFIED`) | `[DOC:theme/03F-search-discovery-owner-runbook.md § 9]` |
| Google & YouTube | Propiedad de GA4 y su historial; ajustes de consentimiento | `[DOC:analytics/03F-analytics-owner-runbook.md § 16]` |
| Facebook & Instagram | Dataset o pixel en Events Manager y lo ya compartido con Meta | ídem |
| Wompi | Transacciones y llaves en el panel de Wompi; su URL de eventos; pedidos y reembolsos en Shopify | `[DOC:payments/03F-wompi-owner-runbook.md]` |
| Custom pixel | Pixel guardado y desconectado en Customer events | `[DOC:analytics/03F-analytics-owner-runbook.md § 16]` |
| Translate & Adapt | Idioma Español "sin traducciones" y sus ajustes (se conserva) | `[MEDIDO-03G]` snapshot `locales` |

### 8.6 Redirecciones (S06)

- **Disparadores:** SY-09, SY-10, SY-21.
- **Tiempo:** importar el CSV toma ≈ 1 minuto `[DOC:seo/03F-redirect-import-result.md § 4]`. Eliminar todas: `NOT_AVAILABLE`.
- **Qué permite Shopify (fuente):** eliminar todas las redirecciones deja la lista en 0 sin afectar productos, colecciones ni theme `[DOC:seo/03F-redirect-import-result.md § 5]`; los redirects solo disparan en rutas que dan 404 `[DOC:seo/03E-redirect-plan.md § 7]`; el origen no distingue mayúsculas, conserva el query y acepta barra final `[DOC:seo/03F-redirect-import-result.md § 3]`; límite de 100.000 redirects (se usan 47) `[DOC:seo/03E-redirect-plan.md § 7 punto 6]`.

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-37 | S06 | Claude (OK) · Sí | Editar o eliminar **una** fila (Admin > Contenido > Menús > Redireccionamientos de URL) | SR-05 | `curl.exe -I https://<dominio>/<ruta>` devuelve el destino esperado del CSV, sin bucles | Si una ruta indexada pasa a 404 se pierde su URL: preferir corregir a eliminar. Deshacer: volver a agregar la fila |
| RP-38 | S06 | Claude (OK) · Sí | Seleccionar todas > **Eliminar**: la lista vuelve a 0 `[DOC:seo/03F-redirect-import-result.md § 5]` | SR-05 | La lista muestra 0; PDP y colecciones siguen con 200 | Con el dominio ya en Shopify, cada URL vieja indexada devuelve 404 mientras no haya redirecciones `[DOC:launch/evidence/reference-docs/seo-analytics.md § 9]`. Solo se justifica con el DNS de vuelta en el custom, o para reimportar de inmediato (RP-39) |
| RP-39 | S06 | Claude (OK) · Sí | Reimportar `seo/shopify-redirects-import.csv` (47 filas, encabezado exacto `Redirect from,Redirect to`; la vista previa debe decir 47), más las 4 filas legales cuando existan | SR-05 (hash `ba369467…18b1d6`); RP-38 | "Importación completada: se han agregado 47 redireccionamientos" y `node seo/validate-redirects.mjs` con PASS `[DOC:seo/03F-redirect-import-result.md § 1]` | Importar con la lista en 0 (como en 03F) evita conflictos de duplicados. Si la tienda de venta es otra, se repite el import con el mismo CSV `[DOC:seo/03F-redirect-import-result.md § 4]` |
| RP-40 | S06/S15 | Dueña (DR-09) · **no** | 301 cacheados tras un rollback total: aceptar el efecto o decidir una mitigación (cualquier mitigación toca el sitio custom y queda fuera de este plan) | — | Search Console > Páginas: "Página con redirección" y 404 durante 4–8 semanas `[DOC:seo/03E-redirect-plan.md § 7]` | Los 301 ya servidos siguen en navegadores y buscadores `[DOC:seo/03E-redirect-plan.md § 5.3]`; ninguna acción en Shopify los retira |

Mantener las redirecciones **al menos 1 año** una vez estable el lanzamiento (guía de Google citada en `[DOC:seo/03E-redirect-plan.md § 7 punto 6]`): no eliminarlas como "limpieza" después del corte.

### 8.7 Cuentas de clientas (S13)

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-41 | S13 | Dueña · Sí | Mitigación: ocultar los enlaces de acceso (ajuste "Mostrar enlaces de inicio de sesión" de Cuentas de cliente, hoy `true` `[MEDIDO-03G]`) | S13 | El header no muestra el acceso | Las clientas no pueden iniciar sesión desde el theme; compra como invitada: `NOT_VERIFIED` en 03G. Deshacer: volver a `true` |
| RP-42 | S13 | — | **No hay rollback del tipo de cuenta.** RC1.8 no trae plantillas `customers/*` ni formularios de contraseña (decisión 02L: sin cuentas Classic) `[DOC:theme/customer-accounts-decision.md]`; volver a cuentas clásicas exigiría rehacer el theme `[INFERIDO]` | — | `/account/login` y `/account/register` llevan a las páginas de Shopify (GO/NO-GO 9) `[DOC:theme/03F-owner-wishlist-install-runbook.md § 5]` | Las cuentas creadas en Shopify permanecen en Shopify (§ 8.11) |

### 8.8 Catálogo, colecciones, metacampos, media, menús y páginas (S04–S07)

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-43 | S04/S05 | Dueña o Claude (OK) · Sí; **eliminar no** | **Despublicar** productos o colecciones del canal de la tienda online (el repo no documenta la acción ni sus etiquetas: `[PRÁCTICA-GENERAL]`, sin medir en 03G); **nunca eliminarlos**: el borrado de un producto es permanente `[DOC:theme/03F-owner-wishlist-install-runbook.md 12.7]`. Excepción previa al lanzamiento: con la tienda bajo contraseña y sin pedidos, el plan de migración admite "borrar los productos importados y reimportar" (S04); cada borrado es irreversible y su efecto sobre IDs internos, membresías de colecciones y referencias de metacampos es `NOT_VERIFIED` (D-16) | SR-05 | El conteo 29/98/95 se mantiene en el Admin `[MEDIDO-03G]`; la ficha despublicada deja de responder `[INFERIDO]` | Despublicar rompe los destinos de las 47 redirecciones mientras dure. Deshacer: republicar |
| RP-44 | S04/S05 | Claude (OK) · **eliminar o renombrar handles: no** | **No** eliminar ni renombrar handles. Si se renombró uno: restaurarlo y correr `node seo/validate-redirects.mjs` y el `curl.exe -I` de las 47 | SR-05 | 38 filas con destino final 200 (29 productos, 4 colecciones y 5 más) y los 9 `/cuenta*` con su primer salto correcto: no siguen hasta un 200 por diseño `[MEDIDO-03G]` `launch/evidence/dev-routes.json`; `[DOC:launch/03G-cutover-runbook.md V-REDIR]` | Las filas del CSV apuntan a `/products/<handle>` y `/collections/<handle>`; un handle borrado no se recupera con su historial `[INFERIDO]` (§ 9, I-07) |
| RP-45 | S07 | Claude (OK) · Sí | **Media:** `node shopify-migration/scripts/apply-media-wiring.mjs --restore="<snapshot>"` (en seco por defecto; `--write` aplica) y push de los 2 templates; o vaciar los 9 ajustes en el Editor y los 4 metacampos de cada colección (`cover_image`, `image_pos_x`, `image_pos_y`, `zoom`) `[DOC:content/media/03F-media-owner-runbook.md § 9]` | Snapshot del cableado (conviene fijarlo con `--snapshot-dir`: `%TEMP%` se limpia `[DOC:content/media/03F-media-owner-runbook.md § 12 punto 5]`) | `templates/index.json` y `templates/product.json` idénticos al original (SHA-256 verificado) `[DOC:content/media/03F-media-owner-runbook.md § 9]` | Los archivos subidos quedan en Contenido > Archivos; **borrarlos es permanente** y deja referencias rotas si el theme aún los usa. Cloudinary no se toca `[DOC:content/media/03F-media-owner-runbook.md § 9]`. Fallback: hero decorativo, tarjetas con `collection.featured_image`, sin botón de guía de tallas (es el estado de hoy: no hay media subida `[MEDIDO-03G]`) |
| RP-46 | S06 | Claude (OK) o dueña · Sí | **Menús:** restaurar los 5 de SR-12 (`Main menu`, `Comprar`, `Ayuda`, `Footer menu`, `Customer account main menu`). **Páginas:** pasar a Hidden o Delete (el contenido sigue en `content/legal/`) `[DOC:theme/03F-legal-owner-runbook.md § 12]` | SR-12 | Header y footer muestran los menús del snapshot | Borrar una página deja de responder su URL y su redirect apunta a 404. Qué ve un visitante en una página oculta: `NOT_VERIFIED` (la comunidad reporta 404, fuente no oficial `[DOC:theme/03F-legal-owner-runbook.md § 5 nota de D-L3, § 14]`). Deshacer: recrear con el contenido verbatim |

**Metacampos y metaobjetos (S05):** vaciar valores, **no borrar definiciones que ya tengan datos** (para `custom.wishlist` el efecto de borrar con datos es `NOT_VERIFIED` `[DOC:theme/03F-owner-wishlist-install-runbook.md § 7]`; para las demás es `[INFERIDO]`).

### 8.9 Retorno al sitio custom: qué debe seguir vivo y sin cambios

"Sin cambios" = sin merges, deploys, migraciones de base, cambios de catálogo ni de configuración de producción durante la ventana `[PRÁCTICA-GENERAL]`. Única excepción: pausar y reanudar escrituras con `WRITES_PAUSED` (D-CT2 = A) `[DOC:launch/03G-cutover-runbook.md § 5.2]`. El cutover ya lo dice: el sitio actual "se conserva; no se apaga ni se desmantela" y "apagar" se traduce a "dejar de recibir ventas" `[DOC:launch/03G-cutover-runbook.md § 3 DIF-01, § 9.1]`.

| ID | Componente | Por qué | Verificación | Costo |
|---|---|---|---|---|
| CU-01 | Proyecto de Vercel con `radaelliswimwear.com` asignado y el deployment de producción de SR-02. Su URL propia puede seguir pública y sirviendo el sitio actual; si está indexada o protegida es `NOT_VERIFIED`, y proteger ese acceso sin apagarlo es decisión de la dueña `[DOC:launch/03G-cutover-runbook.md § 9.1]` | Es el destino del DNS (RP-12) | Panel de Vercel; RP-09 | `NOT_AVAILABLE` (plan actual desconocido `[DOC:launch/evidence/reference-docs/cost-comparison.md § 15]`) |
| CU-02 | Base de producción en Neon (pedidos, clientas, stock, favoritos) | Única fuente de los pedidos previos y del stock `[DOC:source-of-truth/data-model-audit.md]` | Respaldo de SR-10 | ídem |
| CU-03 | Cloudinary (imágenes y videos del custom) | El custom las referencia; el flujo de media de Shopify no escribe en Cloudinary `[DOC:content/media/03F-media-owner-runbook.md § 9]` | Fichas del custom con imágenes | ídem |
| CU-04 | Resend (correos transaccionales del custom) | Confirmaciones y avisos tras el rollback | Pedido de prueba de la dueña | ídem |
| CU-05 | Cuenta de Wompi, llaves de producción del custom y su webhook `/api/webhooks/wompi` | RP-11 | Panel de Wompi (SR-03) | ídem |
| CU-06 | Panel `/admin` del custom y sus accesos, alcanzable por la URL del proyecto de Vercel (tras T0, `radaelliswimwear.com/admin` ya no llega al sitio actual) | Operar pedidos y stock durante y tras el rollback | Ingreso de la dueña por esa URL (CT-14) | — |
| CU-07 | Dominio y registros DNS originales (SR-01) | RP-12 | Pantalla del proveedor | — |
| CU-08 | Staging del pentest y su Wompi Sandbox | Independiente; no debe perder su URL de eventos de pruebas (G3) `[DOC:payments/03F-wompi-owner-runbook.md § 6]` | SR-03 | — |
| CU-09 | Código del custom en la rama de producción, sin cambios | El rollback vuelve exactamente al estado que se capturó | Commit de SR-02 | — |
| CU-10 | Cron `release-stale-payments` (una vez al día, `vercel.json`) | Concilia pagos viejos contra Wompi; con la pausa activa se salta y el redeploy lo reactiva `[DOC:launch/03G-cutover-runbook.md § 5.2, § 9.1]` | Pantalla de Vercel > Crons (nombre exacto `NOT_VERIFIED`) | ídem |

**Hasta cuándo.** El roadmap dice "no desmantelar ni dar de baja Vercel/Neon/el código actual hasta tener varias semanas de operación estable confirmada en Shopify" y "mantener el sistema actual intacto y pagado varias semanas post-corte" `[DOC:launch/evidence/reference-docs/migration-roadmap.md § 18, § 20]`. **No hay fecha** en ninguna fuente (DR-08). Condiciones, todas `[PRÁCTICA-GENERAL]`:

1. Conciliación de pedidos cerrada (§ 8.10) y sin rollback pendiente.
2. Search Console sin 404 sin explicar tras la vigilancia de 4–8 semanas `[DOC:seo/03E-redirect-plan.md § 7]`.
3. Historial de pedidos y clientas archivado o importado (DR-06): la base de Neon es ese historial y **no** se migra por defecto `[DOC:launch/03G-cutover-runbook.md § 9.1]`. La retención de backups de Neon no está confirmada `[DOC:docs/production-recovery.md]`.
4. Decisión escrita de la dueña (DR-08 = D-CT13, compuerta G8 del cutover; si no la deja escrita, el sitio actual se conserva por defecto `[DOC:launch/03G-cutover-runbook.md G8]`).

### 8.10 Pedidos: preservación y conciliación

**Hechos de partida**

- Los pedidos creados en Shopify **no existen** en la base del sitio custom, y los del custom no están en Shopify salvo que se importen (herramienta "REQUIERE DECISIÓN": DR-06) `[DOC:launch/evidence/reference-docs/data-migration.md]` (ORDERS).
- Numeración: Shopify numera sus propios pedidos; el custom empieza en 1000. Preservar números exige configuración explícita al crear la tienda (S01) `[DOC:launch/evidence/reference-docs/data-migration.md]`. En la hoja privada usar los prefijos `SHOP-` y `WEB-` para no confundirlos `[PRÁCTICA-GENERAL]`.
- Stock: el custom lo descuenta al **iniciar** el pago `[DOC:source-of-truth/data-model-audit.md]`; en Shopify el inventario **no** se rastrea (98/98) `[MEDIDO-03G]`. El stock vendido en Shopify solo se ve en las líneas de pedido.
- Pedidos de prueba (S14): con la pasarela de prueba o Wompi en modo prueba no cuentan en reportes ni pagan comisión `[DOC:payments/03F-wompi-owner-runbook.md N8, E22, E27]`; excluirlos de la hoja. Su marca de "prueba" en el pedido: `NOT_VERIFIED` (NV12).
- **El pedido de CT-47 es real:** la dueña paga con su tarjeta el producto más barato y lo reembolsa desde Shopify; el reembolso hacia Wompi es `NOT_VERIFIED` (NV6) `[DOC:launch/03G-cutover-runbook.md CT-47, V-PAGO-PROD]`. Va en la hoja como "prueba de producción", con su transacción de Wompi y su reembolso.
- **Rezagados del cutover:** con D-CT2 = B el sitio actual puede recibir pedidos rezagados tras T0 (CT-75); con A ninguno `[DOC:launch/03G-cutover-runbook.md § 5.2]`. La conciliación de 24 h del cutover (CT-91) es el primer corte de la hoja de RP-49.
- El historial de pedidos y clientas del sitio actual no se migra por defecto (D-CT12) `[DOC:launch/03G-cutover-runbook.md § 9.1]`.

| ID | S## | Quién · Reversible | Paso | Depende de | Evidencia de que quedó bien | Efectos secundarios y cómo deshacer |
|---|---|---|---|---|---|---|
| RP-47 | S11/S16 | Dueña · Sí | **Congelar la entrada de pedidos en Shopify** (RP-01, RP-02 o RP-03 según DR-05) **antes** de exportar y de devolver el DNS | DR-05 | Sin pedidos nuevos en el Admin durante una ronda completa de verificación `[PRÁCTICA-GENERAL]` | Pagos en vuelo: RP-20 |
| RP-48 | S17 | Dueña · Sí | Exportar pedidos y clientas de Shopify desde el Admin (CSV) `[PRÁCTICA-GENERAL]`; guardarlos **fuera del repo** (contienen datos personales) | RP-47 | Mismo conteo que la lista del Admin | Acceso restringido; el repo no documenta la exportación |
| RP-49 | S17 | Dueña + Claude · Sí | **Hoja de conciliación privada con tres fuentes:** Shopify (pedidos y pagos), panel de Wompi (transacciones) y sitio custom (`/admin`; Claude no consulta Neon). Columnas mínimas: sistema, número, fecha, líneas (SKU-talla y cantidad), total COP, estado de pago, referencia de la pasarela, estado de cumplimiento. SR-10 fija el punto de partida | SR-10 | Cada pedido y cada transacción del periodo aparece una sola vez | — |
| RP-50 | S11/S17 | Dueña · Sí; **los cobros no** | Casos: (a) APPROVED sin pedido en ningún sistema → crear el pedido a mano en el sistema que siga vivo y avisar a la clienta, o reembolsar desde el panel de Wompi (DR-10); (b) pedido "Pagado" sin APPROVED → no cumplir hasta aclararlo con Wompi; (c) pendiente vencido → cancelar; (d) duplicado → reembolsar uno | RP-49 | 0 filas abiertas | Reembolsos de Shopify hacia Wompi por medio de pago: `NOT_VERIFIED` (NV6). La API de reembolsos V2 de Wompi: disponibilidad en producción `NOT_VERIFIED` `[DOC:payments/03E-wompi-shopify-feasibility.md E37]` |
| RP-51 | S17 | Dueña · Sí | **Un pedido = un sistema.** Los pedidos de Shopify se cumplen desde el Admin de Shopify hasta su cierre; no se re-crean en el custom salvo decisión explícita (DR-06). Anotar en la hoja el sistema de registro | RP-49 | Cada fila con un único sistema de registro | El despacho sigue siendo manual (transportadora Envia, costo coordinado por pedido) `[DOC:shipping/03E-shipping-source-of-truth.md § 0]` |
| RP-52 | S17 | Dueña (`/admin` del custom) · Sí | **Stock:** después de RP-10 y **antes** de RP-12 (con el dominio todavía en Shopify), restar del stock del custom las unidades vendidas en Shopify (por SKU-talla), partiendo de SR-10. No puede hacerse antes de RP-10 si el sitio actual está pausado (D-CT2 = A): la pausa cubre el panel `/admin` `[DOC:launch/03G-cutover-runbook.md § 5.2]`. Si se reanuda después del DNS, hay una ventana con el checkout abierto y el stock sin ajustar (D-15) | RP-10; SR-10; DR-07 | Stock del custom = SR-10 − unidades de Shopify − unidades del custom en el periodo | Sin este ajuste el custom puede sobrevender `[INFERIDO]` |
| RP-53 | S17 | Dueña · Sí | **Cancelaciones y reembolsos** de pedidos de Shopify: en el Admin de Shopify; si el reembolso no llega a Wompi, hacerlo desde el panel de Wompi y anotarlo en el pedido | DR-10 | Estado del pedido y transacción de Wompi coherentes | Wompi `void` solo aplica a tarjetas `[DOC:payments/03E-wompi-shopify-feasibility.md E15]` |
| RP-54 | S17 | Dueña · **no** (los correos enviados no se retiran) | Avisar a las clientas con pedido en Shopify: qué sistema atiende su pedido y cómo ver su estado | RP-49 | Lista de clientas avisadas | Sus enlaces de estado de pedido son de Shopify: no cerrar la tienda (RP-55) |
| RP-55 | S17 | Dueña · Sí | **Mantener la tienda Shopify y su plan activos** hasta cerrar RP-49…RP-54. Efecto de pausar o cancelar el plan sobre los datos: `NOT_AVAILABLE` | RP-49 | Conciliación firmada | — |

### 8.11 Datos de cuentas y favoritos: qué se pierde y qué no

| Dato | Dónde vive | Rollback parcial (Shopify sigue público) | Rollback total (vuelve el custom) |
|---|---|---|---|
| Cuentas de clientas creadas en Shopify (código por correo) | Shopify | Se conservan | **No llegan al custom**: la clienta debe registrarse allí `[INFERIDO]` |
| Cuentas del custom (contraseña scrypt o SHA-256) | Neon | Intactas; no migran `[DOC:launch/evidence/reference-docs/data-migration.md]` | Intactas y vigentes `[INFERIDO]` |
| Suscriptoras de la sección newsletter del theme | Shopify Clientes con la etiqueta `newsletter` `[DOC:theme-src/sections/newsletter-home.liquid; templates/index.json]` | Se conservan | **No llegan al custom**; exportarlas (RP-48) |
| Direcciones y pedidos de clientas | Shopify (los creados allí) o Neon (los del custom) | Cada uno en su sistema | Cada uno en su sistema; conciliar (§ 8.10) |
| Favoritos de invitada (`wishlist_enabled=true`) | Navegador de cada clienta `[DOC:theme/03F-owner-wishlist-install-runbook.md paso 14.5]` | Se conservan | Dependen del navegador; el custom guarda los suyos en Neon |
| Favoritos de cuenta (`custom.wishlist`) | Shopify (metacampo de clienta), solo con la app instalada y `wishlist_account_sync` en ON; **hoy 0** `[MEDIDO-03G]` | Se conservan (`INFERENCIA` hasta el paso 14 del runbook) | **No llegan al custom** (Prisma) |
| Favoritos del custom | Neon | Intactos | Intactos |
| Suscriptoras al newsletter, cupones y solicitudes de aviso de reposición **del sitio actual** | Neon (`NewsletterSubscriber`, `Coupon`, `BackInStockRequest`); cantidades `NOT_AVAILABLE` `[DOC:launch/03G-cutover-runbook.md D-CT12, § 9.4]` | Intactos; no pasan a Shopify salvo decisión D-CT12 | Intactos y vigentes `[INFERIDO]` |


---

## 9. Lo que NO se puede deshacer (irreversibles)

| ID | Qué | S## | Por qué no se deshace | Mitigación |
|---|---|---|---|---|
| I-01 | **Custom distribution de la app de favoritos** | S09 | Shopify: no se puede cambiar el método de distribución después de elegirlo; la app queda atada a esa tienda (o a las de una organización Plus) `[DOC:app/README.md § 9 punto 3]` `[DOC:theme/03F-owner-wishlist-install-runbook.md paso 3: "Rollback: ninguno"]` | Una app DEV para la Dev Store y otra para la tienda comercial (P3 del runbook). Si se equivoca, se crea otra app |
| I-02 | **Publicar el theme** | S16 | El cambio de theme en sí se puede revertir (RP-05, RP-06), pero el proyecto lo trata como irreversible `[DOC:theme/03B-store-foundation-report.md, lista priorizada para la dueña, punto 6]` porque desde ese momento la tienda es la cara pública (PNR-1, PNR-2, PNR-7), se asigna `page.wishlist` y, en la Dev Store, el idioma principal se cambia al publicar (I-06) | Publicar solo tras el go/no-go; RP-05 preparado y RC1.7 verificado |
| I-03 | **Cambiar el DNS** | S15 | Técnicamente reversible `[DOC:launch/evidence/reference-docs/migration-roadmap.md § 18]`; **no** lo ocurrido en la ventana: pedidos (PNR-1), 301 cacheados (PNR-7), señales de SEO, correos | SR-01, TTL previo (DR-03), RP-09 |
| I-04 | **Pedidos reales, cobros y reembolsos** | S14–S17 | Existen en Wompi, en el banco y en Shopify; solo se corrigen con nuevos movimientos (cancelación, reembolso) | § 8.10 |
| I-05 | **País y moneda base de la tienda comercial, con pedidos creados** | S01/S02 | 03F documenta que la dirección de la tienda se puede volver a escribir y que un mercado en Borrador es reversible, pero eso es para la Dev Store sin pedidos `[DOC:theme/03F-owner-market-colombia-runbook.md § 6, A11]`. Con pedidos no hay fuente que garantice la reversión: la moneda de una tarifa de envío no se actualiza al cambiar la moneda de la tienda `[DOC:shipping/03F-owner-shipping-runbook.md § 4, § 17]` y hay que desactivar Shopify Payments, Balance, Capital y Credit antes de cambiar el país `[DOC:theme/03F-owner-market-colombia-runbook.md § 4.1 A8]`. Lo demás: `NOT_VERIFIED` | Fijarlos bien al crear la tienda (S01/S02), antes del primer pedido; ver § 15, D-01 |
| I-06 | **Cambiar el idioma predeterminado** | S02 | Borra las traducciones del idioma al que se cambia y quita el idioma anterior de la lista; en la Dev Store además reescribe todos los themes, incluido Horizon `[DOC:theme/03F-owner-market-colombia-runbook.md § 6]` `[DOC:theme/03B-store-foundation-report.md]` | En la tienda comercial se fija en S02 (español) y no se toca después |
| I-07 | **Borrados permanentes y renombrar handles** | S04–S07 | "Delete Market" es permanente y no se recupera `[DOC:theme/03F-owner-market-colombia-runbook.md § 6]`; borrar un producto es permanente `[DOC:theme/03F-owner-wishlist-install-runbook.md 12.7]`; borrar archivos es permanente `[DOC:content/media/03F-media-owner-runbook.md § 9]`; borrar una definición de metacampo con datos: efecto `NOT_VERIFIED`; un handle borrado o renombrado rompe las filas de redirección y las URLs indexadas `[INFERIDO]` | Despublicar en vez de eliminar (RP-43, RP-44) |
| I-08 | **Correos y notificaciones ya enviados** | S13, S14+ | Un correo enviado no se retira | RP-54 |
| I-09 | **Datos ya enviados a Google o Meta** | S08, S12 | Desconectar frena lo futuro; Meta en Enhanced o Maximum comparte nombre, ubicación, correo y teléfono `[DOC:analytics/03F-analytics-owner-runbook.md P-18]` | Empezar en Standard hasta actualizar la política de privacidad `[DOC:analytics/03F-analytics-owner-runbook.md P-18]` |
| I-10 | **Desinstalar apps** (parcialmente irreversible) | S08, S09, S11 | La configuración puede no restaurarse al reinstalar `[DOC:payments/03F-wompi-owner-runbook.md N21]` `[DOC:theme/03F-search-discovery-owner-runbook.md S8]` | Capturar la configuración antes (SR-08); preferir los niveles previos |
| I-11 | **301 ya servidos y cacheados** | S06, S15 | Los cachean navegadores y buscadores `[DOC:seo/03E-redirect-plan.md § 5.3]` | DR-09 |

---

## 10. Qué se conserva y qué se pierde, por dominio

"Se pierde" incluye lo que **no se sincroniza** entre los dos sistemas: en las fuentes no hay ningún mecanismo de sincronización entre Shopify y el sitio custom, y el código propio no participa del cobro en Shopify `[DOC:payments/03E-wompi-shopify-feasibility.md § 4]`.

| Dominio | Rollback parcial (Shopify sigue público) | Rollback total (vuelve el sitio custom) | Se pierde o no se sincroniza |
|---|---|---|---|
| **Catálogo** | Catálogo de Shopify intacto (29/98/95) `[MEDIDO-03G]`; solo se pierde lo que se despublique o borre | Shopify conserva el suyo; el custom conserva el suyo en Neon | Cambios de precio, descripción o talla hechos en un lado durante la ventana no pasan al otro (ya hay una diferencia de ese tipo: la Dev Store tiene la talla XL de `alba-dorada-cafe-claro` y el sitio actual hoy no la lista; que el sitio "cambiara después" del export **no está demostrado**, F-01 `[MEDIDO-03G]` `launch/03G-product-parity.md`). Solo existen en Shopify: tag `MOSTAZA`, el handle en minúsculas de `costa-esmeralda-azul`, color en mayúsculas, 43 imágenes reducidas a 5000 px; `featured` no se migró `[MEDIDO-03G]` `launch/03G-product-parity.md`. **Inventario no rastreado** en Shopify `[MEDIDO-03G]` `[DOC:launch/03G-product-parity.md § 1, § 4]` |
| **Pedidos** | Todos en Shopify | Los de la ventana quedan en Shopify; los previos y posteriores, en Neon | No hay vista unificada; numeración distinta; el stock del custom no refleja lo vendido en Shopify (RP-52); riesgo de cobro sin pedido (NV7). Ver § 8.10 |
| **Clientes** | Cuentas de Shopify conservadas | Las de Shopify no llegan al custom; las del custom siguen en Neon | Contraseñas no migrables `[DOC:launch/evidence/reference-docs/data-migration.md]`; suscriptoras del newsletter capturadas en Shopify. Ver § 8.11 |
| **Favoritos** | Invitada en el navegador; de cuenta en `custom.wishlist` (hoy 0) | Los de Shopify no llegan al custom (Prisma) | Favoritos de cuenta hechos en Shopify. Ver § 8.11 |
| **Redirecciones** | Se conservan (47); reimportar el CSV toma ≈ 1 minuto (editar o borrar: sin dato) | Quedan en Shopify pero dejan de tener efecto con el DNS en el custom `[INFERIDO]`; el custom no tiene redirecciones equivalentes | 301 ya cacheados (I-11). Las 4 filas legales aún no existen (B2) |
| **SEO** | Se conservan canonical, hreflang, JSON-LD, sitemap y `noindex` del theme Radaelli `[DOC:seo/03F-seo-final-validation.md]` | Vuelven los del custom: canonical `${SITE_URL}/producto/${slug}`, sitemap y `robots.txt` propios `[DOC:source-of-truth/data-model-audit.md]` | Señales acumuladas en `/products/…` durante la ventana `[INFERIDO]`. Misma propiedad de Search Console `[DOC:seo/03E-redirect-plan.md § 7]` |
| **Analítica** | Desconectar apps solo frena lo futuro | Vuelven GA4 con consentimiento y Meta CAPI del custom `[DOC:launch/evidence/reference-docs/architecture-map.md]` | Continuidad del embudo entre sistemas `[INFERIDO]`; lo ya enviado queda (I-09) |
| **Media** | Los archivos subidos a Shopify quedan (12 archivos del plan A4) | Cloudinary no se tocó: el custom sigue igual `[DOC:content/media/03F-media-owner-runbook.md § 9]` | Nada, salvo borrados |
| **Contenido** | Páginas legales de Shopify: Garantía y Reembolso verbatim; las otras 4 pendientes | Las del custom intactas | Blog: 3 posts solo en el custom (clasificados "intentionally not migrated"; migrar o dejar en 404 sigue siendo decisión de la dueña, D-CT6) `[DOC:seo/03E-redirect-plan.md § 3, § 5.5]` `[DOC:launch/03G-cutover-runbook.md D-CT6]` `[MEDIDO-03G]` |
| **Configuración** | Envíos, mercados, pagos y checkout quedan en Shopify | El custom no las usa | Restaurar solo si se sigue usando Shopify |

---

## 11. Mapa S01–S17 → rollback

| S## | Paso | Quién revierte | Reversible | Depende de | Evidencia de que quedó revertido | RP |
|---|---|---|---|---|---|---|
| S01 | Crear la tienda comercial | Dueña | Cuenta y plan: efecto de pausar o cancelar `NOT_AVAILABLE`. **País y moneda base: irreversibles con pedidos (I-05)** | — | Configuración > General | RP-26, RP-55 |
| S02 | Base país, moneda, idioma, zona, mercado | Dueña | Dirección y mercados (Borrador): sí. **Eliminar mercado, cambiar idioma predeterminado, país y moneda con pedidos: no (I-05…I-07)** | S01 | V2, V4 y V7 del runbook de mercado | RP-23…RP-26 |
| S03 | Theme RC1.8 sin publicar | Claude (OK) | Sí | SR-04 | `shopify theme list` con `unpublished`; remoto = ZIP 96/96 | RP-04 |
| S04 | Catálogo (CSV 29/98/95) | Dueña o Claude | Despublicar: sí. **Eliminar: no** | — | 29/98/95 en el Admin | RP-43, RP-44 |
| S05 | Colecciones, metacampos, metaobjetos | Dueña o Claude | Vaciar valores: sí. **No borrar definiciones con datos** | S04 | Conteos de colecciones 10/12/7/0/7/0 `[MEDIDO-03G]` | RP-43, § 8.8 |
| S06 | Menús, páginas, redirecciones | Claude (OK) o dueña | Sí (reimportar redirecciones ≈ 1 min). 301 servidos: no (I-11) | SR-05, SR-12 | 47 (o 0) en la lista; `curl.exe -I` | RP-37…RP-40, RP-46 |
| S07 | Media | Claude (OK) | Sí. **Borrar archivos: no** | Snapshot del cableado | SHA-256 de los 2 templates | RP-45 |
| S08 | Apps oficiales (S&D, Google & YouTube, Facebook & Instagram) | Dueña (OAuth) | Desinstalar: sí, la configuración puede no volver. **Datos enviados: no (I-09)** | SR-08, SR-11 | Apps: solo Translate & Adapt | RP-27…RP-31 |
| S09 | App de favoritos | Dueña + Claude | Niveles 1–5: sí. **Custom distribution: no (I-01)** | — | Network sin llamadas a `/apps/radaelli/wishlist` | RP-32…RP-36 |
| S10 | Envíos (tarifas, D2) | Dueña + Claude | Sí (recrear la zona a mano) | SR-06 | Disponibilidad con país CO; `add.js` 422 si se eliminó la zona | RP-02, RP-21…RP-23 |
| S11 | Wompi | Dueña | Desactivar y desinstalar: sí. **Cobros reales: no (I-04)** | SR-03, SR-07 | Pagos sin proveedor | RP-01, RP-15…RP-20 |
| S12 | Analítica | Dueña | Desconectar: sí. **Lo enviado: no (I-09)** | SR-11 | Apps desconectadas; pixel `ENABLED:false` | RP-28…RP-31 |
| S13 | Cuentas de cliente | Dueña | Ocultar enlaces: sí. **El tipo de cuenta no tiene rollback; los correos enviados no (I-08)** | — | Header sin acceso | RP-41, RP-42 |
| S14 | E2E en la tienda comercial (pedidos de prueba) | Dueña | Cancelar o archivar: sí. En modo real, los cobros no (I-04) | — | Hoja de RP-49 sin pruebas | RP-18, RP-20, § 8.10 |
| S15 | Dominio (DNS/SSL) | Dueña | **Técnicamente sí; sus efectos no (I-03)** | SR-01, SR-02, SR-03; RP-10 y RP-11 antes de RP-12 | VR-1 | RP-08…RP-14 |
| S16 | Publicar (theme, plantilla `page.wishlist`, contraseña) | Dueña (+ Claude) | **El theme sí; sus consecuencias no (I-02).** La contraseña: reversible con efecto | S03. El cutover lo ejecuta **antes** de S15 (CT-45 en T-1h, CT-51 en T-15m) | `shopify theme list`; VR-6; visita sin contraseña | RP-03, RP-05…RP-07, RP-10 |
| S17 | Post-lanzamiento | Dueña + Claude | Monitoreo. Retirar redirecciones o el sitio custom: no antes de las condiciones de § 8.9 | — | Search Console; hoja de RP-49 | RP-47…RP-55, § 8.9 |

---

## 12. Secuencia del rollback total

### 12.1 Quién decide y con qué

Decide la dueña, con la evidencia que el cutover pide presentar: el criterio que se disparó, la salida del comando o la pantalla que lo prueba (sin secretos), la hora y si hay pedidos reales en Shopify desde T0 `[DOC:launch/03G-cutover-runbook.md § 8.1]`. Los umbrales y la ventana de decisión son DR-02 (= D-CT1). Claude propone y verifica; no ejecuta cambios de DNS, Vercel, Wompi ni del Admin de Shopify.

El costo del rollback sube con cada pedido real tomado en Shopify después de T0, porque cada uno se debe honrar `[DOC:launch/03G-cutover-runbook.md § 8.1]`. Por eso el orden favorece contener temprano.

### 12.2 Orden

El cutover ejecuta S16 (publicar en T-1h, CT-45; quitar la contraseña en T-15m, CT-51) **antes** de S15 (DNS en T0, CT-61). El rollback total va al revés: primero se contiene y se prepara el sitio actual, después se devuelve el DNS, y solo al final se limpia Shopify. **El orden de RP-10, RP-11 y RP-52 respecto del DNS (RP-12) es el de este plan y difiere del que escribe el cutover en § 5.2, CT-42 y § 8.3** (D-15, § 8.2 "Orden"): mientras no se alineen, vale la decisión escrita de la dueña. En el orden del cutover, después de RP-15 y RP-16 (paso 4) va RP-12/RP-13 (pasos 7 y 8) y solo entonces RP-11, RP-52 y RP-10 (pasos 5 y 6 de esta tabla).

| Paso | Qué | RP | Condición para seguir |
|---|---|---|---|
| 1 | Contener Shopify y congelar la entrada de pedidos | RP-01, RP-02 o RP-03 según DR-05 (las tres que lista el cutover); RP-47 | Sin pedidos nuevos en una ronda de verificación |
| 2 | Exportar pedidos y clientas | RP-48 | Conteos iguales a los del Admin |
| 3 | Comprobar que el sitio actual está listo | RP-09 | Panel accesible por la URL del proyecto; commit = SR-02 |
| 4 | Sacar Wompi de Shopify y devolver la URL de eventos al sitio actual | RP-15, RP-17 (alternativa suave), RP-16 (es la misma acción que RP-11) | Panel de Wompi con el valor de SR-03 |
| 5 | Reanudar el sitio actual (si estaba pausado) | RP-10 | Deployment posterior en estado listo y sin `WRITES_PAUSED` |
| 6 | Ajustar el stock del sitio actual con lo vendido en Shopify | RP-52 | Stock = SR-10 − unidades de Shopify − unidades del sitio actual |
| 7 | Devolver los registros web del DNS | RP-12 | El proveedor muestra los valores de SR-01 |
| 8 | Verificar quién sirve el dominio y hacer un pedido de bajo monto | RP-13; VR-1…VR-5 | VR-1 en verde de forma repetida; el pedido llega al sitio actual |
| 9 | Drenar y conciliar | RP-20, RP-49…RP-51, RP-53, RP-54 | Hoja de conciliación con 0 filas abiertas |
| 10 | Desconectar analítica y apps | RP-28…RP-36 | Un solo emisor de analítica por destino |
| 11 | Limpieza opcional con el sitio actual estable | RP-14, RP-17 (alternativa dura), RP-18, RP-19 | Decisión de la dueña. **No** antes de cerrar la conciliación (RP-55) |
| 12 | Mantener el TTL bajo hasta cerrar la ventana de rollback | RP-08 | CT-94 del cutover |

**Antes del paso 4** `[INFERIDO]`: la URL de eventos de Wompi es una por ambiente `[DOC:payments/03F-wompi-owner-runbook.md § 5.1]`; lo que se apruebe en Wompi **después** de moverla ya no llega a Shopify. Por eso, antes del paso 4 se listan los pagos pendientes de Shopify (RP-20, puntos 1 a 3); los que se aprueben después del paso 4 se concilian a mano (RP-50) en vez de esperar a que venzan (plazo recomendado de hasta 3 días, `NOT_VERIFIED` para la app de Wompi: § 8.3).

### 12.3 Rollback parcial

Se elige por dominio en el § 6 y se ejecuta la sección del § 8 correspondiente. **No se toca el DNS.** Si el rollback parcial no corrige el síntoma, se vuelve al § 12.1.

### 12.4 Alineación con el cutover (`launch/03G-cutover-runbook.md`)

Lo que este plan necesita del corte y si el cutover ya lo cubre:

| # | Lo que este plan necesita | ¿Lo cubre el cutover? | Dónde | Pendiente |
|---|---|---|---|---|
| 1 | Hoja privada de rollback antes de T0 | Sí | § 5.4 (SR-01 a SR-12 con los mismos IDs) y compuerta G3 | SR-10 figura como "se toma en CT-43", pero CT-43 no describe capturar stock, último número de pedido ni respaldo de la base; el mecanismo del respaldo es `NOT_AVAILABLE` |
| 2 | Go/no-go firmados con criterios | Sí | Compuertas G1–G8 (G1 exige D-CT1…D-CT12 y D-CT15…D-CT17) | Los umbrales (DR-02 = D-CT15) siguen sin definir. El cutover cita en G2 este § 12.4 "puntos 3 y 4"; aquí ese contenido está en las filas 2 y 9: referencia por corregir en el cutover |
| 3 | Pausa y reanudación del sitio actual | Sí | § 5.2 (`WRITES_PAUSED`), CT-42, § 8.3 | Que el deployment de producción vigente incluya el interruptor: `NOT_VERIFIED`; confirmar el mismo commit al redeployar. **El orden de RP-10 frente al DNS difiere entre los dos documentos (D-15)** |
| 4 | Significado de "apagar" el sitio actual | Sí | § 3 DIF-01 | Ninguno |
| 5 | Orden real S16 → S15 | Sí | CT-45, CT-51, CT-61 | El rollback lo invierte (§ 12.2), salvo RP-10, RP-11 y RP-52 (D-15). El cutover cita un "paso 6" de este plan que no corresponde a su numeración actual (RP-10 es el paso 5 de § 12.2) |
| 6 | Valor previo de la URL de eventos de Wompi | Sí | CT-46 ("antes anota el valor previo", solo producción) y § 5.4 (SR-03 pide producción y pruebas) | Ninguno; CT-46 debería nombrar también la de pruebas (G3) |
| 7 | El dominio sigue asignado al proyecto de Vercel | Sí | § 9.1 ("sigue asignado… no se quita") y CT-61 ("editar solo los registros web") | Ninguno |
| 8 | Ventana con dos sistemas que pueden recibir pedidos | Parcial | D-CT2; CT-75 (remite a § 8.10 de este plan) | La conciliación de un rollback la define este plan (§ 8.10); falta la herramienta y la decisión DR-06 |
| 9 | El pedido real de CT-47 como PNR-1 previo al DNS | Sí | CT-47 | Registrarlo en la hoja de RP-49 |
| 10 | TTL bajo hasta cerrar la ventana | Sí | CT-94; V-DNS punto 7 | — |
| 11 | Condición de retiro del sitio actual | Sí | D-CT13; compuerta G8 | Fecha `NOT_AVAILABLE` |
| 12 | IDs sin choque | Resuelto aquí | § 0 | El cutover usa `RB-##` para disparadores; este plan usa `RP-##` para pasos |

---

## 13. Verificación después de un rollback

Todo es de solo lectura. Ningún comando escribe en Shopify, Vercel, Wompi ni Neon.

| ID | Qué se verifica | Cómo | Pasa si |
|---|---|---|---|
| VR-1 | **Quién sirve el dominio.** Son las mismas sondas del cutover (CT-56 y CT-63) `[DOC:launch/03G-cutover-runbook.md]`, leídas al revés | `curl.exe -sI https://radaelliswimwear.com/producto/bikini-foam`; `curl.exe -sI https://radaelliswimwear.com/robots.txt`; `curl.exe -s -o NUL -w "%{http_code}" https://radaelliswimwear.com/cart`; `nslookup radaelliswimwear.com` contra dos resolvers públicos distintos | **Sitio actual:** la ficha da **200** sin `Location`; `robots.txt` de 228 bytes con `Disallow: /admin` y `Host: https://radaelliswimwear.com`; `/cart` 404 `[MEDIDO-03G]`. **Shopify:** la ficha da 301 a `/products/bikini-foam` (código exacto `NOT_VERIFIED`); `robots.txt` de 3.642 bytes; `/cart` 200 `[MEDIDO-03G]`. El DNS coincide con los valores de SR-01 en los dos resolvers |
| VR-2 | HTTPS válido en apex y `www` | `curl.exe -sSI https://radaelliswimwear.com/` y `curl.exe -sSI https://www.radaelliswimwear.com/` **sin** `-k`; candado del navegador (V-SSL `[DOC:launch/03G-cutover-runbook.md]`) | Cabeceras sin error de certificado en los dos; el certificado cubre apex y `www` y está vigente. El comportamiento de `http` a `https` con Vercel: `NOT_VERIFIED` |
| VR-3 | Rutas clave del custom | `/`, `/oasis-natural`, `/aurora-viva`, `/espuma-de-ola`, `/checkout`, `/blog` con `curl.exe -sI` | 200 en todas `[MEDIDO-03G]` |
| VR-4 | Las 29 fichas del custom | Lista de `launch/evidence/current-site/index.json`. `COSTA-ESMERALDA-AZUL` responde **solo en mayúsculas**; en minúsculas da 404 `[MEDIDO-03G]` `[DOC:seo/03E-redirect-plan.md § 5.1]` | 29/29 con 200 |
| VR-5 | Wompi en el custom | Panel de Wompi = valor de SR-03; transacción de bajo monto de la dueña | Llega al custom y el pedido queda en `/admin` (log del custom: `NOT_AVAILABLE`) |
| VR-6 | Theme tras RP-05 o RP-06 | `shopify theme list`; `/`, `/collections/oasis-natural`, una ficha, `/cart`, `/search?q=bikini`, `/pages/favoritos` con 200; consola sin errores propios; `pull` y comparación con el ZIP (96/96) | Rol `[live]` en el theme esperado y 0 errores propios `[MEDIDO-03G]` `[DOC:theme/03E-commercial-readiness-report.md]` |
| VR-7 | Shopify congelado | Pagos sin proveedor; sin pedidos nuevos en una ronda; `/products.json?limit=250` con 29/98 | Cumple los tres |
| VR-8 | Redirecciones (si siguen en uso) | `node seo/validate-redirects.mjs` y `node launch/tools/03g-cutover-redirect-matrix.mjs [BASE_URL]` (imprime los comandos `curl.exe -sI`; no hace peticiones) `[DOC:launch/03G-cutover-runbook.md V-REDIR]` | PASS y 47/47 con primer salto 301 y `Location` igual al CSV, según V-REDIR |
| VR-9 | Conciliación | Hoja de RP-49 | 0 filas abiertas |
| VR-10 | Analítica | Apps de Google y Meta desconectadas; un solo emisor por destino | Sin duplicados `[DOC:analytics/03F-analytics-owner-runbook.md § 9]` |
| VR-11 | Search Console | Estado de la propiedad y del sitemap; "No encontrada (404)" y "Página con redirección" | Sin 404 sin explicar `[DOC:seo/03E-redirect-plan.md § 7]` |

---

## 14. Qué se puede ensayar y dónde

Nada de esto se ejecuta en 03G (es un documento). Es la lista de lo que se podrá ensayar más adelante.

| Rollback | ¿Ensayable en la Dev Store? | Cómo | Restricción |
|---|---|---|---|
| RP-38, RP-39 (redirecciones) | Sí | Eliminar todas y reimportar el CSV; reimportar toma ≈ 1 minuto, eliminar: `NOT_AVAILABLE` `[DOC:seo/03F-redirect-import-result.md § 4, § 5]` | Con OK de la dueña; no toca theme ni DNS |
| RP-05 (theme RC1.7) | Solo hasta subirlo sin publicar | Subir el ZIP RC1.7 como theme nuevo sin publicar y comparar el hash y los 96 archivos | **No publicar:** Horizon es el live de la Dev Store y no se toca |
| RP-06 y publicación | No | — | Requiere la tienda comercial (ensayo `NOT_AVAILABLE` hasta S01) |
| RP-32…RP-36 (favoritos) | Sí, tras A5 | Niveles 1 a 5 y reinstalación (paso 14 del runbook) | La custom distribution del ensayo es irreversible (I-01): usar la app DEV |
| RP-15, RP-18 (pagos) | Sí, tras B1 | Activar y desactivar Wompi en modo prueba o la pasarela de prueba | Sin dinero real; no se acepta facturación (R3) `[DOC:payments/03F-wompi-owner-runbook.md]` |
| RP-21…RP-25 (envíos y mercado) | Sí, tras A1 | Los runbooks de envío y mercado traen su propio rollback | Nunca "Eliminar" un mercado |
| RP-49…RP-53 (conciliación) | Sí, con pedidos de prueba | Probar la hoja con pedidos del sandbox de Wompi o de la pasarela de prueba | Sin datos de clientas reales (R7 del runbook de Wompi) |
| RP-08…RP-14 (DNS y reanudación del sitio actual) | No | La Dev Store no tiene dominio propio; proveedor y TTL `NOT_AVAILABLE`. Un subdominio de prueba es `[PRÁCTICA-GENERAL]` y lo decide la dueña | — |
| RP-03 (Privada) | No aplica | La Dev Store ya es privada; si puede dejar de serlo, `NOT_VERIFIED` (D1 dice que no, D2 dice que sí tras transferencia o plan pago) `[DOC:analytics/03F-analytics-owner-runbook.md § 2]` | — |
| RP-27…RP-31 (apps de analítica) | No | Con la tienda con contraseña, GA4 y Meta no funcionan `[DOC:analytics/03F-analytics-owner-runbook.md § 2]` | Solo en una tienda pública |

---

## 15. Coherencia con 03E/03F y con el snapshot: diferencias y hallazgos

| ID | Tipo | Hallazgo | Evidencia | Acción |
|---|---|---|---|---|
| D-01 | DIFFERENCE | 03F marca **reversible** el cambio de dirección de la tienda; este plan trata **país y moneda base** como irreversibles con pedidos. No es una contradicción: 03F habla de la Dev Store sin pedidos y este plan separa el caso con pedidos. Que Shopify impida revertir: `NOT_VERIFIED` | `[DOC:theme/03F-owner-market-colombia-runbook.md § 6, A11]`; § 9 I-05 | Fijar S01/S02 con cuidado; confirmar con soporte de Shopify si la dueña necesita la certeza. El cutover llega a la misma conclusión (DIF-05: "IRREVERSIBLE por prudencia" `[INFERIDO]`) `[DOC:launch/03G-cutover-runbook.md § 3]` |
| D-02 | DIFFERENCE | El snapshot y `dev-routes.json` miden `/apps/wishlist` (404), pero el app proxy es `/apps/radaelli/wishlist`. El 404 de hoy es coherente con "no instalada" pero no dice nada sobre el proxy real | `[MEDIDO-03G]` snapshot `wishlistApp.appProxy`, `dev-routes.json`; `[DOC:app/shopify.app.toml]` `[app_proxy]`; `[DOC:app/README.md § 2]` | Medir `/apps/radaelli/wishlist` en la próxima captura y en RP-36 |
| D-03 | DIFFERENCE | 03E y 03F dicen "apagar el sitio Next.js en la ventana de corte"; el roadmap dice no dar de baja Vercel ni Neon y mantenerlos varias semanas; el checklist dice "sitio viejo en modo lectura". Este plan lee "apagar" como **dejar de aceptar pedidos**, y el cutover lo confirmó: "se conserva; no se apaga ni se desmantela" (DIF-01) | `[DOC:theme/03E-owner-actions-one-shot.md]`; `[DOC:theme/03F-owner-actions-minimal.md B4]`; `[DOC:launch/evidence/reference-docs/migration-roadmap.md § 18]`; `[DOC:theme/pre-development-store-checklist.md O]`; `[DOC:launch/03G-cutover-runbook.md § 3 DIF-01]` | Resuelto por el cutover. Queda editar 03E/03F si se quiere quitar la ambigüedad (no se editan aquí) |
| D-04 | DIFFERENCE | El checklist pide "Inventario con seguimiento de Shopify"; el snapshot y el CSV muestran 98/98 sin seguimiento | `[DOC:theme/pre-development-store-checklist.md C]`; `[MEDIDO-03G]` snapshot `catalog.inventoryTracking` | DR-07; RP-52 |
| D-05 | NOTE | 03B llama "irreversible" a publicar; el repo nunca ejecutó una publicación. Este plan separa el theme (reversible, `[PRÁCTICA-GENERAL]`) de sus consecuencias (I-02) | `[DOC:theme/03B-store-foundation-report.md]`; `[DOC:theme/03A-development-store-upload-report.md]` | Confirmar en el Admin al ensayar en la tienda comercial |
| D-06 | NOTE | Los runbooks 03F usan pasos propios (`S0–S13` de envío, `S1–S12` de Search & Discovery) que chocan con los canónicos `S01–S17` | § 0 | Citar siempre con el nombre del runbook |
| D-07 | NOTE | `theme/03F-owner-actions-minimal.md` cita el theme RC1.7 y el runbook de favoritos cita la app 0.1.1. Vigentes hoy: RC1.8 (`e893b386…9e67`) y app 0.1.2 (`19c8c0df…e4b2`) | `[MEDIDO-03G]` snapshot; `[DOC:theme/03F-owner-actions-minimal.md]`; `[DOC:theme/03F-owner-wishlist-install-runbook.md]` | No se editan los documentos previos; los hashes vigentes están en § 2 |
| D-08 | NOTE | `custom.wishlist` "no se pierde si se desinstala" es un hecho en `app/README.md § 2` y una `INFERENCIA` en el runbook 03F hasta el paso 14 | `[DOC:app/README.md]`; `[DOC:theme/03F-owner-wishlist-install-runbook.md § 3 paso 14]` | Este plan usa `INFERENCIA` |
| D-09 | NOTE | El rango `capturedAt` del snapshot termina después de la hora de referencia de esta corrida (18:00); no se reproduce aquí | `[MEDIDO-03G]` snapshot `_meta` | Revisar el sello de tiempo del snapshot |
| D-10 | NOTE | El cutover apareció mientras se terminaba este plan y se leyó completo. Alineado: IDs `S01`–`S17`, orden real de S16 antes de S15, pausa con `WRITES_PAUSED`, hoja privada, criterios `AB` y `RB`; el orden de RP-10, RP-11 y RP-52 respecto del DNS no coincide (D-15). El choque de nombres (`RB-##`) se resolvió llamando `RP-##` a los pasos de este plan | `[DOC:launch/03G-cutover-runbook.md]`; § 6.1; § 12.4 | Si el cutover cambia, re-cruzar § 6.1 y § 12.4 |
| D-11 | NOTE | El cutover marca CT-45 (publicar) como "IRREVERSIBLE en la práctica" con la misma razón que este plan: técnicamente se puede publicar otro theme, pero lo indexado o cacheado no se retira. Este plan agrega que lo irreversible es la consecuencia y no el botón | `[DOC:launch/03G-cutover-runbook.md CT-45]`; § 9 I-02 | Ninguna |
| D-12 | NOTE | El cutover contiene el mismo síntoma que este plan bajo otro nombre: `AB-03` y `RB-03` (cobro sin pedido) = SY-04 y SY-06; `RB-02` = SY-01…SY-03 | § 6.1 | Ninguna |
| D-13 | DIFFERENCE | El interruptor `WRITES_PAUSED` solo actúa en el deployment que incluye `lib/system/write-pause.ts`; el propio archivo advierte que **no** pausa un deployment construido antes de que existiera. Que el de producción vigente lo incluya es `NOT_VERIFIED`. Si no lo incluye, D-CT2 = A no se puede cumplir y "reanudar" (RP-10) no aplica | `[DOC:lib/system/write-pause.ts]` (comentario de cabecera); `[DOC:launch/03G-cutover-runbook.md § 5.2, § 11]` | Verificarlo antes de T-1h; si no lo incluye, decidir D-CT2 = B con lo que implica |
| D-14 | NOTE | `dist/` tiene el ZIP `rc1.2` pero no `release-manifest-rc1.2.json`; los manifiestos existen para `rc1`, `rc1.1` y `rc1.3` a `rc1.8`. Las versiones previas útiles para RP-05 son RC1.7 y anteriores con manifiesto | `[DOC:dist/]` (listado) | Ninguna |
| D-15 | DIFFERENCE | **Orden del rollback total frente al DNS.** El cutover pone la reanudación del sitio actual (RP-10), el ajuste de su stock (RP-52) y la restauración de Wompi para el sitio actual (RP-11) **después** de devolver el DNS; este plan los pone **antes** (§ 8.2 "Orden", § 12.2). Una versión previa de este plan decía que el cutover ordenaba lo contrario de lo que escribe; el cutover, además, cita un "paso 6" de este plan que no coincide con la numeración actual | `[DOC:launch/03G-cutover-runbook.md § 5.2 fila "Rollback", CT-42, § 8.3]`; § 8.2; § 12.2 | La dueña decide el orden; después se alinea el cutover o este plan. Hasta entonces no hay un único orden vigente. Argumento de este plan: con la pausa activa el panel no escribe stock (RP-52 exige RP-10 antes) y con el DNS aún en Shopify reanudar no expone el sitio actual `[INFERIDO]` |
| D-16 | DIFFERENCE | El plan de migración (S04, "Rollback") propone "borrar los productos importados y reimportar" y remite a RP-43 y RP-44, que dicen **nunca eliminar**. Este plan lo admite solo antes de S16, con la tienda bajo contraseña y sin pedidos, y con el efecto sobre IDs internos `NOT_VERIFIED` | `[DOC:launch/03G-commercial-store-migration-plan.md S04 Rollback]`; RP-43 | Alinear el texto del plan de migración con RP-43 |
| D-17 | NOTE | El cutover § 9.1 habla de "CU-01 a CU-09"; este plan define CU-01 a CU-10 (CU-10 = cron `release-stale-payments`, que el cutover trata en otra fila) | `[DOC:launch/03G-cutover-runbook.md § 9.1]`; § 8.9 | Ninguna |

**Brechas que impiden un rollback limpio hoy** (las mismas del § 1, punto 4):

| ID | Brecha | Qué desbloquea | Quién |
|---|---|---|---|
| G-01 | Proveedor de DNS, registros, TTL: `NOT_AVAILABLE` | RP-08, RP-12 | Dueña (SR-01, DR-03) |
| G-02 | URL de eventos de Wompi de producción del custom y estado de Wompi en el custom: `NOT_AVAILABLE` | RP-11, RP-16 | Dueña (SR-03, NV10) |
| G-03 | Herramienta y decisión para conciliar pedidos Shopify → custom e importar histórico | RP-49…RP-52 | Dueña (DR-06) |
| G-04 | Inventario sin seguimiento en Shopify | RP-52 | Dueña (DR-07) |
| G-05 | Cobro aprobado sin pedido (NV7) sin resolver; reembolsos Shopify → Wompi (NV6) sin resolver | RP-20, RP-50, RP-53 | Dueña con respuestas de Wompi (P3, P5) |
| G-06 | Umbrales y responsable de la decisión de rollback | § 12.1 | Dueña (DR-01, DR-02) |

---

## 16. Lo que no se pudo verificar o no existe (NOT_VERIFIED / NOT_AVAILABLE)

| Tema | Estado |
|---|---|
| Proveedor de DNS, registros DNS, TTL actual y TTL objetivo | `NOT_AVAILABLE` |
| Duración de una publicación de theme, de un rollback de theme y de la eliminación de redirecciones | `NOT_AVAILABLE` |
| Publicar un theme y volver a publicar el anterior; historial de versiones del editor | `NOT_VERIFIED` (nunca se ejecutó; `[PRÁCTICA-GENERAL]`) |
| Nombre del theme de fábrica de la tienda comercial | `NOT_AVAILABLE` |
| Reversibilidad del país y la moneda base con pedidos; efecto de pausar o cancelar el plan sobre los datos | `NOT_VERIFIED` / `NOT_AVAILABLE` |
| Cómo se apagan y se encienden los pedidos del sitio custom | Mecanismo documentado (`WRITES_PAUSED` + redeploy del mismo commit, `[DOC:launch/03G-cutover-runbook.md § 5.2]`); que el deployment de producción vigente lo incluya: `NOT_VERIFIED` (D-13); qué ve una clienta con la pausa activa: `NOT_VERIFIED` |
| Cómo se activa y se desactiva Wompi dentro del sitio custom | `NOT_AVAILABLE`; solo consta que la pausa hace responder 503 al webhook |
| URL de eventos de Wompi de producción del custom | `NOT_AVAILABLE` (NV10) |
| Que el deployment de producción vigente siga siendo el de `a8ddc9d` | `NOT_VERIFIED` |
| Estado del cron `release-stale-payments` tras el corte (corre una vez al día y se salta con la pausa) | `NOT_VERIFIED` |
| Que la app del sitio actual funcione por la URL del proyecto de Vercel cuando el dominio ya no apunta allí (`getAppBaseUrl()`) | `NOT_VERIFIED` (CT-14) |
| Retención de backups y restore a un punto en el tiempo de Neon | `NOT_VERIFIED` `[DOC:docs/production-recovery.md]` |
| Efecto de desinstalar Search & Discovery sobre los filtros | `NOT_VERIFIED` (solo un indicio de 2022) |
| Que `custom.wishlist` sobreviva a desinstalar la app; efecto de borrar la definición con datos | `INFERENCIA` / `NOT_VERIFIED` |
| Efecto de poner la tienda en Privada sobre buscadores y checkouts abiertos | `NOT_VERIFIED` |
| Reembolsos de Shopify hacia Wompi por medio de pago; reembolsos V2 en producción | `NOT_VERIFIED` (NV6, E37) |
| Cobro aprobado sin pedido cuando la clienta no vuelve a la tienda | `NOT_VERIFIED` (NV7) |
| Etiqueta de "prueba" en los pedidos de la pasarela de prueba | `NOT_VERIFIED` (NV12) |
| Compra como invitada con cuentas nuevas y con los enlaces de acceso ocultos | `NOT_VERIFIED` |
| Ajustes de `settings/checkout`, impuestos, dominios y eventos del cliente en la Dev Store | `NOT_VERIFIED` (no se abrieron en 03G `[MEDIDO-03G]`) |
| Código HTTP exacto de las redirecciones de Shopify | `NOT_VERIFIED` (documentado como 301; confirmar con `curl.exe -I`) |
| Certificado HTTPS tras devolver el DNS a Vercel | `NOT_VERIFIED` |
| Costo mensual actual de Vercel, Neon, Cloudinary y Resend | `NOT_AVAILABLE` |
| Si la contraseña de la Dev Store puede quitarse (las fuentes D1 y D2 del runbook de analítica se contradicen) | `NOT_VERIFIED` `[DOC:analytics/03F-analytics-owner-runbook.md § 2]` |
| Qué página de contraseña ve un visitante de la tienda comercial con plan pago (la de Shopify o la del theme) | `NOT_VERIFIED` `[DOC:theme/03B-store-foundation-report.md]` |
| Crear el theme RC1.7 por el Admin (Subir ZIP) o extrayendo el ZIP y empujándolo por CLI | `NOT_VERIFIED`: nunca se ejecutó con RC1.7; el repo usó `theme push --unpublished` desde `theme-src` `[DOC:theme/03A-development-store-upload-report.md]` |
| Despublicar un producto o colección del canal de la tienda online y su efecto sobre las redirecciones | `NOT_VERIFIED` (sin medir; `[PRÁCTICA-GENERAL]`) |
| Que la app de Wompi use el estado pendiente de Shopify y su plazo recomendado de 3 días | `NOT_VERIFIED` `[DOC:payments/03E-wompi-shopify-feasibility.md § 9]` |
| Ingreso al panel `/admin` del sitio actual con `WRITES_PAUSED` activo (la pausa cubre sesiones) | `NOT_VERIFIED` |
| Qué ve un visitante en una página "Oculta" de Shopify | `NOT_VERIFIED` (la comunidad reporta 404, fuente no oficial) `[DOC:theme/03F-legal-owner-runbook.md § 14]` |
| `launch/03G-launch-acceptance-checklist.md` (el otro documento hermano del cutover) | No existía al redactar; este plan no lo cita por sección |

---

## 17. Fuentes leídas

- **Capturas 03G:** `launch/03G-dev-store-snapshot.json`, `launch/03G-checkout-precondition-audit.md`, `launch/03G-product-parity.md`, `launch/03G-route-parity.csv` (cabecera y tamaño), `launch/evidence/dev-routes.json`, `launch/evidence/current-site/` (índice y `robots.txt`), `launch/evidence/current-site-probe/index.json`; script de esta fase `launch/tools/03g-rollback-theme-diff.mjs`.
- **Auditoría de viabilidad:** `launch/evidence/reference-docs/` (`architecture-map.md`, `data-migration.md`, `migration-roadmap.md`, `seo-analytics.md`, `wompi-payments.md`, `cost-comparison.md`).
- **Reportes 03E/03F:** `theme/03E-commercial-readiness-report.md`, `theme/03F-sonnet-independent-completion-report.md`, `theme/03F-owner-actions-minimal.md`, `theme/03E-owner-actions-one-shot.md`, `theme/03B-store-foundation-report.md`, `theme/03A-development-store-upload-report.md`, `theme/pre-development-store-checklist.md`, `theme/03D-free-shipping-audit.md`.
- **Runbooks 03F:** `theme/03F-owner-market-colombia-runbook.md`, `shipping/03F-owner-shipping-runbook.md`, `payments/03F-wompi-owner-runbook.md`, `theme/03F-search-discovery-owner-runbook.md`, `theme/03F-owner-wishlist-install-runbook.md`, `theme/03F-legal-owner-runbook.md`, `analytics/03F-analytics-owner-runbook.md`, `content/media/03F-media-owner-runbook.md`.
- **SEO, pagos, envíos, datos:** `seo/03E-redirect-plan.md`, `seo/03F-redirect-import-result.md`, `seo/03F-seo-final-validation.md`, `seo/shopify-redirects-import.csv` (hash), `payments/03E-wompi-shopify-feasibility.md`, `shipping/03E-shipping-source-of-truth.md`, `source-of-truth/data-model-audit.md`, `analytics/03E-analytics-plan.md`.
- **Release y app:** `dist/release-manifest-rc1.8.json`, ZIP RC1.7 y RC1.8 y app 0.1.2 (SHA-256 verificado), `app/README.md`, `app/shopify.app.toml`, `theme-src/sections/newsletter-home.liquid`, `theme-src/templates/index.json`, `theme-src/config/settings_data.json`.
- **Cutover y sitio actual:** `launch/03G-cutover-runbook.md` (leído completo), y del sitio actual solo lo necesario para verificar sus afirmaciones: `lib/system/write-pause.ts` (comentario de cabecera y `areWritesPaused`), `vercel.json`, `docs/incident-response.md` (líneas sobre `WRITES_PAUSED`), `docs/production-recovery.md` (retención de backups), `docs/go-live-checklist.md` (`getAppBaseUrl()`).
- **No se leyó ni se consultó:** Neon, Vercel, Wompi, DNS, tiendas, `.env`. No se hizo ningún GET nuevo al sitio en producción.

---

## 18. Registro de la verificación adversarial (2026-09-29, 18:00, Bogotá)

Un segundo revisor volvió a las fuentes, no al resumen del autor, y corrigió este archivo. Solo lectura sobre todo lo demás: se releyeron los documentos citados, el snapshot, la evidencia de `launch/evidence/**`, el cutover completo y los archivos del sitio actual que este plan cita; se volvió a correr `node launch/tools/03g-rollback-theme-diff.mjs` y se recalcularon los SHA-256 de los ZIP RC1.7, RC1.8 y de la app 0.1.2 y del CSV de redirecciones. No se hizo ningún GET nuevo ni se tocó ninguna tienda, DNS, Vercel, Wompi ni Neon.

**Sin corrección (comprobado):** los cuatro SHA-256 y el conteo de 96 archivos; que RC1.7 y RC1.8 difieren en 1 archivo (`sections/main-product.liquid`); los valores del snapshot citados en § 2; que `dist/` no trae `release-manifest-rc1.2.json`; los reintentos de Wompi (30 min, 3 h, 24 h), "4–8 semanas", "al menos 1 año", el límite de 100.000 redirecciones y "1 minuto" para importar; la irreversibilidad de la custom distribution, de "Delete Market" y de "Cambiar idioma predeterminado"; el comportamiento de `WRITES_PAUSED` y el cron `0 9 * * *`; los 9 puntos pedidos (theme, DNS, pagos, envíos, apps, redirecciones, retorno al sitio actual, pedidos, cuentas y favoritos) están cubiertos.

| # | Dónde | Decía | Ahora | Evidencia |
|---|---|---|---|---|
| 1 | § 8.2 "Orden", RP-10, § 12.2, § 12.4 | Que el cutover ordena reanudar el sitio actual **antes** de devolver el DNS | El cutover lo ordena **después** (§ 5.2 fila "Rollback", CT-42, § 8.3); este plan mantiene su orden como propuesta y lo declara diferencia (D-15) | `launch/03G-cutover-runbook.md` § 5.2, CT-42, § 8.3 |
| 2 | RP-52 | Ajustar el stock "antes de reabrir el checkout (RP-10)" | Después de RP-10 y antes de RP-12: con la pausa activa el panel no escribe stock | `launch/03G-cutover-runbook.md` § 5.2; `lib/prisma.ts` (guarda de escrituras) |
| 3 | § 1, § 5, SR-10, SR-11, § 12.4 filas 1, 6, 7 | SR-10 y SR-11 "no están en la hoja del cutover"; el dominio en Vercel "parcial" | La hoja del cutover ya lista SR-01 a SR-12 y dice que el dominio sigue asignado; queda que CT-43 no describe la captura de SR-10 | `launch/03G-cutover-runbook.md` § 5.4, § 9.1, CT-43 |
| 4 | § 4, § 7, RB-02, § 12.2 | El cutover nombra dos contenciones; RP-02 es solo de este plan; DR-02 = D-CT1; DR-10 = D-CT14; G1 = D-CT1…D-CT12 | El cutover lista RP-01, RP-02 y RP-03; DR-01, DR-02 y DR-05 = D-CT15; DR-09 y DR-10 = D-CT16; G1 exige también D-CT15…D-CT17 | `launch/03G-cutover-runbook.md` § 4, § 6 (G1), § 8.3 |
| 5 | RP-03, § 14 | La contraseña de una Dev Store "no se puede quitar" (fuente D1) | D1 dice que no y D2 dice que sí tras transferencia o plan pago: `NOT_VERIFIED`. Además, la página de contraseña que verá una visitante con plan pago es `NOT_VERIFIED` | `analytics/03F-analytics-owner-runbook.md` § 2; `theme/03B-store-foundation-report.md` |
| 6 | § 8.1 | "Agregar tema > Subir ZIP" citado a 03A | 03A ejecutó `theme push --unpublished` por CLI; Subir ZIP solo está como paso previsto en el checklist | `theme/03A-development-store-upload-report.md`; `theme/pre-development-store-checklist.md` G |
| 7 | RP-05, § 8.1 | Un theme nuevo con RC1.7 basta | Falta reaplicar lo hecho en el editor (medios, embed de favoritos, flags) desde el `theme pull` de SR-04/SR-09 | `theme/03F-sonnet-independent-completion-report.md` § B; runbook de favoritos, paso 8 `[INFERIDO]` |
| 8 | § 1 punto 2 | "La última escritura en la Dev Store fue importar las 47 redirecciones" | También se empujó RC1.8 en 03G (sin publicar) | `launch/03G-dev-store-snapshot.json` `themes`; `launch/03G-product-parity.md` F-02 |
| 9 | § 2 | "Rutas del rastreo con 200" | 54 de 70 con 200 y 16 con 404 | `launch/evidence/current-site/index.json` |
| 10 | § 8.2 | `/api/webhooks/wompi` y `/checkout/wompi/retorno` como `[MEDIDO-03G]` | No se midieron (el webhook es POST); constan en el plan de redirecciones | `seo/03E-redirect-plan.md` § 5.6 |
| 11 | RP-44 | "47 destinos con 200" | 38 con destino final 200 y 9 `/cuenta*` con primer salto correcto | `launch/evidence/dev-routes.json`; `launch/03G-cutover-runbook.md` V-REDIR |
| 12 | § 10, § 11, § 14 | Editar, borrar o reimportar redirecciones "≈ 1 min" | Solo reimportar tiene fuente; borrar: `NOT_AVAILABLE` | `seo/03F-redirect-import-result.md` § 4 |
| 13 | § 10 | "El sitio actual ya cambió tras el export" (XL de `alba-dorada-cafe-claro`) | Es una diferencia entre dos mediciones; que cambiara después no está demostrado | `launch/03G-product-parity.md` F-01 |
| 14 | § 8.3, § 12.2 | El pendiente "vence en 3 días" | Es una recomendación de Shopify para apps de pago; que la app de Wompi la use es `NOT_VERIFIED` | `payments/03E-wompi-shopify-feasibility.md` E24 y § 9 |
| 15 | RP-43, RP-46 | Despublicar productos como acción documentada; página oculta sin reservas | `[PRÁCTICA-GENERAL]` sin medir; lo que ve un visitante en una página oculta es `NOT_VERIFIED`; el plan de migración admite borrar y reimportar antes de S16 (D-16) | `theme/03F-legal-owner-runbook.md` § 5, § 14; `launch/03G-commercial-store-migration-plan.md` S04 |
| 16 | SY-17, SY-12, SY-20, RP-01, RP-09, RP-13, § 0, § 3 PNR-1 | Prueba A2 como medida; mezcla en propagación como fuente; sin C0 para el sitio actual; mensaje de "no puede aceptar pagos" en la tienda comercial como hecho; ingreso al panel con la pausa; "comisión de Wompi"; citas de § 0; CT-47 siempre antes del DNS | Cada una queda con su etiqueta (`DEFERRED_OWNER_ONLY_BLOCKER`, `[INFERIDO]`, `NOT_VERIFIED`) o su caveat (D-CT2 = B mueve CT-47 a T+15m) | Fuentes citadas en cada fila |

**Datos sin fuente quitados o marcados:** ninguno inventado en cifras, KPIs, umbrales, proveedor de DNS, registros, IPs, plan de Shopify ni tiempos; los ajustes de arriba son de atribución, de etiqueta o de alcance.

**Fuera de este archivo (no se editó, se deja anotado):** el cutover cita "§ 12.4 puntos 3 y 4" (G2) y "paso 6" (§ 5.2) de este plan con una numeración que ya no existe; `launch/03G-product-parity.md` contiene una hora posterior a la de referencia de la fase.
