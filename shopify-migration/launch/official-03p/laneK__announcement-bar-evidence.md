# Lane K-B — Evidencia de la barra de anuncio «20% DE DESCUENTO EN TODA LA TIENDA»

- **START (America/Bogota):** 2026-10-02 09:41:54 · **END:** 2026-10-02 09:52:13
- **Modo:** SOLO LECTURA (consultas Admin GraphQL `query` sin `--allow-mutations`; nada se cambió). Tabla completa por variante: `announcement-bar-variants.json` (misma carpeta).
- **Fuentes:** (1) `lab-sanity.json` (laboratorio certificado, 98 variantes, leído de archivo); (2) tienda oficial `wgcvpd-ib` leída **en vivo** a las ~09:47 (29 productos / 98 variantes); (3) tema RC1.10 (`rc110-extract/` y `official/laneA/pull-official/`); (4) `launch/03G-current-site-baseline.md` (medición del sitio anterior) y `launch/03G-cutover-runbook.md` D-CT17; (5) pedido de prueba #1001 de la tienda oficial y #1002/#1003 del lab.

---

## 1. Veredicto

**La afirmación de la barra es CONSISTENTE con los precios del catálogo.** Hecho medido, no opinión:

| Medida | Laboratorio (archivo) | Tienda oficial (en vivo) |
|---|---|---|
| Productos | 29 (todos ACTIVE) | 29 (todos ACTIVE y publicados) |
| Variantes | 98 | 98 |
| Con precio de comparación (`compareAtPrice`) | **98** | **98** |
| Sin precio de comparación | **0** | **0** |
| Precio **exactamente** 80 % del `compareAtPrice` (= 20 % menos) | **98 / 98** | **98 / 98** |
| Variantes con descuento distinto de 20 % | **0** | **0** |
| Oficial == laboratorio (precio y comparación, por SKU) | — | **98 / 98 idénticas** |

Los 4 pares de precios existentes (COP) y su cuenta:

| `compareAtPrice` (precio anterior) | `price` (actual) | Descuento | Variantes | Productos |
|---|---|---|---|---|
| 199.900 | 159.920 | 20,000 % | 18 | 6 |
| 209.900 | 167.920 | 20,000 % | 36 | 9 |
| 229.900 | 183.920 | 20,000 % | 32 | 10 |
| 249.900 | 199.920 | 20,000 % | 12 | 4 |
| **Total** | | | **98** | **29** |

Por tanto «toda la tienda» es literalmente cierto para el catálogo: ninguna variante ni producto queda fuera. La etiqueta `-20%` que pinta el tema (`snippets/price.liquid`: `round((cmp-price)*100/cmp)`) da 20 en las 98.

**Pero** el 20 % está «horneado» en los datos (precio y precio de comparación), **no** lo respalda ningún descuento de Shopify, y la promoción **no tiene fecha de fin ni mecanismo de retiro** (D-CT17 del cutover). Esos hechos son los que condicionan las opciones del § 6.

---

## 2. Dónde aparece la afirmación (superficies)

| # | Superficie | Detalle exacto | Origen |
|---|---|---|---|
| S1 | **Barra de anuncio** (encima del header, todas las páginas) | texto guardado `20% de descuento en toda la tienda`; CSS `text-transform: uppercase` → «20% DE DESCUENTO EN TODA LA TIENDA»; sin enlace; fondo negro, texto blanco | `sections/header-group.json` → `announcement-bar.settings.text`; el aviso original era un **cálculo automático** (`Settings.discountPercent`) y en Shopify es **texto manual** (`announcement-bar.liquid` lo documenta) |
| S2 | **Banner promocional de la Home** | `eyebrow` «Por tiempo limitado», titular «20% de descuento en toda la tienda», botón «Descubrir la colección» | `templates/index.json` solo sobrescribe `cta_url`; el resto sale de los **valores por defecto del esquema** de `sections/promo-banner.liquid` (derivado por lectura de código; esta lane no renderizó la página) |
| S3 | Etiquetas en tarjetas y ficha | precio actual + precio anterior tachado + pastilla «-20%» en las 98 variantes | `snippets/price.liquid` desde `compare_at_price` |
| S4 | Términos y condiciones | «Los precios… incluyen los descuentos vigentes al momento de la compra» | `content/legal/terminos.html` |
| S5 | Carrito/checkout | muestra solo el precio actual; el precio anterior **no** se muestra (`cart_show_compare_at: false`) | `config/settings_data.json` |

Estado de visibilidad: la tienda oficial sigue **protegida con contraseña** y RC1.10 está **sin publicar** (tema id `191904514347`, `push-official.log`); hoy la barra no es pública. El texto es idéntico en el ZIP RC1.10, en `pull-official` y en el lab (`renderedInLab: «20 % DE DESCUENTO EN TODA LA TIENDA»`).

---

## 3. Evidencia A — aritmética del catálogo

- Regla probada: `price == round(compareAtPrice × 0,8)`. En los 4 pares el resultado es un entero exacto (p. ej. 199.900 × 0,8 = 159.920), sin redondeo.
- Resultado: **98 de 98 exactos en el lab y 98 de 98 exactos en la tienda oficial**; `variantsWithoutCompareAt = []`, `variantsNotExact20 = []`.
- Productos por par de precios (todas sus variantes cumplen): ver `announcement-bar-variants.json` → `products`.
- Procedencia: el sitio anterior ya mostraba `-20%` en 29/29 fichas, con `precio con descuento = round(anterior × 0,8)` en 29/29 (`03G-current-site-baseline.md` líneas 14, 320–321); el catálogo de Shopify replica esos mismos pares.

## 4. Evidencia B — ¿hay descuentos de Shopify?

| Consulta (Admin GraphQL, sin mutaciones) | Resultado |
|---|---|
| `discountNodes(first:20)` | **ACCESS_DENIED**: el token almacenado no tiene `read_discounts` |
| `codeDiscountNodes(first:20)` | **ACCESS_DENIED** (mismo scope) |
| `automaticDiscountNodes(first:20)` | **ACCESS_DENIED** (mismo scope) |

**No legible por API con el token actual.** Evidencia indirecta (sí legible):

| Pedido de prueba | Línea | Descuentos | Lectura |
|---|---|---|---|
| Oficial `#1001` (test, PAGADO, 2026-10-02 13:45Z) | BIKINI FOAM S: precio original **159.920** = precio con descuento **159.920** | `totalDiscounts` 0,0 · `discountCodes` [] · `discountApplications` 0 | No se aplicó ningún descuento automático sobre un producto del catálogo en el checkout oficial |
| Lab `#1003` | 169.820 = 159.920 + 9.900 de envío | — | idem |
| Lab `#1002` | 319.840 = 2 × 159.920 (envío gratis) | — | idem |

Conclusión B: el 20 % **no depende de ningún descuento de Shopify**; se cumple solo por precio vs. precio de comparación. Un descuento automático adicional «por toda la tienda» habría alterado los totales de esos pedidos: **no se observó ninguno**. Lo que esta lane **no puede descartar por API** es un código de descuento creado a mano (los códigos solo actúan si el cliente los escribe; los cupones del sitio anterior no se migraron, D7). Para cerrar ese cabo: la dueña mira «Descuentos» en el Admin (UI) o se concede `read_discounts` al token.

## 5. Matices y riesgos documentados (hechos, no consejos legales)

1. **Mecanismo acoplado a datos, no al aviso:** la barra es texto libre. Si cambian los precios o se limpian los `compareAtPrice`, la barra seguirá diciendo 20 %. En el sitio anterior era un cálculo automático que se apagaba en 0 %.
2. **«Por tiempo limitado» sin fecha:** el banner de la Home (S2) lo dice y no existe fecha de fin ni mecanismo de retiro (`03G-cutover-runbook.md` D-CT17; `03G-current-site-baseline.md` B-14 «NOT_AVAILABLE»). La Ley 1480 de 2011 `[art. 33, validar]` pide informar condiciones de tiempo/modo/lugar y fecha de inicio y fin o número de unidades de una promoción; **decisión de la dueña/asesor**.
3. **Respaldo del «precio anterior» no verificable con los artefactos:** esta lane no tiene evidencia de que las prendas se hayan vendido a los precios anteriores (199.900–249.900); el historial de pedidos está bloqueado/no migrado (Lane J, D7). Es un dato que solo la dueña puede afirmar. `NOT_VERIFIED`.
4. **Visibilidad parcial del descuento:** carrito y checkout muestran solo el precio actual (`cart_show_compare_at: false`); el descuento se ve en tarjetas, ficha y barra.
5. **Quitar la barra no quita el descuento:** las pastillas `-20%` y el tachado salen de `compareAtPrice` (S3) y el banner de la Home (S2) es otro texto independiente.

## 6. Opciones para la dueña (no se cambió nada)

Cada opción indica qué se toca exactamente. Lo ejecutaría el coordinador solo con decisión explícita de la dueña. Valor por defecto vigente (D1 en `owner-action-batch.md`): **mantener**.

### Opción 1 — MANTENER tal cual (defecto)
- **Cambio:** ninguno.
- **Sostén fáctico:** 98/98 variantes con 20 % exacto en oficial y lab; 0 sin precio de comparación; 0 con descuento distinto; paridad con el sitio anterior (29/29).
- **Pendiente que sigue abierto:** la fecha de fin de la promoción (D-CT17) y que la dueña pueda respaldar el precio anterior (§ 5.2–5.3).

### Opción 2 — MANTENER + ponerle fecha (reformular)
- **Texto exacto sugerido:** `20% de descuento en toda la tienda hasta el [DD de MES de AAAA]` (marcador; la fecha la da la dueña).
- **Se toca:** `sections/header-group.json` → `announcement-bar.settings.text` (barra) y, para coherencia, `templates/index.json` → `promo-banner.settings.headline` (hoy toma el valor por defecto). El `eyebrow` «Por tiempo limitado» ya queda coherente con una fecha.
- **Obligación posterior:** retirar la promoción en esa fecha (ver el procedimiento de retiro en la Opción 4).

### Opción 3 — REFORMULAR sin plazo (si no habrá fecha de fin)
- **Textos posibles (la dueña elige; ninguno altera lo medido):**
  - Barra: `20% de descuento en toda la tienda` (sin cambio) **y** en `templates/index.json` → `promo-banner.settings.eyebrow` poner un valor vacío `""` para quitar «Por tiempo limitado» (el eyebrow solo se pinta si no está vacío; confirmar en el editor que el valor vacío prevalece sobre el predeterminado).
  - o barra: `Todos nuestros trajes de baño con 20% de descuento`.
- **Se toca:** `header-group.json` (si cambia la barra) y `index.json` (eyebrow/headline).
- **Riesgo que sigue:** § 5.2–5.3 (decisión de la dueña/asesor).

### Opción 4 — QUITAR la barra
- **Quitar solo la barra:** `announcement-bar.settings.text` = `""` (la sección se oculta sola cuando el texto está vacío, según `announcement-bar.liquid`) o quitar la sección de `header-group.json`.
  - **Efecto:** la barra desaparece, **pero** siguen visibles el banner de la Home (S2), el tachado y las pastillas `-20%` (S3).
- **Quitar el descuento por completo** (dos variantes; son cambios de catálogo de las **98** variantes con `productVariantsBulkUpdate`, con respaldo previo):
  - **4a. Dejar los precios actuales como precio normal:** `compareAtPrice := null` en las 98 → desaparecen tachado y pastillas; los precios se quedan en 159.920–199.920. Además quitar o cambiar el banner de la Home.
  - **4b. Volver al precio de lista:** `price := compareAtPrice` y `compareAtPrice := null` (**+25 %**):

    | Precio actual → precio de lista | Variantes |
    |---|---|
    | 159.920 → 199.900 | 18 |
    | 167.920 → 209.900 | 36 |
    | 183.920 → 229.900 | 32 |
    | 199.920 → 249.900 | 12 |

  - En ambas, verificar después: 98 variantes sin `compareAtPrice` (4a) o con `price == lista` (4b), barra y banner sin la frase, el umbral de envío gratis ($299.900) y los textos de Términos («incluyen los descuentos vigentes») siguen coherentes.

### Qué verificaría el coordinador después de cualquier cambio
1. Lectura de las 98 variantes (price/compareAt) y conteo de pares.
2. `header-group.json`/`index.json` en la tienda (texto de barra y banner).
3. Render de la Home y de una ficha: barra, banner, pastillas.
4. Pedido de prueba: totales sin descuentos extra.

---

## 7. Bitácora

- Consultas ejecutadas sobre `wgcvpd-ib.myshopify.com`, todas `query`: `q-variants.graphql` (OK), `q-orders-disc.graphql` (OK), `q-disc-all.graphql`, `q-disc-code.graphql`, `q-disc-auto.graphql` (ACCESS_DENIED `read_discounts`). Salidas crudas eliminadas tras generar el JSON consolidado.
- Scripts reproducibles en la carpeta: `variants-lab.mjs`, `variants-official.mjs`, `build-variants-table.mjs`.
- No ejecutado: ninguna escritura; no se tocó la tienda `launch` ni el lab (solo archivos ya capturados).
