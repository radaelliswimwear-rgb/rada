# Design tokens (Fase 02, sección 3)

Fuente: `app/globals.css` (Tailwind v4, config CSS-first vía `@theme` — no existe `tailwind.config.*`, confirmado por ausencia del archivo en la raíz del repo), `app/layout.tsx` (fuente), y uso real observado en componentes durante la investigación de esta fase.

Formato: cada sección separa **EXACT FROM CURRENT SITE** (valor literal, citado con archivo) de **PROPOSED SHOPIFY IMPLEMENTATION** (cómo llevarlo a `config/settings_schema.json` / CSS del theme). Nada inventado — donde Tailwind v4 no declara un override custom, se dice explícitamente que es el valor **default de Tailwind**, no un token de marca propio.

---

## Colores

### EXACT FROM CURRENT SITE
Bloque `@theme` completo de `app/globals.css` (líneas 32-53) — únicos hex reales del proyecto, "provistos por la clienta" (comentario explícito en el código):

| Token Tailwind | Hex | Uso real observado |
|---|---|---|
| `--color-brand-coral` | `#D6C5AE` | Nude/beige — igual valor que `--color-nude` |
| `--color-brand-blush` | `#F7F4EF` | Crema — fondos suaves, igual que `--color-background-soft` |
| `--color-brand-indigo` | `#171717` | Negro suave — igual que `--color-brand-surface` |
| `--color-brand-amber` | `#E7E7E7` | Gris claro — igual que `--color-border` |
| `--color-brand-crimson` | `#000000` | **Negro puro**, pese al nombre "crimson" — ver nota abajo |
| `--color-brand-bg` | `#000000` | Fondo de secciones oscuras (banner, futuro panel admin) |
| `--color-brand-surface` | `#171717` | Superficie oscura secundaria |
| `--color-brand-accent` | `#D6C5AE` | Acento nude |
| `--color-brand-hover` | `#C3AE8E` | Hover del acento nude (más oscuro) |
| `--color-brand-muted` | `#666666` | Texto secundario/atenuado |
| `--color-background` | `#FFFFFF` | Fondo base del sitio |
| `--color-background-soft` | `#F7F4EF` | Fondo suave (cards, secciones alternas) |
| `--color-text` | `#171717` | Texto principal |
| `--color-text-secondary` | `#666666` | Texto secundario |
| `--color-primary` | `#000000` | Color primario de marca |
| `--color-primary-contrast` | `#FFFFFF` | Texto sobre `primary` |
| `--color-nude` | `#D6C5AE` | Nude plano |
| `--color-border` | `#E7E7E7` | Bordes por defecto |

**Nota real, no inventada**: `brand-crimson` (usado como color de botones/CTA en toda la tienda — ej. `bg-brand-crimson` en `components/product-detail/product-variant-picker.tsx`, `components/currency/discounted-money.tsx`) vale **negro puro `#000000`**, no un rojo carmesí. El comentario del propio `globals.css` (líneas 24-31) lo explica: son nombres heredados de una paleta anterior ("vivos": acentos puntuales) **remapeados** a nude/negro tras el rebrand a una identidad más minimalista — el nombre de la variable quedó desactualizado respecto a su valor real. **Riesgo de migración**: si alguien nombra tokens nuevos en Shopify copiando literalmente "crimson" sin revisar el valor real, terminaría con rojo donde debería ir negro.

### PROPOSED SHOPIFY IMPLEMENTATION
- Declarar la misma paleta como **CSS custom properties** en `snippets/theme-styles-variables.liquid` (patrón estándar Online Store 2.0), alimentadas desde `settings_schema.json` (grupo `colors`, ver `theme-editor-plan.md`) para que Daniela pueda ajustar tonos sin tocar código.
- **Renombrar** `brand-crimson` a algo semánticamente correcto (ej. `brand-ink` o `brand-black`) en el nuevo theme — no arrastrar el nombre engañoso.
- No existe modo oscuro real (`@custom-variant dark` está deliberadamente neutralizado, `globals.css` líneas 6-15, para que ninguna utilidad `dark:` se active nunca) — el theme Shopify tampoco necesita soporte de dark mode.

---

## Tipografía

### EXACT FROM CURRENT SITE
`app/layout.tsx` líneas 15-25: familia real de marca es **"Mont"** (fuente comercial, sin licencia disponible en este proyecto — comentario explícito). Sustituto implementado: **Poppins** (Google Fonts) vía `next/font/google`, `subsets: ["latin"]`, `weight: ["400","500","600","700"]`, expuesta como variable CSS `--font-poppins`. Mapeo documentado en el propio comentario: Poppins 600/400 ≈ "Mont Semibold"/"Mont Book" (misma familia geométrica).

No hay escala de `font-size`/`line-height`/`font-weight` custom declarada en `@theme` — los componentes usan las utilidades **default** de Tailwind (`text-xs`, `text-sm`, `text-lg`, etc.) elegidas caso por caso, no una escala tipográfica de marca formalizada.

### PROPOSED SHOPIFY IMPLEMENTATION
- **Decisión pendiente de Daniela, no técnica**: ¿licenciar "Mont" para Shopify, o continuar con Poppins? Poppins está disponible nativamente en la librería de fuentes de Shopify (sin costo), Mont requeriría comprar la licencia y subirla como fuente custom (`assets/*.woff2` + `@font-face` en el theme).
- Mientras no haya decisión: usar Poppins vía el selector de fuentes nativo de Shopify (`settings_schema.json`, tipo `font_picker`), pesos 400/500/600/700.
- Formalizar una escala tipográfica explícita (`--font-size-xs` … `--font-size-3xl`) en el theme, ya que el sitio actual no tiene una declarada — oportunidad de limpieza, no una migración 1:1.

---

## Espaciado, breakpoints, radios, sombras, grid

### EXACT FROM CURRENT SITE
Ninguno de estos tiene override en `@theme` — **son el valor DEFAULT de Tailwind v4**, no tokens de marca declarados. Valores reales observados por uso repetido en componentes (Tailwind arbitrary values y utilidades estándar, citados por los agentes de investigación de esta fase):

| Categoría | Valores reales observados | Nota |
|---|---|---|
| Breakpoints | `sm` `md` `lg` `xl` (defaults Tailwind: 640/768/1024/1280px) | Sin override; `lg:` es el quiebre más usado (nav desktop, filtros de catálogo) |
| Border radius | `rounded-full` (botones/pills/badges), `rounded-xl` (product cards, imágenes) | Sin escala custom — elegido por componente |
| Max width | `max-w-7xl` (navbar, contenedores de página), `max-w-3xl` (páginas legales/blog), `max-w-2xl` (404) | Defaults Tailwind |
| Aspect ratios | `aspect-[3/4]` (product card), `aspect-[4/5]` / `sm:aspect-[3/4]` / `md:aspect-[16/10]` (hero video responsive), `16:9` (category card, banner colección `12/5`) | Todos arbitrary values, no una escala declarada |
| Gap/spacing en grids | `gap-6` (carrusel sunset), escala default de Tailwind en el resto | Sin token de marca |
| Sombras | `shadow-sm`, `shadow-lg` (hover de product card) | Defaults Tailwind, sin custom |
| Transiciones | `duration-200` (nav links, botones), `duration-300` (header al hacer scroll), `duration-500` (barra de envío gratis), `duration-700` (swap de imagen en hover de product card) | Sin token nombrado, cada componente elige su duración |
| Animación con resorte (framer-motion) | `spring, stiffness: 400, damping: 15` (pop del corazón de wishlist) | Config puntual del componente, no un token reutilizable |

### PROPOSED SHOPIFY IMPLEMENTATION
- No hay necesidad de "migrar" estos valores 1:1 porque nunca fueron una escala de marca formal — son el default de Tailwind. Para el theme Shopify (que no puede depender de Tailwind runtime sin un paso de build propio) se recomienda declarar un set pequeño y consistente de CSS custom properties (`--radius-pill: 999px`, `--radius-card: 0.75rem`, `--transition-fast: 200ms`, `--transition-base: 300ms`) que reproduzcan los valores reales de arriba, en vez de reinventar una escala nueva.
- `rounded-full` en botones es un patrón de marca consistente (confirmado también en el ejercicio previo de theme Dawn de esta misma migración, `buttons_radius: 40` — ver `docs/` de la fase de mockup visual) — mantenerlo como decisión de diseño explícita, no accidental.

---

## Iconografía

### EXACT FROM CURRENT SITE
Librería: `@heroicons/react` (outline y solid, ej. `HeartIcon`, `EyeIcon`, `MagnifyingGlassIcon`, `Cog6ToothIcon`) para casi todo. **Excepción real**: los íconos sociales (Facebook/Instagram/TikTok/**WhatsApp**) son SVG propios en `components/icons/social-icons.tsx` / `components/icons/whatsapp-icon.tsx` — WhatsApp específicamente NO viene de heroicons (no existe ahí) y se mantuvo como asset custom. Tamaños observados: `h-3.5 w-3.5` (botón vista rápida), `h-4 w-4` (corazón de wishlist), sin escala de tamaño de ícono declarada como token.

### PROPOSED SHOPIFY IMPLEMENTATION
- Shopify no trae Heroicons nativamente. Opciones: (a) empaquetar los SVG de Heroicons usados como `snippets/icon-*.liquid` (patrón estándar de temas Shopify, ligero, sin dependencia runtime), o (b) usar el set de iconos nativo del theme base elegido y solo agregar como custom los que falten (WhatsApp, seguro). Se recomienda (a) para fidelidad visual exacta.

---

## Logo y assets de marca

### EXACT FROM CURRENT SITE
Logo: `/logo/radaelli-swimwear.png`, renderizado en el header a `h-20 w-56` con `next/image fill` + `priority` (`components/layout/navbar/index.tsx`). Fondo del Hero cuando no hay video: `components/home/hero-background.tsx` (3 manchas de luz difusas, CSS puro, `@keyframes drift-1/2/3`) + `components/home/brand-pattern.tsx` (patrón decorativo). Imágenes de producto: 100% Cloudinary (`res.cloudinary.com`, confirmado en `next.config.ts` `remotePatterns` y en los 95 URLs reales de `public-scrape-raw.json`).

### PROPOSED SHOPIFY IMPLEMENTATION
Ver `storefront-blueprint.md` sección "Asset reuse audit" para la clasificación completa (reutilizar/reprocesar/re-subir/reconstruir/no migrar) de cada tipo de asset.
