# Footer — Fase 02D

Documenta `shopify-migration/theme-src/sections/footer.liquid`, `footer-group.json`, `assets/section-footer.css` y las adiciones a `snippets/icon.liquid`/locales. Basado en reauditoría directa de `components/layout/footer.tsx`, `footer-social-links.tsx`, `contact-menu.tsx` y `lib/social-links.ts` — no solo del blueprint de la Fase 02.

## Reauditoría (inventario exacto del footer real)

| Elemento | Real hoy |
|---|---|
| Logo | `/logo/radaelli-swimwear.png`, `h-24 w-64` (96×256px), `object-contain` |
| Tagline/descripción | Texto fijo: "Radaelli Swimwear: trajes de baño de diseño atemporal, hechos para durar, con materiales nobles y una mirada minimalista." |
| Columna "Comprar" | Dinámica — categorías activas (`catalogRepository.listActiveCategories()`, mismo interruptor que el Navbar) |
| Columna "Ayuda" | Envíos, Devoluciones, Garantía, Términos y condiciones, Privacidad, Cookies (rutas internas estáticas) + item "Contacto" (disclosure) |
| Columna "Empresa" | Sobre nosotros, Sostenibilidad, Prensa — las 3 apuntan a `#contacto` (placeholders, no páginas reales) |
| Contacto | `<details>` nativo con los 4 canales de `SOCIAL_LINKS` (Instagram/Facebook/TikTok/WhatsApp), sin campo de email separado |
| Redes sociales (fila propia) | Pills `rounded-full border`, mismos 4 canales, ícono + label |
| Newsletter | **No existe en el footer real.** Existe como sección aparte en el Home (`components/home/newsletter.tsx`), fuera de alcance de 02D |
| Copyright | `© {currentYear} Radaelli Swimwear. Todos los derechos reservados.` (año dinámico `new Date().getFullYear()`) |
| Medios de pago/badges | No existen en el sitio real hoy — no se agregan |
| Fondo/bordes | `bg-white`, `border-t border-neutral-200` arriba, segunda franja con su propio `border-t` para el copyright |
| Grid | `grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]` — 1 columna en mobile |
| Espaciado vertical | `py-16` (bloque principal, constante en todos los breakpoints), `py-6` (franja de copyright) |

**Nota**: `components/layout/footer-menu.tsx` existe en el repo pero está **huérfano** (0 imports reales, resto del template Vercel Commerce original) — no se usó como fuente de verdad.

## Qué se construyó

- **Brand**: logo real vía `settings.logo` (mismo campo global que usa el header — un solo logo en todo el theme), fallback a texto (`shop.name`) si no hay logo cargado. Descripción vía `section.settings.brand_description` (richtext, con el texto real actual como default). Fila de redes sociales (pills `button button--outline button--small`, reutilizando el sistema de botones de la Fase 02B) — cada red aparece **solo si tiene URL** en Ajustes del tema → Social (grupo ya existente desde una fase previa).
- **Columnas de menú** (`block type: "menu"`, repetible, sin límite fijo de 3): heading de texto libre + `link_list` (Shopify Navigation). Reemplaza el único setting `footer_menu` del placeholder de 02A/02B por un sistema de bloques flexible — así Daniela puede replicar Comprar/Ayuda/Empresa (o cualquier otra combinación) sin tocar código.
- **Bloque "Contacto"** (`block type: "contact"`, máx. 1): réplica exacta del disclosure `<details>` real — mismo comportamiento, mismos 4 canales (leídos de Ajustes del tema → Social), sin JS. Suma un campo de **email de contacto** (no existe hoy en el código real — el encargo lo pide explícitamente como requisito nuevo del footer Shopify; se deja **vacío por defecto**, no se inventa un correo).
- **Bloque "Newsletter"** (`block type: "newsletter"`, máx. 1, **no incluido por defecto**): patrón nativo `{% form 'customer' %}` de Shopify con `contact[tags]: "newsletter"` — sin apps, sin backend propio, cero JS. No se agrega al `footer-group.json` por defecto porque el footer real hoy **no tiene** newsletter (existe aparte, en el Home) — queda disponible para que Daniela lo sume desde el Theme Editor si lo pide explícitamente en una fase futura.
- **Copyright dinámico**: `{{ 'now' | date: '%Y' }}` + `section.settings.brand_name` (nuevo, opcional) con fallback a `shop.name`.
- Íconos reales agregados a `snippets/icon.liquid`: `instagram`/`facebook`/`tiktok`/`whatsapp` — paths idénticos a `components/icons/social-icons.tsx` (no inventados, no de una librería externa).

## Divergencias documentadas (código real prioritario sobre el blueprint)

1. **3 columnas fijas → sistema de bloques repetible.** El React real hardcodea "Comprar/Ayuda/Empresa"; Shopify necesita que esas columnas sean administrables. `footer-group.json` trae por defecto **solo** un bloque "Comprar" (→ linklist `footer`, el único que Shopify crea por defecto en toda tienda nueva) + el bloque "Contacto". **Los linklists "Ayuda" y "Empresa" no existen en una tienda Shopify nueva** — Daniela debe crearlos en Admin → Navigation (con Envíos/Devoluciones/Garantía/Términos/Privacidad/Cookies, y Sobre nosotros/Sostenibilidad/Prensa respectivamente) y luego agregar 2 bloques "Columna de menú" más desde el Theme Editor. No se inventaron esos linklists ni sus contenidos.
2. **Grid `[2fr_1fr_1fr_1fr]` fijo → `2fr repeat(auto-fit, minmax(140px,1fr))`.** El sitio real fuerza exactamente 4 columnas porque siempre tiene exactamente 3 columnas de contenido + marca. El theme permite agregar/quitar columnas de menú sin romper el layout — con las 3 columnas reales el resultado visual es equivalente.
3. **Email de contacto**: campo nuevo, no existe en el código real (confirmado por grep en todo el repo — no hay ningún email de soporte/contacto hardcodeado hoy). Pedido explícito del encargo de esta fase; se deja vacío, no se fabrica un valor.
4. **`neutral-700` sin token dedicado**: el sistema de colores (Fase 02B) solo declara `--color-text-primary` (#171717) y `--color-text-muted` (#666666); los links del footer real usan `text-neutral-700` (tono intermedio). Se usa `--color-text-primary` como aproximación más cercana — mismo criterio de simplificación ya aplicado en 02B/02C a otros grises intermedios de Tailwind.

## Blocks implementados

`menu` (repetible), `contact` (máx. 1), `newsletter` (máx. 1, opcional/no incluido por defecto). `max_blocks: 8`.

## Accessibility

| Requisito | Estado |
|---|---|
| `<footer>` semántico | PASS |
| `<nav aria-label>` por columna | PASS — usa el heading del bloque o el label traducido por defecto |
| Heading hierarchy | PASS — headings de columna son `<p class="site-footer__heading">`, no `<h*>` (mismo criterio que el real: `<h3>` visualmente pequeño, no estructural — se usa párrafo estilizado para no romper la jerarquía real de `<h1>`/`<h2>` de cada página) |
| Focus-visible | PASS — hereda el anillo global de `base.css` |
| Texto de links significativo | PASS — todos los links usan el título real del linklist, ningún "click aquí" |
| Labels de formulario (newsletter) | PASS — `<label class="visually-hidden">` + `aria-label` implícito vía `for`/`id` |
| Labels de íconos | PASS — cada ícono social va acompañado de `<span>{{ label }}</span>` visible, no solo el SVG (`aria-hidden` en el SVG) |
| Contraste | PASS — mismos tokens ya validados en `theme/global-styles-report.md` § "Accesibilidad" |
| Keyboard | PASS — disclosure de contacto es `<details>/<summary>` nativo (Tab + Enter/Space, sin JS); newsletter es un `<form>` nativo |
| Tap targets ≥44px | PASS — pills de redes sociales y links de contacto usan el sistema `.button`/`.site-footer__contact-item` con padding suficiente |
| `reduced-motion` | PASS — única transición es `color` en hover de links, cubierta por la regla global |

## CSS añadido

`assets/section-footer.css` (nuevo, ~4.3 KB sin minificar) — grid responsive, sistema de columnas, disclosure de contacto, formulario de newsletter, franja de copyright. Reutiliza tokens existentes (`--space-*`, `--color-*`, `--radius-*`, `--z-dropdown`) y el sistema de botones de 02B (`.button--outline`) para las pills sociales — no se reinventó nada que ya existiera.

## JS añadido

**Cero.** Todo el footer es HTML server-rendered + `<details>` nativo (contacto) + `<form>` nativo de Shopify (newsletter, oculto por defecto). Cumple el requisito explícito de la fase ("si no hace falta JS, no crear JS").

## Responsive / 320px safety

- Mobile (< 768px): 1 columna, todo apilado (marca → columnas de menú → contacto), `gap: var(--space-12)` entre secciones.
- Desktop (≥ 768px): `2fr` para marca + columnas fluidas `minmax(140px, 1fr)`.
- Panel del disclosure de contacto: `max-width: calc(100vw - 2 * var(--gutter-mobile))` — no desborda a 320px aunque el bloque esté cerca del borde izquierdo.
- Formulario de newsletter (si se activa): `flex-wrap: wrap`, el input tiene `flex: 1 1 12rem` — nunca fuerza scroll horizontal en 320/375px.
- Validado en 320/375/390/430/768/1024/1440 por revisión estructural del CSS (sin Shopify Store, no hay renderizado real disponible en esta fase — mismo criterio que 02A/02B/02C).

## Funciona en las 9 plantillas

El footer se renderiza vía `{% sections 'footer-group' %}` en `layout/theme.liquid`, que envuelve **todas** las plantillas (index, product, collection, cart, search, page, blog, article, 404) — no requirió ningún cambio adicional por plantilla.

## Settings (Theme Editor)

| Setting | Ubicación | Qué controla |
|---|---|---|
| `brand_name` | Sección Footer (nuevo) | Nombre para el copyright, vacío = `shop.name` |
| `brand_description` | Sección Footer (ya existía, texto real como default) | Descripción corta bajo el logo |
| `logo` | Brand (global, ya existía) | Mismo logo del header |
| `social_instagram/facebook/tiktok/whatsapp` | Social (global, ya existía) | URLs reales — controla qué pills/canales aparecen |
| Bloque "Columna de menú" → `heading` + `menu` | Footer (nuevo) | Título + linklist de cada columna, repetible |
| Bloque "Contacto" → `heading`, `contact_email`, `show_social_channels` | Footer (nuevo) | Título, email opcional, mostrar/ocultar el disclosure de canales |
| Bloque "Newsletter" → `heading`, `description` | Footer (nuevo, no incluido por defecto) | Activar = agregarlo desde el Theme Editor (patrón nativo de secciones/bloques, sin checkbox redundante) |

## Escaneo de seguridad

Grep dirigido sobre los 8 archivos tocados/creados en esta fase (`footer.liquid`, `footer-group.json`, `section-footer.css`, `icon.liquid`, `theme.liquid`, `es.default.json`, `en.default.json`): **0** secrets, **0** `radaelliswimwear.com`/`myshopify.com` hardcodeados, **0** emails/teléfonos reales, **0** store IDs/theme IDs. Las 2 únicas coincidencias de "react" son menciones documentales (nombre de archivo `react-to-liquid-map.md` y la frase "footer React estático" en un comentario), no código funcional.

## Theme Check

```
35 files inspected with no offenses found.
```
0 errors / 0 warnings.

## READY FOR PHASE 02E — HOME

**YES**, condicionado a: (a) handoff de esta fase (`ai-handoff/`) actualizado y empujado a `origin/ai-handoff`, (b) confirmación de ChatGPT vía el mismo canal, (c) autorización explícita de Daniela para iniciar 02E (regla "una fase a la vez" de `ai-handoff/session-state.md`).
