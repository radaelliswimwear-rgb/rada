# Global Styles & Visual Foundation — Fase 02B

Documenta la fundación visual construida en `shopify-migration/theme-src/assets/`. Complementa (no reemplaza) `theme/design-tokens.md` (Fase 02) — donde hay divergencia, **el código real de `app/globals.css` es la fuente prioritaria**, tal como exige esta fase.

## 1. Reauditoría del estilo actual (antes de tocar CSS)

Se releyó `app/globals.css` completo y se grepeó uso real de clases en `components/` (botones, headings, badges de estado). Resultado: **una divergencia real encontrada, no documentada en `design-tokens.md`**:

- `components/home/sunset-collection.tsx` usa `font-serif text-3xl italic tracking-tight text-[#1c2b45]` para el h2 "La belleza de sentirte tú" — un color (`#1c2b45`, navy oscuro) y una familia tipográfica (`font-serif`, fallback del sistema, sin webfont cargado) que **no existen en el bloque `@theme` de `app/globals.css`**. Es un tratamiento editorial de un solo uso, deliberado, no un color de marca declarado. Se agregó como `--color-editorial-navy` y `--font-editorial-serif` en `variables.css`, documentado como excepción puntual (clase `.h-editorial`), no como parte de la paleta principal.

Todo lo demás de `design-tokens.md` se reconfirmó exacto contra el código real: los 17 tokens de color, `Poppins` como sustituto de "Mont" (sin licencia), ausencia de escala de spacing/radios/sombras propia (default de Tailwind).

**Hallazgos adicionales de la reauditoría** (grounded en grep real, no en el blueprint):
- Jerarquía de headings real: h1 = `text-3xl sm:text-4xl` en la mayoría de páginas (cuenta, wishlist, confirmación de pedido), `text-4xl sm:text-5xl` en catálogo, hasta `text-4xl sm:text-5xl lg:text-6xl` **solo** en el Hero. `font-semibold tracking-tight` es constante en todos.
- Sistema de botones real: **100% `rounded-full`**, sin excepción, en los 12+ usos reales revisados. Primario = `bg-brand-crimson text-white hover:opacity-90`; secundario/outline = `border-neutral-300 text-neutral-700 hover:border-brand-crimson hover:text-brand-crimson`.
- Colores de estado (success/warning/error) **no están en `@theme`** pero se usan de forma consistente vía utilidades Tailwind default: error = `red-600`/`red-500`, warning = `amber-600/700/800` + fondo `amber-50`, success = `green-600/700` y `emerald-700` (un caso, "disponible" en wishlist). Se formalizaron con esos mismos valores hex reales, no inventados.

## 2. Typography system

`--font-body`/`--font-heading` = Poppins (mismo family, el sitio actual no distingue una fuente de heading separada). Escala `--font-size-caption` → `--font-size-display`, con `clamp()` en los niveles de heading (h2 en adelante) para reproducir la progresión responsive real (`text-2xl sm:text-3xl` → `clamp()` equivalente) sin depender de los breakpoints exactos de Tailwind. `--font-size-display` queda reservado explícitamente para el Hero (única aparición real de `text-6xl`), nunca aplicado por defecto a un `<h1>`.

## 3. Color system

Organizado en grupos semánticos (BRAND/BACKGROUND/SURFACE/TEXT/MUTED/BORDER/ACCENT/SUCCESS/WARNING/ERROR/OVERLAY), cada uno como alias de un token `--color-brand-*` EXACT — sin perder trazabilidad. **No se inventó ninguna paleta nueva.** Ver `variables.css` para la lista completa y `theme-src/snippets/css-variables.liquid` para cómo se conecta a `settings_schema.json`.

## 4. Spacing system

`--space-1` (4px) a `--space-24` (96px), sobre la escala default de Tailwind (múltiplos de 0.25rem) que el sitio ya usa de facto. `--space-6` (24px) es EXACT — coincide con el `gap-6` real del carrusel sunset.

## 5. Container / layout system

`.page-width` (1280px, gutters 16/24/32px mobile/tablet/desktop), `.page-width--narrow` (768px), `.page-width--wide` (1440px, propuesto para editorial a pantalla ancha, sin equivalente exacto real), `.container--form` (672px). `.section`/`.section--tight`/`.section--large` para padding vertical consistente entre secciones, con reducción automática en mobile.

## 6. Responsive foundation

Mobile-first real: todo el CSS parte de 1 columna/estado base y agrega complejidad desde `min-width`. Breakpoints = defaults de Tailwind (640/768/1024/1280), reconfirmados sin override en esta reauditoría. No se recreó Tailwind — solo utilidades puntuales con uso real inmediato (`.grid`, `.stack`, `.cluster`, `.inline`, `.center`).

## 7. Button system

`.button` base + `--primary`/`--secondary`/`--outline`/`--ghost`/`--link`, estados hover/focus-visible/disabled/`.is-loading` (sin loader complejo, solo el hook de clase), tamaños `--small`/default/`--large`. `border-radius: var(--radius-pill)` en todos, consistente con el 100% real observado.

## 8. Form foundation

`.field`/`.input`/`.textarea`/`.select` con borde+radio+foco consistente (el sitio actual no declara una escala propia de inputs). Checkbox/radio se dejan **nativos sin restylear** (mismo criterio de accesibilidad que el sitio actual), solo alineados con `.checkbox-row`/`.radio-row`. `accent-color` usa `--color-brand`. Preparado para login/búsqueda/cupón/contacto — ninguna de esas funcionalidades implementada acá.

## 9. Media / image foundation

`.media`/`--square`/`--portrait`(3:4, EXACT product card)/`--landscape`(16:9, EXACT category card)/`--banner`(12:5, EXACT banner de colección)/`--cover`. Sin galería/lightbox (eso es 02H).

## 10. Card foundation

`.card`/`__media`/`__content`/`__title`/`__meta`/`__price`. El placeholder de producto (`product-card-placeholder.liquid`) ya lo usa — **no se convirtió en el ProductCard definitivo** (sin hover-swap, sin favoritos, sin animación), eso sigue siendo 02F.

## 11. Price system

`.price`/`--sale`/`__regular`/`__compare`/`__discount` — `snippets/price.liquid` actualizado a esta nomenclatura (antes usaba `__current`/`__compare-at`/`__badge`, Fase 02A). `.price__discount` con `font-size: 0.625rem` es EXACT (`text-[10px]` real del badge de descuento).

## 12. Badge foundation

`.badge`/`--sale`/`--sold-out`/`--new`/`--neutral`. Solo styling, sin reglas comerciales de cuándo aplica cada uno (eso es 02F/02G).

## 13. Grid foundation

`.grid` fluido (`auto-fill, minmax(240px, 1fr)`) para contenido genérico/editorial. `.grid--2/--3/--4` con columnas fijas mobile-first, para el caso real donde el sitio SÍ fuerza un número exacto (selector de columnas de catálogo).

## 14. Stack / Cluster / Inline / Center

4 primitivas de layout (patrón "Every Layout"), no un framework de utilidades. `.stack` (vertical), `.cluster` (horizontal con wrap, para chips/badges), `.inline` (fila sin wrap), `.center` (centrado ambos ejes).

## 15. Accessibility

**Contraste WCAG 2.1 calculado (relative luminance real, no estimado)** — ver comentario completo en `variables.css`:

| Par | Ratio | Resultado |
|---|---|---|
| `--color-text` (#171717) sobre blanco | **17.9:1** | Safe for text (AAA) |
| `--color-text-secondary` (#666666) sobre blanco | **5.7:1** | Safe for text (AA normal) |
| `--color-ink`/`--color-brand-crimson` (#000000) sobre blanco | **17.9:1** | Safe for text (AAA) |
| `--color-nude` (#D6C5AE) sobre blanco | **1.7:1** | **Decorative only** — NO usar para texto |
| `--color-brand-hover` (#C3AE8E) sobre blanco | **2.2:1** | **Decorative only** |
| `--color-nude` sobre `--color-brand-surface`/negro | **10.6–12.5:1** | Safe for text (solo sobre superficie oscura) |

**No se cambió la identidad de marca** por estos resultados (regla explícita de esta fase) — se documentó el uso seguro: nude/nude-hover son acento decorativo o texto SOLO sobre fondo oscuro, nunca texto sobre blanco.

Preservado del sitio actual: foco visible global, skip-link, `prefers-reduced-motion` sistemático (antes era puntual — ver Motion abajo, mejora real). Agregado nuevo: `.tap-target` (mínimo 44×44px, WCAG 2.5.5/2.5.8), aplicado ya al header placeholder.

## 16. Motion foundation

`--motion-fast/normal/slow` = alias de los `--transition-*` EXACT ya documentados (200/300/500ms). `--motion-spring-reference` documenta el resorte real de framer-motion (`stiffness:400 damping:15`) como referencia para el keyframe CSS que la Fase 02F deberá construir — **framer-motion no se migra**. Toda animación queda cubierta por la regla global `prefers-reduced-motion` de `base.css` (mejora real: antes era puntual — 1 regla CSS + 1 componente — ahora es sistemática).

## 17. Z-index system

`--z-base`(1) → `--z-header`(50, EXACT) → `--z-dropdown`(55) → `--z-drawer`(60) → `--z-overlay`(65) → `--z-modal`(70) → `--z-toast`(80). Solo `--z-header` es EXACT (confirmado `z-50` real); el resto es PROPOSED, a validar cuando existan drawer/modal/toast reales (02C/02H/02I).

## 18. Global states

`.state-empty`, `.state-notice`/`--warning`/`--error`/`--success`, `.state-skeleton` (pulso CSS, respeta `prefers-reduced-motion` vía la regla global). Sin comportamiento JS — solo styling, tal como pide esta fase.

## 19. Icon foundation

`snippets/icon.liquid` actualizado: cada `<svg>` ahora lleva `class="icon icon--{size}"` (antes, Fase 02A, no tenía clase). `.icon`/`--sm`/`--md`/`--lg` en `component-media.css`. `currentColor` + `aria-hidden="true" focusable="false"` en los decorativos; el texto accesible sigue viviendo en un `.visually-hidden` adyacente dentro del control interactivo, nunca en el propio SVG.

## 20–21. Organización de archivos

`base.css` (Reset/Typography/Layout/Links/Accessibility/Motion/Global states) + 5 archivos de componente (`component-button.css`, `component-form.css`, `component-media.css`, `component-card.css`, `component-grid.css`) — se dividió porque el conjunto completo (botones+forms+media+cards+precio+badges+grids+utilidades) sí ameritaba mantenibilidad separada, no por regla arbitraria. `variables.css` reorganizado semánticamente, sin perder ningún comentario de procedencia EXACT/PROPOSED de la Fase 02A.

## 22–23. Theme settings → CSS variables

`snippets/css-variables.liquid` (nuevo) conecta 8 colores + ancho de página de `settings_schema.json` a los `--color-*`/`--container-width` reales, incluido en `theme.liquid` justo después de `variables.css` para ganar por cascada. **Editable pero controlado**: no se exponen los 17 tokens crudos ni se permite introducir una paleta desconectada de la marca — solo los 8 colores semánticos ya en el schema. `settings_data.json` ya reflejaba la identidad real (valores idénticos a los defaults de `variables.css`); no requirió cambios.

## 24. Placeholder polish

Los 9 placeholders (`home-placeholder`, `main-product`, `main-collection`, `main-cart`, `main-search`, `main-page`, `main-blog`, `main-article`, `main-404`) + `header.liquid`/`footer.liquid` ya usan `.page-width`, `.stack`/`.cluster`/`.inline`/`.center`, `.grid`, `.badge`, `.button`, `.state-empty`, headings reales (`h1`–`h5`). Ninguno se convirtió en diseño final — siguen siendo foundation, ahora sin verse "rotos".

## 25. Mobile-first review (estructural/offline — sin Shopify Store, según instrucción de esta fase)

Revisión de `variables.css`/`base.css`/`component-*.css` a 320/375/390/430/768/1024/1440px:

- **Sin overflow horizontal esperado**: `.page-width` usa `padding-inline` fijo + `max-width: 100%` implícito, `.grid--2/3/4` parte de 1 columna en mobile.
- `--font-size-display`/`--font-size-h1` usan `clamp()` con mínimos explícitos (2.25rem/1.875rem) — no colapsan por debajo de un tamaño legible ni crecen sin control en pantallas angostas.
- **Limitación real, a propósito, NO corregida acá**: el header placeholder (`header.liquid`) no tiene menú mobile / hamburguesa — a 320-430px, si `main_menu` tiene varios links, el `<nav>` puede desbordar o apretarse. Esto es intencional: el menú mobile real es explícitamente trabajo de la Fase 02C ("NO implementar mobile menu" en esta fase) — se documenta como limitación conocida del placeholder, no como un bug de esta fase.
- **Limitación real, a propósito, NO corregida acá**: `main-cart.liquid` usa `.inline` (fila sin wrap) para cada línea de producto — a 320px puede apretarse con imagen+título+talla+cantidad+precio en una sola fila. El carrito real (drawer, AJAX, diseño propio) es explícitamente 02I — se deja documentado, no se rediseña la fila acá.
- Botones (`.button`) con `padding: var(--space-3) var(--space-6)` + texto `uppercase` mantienen legibilidad y objetivo táctil adecuado (>44px de alto real) en todos los anchos probados estructuralmente.

## 26. Performance budget

| Recurso | Tamaño (sin minificar) |
|---|---|
| `variables.css` | 11.8 KB |
| `base.css` | 7.8 KB |
| `component-button.css` | 3.3 KB |
| `component-card.css` | 3.1 KB |
| `component-form.css` | 3.0 KB |
| `component-grid.css` | 2.7 KB |
| `component-media.css` | 1.9 KB |
| **CSS total** | **~33.6 KB** |
| `theme.js` | **~1.5 KB** |

**JS global extremadamente pequeño**, tal como pide el objetivo de esta fase — sin ninguna interacción implementada todavía (solo el patrón `RadaelliElement`). El CSS crecerá en las fases de componente definitivo (02C–02L); Shopify sirve estos archivos ya minificados/comprimidos en producción, este número es el tamaño de archivo fuente, no el de red.

## Decisiones no tomadas (a propósito)

- No se decidió la arquitectura de wishlist ni Customer Accounts (siguen pendientes, ver `theme/storefront-blueprint.md`).
- No se construyó header/footer/home/PDP/colección/carrito definitivos — solo su fundación visual.
