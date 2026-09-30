# 03G — Runbook de cutover (NO ejecutar): del sitio actual a Shopify

- **Fecha de redacción:** 2026-09-29, 18:00 (Bogotá). Este documento no escribe horas posteriores: el momento T0 lo fija la dueña (D-CT1).
- **Estado: SOLO DOCUMENTO.** No se tocó ninguna tienda, DNS, Vercel, Wompi ni el sitio en producción. No se consultó Neon ni ninguna base de datos, no se hizo ningún POST y **no se hizo ningún GET nuevo** a `https://radaelliswimwear.com` (la evidencia guardada de 03G alcanzó). Lo único nuevo fuera de este archivo es una herramienta offline: `launch/tools/03g-cutover-redirect-matrix.mjs`. La revisión adversarial posterior (§ 12) tampoco hizo GET ni POST: leyó las fuentes y corrió solo herramientas offline.
- **Qué cubre:** pasar `https://radaelliswimwear.com` (sitio custom Next.js/Prisma/Neon en Vercel) a Shopify. Origen del ensayo: Development Store `radaelli-swimwear-dev.myshopify.com`, theme Radaelli RC1.8 (`189072474431`, SHA-256 `e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67`, 96 archivos, sin publicar), app de favoritos 0.1.2 (SHA-256 `19c8c0df68a30533b6e3b953729d525afd784a4518e2dbb6691bc8ddc919e4b2`, sin instalar). Horizon (`189072113983`) es el theme live de la Dev Store y no se toca.
- **Documentos hermanos (por nombre):** `launch/03G-rollback-plan.md` (pasos de rollback) y `launch/03G-launch-acceptance-checklist.md` (criterios de aceptación). Este runbook define **cuándo** se activa el rollback (§ 8) y **qué se verifica en cada marca**; el procedimiento detallado de rollback y la lista de aceptación viven en esos dos archivos (el checklist no existía al redactar: el enlace es por nombre). El plan de rollback define `RP-##` (pasos), `SR-##` (capturas previas al corte), `DR-##` (decisiones), `SY-##` (síntomas), `PNR-#` (puntos de no retorno) y `CU-##` (componentes del sitio actual que deben seguir vivos); este runbook los cita por ID.
- **Etiquetas de evidencia:** `[MEDIDO-03G]` capturas del 2026-09-29 (`launch/evidence/`, `launch/03G-*`); `[DOC:<archivo>]` documento del repo; `[INFERIDO]` razonado (se dice); `[NOT_VERIFIED]` no comprobado; `[PRÁCTICA-GENERAL]` práctica técnica genérica, sin cifras de la marca. `NOT_AVAILABLE` = el dato no existe en las fuentes. "A decidir por la dueña (D-CT#)" = decisión de negocio sin fuente.
- **Identificadores:** `S01`–`S17` son los pasos canónicos del plan de migración; `CT-##` son las acciones de este runbook; `G1`–`G8` los puntos GO/NO-GO; `D-CT#` las decisiones de la dueña; `AB-##` y `RB-##` los disparadores de abortar y de rollback. Los runbooks 03F usan numeraciones propias (M1–M10, S1–S13, P0–P6…): cuando se citan va el nombre del runbook para no confundirlas con los `S##` canónicos. Las compuertas G1, G2 y G3 del runbook de Wompi (¿aparece Wompi?, ¿conecta solo en pruebas?, ¿ambientes frente al pentest?) se escriben aquí `W-G1`, `W-G2` y `W-G3` para no confundirlas con `G1`–`G8` de este documento.

## 1. Veredicto de hoy y estado de partida

**Si T0 fuera hoy: NO-GO.** Motivos medidos, todos del lado de la dueña o dependientes de ella:

1. **No existe la tienda comercial** (S01). La Dev Store "solo puede procesar pagos de prueba" `[MEDIDO-03G]` (snapshot, `payments.devStoreBanner`).
2. **Bloqueo crítico A1:** mercado principal EE. UU., sin zona de envío de Colombia, checkout en `es-us`. Con país CO, las 3 variantes de `marea-natural` quedan `available:false` y `POST /cart/add.js` responde 422 `[MEDIDO-03G]` (`launch/03G-checkout-precondition-audit.md` § 1).
3. **Sin proveedor de pago:** el checkout dice "Esta tienda no puede aceptar pagos en este momento"; Wompi no está instalado `[MEDIDO-03G]`.
4. **4 páginas legales sin destino** (`/envios`, `/terminos`, `/privacidad`, `/cookies`): hoy dan 200 y están en el sitemap actual; en la Dev Store sus destinos dan 404 `[MEDIDO-03G]` (`launch/03G-route-parity.md` F-02).
5. Media, filtros de talla y color, favoritos de cuenta y analítica sin instalar (tabla siguiente).

| Paso | Estado hoy (2026-09-29, 18:00) | Evidencia |
|---|---|---|
| **S01** Crear la tienda comercial | No existe. Plan, cuenta y país base de la tienda comercial: NOT_AVAILABLE. Si la Dev Store puede pasar a producción: `[NOT_VERIFIED]` (dos páginas oficiales de Shopify se contradicen sobre quitar la contraseña y transferir) | `[MEDIDO-03G]` snapshot; `[DOC:analytics/03F-analytics-owner-runbook.md]` § 2 (D1 frente a D2); `[DOC:payments/03E-wompi-shopify-feasibility.md]` E35 |
| **S02** Base país/moneda/idioma/zona/mercado | Mercado principal EE. UU.; zona solo de EE. UU.; idioma predeterminado del Admin Inglés (español publicado, "Sin traducciones"); moneda COP; región de respaldo Colombia | `[MEDIDO-03G]` snapshot (`markets`, `locales`, `shipping`, `currency`) |
| **S03** Theme | RC1.8 en la Dev Store, sin publicar, remoto = ZIP 96/96, Theme Check 0/0. En la tienda comercial: no existe | `[MEDIDO-03G]` snapshot (`themes`) |
| **S04** Catálogo | Dev: 29 productos / 98 variantes / 95 imágenes, 29 publicados, inventario **no rastreado**. Deriva del sitio actual: la XL de `alba-dorada-cafe-claro` (F-01) y cantidades públicas por talla casi uniformes (F-04) | `[MEDIDO-03G]` `launch/03G-product-parity.md` |
| **S05** Colecciones, metafields y metaobjetos | 6 colecciones (10 / 12 / 7 / 0 / 7 / `frontpage` 0); metafield Color en 29 productos; "Guía de tallas" con 0 entradas | `[MEDIDO-03G]` snapshot |
| **S06** Menús, páginas y redirecciones | 47 redirecciones en la Dev Store (38 filas con destino final 200 verificado, 9 de cuenta); menús Main, Comprar y Ayuda; páginas `garantia` y `favoritos`; 4 legales pendientes | `[MEDIDO-03G]` snapshot; `[DOC:seo/03F-redirect-import-result.md]` |
| **S07** Media | Sin archivos de hero, banners, categorías ni guía de tallas en la primera página de Contenido > Archivos (50 archivos, todos imágenes de productos; el total no se enumeró) (A4). `settings.logo` y `settings.favicon` vacíos y sin archivo en el manifiesto de media (HP-02) | `[MEDIDO-03G]` snapshot (`files`, `_meta.limits`); `[MEDIDO-03G]` `theme/03G-home-parity.md` HP-02 |
| **S08** Apps oficiales | Solo Translate & Adapt. Search & Discovery, Google & YouTube y Facebook & Instagram no instaladas | `[MEDIDO-03G]` snapshot (`apps`) |
| **S09** App de favoritos | 0.1.2 sin instalar; `/apps/wishlist` 404; `wishlist_enabled` true, `wishlist_account_sync` false | `[MEDIDO-03G]` snapshot (`wishlistApp`) |
| **S10** Envíos | Sin zona de Colombia; tarifa bajo $299.900 NOT_SET (D2); `free_shipping_rate_confirmed` false | `[MEDIDO-03G]` snapshot (`shipping`, `themeFlags`) |
| **S11** Wompi | No instalado; ningún proveedor activo | `[MEDIDO-03G]` snapshot (`payments`) |
| **S12** Analítica | Píxel custom apagado; apps no instaladas; la Dev Store tiene contraseña (GA4 no registra y la app de Meta no se puede terminar en modo privado) | `[MEDIDO-03G]` snapshot; `[DOC:analytics/03F-analytics-owner-runbook.md]` § 2 |
| **S13** Cuentas de cliente | Cuentas nuevas de Shopify activas; ingreso por código `DEFERRED_OWNER_ONLY_BLOCKER` (A2) | `[MEDIDO-03G]` snapshot (`customerAccounts`) |
| **S14** E2E en la tienda comercial | No ejecutable hoy (CK-01 y CK-02: A1 y sin proveedor) | `[MEDIDO-03G]` `launch/03G-checkout-precondition-audit.md` § 5 |
| **S15** Dominio (DNS/SSL) | No iniciado. Proveedor de DNS, registros actuales y TTL: NOT_AVAILABLE. Dominios de la Dev Store no abiertos en 03G: `[NOT_VERIFIED]` | `[MEDIDO-03G]` snapshot (`_meta.limits`) |
| **S16** Publicar | No iniciado. Dev Store con contraseña; Horizon live | `[MEDIDO-03G]` snapshot |
| **S17** Post-lanzamiento | No iniciado | — |

## 2. Reglas de ejecución

1. **Quién decide:** la dueña decide cada GO/NO-GO y cada rollback. Claude verifica en solo lectura con la ventana de Chrome visible, registra la evidencia y recomienda; no decide. Las acciones sobre el proveedor de DNS, Vercel, Wompi y el Admin de Shopify las ejecuta la dueña (o quien ella designe): el cambio de DNS exige su acceso `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 17, fase 10.
2. **Lo que Claude nunca hace** (reglas 03F): escribir llaves de Wompi, datos de tarjeta, códigos de ingreso o contraseñas; aceptar permisos OAuth; aceptar facturación; enviar mensajes a clientas; pegar en documentos URLs de checkout con token, llaves o datos personales.
3. **Marca y ventana:** cada marca (T-24h … T+24h) agrupa las acciones que se hacen **desde esa marca hasta la siguiente**. **T0 = el momento en que la dueña guarda el cambio de DNS** (S15). Todo lo previo debe estar terminado y verificado antes. Los intervalos entre marcas (24 h, 4 h, 1 h, 15 min) son puntos de control; ninguna fuente dice cuánto tarda cada bloque `[INFERIDO]`. Si un bloque no cabe antes de su compuerta, se mueve T0: el bloque no se recorta.
4. **Duración:** solo se escribe si hay fuente (con su etiqueta); si no, `NOT_AVAILABLE`. Una estimación de Claude de un runbook 03F se marca "estimación de Claude, no medida".
5. **Reversibilidad:** "Reversible", "Reversible con efecto" (se puede deshacer, pero lo ocurrido entre medias queda) o **IRREVERSIBLE** (en negrita, con la razón).
6. **"Pasa / No pasa":** cada verificación tiene un criterio. Sin evidencia (pantalla o salida de comando sin secretos) no hay "Pasa".
7. **Congelamiento de release:** al cerrar G1 quedan fijos el theme (RC1.8 o el release nuevo que decida la dueña, § 5.3), la app de favoritos, `seo/shopify-redirects-import.csv`, `content/legal/*` y los handles de productos y colecciones (eliminarlos o renombrarlos rompe menús, redirecciones y SEO `[DOC:launch/03G-reproducibility-gap-audit.md]` G05). Dentro de T-24h solo se admiten los cambios de CT-04, CT-05, CT-06, CT-07, CT-10 y CT-12, cada uno anotado. Un cambio posterior obliga a un release nuevo y a repetir G2. La huella de lo congelado la genera `node launch/tools/03g-release-freeze.mjs "<hora Bogotá HH:MM>"` (sin argumento escribe NOT_AVAILABLE como hora; escribe `launch/03G-release-freeze.md`).
8. **Sin cambios de base desde T-4h:** país base, idioma predeterminado, mercados, zonas y tarifas de envío no se tocan dentro de la ventana; se **verifican** (S02, S10). Si algo está mal en T-1h, es NO-GO, no un ajuste en caliente.
9. **Windows:** en PowerShell usar `curl.exe` (`curl` es un alias de `Invoke-WebRequest`) `[PRÁCTICA-GENERAL]`.

## 3. Lo que este runbook precisa frente a 03E, 03F y el snapshot

| Id | Tema | Dicen los documentos | Este runbook | Evidencia |
|---|---|---|---|---|
| DIF-01 | **Apagar o conservar el sitio actual** | `theme/03F-owner-actions-minimal.md` B4: "apagar el sitio Next.js en la ventana de corte". `theme/pre-development-store-checklist.md` O: "apagar el sitio actual… sitio viejo en modo lectura". El roadmap pide lo contrario: no desmantelar hasta tener varias semanas estables en Shopify | **Se conserva; no se apaga ni se desmantela.** "Apagar" se traduce a "dejar de recibir ventas": pausa de escrituras (§ 5.2) y evento de Wompi apuntando a Shopify. Es lo más cercano a un "modo lectura" que existe: no hay página de mantenimiento, y se reabre quitando la variable y redeployando (RP-10 del plan de rollback, DR-04). Vercel, Neon, el código y la cuenta de Wompi siguen intactos y pagados | `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 18.7 y § 20 (fila "Rollback después del corte"); `[DOC:launch/03G-rollback-plan.md]` § 8.9 y § 15 (D-03) |
| DIF-02 | Cuándo importar las redirecciones | `seo/03E-redirect-plan.md` § 7.1: con el theme ya publicado y `page.wishlist` asignada | Se importan en **T-24h** (solo disparan sobre rutas que dan 404 y ningún origen existe en Shopify, así que no rompe nada: lo dice el mismo § 7.1) y se **re-verifican** en T-15m y T+15m, ya con el theme publicado y la plantilla asignada | `[DOC:seo/03E-redirect-plan.md]` § 7.1 |
| DIF-03 | Cuándo verificar con `curl -I` | 03E § 7.4: "después del DNS" | Se agrega una verificación **antes** del DNS sobre el dominio `*.myshopify.com` de la tienda comercial (T-15m, con la contraseña ya quitada). Redirecciones detrás de la contraseña: `[NOT_VERIFIED]` (03F las probó con `fetch` desde una sesión desbloqueada) | `[DOC:seo/03F-redirect-import-result.md]` § 2 |
| DIF-04 | Los 3 posts del blog | 03E los daba como NOT_AVAILABLE (slugs solo en la base) | Están medidos: `/blog/novedades-temporada`, `/blog/materiales-nobles-por-que-importan` y `/blog/guia-de-capas-para-el-invierno` dan 200, `index, follow`, y están en el sitemap actual. `launch/03G-route-parity.md` § 8 los deja "NOT_MEASURED"; la sonda `03g-baseline-probe.mjs` sí los midió | `[MEDIDO-03G]` `launch/evidence/current-site-probe/index.json`; `launch/evidence/current-site/sitemap.xml.txt` |
| DIF-05 | País base de la tienda: ¿reversible? | 03F (runbook de mercado § 6) lo clasifica reversible **en la Dev Store** | Para la tienda comercial se trata como **IRREVERSIBLE por prudencia** `[INFERIDO]`: define la lista de proveedores de pago que ofrece el Admin, el idioma del checkout y la facturación; nadie lo prueba dentro de la ventana | `[DOC:payments/03F-wompi-owner-runbook.md]` § 1 y N7; `[DOC:theme/03F-owner-market-colombia-runbook.md]` § 6 |
| DIF-06 | Wompi: producción primero | 03E PATH A paso 5 y la doc de Wompi cargan primero producción; 03F prohíbe producción **en la Dev Store** (R1, W-G2) | Sin conflicto: en la **tienda comercial**, y solo en T-1h, se cargan llaves de producción; antes, solo llaves de prueba (03F, § 6: "En el cutover…") | `[DOC:payments/03F-wompi-owner-runbook.md]` § 6 |
| DIF-07 | Evidencia de theme en RC1.7 | Capturas de la Dev Store (`dev-routes`, `dev-collections`, `dev-home`, `dev-products`) son de RC1.7; RC1.8 solo cambia `sections/main-product.liquid` | La miga de las 4 fichas de Espuma de Ola (F-02/F-11) sigue "sin re-medir": se re-mide con RC1.8 en la tienda comercial (CT-30) | `[MEDIDO-03G]` `launch/03G-product-parity.md` F-02; `launch/03G-route-parity.md` F-11 |
| DIF-08 | **Nombre "Dev" y marca de la Home** | `theme/03F-owner-actions-minimal.md` trata la meta description de la Home como opcional (C1) y no lista el renombrado de la tienda | `theme/03G-home-parity.md` HP-01 lo clasifica **BLOCKER** ("no se puede lanzar así"). Se verifica **antes** de hacer pública la tienda (CT-53, G4) y no solo en CT-73 (después del DNS). Logo, favicon, título, imagen para compartir e inglés quedan como decisiones (D-CT18, D-CT19) | `[MEDIDO-03G]` `theme/03G-home-parity.md` HP-01, HP-02, HP-11, HP-12, HP-23 |
| DIF-09 | **"RC1.8 congelado, 96/96 idénticos"** | `theme/03F-sonnet-independent-completion-report.md` § B: verificar con `pull` y comparación 96/96 | En la tienda comercial esa igualdad exacta no se sostiene si se ejecutan CT-07, CT-10 y CT-12: cambian `config/settings_data.json` (flags de envío y favoritos) y `templates/index.json` y `templates/product.json` (referencias `shopify://` propias de esa tienda). Además hay arreglos de theme pendientes. CT-44 compara contra el release vigente y admite solo las diferencias anotadas (§ 5.3) | `[DOC:shipping/03F-owner-shipping-runbook.md]` § 13; `[DOC:content/media/03F-media-owner-runbook.md]` P4 y P8; `[DOC:launch/03G-reproducibility-gap-audit.md]` G08 |
| DIF-10 | **Herramienta de paridad de productos** | La versión original de CT-03 la usaba para comparar el sitio actual con la tienda comercial | `03g-product-parity.mjs` es offline y lee `launch/evidence/dev-products.jsonl`, `dev-collections.json` y `dev-routes.json` (capturas de la Dev Store), no la tienda comercial. La captura del lado Shopify no está scripteada y `scripts/capture-public-catalog.mjs` es una propuesta que no existe. Sirve para medir la deriva del sitio actual; el lado Shopify de la tienda comercial se re-captura aparte (CT-03) | `[MEDIDO-03G]` `launch/tools/03g-product-parity.mjs`; `[DOC:launch/03G-reproducibility-gap-audit.md]` G05 y G07 |
| DIF-11 | **Descuentos de prueba del runbook de envío** | El runbook de envío crea 3 códigos de prueba (S8) y los borra al final (S11); el cutover original no lo exigía | CT-07 exige que estén eliminados antes de hacer pública la tienda | `[DOC:shipping/03F-owner-shipping-runbook.md]` § 10 (S8, S11) y § 12 |
| DIF-12 | **Pagos en vuelo y enlaces del sitio actual al cruzar T0** | `seo/03E-redirect-plan.md` § 5.6: `/api/webhooks/wompi` y `/checkout/wompi/retorno` dejan de existir con el DNS y un redirect no sirve (el webhook es POST) | § 5.2 agrega las filas "Pagos en vuelo" y "Correos del sitio actual"; se concilian en CT-75 y CT-91 | `[DOC:seo/03E-redirect-plan.md]` § 5.6; `[DOC:lib/payments/payments-actions.ts]`; `[DOC:lib/utils.ts]`; `[DOC:lib/email/templates.ts]` |

## 4. Decisiones abiertas de la dueña

Ninguna tiene valor en las fuentes. Sin resolverlas, la fila "Bloquea" indica qué marca no puede pasar. Equivalencias con el plan de rollback: D-CT2 = DR-04, D-CT3 = DR-03, D-CT5 = DR-11, D-CT8 = DR-07, D-CT12 = DR-06, D-CT13 = DR-08, D-CT14 = DR-10 (el reembolso del humo), D-CT15 = DR-01 y DR-05 (y DR-02 junto con D-CT1), D-CT16 = DR-09 y DR-10 (reembolsos si hay rollback) (`launch/03G-rollback-plan.md` § 4; ese plan asocia DR-10 solo con D-CT14 y aquí D-CT16 lo amplía). Ese plan pide cerrar DR-01 a DR-05 antes de S15.

| Id | Decisión | Bloquea | Nota y fuente |
|---|---|---|---|
| **D-CT1** | Fecha y hora de T0, y ventana de decisión tras T0 (cuánto se espera antes de considerar rollback) | G1 | NOT_AVAILABLE. Nada de este documento fija una hora |
| **D-CT2** | ¿Se pausa la venta del sitio actual antes de T0? **A:** sí, desde T-1h (recomendado por el registro de riesgos del roadmap: "congelar pedidos nuevos… antes de importar el stock final"). **B:** no, se sigue vendiendo hasta que el DNS cambie | G2 | § 5.2. Con B, la URL de eventos de CT-46 pasa a T0 y CT-47 a T+15m (§ 5.2, tabla de deltas). `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 20 |
| **D-CT3** | Proveedor de DNS, quién opera el panel, registros actuales y TTL vigente | G1 | NOT_AVAILABLE hasta que la dueña los aporte |
| **D-CT4** | Dominio primario: apex o `www` | G1 | 03E lo recomienda apex (`radaelliswimwear.com`) para no sumar un salto a cada URL vieja. `[DOC:seo/03E-redirect-plan.md]` § 5.4 |
| **D-CT5** | Tienda de lanzamiento: **nueva tienda comercial** (S01) o la Dev Store si Shopify permite pasarla a producción | G1 | E35 `[NOT_VERIFIED]`. Si es la Dev Store, "Cambiar idioma predeterminado" es destructivo y reescribe también Horizon `[DOC:theme/03F-owner-market-colombia-runbook.md]` § 6: se hace en T-24h o antes, nunca en la ventana |
| **D-CT6** | 5 URLs del sitemap actual sin destino: `/blog` (índice), 3 posts y `/accesorios` (más 4 rutas archivadas sin sitemap). ¿404 o migrar? ¿Qué pasa con `/blogs/news` en inglés? | G1 | 03E las deja en 404 hasta que decida. `[DOC:seo/03E-redirect-plan.md]` § 4.1 y § 5.5; `[MEDIDO-03G]` `launch/03G-route-parity.md` F-03, F-14 |
| **D-CT7** | 4 páginas legales: texto aprobado, destino (`/pages/*` o `/policies/*`), razón social, NIT y dirección. Además: `/policies/privacy-policy` autogenerada, la regla por defecto que bloquea `/policies/` en `robots.txt`, y que el párrafo "Pago" de los términos y la sección de terceros de la privacidad (rol de `conexa.ai`, P6 de Wompi) coincidan con el flujo final | G1 | `[DOC:theme/03F-legal-owner-runbook.md]`; `[DOC:seo/03E-redirect-plan.md]` § 4.3 y § 5.5 |
| **D-CT8** | Inventario: ¿se rastrea en Shopify y con qué cantidades reales por talla? ¿Existe la XL de `alba-dorada-cafe-claro`? | G1 | Las cifras públicas del sitio actual (25 por talla en 27 de las 29 fichas; 72 y 73 en las otras dos) no se cargan sin su confirmación. `[MEDIDO-03G]` `launch/03G-product-parity.md` F-01 y F-04 |
| **D-CT9** | Analítica: nivel de Meta (Standard, Mejorado, Máximo), exclusión de tráfico interno y cuándo se conecta Meta (solo se puede con la tienda pública) | G1 | `[DOC:analytics/03F-analytics-owner-runbook.md]` § 2, § 12 |
| **D-CT10** | Favoritos de cuenta en el lanzamiento: ¿sí (A5 completo) o solo favoritos de invitada? | G1 | La distribución personalizada de la app queda atada a **una** tienda `[DOC:theme/03F-owner-wishlist-install-runbook.md]` paso 3; que la de la Dev Store no sirva para la comercial es `[INFERIDO]` |
| **D-CT11** | Comunicación a clientas: si se avisa, a quién, por qué canal y cuándo (§ 9.4) | G1 | Sin borradores en este documento |
| **D-CT12** | Clientas y pedidos históricos: ¿se migran? ¿Se importan los suscriptores del newsletter, los cupones activos y las solicitudes de aviso de reposición? | G1 | `[DOC:launch/evidence/reference-docs/data-migration.md]`: "REQUIERE DECISIÓN" para pedidos y contraseñas; los cupones activos figuran como "MIGRATE". Los suscriptores viven en la tabla `NewsletterSubscriber` de Neon (`prisma/schema.prisma`, `lib/newsletter/`) y las solicitudes de reposición en `BackInStockRequest`; la cantidad y el consentimiento de cada una son NOT_AVAILABLE (no se consultó la base). El aviso de reposición no tiene equivalente nativo en Shopify `[DOC:launch/evidence/reference-docs/seo-analytics.md]` § 11 |
| **D-CT13** | Cuánto se conserva el sitio actual y cuándo se retira Vercel/Neon | G8 | El roadmap pide "varias semanas de operación estable confirmada" (sin cifra). `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 18.7 |
| **D-CT14** | Humo de producción con dinero real: producto, monto y cómo se reembolsa | G2 | Reembolsos de Wompi desde Shopify `[NOT_VERIFIED]` (NV6). `[DOC:payments/03F-wompi-owner-runbook.md]` § 9 |
| **D-CT15** | Quién autoriza un rollback y por qué canal (DR-01); **umbrales** que lo disparan: tiempo máximo sin poder cobrar, cobros sin pedido tolerados, errores de checkout (DR-02); y método de contención preferido: RP-01, RP-02 o RP-03 (DR-05) | G1 | Las fuentes no traen KPIs ni umbrales y este documento no los inventa `[DOC:launch/03G-rollback-plan.md]` § 4 |
| **D-CT16** | Qué hacer con los 301 cacheados si hay rollback total (DR-09) y cómo se reembolsan los pedidos de Shopify pagados con Wompi (DR-10) | G1 | `[DOC:launch/03G-rollback-plan.md]` § 4; NV6 `[NOT_VERIFIED]` |
| **D-CT17** | Promoción del 20 %: hoy es el precio con descuento del catálogo (`compare_at`), sin fecha de fin ni mecanismo de retiro; ¿continúa, cuándo termina y cómo se retira? | G1 | `[MEDIDO-03G]` `launch/03G-current-site-baseline.md` B-14; `[DOC:launch/03G-reproducibility-gap-audit.md]` G11 |
| **D-CT18** | **Identidad y SEO de la Home antes de hacer pública la tienda:** nombre de la tienda (hoy "Radaelli Swimwear Dev" en `<title>`, `og:site_name`, cabecera, pie y copyright), título y meta description actuales (C1 cubre solo la descripción), sufijo de marca en el `<title>`, imagen para compartir (no existe como archivo), logo y favicon (fuera del manifiesto de media), y qué release de theme se congela si se aplican los arreglos pendientes (§ 5.3) | G1 | `[MEDIDO-03G]` `theme/03G-home-parity.md` HP-01 (BLOCKER), HP-02, HP-11, HP-23; `[DOC:theme/03F-owner-actions-minimal.md]` C1. La verificación es CT-53 |
| **D-CT19** | **Inglés (`/en`):** el sitio actual no tiene inglés; la Dev publica `/en` con `hreflang` y con textos en parte en español. ¿(a) despublicar el inglés o (b) traducirlo? | G1 | `[MEDIDO-03G]` `theme/03G-home-parity.md` HP-12. Con (a), `/en` deja de servirse y el `hreflang` cambia `[INFERIDO]` |
| D2, D4, W-G3 | Ya definidas: tarifa bajo $299.900 (D2), zona de EE. UU. (D4, runbook de envío) y ambientes de Wompi frente al pentest (W-G3, runbook de Wompi) | G1 | `[DOC:shipping/03F-owner-shipping-runbook.md]` § 3; `[DOC:payments/03F-wompi-owner-runbook.md]` § 6 |

## 5. Congelamientos

### 5.1 Catálogo del sitio actual (nivel 1: desde T-24h, procedural)

- **Qué se congela** (lo que el panel `/admin` del sitio actual permite editar `[DOC:docs/ADMIN_PANEL.md]`): productos (nombre, precio, descripción, color, categoría, tallas, imágenes, `active`), inventario por talla, categorías, cupones, posts del blog, y el rol de usuarios.
- **Cómo:** por **acuerdo escrito** con quien edite. **No existe un interruptor técnico solo de catálogo**: la búsqueda en el repo de "maintenance", "mantenimiento" y "pausar" no arroja un modo mantenimiento ni un toggle de checkout; el único mecanismo técnico es el de § 5.2 `[INFERIDO: búsqueda en el repo]`.
- **Qué no es violación:** el stock por talla baja cuando entra un pedido. Cambios de título, precio, descripción, tallas, imágenes o categoría **sí** lo son.
- **Cómo se comprueba, sin escribir nada:**
  1. Rastreo y paridad: `node launch/tools/03g-crawl-current-site.mjs` y `node launch/tools/03g-product-parity.mjs`. **Ambas escriben siempre en rutas fijas** (`launch/evidence/current-site/`, `launch/03G-product-parity.csv/.json`) y **sobrescriben la línea base de hoy**: copiar antes esas carpetas y archivos a otra carpeta con fecha `[MEDIDO-03G: 03g-crawl-current-site.mjs escribe en OUT fijo]`. El rastreo son 70 GET; el baseline dice "no repetir sin necesidad": se corre en T-24h y en T-1h.
  2. Barato: `<lastmod>` de cada producto en `https://radaelliswimwear.com/sitemap.xml` (sale de `updatedAt` del producto `[DOC:source-of-truth/data-model-audit.md]`). Hoy va de 2026-09-14 a 2026-09-27 `[MEDIDO-03G]`. **Pasa** si ninguno es posterior al inicio del congelamiento. Que `updatedAt` cambie con el stock por talla: `[NOT_VERIFIED]` (el stock vive en `ProductVariant`); por eso el rastreo completo es la comprobación fuerte.
  3. Las cantidades por talla que la ficha publica (`sizeStock` en el payload) sirven para ver **cuántos** pedidos entraron `[MEDIDO-03G]` (B-13).
- **Reversible:** sí, se levanta con un aviso.

### 5.2 Ventas del sitio actual (nivel 2: desde T-1h, si D-CT2 = A)

| Punto | Detalle | Fuente |
|---|---|---|
| Mecanismo | `WRITES_PAUSED=true` en las variables de entorno de Vercel (Production) **y redeploy**. Es el único interruptor documentado; pausa **todas** las escrituras de la app: pedidos, pagos, carrito, sesiones, favoritos, panel `/admin` | `[DOC:docs/incident-response.md]`; `[DOC:lib/system/write-pause.ts]` |
| Efectos documentados | El webhook de Wompi responde **503** sin procesar (Wompi reintenta); los crons `release-stale-payments`, `process-email-outbox` y `process-marketing-outbox` se saltan la corrida | `[DOC:docs/incident-response.md]`; `[DOC:app/api/cron/*/route.ts]` |
| Reintentos de Wompi | Hasta 3 veces en 24 h (a los 30 min, a las 3 h y a las 24 h). Un evento rechazado con 503 solo se recupera si la pausa se levanta antes de que se agoten esos reintentos, o si el pago se concilia a mano contra el panel de Wompi (esta consecuencia es `[INFERIDO]`; el dato de los reintentos es del runbook de Wompi) | `[DOC:payments/03F-wompi-owner-runbook.md]` § 5.1 (N2) |
| Límite del propio código | Solo afecta al deployment **construido con la variable puesta**; no pausa los Preview ya existentes. `$queryRaw` con una escritura no queda bloqueado (hoy el único `$queryRaw` es un `SELECT` de diagnóstico) | `[DOC:lib/system/write-pause.ts]` |
| ¿Está el código en producción hoy? | El archivo está en el árbol de la rama al inicio de esta sesión (HEAD `a8ddc9d`, sin cambios locales en el código) y la auditoría de datos dice que `a8ddc9d` es la base que corre en producción; que el deployment de producción actual **incluya** ese código es `[NOT_VERIFIED]`. Al redeployar hay que confirmar que se despliega el **mismo commit** que sirve hoy | `[INFERIDO]` desde el estado de la rama al inicio de la sesión y `[DOC:source-of-truth/data-model-audit.md]` |
| Qué ve una clienta que intenta pagar | `[NOT_VERIFIED]`: no hay página de mantenimiento ni aviso diseñado; probar creando un pedido está fuera de este documento | — |
| Pedidos ya pagados en el sitio actual | La pausa cubre "esta app entera", panel `/admin` incluido: mientras dure, el panel no podrá cambiar estados de pedido ni stock. El despacho de esos pedidos se anota fuera del sistema o se decide levantar la pausa después de T0, con el DNS ya en Shopify (CT-93) `[INFERIDO]` | `[DOC:lib/prisma.ts]`; `[DOC:lib/system/write-pause.ts]` |
| Antes de activarla | Sin pagos `PENDING`: la reserva de una intención de pago vence a los 30 min `[DOC:payments/03E-wompi-shopify-feasibility.md]` § 4; el cron que libera pagos viejos corre una vez al día (`0 9 * * *`, `[DOC:vercel.json]`), así que un `PENDING` viejo **no** se resuelve solo a tiempo: compararlo con el panel de Wompi y no cancelarlo a mano sin verificar allí `[DOC:docs/incident-response.md]` ("Qué NO hacer"). Además, pedidos con `flaggedForReviewAt` sin resolver `[DOC:launch/evidence/reference-docs/data-migration.md]` y pedidos de "Continuar por WhatsApp" pendientes de coordinar (`[INFERIDO]`: ese flujo existe en el checkout actual, `[DOC:payments/03E-wompi-shopify-feasibility.md]` § 4; la fuente de migración de datos no lo menciona): resolverlos o registrarlos | — |
| Rollback | Quitar la variable y redeployar el mismo commit (duración: NOT_AVAILABLE). Al **abortar antes de T0** se hace de inmediato. En un **rollback total** corresponde al paso 5 de la secuencia del plan de rollback (§ 12.2, RP-10, reanudar el sitio actual), **antes** de devolver el DNS (su paso 7, RP-12), para que quien llegue al dominio no encuentre el sitio pausado; conviene tener el redeploy preparado | `[DOC:launch/03G-rollback-plan.md]` § 12.2 |
| Regla de "sin cambios" | El plan de rollback define "sin cambios" en el sitio actual como sin merges, deploys, migraciones de base, cambios de catálogo ni de configuración de producción durante la ventana, con **una única excepción**: apagar y encender pedidos (DR-04). `WRITES_PAUSED` es esa excepción | `[DOC:launch/03G-rollback-plan.md]` § 8.9 |
| Pagos en vuelo al cruzar T0 | `/api/webhooks/wompi` y `/checkout/wompi/retorno` dejan de existir en el dominio cuando el DNS llega a Shopify, y un redirect no sirve (el webhook es POST). La URL de retorno del pago la arma `getAppBaseUrl()` con el dominio de producción. Un pago iniciado en el sitio actual y terminado después de T0 vuelve a Shopify y su evento va a la URL nueva de eventos, así que el sitio actual no se entera `[INFERIDO]`. Con A se drena antes (CT-41); con B es un riesgo abierto hasta que expire el TTL previo: se concilia contra el panel de Wompi en CT-75 y CT-91 | `[DOC:seo/03E-redirect-plan.md]` § 5.6; `[DOC:lib/payments/payments-actions.ts]`; `[DOC:lib/utils.ts]` |
| Correos del sitio actual | Los enlaces de sus correos usan `getAppBaseUrl()` (`APP_BASE_URL`), por ejemplo `/cuenta/verificar-email` y `/cuenta/restablecer-contrasena`. Tras T0 caen en las redirecciones de cuenta de Shopify (`/account/login`), no en el sitio actual `[INFERIDO]`. Cambiar esa variable sería un cambio de configuración de producción, fuera de la regla de "sin cambios" | `[DOC:lib/email/templates.ts]`; `[DOC:lib/utils.ts]`; `seo/shopify-redirects-import.csv` |

**Si D-CT2 = B (no pausar):** el sitio actual sigue vendiendo hasta que el DNS cambie. La **URL de eventos de producción de Wompi es una sola por ambiente** (quien la tenga recibe los eventos) `[DOC:payments/03F-wompi-owner-runbook.md]` § 5.1, así que **no se mueve a Shopify hasta T0**. Pero las **llaves de producción sí se cargan antes de T0**: si la tienda saliera pública con llaves de prueba, una clienta podría "pagar" con una tarjeta de prueba y generar un pedido sin cobro real `[INFERIDO]` (el sandbox aprueba la tarjeta `4242…`, `[DOC:payments/03F-wompi-owner-runbook.md]` § 9). Cambios en la línea de tiempo:

| Acción | Con D-CT2 = A | Con D-CT2 = B |
|---|---|---|
| CT-41, CT-42 (drenar y pausar) | En T-1h | No se hacen |
| CT-46, carga de las llaves de producción | En T-1h | En T-1h (igual) |
| CT-46, URL de eventos de producción hacia Shopify | En T-1h | **En T0, inmediatamente después de guardar el DNS** |
| CT-47 (humo con dinero real) | En T-1h, con la contraseña puesta | **En T+15m**, ya con dominio público (contamina GA4 y Meta si están conectadas; decidir D-CT9) |
| Pedidos rezagados en el sitio actual (CT-75) | Ninguno esperado | Esperados hasta que expire el TTL previo; se atienden a mano desde el panel del sitio actual |
| Stock cargado en CT-43 (solo si D-CT8 = rastrear inventario) | Estable: el sitio actual está pausado | Se desactualiza con cada pedido del sitio actual entre CT-43 y el fin del TTL previo: restar esas unidades en Shopify (CT-75) `[INFERIDO]`; es el riesgo "Stock inconsistente durante la ventana de corte" del roadmap `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 20 |
| Tienda pública en `*.myshopify.com` entre CT-51 y T0 | La URL de eventos ya apunta a Shopify | La URL de eventos sigue en el sitio actual: un pago hecho en `*.myshopify.com` antes de T0 no crearía pedido en Shopify `[INFERIDO]`. Mitigación: no divulgar esa URL y quitar la contraseña (CT-51) lo más tarde que permita G4; lo decide la dueña |

### 5.3 Release y configuración

- **Congelado:** theme RC1.8 (`dist/radaelli-shopify-theme-rc1.8.zip`, `dist/release-manifest-rc1.8.json`), app 0.1.2, CSV de redirecciones, `content/legal/*` y `content/media/*` `[DOC:launch/tools/03g-release-freeze.mjs]`.
- **Diferencias admitidas frente al ZIP RC1.8 en la tienda comercial** (DIF-09): `config/settings_data.json` (CT-07 enciende `free_shipping_rate_confirmed`; CT-10, `wishlist_account_sync`) y, si se cablea media (CT-12), `templates/index.json` y `templates/product.json`, con referencias `shopify://` propias de esa tienda. Cada una se anota con su hash; cualquier otra diferencia es un cambio de release.
- **Arreglos de theme pendientes del 03G** (`theme/03G-home-parity.md`): `brand_name` y descripción del pie (HP-09), `#productos` en los CTA (HP-03), insignia y overlay de la editorial (HP-07), botón del newsletter (HP-08), texto del desplegable de Contacto (HP-22), logo y favicon (HP-02), JSON-LD y título de la Home (HP-11, HP-23). Si se aplican, el release congelado deja de ser RC1.8: es un release nuevo (RC1.9 en el audit de reproducibilidad, G08) con su ZIP, manifiesto y SHA-256, y las referencias a RC1.8 de este documento pasan a ese release. Cuál se congela lo decide la dueña (D-CT18) y queda escrito al cerrar G1.
- **Regla:** cualquier cambio de theme empuja primero los archivos de código y luego los JSON de plantilla, y se verifica con `pull` y comparación (96/96) `[DOC:theme/03F-sonnet-independent-completion-report.md]` § B.
- **Copia fuera de esta máquina:** el árbol `shopify-migration/` no está versionado (`?? shopify-migration/` en el estado de la rama al inicio de esta sesión). Antes de T-24h debe existir una copia de `dist/`, `theme-src/`, `catalog/`, `import/`, `seo/`, `content/` y `launch/` fuera de esta máquina o en una rama dedicada, con OK de la dueña; sin ella, el rollback del theme (RP-05, RC1.7) y la verificación 96/96 dependen de un solo disco `[DOC:launch/03G-reproducibility-gap-audit.md]` G03.
- **Configuración de la tienda comercial:** sin cambios de mercado, idioma, envíos ni pagos desde T-4h (el único cambio de pagos es el paso a producción de CT-46), salvo por una decisión de NO-GO (regla 8).

### 5.4 Hoja privada de rollback (nombres, sin valores en el repo)

La dueña la llena en T-24h y T-1h, **fuera del repositorio**, sin claves ni datos personales. Reúne las capturas previas SR-01 a SR-12 del plan de rollback (§ 5), que **no se pueden reconstruir después del cambio** y deben tener constancia antes de S15 (`launch/03G-rollback-plan.md` § 12.4, punto 1). Debe estar completa antes de T0 (G3):

| SR | Dato | Para qué | Estado hoy |
|---|---|---|---|
| SR-01 | Registros DNS de apex y `www` (tipo, nombre, valor), TTL, proveedor y quién tiene acceso | Restaurar el DNS (RP-08, RP-12) | NOT_AVAILABLE |
| SR-02 | Proyecto de Vercel, dominios asignados, commit del deployment de producción vigente, valor previo de `WRITES_PAUSED` y la URL del proyecto que no depende del dominio (CT-14) | Reactivar el sitio actual y entrar a su panel tras T0 (RP-09, RP-10) | `[NOT_VERIFIED]` el commit vigente; URL NOT_AVAILABLE |
| SR-03 | URL de eventos de Wompi de **producción** y de **pruebas** vigentes, estado de Wompi en el sitio actual y cómo se apaga y se enciende | RP-11, RP-16 | NOT_AVAILABLE (NV10) |
| SR-04 | ID y rol del theme vivo previo, ZIP RC1.8 y RC1.7 con hash, y `theme pull` del theme vivo antes de editarlo | RP-04 a RP-07 | Dev Store: hecho. Tienda comercial: NOT_AVAILABLE |
| SR-05 | Lista de redirecciones de la tienda y `seo/shopify-redirects-import.csv` con hash (`ba369467…18b1d6`), más las 4 filas legales cuando existan | RP-37 a RP-39 | CSV verificado en el plan de rollback; legales pendientes (B2) |
| SR-06 | Snapshot de mercados y envíos: el **"antes"** (runbook de mercado, M0; runbook de envío, S0) solo se puede tomar al iniciar S02 y S10 y no se reconstruye después; el estado **final** se captura en CT-47 | RP-21 a RP-26 | Pendiente |
| SR-07 | Ajustes previos de Configuración > Checkout y lista de proveedores de pago | RP-19 | Pendiente (`settings/checkout` no cargó en 03G: `[NOT_VERIFIED]`) |
| SR-08 | Apps instaladas y su configuración no secreta | RP-27 a RP-36 | Hoy solo Translate & Adapt |
| SR-09 | `settings_data.json` del theme vivo con los flags | RP-07 | Dev Store: valores en § 1 |
| SR-10 | Stock y último número de pedido del sitio actual al momento del corte; respaldo o export de la base (mecanismo de la dueña; Claude no consulta Neon) | RP-49, RP-52 | NOT_AVAILABLE; se toma en CT-43 |
| SR-11 | Propiedad de GA4 y dataset de Meta, por nombre | RP-28, RP-29 | NOT_AVAILABLE |
| SR-12 | Menús (5) y páginas (4) tal como están | RP-46 | Hecho en la Dev Store (`launch/03G-dev-store-snapshot.json`) |

## 6. Línea de tiempo

Columnas: **#** acción · **Paso** canónico · **Acción** · **Quién · Duración** · **Rev. · Depende de** · **Evidencia · Pasa / No pasa** · **Rollback**. Los bloques `V-…` de § 7 traen los comandos y criterios completos.

### T-24h — Preparación, congelamiento de catálogo y compuerta de preparación

**Objetivo:** confirmar que todo lo previo está hecho y con evidencia; no hay ningún cambio visible para clientas, salvo el acuerdo de no editar el catálogo.

| # | Paso | Acción | Quién · Duración | Rev. · Depende de | Evidencia · Pasa / No pasa | Rollback |
|---|---|---|---|---|---|---|
| CT-01 | S01–S14 | Confirmar el estado de cada precondición de la tabla de § 1 en la **tienda comercial**, con evidencia por paso (pantalla o comando, sin tokens) | Claude (lectura) con la ventana visible + dueña (accesos) · NOT_AVAILABLE | Reversible (lectura) · S01–S14 hechos | **Pasa:** 14/14 con evidencia y sin A1–A5 ni B1–B4 abiertos, o cada excepción firmada por la dueña. **No pasa:** un paso sin evidencia | — |
| CT-02 | S04, S16 | **Congelamiento nivel 1** del sitio actual (§ 5.1): aviso escrito a quien edite | Dueña · NOT_AVAILABLE | Reversible · CT-01 | **Pasa:** aviso enviado y CT-32 y CT-43 no encuentran cambios de contenido. **No pasa:** hay un cambio posterior al aviso → repetir CT-03 y reconciliar | Levantar el aviso |
| CT-03 | S04, S06 | **Línea base del sitio actual:** copiar `launch/evidence/current-site/` y los CSV de paridad a una carpeta con fecha; correr `node launch/tools/03g-crawl-current-site.mjs` y `node launch/tools/03g-product-parity.mjs`; comparar con `launch/03G-product-parity.md` | Claude · NOT_AVAILABLE (70 GET) | Reversible (lectura; la copia evita perder la línea base) · CT-02 | **Límite de la herramienta (DIF-10):** `03g-product-parity.mjs` lee `launch/evidence/dev-products.jsonl`, `dev-collections.json` y `dev-routes.json` (capturas de la Dev Store), no la tienda comercial; la captura del lado Shopify no está scripteada (G05 y G07 del audit de reproducibilidad). Por eso este paso hace dos cosas: (a) con las dos herramientas, medir la deriva del sitio actual frente a la línea base de hoy; (b) para la tienda comercial, re-capturar en solo lectura `/products.json`, `/collections/<handle>/products.json` y una ficha por colección, con la ventana visible, y compararlas con `launch/03G-product-parity.csv` (cómo se automatiza esa re-captura: `[NOT_VERIFIED]`). **Pasa:** (a) sin cambios de título, precio, SKU, tallas, imágenes ni categoría respecto de la línea base; (b) 29 / 98 (o 97 según F-01 de `03G-product-parity.md`) / 95 en la tienda comercial. El orden por defecto de las colecciones (F-03, 0 de 29 posiciones iguales) y el inventario (F-04) son diferencias abiertas ya conocidas, no un fallo de esta comprobación. **No pasa:** una diferencia sin explicar → corregir en Shopify y repetir | — |
| CT-04 | S04 | Cerrar F-01 (XL de `alba-dorada-cafe-claro`) y F-04 (¿inventario rastreado?, cantidades reales) de `launch/03G-product-parity.md` según D-CT8. Si la XL no existe: quitar la variante `LG-AUR-000001-XL` | Dueña decide; Claude ajusta con OK · NOT_AVAILABLE | **IRREVERSIBLE si se elimina una variante o se borra/renombra un handle** (rompe SKU y redirecciones; recrear no restaura historial). Activar el seguimiento de inventario es reversible · D-CT8 | `/products.json` de la tienda comercial. **Pasa:** 29 / 98 / 95 (o 29 / 97 / 95 si se quitó la XL) y la decisión de inventario escrita. **No pasa:** conteos distintos de la decisión | Si solo se activó seguimiento: desactivarlo |
| CT-05 | S06 | **4 páginas legales** creadas con el texto verbatim aprobado, puertas G-PAY, G-PRIV, G-ENV y G-COOK abiertas, enlazadas en el menú Ayuda | Dueña aprueba; Claude pega y verifica por hash · ≈ 20 min de la dueña `[DOC:theme/03F-owner-actions-minimal.md]` B2 | Reversible (despublicar la página) · D-CT7, B2; sus puertas se cierran con otros pasos de este bloque: G-ENV con CT-07, G-PAY con CT-08 y G-COOK con el banner de CT-09 (en el runbook de analítica el texto, P-6, va antes del banner, P-7), así que la firma final de este paso va al terminar CT-09 | **Pasa:** `/pages/envios`, `/pages/terminos`, `/pages/privacidad` y `/pages/cookies` (o los destinos elegidos) con 200 y hash de texto igual a `content/legal/*.html` `[DOC:theme/03F-legal-owner-runbook.md]` § 11. **No pasa:** un 404 o un hash distinto → **NO-GO del DNS** (03E § 4.3) salvo decisión escrita de la dueña | Despublicar |
| CT-06 | S06 | **Redirecciones:** validar (`node seo/validate-redirects.mjs` → `RESULTADO: PASS`), importar `seo/shopify-redirects-import.csv` en la tienda comercial (encabezado exacto `Redirect from,Redirect to`) y agregar las 4 filas legales cuando existan sus destinos (Claude actualiza el validador con los 4 pasos de 03E § 4.3) | Dueña importa, o Claude con la ventana visible y OK · 1 min `[DOC:seo/03F-redirect-import-result.md]` § 4 | Reversible (seleccionar todas y eliminar) · CT-05, S04, S05 | Vista previa: **47** filas (51 con las legales) y `/producto/COSTA-ESMERALDA-AZUL` conserva la ruta. **Pasa:** conteo exacto y 0 errores de formato. **No pasa:** otro conteo o un error de formato | Admin > Redireccionamientos > seleccionar todas > Eliminar (RP-38; reimportar: RP-39) |
| CT-07 | S02, S10 | Verificar **mercado, idioma y envíos** de la tienda comercial: mercado principal Colombia, región de respaldo Colombia, español predeterminado, zona de Colombia con tarifa gratis desde $299.900 (regla `>=` después del cupón), D2 decidida y **T1–T12 del runbook de envío en "Pasa"**; `free_shipping_rate_confirmed` encendido solo si existe la tarifa gratis y T1–T7 y T10 pasan `[DOC:shipping/03F-owner-shipping-runbook.md]` § 13; los 3 códigos de descuento de prueba (S8 de ese runbook) **eliminados** en su S11, de modo que la lista de descuentos vuelva a ser la capturada en E6 | Dueña hace A1 (55–95 min `[DOC:theme/03F-owner-actions-minimal.md]`); Claude verifica · QA: NOT_AVAILABLE | Reversible en Dev; **IRREVERSIBLE el país base y "Cambiar idioma predeterminado"** en la tienda comercial (§ 3, DIF-05) · S01, D2 | **Pasa:** con país CO `Shopify.country` = CO, 29/29 disponibles, `add.js` 200, checkout `es-co` con "$ 199.920" para `brisa-natural-beige` talla S. **No pasa:** cualquiera de los cuatro, o un código de descuento de prueba sin eliminar → NO-GO | Runbooks de mercado (§ 12) y de envío (§ 12); RP-21 a RP-25 del plan de rollback |
| CT-08 | S11, S14 | **Wompi en modo prueba:** compuertas W-G1, W-G2 y W-G3 cerradas; NV abiertos registrados; tabla de resultados del runbook de Wompi (casos 1–6) completa; si W-G2 falló, resultados de la pasarela de prueba de Shopify (que exista en una tienda de pago es `[NOT_VERIFIED]`: las fuentes 03F la midieron para la Dev Store) | Dueña + Claude · ≈ 2 h (estimación de Claude, no medida) `[DOC:payments/03F-wompi-owner-runbook.md]` § 7; pasarela de prueba ≈ 30 min | Reversible (desactivar) · A1, S10 | **Pasa:** casos 1, 2 y 5 medidos y sin "cobro sin pedido". **No pasa:** el caso 5 con transacción `APPROVED` sin pedido, o W-G3 sin resolver mientras haya pentest en el sandbox, o W-G2 fallida en la tienda comercial sin pasarela de prueba disponible (los casos 1–5 solo se harían con dinero real: decisión escrita de la dueña o NO-GO) | Desactivar Wompi en Configuración > Pagos (RP-15; pasarela de prueba: RP-18) |
| CT-09 | S12 | **Analítica antes de la contraseña:** banner de cookies activo con Colombia, textos de cookies y privacidad aprobados (G-BANNER, G-LEGAL), nivel de Meta decidido (D-CT9), custom pixel apagado. La app Google & YouTube puede conectarse en modo privado (no registra); Meta se conecta después (CT-74) | Dueña · fase 2 ≈ 30 min sin contar su revisión legal (la fase 1, ≈ 30 min, corresponde a CT-07 y CT-08) `[DOC:analytics/03F-analytics-owner-runbook.md]` § 15 | Reversible (desconectar) · A1; textos de cookies y privacidad aprobados (P-6) antes del banner (P-7), y G-COOK se cierra con el banner ya activo (CT-05) | **Pasa:** el banner aparece en una visita desde Colombia; 0 coincidencias de `gtag`, `googletagmanager`, `fbq(`, `fbevents`, `dataLayer` en el theme `[DOC:analytics/03F-analytics-owner-runbook.md]` P-15. **No pasa:** sin banner con Colombia → no se quita la contraseña | Reactivar los ajustes automáticos del banner (RP-31) |
| CT-10 | S13, S09 | **Cuentas y favoritos:** A2 (código de ingreso, lo escribe la dueña) y, si D-CT10 = sí, A5 completo con los GO/NO-GO obligatorios del runbook de favoritos y **la app instalada en la tienda comercial con su propia distribución** | Dueña + Claude · A2 2 min; A5 90–120 min con Claude `[DOC:theme/03F-owner-actions-minimal.md]` | **IRREVERSIBLE: la distribución personalizada de la app** (no se puede cambiar el método una vez elegido y queda atada a esa tienda). El resto, reversible · D-CT10 | **Pasa:** A2: la cabecera muestra la sesión y `/account` abre la cuenta de Shopify. A5: GO/NO-GO 1–15 y W1 en verde. **Sin A5:** `wishlist_account_sync` = false y se declara solo invitada (diferencia con el sitio actual, que sí tiene `/cuenta/favoritos`). **No pasa:** A2 sin sesión, o un GO/NO-GO obligatorio de A5 en NO-GO (incluido P1 del runbook de favoritos, origen del token de Admin: para la tienda comercial es `[NOT_VERIFIED]`) → `wishlist_account_sync` queda apagado. La tienda comercial usa **otra** app del Dev Dashboard (P3 de ese runbook): que el paquete 0.1.2 congelado sirva sin cambios para ella (identificador y dominio propios) es `[NOT_VERIFIED]`; un cambio es un release nuevo (regla 7) | Interruptor `wishlist_account_sync` en OFF; niveles 1–5 (RP-32 a RP-36) |
| CT-11 | S08, S05 | **Search & Discovery** instalada (A3) y configurada: Talla, Color y Precio, sin Disponibilidad; matriz QA1–QA30; índice de búsqueda 29/29 en la tienda comercial (en Dev, `bikini` = 20 y `mostaza` = 1) | Dueña acepta permisos (≈ 5 min); Claude QA 45–60 min (estimación de Claude) `[DOC:theme/03F-search-discovery-owner-runbook.md]` § 8 | Reversible (desinstalar) · S04, S05 | **Pasa:** SD1–SD3 del runbook y `bikini` = 20, `mostaza` = 1. **No pasa:** índice estancado tras la importación masiva (incidente de 03D: se desbloqueó con un toque neto cero) o un caso de QA1–QA19 en falla | Niveles 1–3 de S&D y, como último recurso, desinstalar (RP-27); los filtros vuelven a Precio |
| CT-12 | S03, S07 | **Theme y media:** RC1.8 (o el release que fije D-CT18, § 5.3) en la tienda comercial con 96/96 archivos; los 12 archivos de media subidos y cableados (hero, tarjetas de categoría, banners, guía de tallas), o decisión escrita de lanzar sin ellos; logo y favicon (no están en el manifiesto de media, HP-02) o decisión escrita. El cableado cambia `templates/index.json` y `templates/product.json` (diferencia admitida, § 5.3) | Dueña da el OK de descarga (1 min `[DOC:theme/03F-owner-actions-minimal.md]` A4); Claude sube y cablea · NOT_AVAILABLE | Reversible (theme sin publicar; media reemplazable) · A4 | **Pasa:** Home con hero con media y banners de colección con imagen (hoy `bannerImg:false` en las 6 `[MEDIDO-03G]`), y logo y favicon cargados o con decisión escrita. **No pasa:** Home sin media, o sin logo y favicon, sin decisión escrita | Restaurar con `apply-media-wiring.mjs --restore` (RP-45) |
| CT-13 | S15 | **DNS, preparación:** identificar el proveedor; registrar en la hoja privada **todos** los registros actuales (web, correo, TXT, CAA) y su TTL; bajar el TTL de los registros web (apex y `www`) al menor valor que permita el proveedor `[PRÁCTICA-GENERAL]`; en Shopify agregar el dominio y anotar los registros que pida esa pantalla, sin fijarlo todavía como primario (qué hace un primario sin DNS con `*.myshopify.com` es `[NOT_VERIFIED]`); elegir el primario (D-CT4) para fijarlo en CT-62 | Dueña · NOT_AVAILABLE | Reversible (restaurar TTL; no cambia el destino) · D-CT3 | Ver V-DNS. **Pasa:** hoja completa, acceso al proveedor comprobado y TTL bajo visible en los resolvers. **No pasa:** sin acceso, o TTL anterior mayor que el tiempo que falta hasta T0 → **se mueve T0, no se acorta** | Restaurar el TTL anterior (RP-08) |
| CT-14 | S15, S16 | **Acceso al sitio actual sin el dominio:** la dueña anota la URL del proyecto en Vercel y entra por ella a `/admin/pedidos`. Tras T0, `radaelliswimwear.com/admin` ya no llega al sitio actual | Dueña · NOT_AVAILABLE | Reversible (lectura) · D-CT3 | **Pasa:** entra al panel por la URL del proyecto. **No pasa:** no entra, o la app redirige al dominio configurado (`getAppBaseUrl()` lee `APP_BASE_URL`, la fuente única del dominio `[DOC:docs/go-live-checklist.md]` `[DOC:lib/utils.ts]`, y arma la URL de retorno de Wompi, los enlaces de los correos, `metadataBase`, `robots` y `sitemap`): que el panel abra por la URL del proyecto es `[NOT_VERIFIED]` → resolver antes de T0 | — |
| CT-15 | S16 | **Comunicación a clientas:** decidir (no redactar) D-CT11 | Dueña · NOT_AVAILABLE | **Irreversible una vez enviada** (no se retira un mensaje) · — | **Pasa:** decisión escrita (sí o no) para cada punto de § 9.4. **No pasa:** un punto sin decisión → G1 en NO-GO (D-CT11) | — |
| CT-16 | S16 | Fijar T0 (D-CT1), disponibilidad de la dueña, de Claude y de quien opere el DNS, y la ventana de decisión tras T0; confirmar W-G3 (Wompi frente al pentest) | Dueña · NOT_AVAILABLE | Reversible · D-CT1, D-CT3 | **Pasa:** T0 escrito en la hoja privada, con las personas necesarias disponibles. **No pasa:** sin acceso al DNS, o pentest activo sobre el sandbox de Wompi sin acuerdo (W-G3) | Reprogramar |
| CT-17 | S06, S17 | **Línea base de Search Console** antes del corte: exportar la lista de URLs indexadas hoy y el estado de cobertura y de 404 del dominio, que es la fuente de verdad de lo que está posicionado (más allá del sitemap) `[DOC:launch/evidence/reference-docs/seo-analytics.md]` § 9; contrastar `/accesorios` y los posts del blog (D-CT6) y los productos que alguna vez estuvieron activos `[DOC:seo/03E-redirect-plan.md]` § 5.5 | Dueña · NOT_AVAILABLE (la propiedad de Search Console y su verificación no constan en ninguna fuente) | Reversible (lectura) · — | **Pasa:** exportación guardada fuera del repo, sin datos personales, y cruzada con los 47 orígenes de CT-06, las 4 legales y los 9 sin destino; cada URL indexada sin fila ni decisión queda anotada. **No pasa:** no hay acceso a la propiedad → constancia escrita y se sigue sin línea base (riesgo aceptado por la dueña) | — |

**Decisión G1 (fin de T-24h): ¿se mantiene T0?** Decide la dueña; Claude presenta la tabla de CT-01.

| Criterio | Fuente | Pasa si | Si no pasa |
|---|---|---|---|
| A1 y D2 cerrados; T1–T12 en "Pasa" | `[DOC:shipping/03F-owner-shipping-runbook.md]` § 11 | Sí | NO-GO: reprogramar |
| Wompi en modo prueba: casos 1, 2 y 5 medidos | `[DOC:payments/03F-wompi-owner-runbook.md]` § 9 | Sí, o pasarela de prueba si W-G2 falló, con riesgo aceptado por escrito | NO-GO |
| 4 legales publicadas y con fila de redirección | `[DOC:seo/03E-redirect-plan.md]` § 4.3 | Sí | NO-GO (o renuncia escrita de la dueña) |
| Catálogo: F-01 y F-04 resueltos; conteos según D-CT8 | `[MEDIDO-03G]` `launch/03G-product-parity.md` | Sí | NO-GO |
| Release y evidencia con copia fuera de esta máquina (§ 5.3) | `[DOC:launch/03G-reproducibility-gap-audit.md]` G03 | Sí | NO-GO |
| Banner con Colombia y textos de cookies y privacidad aprobados | `[DOC:analytics/03F-analytics-owner-runbook.md]` § 3 | Sí | No se quita la contraseña: NO-GO |
| Acceso al DNS, TTL bajado, panel del sitio actual accesible sin el dominio | CT-13, CT-14 | Sí | NO-GO o mover T0 |
| Línea base de Search Console exportada, o constancia de que no existe la propiedad (CT-17) | `[DOC:seo/03E-redirect-plan.md]` § 5.5 | Sí | NO-GO, o riesgo aceptado por escrito |
| D-CT1 a D-CT12 y D-CT15 a D-CT19 con respuesta (o con "no aplica" escrito) | § 4 | Sí | NO-GO |

### T-4h — Ensayo final en la tienda comercial protegida y compuerta de la ventana

**Objetivo:** repetir en modo prueba, con la contraseña puesta, lo esencial del E2E (S14). A partir de aquí no se cambian mercado, idioma, envíos ni artefactos del release; el único cambio de pagos es el paso a producción de CT-46, en T-1h.

| # | Paso | Acción | Quién · Duración | Rev. · Depende de | Evidencia · Pasa / No pasa | Rollback |
|---|---|---|---|---|---|---|
| CT-21 | S14, S11 | **Pedido de prueba, éxito:** tarjeta de prueba de Wompi aprobada (los datos los teclea la dueña), `brisa-natural-beige` talla S con dirección de Colombia | Dueña + Claude · pruebas 60–75 min (estimación de Claude, no medida) `[DOC:payments/03F-wompi-owner-runbook.md]` § 7 | Reversible (cancelar el pedido de prueba) · CT-08 | V-PAGO caso 1 y V-PEDIDO. **Pasa:** pedido nuevo con pago Pagado, COP, monto igual al de Wompi (en centavos: $199.920 = 19.992.000), envío de la zona CO y correo de confirmación recibido. **No pasa:** otro monto o moneda, sin pedido o sin el envío de la zona CO (que el correo no llegue es fix-forward, § 8.4) | Cancelar el pedido |
| CT-22 | S14, S11 | **Fallo:** tarjeta de prueba rechazada, un número cualquiera (estado `ERROR`) y PSE con el banco que rechaza | Dueña + Claude · dentro de los 60–75 min | Reversible · CT-21 | V-PAGO caso 2. **Pasa:** ningún pedido nuevo y mensaje de error a la clienta; en Wompi `DECLINED` o `ERROR`. **No pasa:** aparece un pedido pagado | — |
| CT-23 | S14, S11 | **Pendiente:** PSE **no** tiene pendiente en el sandbox; usar Daviplata con OTP inválido de 6 dígitos o Botón Bancolombia asíncrono si la app los ofrece; efectivo `[NOT_VERIFIED]` | Dueña + Claude · dentro de los 60–75 min | Reversible (cancelar el pedido si queda pendiente) · CT-21 | V-PAGO caso 3. **Pasa:** el comportamiento queda observado y documentado (¿pedido pendiente?, ¿se puede cancelar?, ¿qué pasa al aprobar o vencer?). **No pasa:** no se puede producir un pendiente ni entender su efecto → riesgo abierto que la dueña acepta por escrito o NO-GO | Cancelar el pedido |
| CT-24 | S14, S11 | **Reembolso total y parcial** de pedidos de prueba pagados | Dueña + Claude · dentro de los 60–75 min | Reversible · CT-21 | V-PAGO caso 4. **Pasa:** el pedido pasa a Reembolsado o Reembolsado parcialmente **y** Wompi refleja el reembolso. **No pasa (señal de riesgo):** Shopify dice "Reembolsado" y Wompi no muestra nada → decidir antes de CT-47 (D-CT14) | — |
| CT-25 | S14, S11 | **La clienta no vuelve:** pagar con éxito en Wompi y cerrar la pestaña; refrescar Pedidos y Checkouts abandonados a los 5 min y a los 35 min | Dueña + Claude · dentro de los 60–75 min | Reversible · CT-21 | V-PAGO caso 5. **Pasa:** el pedido aparece. **No pasa (bloqueante):** `APPROVED` en Wompi y ningún pedido en Shopify (cobro sin pedido) → NO-GO | Cancelar el pedido |
| CT-26 | S14 | **Checkout en teléfono real:** repetir CT-21 desde el móvil de la dueña, sin cambiar nada | Dueña + Claude · 2 min de revisión de pantalla `[DOC:theme/03F-mobile-checkout-baseline.md]` § 4 | Reversible · CT-21 | **Pasa:** resumen del pedido (ítem, talla, subtotal, COP), idioma `es-co`, orden de campos, botón de pago y volver al carrito. **No pasa:** un campo o botón inalcanzable | — |
| CT-27 | S13 | **Ingreso por código** en la tienda comercial (lo escribe la dueña; Claude no lo lee) y cierre de sesión | Dueña + Claude · A2 2 min `[DOC:theme/03F-owner-actions-minimal.md]` | Reversible (cerrar sesión) · A2 | V-CUENTAS. **Pasa:** la cabecera muestra la sesión y `/account` abre la cuenta nueva. **No pasa:** el ingreso no llega o cae en una plantilla antigua | Cerrar sesión |
| CT-28 | S09 | **Favoritos de invitada** (2 productos, recargar) y, si D-CT10 = sí, **de cuenta** (pasos 11–13 del runbook de favoritos) | Dueña + Claude · NOT_AVAILABLE | Reversible (desmarcar; interruptor OFF) · CT-10 | V-FAVORITOS. **Pasa:** invitada persiste y sin llamadas a `/apps/radaelli`; cuenta con GO/NO-GO obligatorios. **No pasa:** se pierde la lista de invitada, hay llamadas de cuenta sin sesión o un obligatorio en NO-GO | `wishlist_account_sync` OFF (RP-32) |
| CT-29 | S05, S08 | **Búsqueda y filtros:** `bikini` = 20, `mostaza` = 1, predictivo, filtros Talla, Color y Precio (QA1–QA10 y QA26) | Claude · NOT_AVAILABLE | Reversible (lectura) · CT-11 | V-BÚSQUEDA. **Pasa/No pasa:** por caso | — |
| CT-30 | S03, S07 | **Humo del theme:** Home (hero y banners), 4 colecciones, una ficha por colección, `/en`, y la **miga de las 4 fichas de Espuma de Ola** con RC1.8 (F-02) | Claude · NOT_AVAILABLE | Reversible (lectura) · CT-12 | **Pasa:** miga `Inicio / Espuma de Ola / <título>` en `bikini-palm-verde-oliva`, `bikini-shadow-azul-marino`, `enterizo-shadow-palm-azul-marino` y `entero-golden-hour`. **No pasa:** aparece "Destacados" | — |
| CT-31 | S06 | `node seo/validate-redirects.mjs` otra vez (PASS) y el conteo de redirecciones en el Admin de la tienda comercial | Claude · NOT_AVAILABLE | Reversible (lectura) · CT-06 | **Pasa:** 47 (51 con legales). **No pasa:** otro conteo | Reimportar |
| CT-32 | S04 | **Deriva del sitio actual:** `<lastmod>` de los productos en el sitemap (§ 5.1, punto 2) y confirmación de la dueña de que nadie editó | Claude + dueña · NOT_AVAILABLE | Reversible (lectura) · CT-02 | **Pasa:** ningún `lastmod` posterior al inicio del congelamiento. **No pasa:** hay uno → repetir CT-03 y reconciliar | — |
| CT-33 | S15 | **TTL efectivo:** los resolvers muestran ya el TTL bajo de CT-13 | Dueña + Claude · NOT_AVAILABLE | Reversible (lectura) · CT-13 | V-DNS punto 2. **Pasa:** TTL bajo visible. **No pasa:** sigue el TTL anterior → mover T0 | — |

**Decisión G2 (fin de T-4h): ¿se autoriza la ventana?** A partir de la siguiente marca hay acciones con efecto sobre clientas (pausa de ventas del sitio actual si D-CT2 = A) y CT-47 crea el **primer pedido real (PNR-1 del plan de rollback)**. G2 es el go/no-go firmado por la dueña, con los umbrales de D-CT15, que ese plan exige antes de PNR-1 `[DOC:launch/03G-rollback-plan.md]` § 12.4, puntos 1 y 2; el segundo go/no-go es G5 a G7, después de S15 y S16. Decide la dueña.

| Criterio | Pasa si | Si no pasa |
|---|---|---|
| CT-21, CT-22 y CT-25 en "Pasa"; CT-23 y CT-24 con resultado documentado | Sí | NO-GO: reprogramar; levantar el congelamiento de catálogo |
| CT-26, CT-27, CT-28 y CT-29 en "Pasa" (favoritos de cuenta solo si D-CT10 = sí) | Sí | NO-GO |
| CT-30 y CT-31 en "Pasa"; CT-32 sin deriva | Sí | NO-GO |
| CT-33 con TTL bajo efectivo; acceso al DNS confirmado | Sí | Mover T0 |
| D-CT2, D-CT14 y D-CT15 decididas; SR-01 a SR-12 con constancia salvo SR-10 y SR-06/SR-07/SR-08/SR-09 de la tienda comercial, que se cierran en CT-43 y CT-47 | Sí | NO-GO |

### T-1h — Pausa de ventas del sitio actual, publicación y humo de producción

**Objetivo:** dejar todo listo para el DNS. Aquí ocurren los primeros efectos externos: pausa del sitio actual (si D-CT2 = A), publicar el theme y pasar Wompi a producción, con la contraseña todavía puesta (la tienda no es visible para clientas).

| # | Paso | Acción | Quién · Duración | Rev. · Depende de | Evidencia · Pasa / No pasa | Rollback |
|---|---|---|---|---|---|---|
| CT-41 | S16 | **Drenar el sitio actual** (solo D-CT2 = A): sin pagos `PENDING`, sin pedidos de WhatsApp pendientes, sin `flaggedForReviewAt` sin resolver; comparar `/admin/pedidos` con el panel de Wompi de producción | Dueña · NOT_AVAILABLE | Reversible (lectura) · G2 | **Pasa:** 0 pagos `PENDING` sin resolver, o cada uno registrado en la hoja. **No pasa:** un `PENDING` viejo sin conciliar → no se pausa | — |
| CT-42 | S16 | **Pausa de ventas** del sitio actual: `WRITES_PAUSED=true` y redeploy del mismo commit (§ 5.2) | Dueña · NOT_AVAILABLE (duración del redeploy) | Reversible con efecto: los eventos de Wompi devuelven 503 mientras dure · CT-41 | **Pasa:** pantalla de Vercel con la variable y un deployment de producción **posterior** en estado listo. Prueba funcional sin crear datos: NOT_AVAILABLE. **No pasa:** el deployment no incluye la variable | Quitar la variable y redeployar el mismo commit (RP-10; en un rollback total va antes de devolver el DNS, § 5.2) |
| CT-43 | S04 | **Foto final del sitio actual:** `node launch/tools/03g-crawl-current-site.mjs` y `node launch/tools/03g-product-parity.mjs` (con copia previa) y comparación con CT-03 (con el mismo límite de la herramienta de paridad: el lado Shopify se re-captura aparte); si D-CT8 = rastrear inventario, cargar en Shopify el stock **real confirmado por la dueña** (no el patrón uniforme del sitio) | Claude + dueña · NOT_AVAILABLE | Reversible salvo la eliminación de variantes (CT-04) · CT-42 | **Pasa:** solo cambió el stock por pedidos; 0 cambios de título, precio, tallas, imágenes o categoría. **No pasa:** cualquier otro cambio → reconciliar en Shopify antes de seguir | — |
| CT-44 | S03 | **Verificar el release** en la tienda comercial: `pull` del theme y comparación archivo por archivo contra `dist/radaelli-shopify-theme-rc1.8.zip` (SHA-256 `e893b386…9e67`) o contra el release nuevo que fije D-CT18 (§ 5.3), admitiendo solo las diferencias anotadas: `config/settings_data.json` y, si hubo cableado de media, `templates/index.json` y `templates/product.json` | Claude · NOT_AVAILABLE | Reversible (lectura) · CT-12 | **Pasa:** 96/96 archivos presentes e idénticos, salvo las diferencias admitidas, cada una con su hash anotado. **No pasa:** cualquier otra diferencia | Empujar de nuevo el ZIP congelado (RP-04) |
| CT-45 | S16 | **Publicar el theme RC1.8** y, en el mismo paso, asignar la plantilla `page.wishlist` a la página Favoritos (el Admin solo ofrece plantillas del theme publicado) | Dueña · NOT_AVAILABLE | **IRREVERSIBLE en la práctica:** 03B lo llama "acción irreversible"; técnicamente se puede publicar otro theme, pero desde que la tienda es visible lo que se indexe o se cachee no se retira. Con la contraseña puesta el efecto externo es nulo hasta CT-51 · CT-44 | **Pasa:** Tienda online > Temas: RC1.8 (o el release de D-CT18) con rol de publicado y `/pages/favoritos` con la plantilla asignada. **No pasa:** otra versión publicada, o plantilla sin asignar | RC1.7 sin tocar el theme vivo (RP-05) o el theme anterior (RP-06), con el límite de la razón anterior |
| CT-46 | S11 | **Wompi a producción:** la dueña escribe las llaves de producción (`pub_prod_`, `prv_prod_`) en el formulario de la app, sin pasarlas por el chat; y, **solo con el sitio actual pausado (D-CT2 = A)**, carga en el campo de **producción** del panel de Wompi la URL de eventos de Shopify (la del § 5.1 del runbook de Wompi). Antes anota en la hoja privada el valor previo de esa URL. Con D-CT2 = B la URL se mueve en T0 (§ 5.2) | Dueña · NOT_AVAILABLE | Reversible con efecto: con A, **el sitio actual deja de recibir eventos de Wompi** · CT-42 (con A) | **Pasa:** Configuración > Pagos con Wompi activo con llaves de producción, sin plan ni cargo nuevo aceptado (R3). **No pasa:** la app exige aprobar facturación, o Wompi no acepta la conexión de producción (P1 de Wompi sin respuesta) → NO-GO | Volver a llaves de prueba y restaurar la URL de eventos anotada (RP-15 y RP-16; en el sitio actual, RP-11) |
| CT-47 | S14, S11 | **Humo de producción con dinero real** (D-CT14): la dueña paga con su tarjeta un producto (propuesta `[INFERIDO]`: el de menor precio, `bikini-shadow-azul-marino` talla M = $159.920 `[DOC:shipping/03F-owner-shipping-runbook.md]` § 11, T2; producto y monto los decide la dueña en D-CT14) más el envío que corresponda a D2; luego reembolsa desde Shopify. Además, cerrar SR-06, SR-07, SR-08 y SR-09 de la hoja privada con capturas de la tienda comercial (§ 5.4) | Dueña + Claude · NOT_AVAILABLE | **Irreversible en dinero y comisión (PNR-1: desde aquí la conciliación es obligatoria si hay rollback, § 8.10 del plan de rollback):** el pedido es real; Shopify cobra su comisión por proveedor externo sobre pedidos reales `[DOC:payments/03F-wompi-owner-runbook.md]` § 11; el reembolso llega a Wompi `[NOT_VERIFIED]` (NV6) · CT-46 | V-PAGO-PROD. **Pasa:** pedido Pagado en COP, monto igual al de Wompi, transacción `APPROVED` en el panel de producción, correo recibido, 1 pedido y 1 cobro. **No pasa:** cualquiera de los anteriores, un doble cobro o un cobro sin pedido → AB-03 | Reembolsar (RP-53); pagos en vuelo y casos abiertos: RP-20 y RP-50; volver a llaves de prueba |

**Decisión G3 (fin de T-1h): ¿se quita la contraseña y se cambia el DNS?** Decide la dueña.

| Criterio | Pasa si | Si no pasa |
|---|---|---|
| CT-41 y CT-42 hechos (D-CT2 = A) o D-CT2 = B con las diferencias de § 5.2 aceptadas | Sí | NO-GO: despausar el sitio actual y reprogramar |
| CT-43 sin deriva sin explicar | Sí | NO-GO |
| CT-44 y CT-45 en "Pasa" | Sí | NO-GO |
| CT-46 y CT-47 en "Pasa" (con D-CT2 = B, CT-46 carga solo las llaves de producción y CT-47 pasa a T+15m; § 5.2) | Sí | NO-GO (AB-03) |
| La hoja privada de rollback está completa (§ 5.4) | Sí | NO-GO |

### T-15m — Última compuerta antes del DNS

**Objetivo:** hacer visible la tienda en su dirección `*.myshopify.com`, verificar todo lo que se pueda verificar sin el dominio y dejar el DNS listo para pegar.

| # | Paso | Acción | Quién · Duración | Rev. · Depende de | Evidencia · Pasa / No pasa | Rollback |
|---|---|---|---|---|---|---|
| CT-51 | S16 | **Quitar la contraseña de la tienda** (Tienda online, acceso a la tienda; el nombre exacto de la opción en español es `[NOT_VERIFIED]`) | Dueña · NOT_AVAILABLE | Reversible con efecto: desde este momento la tienda es pública en `<TIENDA>.myshopify.com` y un buscador puede rastrearla `[PRÁCTICA-GENERAL]` · CT-09, G3 | **Pasa:** una ventana privada abre `https://<TIENDA>.myshopify.com/` con 200 y sin pasar por `/password` (en la Dev Store, `/` redirige a `/password` `[DOC:theme/03B-store-foundation-report.md]`). **No pasa:** sigue la página de contraseña | Volver a activar la contraseña (RP-03) |
| CT-52 | S06 | **Redirecciones sobre `<TIENDA>.myshopify.com`:** `node launch/tools/03g-cutover-redirect-matrix.mjs https://<TIENDA>.myshopify.com` y correr los comandos que imprime | Claude · NOT_AVAILABLE | Reversible (lectura) · CT-51, CT-06 | V-REDIR completo. **Pasa/No pasa:** criterios de V-REDIR | Corregir la fila y reimportar |
| CT-53 | S03, S05 | **Humo público:** Home 200; colecciones y fichas; `/search`; `/cart`; `/robots.txt` (buscar la regla `/policies/`); `noindex` en búsqueda y favoritos; **nombre de la tienda:** ni el `<title>`, ni `og:site_name`, ni la cabecera ni el pie dicen "Dev" (HP-01, BLOCKER de `theme/03G-home-parity.md`); logo y favicon según D-CT18 | Claude · NOT_AVAILABLE | Reversible (lectura) · CT-51 | **Pasa:** 200 en cada una y `noindex` donde corresponde `[MEDIDO-03G]` dev-routes. **No pasa:** un 404, un `noindex` faltante o el nombre "Dev" visible → NO-GO (no se hace pública una tienda que dice "Dev") | — |
| CT-54 | S12 | **Analítica sin duplicados posibles:** custom pixel apagado o sin instalar; sin tags manuales en el theme; app Google & YouTube conectada | Claude + dueña · NOT_AVAILABLE | Reversible · CT-09 | **Pasa:** D3, D6 y D7 de V-ANALÍTICA en verde. **No pasa:** un pixel manual o un GTM heredado | Quitar el tag duplicado |
| CT-55 | S15 | **Dominio en Shopify listo** y registros de Shopify a la vista; hoja privada con los valores actuales del DNS | Dueña · NOT_AVAILABLE | Reversible · CT-13 | **Pasa:** pantalla de dominios de la tienda (nombre exacto `[NOT_VERIFIED]`) con el dominio agregado, sus registros a la vista y **sin fijarlo todavía como primario** (qué hace un primario sin DNS con `*.myshopify.com` es `[NOT_VERIFIED]`; el primario se fija en CT-62). **No pasa:** la pantalla muestra un error o el dominio ya quedó como primario | Quitar el dominio de Shopify, solo tras cerrar la conciliación (RP-14) |
| CT-56 | S15 | **Sondeo "antes":** `curl.exe -sI https://radaelliswimwear.com/producto/bikini-foam` debe dar **200** (sitio actual; en Shopify daría 301) y `curl.exe -s https://radaelliswimwear.com/robots.txt` (el cuerpo, no solo las cabeceras) debe seguir siendo el del sitio actual, con `Disallow: /admin` y `Host: https://radaelliswimwear.com` (228 bytes hoy, frente a 3.642 en Shopify `[MEDIDO-03G]`) | Claude · NOT_AVAILABLE | Reversible (lectura) · — | **Pasa:** 200 en la ficha y `robots.txt` del sitio actual; es la referencia para detectar la propagación. **No pasa:** el dominio ya responde como Shopify (DNS ya cambiado por error) o no responde | — |

**Decisión G4 (fin de T-15m): ¿se ejecuta T0?** Es el último punto antes del cambio de DNS. Decide la dueña.

| Criterio | Pasa si | Si no pasa |
|---|---|---|
| CT-51 a CT-53 en "Pasa" | Sí | NO-GO: volver a poner la contraseña, despausar el sitio actual (§ 8.2) |
| Las 4 legales existen con su redirección (CT-52) | Sí | NO-GO (03E § 4.3) o renuncia escrita |
| Hoja privada de rollback completa y acceso al DNS disponible | Sí | NO-GO |

### T0 — Cambio de DNS

**Definición:** T0 es el instante en que la dueña guarda el cambio de DNS. Desde aquí, según el TTL previo, las visitas empiezan a llegar a Shopify.

| # | Paso | Acción | Quién · Duración | Rev. · Depende de | Evidencia · Pasa / No pasa | Rollback |
|---|---|---|---|---|---|---|
| CT-61 | S15 | **Cambiar el DNS:** editar **solo** los registros web (apex y `www`) con **exactamente** lo que muestra la pantalla de dominios de Shopify; no tocar MX, TXT, CAA ni los demás; guardar los valores anteriores | Dueña · NOT_AVAILABLE; propagación "minutos a horas según TTL" `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 18.6 | **IRREVERSIBLE en sus efectos:** la operación se deshace restaurando los valores anteriores, pero las visitas, pedidos y URLs que Shopify sirvió entre medias no se retiran; los buscadores pueden recolectar el cambio · G4 | V-DNS. **Pasa:** el proveedor confirma el guardado y la hoja registra la hora. **No pasa:** el proveedor rechaza el valor | Restaurar los valores anteriores (RP-12 y RP-13 de `launch/03G-rollback-plan.md`) |
| CT-62 | S15 | En Shopify: verificar la conexión del dominio y fijar el **primario** según D-CT4 | Dueña · NOT_AVAILABLE | Reversible · CT-61 | **Pasa:** dominio conectado y primario elegido. **No pasa:** Shopify no verifica | Cambiar el primario |
| CT-63 | S15 | **Sondeo de propagación** con el criterio de CT-56: `curl.exe -sI https://radaelliswimwear.com/producto/bikini-foam` pasa de 200 a **301** cuando llega a Shopify; y `nslookup radaelliswimwear.com` contra dos resolvers públicos. Registrar hora y resultado en cada sondeo (el intervalo lo fija la dueña) | Claude + dueña · NOT_AVAILABLE | Reversible (lectura) · CT-61 | **Pasa:** el 301 aparece y el DNS coincide con los valores de Shopify. **No pasa:** sigue el 200 pasado el TTL previo `[PRÁCTICA-GENERAL]` | — |
| CT-64 | S15 | **SSL/HTTPS** en apex y `www` (V-SSL) | Claude · NOT_AVAILABLE (el tiempo de emisión del certificado no está en las fuentes) | Reversible (lectura) · CT-63 | **Pasa:** V-SSL `[PRÁCTICA-GENERAL]` sin errores. **No pasa:** error de certificado o `http://` sin salto a `https://` | — |

**Decisión G5 (fin de T0): ¿resuelve a Shopify con HTTPS válido?** Decide la dueña; Claude presenta la evidencia de CT-63 y CT-64.

| Criterio | Pasa si | Si no pasa |
|---|---|---|
| CT-63 y CT-64 en "Pasa" | Sí | Esperar hasta que se cumpla el TTL previo y la pantalla de dominios lo permita; si persiste: **RB-01** (rollback de DNS) |
| Ningún error de certificado visible para una visitante | Sí | RB-01 |

### T+15m — Humo mínimo en el dominio real

| # | Paso | Acción | Quién · Duración | Rev. · Depende de | Evidencia · Pasa / No pasa | Rollback |
|---|---|---|---|---|---|---|
| CT-71 | S06 | **Redirecciones en `radaelliswimwear.com`:** `node launch/tools/03g-cutover-redirect-matrix.mjs` y correr los comandos; más `http://` a `https://` y `www` a apex | Claude · NOT_AVAILABLE | Reversible (lectura) · G5 | **Pasa:** V-REDIR. **No pasa:** un 404 en alguno de los 29 productos o 4 colecciones, un bucle, o un código distinto de 301 (registrar y decidir: el CSV no permite elegir el código) | Reimportar la fila corregida (RP-37; todas: RP-38 y RP-39) |
| CT-72 | S14, S10 | **Humo de compra hasta la pantalla de pago, sin pagar**, con país Colombia: agregar al carrito, envío, checkout `es-co` | Claude + dueña · NOT_AVAILABLE | Reversible · CT-71 | **Pasa:** ítem, talla, subtotal, COP, tarifa de envío según D2, Wompi ofrecido. **No pasa:** agotado, sin método de envío o "no puede aceptar pagos" → **RB-02** | Contención según DR-05: RP-01 (desactivar Wompi), RP-02 (quitar la zona) o RP-03 (contraseña), mientras se corrige |
| CT-73 | S15, S06 | **Canonical, hreflang, `robots.txt` y sitemap** en el dominio real: canonical de la Home igual a `https://radaelliswimwear.com/` (o `www` si D-CT4 lo fijó), hreflang `x-default`, `es`, `en` (según D-CT19); `/robots.txt` con la regla `/policies/`; sitemap con 29 productos | Claude · NOT_AVAILABLE | Reversible (lectura) · CT-71 | **Pasa:** los tres, y el `<title>` de la Home ya no dice "Dev" (hoy "Radaelli Swimwear Dev" en la Dev Store, `[MEDIDO-03G]` `launch/03G-route-parity.md` F-13; su meta description es decisión C1 de la dueña). **No pasa:** canonical en `*.myshopify.com`, sin hreflang o con "Dev" en el título | Corregir el primario (CT-62) o el nombre de la tienda |
| CT-74 | S12 | **Meta:** conectar la app Facebook & Instagram (la tienda ya es pública) y el banner; el nivel según D-CT9 | Dueña · ≈ 45 min de la dueña `[DOC:analytics/03F-analytics-owner-runbook.md]` § 15 | Reversible (desconectar) · CT-51 | **Pasa:** canal conectado. **No pasa:** el canal no termina la configuración (país no soportado: `[NOT_VERIFIED]`, riesgo R11) → fix-forward, no rollback | Desconectar la cuenta (RP-29) |
| CT-75 | S16 | **Sitio actual:** ¿entraron pedidos por DNS rezagado (D-CT2 = B) o pagos iniciados antes de T0 y terminados después (§ 5.2)? Revisar `/admin/pedidos` por la URL del proyecto (CT-14) y contrastar con las transacciones `APPROVED` del panel de Wompi de producción | Dueña · NOT_AVAILABLE | Reversible (lectura) · CT-14 | **Pasa:** lista de pedidos rezagados y de pagos en vuelo atendidos a mano. **No pasa:** un pedido o un pago sin atender | Si hay pedidos en los dos sistemas: § 8.10 del plan de rollback (RP-47 a RP-52; síntoma SY-20) |

**Decisión G6 (fin de T+15m): ¿continuar o rollback?** Decide la dueña dentro de la ventana de decisión de D-CT1.

| Criterio | Pasa si | Si no pasa |
|---|---|---|
| CT-71 (29 productos y 4 colecciones), CT-72 y CT-73 | Sí | CT-72 → **RB-02**. CT-71 o CT-73 → corregir adelante (fix-forward), no es rollback |
| CT-74 no bloquea | Sí | Fix-forward |

### T+1h — Humo completo

| # | Paso | Acción | Quién · Duración | Rev. · Depende de | Evidencia · Pasa / No pasa | Rollback |
|---|---|---|---|---|---|---|
| CT-81 | S12 | **Analítica:** los 11 eventos de GA4 y los 7 de Meta del embudo, consentimiento (K1–K4) y no duplicación (D1–D5, D8–D11) sobre el dominio real | Claude observa; dueña abre las sesiones · ~45 min de Claude `[DOC:analytics/03F-analytics-owner-runbook.md]` § 15 | Reversible (desconectar la app o el pixel) · CT-74 | V-ANALÍTICA. **Pasa:** cada evento una vez, `COP`, sin datos personales. **No pasa:** duplicados o datos personales → **fix-forward inmediato** (desconectar), no rollback de DNS | Desconectar la integración que duplica (RP-28 a RP-30) |
| CT-82 | S13 | **Cuentas en el dominio real:** ingreso por código (lo escribe la dueña) y cierre de sesión | Dueña + Claude · 2 min `[DOC:theme/03F-owner-actions-minimal.md]` A2 | Reversible · CT-71 | V-CUENTAS. **Pasa/No pasa:** por caso | Cerrar sesión |
| CT-83 | S09 | **Favoritos en el dominio real:** invitada y, si D-CT10 = sí, de cuenta | Dueña + Claude · NOT_AVAILABLE | Reversible · CT-71 | V-FAVORITOS. **Pasa/No pasa:** por caso | `wishlist_account_sync` OFF (RP-32) |
| CT-84 | S05, S08 | **Búsqueda y filtros en el dominio real** (QA1–QA10 y QA26) y `/en` | Claude · NOT_AVAILABLE | Reversible (lectura) · CT-71 | V-BÚSQUEDA. **Pasa/No pasa:** por caso | — |
| CT-85 | S14, S16 | **Primer pedido real:** seguirlo de punta a punta (Shopify, Wompi, correo, `purchase` de GA4 y Meta) | Dueña + Claude · NOT_AVAILABLE | Reversible (lectura) · CT-74 | **Pasa:** el pedido de Shopify, la transacción de Wompi y el correo coinciden en monto y referencia. **No pasa:** cobro sin pedido → **RB-03** | — |
| CT-86 | S17 | **Search Console:** enviar `/sitemap.xml` del dominio real (la propiedad y su verificación: NOT_AVAILABLE) `[DOC:seo/03E-redirect-plan.md]` § 7.5 | Dueña · NOT_AVAILABLE | Reversible (lectura) · CT-73 | **Pasa:** sitemap enviado sin errores. **No pasa:** Search Console lo rechaza o no hay acceso a la propiedad → registrar y resolver; no dispara rollback | — |

**Decisión G7 (fin de T+1h): ¿termina la ventana crítica?** Decide la dueña; Claude presenta las tablas de CT-81 a CT-86.

| Criterio | Pasa si | Si no pasa |
|---|---|---|
| CT-81 a CT-85 sin RB abierto | Sí | El RB que corresponda (§ 8.3) |
| El rollback sigue disponible con la hoja privada completa | Sí | Completar la hoja: la dueña decide |

### T+24h — Conciliación y cierre

| # | Paso | Acción | Quién · Duración | Rev. · Depende de | Evidencia · Pasa / No pasa | Rollback |
|---|---|---|---|---|---|---|
| CT-91 | S17 | **Conciliación de 24 h:** pedidos de Shopify frente a transacciones de Wompi frente a `purchase` de GA4 y `Purchase` de Meta; pagos `PENDING` de Wompi | Claude + dueña · NOT_AVAILABLE | Reversible (lectura) · G7 | **Pasa:** cada transacción `APPROVED` tiene su pedido. **No pasa:** cobro sin pedido → RB-03; GA4 por debajo de Shopify es el riesgo R8 documentado (la clienta no vuelve a la página de agradecimiento): anotar | — |
| CT-92 | S17 | **Search Console:** línea base de cobertura y de 404; vigilar "No encontrada (404)" y "Página con redirección" durante **4 a 8 semanas** `[DOC:seo/03E-redirect-plan.md]` § 7.5 | Dueña · NOT_AVAILABLE | Reversible (lectura) · CT-86 | **Pasa:** lista de 404 con su origen. **No pasa:** un 404 en una URL con redirección esperada → corregir | Reimportar la fila |
| CT-93 | S16, S17 | **Sitio actual:** se conserva sin desmantelar (§ 9.1); decidir si `WRITES_PAUSED` sigue activo o se levanta para despachar y cambiar estados de los pedidos ya pagados en el sitio actual | Dueña · NOT_AVAILABLE | Reversible · D-CT13 | **Pasa:** sitio actual intacto y pausado, o con la decisión escrita sobre `WRITES_PAUSED`. **No pasa:** un cambio en Vercel, Neon o Wompi sin registrar, o pedidos ya pagados sin despachar por la pausa | Ver `launch/03G-rollback-plan.md` |
| CT-94 | S15 | **DNS:** subir el TTL solo cuando el resultado sea estable y la dueña cierre la ventana de rollback; valor NOT_AVAILABLE `[PRÁCTICA-GENERAL]` | Dueña · NOT_AVAILABLE | Reversible · G8 | **Pasa:** registro guardado con el valor anotado y decisión de la dueña de cerrar la ventana de rollback. **No pasa:** se sube antes de cerrar esa ventana (G8) | Volver al TTL bajo (DR-03) |
| CT-95 | S17 | **Comunicación y datos históricos:** ejecutar lo decidido en D-CT11 y D-CT12; decidir el destino de los pedidos y clientas del sitio actual | Dueña · NOT_AVAILABLE | **Irreversible lo enviado** · D-CT11, D-CT12 | **Pasa:** decisión registrada de lo enviado y de los datos históricos (D-CT11, D-CT12). **No pasa:** se envía un aviso que no se decidió en CT-15 | — |
| CT-96 | S17 | **Pendientes:** C1 a C5 (meta description de la Home, "Recomendado para vos", voseo o tuteo, contraste de botones, limpieza de páginas y colecciones creadas por Shopify), respuestas de Wompi P1–P9, primera factura de Shopify (comisión de proveedor externo, NV14) | Dueña + Claude · NOT_AVAILABLE | Reversible · — | **Pasa:** cada pendiente con responsable y decisión de la dueña (`[DOC:theme/03F-owner-actions-minimal.md]` sección C; `[DOC:payments/03F-wompi-owner-runbook.md]` § 13). **No pasa:** un pendiente que afecta la compra sin responsable → fix-forward | — |

**Decisión G8 (fin de T+24h): ¿se cierra la ventana de cutover?** Decide la dueña; Claude presenta la conciliación de CT-91.

| Criterio | Pasa si | Si no pasa |
|---|---|---|
| CT-91 sin cobro sin pedido; CT-92 sin 404 inesperados | Sí | Mantener la ventana abierta y decidir RB-03 |
| D-CT13: la dueña deja escrito cuánto se conserva el sitio actual | Sí | El sitio actual se conserva por defecto |

## 7. Bloques de verificación

### V-REDIR — redirecciones (47 del CSV, 4 legales pendientes y comportamiento medido)

Herramienta: `node launch/tools/03g-cutover-redirect-matrix.mjs [BASE_URL]`. Lee `seo/shopify-redirects-import.csv`, comprueba los conteos y **imprime los comandos**; no hace peticiones (offline y determinista). Salida con la base por defecto: 47 filas clasificadas, `RESULTADO: OK`. El bucle completo sobre el CSV está en `seo/03E-redirect-plan.md` § 7.4.

| Tipo | Filas | Ejemplo de comando | Primer salto esperado | Destino final esperado | Fuente |
|---|---:|---|---|---|---|
| Colecciones | 4 | `curl.exe -sI "https://radaelliswimwear.com/oasis-natural"` | 301 a `/collections/oasis-natural` | 200 (`salidas-de-bano` con 0 productos, igual que hoy) | `[DOC:seo/03F-redirect-import-result.md]` |
| Productos | 29 | `curl.exe -sI "https://radaelliswimwear.com/producto/bikini-foam"` | 301 a `/products/bikini-foam` | 200 | ídem |
| Producto en mayúsculas o minúsculas | (1 de las 29, más 1 caso en minúsculas) | `curl.exe -sI "https://radaelliswimwear.com/producto/costa-esmeralda-azul"` | 301 a `/products/costa-esmeralda-azul`; la fila del CSV está en mayúsculas y Shopify **no distingue mayúsculas** (medido en la Dev Store) | 200 | `[DOC:seo/03F-redirect-import-result.md]` § 3 |
| Legales migradas | 2 | `curl.exe -sI "https://radaelliswimwear.com/garantia"` | 301 a `/pages/garantia` y `/devoluciones` a `/policies/refund-policy` | 200 (`/policies/` puede estar bloqueada en `robots.txt`: `[NOT_VERIFIED]`) | ídem |
| Búsqueda | 1 | `curl.exe -sI "https://radaelliswimwear.com/buscar?q=bikini"` | 301 a `/search?q=bikini` (conserva el query) | 200, `noindex` | ídem |
| Favoritos | 2 | `curl.exe -sI "https://radaelliswimwear.com/favoritos"` | 301 a `/pages/favoritos` | 200, `noindex`; con la plantilla `page.wishlist` asignada (CT-45) | `[DOC:seo/03E-redirect-plan.md]` § 5.5 |
| Cuenta | 9 | `curl.exe -sI "https://radaelliswimwear.com/cuenta"` | 301 a `/account` (4), `/account/login` (4) o `/account/register` (1) | **No seguir hasta el final**: Shopify salta a su dominio de cuentas; cadena de 2 por diseño | `[DOC:seo/03F-redirect-import-result.md]` § 2 |
| **Legales pendientes (fuera del CSV)** | 4 | `curl.exe -sI "https://radaelliswimwear.com/envios"` | 301 al destino que fije D-CT7 (propuesta de 03F: `/pages/envios`, `/pages/terminos`, `/pages/privacidad`, `/pages/cookies`) | 200 | `[DOC:theme/03F-legal-owner-runbook.md]` fase E |
| Sin destino | 9 | `curl.exe -sI "https://radaelliswimwear.com/accesorios"` | **404** (no 302 a la Home: Google desaconseja redirigir en masa a la Home) | — | `[DOC:seo/03E-redirect-plan.md]` § 4.1 y § 8 |
| Query y barra final | 3 | `curl.exe -sI "https://radaelliswimwear.com/oasis-natural/"` | 301 a la colección; conserva `?utm_source=x` | 200 | `[DOC:seo/03F-redirect-import-result.md]` |
| Plataforma | 6 | `curl.exe -sI "https://radaelliswimwear.com/robots.txt"` | 200 (Home, `/en` solo si D-CT19 = publicar inglés, `robots.txt`, `sitemap.xml`, `/search`, `/pages/favoritos`) | 200 | `[MEDIDO-03G]` dev-routes |

- **Destino final de un producto:** `curl.exe -sIL -o NUL -w "%{http_code} %{url_effective}\n" "https://radaelliswimwear.com/producto/bikini-foam"` debe dar `200` y la URL `/products/bikini-foam`.
- **Pasa si:** 47/47 con primer salto **301** y `Location` igual al destino del CSV; 38 filas con destino final 200 (29 productos, 4 colecciones, `/devoluciones`, `/garantia`, `/buscar`, `/favoritos` y `/cuenta/favoritos`); los 9 de cuenta con el primer salto correcto; las 4 legales con 301 y 200; los 9 "sin destino" con 404; 0 bucles; ningún salto extra salvo `www` a apex si D-CT4 lo exige (03E § 5.4).
- **No pasa si:** algún producto o colección da 404 o bucle; un origen da 302 en vez de 301 (el código exacto es `[NOT_VERIFIED]` hasta la primera corrida; Shopify documenta las redirecciones como permanentes); una legal pendiente da 404 (**NO-GO** antes de T0).
- **Chequeos sin evidencia previa en el sitio actual:** `http://` a `https://` y `www` a apex no se probaron en el sitio actual (`[MEDIDO-03G]` baseline § 12.3); se prueban aquí solo sobre Shopify.

### V-DNS — genérico `[PRÁCTICA-GENERAL]`

El proveedor, los registros actuales y el TTL son **NOT_AVAILABLE hasta que la dueña los aporte**. No se inventan IPs ni valores: los valores nuevos los muestra la pantalla de dominios de Shopify.

1. **Inventario previo (CT-13):** todos los registros de la zona: web (apex y `www`), correo (MX), TXT (SPF, DKIM, DMARC, verificaciones), CAA y cualquier otro. El dominio de la marca aparece en el correo de soporte del theme `[DOC:launch/03G-checkout-precondition-audit.md]` § 3, así que `[INFERIDO]` hay correo sobre el dominio: **MX y TXT no se tocan en T0**.
2. **TTL:** bajar el TTL de los registros que van a cambiar, con una antelación **mayor o igual al TTL anterior**. Si el TTL anterior es mayor que el tiempo que falta hasta T0, se **mueve T0**. La propagación está acotada por ese TTL: "minutos a horas según TTL" `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 18.6. Cómo verlo: `Resolve-DnsName radaelliswimwear.com` (PowerShell) o `nslookup -debug radaelliswimwear.com`.
3. **CAA:** si existen registros CAA, comprobar que no impidan que Shopify emita su certificado; si lo impiden, ajustarlos **antes** de T0.
4. **Registros nuevos:** solo los que muestre Shopify; no cambiar los servidores de nombres salvo que Shopify lo pida.
5. **T0:** cambiar únicamente los registros web; guardar los valores anteriores.
6. **Verificar:** `nslookup radaelliswimwear.com` contra dos resolvers públicos distintos; el sondeo `curl.exe -sI https://radaelliswimwear.com/producto/bikini-foam` (200 en el sitio actual, 301 en Shopify).
7. **Después:** no subir el TTL hasta cerrar la ventana de rollback (CT-94).

### V-SSL — HTTPS en el dominio `[PRÁCTICA-GENERAL]`

El tiempo que tarda Shopify en emitir el certificado no está en las fuentes: **NOT_AVAILABLE**. La pantalla de dominios de la tienda muestra el estado (nombre exacto `[NOT_VERIFIED]`).

| Chequeo | Comando o pantalla | Pasa si | No pasa si |
|---|---|---|---|
| Certificado válido en apex | `curl.exe -sSI https://radaelliswimwear.com/` **sin** `-k` | Devuelve cabeceras | Error de certificado |
| Certificado válido en `www` | `curl.exe -sSI https://www.radaelliswimwear.com/` | Devuelve cabeceras | Error de certificado |
| Titular y vigencia | Candado del navegador, ver el certificado | Cubre apex y `www`, vigente | Otro titular o vencido |
| `http` a `https` | `curl.exe -sI http://radaelliswimwear.com/` | 301 a `https://` (comportamiento de Shopify: `[NOT_VERIFIED]`) | Responde 200 en `http` |
| Primario | `curl.exe -sI` de la variante no primaria | Un salto al primario | Sin salto, o bucle |

### V-PAGO — Wompi en modo prueba (casos de `payments/03F-wompi-owner-runbook.md` § 9)

Datos públicos de Wompi (los teclea la dueña): tarjeta `4242 4242 4242 4242` aprobada, `4111 1111 1111 1111` rechazada, otro número `ERROR`; PSE banco `1` aprueba y `2` rechaza; PSE **no** tiene pendiente en el sandbox `[DOC:payments/03F-wompi-owner-runbook.md]` § 0.

| Caso | Acción | Pasa si | No pasa si |
|---|---|---|---|
| 1 Éxito | Pagar y volver a la tienda | Pedido con pago Pagado, COP, monto igual al de Wompi, sin comisión de Shopify (prueba); en Wompi `APPROVED` | Otro monto, otra moneda o sin pedido |
| 2 Falla | Tarjeta rechazada; número cualquiera; PSE banco `2` | Ningún pedido pagado y mensaje a la clienta; `DECLINED` o `ERROR` | Pedido pagado o sin mensaje |
| 3 Pendiente | Daviplata con OTP inválido de 6 dígitos o Botón Bancolombia asíncrono; efectivo `[NOT_VERIFIED]` | Comportamiento observado y anotado (¿pedido pendiente?, ¿cancelable?, ¿vence en 3 días como máximo?) | No se logra producirlo: riesgo abierto por escrito |
| 4 Reembolso | Reembolsar total y parcial en pedidos de prueba | Estado del pedido y transacción de Wompi coinciden | "Reembolsado" en Shopify sin rastro en Wompi (señal de riesgo) |
| 5 No vuelve | Pagar y cerrar la pestaña; mirar a los 5 y a los 35 min | El pedido aparece | `APPROVED` sin pedido (**bloqueante**) |
| 6 Duplicados (opcional) | Recargar el retorno o repetir el clic | 1 pedido y 1 cobro | 2 pedidos o 2 cobros |

**V-PAGO-PROD (CT-47):** además de lo anterior: la transacción está en el panel de **producción** de Wompi; el monto en centavos coincide ($159.920 = 15.992.000); no hay más de un pedido ni de un cobro; el reembolso se hace desde Shopify y se anota si Wompi lo refleja (si no: reembolso manual desde Wompi, `[NOT_VERIFIED]` que exista para esta integración, P3). El caso "pendiente" **no se puede forzar en producción**: se vigila en CT-91.

### V-PEDIDO — humo de pedido y de correo

| Chequeo | Dónde | Pasa si | No pasa si |
|---|---|---|---|
| Pedido creado | Admin > Pedidos | Número de pedido, ítem y talla correctos, COP, contacto de correo y teléfono presentes | Falta un dato |
| Total y envío | El pedido | Total igual al del checkout; envío según D2 (gratis con 2 o más unidades, `>= 299.900`) | Otro total |
| Página de agradecimiento o estado del pedido | El enlace del pedido | Carga | No carga (riesgo R8 de analítica) |
| **Correo de confirmación** | Bandeja de la dueña (correo propio, nunca de una clienta) | Llega, con número de pedido, ítems, total en COP y dirección; el idioma y el remitente se anotan (`[NOT_VERIFIED]` en español y con qué remitente) | No llega tras revisar spam: fix-forward (no es un incidente de ventas) |

### V-ANALÍTICA — eventos y no duplicación `[DOC:analytics/03F-analytics-owner-runbook.md]` § 8 y § 9

Herramientas: GA4 DebugView con Tag Assistant (o el informe Realtime si DebugView no captura el checkout, `[NOT_VERIFIED]`) y Meta Test Events. **Solo en la tienda pública.**

| Chequeo | Pasa si | No pasa si |
|---|---|---|
| Los 11 eventos de GA4 del embudo (`page_view`, `view_item`, `view_item_list`, `search`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`) | Cada uno **una** vez por acción, `currency` = `COP`, `page_location` sin `q=`, sin correo y sin token | Duplicado, `USD` o datos personales |
| Los 7 de Meta (`PageView`, `ViewContent`, `Search`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, `Purchase`) y D4 | Un `PageView` por carga con la extensión de Meta; un solo pixel | "Duplicate Pixel code" o dos pixeles |
| D1, D2, D3 | Ningún evento del embudo llega de dos orígenes; con el custom pixel apagado o en `gaps_only` con `GA4_EXTRA_STANDARD_EVENTS` y `META_EXTRA_STANDARD_EVENTS` vacíos | Un evento del embudo de dos orígenes |
| D5 | Mismo dataset en la app y en el pixel propio (si se usa) | IDs distintos |
| D6, D7 | 0 coincidencias de pixel de Meta pegado a mano, `gtag` o GTM en el theme | Una coincidencia |
| D8, D9 | `purchase` con `transaction_id` con valor; recargar la página de agradecimiento no suma otro | Vacío o suma |
| D10, D11 | Meta `Purchase` por "Browser and Server" deduplicado si el nivel es Mejorado o Máximo; sin Conversions API propia ni Measurement Protocol | Capa server-side extra |
| Consentimiento K1–K4 (con el banner de Colombia; K5 con Tag Assistant) | K1 rechazar todo: 0 eventos en GA4 y Meta; K2 solo analítica: llegan a GA4 y no a Meta; K3 aceptar todo: llegan; K4 revocar: corte inmediato | Eventos tras rechazar |
| Contaminación por pedidos propios | Decidida en D-CT9 (cookie propia o filtro de GA4) | Sin decisión: los pedidos de la dueña cuentan como ventas |

Limitaciones que se registran, no bloquean: la lista de eventos de la app **no incluye `refund`** (los ingresos de GA4 no bajan al reembolsar) y cómo la app de Meta deduplica es `[NOT_VERIFIED]`.

### V-CUENTAS — código de ingreso

| Chequeo | Pasa si | No pasa si |
|---|---|---|
| Ingreso por código (lo escribe la dueña con su correo propio; Claude no lo ve) | La cabecera muestra la inicial y `/account` abre la cuenta nueva de Shopify | El código no llega o el ingreso falla |
| Ventana de incógnito | `/account/login` y `/account/register` llevan a las páginas de Shopify, no a una plantilla antigua | Aparece una plantilla legacy |
| Idioma y región del ingreso | Español y región de Colombia (en la Dev Store salía `es-US` por la entidad en EE. UU.: `[DOC:theme/03F-owner-market-colombia-runbook.md]` § 10) | `es-US` |
| Cierre de sesión | La cabecera vuelve a invitada | Sigue la sesión |
| Rutas viejas | `/cuenta/iniciar-sesion` y `/cuenta/recuperar-contrasena` terminan en el ingreso por código | Terminan en 404 |

Las clientas del sitio actual **no** se migran salvo decisión D-CT12; con o sin migración, su primer ingreso es por código, no por contraseña `[DOC:launch/evidence/reference-docs/data-migration.md]`.

### V-FAVORITOS — invitada y cuenta

| Chequeo | Pasa si | No pasa si |
|---|---|---|
| **Invitada** | El corazón está en 29/29 fichas; marcar 2 productos, el contador sube, recargar conserva la lista, `/pages/favoritos?view=wishlist` la muestra, **0 llamadas a `/apps/radaelli`** | Se pierde la lista o hay llamadas de cuenta |
| `/favoritos` y `/cuenta/favoritos` | Redirigen a `/pages/favoritos` con la plantilla asignada | Plantilla genérica sin lista |
| **Cuenta** (solo si D-CT10 = sí) | Los GO/NO-GO obligatorios del runbook de favoritos: unión invitada a cuenta (la lista final reúne las dos), 0 × `401 no_customer`, prueba entre dispositivos, cierre de sesión sin datos en incógnito | Cualquier obligatorio en NO-GO |
| **Sin A5** | `wishlist_account_sync` en false y se declara "solo invitada" (diferencia con `/cuenta/favoritos` del sitio actual) | Se enciende sin la app |

### V-BÚSQUEDA — búsqueda y filtros

| Chequeo | Pasa si | No pasa si |
|---|---|---|
| Índice | `bikini` = 20 resultados y `mostaza` = 1 (`entero-golden-hour`) `[MEDIDO-03G]` en la Dev Store; en la tienda comercial se **re-mide** | Cantidad distinta o "estancado" tras la importación masiva |
| Predictivo | Sugerencias con imagen y precio; `noindex` en `/search` | Sin sugerencias |
| Filtros Oasis Natural | QA1–QA10: grupos Orden, Talla, Color, Precio; sin Disponibilidad; Talla S = 10, Color NEGRO = 3, combinación S + NEGRO = 3 productos | Grupo faltante o conteo distinto |
| Filtros Aurora Viva | QA11–QA15: Talla incluye "L y XL" (1) y XL (11) | Conteo distinto |
| URLs viejas de filtro | `?talla=S`, `?color=BEIGE`, `?precio=…`, `?orden=…` del sitio actual: `[INFERIDO]` el redirect conserva el query (medido con `/buscar?q=`), pero Shopify no reconoce esos nombres (su formato es `filter.v.option.<nombre>`; el valor real se anota en QA4), así que la colección abre **sin filtrar**. Es una diferencia conocida, no un fallo | La colección da 404 |

## 8. Criterios de rollback

### 8.1 Quién decide y con qué información

- **Decide la dueña**, con el responsable y el canal de D-CT15 (DR-01) y los umbrales de D-CT15 (DR-02). Sin esos dos definidos, el rollback total no se ejecuta por iniciativa de Claude: Claude propone y la dueña decide `[DOC:launch/03G-rollback-plan.md]` § 12.1. Claude no ejecuta cambios de DNS, Vercel, Wompi o del Admin.
- **Información mínima para decidir:** el criterio de esta sección que se disparó, la salida del comando o la pantalla que lo prueba (sin secretos), la hora y si hay pedidos reales en Shopify desde T0.
- **Pasos del rollback:** `launch/03G-rollback-plan.md` (síntomas en su § 6, secuencia del rollback total en su § 12.2, irreversibles en su § 9). Aceptación de lo verificado: `launch/03G-launch-acceptance-checklist.md`.
- **Puntos de no retorno** `[DOC:launch/03G-rollback-plan.md]` § 3, a partir de los cuales el rollback deja de ser gratis en datos: PNR-1, el primer pedido real cobrado en la tienda comercial (CT-47 o el primer pedido de una clienta); PNR-2, el primer correo de Shopify a una clienta real; PNR-3, el primer dato de compra enviado a GA4 o Meta; PNR-7, el primer 301 servido desde el dominio real (T0). Antes de PNR-1 el rollback total es devolver el DNS.
- **Costo del rollback:** sube con cada pedido real tomado en Shopify después de T0, porque cada uno se debe honrar. Los umbrales y la ventana de decisión los fija la dueña (D-CT15 y D-CT1); no hay cifra en las fuentes.

### 8.2 Antes de T0: abortar (no se cambia el DNS)

| Id | Falla | Dónde se detecta | Acción |
|---|---|---|---|
| AB-01 | Una precondición de G1 a G4 sin evidencia, o un cambio necesario sobre un artefacto congelado | CT-01, CT-31, CT-44 | NO-GO; reprogramar; despausar el sitio actual si ya se pausó |
| AB-02 | El checkout de Colombia no llega al pago: catálogo agotado, sin método de envío o "no puede aceptar pagos" | CT-21, CT-26 (y CT-72 si ya pasó T0: entonces es RB-02) | NO-GO |
| AB-03 | Cobro sin pedido, doble cobro o un pago aprobado sin pedido en modo prueba o en el humo de producción | CT-25, CT-47 | NO-GO; desactivar Wompi; volver a llaves de prueba |
| AB-04 | Una de las 4 legales sin destino o con hash distinto | CT-05, CT-52 | NO-GO (03E § 4.3) o renuncia escrita |
| AB-05 | Pagos `PENDING` del sitio actual sin conciliar | CT-41 | No se pausa; se concilia |
| AB-06 | Sin acceso al DNS, TTL anterior mayor que el tiempo restante, o sin acceso al panel del sitio actual | CT-13, CT-14, CT-33 | Mover T0 |
| AB-07 | La contraseña no se puede quitar, o los redirects fallan en `*.myshopify.com` de forma general | CT-51, CT-52 | NO-GO; volver a poner la contraseña |

Al abortar: volver a poner la contraseña si ya se quitó (RP-03), quitar `WRITES_PAUSED` y redeployar el mismo commit, volver a llaves de prueba de Wompi y restaurar la URL de eventos anotada (RP-15, RP-16). Contención sin decidir todavía un rollback: RP-01, RP-02 o RP-03, según DR-05.

### 8.3 Después de T0: rollback de DNS

Un rollback total devuelve los registros web a los valores de la hoja privada y reactiva el sitio actual. Sigue el orden inverso del cutover que fija `launch/03G-rollback-plan.md` § 12.2: contener y congelar la entrada de pedidos en Shopify (RP-47), exportar pedidos y clientas (RP-48), confirmar que el sitio actual está sano (RP-09), apagar Wompi en Shopify y devolver la URL de eventos al sitio actual (RP-15, RP-16, que es la misma acción que RP-11), reanudar el sitio actual si estaba pausado (RP-10), ajustar su stock (RP-52), devolver el DNS (RP-12, RP-13) y drenar y conciliar (RP-20, RP-49 a RP-51, RP-53, RP-54). Antes de mover la URL de eventos se listan los pagos pendientes de Shopify (RP-20, puntos 1 a 3): lo que se apruebe después ya no llega a Shopify y se concilia a mano (RP-50) `[INFERIDO]`, según el plan de rollback. Los umbrales los fija la dueña (D-CT15, DR-02); este documento no trae cifras. Se dispara por:

| Id | Falla | Síntoma del plan de rollback | Dónde se detecta | ¿Rollback o corregir adelante? |
|---|---|---|---|---|
| **RB-01** | El dominio no resuelve a Shopify o el HTTPS es inválido, pasado el TTL previo `[PRÁCTICA-GENERAL]` y lo que indique la pantalla de dominios | SY-12 | CT-63, CT-64 | **Rollback total** (todavía no hay pedidos: es el caso más barato) |
| **RB-02** | Ninguna clienta con Colombia puede comprar: catálogo agotado, sin método de envío, "no puede aceptar pagos", o la redirección a Wompi falla | SY-01, SY-02, SY-03 | CT-72, CT-85 | Primero contener según DR-05 (RP-01, RP-02 o RP-03) y corregir; **rollback total si la corrección exige cambiar un artefacto congelado o la dueña no la logra dentro de los umbrales que fijó (D-CT15, DR-02)** |
| **RB-03** | **Cobro sin pedido** o doble cobro confirmado en producción (un `APPROVED` de Wompi sin pedido en Shopify) | SY-04, SY-06 | CT-85, CT-91 | Contención C0 (RP-01), luego RP-20 y RP-50; **rollback total** si no hay explicación inmediata o DR-02 lo exige: es el riesgo de mayor probabilidad del registro de riesgos `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 20 |
| RB-04 | Pagos aprobados que aparecen como pedidos abandonados de forma repetida | SY-04 | CT-85, CT-91 | Ídem RB-03 |
| RB-05 | Exposición de datos personales o secretos (por ejemplo, datos personales en parámetros de analítica) | SY-16 | CT-81 | **No es rollback de DNS:** desconectar la app o el pixel (RP-28 a RP-31) y corregir |

### 8.4 Se corrige adelante (no dispara rollback)

| Falla | Acción |
|---|---|
| Una redirección da 404 o entra en bucle (los 29 productos y 4 colecciones incluidos) | Corregir la fila y reimportar (1 minuto `[DOC:seo/03F-redirect-import-result.md]`); cada hora sin redirección es una URL indexada con 404 `[DOC:launch/evidence/reference-docs/seo-analytics.md]` § 9 |
| Una redirección da un código distinto de 301 | Registrarlo: el CSV solo trae origen y destino, así que el código no se elige; decide la dueña |
| Eventos duplicados o consentimiento que no corta | Desconectar la integración que duplica; decidir con G-LEGAL |
| Correo de confirmación que no llega | Revisar spam y la notificación; las nativas de Shopify no muestran reintentos `[DOC:launch/evidence/reference-docs/seo-analytics.md]` § 11. No dispara rollback por sí solo |
| Canonical en `*.myshopify.com`, o `www` como primario contra la decisión | Corregir el primario (CT-62) |
| Filtros, búsqueda predictiva o miga de una ficha | Corregir en el theme con release nuevo, fuera de la ventana si no bloquea la compra |
| Meta no termina de configurarse | Fix-forward; la venta no depende de Meta |
| Pedido rezagado en el sitio actual | Atenderlo a mano desde su panel |

## 9. Sitio actual, contraseña, mercado e idioma, comunicación

### 9.1 El sitio actual durante y después del corte: se conserva, no se apaga

| Elemento | Estado durante el corte | Después |
|---|---|---|
| Proyecto en Vercel, código y despliegues | Intactos. Con D-CT2 = A, con `WRITES_PAUSED=true`; con B, vendiendo hasta el DNS | Se conserva; el DNS ya no apunta ahí. Retirar solo tras "varias semanas de operación estable" en Shopify (D-CT13) `[DOC:launch/evidence/reference-docs/migration-roadmap.md]` § 18.7 |
| Base de datos (Neon) | No se toca | Se conserva: es el historial de pedidos y clientas, que **no** se migra por defecto (D-CT12). Retención de backups de Neon: `[NOT_VERIFIED]` `[DOC:docs/production-recovery.md]` |
| Cuenta de Wompi y llaves | No se rotan ni se revocan; solo cambia la URL de eventos de producción | Necesarias para un rollback |
| Resend, Cloudinary | No se tocan | Cloudinary sigue sirviendo el material que el sitio actual usa y es la fuente de las 95 imágenes importadas y de los archivos de media de A4: no se retira antes de respaldar ese material `[DOC:launch/03G-reproducibility-gap-audit.md]` G04 |
| Panel `/admin` | Accesible por la URL del proyecto (CT-14); con la pausa activa es de solo lectura (no cambia estados de pedido) | Atención de rezagados y de pedidos ya pagados; requiere levantar la pausa (CT-93) |
| URL propia del proyecto en Vercel | Puede seguir pública y sirviendo el sitio actual: `[NOT_VERIFIED]` si está indexada o protegida | Decisión de la dueña: proteger ese acceso sin apagarlo (el repo documenta "Deployment Protection" para el staging `[DOC:docs/pentest-operations.md]`) |
| Crons | Con la pausa activa se saltan sus corridas | Un rollback los reactiva con el redeploy |
| Dominio en el proyecto de Vercel | `radaelliswimwear.com` **sigue asignado** al proyecto: no se quita | Es el destino de un rollback (RP-12) `[DOC:launch/03G-rollback-plan.md]` § 12.4, punto 7 |
| CU-01 a CU-10 | No se desmantela ninguno: Vercel, Neon, Cloudinary, Resend, cuenta y webhook de Wompi, panel `/admin`, registros DNS originales, staging del pentest con su Wompi Sandbox, el código de la rama de producción sin cambios y el cron `release-stale-payments` | `[DOC:launch/03G-rollback-plan.md]` § 8.9 |

### 9.2 La contraseña de la tienda (quitarla)

- **Cuándo:** CT-51, en T-15m, con el theme ya publicado (CT-45), G-BANNER y G-LEGAL cerradas (CT-09) y las 4 legales publicadas (CT-05). No antes: con la contraseña puesta, ni GA4 registra ni la app de Meta se puede terminar `[DOC:analytics/03F-analytics-owner-runbook.md]` § 2, y quitarla sin banner en Colombia deja "permitir todo" `[DOC:analytics/03F-analytics-owner-runbook.md]` § 5.
- **Dónde:** acceso a la tienda en Tienda online (nombre exacto en español `[NOT_VERIFIED]`).
- **Evidencia:** una ventana privada abre la Home con 200, sin `/password`.
- **Reversible con efecto:** se vuelve a poner la contraseña, pero desde que la tienda es pública un buscador puede rastrearla en `*.myshopify.com` `[PRÁCTICA-GENERAL]`.
- **Si la tienda de lanzamiento es la Dev Store:** quitar la contraseña depende de que Shopify permita transferirla o pasarla a un plan pago; las dos páginas oficiales se contradicen `[DOC:analytics/03F-analytics-owner-runbook.md]` § 2. Es parte de D-CT5.

### 9.3 Mercado e idioma: se verifican, no se cambian en la ventana

| Elemento | Estado esperado en la tienda comercial | Cómo se verifica | Fuente |
|---|---|---|---|
| País base y dirección | Colombia; se fijan en S01 y S02, **IRREVERSIBLE por prudencia** (DIF-05) | Configuración > General | `[DOC:theme/03F-owner-market-colombia-runbook.md]` |
| Mercado principal | Colombia; Estados Unidos en Borrador (nunca "Eliminar", que es permanente) | Mercados; `Shopify.country` = CO en una visita nueva | `[DOC:theme/03F-owner-market-colombia-runbook.md]` § 5 y § 6 |
| Moneda | COP con formato `$ 199.920`; sin selector COP/USD (F-12: el sitio actual lo tiene, Dev no) | Carrito y checkout `es-co` | `[MEDIDO-03G]` `launch/03G-route-parity.md` F-12 |
| Idioma predeterminado | **Español**; `/en` en inglés y `hreflang` `x-default`, `es`, `en` solo si D-CT19 = publicar inglés (el sitio actual no tiene inglés y la Dev mezcla textos en español dentro de `/en`, HP-12) | `/` en `es`, `/en` en `en`, etiquetas `hreflang` en el HTML | `[MEDIDO-03G]` snapshot (`locales`); `[DOC:seo/03F-seo-final-validation.md]` |
| "Cambiar idioma predeterminado" | **IRREVERSIBLE:** borra las traducciones del idioma al que se cambia, quita el idioma anterior y, en la Dev Store, reescribe también Horizon | Se hace en S02, nunca en la ventana | `[DOC:theme/03F-owner-market-colombia-runbook.md]` § 6 |
| Idioma del checkout | Sigue el idioma de navegación; el Admin en Inglés "puede pesar" `[NOT_VERIFIED]` | Checkout `es-co` desde `/` y desde `/en` | `[DOC:theme/03F-owner-market-colombia-runbook.md]` § 10 |

### 9.4 Comunicación a clientas: solo decisiones de la dueña

No se redacta ninguna campaña. Cada punto es una decisión a tomar en CT-15 y a ejecutar por la dueña; Claude no envía ni redacta mensajes.

| Punto a decidir | Por qué existe | Fuente |
|---|---|---|
| ¿Se avisa que las ventas se pausan durante la ventana (D-CT2 = A)? Cuándo y por qué canal | No hay página de mantenimiento en el sitio actual | `[INFERIDO]` de § 5.2 |
| ¿Se avisa el cambio de acceso (ingreso por código en vez de contraseña)? ¿A quién? | Las contraseñas no se migran; el ingreso nuevo es por código | `[DOC:launch/evidence/reference-docs/data-migration.md]` |
| ¿Se avisa que el pago por WhatsApp del sitio actual no existe igual en Shopify? | El flujo "Continuar por WhatsApp" solo se replica como método de pago manual, que la dueña decide | `[DOC:payments/03E-wompi-shopify-feasibility.md]` § 4 |
| ¿Se avisa a los suscriptores del newsletter? ¿Y a quien tenga un cupón activo o una solicitud de reposición? | Viven en Neon (`NewsletterSubscriber`, `Coupon`, `BackInStockRequest`); cantidades NOT_AVAILABLE; el aviso de reposición no existe nativo en Shopify | `[DOC:prisma/schema.prisma]` (raíz del repo); `[DOC:launch/evidence/reference-docs/seo-analytics.md]` § 11 |
| ¿Se avisa de cambios de políticas? | El texto legal se migra verbatim; el de privacidad de Shopify es distinto | `[DOC:theme/03F-legal-owner-runbook.md]` |
| ¿Se actualizan los enlaces externos conocidos (redes sociales, directorios) a las rutas nuevas? | Las redirecciones cubren el resto, pero un enlace directo evita un salto | `[DOC:launch/evidence/reference-docs/seo-analytics.md]` § 9 (punto 6) |
| Canal, momento y responsable de cada aviso | NOT_AVAILABLE | — |

## 10. Cruce de pasos canónicos con acciones

CT-01 verifica S01 a S14 en conjunto y no se repite en cada fila; el resto de las acciones aparece bajo el paso que ejecutan o verifican.

| Paso | Acciones de este runbook |
|---|---|
| S01 | CT-01 (verificación); no se ejecuta dentro de la ventana |
| S02 | CT-07 y § 9.3 |
| S03 | CT-12, CT-30, CT-44, CT-53 |
| S04 | CT-02, CT-03, CT-04, CT-32, CT-43 |
| S05 | CT-11, CT-29, CT-53, CT-84 |
| S06 | CT-03, CT-05, CT-06, CT-17, CT-31, CT-52, CT-71, CT-73 |
| S07 | CT-12, CT-30 |
| S08 | CT-11, CT-29, CT-84 |
| S09 | CT-10, CT-28, CT-83 |
| S10 | CT-07, CT-72 |
| S11 | CT-08, CT-21 a CT-25, CT-46, CT-47 |
| S12 | CT-09, CT-54, CT-74, CT-81 |
| S13 | CT-10, CT-27, CT-82 |
| S14 | CT-08, CT-21 a CT-26, CT-47, CT-72, CT-85 |
| S15 | CT-13, CT-14, CT-33, CT-55, CT-56, CT-61 a CT-64, CT-73, CT-94 |
| S16 | CT-02, CT-14 a CT-16, CT-41, CT-42, CT-45, CT-51, CT-75, CT-85, CT-93 |
| S17 | CT-17, CT-86, CT-91, CT-92, CT-93, CT-95, CT-96 |

## 11. Límites, NOT_VERIFIED y cómo se hizo

**Cómo se hizo:** lectura de `launch/03G-dev-store-snapshot.json`, `launch/03G-checkout-precondition-audit.md`, `launch/03G-current-site-baseline.md`, `launch/03G-route-parity.md`, `launch/03G-product-parity.md`, `launch/03G-responsive-sweep.md`, `launch/03G-rollback-plan.md`, `launch/evidence/*`, los reportes 03E y 03F, los runbooks 03F, `seo/*`, `payments/*`, `analytics/*`, `app/*`, `source-of-truth/data-model-audit.md`, `dist/release-manifest-rc1.8.json`, los documentos de viabilidad y, del sitio actual, `docs/incident-response.md`, `docs/production-recovery.md`, `docs/ADMIN_PANEL.md`, `docs/go-live-checklist.md`, `lib/system/write-pause.ts`, `lib/payments/config.ts`, `lib/analytics/feature-flags.ts` y `vercel.json`. No hubo navegador, red ni escritura en tiendas. `theme/03G-home-parity.md` no existía al redactar; la revisión posterior lo leyó y sus hallazgos HP-01, HP-02, HP-03, HP-11, HP-12 y HP-23 están incorporados (DIF-08, D-CT18, D-CT19, § 5.3, CT-12 y CT-53).

**NOT_VERIFIED que afectan al cutover:**

1. Tienda de lanzamiento: si la Dev Store puede pasar a producción (E35) y plan de Shopify de la tienda comercial (NOT_AVAILABLE).
2. Proveedor de DNS, registros actuales, TTL vigente, propagación y emisión del certificado: NOT_AVAILABLE hasta que la dueña los aporte y Shopify los muestre.
3. Que el deployment de producción actual incluya `WRITES_PAUSED`, qué ve una clienta con la pausa activa y si la URL propia del proyecto en Vercel sigue pública o indexada.
4. Que el panel del sitio actual funcione por la URL del proyecto cuando el dominio ya no apunte allí.
5. Código exacto de las redirecciones (301 o 302), si funcionan detrás de la contraseña y comportamiento de `http` a `https` y `www` a apex en Shopify.
6. Wompi: conexión solo en modo prueba (G2), aprobación de producción de la cuenta (P1), reembolsos hacia Wompi por medio de pago, pendientes, si el pedido se crea cuando la clienta no vuelve, permisos exactos de la app y convivencia con "Wompi Tarjetas".
7. Nombres exactos en español del Admin (dominios, acceso a la tienda, notificaciones).
8. Analítica: país soportado para el canal de Meta y cómo deduplica la app; DebugView en el checkout.
9. Checkout a 390 px (pendiente hasta CT-26), correo de confirmación (necesita un pedido) y ajustes de pantalla de pago (`settings/checkout`) no leídos en 03G.
10. Impuestos (IVA): NOT_VERIFIED (03G no abrió esa pantalla).
11. El código de ingreso a la cuenta de clienta (A2): solo la dueña lo escribe; sigue `DEFERRED_OWNER_ONLY_BLOCKER`.
12. Orden por defecto de las colecciones y selector COP/USD: diferencias de paridad abiertas (F-03 de producto, F-07 y F-12 de rutas); decisión de la dueña, y las fuentes no las listan como bloqueo.

**Herramientas citadas:** `launch/tools/03g-cutover-redirect-matrix.mjs` (nueva, offline), `launch/tools/03g-crawl-current-site.mjs` (70 GET, sobrescribe su carpeta), `launch/tools/03g-product-parity.mjs`, `launch/tools/03g-release-freeze.mjs` (recibe la hora como argumento) y `seo/validate-redirects.mjs`. Ninguna de las herramientas de rastreo o de paridad toca la tienda comercial: son offline (paridad) o solo leen el sitio actual (rastreo).

## 12. Registro de la verificación adversarial

Revisión independiente de este documento contra las fuentes, no contra el resumen del autor. No hubo GET ni POST; se corrieron `node launch/tools/03g-cutover-redirect-matrix.mjs` (dos corridas, misma salida) y `node seo/validate-redirects.mjs` (`RESULTADO: PASS`). Cambios hechos:

| Id | Qué se encontró | Evidencia | Cambio |
|---|---|---|---|
| V-01 | El orden del rollback total contradecía al plan de rollback: este runbook reanudaba el sitio actual **después** de devolver el DNS; el plan lo hace antes (RP-10 antes de RP-12) | `launch/03G-rollback-plan.md` § 8.2, RP-10, RP-12, § 11 (S15) y § 12.2 | § 5.2 (fila Rollback) y § 8.3 |
| V-02 | La herramienta de paridad de productos no lee la tienda comercial, solo las capturas de la Dev Store; CT-03 y CT-43 asumían lo contrario | `launch/tools/03g-product-parity.mjs`; audit G05 y G07 | CT-03, CT-43, DIF-10 |
| V-03 | "Theme 96/96 idéntico a RC1.8" es incompatible con los cambios de CT-07, CT-10 y CT-12, y hay arreglos de theme pendientes | runbook de envío § 13; runbook de media P4 y P8; `theme/03G-home-parity.md` | Regla 7, § 5.3, CT-12, CT-44, DIF-09 |
| V-04 | El nombre "Dev" (BLOCKER HP-01) se verificaba solo después del DNS; logo y favicon quedaban fuera; `/en` sin decisión | `theme/03G-home-parity.md` HP-01, HP-02, HP-11, HP-12, HP-23 | CT-53, CT-73, D-CT18, D-CT19, DIF-08 |
| V-05 | Faltaban los pagos en vuelo y los enlaces de los correos del sitio actual al cruzar T0, y el stock cargado en CT-43 con D-CT2 = B queda desactualizado | `seo/03E-redirect-plan.md` § 5.6; `lib/payments/payments-actions.ts`; `lib/utils.ts`; roadmap § 20 | § 5.2, DIF-12, CT-75 |
| V-06 | Los 3 descuentos de prueba del runbook de envío no se exigían eliminados antes de hacer pública la tienda | runbook de envío § 10 (S8, S11) | CT-07, DIF-11 |
| V-07 | Las compuertas G1 a G3 del runbook de Wompi chocaban con G1 a G8 de este documento | runbook de Wompi § 0 y § 6 | Renombradas W-G1 a W-G3 |
| V-08 | Equivalencias DR/D-CT y cita de puntos del § 12.4 del plan de rollback incorrectas | `launch/03G-rollback-plan.md` § 4 y § 12.4 | § 4 y G2 |
| V-09 | 33 filas de acciones sin criterio explícito de Pasa o de No pasa (26 con uno solo, 7 sin ninguno) | recuento de este documento | Agregado a las 33 filas |
| V-10 | Cifras sin la precisión de la fuente: media "0 archivos" (solo se vio la primera página), "patrón de 25 por talla" (25 en 27 fichas), fases de analítica de CT-09, T6/T7 en lugar de T1 a T7 y T10, humo de producción con producto fijado | snapshot `_meta.limits`; baseline B-13; analytics § 15; shipping § 13 | Corregidas o marcadas `[INFERIDO]` |
| V-11 | Sin línea base de Search Console antes del corte; el sondeo de `robots.txt` medía bytes con cabeceras; CT-55 no vigilaba el primario antes de T0; AB-02 citaba CT-72 (posterior a T0); un 302 se "corregía" reimportando aunque el CSV no elige código; V-REDIR sumaba 48 filas; CU-10 omitido; el flujo de WhatsApp presentado como dato de migración | `seo/03E-redirect-plan.md` § 5.5; `seo-analytics.md` § 9; matriz de la herramienta; `data-migration.md` | CT-17, CT-56, CT-55, § 8.2, § 8.4, V-REDIR, § 9.1, § 5.2 |
| V-12 | Wompi en la tienda comercial: si W-G2 falla y no hay pasarela de prueba, los casos de prueba serían con dinero real; la app de favoritos de la tienda comercial es otra app | runbook de Wompi § 0 (R1) y § 10; runbook de favoritos P1 y P3 | CT-08, CT-10 |
| V-13 | Trazabilidad: CT-13 no pedía dejar el dominio sin primario al agregarlo; el rollback de CT-42 repetía el orden equivocado; CT-02 aparecía bajo S16 en el cruce pero no en su fila; dos duraciones (CT-12, CT-82) sin cita | `launch/03G-rollback-plan.md` § 12.2; `theme/03F-owner-actions-minimal.md` A2 y A4 | CT-02, CT-12, CT-13, CT-42, CT-82, § 10 |

Sin datos inventados que quitar: el documento no trae KPIs, TTL, proveedor de DNS, IP, plan de Shopify ni horas posteriores a 18:00, y cada duración cita su fuente o dice NOT_AVAILABLE.
