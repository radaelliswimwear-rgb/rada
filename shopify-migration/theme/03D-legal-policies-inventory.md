# 03D — Inventario legal / políticas (estado al cierre de 03D)

> **Actualización 03E (2026-09-29).**
> - **Footer "Ayuda" activo solo con destinos reales:**
>   - menú `ayuda` creado en el Admin: Devoluciones → `/policies/refund-policy`, Garantía → `/pages/garantia`, en el orden del real;
>   - bloque del footer entre Comprar y Contacto (RC1.5);
>   - las otras 4 (Envíos, Términos, Privacidad, Cookies) se agregan **al menú** cuando existan sus páginas, sin tocar el theme.
> - **Páginas legales pendientes:** no se reintentó crearlas. El clasificador de permisos las denegó en 03D y esa denegación vale también para intentos posteriores. Siguen como owner-only, con el HTML verbatim listo en `content/legal/`.
> - **Links de los textos legales:** ahora subrayados, EXACT real (`underline`), en páginas y políticas (A11Y-02, RC1.5).
> - **Ancla `/#contacto`:** funciona (`id="contacto"` en el footer desde RC1.4).
> - **Revisión antes de publicar** (sin reescribir texto legal):
>   - "Pago" de `terminos.html` y los terceros de `privacidad.html`, según el proveedor elegido (ver `payments/03E-wompi-shopify-feasibility.md`);
>   - "Hoy no las usamos" de `cookies.html`, según la analítica final (ver `analytics/03E-analytics-plan.md`).

> **Estado 03D (2026-09-29, 11:15 Bogotá).**
> - **Fuente usada:** el HTML que sirve hoy `radaelliswimwear.com` en las 6 rutas, pedido por GET público. Ya viene renderizado: el umbral real de `/envios` sale **$299.900**.
>   - Extracción verbatim con `scripts/extract-legal-verbatim.cjs`.
>   - El script **aborta si el texto normalizado cambia**.
>   - Resultado: `content/legal/*.html` + `manifest.json` (SHA-256 por página).
> - **Únicos cambios respecto del sitio:**
>   1. Se quitó la línea "Última actualización: <fecha del render>" (no es una fecha real, ver §7).
>   2. Se quitó el botón "Cambiar mis preferencias de cookies", que depende de `lib/consent`.
>   3. Se remapearon los enlaces internos a rutas de Shopify.
>   4. Se quitaron clases CSS y los `<section>` contenedores.
> - **Migrado a la Dev Store (verificado en el storefront con el theme Radaelli; texto idéntico a la fuente ignorando espacios, mismo SHA-256):**

| Contenido | Destino | Estado | Verificación |
|---|---|---|---|
| `/devoluciones` | Configuración > Políticas > **Política de devoluciones y reembolsos** (`/policies/refund-policy`) | **HECHO** | 1618 caracteres sin espacios, SHA-256 `c9c65d02…`, igual a la fuente. Shopify titula la página "Política de reembolso" (título nativo, no editable) |
| `/garantia` | Página **visible** "Política de garantía" (`/pages/garantia`) | **HECHO** | 889 caracteres sin espacios, SHA-256 `b44d879a…`, igual a la fuente. Enlaces: `/policies/refund-policy` y WhatsApp |
| `/privacidad` | Página oculta (propuesta) | **DEFERRED_OWNER_ONLY_BLOCKER** | El clasificador de permisos del agente denegó crear las páginas legales restantes en el Admin (external system write). HTML verbatim listo en `content/legal/privacidad.html`. Revisión humana obligatoria: nombra Wompi, Resend y Cloudinary. Shopify ya tiene una Política de privacidad **automatizada y publicada**, que no se tocó |
| `/terminos` | Página oculta o política "Términos del servicio" | **DEFERRED_OWNER_ONLY_BLOCKER** | `content/legal/terminos.html`. El párrafo "Pago" describe Wompi |
| `/envios` | Página oculta o "Política de envío" | **DEFERRED_OWNER_ONLY_BLOCKER** | `content/legal/envios.html`. Promete envío gratis desde $299.900: no publicarla hasta que exista esa tarifa en Shopify (ver `free_shipping_rate_confirmed`) |
| `/cookies` | Página oculta | **DEFERRED_OWNER_ONLY_BLOCKER** | `content/legal/cookies.html`. "Hoy no las usamos" hay que revisarlo en Shopify |
| Información de contacto / Aviso legal | Políticas | **NOT_AVAILABLE** | No hay razón social, NIT ni dirección en el repo |

> - **Footer:** no se agregó una columna "Ayuda" (quedaría con 2 de las 6 páginas del sitio real). Hace falta un menú nuevo en el Admin, y se decide junto con las 4 páginas pendientes.
>   - El theme ahora tiene `id="contacto"` en el footer, como el real, así que los enlaces `/#contacto` de los textos funcionan.
> - **No se generó texto legal ni se dio asesoría legal.**

---


Fecha del inventario: 2026-09-29. Modo: solo lectura sobre el proyecto. No se reescribió ni se resumió el sentido legal de ningún texto; las citas se limitan a las primeras ~15 palabras de cada página.

Rutas base usadas en este documento:
- `APP` = `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main` (código del sitio en vivo)
- `MIG` = `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration`

---

## 1. Hallazgo principal

1. Existen **6 páginas legales/informativas** con texto completo en el repo, todas hardcodeadas en JSX (no hay Markdown, CMS ni constantes de contenido): `/privacidad`, `/terminos`, `/devoluciones`, `/envios`, `/garantia`, `/cookies`. Están enlazadas en la columna "Ayuda" del footer (`APP/components/layout/footer.tsx:15-22`) y en el sitemap (`APP/app/sitemap.ts:39-44`).
2. **No existen** como página: Contacto, Ayuda/FAQ, Sobre nosotros, Sostenibilidad, Prensa, Compartir datos (data sharing), Aviso legal. "Contacto" es un menú desplegable (`APP/components/layout/contact-menu.tsx:22-57`) y "Sobre nosotros / Sostenibilidad / Prensa" apuntan a `#contacto` (el propio footer) (`APP/components/layout/footer.tsx:23-27`).
3. **Ninguna** de las 6 páginas contiene NIT, razón social, dirección física ni correo electrónico. Las únicas cifras de contacto dentro de las páginas son enlaces a WhatsApp (`wa.me/57313•••••68`) en `/devoluciones` y `/garantia`. Búsqueda de `NIT|razón social|Superintendencia|SIC|Ley 1581|Ley 1480|domicilio|matrícula mercantil|RUT` en todo el repo (sin `node_modules`, `.next`, `.claude`, `.env*`): **0 coincidencias** de datos de identificación de la empresa (la única coincidencia de "retracto" es un título en `APP/app/envios/page.tsx:139`).
4. No hay `TODO`, `FIXME`, `lorem` ni marcadores de "completar" en ninguna de las 6 páginas (la única coincidencia de la búsqueda fue la palabra "Todos" en `APP/app/garantia/page.tsx:34`, falso positivo).
5. **Las 6 páginas muestran "Última actualización" con `new Date()`**, es decir, la fecha que se imprime es la del render, no una fecha real de vigencia (`APP/app/privacidad/page.tsx:20-25`, `APP/app/terminos/page.tsx:20-25`, `APP/app/devoluciones/page.tsx:20-25`, `APP/app/envios/page.tsx:25`, `APP/app/garantia/page.tsx:20-25`, `APP/app/cookies/page.tsx:21-26`). Inferencia (no verificada en producción): como el layout raíz lee el consentimiento por cookie (`APP/app/layout.tsx:96`), las páginas probablemente se renderizan por solicitud y muestran siempre la fecha del día. **Fecha real de vigencia de cada política: NOT_AVAILABLE**; las únicas pistas son las fechas de git (tabla abajo).

---

## 2. Tabla de inventario

Longitud aproximada = palabras de texto visible (etiquetas JSX quitadas con un script de conteo; margen de error de unas pocas palabras). "Primeras ~15 palabras" = primer párrafo después del título.

| # | Ruta | Archivo | ¿Texto completo en el repo? | Primeras ~15 palabras | Longitud aprox. | Pistas de última modificación | Placeholders / TODO | Datos de negocio que contiene |
|---|---|---|---|---|---|---|---|---|
| 1 | `/privacidad` | `APP/app/privacidad/page.tsx` (122 líneas, 4.595 bytes) | SÍ, 6 secciones `h2` (`:31,48,63,77,88,101`) | "Para procesar tu pedido recopilamos los datos necesarios para gestionarlo: nombre, dirección de entrega, teléfono…" (`:34-36`) | ~232 palabras | mtime 17-sep-2026 20:58; único commit `9765356` 2026-09-17 "Fase 0 … consentimiento, privacidad" | Ninguno. Fecha dinámica `new Date()` (`:20-25`) | Sin NIT/dirección/email/teléfono. Nombra proveedores: Wompi, Resend, Cloudinary (`:66-71`). Menciona Habeas Data (`:92`). Contacto solo vía enlace `/#contacto` (`:112`) |
| 2 | `/terminos` | `APP/app/terminos/page.tsx` (114 líneas, 4.244 bytes) | SÍ, 5 secciones (`:31,46,58,71,93`) | "Radaelli Swimwear es una tienda de trajes de baño de diseño atemporal. Al realizar una…" (`:34-35`) | ~181 palabras | mtime 17-sep-2026 20:58; único commit `bc18b0c` 2026-09-17 "clarify shipping policy and checkout expectations" | Ninguno. Fecha dinámica (`:20-25`) | Sin NIT/dirección/email/teléfono. Nombra Wompi, medios de pago (tarjeta, PSE, Nequi, Bancolombia) y WhatsApp (`:61-65`); moneda COP (`:49`) |
| 3 | `/devoluciones` | `APP/app/devoluciones/page.tsx` (137 líneas, 5.267 bytes) | SÍ, 4 secciones (`:31,55,81,100`) | "Aceptamos devolución o cambio únicamente cuando el producto presenta: Defecto de fábrica (costuras, tela, herrajes…" (`:34-38`) | ~325 palabras | mtime 09-sep-2026 17:40; commits `2180559` 2026-09-09 y `a8f8359` 2026-08-24 | Ninguno. Fecha dinámica (`:20-25`) | Teléfono vía enlace `https://wa.me/57313•••••68` (`:123`). Canales WhatsApp/Instagram (`:47-48`, `:104`). Plazo "5 días hábiles" (`:46`, `:75`, `:105`) |
| 4 | `/envios` | `APP/app/envios/page.tsx` (186 líneas, 7.316 bytes) | SÍ, 10 secciones (`:31,46,64,78,91,105,116,127,139,157`), pero con **1 dato dinámico** | "En compras iguales o superiores a {threshold} COP, Radaelli Swimwear ofrece envío gratuito dentro de Colombia…" (`:34-35`) | ~429 palabras | mtime 25-sep-2026 14:03. Commits: `33d6dde` 2026-09-25 (solo cambio de código `get()`→`getPublic()` en `:15`, rama `pentest-remediation-20260925`), `bc18b0c` 2026-09-17, `0716e0a` 2026-09-14, `a8f8359` 2026-08-24 | Ninguno. Fecha dinámica (`:25`). Umbral `{threshold}` leído de la base de datos (`:15-16`) e insertado en `:34`, `:64`, `:164` | Sin NIT/dirección/email/teléfono. Transportadora "Envia" (`:49`); tiempos 3-5 días hábiles / 24-48 h (`:53-54`). Umbral por defecto en esquema: `299900` (`APP/prisma/schema.prisma:1142`); **valor real configurado en producción: NOT_AVAILABLE** (vive en BD) |
| 5 | `/garantia` | `APP/app/garantia/page.tsx` (98 líneas, 3.520 bytes) | SÍ, 3 secciones (`:31,43,56`) + párrafo final (`:73-92`) | "Todos los productos Radaelli Swimwear cuentan con garantía de 12 meses contados desde la fecha…" (`:34-36`) | ~180 palabras | mtime 09-sep-2026 17:40; único commit `2180559` 2026-09-09 | Ninguno. Fecha dinámica (`:20-25`) | Teléfono vía enlace `https://wa.me/57313•••••68` (`:84`). "12 meses" (`:35`) |
| 6 | `/cookies` | `APP/app/cookies/page.tsx` (116 líneas, 4.300 bytes) | SÍ, 6 secciones (`:32,43,56,69,81,92`) + **1 botón interactivo** `ChangeConsentPreferencesButton` (`:87`) | "Las cookies son pequeños archivos que un sitio guarda en tu navegador para recordar información…" (`:35-36`) | ~200 palabras | mtime 17-sep-2026 20:58; único commit `9765356` 2026-09-17 | Ninguno. Fecha dinámica (`:21-26`) | Ninguno |
| 7 | Contacto / Ayuda | No hay ruta. Menú `APP/components/layout/contact-menu.tsx:22-57`; datos en `APP/lib/social-links.ts:4-29` | NO (solo lista de canales) | NOT_AVAILABLE (no hay texto de página) | — | `social-links.ts`: solo difiere por fin de línea entre checkout y worktree | — | Instagram `@Radaelli_swimwear` (`:8`), Facebook (`:14`), TikTok (`:20`), WhatsApp `+57 313 ••• ••68` (`:26-27`). Hay 2 correos administrativos en `APP/lib/email/admin-recipients.ts:8-9`, **no publicados** en ninguna página legal (no se reproducen aquí) |
| 8 | FAQ / Preguntas frecuentes | No existe | NO | NOT_AVAILABLE | — | — | — | — (confirmado también en `MIG/theme/storefront-blueprint.md:155`) |
| 9 | Compartir datos (data sharing) | No existe como página; solo la sección "Con quién compartimos datos" dentro de privacidad (`APP/app/privacidad/page.tsx:61-73`) | Parcial (sección, no página) | Ver fila 1 | — | — | — | Wompi, Resend, Cloudinary (`:66-71`) |
| 10 | Sobre nosotros / Sostenibilidad / Prensa | No existen; enlaces a `#contacto` (`APP/components/layout/footer.tsx:24-26`) | NO | NOT_AVAILABLE | — | — | Los 3 enlaces del footer apuntan al propio footer | — |
| 11 | Aviso legal / Información de la empresa (razón social, NIT, domicilio) | No existe | NO | NOT_AVAILABLE | — | — | — | NIT, razón social y dirección física: **NOT_AVAILABLE en todo el repo** |
| 12 | Ruta heredada `app/[page]` | `APP/app/[page]/page.tsx` (50 líneas) | NO: es el catch-all de la plantilla Vercel Commerce que lee Páginas de Shopify por API | — | — | Jun-10 (mtime) | Texto fijo en inglés "This document was last updated on…" (`:39`) | Ninguno. Con Shopify sin configurar devuelve `undefined` → 404 (`APP/lib/shopify/index.ts:427-430`) |

### Coherencia checkout principal vs worktree
Comparados byte a byte (ignorando CRLF), el texto de las 6 páginas es idéntico entre `APP/app/*` y la copia del worktree. La única diferencia es de código en `APP/app/envios/page.tsx:15` (`settingsRepository.getPublic()` en el checkout vs `settingsRepository.get()` en el worktree), introducida por el commit `33d6dde` (2026-09-25), que según `git branch -a --contains` solo está en la rama `pentest-remediation-20260925`. Nota: `MIG/theme/storefront-blueprint.md:27` todavía cita `settingsRepository.get()`.

---

## 3. Enlaces internos dentro de cada página (a remapear en Shopify, sin tocar el texto)

| Página | Enlaces internos / externos | Líneas |
|---|---|---|
| `/privacidad` | `/terminos`, `/cookies`, `/#contacto` | `APP/app/privacidad/page.tsx:39`, `:54`, `:112` |
| `/terminos` | `/envios` (x2), `/devoluciones`, `/garantia`, `/#contacto` | `APP/app/terminos/page.tsx:37`, `:75`, `:80`, `:84`, `:104` |
| `/devoluciones` | `/garantia`, `https://wa.me/57313•••••68` | `APP/app/devoluciones/page.tsx:91`, `:123` |
| `/envios` | `/devoluciones`, `/garantia`, `/#contacto` | `APP/app/envios/page.tsx:145`, `:149`, `:176` |
| `/garantia` | `/devoluciones`, `https://wa.me/57313•••••68` | `APP/app/garantia/page.tsx:76`, `:84` |
| `/cookies` | `/privacidad`, `/#contacto`, botón `ChangeConsentPreferencesButton` | `APP/app/cookies/page.tsx:97`, `:106`, `:87` |

---

## 4. Texto legal/de ayuda disperso fuera de las 6 páginas

| Ubicación | Qué es | Líneas | Nota para Shopify |
|---|---|---|---|
| Banner de consentimiento de cookies | Copy del banner + 3 categorías (necesarias, analíticas, marketing) | `APP/components/consent/consent-banner.tsx:51-54`, `:61-63`, `:77-79`, `:93-95` | Depende del sistema propio `lib/consent`; en Shopify el consentimiento lo gestiona la plataforma/app de banner. No migra como página |
| Casilla de aceptación en checkout | "He leído y acepto los Términos y Condiciones y la Política de Envíos" | `APP/components/checkout/checkout-content.tsx:710-739` (estado `:151`, validación `:295`) | El checkout de Shopify es nativo y está fuera de alcance (`MIG/theme/storefront-blueprint.md:26`) |
| Aceptación de contratos de Wompi (flujo no alojado) | Enlaces a "reglamentos y política de privacidad" y "autorización para la administración de datos personales" de Wompi | `APP/components/checkout/payment-form.tsx:162-171`, `:189-198`; solo si no se usa checkout alojado (`APP/components/checkout/checkout-content.tsx:125-129`) | Los textos vienen de permalinks de la API de Wompi: **contenido NOT_AVAILABLE en el repo** |
| Acordeón de ficha de producto | "Envíos, devoluciones y garantía" + "Métodos de pago" + "Cuidados de la prenda" | `APP/components/product-detail/product-detail.tsx:153-197` | Ya replicado en el theme: bloque `shipping` de `MIG/theme-src/sections/main-product.liquid:286-310`, esquema `:456-483` |
| Aviso de envío en checkout | "Envío estándar gratis" / "Envío por coordinar" | `APP/components/checkout/shipping-notice.tsx:14-42` | Fuera de alcance (checkout nativo) |
| Letra chica del banner promocional | "Envío gratis en compras desde … Ver política de envíos" | `APP/components/home/promo-banner.tsx:35-42` | Ya replicado con setting `shipping_policy_url` (`MIG/theme-src/sections/promo-banner.liquid:28-29`, `:68-69`) |
| Pie de correo transaccional | "¿Dudas con tu compra? … política de envíos … de devoluciones" | `APP/lib/email/templates.ts:462-464` | En Shopify las notificaciones son plantillas propias de la plataforma; los enlaces `/envios` y `/devoluciones` dejarían de existir |
| Copy del footer | Descripción de marca y "© … Todos los derechos reservados." | `APP/components/layout/footer.tsx:57-60`, `:118` | Ya cubierto por `MIG/theme/footer-report.md:12` |

---

## 5. Estado actual en la migración (lo que ya dicen los reportes del tema)

- El theme tiene una sección genérica para estas páginas: `MIG/theme-src/sections/main-page.liquid:1-13` (usa `page.content`) y la plantilla `MIG/theme-src/templates/page.json`. No existe `page.envios.json` en `MIG/theme-src/templates/` (solo `page.json` y `page.wishlist.json`), aunque el blueprint lo propone (`MIG/theme/storefront-blueprint.md:27`, `:149`).
- La ficha de producto ya prefiere las políticas nativas: `shop.shipping_policy.url` y `shop.refund_policy.url` con respaldo en settings del bloque; la garantía solo tiene `block.settings.warranty_url` (`MIG/theme-src/sections/main-product.liquid:294-296`, `:468-480`).
- Las 6 URL legales figuran como `NOT_AVAILABLE_YET` en la paridad de URLs, con destino `/pages/<handle>` y nota "alternativa: políticas nativas de Shopify (/policies/...)" (`MIG/catalog/shopify-url-parity.csv:42-47`) y en el inventario SEO (`MIG/seo/current-url-inventory.csv:113-118`).
- En la Development Store existen hoy las páginas `contact`, `data-sharing-opt-out` (creadas por Shopify) y `favoritos`; la página `contact` está en inglés y no se borró (`MIG/theme/03B-store-foundation-report.md:159`, `:162`); el footer conserva "Your Privacy Choices" (`:160`). Devoluciones de autoservicio: OFF (`:165`).
- "Páginas o políticas legales" figura como pendiente tras 03C (`MIG/theme/03C-catalog-import-report.md:150`) y la fila F del checklist las asigna a Daniela (`MIG/theme/pre-development-store-checklist.md:26`).

---

## 6. Recomendación para Shopify

Criterio: el texto se copia **tal cual** (sin reescribir); lo único que cambia son destinos de enlaces y el dato dinámico del umbral. Los tipos de política disponibles en *Settings > Policies* (reembolso, privacidad, términos del servicio, envío, información de contacto, y otros según región) son conocimiento de plataforma: **verificar en el admin de la Development Store** antes de ejecutar.

| Contenido actual | Destino recomendado en Shopify | ¿Migrable verbatim? | Qué hay que resolver antes (sin tocar el sentido legal) |
|---|---|---|---|
| `/terminos` | **Settings > Policies > Términos del servicio** | SÍ (texto completo en `APP/app/terminos/page.tsx:28-108`) | Remapear 5 enlaces (sección 3). Revisión humana del párrafo "Pago" (`:61-65`): describe la pasarela Wompi del stack actual y la integración de pagos en Shopify sigue sin decidir (`APP/docs/shopify/wompi-payments.md:97`). Quitar la fecha dinámica y poner una fecha real (NOT_AVAILABLE hoy) |
| `/privacidad` | **Settings > Policies > Política de privacidad** | SÍ técnicamente (`APP/app/privacidad/page.tsx:28-116`), pero **no publicar sin revisión legal/humana** | La sección "Con quién compartimos datos" (`:61-73`) nombra solo Wompi, Resend y Cloudinary, proveedores del stack Next.js; tras la migración el sitio lo opera Shopify. La frase sobre cuenta y sesión (`:36-37`) describe las cuentas propias actuales (Shopify usa New Customer Accounts, `MIG/theme/03B-store-foundation-report.md:165`). No se reescribe aquí: es decisión de la dueña o de su asesor |
| `/devoluciones` | **Settings > Policies > Política de reembolso** | SÍ (`APP/app/devoluciones/page.tsx:28-131`) | Remapear enlace a garantía (`:91`). El theme ya la enlaza sola en la ficha (`MIG/theme-src/sections/main-product.liquid:295`) |
| `/envios` | **Settings > Policies > Política de envío** | SÍ con condición (`APP/app/envios/page.tsx:28-180`) | Las 3 apariciones de `{threshold}` (`:34`, `:64`, `:164`) no pueden quedar dinámicas en una política de texto: hay que escribir el monto real vigente (valor en producción NOT_AVAILABLE; por defecto 299.900 según `APP/prisma/schema.prisma:1142` y el setting del theme en `MIG/theme/offline-release-candidate-report.md:280`). Si después cambia el umbral, el texto de la política queda desactualizado. Alternativa ya prevista: Página con `page.envios.json` (`MIG/theme/storefront-blueprint.md:149`), que hoy **no existe** en `theme-src/templates` |
| `/garantia` | **Página de Shopify** `/pages/garantia` (plantilla `page.json` → `main-page.liquid`) | SÍ (`APP/app/garantia/page.tsx:28-92`) | No hay tipo de política nativa para garantía (conocimiento de plataforma, verificar). Cargar la URL en el setting `warranty_url` del bloque de envíos (`MIG/theme-src/sections/main-product.liquid:296`, `:480`) |
| `/cookies` | **Página de Shopify** `/pages/cookies` | Texto SÍ (`APP/app/cookies/page.tsx:29-110`); **botón NO** | El botón `ChangeConsentPreferencesButton` (`:87`) depende del sistema propio `lib/consent` y no existe en Shopify. Las afirmaciones "Hoy no las usamos" (`:59`, `:72`) describen el sitio actual; en Shopify hay que revisar si siguen siendo ciertas (la plataforma y sus apps usan sus propias cookies — verificar). En el sitio actual, GA4/Meta existen en el código pero apagados por variables de entorno (`APP/lib/analytics/feature-flags.ts:35-57`); su estado en producción es NOT_AVAILABLE (no se leyeron los `.env`) |
| Información de contacto | **Settings > Policies > Información de contacto** | **NOT_AVAILABLE** | Faltan en todo el repo: razón social, NIT, dirección física. Solo hay canales sociales/WhatsApp (`APP/lib/social-links.ts:4-29`) y 2 correos internos no publicados (`APP/lib/email/admin-recipients.ts:8-9`). Debe darlos Daniela |
| Contacto (página) | Página `contact` que ya existe en la Development Store (`MIG/theme/03B-store-foundation-report.md:159`) | NOT_AVAILABLE (no hay texto de página en el sitio actual) | Hoy es un menú (`APP/components/layout/contact-menu.tsx`); decidir si se mantiene como menú o se crea página |
| FAQ / Ayuda | — | **NOT_AVAILABLE** | No se inventa |
| Compartir datos / opt-out | Página `data-sharing-opt-out` generada por Shopify (`MIG/theme/03B-store-foundation-report.md:162`) | **NOT_AVAILABLE** como contenido propio | El único texto propio es la sección dentro de privacidad (`APP/app/privacidad/page.tsx:61-73`) |
| Sobre nosotros / Sostenibilidad / Prensa | — | **NOT_AVAILABLE** | Hoy son enlaces a `#contacto` (`APP/components/layout/footer.tsx:24-26`); en Shopify no deberían ir al menú del footer hasta que exista contenido |
| Aviso legal / Términos de venta | — | **NOT_AVAILABLE** | Sin contenido en el repo |

### Orden de trabajo sugerido
1. Daniela entrega los datos que faltan (razón social, NIT, dirección, correo público, fecha de vigencia de cada política y monto real del envío gratis).
2. Pegar verbatim Términos, Reembolso (devoluciones) y Envío (con el monto fijo) en *Settings > Policies*.
3. Privacidad: pegar solo después de la revisión humana de la sección de proveedores.
4. Crear Páginas `garantia` y `cookies` con `page.json`; configurar `warranty_url`.
5. Actualizar enlaces internos (sección 3) a `/policies/...` o `/pages/...` y registrar las redirecciones 301 de las 6 URL (`MIG/catalog/shopify-url-parity.csv:42-47`).

---

## 7. Observaciones para revisión humana (sin cambiar el texto)

- **Fecha de "Última actualización" ficticia**: las 6 páginas imprimen la fecha del render (sección 1, punto 5). Si se copia en Shopify, hay que poner una fecha real, que hoy es NOT_AVAILABLE.
- **Mezcla de voseo y tuteo** dentro de un mismo texto (por ejemplo, "creás / consultá / podés / escribinos" en `APP/app/privacidad/page.tsx:36`, `:38`, `:92`, `:94` frente a "¿Tienes dudas?" en `:111`; "podés" en `APP/app/terminos/page.tsx:64` frente a "aceptas" en `:35`). Pasa tal cual si se migra verbatim; decidir si se deja así.
- **Newsletter**: el checkout ofrece suscripción (`APP/components/checkout/checkout-content.tsx:106`) y existe `/admin/newsletter`, pero los textos de `/privacidad` y `/terminos` no mencionan "newsletter", "marketing" ni "boletín" (búsqueda sin resultados). Es una observación, no una interpretación legal.
- **Coherencia cookies ↔ código**: `/cookies` dice que hoy no se usan cookies analíticas ni de marketing (`APP/app/cookies/page.tsx:59`, `:72`), coherente con el comentario del banner (`APP/components/consent/consent-banner.tsx:12-16`) solo si las variables `ANALYTICS_*` siguen apagadas en producción (`APP/lib/analytics/feature-flags.ts:35-57`); ese estado no se pudo verificar desde el repo.
- **Archivos sensibles detectados (no leídos)**: existen `APP/.env`, `APP/.env.local`, `APP/.env.test` y `APP/.env.example`. No se abrió ni se imprimió ningún valor.
