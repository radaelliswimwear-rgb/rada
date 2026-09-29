# CLAUDE RESULT

PHASE: 03D — SEARCH/FILTERS + ACCOUNT WISHLIST INFRASTRUCTURE + STOREFRONT COMPLETION
MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW — filtros corregidos, promesa de envío con cerrojo, contenido real migrado, app de favoritos construida y probada offline (sin instalar), RC1.4; owner-only aislados en una sola lista

Reporte completo: `shopify-migration/theme/03D-search-accounts-wishlist-report.md` (worktree Shopify, no pusheado). Este archivo es su copia íntegra.

Documentos de soporte (mismo worktree):

- `theme/03D-search-index-report.md`
- `theme/03D-missing-assets-audit.md`
- `theme/03D-legal-policies-inventory.md`
- `theme/03D-free-shipping-audit.md`
- `theme/03D-accounts-app-design.md`
- `app/README.md`
- `catalog/color-search-tag-map.csv`
- `content/legal/*`
- `content/media/media-migration-manifest.csv`

Modelo: **Opus 5.5** (`claude-opus-5-5`, ULTRACODE). Daniela estuvo fuera toda la fase; no se le pidió nada. Lo que requiere a la dueña quedó como `DEFERRED_OWNER_ONLY_BLOCKER` en una sola lista priorizada (§ G).

---

# 03D — Búsqueda/filtros + infraestructura de favoritos de cuenta + cierre del storefront

- **Fecha:** 2026-09-29, de 10:30 a ~11:40 (Bogotá). Development Store `radaelli-swimwear-dev`.
- **Theme:** Radaelli RC1 (`189072474431`), **sin publicar**. Horizon (`189072113983`) sigue live y no se tocó.
- **Modo autónomo** (Daniela ausente hasta ~13:00): lo que requiere aceptación de la dueña quedó como `DEFERRED_OWNER_ONLY_BLOCKER`, sin esperar.

## Resumen ejecutivo

- **Bugs reales corregidos en filtros**, encontrados en la tienda real:
  1. Shopify devuelve el precio del filtro en **centavos**. Al volver a enviar el formulario, el filtro se multiplicaba ×100.
  2. Cambiar el orden **perdía el rango de precio**.
  3. Al volver atrás (bfcache), el `select` mostraba un orden que la página no tenía.
  4. "Limpiar" perdía el orden.
- **Disponibilidad oculta:** con inventario no rastreado, Shopify marca todo "En existencia", y eso promete stock sin respaldo.
- **Envío gratis:** un **cerrojo único** (`free_shipping_rate_confirmed`, apagado) saca toda promesa de $299.900 hasta que Shopify tenga esa tarifa. Sumado a un guard de moneda.
- **Búsqueda:**
  - El índice de Shopify quedó **incompleto tras la importación masiva**: 8/29 estancado más de 1 h 40 min.
  - **Actualizar un producto dispara su indexación** (evidencia n=7).
  - Solo 2/29 productos no tienen el color en el título. Son exactamente los del experimento de tags.
- **Contenido real migrado:**
  - Política de reembolso (de `/devoluciones`) y página `garantia`, ambas **verificadas por hash** contra el HTML en vivo;
  - colección **Destacados**: los 7 que muestra hoy la Home real, conectada a la Home y verificada en la tienda real (7 tarjetas).
- **App de favoritos de cuenta:** **construida offline y probada**: 156/156 tests y 19/19 mutantes (ambos re-corridos por Claude), zip determinista `559c346a…296a`. **Sin crear en el Dev Dashboard ni instalar**: owner-only.
- **Owner-only:**
  - Search & Discovery (OAuth);
  - creación/instalación de la app;
  - código de login;
  - 4 páginas legales (el clasificador de permisos denegó la escritura);
  - subir media a Archivos;
  - tarifa de envío.
- **RC1.4** `cba89ac9…a9ca`: remoto = ZIP (96/96).
- **Regresión:**
  - offline 54/54;
  - mutantes nuevos 11/11;
  - matriz real 63/63 sin overflow;
  - 0 JS fatal propio;
  - 0 Liquid fatal.

## Los 52 puntos

| # | Punto | Resultado |
|---|---|---|
| 1 | Modelo confirmado | Claude Opus 5.5 (`claude-opus-5-5`) |
| 2 | Tiempo transcurrido | 10:30 → ~11:40 (Bogotá), ≈ 1 h 10 min |
| 3 | Uso exacto | UNAVAILABLE para la sesión completa. Subagentes: reconocimiento ~786k tokens y 298 tool uses; app ~350k tokens y 115 tool uses |
| 4 | Índice de búsqueda | **27/29 y completándose** (estaba estancado; se desbloqueó con un toque neto cero). 8/29 a las 10:28 → 8/29 a las 11:08 (estancado) → 10/29 a las 11:12 → 12/29 a las 11:17 → **27/29 a las 11:36** tras el toque neto cero de las 11:24–11:26 (13 → 20 → 21 → 23 → 25 → 26 → 27 entre 11:26 y 11:35). Al cerrar quedan en cola `bikini-waves-terracota` y `sol-interno-beige-suave`. Causa: la importación masiva no indexó todo; los productos se indexan cuando se actualizan (§ A). El theme dibuja correctamente todo lo que el índice devuelve |
| 5 | Search & Discovery instalada | **NO**: `DEFERRED_OWNER_ONLY_BLOCKER`. Es la app oficial y gratuita de Shopify, pero instalarla = consentimiento OAuth de permisos, que requiere OK explícito de Daniela. Solo aporta talla y color (§ B) |
| 6 | Filtros configurados | Nativos de Shopify sin la app: **Precio** (activo, corregido) y **Disponibilidad** (oculto por `collection_show_availability_filter` = OFF). Orden: 9 opciones de Shopify; "manual" se muestra como "Destacados"/"Featured" (Shopify decía "Características") |
| 7 | Experimento de color | **POSITIVO PARCIAL (1 de 2 confirmado).**<br>- `color:BLANCO`: "blanco" → `bikini-foam` en el predictive (incluso con solo el campo `tag`) y en `/search`. **El tag se indexa y se tokeniza.**<br>- `color:MOSTAZA`: el producto ya está indexado, pero "mostaza" devuelve 0 a las 11:36. La entrada del índice es anterior al tag; re-medir en 03E.<br>- Matriz a las 11:36: negro 6, beige 5, azul 4, naranja 2, enterizo 8, blanco 1, mostaza 0, aurora viva 11, SKU 1. |
| 8 | Tags de color aplicados | Solo a los 2 productos del experimento (`entero-golden-hour` → `color:MOSTAZA`, `bikini-foam` → `color:BLANCO`). No se aplicaron a los 29: los otros 27 ya llevan el color en el título (`catalog/color-search-tag-map.csv`). No se duplicaron tags ni se agregaron términos SEO |
| 9 | QA de filtros de colección | **PASS** en la tienda real: aplicar precio (150.000–190.000 → 6 productos), cambiar orden (se conserva el rango, `price-ascending` correcto), atrás/adelante, "Limpiar" conserva el orden, querystring persistente, drawer mobile. Sin Disponibilidad. Detalle en § B |
| 10 | Arquitectura 02L sigue válida | **SÍ**, con 11 revisiones (R1–R11; § C). Se mantienen: metafield del comercio `custom.wishlist` (`list.product_reference`), app proxy firmado, `metafieldsSet` + `compareDigest`, extensión full-page `customer-account.page.render` y el contrato `connectAccount(transport)` sin cambios |
| 11 | App custom creada | **SÍ, offline** (`shopify-migration/app/`). Incluye:<br>- backend Node sin dependencias ni base de datos: app proxy E1, endpoint de la extensión E2 y webhooks de compliance no-op;<br>- extensión "Mis favoritos";<br>- app embed de transporte.<br>**NO registrada en el Dev Dashboard:** `shopify app init/config link` exige login de la cuenta de desarrolladora de la dueña (`DEFERRED_OWNER_ONLY_BLOCKER`). |
| 12 | Estado de instalación de la app | **NO instalada**: `DEFERRED_OWNER_ONLY_BLOCKER` (cuenta de desarrollador, `app config link`, consentimiento OAuth, distribución custom irreversible) |
| 13 | Definición del metafield de cliente | **NO creada** en la tienda: `DEFERRED_OWNER_ONLY_BLOCKER`. El acceso Customer Account de una definición del comercio se configura solo en el Admin, y crearla sin la app no aporta. Especificación lista (§ C) |
| 14 | App proxy | **Implementado offline, no desplegado:** `POST /proxy/wishlist` (prefijo `apps`, subpath `radaelli`).<br>- **Firma:** HMAC-SHA256 según shopify.dev (reproduce los vectores oficiales).<br>- **Tienda y tiempo:** allowlist de tienda y ventana de ±300 s.<br>- **Identidad:** solo `logged_in_customer_id` firmado; toda falla de identidad → 401.<br>- **Entrada:** JSON estricto, tope de 100 solo a altas, límite de body.<br>- **Otros:** rate limit orientativo en memoria y logs sin PII. |
| 15 | Tests de HMAC/seguridad | **PASS.**<br>- Vectores oficiales (secreto `hush`) y el vector FALSO del diseño.<br>- Firma alterada o ausente, parámetros repetidos o reordenados, tienda ajena, timestamp viejo o futuro, anónimo → 401. El body no puede pisar la identidad.<br>- Session token: `exp`, `aud`, `alg` (rechaza `none` y RS256), firma y `sub`.<br>- HMAC de webhooks.<br>- Mutantes de seguridad muertos: allowlist, `customerId` en el body, `alg`/`aud`, HMAC de webhook, header anti-CSRF, loguear la firma. |
| 16 | Tests del algoritmo de unión | **PASS.**<br>- `{A,B,C}` + `{B,D}` → `[B,D,A,C]`, igual que `core.union` de `wishlist.js`.<br>- Idempotente: el segundo merge no escribe. Orden determinista.<br>- Tope de 100 solo a altas, con `rejected`. Una lista heredada de 110 no se trunca.<br>- Normalización GID ↔ numérico. |
| 17 | Tests de CAS/conflictos | **PASS.**<br>- Digest viejo → el reintento funciona; 3 viejos seguidos → 409.<br>- Escritores concurrentes simulados no pierden altas.<br>- Lista vacía según `EMPTY_LIST_STRATEGY`.<br>- Qué código devuelve Shopify ante un digest viejo no está documentado (GO/NO-GO). |
| 18 | Adaptador remoto del theme | Sin cambios; ya estaba listo en 02L (`wishlist.js` `connectAccount`). Queda **inerte** hasta que exista el transporte real |
| 19 | `wishlist_account_sync` final | **false** (verificado en `config/settings_data.json` y en el remoto) |
| 20 | Extensión Customer Account construida | **SÍ, offline:** `extensions/mis-favoritos` (target `customer-account.page.render`).<br>- Lista fresca vía `shopify.query`, sin guardar precio ni stock.<br>- "Quitar" vía E2 con session token.<br>- Estados vacío y no disponible/borrado; deep link a la ficha.<br>- Textos del theme, más 3 nuevos para que Daniela los revise.<br>- Lógica pura testeada. El JSX solo pasó un chequeo de sintaxis: no está tipado ni ejecutado, porque no hay dependencias instaladas. |
| 21 | Extensión instalada/probada | **NO**: requiere app instalada (owner-only) |
| 22 | Login passwordless real | **DEFERRED_OWNER_ONLY_BLOCKER** (código por email). Script de 2 minutos para Daniela en § F |
| 23 | Objeto `customer` de Liquid | No verificable sin sesión real. El bootstrap se imprime solo con `wishlist_account_sync` ON (offline probado en 02L) |
| 24 | Unión invitada → cuenta en real | NO ejecutada (requiere login + app). Cubierta con tests unitarios e integración (app: 156/156) |
| 25 | Sincronización entre dispositivos/cuenta | NO ejecutada (misma dependencia) |
| 26 | Cierre de sesión | Sin cambios respecto de 02L. En modo invitada no hay estado de cuenta. El comportamiento cross-tab/pageshow del modo cuenta está probado offline en 02L |
| 27 | Requiere plantillas legacy de cuenta | **NO** (New Customer Accounts; `<shopify-account>` en el header, `/account` → login de Shopify) |
| 28 | Auditoría de assets faltantes | **HECHA**: `theme/03D-missing-assets-audit.md`. **Todas** las fuentes existen con URL exacta en el Cloudinary propio. Corrige a 03C: no eran NOT_AVAILABLE, eran datos solo de la base |
| 29 | Hero | Fuente encontrada (video `…/lago/home/bb70lfnhpbl4h8ee7mdz.mp4` + poster). **No migrado**: subir a Archivos = `DEFERRED_OWNER_ONLY_BLOCKER`. Manifiesto M01–M02 |
| 30 | Portadas de colección | 4 banners + 4 tarjetas encontrados con encuadre exacto. No migrados (M03–M13). Salidas de Baño: 32,7 MP, requiere `c_limit` |
| 31 | Guía de tallas | Fuente encontrada (PNG 1024×1536, solo Oasis Natural). No migrada (M14). Contenido de texto: NOT_AVAILABLE (no existe) |
| 32 | Destacados/recomendados | **Destacados: HECHO** (colección manual "Destacados" = los 7 visibles hoy: 10 flags `featured` − 3 de Oasis que la Home excluye). **Recomendados: NOT_AVAILABLE** (algorítmico/aleatorio) → sección sin colección; decisión editorial pendiente |
| 33 | Auditoría legal/políticas | **HECHA**: `theme/03D-legal-policies-inventory.md`. Las 6 páginas existen completas; faltan razón social, NIT y dirección (NOT_AVAILABLE) |
| 34 | Páginas/políticas migradas | **2/6**: Política de reembolso ← `/devoluciones`, y página visible `garantia`. Texto idéntico ignorando espacios (SHA-256 `c9c65d02…`, `b44d879a…`). Las otras 4 (privacidad, términos, envíos, cookies) quedan owner-only: el clasificador de permisos denegó crearlas. HTML verbatim listo en `content/legal/` |
| 35 | Auditoría de envío gratis | **HECHA**: `theme/03D-free-shipping-audit.md`. Implementado el cerrojo único + guard de moneda + `threshold_note`. Verificado en real: 0 menciones en Home, ficha y carrito |
| 36 | Código del theme cambiado | **SÍ**: `snippets/collection-filters.liquid`, `assets/collection-filters.js`, `sections/promo-banner.liquid`, `sections/main-product.liquid`, `snippets/cart-free-shipping.liquid`, `sections/footer.liquid`, `assets/section-footer.css`, `config/settings_schema.json`, `config/settings_data.json`, `templates/product.json`, `templates/index.json`, `locales/es.default.json`, `locales/en.json` |
| 37 | Código de app creado | **SÍ:** `shopify-migration/app/`. Contiene README, TOML con `client_id` vacío, `server/`, `extensions/`, `test/`, `scripts/pack.mjs` y `.env.example` (solo nombres).<br>- Escaneo de secretos: 0.<br>- Archivos `.env*` en el zip: 0.<br>- Scope `write_app_proxy` verificado en shopify.dev (access scopes). |
| 38 | Versión/hash del release | **RC1.4** `dist/radaelli-shopify-theme-rc1.4.zip`: SHA-256 `cba89ac9926ca2256c637139b2524ed5110196aefdfcd508ae3e9de258c5a9ca`, 170.634 bytes, 96 archivos, determinista (rebuild = mismo hash). App: `dist/radaelli-wishlist-app-0.1.0.zip`, SHA-256 `559c346a8121d822462f3622abfb77e38d55607a83cd263bde37d3421687296a`: 34 entradas, determinista. |
| 39 | Theme Check | 0 errores / 0 warnings (theme-src y ZIP extraído, 60 archivos inspeccionados) |
| 40 | Suite de regresión | Offline **54/54** (45 previos + 5 filtros + 3 envío gratis + 1 destacados). Mutantes nuevos **11/11** detectados (11–21), control 15/15. App: **156/156** (`node --test app/test`) y mutantes **19/19** (`node app/test/mutants.mjs`); ambos re-corridos por Claude. |
| 41 | Matriz responsive real | **63/63 sin overflow**: Home, Colección, Ficha, Búsqueda, Carrito, Favoritos, Garantía, Reembolso y Destacados × 320/375/390/430/768/1024/1280. Entrada a cuenta: `<shopify-account>` + `/account` → login de Shopify (redirect) |
| 42 | JS fatal | **0 propios**. En la matriz srcdoc aparece "Script error." de `cdn.shopify.com/shopifycloud/preview-bar` (la barra de vista previa de Shopify hace `new URL()` con base `about:srcdoc`: artefacto del método). En 7 navegaciones reales: 0 errores de consola |
| 43 | Liquid fatal | 0 (63/63 y diagnóstico offline 0/0/0) |
| 44 | Horizon sin tocar | **SÍ** (`theme list`: `189072113983 live Horizon`) |
| 45 | Radaelli sin publicar | **SÍ** (`189072474431 unpublished`) |
| 46 | Catálogo sigue 29/98/95 | **SÍ** (`/products.json`: 29 productos, 98 variantes, 95 imágenes). Cambios de catálogo: 2 tags del experimento (`color:BLANCO`, `color:MOSTAZA`), colección nueva "Destacados" y un toque neto cero de reindexación (etiqueta temporal agregada y quitada). Observación: al guardar un producto desde el editor nuevo, el Admin muestra "Sin categoría" (antes vacío). Es visual; no cambia datos del storefront |
| 47 | Producción/Staging/main tocados | **NO** |
| 48 | Pagos/Wompi tocados | **NO** |
| 49 | Owner-only blockers | Ver § G (lista única priorizada) |
| 50 | Blockers para 03E | índice con 2/29 aún en cola al cerrar (se completa solo; re-medir al inicio de 03E) y "mostaza" por tag aún no visible; owner-only de § G; los GO/NO-GO de plataforma de la app (2, 4/15, 6, 8, 10–14), que solo se validan con la app instalada y un login real |
| 51 | READY FOR 03E | **SÍ**, con los blockers owner-only aislados. Ninguno bloquea trabajo independiente de 03E |
| 52 | CERO TAREAS DE SEGUNDO PLANO ACTIVAS | Ver el cierre al final del handoff |

## A. Búsqueda e índice

Medición completa: `theme/03D-search-index-report.md`.

- **Método:**
  - cobertura = para cada uno de los 29 productos, el predictive (`title,product_type,tag`) con su título exacto devuelve su propio handle;
  - también se compara con `/search`.
- **Estancamiento:** 8/29 desde las 10:28 hasta las 11:08. A las 10:48 Shopify marcó `updated_at` en los 29, sin efecto.
- **Disparador:**
  - a las 11:03 se sumaron 7 productos a "Destacados";
  - a las 11:12 había 10/29 y a las 11:17, 12/29: entraron los de Destacados y ningún producto sin tocar.
- **Experimento de color:** tags `color:MOSTAZA` (ENTERO GOLDEN HOUR) y `color:BLANCO` (BIKINI FOAM), guardados a las 11:11–11:12. Son los únicos 2 productos cuyo título no trae el color (`catalog/color-search-tag-map.csv`, generado por `scripts/build-color-search-tag-map.mjs` desde `custom.color`). Resultado: 
  - **`color:BLANCO` funciona:** "blanco" → `bikini-foam` en el predictive, también restringido al campo `tag`, y en `/search`. El título "BIKINI FOAM" y el tipo "Espuma de Ola" no contienen "blanco".
  - **`color:MOSTAZA` todavía no:** el producto entró al índice a las ~11:27, pero "mostaza" da 0 a las 11:36. La respuesta del predictive ya trae el tag y el índice no, así que la entrada indexada es anterior al tag.
  - **Decisión:** **no** aplicar tags a los 29. Los otros 27 ya tienen el color en el título, y lo confirman "negro" 6/6, "azul" 4 y "naranja" 2.
  - Se mantienen los 2 tags, con la convención `color:<custom.color>`. Re-medir "mostaza" en 03E.
- **Remedio aplicado (11:24–11:26):** toque **neto cero** sobre los 29 productos, para disparar la indexación de los 16 que faltaban.
  - Acción masiva del Admin: "Agregar etiquetas" `reindex-03d` y después "Eliminar etiquetas" `reindex-03d`.
  - Verificado en `/products.json`: etiqueta temporal en 0 productos; únicos tags = `color:BLANCO` y `color:MOSTAZA`; 29/98/95 intacto.
  - Es una escritura no destructiva y directamente relacionada con esta fase (índice de búsqueda).
  - Resultado: 13/29 (11:26) → 20 (11:29) → 23 (11:31) → 25 (11:32) → **27/29 (11:35–11:36)**. Quedan 2 en cola al cerrar; se completan solos. Hay que re-medir al empezar 03E.

## B. Filtros (tienda real, sin Search & Discovery)

| Prueba | Resultado |
|---|---|
| Grupos disponibles | Ordenar por, Disponibilidad (`filter.v.availability`, tipo list), Precio (`price_range`) |
| Precio 150.000–190.000 | 6 productos (los de $183.920); inputs vuelven en unidades (antes 20.000.000) |
| Cambiar orden con precio activo | La URL conserva `filter.v.price.gte/lte` + `sort_by`; el orden por precio es correcto |
| Atrás (bfcache) | Antes mostraba el `select` con un orden viejo. Corregido: `pageshow` re-sincroniza los controles y cierra el drawer; más `autocomplete="off"` |
| Adelante | Correcto |
| "Limpiar" | Conserva `sort_by` si no es el orden por defecto |
| Disponibilidad | Oculta: inventario no rastreado → todo "En existencia" (`collection_show_availability_filter` OFF) |
| Etiqueta del orden manual | "Destacados" (es) / "Featured" (en), en lugar de "Características" |

- **Arnés offline:** ahora es fiel a Shopify.
  - Precio en centavos, disponibilidad `list`, 9 opciones de orden reales, `sd=0` sin S&D.
  - 5 tests nuevos y 6 mutantes (11–16), todos detectados.
- **Con Search & Discovery** (owner-only): talla (`filter.v.option.talla`) y color (`custom.color`). El theme ya los dibuja como chips con links (probado offline).

## C. Cuentas y app de favoritos (02L re-auditada)

Diseño verificado contra shopify.dev: `theme/03D-accounts-app-design.md`. Paquete completo: `app/README.md`.

**Veredicto:** la arquitectura 02L **sigue válida**. Revisiones:

- **R1.** La app no puede ser extension-only: el proxy y la función necesitan backend propio.
- **R2.** Un solo camino de escritura: "Quitar" en la extensión va a `/ca/wishlist` con session token; la Customer Account API queda en solo lectura.
- **R3.** El token de Admin sirve con client credentials solo si la app y la tienda están en la misma organización; si no, hace falta un token offline guardado como secreto (pendiente de decisión).
- **R4.** Webhooks de compliance: no-op con verificación HMAC.
- **R5.** El transporte corta a los 10 s, porque `wishlist.js` mantiene el Web Lock durante `apply`.
- **R6.** `items`, `rejected` y `notFound` usan ids numéricos.
- **R7.** Toda falla de identidad responde 401, para que el cliente no reintente.
- **R8.** `accountPageUrl` es un setting del app embed.
- **R9.** Lista vacía: `"[]"` + CAS, o `metafieldsDelete` como alternativa (GO/NO-GO 10).
- **R10.** Producto borrado = `nodes()` devuelve `null` (GO/NO-GO 11).
- **R11.** Los logs no incluyen query firmada, id de clienta ni token.

**Contrato:**

- **E1** `POST /apps/radaelli/proxy/wishlist`: tienda → app proxy firmado.
- **E2** `OPTIONS|POST /ca/wishlist`: extensión con session token.
- Mismo body en ambos: `{"v":1, ...}`; leer, unir, quitar y reconciliar son variantes del body.
- **E3** `POST /webhooks`: compliance.
- **E4** transporte: app embed que registra `window.Radaelli.wishlist.connectAccount(transport)`, sin cambios en el theme.
- **Errores:** `{"v":1,"error":"<código>"}`.

**Metafield:** `custom.wishlist` de **cliente**, tipo `list.product_reference`, creado por el comercio (no `$app`), así sobrevive a una desinstalación.

- Shopify admite hasta 128 ítems en `list.*`; el tope propio es 100 altas. No se define `list.max`, para no truncar listas heredadas.
- Acceso Customer accounts de solo lectura, configurable únicamente desde el Admin.

**GO/NO-GO nuevos 10–15** (en la tienda real, con la app instalada):

- `metafieldsSet` con `"[]"` y CAS;
- `nodes()` con un producto borrado;
- formato de `dest` en el session token;
- proxy con la tienda protegida por contraseña;
- `shopify.query` desde la extensión;
- código de error de CAS.

**Desvíos de la implementación respecto del diseño** (README § 11):

- app embed incluido;
- ids más estrictos (`^[1-9][0-9]{0,19}$`);
- códigos de error adicionales;
- rate limit en memoria, orientativo;
- timeout total de 10 s;
- lista vacía configurable;
- sin ruta de instalación OAuth (token offline por variable de entorno o client credentials);
- `dest` acepta el dominio sin esquema;
- `GET /` mínimo;
- 3 textos nuevos.

## D. Contenido real migrado

- **Destacados:** colección manual `destacados` con 7 productos, conectada a `featured-products` en `templates/index.json`.
  - Fuente: flags `featured` observados en el payload RSC del sitio en vivo, más la exclusión de la editorial (`app/page.tsx:55-67`).
  - Real: 7 tarjetas, 0 repetidas con la editorial.
- **Reembolso y garantía:** ver `theme/03D-legal-policies-inventory.md`. Extracción verbatim reproducible: `scripts/extract-legal-verbatim.cjs` → `content/legal/`.
- **Footer:** `id="contacto"` + `scroll-margin-top` (EXACT del real), para que funcionen los enlaces `/#contacto`.

## E. Lecciones de plataforma (nuevas en 03D)

1. **Precio del filtro en centavos.** `filter.min_value.value` / `max_value.value` vuelven en centavos; el parámetro de la URL se lee en unidades.
2. **Settings nuevos descartados en silencio.** Si en el **mismo** push van el template con un setting nuevo y la sección que lo define, Shopify valida contra el schema viejo y **descarta el setting en silencio** (sin warning en `--json`).
   - Lo detectó la comparación de paridad remoto vs ZIP (95/96 → re-push → 96/96).
   - Regla: pushear primero la sección y después el template.
3. **Índice incompleto tras importación masiva.** La indexación se dispara al actualizar el producto.
4. **`manual` mal traducido.** En `collection.sort_options` Shopify localiza `manual` como "Características", e incluye `most-relevant` también en colecciones.

## F. Script de 2 minutos para Daniela (login real, cuando vuelva)

1. En el Chrome del PC, abrir `https://radaelli-swimwear-dev.myshopify.com/?preview_theme_id=189072474431`.
2. Tocar el ícono de cuenta (arriba a la derecha) → "Iniciar sesión" → escribir **el correo de acceso de la tienda (r…@gmail.com, el mismo de 03B)** → "Continuar".
3. Abrir el correo, copiar el código de 6 dígitos y escribirlo en la pantalla de Shopify. Claude **no** lee ni escribe el código.
4. Al volver a la tienda, avisarle a Claude: "listo". Claude verifica el header (`customer` presente), `/account`, cierre de sesión y el GO/NO-GO #1 de `customer-accounts-report.md` § 20.
5. Cerrar sesión desde la cuenta.

## G. Owner-only — UNA lista priorizada

Orden = lo que más desbloquea primero. Ninguno bloquea trabajo independiente de 03E.

| # | Qué hace Daniela | Tiempo | Desbloquea |
|---|---|---|---|
| 1 | **Código de login de clienta** en el Chrome del PC (script § F). Claude nunca lee ni escribe el código | 2 min | GO/NO-GO #1, objeto `customer`, prueba real de cuenta |
| 2 | **OK para instalar Search & Discovery** (app oficial y gratuita de Shopify; acepta permisos OAuth) | 1 min | Filtros de talla y color (paridad con el sitio real) |
| 3 | **App de favoritos:** cuenta de desarrolladora/organización, login de CLI, `shopify app config link`, custom distribution (irreversible), instalar aceptando scopes (`read/write_customers`, `read_products`, `write_app_proxy`, `customer_read_customers`), hosting de la función + secretos, definición `custom.wishlist` con acceso de lectura para Customer accounts | 30–60 min, con Claude | Favoritos de cuenta y "Mis favoritos" (paquete listo: `dist/radaelli-wishlist-app-0.1.0.zip`) |
| 4 | **OK para descargar 13 archivos del Cloudinary propio y subirlos a Contenido > Archivos** (o subirlos ella) | 5 min + Claude | Hero, tarjetas de categorías, banners y guía de tallas (`content/media/media-migration-manifest.csv`) |
| 5 | **Legales:** aprobar Privacidad, Términos, Envíos y Cookies (HTML verbatim en `content/legal/`, con observaciones en `theme/03D-legal-policies-inventory.md`); entregar razón social, NIT y dirección; decidir la columna "Ayuda" del footer | 15 min de lectura | Páginas legales y footer completos |
| 6 | **Tarifas de envío Colombia** (gratis desde $299.900 + tarifa por debajo). Después se enciende `free_shipping_rate_confirmed` | 10 min | Promesa de envío gratis (banner, ficha, carrito) |
| 7 | Idioma principal de la tienda (el cambio reescribe todos los temas → hacerlo al publicar) | al publicar | — |
| 8 | Entidad o mercado de EE. UU. (sigue activo; afecta moneda) | decisión | — |
| 9 | Voseo o tuteo (los textos legales mezclan ambos) | decisión | — |
| 10 | "Recomendado para vos": curar una colección o dejar la sección oculta | decisión | — |
| 11 | Al publicar: asignar la plantilla `page.wishlist` a Favoritos | al publicar | — |
