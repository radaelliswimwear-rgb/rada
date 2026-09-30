# 03F — Runbook de la dueña: las 4 páginas legales pendientes (Privacidad, Términos, Envíos, Cookies)

- **Fecha:** 2026-09-29 (Bogotá).
- **Estado:** solo documento. **No se ejecutó nada**: no se tocó el Admin, ni `content/legal/`, ni el theme, ni los redirects.
- **Tienda:** Development Store `radaelli-swimwear-dev` (protegida con contraseña). Theme Radaelli `189072474431` sin publicar; Horizon live, sin tocar.
- **Base:** `theme/03D-legal-policies-inventory.md`, `content/legal/*.html` + `manifest.json`, `analytics/03E-analytics-plan.md`, `theme/03E-commercial-readiness-report.md`.
- **Qué NO hace este runbook:** no escribe ni reescribe texto legal, no da asesoría legal, no inventa razón social, NIT ni dirección.
- **Etiquetas del Admin:** se citan en inglés (verificadas en la ayuda de Shopify) y, entre paréntesis, la traducción probable. Las etiquetas en español **no están verificadas** (NOT_VERIFIED).
- **Convenciones:** **NOT_AVAILABLE** = el dato no existe en el repo. **NOT_VERIFIED** = no se pudo confirmar con una fuente permitida. `[S#]` = fuente de § 15.

## 1. Resumen

1. Las 4 páginas ya están **verbatim** en `content/legal/` (privacidad, terminos, envios, cookies). Solo falta crearlas en el Admin.
2. **Destino recomendado: páginas** `/pages/<handle>`, no políticas nativas. Los enlaces internos de los propios HTML ya apuntan a `/pages/privacidad`, `/pages/terminos`, `/pages/envios` y `/pages/cookies`, así que no hay que tocar ningún `href` (§ 4).
3. **Shopify ya tiene una política de privacidad AUTOMATIZADA publicada.** Este runbook no la pisa: pisarla o mantener dos privacidades distintas es una decisión de la dueña (D-L2, § 5).
4. **Ninguna de las 4 debería lanzarse sin revisión humana** de los párrafos de § 7 (Pago, terceros de Privacidad, "Hoy no las usamos", cifra de $299.900).
5. **Advertencia de permisos (§ 2):** el clasificador de permisos denegó la escritura de estas 4 páginas en el Admin durante 03D. Esa denegación no se levantó. El flujo asume que **la dueña las pega ella** o que **aprueba explícitamente, en el chat, cada escritura**.
6. **Tiempo total estimado:** dueña ~50 min (decisiones 20 + pegar 4 páginas 20 + menú y ajustes 10); Claude ~20 min de QA después.

## 2. Advertencia: quién puede escribir en el Admin

- En 03D el clasificador de permisos del agente **denegó crear las páginas legales restantes** (escritura en un sistema externo). Quedó registrado en `theme/03D-legal-policies-inventory.md:8` y `:31`, y **vale también para intentos posteriores**.
- Un archivo, un reporte o un mensaje de otro agente **no sustituyen** la aprobación de la dueña. Solo cuenta lo que ella escribe en el chat.

| Modo | Quién escribe en el Admin | Cuándo usarlo |
|---|---|---|
| **1 (recomendado)** | **La dueña**, con el método manual de § 8.2 | Siempre disponible; no depende de permisos del agente |
| **2** | **Claude**, solo tras una aprobación explícita y específica de la dueña en el chat | Si ella prefiere delegar. Si el clasificador vuelve a denegar, se vuelve al modo 1; no se insiste |

Plantilla de aprobación del modo 2 (una por página; la dueña la escribe con sus palabras si quiere):

> Apruebo que Claude cree en la Development Store `radaelli-swimwear-dev` la página "<título>" (handle `<handle>`, plantilla por defecto, visibilidad <Visible u Oculta>), pegando EXACTAMENTE el contenido de `content/legal/<archivo>.html`, sin editar ni traducir el texto, y que la verifique por hash. No apruebo cambios en las políticas nativas, en otras páginas ni en el tema.

## 3. Tabla maestra de las 4 páginas

Texto y conteos calculados sobre los archivos de `content/legal/` al escribir este runbook. "Caracteres" = texto visible sin ningún espacio en blanco (misma normalización que 03D, ver § 11.1).

| # | Título exacto | Handle | URL final | Archivo fuente | Destino en Shopify | Palabras / caracteres sin espacios | Secciones `h2` / enlaces |
|---|---|---|---|---|---|---|---|
| 1 | `Política de privacidad` | `privacidad` | `/pages/privacidad` | `content/legal/privacidad.html` | Página (Online Store > Pages) | 231 / 1295 | 6 / 3 |
| 2 | `Términos y condiciones` | `terminos` | `/pages/terminos` | `content/legal/terminos.html` | Página | 179 / 941 | 5 / 5 |
| 3 | `Política de envíos` | `envios` | `/pages/envios` | `content/legal/envios.html` | Página | 430 / 2345 | 10 / 3 |
| 4 | `Política de cookies` | `cookies` | `/pages/cookies` | `content/legal/cookies.html` | Página | 197 / 1073 | 6 / 2 |

- **Títulos:** salen de `content/legal/manifest.json` (el `h1` del sitio en vivo). El theme imprime `page.title` como `h1` (`theme-src/sections/main-page.liquid`), así que **los HTML no llevan `h1`** y no se debe agregar uno.
- **Handles:** son los que ya referencian los `href` internos de los 4 HTML (§ 10). Shopify **sugiere otro handle** a partir del título (por ejemplo uno largo tipo `politica-de-privacidad`): hay que cambiarlo siempre al de esta tabla.
- **Plantilla:** la por defecto (`page.json` → `main-page.liquid`). No usar `page.wishlist`.
- **Ya migradas (no se tocan):** Reembolso en `/policies/refund-policy` y Garantía en `/pages/garantia` (03D, verificadas por hash).

### 3.1 Descripción SEO (opcional, verbatim del sitio actual)

Shopify arma la meta description de una página sin descripción SEO pegando el contenido **sin espacios** ("CoberturaTodos…", medido en vivo en `/pages/garantia`; `seo/03E-seo-offline-review.md` § 2.3). Esa auditoría recomienda cargar la descripción SEO **con el texto que ya usa el sitio actual**, sin inventar. Se pega en Search engine listing preview > Description (paso B4). Fuente: el `metadata` de cada `page.tsx` del sitio (`app/<ruta>/page.tsx`, no `content/legal/`).

| Página | Descripción SEO actual (verbatim) | Fuente | Revisión |
|---|---|---|---|
| Privacidad | "Cómo Radaelli Swimwear recopila, usa y protege tus datos personales al comprar en la tienda." | `app/privacidad/page.tsx:7-8` | — |
| Términos | "Condiciones generales de compra en Radaelli Swimwear: identificación de la tienda, proceso de pago, y enlaces a nuestras políticas de envíos, devoluciones y garantía." | `app/terminos/page.tsx:7-8` | Dice "identificación de la tienda", pero la página **no** trae identidad (§ 6); y "proceso de pago" depende de G-PAY. Lo decide la dueña |
| Envíos | "Envío gratuito a nivel nacional en compras desde cierto monto — para el resto, el valor se informa antes del despacho según el destino." | `app/envios/page.tsx:9-10` | Sigue G-ENV |
| Cookies | "Qué cookies usa Radaelli Swimwear, para qué sirven y cómo podés gestionar tus preferencias." | `app/cookies/page.tsx:8-9` | "gestionar tus preferencias" sigue G-COOK |

- **Es opcional y va con OK de la dueña.** Si no se carga, la descripción autogenerada saldrá con las palabras pegadas (no es un bug del theme).
- **No se escribe ningún texto nuevo.** Los títulos SEO se dejan vacíos: Shopify usa el título de la página.
- **Alternativa ya propuesta en `seo/03F-seo-final-validation.md`:** cargar la **primera oración** de cada página. Son dos criterios distintos (descripción actual del sitio, o primera oración del texto). Elige la dueña; ambos son verbatim.

### 3.2 Puertas (gates) antes de lanzar

Una puerta cerrada **no impide copiar la página a la Dev Store** (protegida con contraseña, no es público). Sí impide: (a) agregar la página al menú "Ayuda", y (b) publicar el theme o mover el DNS con esa página sin revisar.

| Página | Puerta | Se abre cuando | Origen |
|---|---|---|---|
| Términos | **G-PAY** | La dueña revisó el párrafo "Pago" contra el proveedor de pago final | `payments/03E-wompi-shopify-feasibility.md` |
| Envíos | **G-ENV** | Existe la tarifa gratis desde $299.900 en la zona Colombia, `free_shipping_rate_confirmed` está en ON y se probó la regla `>=` con cupón | `theme/03D-free-shipping-audit.md`, `theme/03E-checkout-baseline-report.md` (C2) |
| Cookies | **G-COOK** | La analítica final está decidida, el banner incluye Colombia y la dueña revisó "Hoy no las usamos" | `analytics/03E-analytics-plan.md` § 6.4, `analytics/03F-analytics-owner-runbook.md` |
| Privacidad | **G-PRIV** | La dueña decidió D-L2 y revisó los terceros nombrados | § 5 y § 7 |

## 4. Destino: por qué páginas y no políticas nativas

### 4.1 Lo que ya migramos (precedente)

| Contenido | Destino | Motivo |
|---|---|---|
| Devoluciones | **Política nativa** `/policies/refund-policy` | Shopify tiene tipo nativo de reembolso y lo enlaza solo en el checkout (página de revisión del pedido) [S1]. El título nativo ("Política de reembolso") no es editable |
| Garantía | **Página** `/pages/garantia` | No existe tipo de política de garantía en la lista de Shopify [S1] |
| Privacidad | **Ya existe la nativa, AUTOMATIZADA y publicada** (no se tocó) | Shopify la genera y la actualiza sola cuando cambian ciertos ajustes [S1] |

### 4.2 Recomendación para las 4 pendientes: páginas `/pages/*`

- **Los HTML ya están remapeados a `/pages/*`.** Con páginas no hay que cambiar ni un `href` (03D los remapeó como único cambio permitido).
- **Cookies no tiene tipo nativo:** los tipos de política documentados son reembolso, privacidad, términos, envío, aviso legal y suscripción [S1]. Cookies **tiene que ser página**.
- **Indexación:** `robots.txt` de Shopify bloquea `/policies/` por defecto (regla documentada en shopify.dev, citada en `seo/03E-redirect-plan.md` § 5.5, no re-leída hoy). Las 6 URL legales están en el sitemap actual. Las páginas `/pages/*` no llevan ese bloqueo.
- **Coherencia con Garantía:** las 6 quedan del mismo lado.

### 4.3 Qué se pierde al no usar la política nativa (decisión de la dueña)

| Efecto | Detalle |
|---|---|
| Enlaces automáticos del checkout | Shopify enlaza en el pie del checkout **las políticas nativas guardadas**; el enlace del reembolso va también en la página de revisión y el de envío en fichas y carrito [S1]. Una **página** no se enlaza sola. Con páginas, el pie del checkout mostrará solo Reembolso y la Privacidad nativa |
| Enlace de envíos en la ficha | El theme usa `shop.shipping_policy.url` y, si no existe, el setting `shipping_url` del bloque (`sections/main-product.liquid:300`). En `theme-src/templates/product.json` `shipping_url` y `warranty_url` están vacíos, así que **con páginas hay que cargarlos** (§ 9, fase C) |
| Casilla de aceptación | El checkout actual exige aceptar Términos y Envíos (`03D-legal-policies-inventory.md` § 4). Equivalente nativo en Shopify: **NOT_VERIFIED** |

### 4.4 Alternativa B (solo Términos y Envíos): política nativa

Solo si la dueña quiere los enlaces automáticos de arriba.

- Términos → `/policies/terms-of-service`. Envíos → `/policies/shipping-policy` [S1].
- **Cambia el HTML solo en `href`:** `terminos.html` enlaza `/pages/envios` (2 veces) y `privacidad.html` enlaza `/pages/terminos`. Ese cambio se haría como en 03D (remapeo de enlaces, texto intacto), **con OK de la dueña** y regenerando el manifiesto.
- **Pierde** la indexación por defecto (`/policies/` bloqueado) y el hash de § 11 pasa a comprobarse sobre el contenedor que use el theme para políticas (selector **NOT_VERIFIED**).
- **Privacidad nunca se pega en la nativa sin D-L2.**

## 5. Decisiones que necesita la dueña antes de pegar

| ID | Decisión | Opciones | Recomendación / nota |
|---|---|---|---|
| **D-L1** | Destino de Términos y Envíos | (A) páginas `/pages/*` · (B) política nativa (§ 4.4) | A, por lo de § 4.2. Es de la dueña |
| **D-L2** | Privacidad: qué hacer con la política automatizada publicada | (a) **adoptarla como oficial**: no se crea `/pages/privacidad` y se corrige el enlace de `cookies.html` (cambia un `href`) · (b) **pegar el texto verbatim en la nativa**, reemplazando la automatizada (irreversible sin copia) · (c) **mantener ambas**: página `/pages/privacidad` + automatizada en el checkout | Es una decisión legal de la dueña o de su asesor. Con (c) el sitio muestra **dos textos de privacidad distintos**: revisar coherencia. Si elige (a) o (b), avisar antes: cambia § 10 y el redirect `/privacidad` (`seo/03E-redirect-plan.md` § 4.3) |
| **D-L3** | Visibilidad en la Dev Store | Visible (permite QA) · Oculta hasta abrir su puerta | Ver nota de abajo |
| **D-L4** | Proveedor de pago final (abre G-PAY) | Wompi (redirección o "Wompi Tarjetas") u otro | `payments/03E-wompi-shopify-feasibility.md` |
| **D-L5** | Tarifa bajo el umbral (D2) y monto vigente (abre G-ENV) | fija en Shopify · coordinada a mano como hoy | `theme/03D-free-shipping-audit.md`, `shipping/03E-shipping-source-of-truth.md` |
| **D-L6** | Analítica final y banner de cookies (abre G-COOK) | ver `analytics/03F-analytics-owner-runbook.md` | — |
| **D-L7** | Identidad del negocio y fecha de vigencia | entregar datos o dejar en blanco | § 6 |

- **Nota de D-L3 (visibilidad):** la ayuda de Shopify solo dice que una página puede quedar "Hidden" (Oculta) o "Visible" [S2]; **no dice qué ve un visitante en la URL de una oculta**. Reportes de la comunidad (no oficiales) indican que la URL directa da 404 [S9]. Por eso el QA de § 11 exige **Visible**. La Dev Store tiene contraseña: "Visible" no la expone al público.
- **Si el texto cambia:** si la dueña o su asesor entregan un texto distinto al de `content/legal/`, eso es una nueva versión: se guarda como archivo aparte, con su propio hash, y el QA se hace contra **ese** archivo. Este runbook no cubre esa redacción.

## 6. Identidad del negocio: campos que quedan EN BLANCO

Los 4 HTML **no contienen** razón social, NIT, dirección, correo ni teléfono (`03D-legal-policies-inventory.md` § 1.3). En "Privacidad" y "Términos" solo remiten al ancla `/#contacto`. No hay nada que rellenar dentro de los archivos, y **no se les agrega ningún párrafo ni pie de identidad**.

| Dato | Estado | Dónde iría (solo si la dueña lo entrega) | Regla |
|---|---|---|---|
| Razón social | **NOT_AVAILABLE** | Configuración > Políticas: sección de aviso legal (*Legal notice*) [S1] | En blanco hasta que la dueña lo entregue |
| NIT | **NOT_AVAILABLE** | ídem | En blanco |
| Dirección física / domicilio | **NOT_AVAILABLE** | ídem, y Configuración > General (dirección de la tienda, que además exige C1) | En blanco |
| Correo público de contacto | **NOT_AVAILABLE** (hay 2 correos administrativos internos, **no publicados**) | Sección de información de contacto de las políticas [S1][S8] | No usar los internos |
| Teléfono público | Solo hay un enlace a WhatsApp (en Devoluciones y Garantía, no en las 4 pendientes) | ídem | No copiar números a otros textos |
| Fecha de vigencia | **NOT_AVAILABLE**. La línea "Última actualización" se quitó de los HTML porque era la fecha del render, no una fecha real | La agrega la dueña si la quiere | No se inventa fecha |

- **Shopify pide contacto público:** un resultado de búsqueda sobre la ayuda de Shopify indica que, según sus términos, la tienda debe mostrar contacto público con correo y teléfono [S1] (extracto de búsqueda, no confirmado en la página: **NOT_VERIFIED**). Es un requisito de plataforma, no una opinión legal de este documento.
- **Quién decide qué datos legales corresponden:** la dueña o su asesor. Claude no los infiere de otros documentos.
- **Etiquetas en español** de "Información de contacto" y "Aviso legal": NOT_VERIFIED.

## 7. Párrafos que requieren revisión humana (NO se reescriben)

Se ubican con las primeras palabras del texto. Cada revisión es de la dueña o su asesor; Claude no cambia una sola palabra.

### 7.1 Términos y condiciones (G-PAY)

| Sección / cómo ubicarla | Por qué se revisa | Depende de |
|---|---|---|
| **"Pago"**: "Los pagos con tarjeta, PSE, Nequi o Bancolombia se procesan a través de la pasarela segura de Wompi…" | Nombra Wompi, cuatro medios de pago y afirma que los datos de tarjeta se ingresan en la página de la pasarela. Eso solo vale para la variante de **redirección**; la app "Wompi Tarjetas" va **embebida** en el checkout | Proveedor final y medios activados (D-L4) |
| Misma sección: "También podés coordinar tu compra directamente por WhatsApp" | Describe un canal de venta manual que hoy existe en el sitio actual | Que la dueña siga ofreciéndolo |
| "Quiénes somos" | No trae identidad legal (§ 6) | D-L7 |
| "Envíos, cambios y garantía" | Enlaza a Envíos, Reembolso y Garantía | Que existan las 3 páginas |

### 7.2 Política de privacidad (G-PRIV)

| Sección / cómo ubicarla | Por qué se revisa | Depende de |
|---|---|---|
| **"Con quién compartimos datos"**: "…Wompi, para procesar los pagos; Resend…; y Cloudinary…" | Nombra solo proveedores del stack Next.js. Tras migrar, la tienda la opera Shopify; las notificaciones son de Shopify (no de Resend) salvo que se conserve; las imágenes salen del CDN de Shopify | Stack final (D-L4) |
| Misma sección: "No vendemos ni compartimos tus datos con terceros para fines publicitarios" | Si se activa Meta en nivel Mejorado o Máximo, Shopify indica que se comparten nombre, ubicación, correo y teléfono con Meta [S10] | Analítica final (D-L6) |
| **"Qué datos recopilamos…"**: "Si creás una cuenta en la tienda, también guardamos los datos de esa cuenta y tu sesión" | Describe las cuentas propias del sitio actual; en Shopify son New Customer Accounts (`03B-store-foundation-report.md`) | Modelo de cuentas |
| Misma sección: "Sobre el pago, consultá nuestros Términos y condiciones" | Remite a "Pago", que también se revisa | G-PAY |
| **"Cookies"** | Remite a la Política de cookies | G-COOK |
| **"Tus derechos"**: "…escribinos por los canales de contacto de la tienda" | Presupone canales públicos; la identidad es NOT_AVAILABLE | D-L7 |
| Observación (03D § 7) | Los textos no mencionan newsletter; el checkout de Shopify ofrece "Enviarme novedades y ofertas" (`03E-checkout-baseline-report.md`) | Decisión de la dueña |

### 7.3 Política de envíos (G-ENV)

| Sección / cómo ubicarla | Por qué se revisa | Depende de |
|---|---|---|
| **La cifra `$ 299.900` aparece 3 veces:** primer párrafo de "Envíos nacionales", el título "Coordinación del envío en compras inferiores a $ 299.900" y la viñeta "El beneficio de envío gratuito aplica automáticamente cuando el subtotal…" | Es un monto fijo en un texto; no se actualiza solo. Si cambia la tarifa, el texto queda desactualizado | Tarifa confirmada en Shopify (D-L5) |
| **"Coordinación del envío en compras inferiores…"**: "nuestro equipo te contacta después de confirmada la compra…" | Describe cobro manual y pago a la transportadora. Si se crea una tarifa fija en Shopify, esta sección describe **otro** flujo | D-L5 |
| Viñeta: "…subtotal de tu pedido (ya con el cupón aplicado, si usaste uno)…" | Hay que probar en un checkout que la regla `>=` se calcula sobre el subtotal ya con cupón (`03D-free-shipping-audit.md`: pendiente 2 y decisión D3) | Prueba de checkout |
| "Transportadora y tiempos de entrega": Envia, estándar 3–5 días, express 24–48 h | El express solo existe si se crea como tarifa | D-L5 |

### 7.4 Política de cookies (G-COOK)

| Sección / cómo ubicarla | Por qué se revisa | Depende de |
|---|---|---|
| **"Cookies analíticas"** y **"Cookies de marketing y publicidad"**: "Hoy no las usamos" (2 veces) | Encender GA4 o Meta la vuelve falsa. **Además**, la política de cookies de Shopify para tiendas lista cookies **de analítica** (`_shopify_analytics`, `_landing_page`, `_orig_referrer`, `shop_analytics`, `_shopify_y`, `_shopify_s`) y **de marketing** (`_shopify_marketing`) [S7]. Si la tienda las emite, la frase requiere revisión **aunque GA4 y Meta sigan apagados**. Qué emite esta tienda y con qué consentimiento: **NOT_VERIFIED** (verificar en DevTools > Application > Cookies) | Analítica final y verificación en vivo |
| **"Cómo cambiar tus preferencias"**: "Podés cambiar tus preferencias de cookies analíticas y de marketing cuando quieras" | El botón que lo hacía posible se quitó en 03D (dependía de `lib/consent`). En Shopify el acceso a preferencias existe **cuando el banner está activo** en la región [S6]. Con el banner solo en UK y EEE (por defecto), en Colombia no hay control | Banner con Colombia (`analytics/03F-analytics-owner-runbook.md`) |
| "Cookies esenciales": carrito, sesión, seguridad del pago | Coincide en general con las cookies necesarias de Shopify [S7]; la dueña confirma | — |
| "Más información" | Enlaza a `/pages/privacidad` | D-L2 |

### 7.5 Observaciones comunes (no se cambian)

- **Voseo y tuteo mezclados** ("creás/consultá/podés" frente a "¿Tienes dudas?"): pasa tal cual. Es una decisión de marca abierta (`03E-owner-actions-one-shot.md`, punto 10).
- **Espacios no separables:** `envios.html` trae 3 espacios no separables en "$ 299.900". El editor puede convertirlos en `&nbsp;` o en espacios normales; la comparación de § 11 los ignora.

## 8. Cómo pegar el HTML verbatim

### 8.1 Reglas

1. Se pega **el contenido completo del archivo**, sin cambios, sin `h1` y sin envolverlo en otra etiqueta.
2. Siempre en la **vista HTML** del editor, nunca en la vista visual. En la ayuda de Shopify el botón se llama **"Edit code"** (ícono `<>`) [S2]; en algunos editores se ve como "Show HTML" (etiqueta en español: NOT_VERIFIED).
3. **NO usar "Insert template" ("Insertar plantilla").** Genera el texto genérico de Shopify, en inglés, para tiendas con checkout en inglés [S1]: no es el texto de Radaelli.
4. **NO usar "Use automated policy"** ni tocar la política de privacidad nativa sin D-L2 [S1].
5. **No escribir carácter por carácter** en el editor de código: puede autocompletar o reindentar. Se pega de una sola vez.

### 8.2 Método manual (la dueña; modo 1)

1. Abrir `shopify-migration/content/legal/<archivo>.html` en un editor de texto simple. Ctrl+A, Ctrl+C.
2. En el Admin, abrir la página en el editor y pulsar **`<>` ("Edit code")** [S2].
3. Hacer clic dentro del área de código, Ctrl+A y Ctrl+V.
4. Volver a la vista visual solo para mirar. **No editar ahí.**
5. Guardar.
- **Señal de error:** si en la página se ven las etiquetas como texto (`<h2>` a la vista), se pegó en la vista visual. Vaciar el contenido y repetir en `<>`.
- **Nota:** el editor puede reordenar espacios o agregar atributos. El QA compara el **texto**, no el marcado.

### 8.3 Método de Claude (solo modo 2, con aprobación)

- **Registro de 03D:** el contenido se cargó despachando un **evento `paste`** sobre el editor **CodeMirror** de la vista HTML, no tecleando. Es el mismo criterio que § 8.1.5.
- **El script exacto de 03D no quedó en el repo (NOT_AVAILABLE):** se vuelve a armar en el momento; no se lee de ningún archivo.
- **Verificación antes de guardar:** comparar el texto del editor contra el archivo fuente (§ 11.1) y recién entonces pulsar Guardar.
- **Límite:** si el permiso vuelve a ser denegado, Claude se detiene y la dueña usa § 8.2.

## 9. Pasos

Tabla de pasos: Paso | Dónde | Acción exacta | Resultado esperado | Rollback.

### Fase A. Aprobación y línea base (5 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| A1 | Chat | La dueña responde D-L1 a D-L7 y elige modo 1 o modo 2 (con la plantilla de § 2 si es el 2) | Decisiones escritas | — |
| A2 | Admin > Settings > Policies (Configuración > Políticas) | **Solo lectura.** Abrir "Privacy policy" y anotar si figura como automatizada. Guardar una captura | Línea base de la privacidad nativa | — |
| A3 | Storefront `/policies/privacy-policy` | Calcular el hash de texto sin espacios de la política automatizada actual (§ 11.1) y anotarlo | Hash base para probar que **no** se pisó | — |
| A4 | `/policies/refund-policy` y `/pages/garantia` | Confirmar los hashes de 03D: Reembolso 1618 caracteres, `c9c65d02…`; Garantía 889, `b44d879a…` | Sin regresión | — |
| A5 | Admin > Content > Menus (**Contenido > Menús**, etiqueta en español verificada en `seo/03F-redirect-import-result.md`) > `ayuda` | **Solo lectura.** Confirmar que hoy tiene 2 ítems: Devoluciones y Garantía | Línea base del menú | — |

### Fase B. Crear cada página (repetir 4 veces, ~5 min cada una)

Parámetros de cada vuelta: título, handle y archivo de § 3. Crear **las 4** en la misma sesión para que los enlaces cruzados no den 404 durante el QA.

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| B1 | Admin > Online Store > Pages > **Add page** (Contenido > Páginas) [S2] | Pulsar Add page | Editor de página vacío | Cancelar sin guardar |
| B2 | Campo Title | Escribir el **título exacto** de § 3. Nada más | Título igual al de la tabla | Borrar el texto |
| B3 | Editor > `<>` ("Edit code") | Pegar el contenido de `content/legal/<archivo>.html` según § 8 | Contenido visible con títulos `h2` y enlaces | Vaciar el editor |
| B4 | Search engine listing preview > lápiz > **URL handle** [S2] | Poner el handle de § 3 (por ejemplo `terminos`). Sin espacios. Título SEO: dejarlo vacío. Descripción: vacía, o **la verbatim de § 3.1 si la dueña la aprueba**. No se escribe ningún texto nuevo | Handle igual al de la tabla | Editar el handle. Si aparece la casilla "Create a URL redirect" y el handle anterior nunca se usó, **desmarcarla** |
| B5 | Panel derecho > Theme template | Dejar "Default page" | `page.json` | Volver a "Default page" |
| B6 | Panel derecho > Visibility [S2] | Según D-L3: **Visible** (recomendado para QA) u Oculta | Estado igual a la decisión | Cambiar a Hidden |
| B7 | Botón **Save** | Guardar | Página creada; aparece en la lista | Ver rollback global (§ 12) |
| B8 | `<>` otra vez | Comprobar que el HTML guardado empieza con `<h2>` y no muestra etiquetas como texto | Texto correcto | Repetir B3 |

### Fase C. Enlaces del theme a las páginas (5 min; solo si D-L1 = páginas)

Son **ajustes del theme editor**, no código. Requieren OK explícito de la dueña si los hace Claude.

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| C1 | Online Store > Themes > Radaelli (no publicado) > Customize > plantilla **Product** > bloque de envíos | Cargar `shipping_url` = `/pages/envios` y `warranty_url` = `/pages/garantia` (03D pedía cargar la de garantía; en `theme-src/templates/product.json` ambos están vacíos; el estado del theme remoto: NOT_VERIFIED) | En la ficha aparecen "Política de envíos" y "Garantía" | Dejar los campos vacíos |
| C2 | Customize > Home > sección **Promo banner** | Cargar `shipping_policy_url` = `/pages/envios`. **Solo si `free_shipping_rate_confirmed` está en ON** (G-ENV); si no, el banner no promete envío | Enlace "Ver política de envíos" | Vaciar el campo |
| C3 | Constancia | Al guardar, el theme remoto deja de ser idéntico al ZIP RC1.5 (`templates/*.json`). Anotarlo en el reporte | Diferencia registrada, no perdida | — |

### Fase D. Menú "Ayuda" (5 min; solo con la página creada y su puerta abierta)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| D1 | Content > Menus > `ayuda` [S3] | **Add menu item**. Nombre: "Envíos". En el campo de enlace, **elegir "Pages" y la página de la lista** (no pegar la URL; evita 404) | Ítem agregado | Eliminar el ítem |
| D2 | Mismo menú | Repetir con "Términos y condiciones", "Privacidad" y "Cookies" | 4 ítems nuevos | Eliminarlos |
| D3 | Mismo menú | Arrastrar con el asa (⠿) hasta el orden del sitio real: **Envíos, Devoluciones, Garantía, Términos y condiciones, Privacidad, Cookies** (`theme/footer-report.md`) [S3] | 6 ítems ordenados | Reordenar |
| D4 | Botón **Save** | Guardar | El bloque "Ayuda" del footer muestra 6 enlaces | Volver a los 2 originales |
| D5 | Regla | **Agregar solo los ítems cuya página existe y cuya puerta (§ 3.2) está abierta.** No se toca el theme: el bloque "Ayuda" ya lee el menú `ayuda` (`footer-group.json`) | — | — |

### Fase E. Redirects (cuando existan las páginas)

**Contexto:** las 47 redirecciones del CSV **ya se importaron en la Dev Store** (`seo/03F-redirect-import-result.md`, ruta en español verificada allí: Contenido > Menús > Redireccionamientos de URL > Importar). Las 4 legales quedaron "pending" hasta que existan sus páginas. **No se reimportan las 47**: qué hace Shopify al importar filas ya existentes es NOT_VERIFIED.

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| E1 | `seo/shopify-redirects-import.csv` (Claude, con OK) | Agregar 4 filas: `/envios,/pages/envios` · `/terminos,/pages/terminos` · `/privacidad,/pages/privacidad` · `/cookies,/pages/cookies`. Seguir los 4 pasos de `seo/03E-redirect-plan.md` § 4.3 y correr `seo/validate-redirects.mjs` | Validador PASS (para el cutover en la tienda de lanzamiento) | Quitar las filas |
| E2 | Contenido > Menús > Redireccionamientos de URL > Importar (Claude con ventana visible, o la dueña) | Importar **solo las 4 filas nuevas**, en un archivo aparte con el encabezado exacto `Redirect from,Redirect to`. Luego probar cada una con `fetch` como en `03F-redirect-import-result.md` | Las 4 URL viejas responden 200 en su página nueva | Borrar esas 4 redirecciones |
| E3 | Si D-L2 ≠ página | Cambiar el destino de `/privacidad` a `/policies/privacy-policy` | — | — |

## 10. Enlaces internos

Los 4 archivos **ya traen los `href` de Shopify**. No hay nada que remapear si D-L1 = páginas.

| Archivo | `href` en el HTML | Estado hoy | Existe cuando |
|---|---|---|---|
| `privacidad.html` | `/pages/terminos` · `/pages/cookies` · `/#contacto` | Los dos primeros dan 404 hoy | Se crean Términos y Cookies |
| `terminos.html` | `/pages/envios` (×2) · `/policies/refund-policy` · `/pages/garantia` · `/#contacto` | `/pages/envios` da 404 hoy. Reembolso y Garantía ya existen | Se crea Envíos |
| `envios.html` | `/policies/refund-policy` · `/pages/garantia` · `/#contacto` | Los 3 responden | Ya existen |
| `cookies.html` | `/pages/privacidad` · `/#contacto` | `/pages/privacidad` da 404 hoy | Se crea Privacidad (o cambia por D-L2) |

- **Ancla `/#contacto`:** funciona (`id="contacto"` en el footer desde RC1.4).
- **Texto del enlace vs. título:** "Política de devoluciones" apunta a una página que Shopify titula "Política de reembolso" (título nativo no editable). No se cambia.
- **Si D-L1 = B (nativas):** ver § 4.4 para los `href` que cambian.
- **Otros lugares que hoy no apuntan a estas páginas:** plantillas de notificaciones de Shopify, `promo-banner` y ficha (§ 9, fase C).

## 11. QA después de publicar en la Dev Store

Lo hace **Claude**, con ventana visible. La dueña inicia sesión en la tienda si pide contraseña; Claude no escribe contraseñas.

### 11.1 Hash de texto sin espacios contra el archivo fuente (como en 03D)

**Regla:** se compara el SHA-256 del texto visible del contenido de la página, con **todo** el espacio en blanco eliminado, contra el mismo cálculo sobre el archivo fuente.

Hashes esperados (calculados al escribir este runbook):

| Página | Caracteres | SHA-256 del texto sin espacios |
|---|---|---|
| Privacidad | 1295 | `9be571053477c7190c29d9f8e550d97f55ca972e3db15f19c0b0d0a60da2fb28` |
| Términos | 941 | `0979093c454bf9adce1e1367fc721d24d3e7650581a6d6ade28a603509f0cdf9` |
| Envíos | 2345 | `5395eba78f064b4cab7d599529f921980d6c69d7cc2b2227f9a0ad72477f4f45` |
| Cookies | 1073 | `e10bdc2728998d097ebf3a0b915d5f8378e89eef7f3244c7c2f86b8632e00c4c` |

**Método reproducible.** La normalización es la de `scripts/extract-legal-verbatim.cjs` (función `text()`) más quitar todo espacio. Reprodujo los hashes de 03D de Devoluciones (1618, `c9c65d02…`) y Garantía (889, `b44d879a…`), comprobado al escribir este runbook.

Archivo fuente (Node):

```js
const fs = require("fs"), crypto = require("crypto");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, " ");
const t = decode(fs.readFileSync("content/legal/terminos.html", "utf8").replace(/<[^>]+>/g, " ")).replace(/\s+/g, "");
console.log(t.length, crypto.createHash("sha256").update(t, "utf8").digest("hex"));
```

Storefront (consola del navegador, en la página; se usa `textContent`, **no** `innerText`, porque `innerText` aplica mayúsculas de CSS):

```js
const t = document.querySelector(".main-page__content").textContent.replace(/\s+/g, "");
const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
console.log(t.length, [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join(""));
```

- **Pasa** si longitud y hash coinciden. **Falla** si difieren: se muestra la primera posición distinta y no se sigue hasta corregir.
- El espacio no separable de `envios.html` no rompe la comparación: `\s` lo incluye en JavaScript.
- Chequeo barato adicional: cantidad de `h2` y de enlaces (§ 3).

### 11.2 Lista de chequeos

| # | Chequeo | Cómo | Esperado |
|---|---|---|---|
| Q1 | Hash de las 4 páginas | § 11.1 | Coincide |
| Q2 | Título | `document.querySelector("h1").textContent` | Igual al título exacto de § 3 |
| Q3 | Handle y URL | `location.pathname` | `/pages/<handle>` (sin redirección) |
| Q4 | Canonical | `document.querySelector('link[rel=canonical]').href` | `origin + /pages/<handle>` (auditoría 03E: las páginas tienen canonical propio) |
| Q5 | Robots | `document.querySelector('meta[name=robots]')` y `/robots.txt` | Sin `noindex` en estas páginas (RC1.5 solo lo pone en búsqueda, favoritos y 404). `robots.txt` no bloquea `/pages/`. Con la Dev Store protegida, la indexación real se evalúa al publicar |
| Q6 | Enlaces del contenido | Recorrer cada `<a>` de la página y pedirlo con la misma sesión | Cada uno responde 200 y coincide con `manifest.json` |
| Q7 | Ancla `/#contacto` | Abrirla | Baja al footer |
| Q8 | Footer "Ayuda" | Abrir cualquier página del storefront | Muestra los ítems agregados y cada enlace responde 200 |
| Q9 | Sin regresión de lo migrado | Hash de Reembolso y de Garantía | `c9c65d02…` y `b44d879a…` |
| Q10 | **Política automatizada intacta** | Hash de `/policies/privacy-policy` contra A3 | Igual que antes de empezar |
| Q11 | Enlaces de ficha y banner (si hubo fase C) | Abrir una ficha | "Política de envíos" y "Garantía" apuntan a `/pages/envios` y `/pages/garantia` |
| Q12 | Sin errores de consola propios | Consola | 0 errores del theme |
| Q13 | Meta description | `document.querySelector('meta[name=description]').content` | Si se cargó la de § 3.1, es idéntica. Si no, saldrá con las palabras pegadas ("…paraPara procesar…"): esperado y no es un bug del theme |

## 12. Rollback

| Objeto | Cómo deshacer | Nota |
|---|---|---|
| Página creada (B7) | Cambiar a **Hidden**; si hace falta, **Delete** desde la lista de páginas | El contenido no se pierde: sigue en `content/legal/`. Borrar deja de responder la URL |
| Menú "Ayuda" (D) | Eliminar los ítems agregados y guardar | Vuelve a los 2 originales |
| Ajustes del theme (C) | Vaciar `shipping_url`, `warranty_url` y `shipping_policy_url` | Actualizar la nota de C3 |
| Redirects (E) | Quitar las filas del CSV o borrar los redirects importados | — |
| Política nativa de privacidad (solo si D-L2 = b) | Restaurar la copia previa (A2). La ayuda indica que las actualizaciones de la privacidad automatizada quedan en el registro de actividad de la tienda [S1]. Si "Use automated policy" restaura el texto automatizado: **NOT_VERIFIED** | **Por eso A2 y A3 son obligatorios antes de tocar la nativa** |
| Handle equivocado | Editar el handle; si se creó un redirect por error, borrarlo en URL redirects | — |

## 13. Tiempo estimado y qué hace Claude después

| Tramo | Quién | Tiempo |
|---|---|---|
| Decisiones D-L1 a D-L7 y revisión de § 7 | Dueña (y su asesor, si lo usa) | ~20 min la parte técnica; la revisión legal depende de ella |
| Fase B (4 páginas) | Dueña, o Claude con aprobación | ~20 min |
| Fases C y D | Dueña, o Claude con aprobación | ~10 min |
| QA § 11 | Claude | ~20 min |

**Qué hace Claude inmediatamente después de que existan las páginas (sin que la dueña pida más):**

1. Corre § 11 en las 4 páginas y en Reembolso, Garantía y la privacidad nativa.
2. Entrega un reporte corto: pasa o falla por chequeo, con longitud y hash.
3. Actualiza `theme/03D-legal-policies-inventory.md` (de **DEFERRED_OWNER_ONLY_BLOCKER** a **HECHO**, con hash) y la fila 13 de `03E-commercial-readiness-report.md`.
4. Con OK, prepara las 4 filas de redirects (fase E) y corre el validador.
5. Deja anotado que el theme remoto ya no es idéntico al ZIP si hubo fase C.
6. Si la analítica quedó decidida, avisa que G-COOK y el banner se cierran con `analytics/03F-analytics-owner-runbook.md`.

**Si el lanzamiento ocurre en otra tienda** (ver `analytics/03F-analytics-owner-runbook.md`, § 2): este runbook se repite allí. Los HTML, los handles y los hashes son portables.

## 14. Hallazgos frente a 03D y 03E

1. **Páginas ocultas.** 03D propuso "Página oculta". Shopify no documenta qué ve el visitante en una página oculta y la comunidad reporta 404 [S9]; el QA exige Visible (D-L3).
2. **Enlaces automáticos del checkout.** Shopify enlaza solo las políticas nativas [S1]. Con páginas, el pie del checkout no mostrará Términos ni Envíos. 03D no lo decía.
3. **Enlaces vacíos en la ficha.** `shipping_url` y `warranty_url` están vacíos en `product.json` (§ 4.3). Con páginas hay que cargarlos.
4. **Cookies y Shopify.** La frase "Hoy no las usamos" puede ser inexacta **con GA4 y Meta apagados**, porque Shopify lista cookies de analítica y de marketing propias [S7]. 03E (§ 6.4) solo la marcaba como falsa al encender GA4 o Meta.
5. **Enlace de preferencias.** 03E marcaba como NOT_VERIFIED cómo enlazar las preferencias. La ayuda de Shopify dice que el enlace está en la sección de políticas y en el banner cuando se muestra [S6]. Cómo aparece en el theme Radaelli sigue siendo NOT_VERIFIED.
6. **Frase de Privacidad ya identificada.** Se ubicó el párrafo exacto que choca con el intercambio de datos de Meta (§ 7.2).
7. **Meta description de las 4 páginas.** Sin descripción SEO saldrá "pegada" como en `/pages/garantia` (`seo/03E-seo-offline-review.md` § 2.3). Las 4 descripciones actuales existen en el sitio (§ 3.1); la de Términos habla de "identificación de la tienda", que la página no trae.
8. **Contacto en Shopify.** La ayuda de Shopify pide contacto público con correo y teléfono (extracto de búsqueda) y existe una política "Contact information" en la API [S8]. 03D lo listaba solo como NOT_AVAILABLE.

## 15. Fuentes (consultadas el 2026-09-29) y NOT_VERIFIED

| Ref. | URL | Para qué se usó | Confianza |
|---|---|---|---|
| S1 | https://help.shopify.com/en/manual/checkout-settings/refund-privacy-tos | Configuración > Políticas, tipos de política, "Insert template", privacidad automatizada, enlaces del checkout, URLs `/policies/*` | Leída |
| S2 | https://help.shopify.com/en/manual/online-store/add-edit-pages | Páginas, Visible/Hidden, handle, casilla de redirect, botón "Edit code" | Leída |
| S3 | https://help.shopify.com/en/manual/online-store/menus-and-links/editing-menus | Content > Menus, ítems, tipos de enlace, orden | Leída |
| S4 | https://shopify.dev/docs/api/liquid/objects/policy | Patrón `/policies/<tipo>` | Leída |
| S5 | https://shopify.dev/docs/storefronts/themes/seo/robots-txt | Regla por defecto que bloquea `/policies/` | Citada desde `seo/03E-redirect-plan.md` § 5.5, **no re-leída hoy** |
| S6 | https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings | Banner, regiones, "Cookie preferences" | Leída |
| S7 | https://www.shopify.com/legal/cookies | Lista de cookies necesarias, de analítica y de marketing en tiendas | Leída |
| S8 | https://shopify.dev/changelog/shop-contact-information-policy | Política "Contact information" en la API | Solo resultado de búsqueda |
| S9 | https://community.shopify.com/t/404-on-hidden-pages/412000 | Páginas ocultas dan 404 | Comunidad, **no oficial**; solo resultado de búsqueda |
| S10 | https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing | Datos que comparte Meta en niveles Mejorado y Máximo | Leída |

**NOT_VERIFIED / NOT_AVAILABLE de este runbook**

- Etiquetas en español del Admin (Políticas, Páginas, Menús, "Edit code", "Legal notice", "Contact information").
- Qué ve un visitante en la URL de una página oculta (solo comunidad).
- Si el editor de políticas nativas usa el mismo botón `<>` que el de páginas (03D lo usó; la ayuda no lo menciona).
- Selector del contenedor del texto en las políticas nativas (solo importa con D-L1 = B).
- Si "Use automated policy" restaura el texto tras pegar uno propio.
- Equivalente nativo de la casilla "acepto Términos y Envíos" del checkout actual.
- Qué cookies emite esta tienda y con qué consentimiento en Colombia.
- Estado del theme remoto respecto de `warranty_url` (03D pidió cargarlo).
- Script exacto del evento `paste` de 03D: NOT_AVAILABLE.
- Razón social, NIT, dirección, correo público y fecha de vigencia: **NOT_AVAILABLE**.
