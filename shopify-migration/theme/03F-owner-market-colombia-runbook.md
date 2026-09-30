# 03F — Runbook de la dueña: mercado y país (C1) — Colombia como mercado principal

- **Fecha de redacción:** 2026-09-29. **Estado: NO EJECUTADO.** Este archivo solo documenta; no se tocó la tienda, el theme ni el repo.
- **Tienda:** Development Store `radaelli-swimwear-dev` (`radaelli-swimwear-dev.myshopify.com`). Admin: `https://admin.shopify.com/store/radaelli-swimwear-dev`.
- **Qué resuelve:** **C1** de `theme/03E-checkout-baseline-report.md` § 2: todo visitante resuelve `Shopify.country = US` y el checkout abre en `es-us` ("$199,920.00").
- **Runbook par:** `shipping/03F-owner-shipping-runbook.md` (**C2**: zona de envío Colombia, catálogo agotado). Los dos se ejecutan en el **orden combinado del § 2**.
- **Quién hace qué:**
  - **La dueña** hace los cambios de configuración en el Admin (§ 7). Claude no cambia configuración de la tienda por ella.
  - **Claude** captura el snapshot si el Admin está visible, corre la verificación (§ 8) y redacta el reporte (§ 14).
- **Marcas usadas en este documento:**

| Marca | Significa |
|---|---|
| **MEDIDO-03E** | Medido en vivo en la Dev Store el 2026-09-29 (`theme/03E-checkout-baseline-report.md`) |
| **LEÍDO-03B** | Leído en el Admin en 03B (2026-09-28/29, `theme/03B-store-foundation-report.md`); **puede haber cambiado** |
| **DOC** | Documentación oficial (help.shopify.com / shopify.dev) leída el 2026-09-29, con su URL en el § 16 |
| **CAPTURAR AL INICIO** | Dato que no se pudo leer sin el Admin renderizado (la ventana de Chrome quedó en segundo plano en 03E). Se captura en el paso M0, antes de cambiar nada |
| **NOT_VERIFIED** | No se pudo confirmar con una fuente permitida. Se prueba durante la ejecución |
| **NOT_AVAILABLE** | El dato no existe en el repo (lo entrega la dueña) |

---

## 1. Resumen en un minuto

**Qué se cambia (4 cambios, todos reversibles):**

1. Dirección de la tienda → **Colombia** (Configuración > General).
2. **Colombia = mercado principal** (menú lateral **Mercados**).
3. **Estados Unidos = mercado en Borrador** (nunca "Eliminar").
4. **Región de respaldo = Colombia** (Configuración > General; según 03B ya lo estaba: confirmar).

**Qué NO se hace en este runbook:** no se instala Wompi, no se cambia el idioma predeterminado, no se borra ningún mercado ni zona, no se toca el theme, Horizon ni el catálogo.

**Regla de oro (orden):** **no ejecutar M5 ("Convertir en mercado principal") hasta que exista la zona de envío Colombia y Claude confirme el control G1** (`shipping/03F-owner-shipping-runbook.md`). Motivo: con Colombia como país por defecto y sin zona de envío, los 29 productos figuran **AGOTADOS** para todos los visitantes (MEDIDO-03E: 0/29 disponibles, `/cart/add.js` 422).

**Tiempo:** ~15–30 min de la dueña (el rango alto incluye ~10 min de snapshot si Claude no ve el Admin) + ~20–30 min de Claude, sin contar el runbook de envío. Detalle en el § 13.

---

## 2. Orden combinado C1 + C2 (los dos runbooks)

| Orden | Runbook | Paso | Qué | Quién |
|---|---|---|---|---|
| 1 | C1 | **M0** | Snapshot ANTES (§ 4) | Claude (Admin visible) o dueña con capturas |
| 2 | C1 | **M1** | Dirección de la tienda → Colombia | Dueña |
| 3 | C2 | **S1** | Dirección de la sucursal → Colombia | Dueña |
| 4 | C2 | **S2–S6** | Zona Colombia + tarifas (D2 decidida) | Dueña |
| 5 | C2 | **G1** | Control: con EE. UU. aún principal, forzar CO y comprobar 29/29 disponibles + add-to-cart 200 | Claude |
| 6 | C1 | **M2–M4** | Confirmar estado de mercados; activar Colombia si estuviera en Borrador | Dueña |
| 7 | C1 | **M5** | **Colombia = mercado principal** | Dueña |
| 8 | C1 | **M6–M7** | Región de respaldo = Colombia; **EE. UU. → Borrador** | Dueña |
| 9 | C1 | **M8–M9** | Mirar lista de pagos (Wompi) e idiomas, sin cambiar nada | Dueña |
| 10 | C1 | **M10** | Verificación § 8 | Claude |
| 11 | C2 | **S7 en adelante** | Zona EE. UU. (dejar o quitar), QA T1..Tn, cupones de prueba, cerrojo `free_shipping_rate_confirmed` | Dueña + Claude |

Los pasos M1 y S1 no dependen entre sí; se pueden hacer seguidos en la misma sesión.

---

## 3. Hechos de partida y hallazgos que ajustan lo dicho en 03E

### 3.1 Lo que se sabe hoy

| Hecho | Estado | Fuente |
|---|---|---|
| Mercado principal = Estados Unidos; todo visitante resuelve `Shopify.country = US`; checkout `es-us` | **MEDIDO-03E** | `03E-checkout-baseline-report.md` § 2 C1 |
| Con país CO (`POST /localization country_code=CO`): 0/29 productos disponibles, `/cart/add.js` 422 | **MEDIDO-03E** | ídem § 2 C2 |
| Perfil general con **una** zona "Domestic – Estados Unidos"; sucursal "Shop location" en EE. UU. | **MEDIDO-03E** (lectura del Admin) | ídem |
| Sin proveedor de pago activo | **MEDIDO-03E** | ídem § 1 |
| Moneda de la tienda = COP (Admin "Moneda de la tienda") | **LEÍDO-03B** + `/cart.js` → `"currency":"COP"` | 03B, puntos 8–10 |
| Mercado **Colombia "creado y activo"** (COP, sin recaudación de impuestos); **United States "sigue activo"** | **LEÍDO-03B** (no re-leído en 03E) | 03B, punto 11 |
| Región de respaldo cambiada de EE. UU. a **Colombia** | **LEÍDO-03B** (no re-leído en 03E) | 03B, resumen 1 |
| Español publicado y predeterminado del dominio (`/`); inglés en `/en`; **idioma principal del Admin = Inglés** (cambio diferido a la publicación) | **LEÍDO-03B** | 03B, resumen 2–3 |
| Zona horaria `America/Bogota`, métrico/kg | **LEÍDO-03B** | 03B, punto 12 |
| Dirección de la tienda (contacto) en EE. UU. | **LEÍDO-03B**; texto exacto de la dirección: **CAPTURAR AL INICIO** | 03B, punto 12 y `:270` |
| Tipo de tienda (Dev Dashboard vs. Partner) | **NOT_VERIFIED** | `payments/03E-wompi-shopify-feasibility.md` E35 |

### 3.2 Hallazgos de esta redacción (lo que cambia o precisa 03E)

| # | Hallazgo | Evidencia | Consecuencia |
|---|---|---|---|
| H1 | **El orden correcto es zona de envío primero, mercado después.** 03E § 5.3 ponía "Mercados" (paso 2) antes de "Zona Colombia" (paso 4) | DOC: "Markets can be activated only for countries and regions that have shipping rates." y "Countries and regions can be added to your shipping zones … only when those countries and regions belong to a market." El informe SEO de 03E ya pedía "C2 antes o junto con C1" | Este runbook se ejecuta **después** de S1–S6 y de G1 |
| H2 | 03B reportó Colombia **"activo" sin zona de envío**, algo que la regla de H1 no permitiría sin más | DOC: si un país del mercado no tiene tarifas, "an error displays in the market indicating which countries customers can't check out from" | **CAPTURAR AL INICIO**: estado real de Colombia (Activo/Borrador) y el aviso de error del mercado, si lo hay |
| H3 | C1 **no es una detección equivocada**: en una tienda no Plus, el visitante cae en el mercado principal | DOC (shopify.dev): la selección automática por geolocalización se describe para **Plus**; la app Geolocation "ya no se puede instalar" desde 2025-02-01 y solo "recomienda". La tienda es un plan de prueba Basic (E35) | Inferencia (**NOT_VERIFIED**) coherente con lo medido. Al pasar Colombia a principal, **todo visitante entra como CO** (lo deseado); los de otros países caen en la región de respaldo |
| H4 | La doc dice que el mercado principal "is determined by your store currency in Settings > General", pero aquí la moneda ya es COP y el principal sigue siendo EE. UU. | DOC vs. MEDIDO-03E | Esa frase no explica el estado ni sirve como paso. La acción documentada es **"Make primary market"**. No se toca la moneda |
| H5 | **Mercados está en el menú lateral, no dentro de Configuración.** "Región de respaldo" sí está en Configuración > General. 03E baseline escribió "Configuración > Mercados" | DOC (managing-markets): los pasos empiezan con "go to **Markets**" en el Admin, sin pasar por Configuración. Un resultado de búsqueda oficial anterior menciona "Settings > Markets" (página no identificada): si el menú lateral no muestra **Mercados**, buscarlo en Configuración (NOT_VERIFIED) | Corregido en este runbook |
| H6 | El mercado **no puede ser principal si tiene subcarpetas** o más de una región. Si el mercado tiene subcarpeta, sus URLs se rompen al desactivarlo | DOC (managing-markets) | El idioma inglés vive en `/en` (03B). **CAPTURAR AL INICIO** de qué mercado o dominio cuelga `/en` y comprobarlo después (V7) |
| H7 | Hay que **re-medir hreflang** y el login de cuentas (`es-US`, `region_country=US`) después del cambio | `seo/03E-seo-offline-review.md` § 4; 03B `:293` | Incluido en la verificación (V8) |
| H8 | `Shopify.country`, `Shopify.currency` y `Shopify.locale` **no están documentados** en shopify.dev; sí lo están el objeto Liquid `localization` y `currency` de `/cart.js` | DOC (shopify.dev/docs/api/liquid/objects/localization; ajax cart) | Se usan por continuidad con 03B/03E; `/cart.js` es la referencia documentada |

---

## 4. Snapshot ANTES (paso M0)

**Cuándo:** antes de cambiar nada. **Cómo:** Claude con el Admin visible (ventana de Chrome al frente) o la dueña con capturas de pantalla pegadas en el chat. **Todo es solo lectura.**

### 4.1 Datos del Admin

| # | Dato | Dónde | Estado | Valor esperado según documentos |
|---|---|---|---|---|
| A1 | Dirección de la tienda **completa** (país, calle, ciudad, región, código postal) | Configuración > General > Detalles de contacto de la tienda | **CAPTURAR AL INICIO** | País EE. UU. (03B). Texto: NOT_AVAILABLE |
| A2 | Moneda de la tienda, zona horaria, sistema de unidades | Configuración > General > Valores predeterminados de la tienda | LEÍDO-03B; **re-capturar** | COP · America/Bogota · métrico/kg |
| A3 | **Región de respaldo** | Configuración > General > Región de respaldo (nombre en español NOT_VERIFIED) | **CAPTURAR AL INICIO** | Colombia (03B) |
| A4 | Lista de mercados: nombre, estado (Activo/Borrador), **cuál dice "Principal"**, regiones | Mercados (menú lateral) | **CAPTURAR AL INICIO** | Estados Unidos principal y Activo; Colombia Activo (03B) |
| A5 | Por mercado (Colombia y Estados Unidos): **moneda**, **dominio / idiomas**, si tiene **subcarpeta** o dominio propio, **catálogo** (¿todos los productos?), **ajustes de precio** | Mercados > (mercado) > tarjetas Moneda, Dominio / idioma, Productos y precios | **CAPTURAR AL INICIO** | Colombia: solo la región Colombia, COP, sin subcarpeta. Catálogo = todos (por defecto, DOC) |
| A6 | Idiomas: cuáles están **Publicados**, cuál es predeterminado del dominio, idioma principal del Admin | Configuración > Idiomas | LEÍDO-03B; **re-capturar** | Español publicado y predeterminado del dominio; inglés en `/en`; principal del Admin = Inglés |
| A7 | Zona(s) y tarifas de envío actuales, sucursal "Envío desde" | Configuración > Envío y entrega > Perfil general | LEÍDO-03E; **re-capturar** (ver detalle en el runbook de envío) | Solo "Domestic – Estados Unidos" |
| A8 | Proveedores de pago: ¿hay alguno **activo**? (Shopify Payments, Balance, Capital o Credit **deben estar desactivados** para cambiar el país de la tienda, DOC) | Configuración > Pagos | Ninguno activo (MEDIDO-03E); confirmar | Sin proveedor activo |
| A9 | **Lista de proveedores alternativos que ofrece hoy el Admin** (con la dirección en EE. UU.), y si "Wompi" figura | Configuración > Pagos > proveedores alternativos ("Ver todos los demás proveedores" / "Elegir un proveedor": nombres en español NOT_VERIFIED) | **CAPTURAR AL INICIO** | NOT_AVAILABLE. Sirve de comparación para el § 9 |
| A10 | Impuestos: pantalla de Colombia y de EE. UU. | Configuración > Impuestos y aranceles (nombre NOT_VERIFIED) | **CAPTURAR AL INICIO** | "Colombia sin recaudación de impuestos" (03B). Efecto del cambio de dirección sobre impuestos: NOT_VERIFIED |
| A11 | Cantidad de pedidos (para saber si "los pedidos previos no cambian" tiene algo que proteger) | Pedidos | **CAPTURAR AL INICIO** | Se espera 0 (nunca se completó un pago); NOT_VERIFIED |

### 4.2 Datos del storefront (Claude, sin Admin)

Correr los scripts V1, V2, V4, V5 y V6 del § 8 **tal cual están hoy** y guardar el resultado como "ANTES":

| # | Medición | Valor esperado ANTES |
|---|---|---|
| B1 | Visitante nuevo (sin cookies, V2) | `country = US` |
| B2 | Sesión con país forzado CO (V3 + V4/V5) | 0/29 disponibles; `/cart/add.js` 422 |
| B3 | Sesión con país US | Productos disponibles; add-to-cart 200 (QA de 03C/03D corrió así) |
| B4 | Checkout desde el carrito con país US (V6) | Ruta termina en `/es-us`; "$199,920.00" |
| B5 | `link[rel=alternate][hreflang]` y `link[rel=canonical]` de `/` y `/en` (V8) | Guardar el valor actual |

---

## 5. Estado deseado (después de M1–M9)

| Elemento | Estado deseado |
|---|---|
| Dirección de la tienda | País **Colombia** (dirección real: D1, NOT_AVAILABLE) |
| Mercado principal | **Colombia** (una sola región: Colombia; moneda COP; sin subcarpeta) |
| Estados Unidos | Mercado en **Borrador** (conserva sus ajustes; no se elimina) |
| Región de respaldo | **Colombia** (queda dentro de un mercado activo, requisito DOC) |
| Visitante nuevo, cualquier país | `Shopify.country = CO`, COP, español; el de otro país ve la experiencia de Colombia pero **no puede comprar** (DOC: región de respaldo) |
| Checkout | Abre en `…/es-co`, país Colombia, departamentos de Colombia, formato "$ 199.920" (**NOT_VERIFIED** hasta medirlo) |
| Idioma predeterminado del Admin | **Sin cambios** (Inglés, diferido a la publicación) |
| Catálogo | 29 productos / 98 variantes intactos y disponibles para CO (con la zona del runbook de envío) |
| Wompi | Solo se **observa** si el Admin lo lista con la dirección en Colombia (§ 9). No se instala aquí |

---

## 6. Reversible vs. destructivo

| Acción | Tipo | Detalle (fuente) |
|---|---|---|
| Cambiar la dirección de la tienda | **Reversible** | Se vuelve a escribir la dirección capturada. La dirección es visible en la tienda y en páginas de políticas (DOC). No cambia la dirección de facturación (DOC) |
| Activar / poner en Borrador un mercado | **Reversible** | DOC: al desactivar, "saves all your settings, so you can reactivate it later". Los pedidos existentes no cambian |
| Convertir un mercado en principal | **Reversible** | Se repite la acción en el otro mercado (que debe estar Activo). DOC: no describe efectos sobre productos, precios, idiomas ni dominios → se verifica con el § 8 |
| Cambiar la región de respaldo | **Reversible** | DOC: debe apuntar a un país de un mercado **activo** |
| **Eliminar un mercado ("Delete Market")** | **DESTRUCTIVO — NO se usa** | DOC: "Deleting a market is permanent. Deleted markets can't be recovered". Efecto sobre catálogos y listas de precios: no documentado (NOT_VERIFIED) |
| **Cambiar el idioma predeterminado** (Configuración > Idiomas > "Cambiar idioma predeterminado") | **Destructivo — fuera de este runbook** | DOC: borra las traducciones existentes del idioma al que se cambia y quita el idioma anterior de la lista. 03B: además reescribe todos los themes, incluido Horizon. Queda para la publicación |
| Quitar regiones de un mercado | Reversible con trabajo | DOC: pasan a "Countries/regions you don't sell to". No se usa |
| Eliminar la zona "Domestic – Estados Unidos" | Destructivo (recreable) | Ver `shipping/03F-owner-shipping-runbook.md`. Se hace **al final** |

---

## 7. Pasos (ejecución por la dueña)

**Antes de empezar:** tener el snapshot M0 completo y la dirección D1 (NOT_AVAILABLE; la entrega la dueña). **Nombres de la UI:** "Mercados", "Configuración > General" y "Configuración > Idiomas" son los del menú en español. Los demás nombres en español son **NOT_VERIFIED** (la documentación oficial en español se sirve en inglés); se indica el nombre oficial en inglés entre paréntesis.

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback | ¿Reversible? |
|---|---|---|---|---|---|
| **M0** | Admin (solo lectura) | Capturar el snapshot del § 4 (A1–A11) y guardar las capturas | Snapshot completo. Se anota qué difiere de 03B | — | n/a |
| **M1** | Configuración > General > Detalles de contacto de la tienda (Store contact details) > Dirección | 1) Confirmar en Configuración > Pagos que **no** hay Shopify Payments/Balance/Capital/Credit activo (A8). 2) Cambiar **País/región** a Colombia y completar la dirección D1. 3) Guardar | Guardado sin error. La dirección nueva aparece en General. Facturación sin cambios (DOC). Efecto en impuestos: NOT_VERIFIED (comparar A10) | Volver a escribir la dirección capturada en A1 y Guardar | **Sí** |
| **M2** | Mercados | Abrir la lista y comparar con A4/A5. **DETENERSE y avisar** si: Colombia tiene subcarpeta o dominio propio, o tiene más de una región (DOC: no puede ser principal) | Colombia: una sola región, sin subcarpeta. Se anota el estado real (Activo/Borrador) y cualquier aviso de error de envío | — | n/a |
| **M3** | (Control G1) | Solo continuar si **Claude confirmó G1** (zona Colombia creada y, con EE. UU. aún principal, CO forzado da 29/29 disponibles y add-to-cart 200) | G1 en verde | — | n/a |
| **M4** | Mercados > Colombia | Si el estado es **Borrador**: cambiar a **Activo** > Guardar (DOC: solo se activa para países con tarifas). Si ya es Activo: no hacer nada | Colombia **Activo**, sin aviso de error de envío | Estado a **Borrador** > Guardar | **Sí** |
| **M5** | Mercados > Colombia > Más acciones (More actions) > **Convertir en mercado principal** (Make primary market; texto en español NOT_VERIFIED) | Elegir la opción, confirmar y **Guardar** | Colombia figura como **Principal**; Estados Unidos ya no. Moneda COP | Mercados > Estados Unidos (debe estar **Activo**) > Más acciones > Convertir en mercado principal > Guardar | **Sí** (efectos laterales no descritos en la DOC: § 11) |
| **M6** | Configuración > General > Región de respaldo (Backup region) | Confirmar que dice **Colombia**. Si no: elegir Colombia > Guardar. **Hacerlo antes de M7** (DOC: la región de respaldo debe estar en un mercado activo; si se desactiva el mercado que la contiene hay que reasignarla) | Región de respaldo = Colombia | Volver al valor de A3 | **Sí** |
| **M7** | Mercados > Estados Unidos | Cambiar el estado **Activo → Borrador** (Draft) > Guardar. **No** usar "Delete Market" / eliminar | EE. UU. en Borrador. Visitantes de EE. UU. y de países sin mercado → experiencia de la región de respaldo (Colombia); **no pueden completar compras** (DOC). Si EE. UU. tenía subcarpeta, esa URL deja de funcionar (DOC) | Estados Unidos > estado **Activo** > Guardar (DOC: el Borrador conserva los ajustes) | **Sí** |
| **M8** | Configuración > Pagos (solo lectura) | Abrir la lista de proveedores alternativos, buscar "Wompi" y capturar. **No instalar nada** | Se registra: Wompi aparece / no aparece / aparece con aviso. Ver § 9 | — | n/a |
| **M9** | Configuración > Idiomas (solo lectura) | Comprobar que Español sigue Publicado y predeterminado del dominio, e Inglés (`/en`) sigue publicado. **No cambiar nada** | Igual a A6. Si algo cambió (p. ej. `/en` dejó de existir): avisar antes de seguir | — | n/a |
| **M10** | (Claude) | Correr la verificación del § 8 y comparar con el snapshot | Tabla ANTES/DESPUÉS completa | — | n/a |

**Puntos de control reversibles:**

| Punto | Momento | Cómo volver |
|---|---|---|
| CP0 | Tras M0 | No hay nada que deshacer |
| CP1 | Tras M1 + S1–S6 (dirección, sucursal, zona) | Reescribir direcciones; la zona, según el runbook de envío |
| CP2 | Tras G1, con EE. UU. aún principal | Nada de cara al cliente cambió |
| CP3 | Tras M5 (Colombia principal, EE. UU. aún **Activo**) | Un solo paso: convertir EE. UU. en principal |
| CP4 | Tras M7 (EE. UU. en Borrador) | M7 al revés (Activo) y luego M5 al revés |
| CP5 | Zona EE. UU. eliminada (runbook de envío) | Único punto que exige recrear a mano. Se hace **al final**, con todo verificado |

---

## 8. Verificación posterior (la corre Claude)

**Cómo correr:** en la pestaña del storefront `https://radaelli-swimwear-dev.myshopify.com/` con la sesión de contraseña de la tienda ya desbloqueada, con la herramienta de JavaScript del navegador. **No se escribe nada en el checkout.** Al terminar: vaciar el carrito (V5, última línea) y dejar la sesión en CO.

### V1. Estado de la sesión actual

```js
({
  country: window.Shopify?.country,
  currency: window.Shopify?.currency?.active,
  locale: window.Shopify?.locale,
  htmlLang: document.documentElement.lang,
  url: location.href
})
```

### V2. Visitante nuevo (sin cookies) — la prueba central de C1

```js
const r = await fetch('/', { credentials: 'omit', cache: 'no-store', redirect: 'follow' });
const html = await r.text();
({
  status: r.status,
  finalUrl: r.url,
  country: (html.match(/Shopify\.country\s*=\s*"([A-Z]{2})"/) || [])[1] ?? null,
  currency: (html.match(/Shopify\.currency\s*=\s*\{[^}]*"active":"([A-Z]{3})"/) || [])[1] ?? null,
  locale: (html.match(/Shopify\.locale\s*=\s*"([^"]+)"/) || [])[1] ?? null,
  htmlLang: (html.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1] ?? null,
  paginaDeContrasena: /storefront_password|\/password/i.test(html)
})
```

- **Esperado DESPUÉS:** `country: "CO"`, `currency: "COP"`.
- Sin cookies, la tienda muestra la página de contraseña; se asume que su `<head>` también trae `Shopify.country` (**NOT_VERIFIED**). Si sale `null`: intentar borrar la cookie `localization` con `document.cookie = 'localization=; Max-Age=0; path=/'` y recargar (no funciona si es HttpOnly: NOT_VERIFIED); último recurso: la dueña abre una ventana de incógnito, desbloquea la tienda y escribe `Shopify.country` en la consola (F12).
- **Por qué importa:** la sesión de Claude quedó con país US guardado en 03E ("su selección se guarda para próximas visitas", DOC). Sin V2, `V1` seguiría mostrando US aunque C1 esté resuelto.

### V3. Forzar un país en la sesión (`/localization`)

```js
async function setCountry(cc) {
  const body = new URLSearchParams({
    form_type: 'localization', utf8: '✓', _method: 'put',
    country_code: cc, return_to: '/'
  });
  const r = await fetch('/localization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body, redirect: 'manual'
  });
  return { type: r.type, status: r.status };  // 'opaqueredirect'/0 es normal
}
await setCountry('CO');   // luego recargar y correr V1
```

Si no responde como esperado, repetir con solo `country_code` (así se midió en 03E). Nombres de campos: DOC `country_code`; el resto son los del formulario `localization` de Liquid.

### V4. Catálogo disponible (todo el catálogo)

```js
const list = (await fetch('/products.json?limit=250', { cache: 'no-store' }).then(r => r.json())).products;
const vars = list.flatMap(p => p.variants);
({
  productos: list.length,
  productosConAlgunaVarianteDisponible: list.filter(p => p.variants.some(v => v.available)).length,
  variantes: vars.length,
  variantesDisponibles: vars.filter(v => v.available).length
})
```

- **Esperado DESPUÉS (con la zona del runbook de envío):** 29 / 29 / 98 / 98.
- Si `/products.json` no responde bajo la contraseña (**NOT_VERIFIED**), usar `/products/<handle>.js` con los handles de `catalog/products-master.csv` (p. ej. `brisa-natural-beige`, `bikini-shadow-azul-marino`, `entero-golden-hour`).

### V5. Agregar al carrito, moneda y total

```js
const p = await fetch('/products/brisa-natural-beige.js').then(r => r.json());
const v = p.variants.find(x => x.title === 'S') ?? p.variants[0];
const r = await fetch('/cart/add.js', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items: [{ id: v.id, quantity: 1 }] })
});
const add = { status: r.status, mensaje: r.ok ? 'ok' : (await r.json()).description };
const cart = await fetch('/cart.js', { cache: 'no-store' }).then(r => r.json());
({ add, currency: cart.currency, total_price_crudo: cart.total_price, total_cop: cart.total_price / 100, items: cart.item_count })
// limpieza al terminar todas las pruebas:
// await fetch('/cart/clear.js', { method: 'POST' })
```

- **Esperado DESPUÉS:** `status: 200`, `currency: "COP"`, `total_cop: 199920` (la escala ×100 es la que usa el theme, 03B punto 10; confirmar con `total_price_crudo`).
- **Esperado ANTES con CO forzado:** `status: 422`, "ya está agotado".

### V6. Checkout abre en `es-co` (solo lectura)

Con el carrito de V5 y **sin escribir nada**:

```js
location.href = '/checkout';   // o el botón "Finalizar compra" del carrito
```

Ya en el checkout (página nueva), leer:

```js
({
  ruta: location.pathname,                       // esperado: termina en /es-co
  htmlLang: document.documentElement.lang,
  importes: document.body.innerText.match(/\$\s?[\d.,]+/g)?.slice(0, 6)
})
```

- **Esperado DESPUÉS:** ruta `/checkouts/cn/<token>/es-co`; importes tipo "$ 199.920" (punto de miles, sin decimales). **NOT_VERIFIED** hasta medirlo: Shopify no documenta este formato de ruta; sale de la medición de 03E (`es-us`).
- **Esperado ANTES:** `/es-us` y "$199,920.00".
- Copiar de la pantalla también: país por defecto, departamentos y el mensaje de pago ("Esta tienda no puede aceptar pagos en este momento": sigue igual hasta activar un proveedor).

### V7. URLs de idioma y dominio siguen vivas (riesgo H6)

```js
const rutas = ['/', '/en', '/products/brisa-natural-beige', '/en/products/brisa-natural-beige', '/collections/all'];
const out = [];
for (const u of rutas) {
  const r = await fetch(u, { cache: 'no-store', redirect: 'follow' });
  const h = await r.text();
  out.push({ u, status: r.status, finalUrl: r.url, lang: (h.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1] });
}
out
```

- **Esperado:** todas 200; `/` con `lang="es"`, `/en…` con `lang="en"`. Si `/en` da 404 o redirige al español: EE. UU. era el dueño de esa subcarpeta (DOC) → **revertir M7** y avisar.

### V8. hreflang y canonical (re-medición pedida por 03E)

```js
({
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => [l.hreflang, l.href])
})
```

Correr en `/` y `/en`. Comparar con B5. Puede cambiar el código de región (`seo/03E-seo-offline-review.md` § 4). Registrar, no juzgar.

### V9. Visitante de EE. UU. tras dejarlo en Borrador (registro, sin juicio)

```js
await setCountry('US');   // recargar y correr V1
// luego V5 (add-to-cart) y anotar status y mensaje
await setCountry('CO');   // dejar la sesión en CO
```

- El resultado de comprar como "US" con EE. UU. en Borrador **no está documentado** (DOC: los clientes de mercados inactivos "can't complete a purchase, and receive the backup region experience"). Se registra lo que ocurra.

### Tabla ANTES / DESPUÉS a completar

| Medición | ANTES (esperado) | DESPUÉS (esperado) | Real |
|---|---|---|---|
| V2 visitante nuevo | `US` | `CO` / `COP` / `es` | |
| V4 catálogo con CO forzado | 0/29 | 29/29 (98/98 variantes) | |
| V5 add-to-cart con CO | 422 | 200, `COP`, 199920 | |
| V6 checkout | `/es-us`, "$199,920.00" | `/es-co`, "$ 199.920" (NOT_VERIFIED) | |
| V7 `/` y `/en` | 200 es / 200 en | 200 es / 200 en | |
| V8 hreflang | (valor actual) | (puede cambiar) | |
| V9 país US | disponible | registrar | |

---

## 9. Efecto sobre la disponibilidad de Wompi

**Regla documentada:** "The third-party provider list in your Shopify admin is filtered based on your store's address in Settings > General." (DOC, configuring-providers; ya citada como E3 en `payments/03E-wompi-shopify-feasibility.md`).

| Pregunta | Respuesta |
|---|---|
| ¿Qué cambia la lista? | **La dirección de la tienda** (paso **M1**). Según la DOC, ni el mercado principal ni la moneda filtran la lista |
| ¿Basta cambiar la dirección para que aparezca Wompi? | **NOT_VERIFIED.** Wompi publica su integración para Shopify, pero que el Admin la liste **para esta tienda con dirección en Colombia** no está confirmado (E3, E6, E36 del documento de Wompi) |
| ¿Qué se hace en este runbook? | Solo **mirar** (M8) y capturar. **No** se instala nada (la instalación exige OAuth de la dueña y decisiones de ambientes de Wompi; ver `payments/03E-wompi-shopify-feasibility.md` § 6) |
| Precaución al cambiar el país | La DOC exige desactivar Shopify Payments/Balance/Capital/Credit antes de cambiar el país de la tienda. No hay ninguno activo (MEDIDO-03E), pero se confirma en M1 |

**Cómo se interpreta lo que se vea en M8:**

| Lo que se ve | Siguiente paso |
|---|---|
| "Wompi" **aparece** en la lista | Ruta A del documento de Wompi (§ 5–6 de `03E-wompi-shopify-feasibility.md`): decisión de la dueña sobre ambientes y credenciales; el modo de prueba y el sandbox se planifican aparte |
| **No aparece** | Pedir soporte a Wompi por escrito y/o evaluar la Ruta B (proveedor que el Admin sí liste, o método de pago manual). No repetir cambios de dirección "para forzarlo" |
| Aparece con **aviso de incompatibilidad** | Capturar el texto exacto. El sentido del aviso es NOT_VERIFIED (E6) |

**Nota:** el checkout de Colombia queda utilizable para pruebas de **envío** (runbook C2), pero **no puede pagarse** hasta activar un proveedor o la pasarela de prueba (03E, punto 43: pagos NO activados). Eso es un pendiente aparte.

---

## 10. Efecto sobre el idioma del checkout

**Lo que dice la DOC:**

- "The checkout displays in the same language that a customer uses to browse your online store."
- "Your default store language is used in your store's checkout and theme."
- Sin dominios internacionales, "your language settings are the same for all of your active markets".

**Lo que se sabe de la tienda:** el storefront ya está en español (`/` = `es`) y `/en` en inglés (LEÍDO-03B); el idioma principal del Admin sigue en **Inglés**; el checkout medido abrió en `es-us` (español con región EE. UU.).

| Pregunta | Respuesta |
|---|---|
| ¿Este runbook cambia el idioma? | **No.** No se toca "Cambiar idioma predeterminado" (destructivo y diferido a la publicación, 03B) |
| ¿Cambia el checkout al pasar Colombia a principal? | Se espera **solo la región**: `es-us` → `es-co` (país, departamentos, formato numérico). **NOT_VERIFIED** hasta medirlo (V6) |
| ¿Y si el checkout sale en inglés? | Sería una señal de que el idioma predeterminado del Admin (Inglés) pesa más de lo que se ve hoy. Capturar y no improvisar: cambiarlo es destructivo (§ 6) |
| ¿`/en` cambia? | El carrito hecho desde `/en` debería abrir el checkout en inglés (DOC: sigue el idioma de navegación). Comprobar una vez con V7 + V6 desde `/en` |
| Login de cuentas de clientas | Hoy en `es-US`, `region_country=US` por la entidad en EE. UU. (03B `:293`). Re-medir tras M1 |

---

## 11. Efecto sobre el catálogo Dev existente: ¿se pierde algo?

**Respuesta corta:** con Borrador (no Eliminar), **la DOC no describe ninguna pérdida**, y los datos del catálogo (productos, variantes, colecciones, metafields, imágenes) no pertenecen a un mercado. Aun así, lo que la DOC **no dice** se prueba con la verificación (V4/V5/V7).

| Qué | ¿Se pierde? | Evidencia |
|---|---|---|
| Productos, variantes, precios, compare-at, colecciones, metafields | **No se espera** | DOC (catalogs): "By default, all the products in your store are available in every market at your store's default prices." Un mercado decide **disponibilidad**, no borra datos. Se prueba con V4 (29/29, 98/98) y comparando precios antes/después |
| Disponibilidad por mercado | Depende del catálogo asignado al mercado | DOC: "Products must be included in a catalog assigned to a market for customers in that market to view and purchase them." **CAPTURAR** el catálogo del mercado Colombia (A5) |
| **Cambiar el mercado principal** | La DOC **no especifica** efectos sobre productos, precios, idiomas o dominios; solo dice que "All changes to your store's default settings apply to your primary market automatically" | **NOT_VERIFIED**; se cubre con el snapshot ANTES/DESPUÉS y el CP3 (un paso para volver) |
| **Estados Unidos en Borrador** | **No.** Conserva todos sus ajustes; los pedidos existentes no cambian. Sus clientes pasan a la experiencia de la región de respaldo y no pueden comprar | DOC (managing-markets) |
| Estados Unidos en **Eliminar** | **Sí, permanente** ("can't be recovered"). Efecto sobre catálogos y listas de precios: no documentado | DOC. **No se usa** |
| Países quitados de un mercado | Pasan a "Countries/regions you don't sell to" y reciben la región de respaldo | DOC. No se usa aquí |
| URLs por subcarpeta o dominio de un mercado en Borrador | Con **subcarpeta** dejan de funcionar; con dominio o subdominio redirigen al mercado principal | DOC. Riesgo H6: se comprueba `/en` (V7) |
| Pedidos existentes y carritos | Los pedidos no cambian (DOC). Los carritos abiertos (p. ej. la sesión de pruebas de Claude) se vacían al terminar | DOC; V5 (limpieza) |
| Moneda de precios | Sin cambio: la tienda ya está en COP. Las monedas locales exigen Shopify Payments o Adyen (DOC: local-currencies) y aquí no hay ninguno, así que los precios se muestran en COP base | DOC |
| SEO (hreflang, canonical) | Puede cambiar el código de región de los hreflang. No cambia el contenido | `seo/03E-seo-offline-review.md` § 4; V8 |

---

## 12. Rollback completo (si algo sale mal)

Deshacer **en orden inverso**, hasta el punto que haga falta:

1. **M7 al revés:** Mercados > Estados Unidos > estado **Activo** > Guardar. (Necesario antes de poder volver a elegirlo como principal.)
2. **M5 al revés:** Mercados > Estados Unidos > Más acciones > Convertir en mercado principal > Guardar.
3. **M6 al revés:** Región de respaldo = el valor de A3 (si estaba en Colombia, se queda en Colombia).
4. **M4 al revés:** Colombia > **Borrador**, solo si estaba en Borrador en A4.
5. **M1 al revés:** reescribir la dirección capturada en A1.
6. **Zona y sucursal:** según `shipping/03F-owner-shipping-runbook.md` (sección de rollback).
7. **Verificar:** correr V2 y V4. Debe volver a `US` y a los valores del ANTES. (Con la zona Colombia aún creada, CO también seguirá disponible: es lo deseado.)

**Lo que no se puede deshacer:** nada de lo hecho aquí, siempre que no se haya usado "Eliminar" ni "Cambiar idioma predeterminado".

---

## 13. Tiempo total estimado

| Bloque | Dueña | Claude |
|---|---|---|
| M0 snapshot (Admin visible) | 0–10 min (si Claude no ve el Admin, capturas de la dueña) | 5–10 min |
| M1 dirección de la tienda | 3 min | — |
| M2, M4, M5, M6, M7 (mercados y región de respaldo) | 8–10 min | — |
| M8, M9 (mirar pagos e idiomas) | 3–5 min | — |
| G1 (depende del runbook de envío) | — | 5 min |
| M10 verificación V1–V9 y tabla ANTES/DESPUÉS | — | 10–15 min |
| **Total (sin contar el runbook de envío)** | **~15–30 min** | **~20–30 min** |

---

## 14. Qué hace Claude inmediatamente después

1. Correr V1–V9 y completar la tabla ANTES/DESPUÉS (§ 8).
2. Si algo difiere de lo esperado, **no tocar nada**: describirlo a la dueña y proponer el rollback puntual (§ 12).
3. Registrar el resultado de M8 (¿aparece Wompi?) y M9 (idiomas) y abrir el punto de pagos con esa evidencia.
4. Re-medir hreflang/canonical y el login de cuentas; anotar los cambios para el informe SEO.
5. Redactar un reporte corto de verificación de C1 (nombre de archivo a definir en la fase; no lo crea este runbook).
6. Pasar al QA de envío (T1..Tn) y al cerrojo `free_shipping_rate_confirmed` del runbook de envío. **Ese cerrojo lo enciende Claude solo al final** y solo si C1 y C2 quedaron verificados.
7. Vaciar el carrito de pruebas y dejar la sesión con país CO.

---

## 15. NOT_VERIFIED de este runbook

| # | Tema | Cómo se resuelve |
|---|---|---|
| 1 | Nombres en español de: Detalles de contacto de la tienda, Región de respaldo, Más acciones, Convertir en mercado principal, Borrador, proveedores alternativos de pago, Impuestos y aranceles | Se ven al ejecutar; anotar los reales en el reporte |
| 2 | Estado real hoy de Colombia (Activo/Borrador), de la región de respaldo y de EE. UU. | M0 (CAPTURAR AL INICIO) |
| 3 | De qué mercado o dominio cuelga `/en` y si sobrevive a M5/M7 | M0 (A5) y V7 |
| 4 | Que el checkout abra en `es-co` con "$ 199.920" | V6 |
| 5 | Que un visitante nuevo caiga en el mercado principal por defecto (plan no Plus) | V2 |
| 6 | Que la página de contraseña exponga `Shopify.country` para V2, y que la cookie `localization` se pueda borrar por JavaScript | V2 y sus alternativas |
| 7 | Efecto de cambiar la dirección de la tienda sobre impuestos | Comparar A10 antes/después |
| 8 | Si el mercado principal puede ponerse en Borrador directamente (por eso se cambia el principal **antes** de M7) | No se prueba; el orden lo evita |
| 9 | Si Wompi figura en Configuración > Pagos con la dirección en Colombia | M8 |
| 10 | Efectos de cambiar el mercado principal sobre productos, precios, idiomas y dominios | § 11: snapshot y verificación |
| 11 | Qué ve y puede hacer un visitante de EE. UU. con su mercado en Borrador | V9 (solo registro) |
| 12 | `Shopify.country`, `Shopify.currency`, `Shopify.locale` como API estable (no están en shopify.dev) | Se usan por continuidad; `/cart.js` es la referencia documentada |
| 13 | Tipo exacto de la Dev Store y si pasa a producción | `payments/03E-wompi-shopify-feasibility.md` E35 (fuera de este runbook) |

---

## 16. Fuentes oficiales (leídas el 2026-09-29)

- Mercados, gestión, principal, Borrador y Eliminar: https://help.shopify.com/en/manual/markets/getting-started/managing-markets · https://help.shopify.com/en/manual/markets-new/manage
- Región de respaldo: https://help.shopify.com/en/manual/markets/backup-region
- Crear y activar mercados; requisitos (tarifas de envío, principal): https://help.shopify.com/en/manual/markets/getting-started/set-up-markets · https://help.shopify.com/en/manual/markets/getting-started/requirements-and-considerations
- Catálogos por mercado: https://help.shopify.com/en/manual/markets/customizations/catalogs
- Monedas locales: https://help.shopify.com/en/manual/markets/customizations/local-currencies
- Dominios e idiomas por mercado: https://help.shopify.com/en/manual/markets/customizations/domains-and-languages
- Idiomas, idioma predeterminado y checkout: https://help.shopify.com/en/manual/markets/languages/manage-languages · https://help.shopify.com/en/manual/international/localization-and-translation
- Dirección de la tienda, servicios financieros al cambiar el país: https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/setup-business-settings
- Zonas de envío y mercados: https://help.shopify.com/en/manual/international/shipping/shipping-zones
- Lista de proveedores de pago filtrada por dirección: https://help.shopify.com/en/manual/payments/third-party-providers/configuring-providers
- App Geolocation (cerrada, solo recomienda): https://help.shopify.com/en/manual/international/geolocation
- Selección automática por geolocalización (Plus) y campo `country_code`: https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages
- Objetos Liquid `localization` y `country`: https://shopify.dev/docs/api/liquid/objects/localization · https://shopify.dev/docs/api/liquid/objects/country
- Ajax cart (`currency` de `/cart.js`): https://shopify.dev/docs/api/ajax/reference/cart

**Documentos del proyecto citados:** `theme/03E-commercial-readiness-report.md`, `theme/03E-checkout-baseline-report.md`, `theme/03E-owner-actions-one-shot.md`, `theme/03B-store-foundation-report.md`, `shipping/03E-shipping-source-of-truth.md`, `payments/03E-wompi-shopify-feasibility.md`, `seo/03E-seo-offline-review.md`.
