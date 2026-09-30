# Home — Fase 02E

Documenta las 7 sections reales de Home (`hero.liquid`, `featured-categories.liquid`, `featured-collection-editorial.liquid`, `featured-products.liquid`, `recommended-products.liquid`, `promo-banner.liquid`, `newsletter-home.liquid`), el carrusel compartido (`snippets/product-carousel.liquid` + `assets/product-carousel.js` + `assets/component-carousel.css`) y la evolución mínima de `product-card-placeholder.liquid`. Basado en una auditoría directa (6 agentes en paralelo, lectura completa de código real) de `app/page.tsx` y sus 6 componentes reales — no solo del blueprint de la Fase 02.

## 1. Home actual reauditada

**Sí**, componente por componente, incluyendo sub-componentes (`HeroBackground`, `BrandPattern`, `CategoryCard`, `SunsetCarousel`/`ProductCarousel`, `ProductCard`). Orden real confirmado en `app/page.tsx`: Hero → CategoriesSection → SunsetCollection → FeaturedProducts → RecommendedForYou → PromoBanner → Newsletter → Footer (Footer ya cubierto en 02D).

## 2. Inventario de secciones reales encontradas

**7** (excluyendo Footer, ya en 02D):

| # | Componente real | Propósito |
|---|---|---|
| 1 | Hero | Portada — video o fondo decorativo, copy 100% editable |
| 2 | CategoriesSection | Categorías destacadas, borde a borde |
| 3 | SunsetCollection | Vidriera editorial "La belleza de sentirte tú" (colección Oasis Natural) |
| 4 | FeaturedProducts | "Productos destacados" |
| 5 | RecommendedForYou | "Recomendado para vos" — personalización client-side |
| 6 | PromoBanner | Banner de 20% de descuento, estático |
| 7 | Newsletter | Suscripción — EL real, confirmado en 02D que no vive en el Footer |

## 3. Sections Shopify creadas

**7** + 1 snippet compartido + su JS/CSS: `hero`, `featured-categories`, `featured-collection-editorial`, `featured-products`, `recommended-products`, `promo-banner`, `newsletter-home`.

## 4. Orden de sections

Idéntico al real, en `templates/index.json`: hero → featured-categories → featured-collection-editorial → featured-products → recommended-products → promo-banner → newsletter-home. (Footer sigue fuera de `index.json`, vive en `footer-group.json` y se renderiza en todas las plantillas vía `theme.liquid`.)

## 5. Hero implementado

**YES.** 2 ramas EXACT (con video / fallback), mismos breakpoints de aspect-ratio (`4/5 → sm:3/4 → md:16/10 → lg:min-h-90vh`), mismo overlay gradiente, misma jerarquía tipográfica, mismo copy default, misma animación de entrada escalonada (120ms/240ms).

## 6. Hero media strategy

Divergencia deliberada: el real usa video de Cloudinary + poster subido a mano. El theme usa el tipo nativo `video` de Shopify (`video_tag`) — sin Cloudinary (regla explícita de la fase), y Shopify genera su propio preview automático, así que no hace falta un campo de poster separado. Sin video cargado: fondo decorativo 100% CSS/SVG (3 blobs + textura), igual que el real.

## 7. Collection sections implementadas

`featured-categories` (bloques repetibles, 1 por categoría, `collection` picker por bloque), `featured-collection-editorial` (1 `collection` picker), `featured-products` (1 `collection` picker), `recommended-products` (1 `collection` picker, ver divergencia § 9).

## 8. Editorial sections implementadas

`featured-collection-editorial` — eyebrow + h2 serif itálico color/fuente editorial (`--color-editorial-navy`, `--font-editorial-serif`, tokens ya declarados en 02B), único uso real de ambos.

## 9. Newsletter Home status

**Implementado**, patrón nativo `{% form 'customer' %}` (`contact[tags]=newsletter`), mismo mecanismo que el bloque opcional del Footer (02D) — mismas claves de locale `general.newsletter.*`, sin duplicar copy de mecánica. Este SÍ es el newsletter real (confirmado en 02D), a diferencia del bloque del footer que es opcional/no incluido por defecto.

## 10. Carruseles/sliders status

**Implementado**, 1 solo mecanismo compartido (`snippets/product-carousel.liquid` + `assets/product-carousel.js`) reutilizado por 3 secciones (editorial/destacados/recomendados) — EXACT réplica del `ProductCarousel` real compartido: mismo `EPSILON=4px`, mismo cálculo de distancia de scroll (ancho de la primera tarjeta + 24px), mismo `scrollBy({behavior:'smooth'})`, mismas fracciones de ancho responsive (85%/62%/42%), scroll-snap nativo, flechas que aparecen/desaparecen según haya overflow real. `scrollBy` respeta `prefers-reduced-motion` (usa `behavior:'auto'` si está activo — mejora sobre el real, que no lo comprueba).

## 11. Animations mapping

| Real (Framer Motion / CSS) | Theme |
|---|---|
| `animate-fade-in`/`animate-fade-in-up` (Hero, CSS Tailwind custom, no Framer) | CSS `@keyframes` propios, mismos delays (120/240ms) |
| `animate-drift-1/2/3` (blobs Hero fallback) | CSS `@keyframes` propios, drift lento continuo |
| Zoom de imagen en hover (categorías/productos) | `transition: transform` + `scale(1.1)`/`scale(1.05)`, mismas duraciones (700ms categorías, 500ms productos) |
| Overlay/CTA "Ver producto" en hover | Replicado con CSS `:hover`/`:focus-visible`, mismas duraciones (300ms) |
| WishlistHeartButton "pop" (framer-motion, stiffness 400/damping 15) | **NO migrado** — el botón de favoritos sigue siendo 02F/wishlist (sin arquitectura elegida) |
| Todo respeta `prefers-reduced-motion` | Vía la regla global de `base.css` (transiciones/animaciones CSS) + el chequeo explícito en `product-carousel.js` (scroll JS) |

## 12. Product Card provisional dependency

`product-card-placeholder.liquid` evolucionó de forma **mínima y opt-in** (parámetros `show_hover_cta`, `category_label`, `sizes`) para sumar el overlay "Ver producto" + badge de categoría que sí existen hoy en Home — sin tocar hover-swap de imagen ni favoritos, que siguen siendo decisión de la Fase 02F. Los usos previos (`main-search.liquid`, `main-collection.liquid`, de 02A) no pasan estos parámetros nuevos y no cambian su render. `category_label` usa `product.type` como aproximación de `product.category` real (Shopify no tiene ese campo nativo).

## 13. Theme Editor configurability

Daniela puede cambiar sin código: video/copy del Hero, qué categorías se muestran y su disponibilidad (bloques), qué colección alimenta cada vidriera de productos, textos de PromoBanner y su link de política de envíos, copy del Newsletter. Los menús de categorías/colecciones nunca están hardcodeados (pickers nativos).

## 14. Desktop responsive: PASS
## 15. Mobile responsive: PASS
## 16. 320px safety

PASS — revisión estructural: Hero usa `aspect-ratio`/`min-height` fluidos sin ancho fijo; grid de categorías es 1 columna siempre; carrusel usa `overflow-x: auto` + anchos porcentuales (nunca px fijos); PromoBanner/Newsletter son columnas centradas con `max-width`. Sin Shopify Store no hay renderizado real disponible en esta fase — mismo criterio que 02A-02D.

## 17. Accessibility: PASS

Headings semánticos (`h1` Hero único, `h2` por sección, `h3` por card). Iconos decorativos `aria-hidden`. Videos decorativos sin controles ni audio (`muted`). Formulario de newsletter con `<label>` real. **Mejora deliberada sobre el real**: `featured-categories` agrega `focus-visible` visible + CTA visible al enfocar (no solo al hacer hover) — gap real encontrado en la auditoría del componente original, documentado como fix, no como decisión de marca.

## 18. Keyboard: PASS

Todos los triggers son `<a>`/`<button>` reales. Carrusel: tarjetas son focusables (son links), flechas son botones reales con `aria-label`. Disclosure de newsletter/errores usa elementos nativos.

## 19. Reduced motion: PASS

Cubierto por la regla global de `base.css` (todas las transiciones/animaciones CSS) + comprobación explícita en `product-carousel.js` para el scroll disparado por JS (no cubierto por CSS `scroll-behavior` cuando se pasa `behavior` explícito a `scrollBy`).

## 20. Estimated visual fidelity

**Alta (~90-95%)** en estructura/copy/spacing/color/tipografía — EXACT en la gran mayoría de valores (breakpoints, paddings, tracking, aspect-ratios, clases de animación). Principales divergencias funcionales (no visuales): sin Cloudinary (video nativo Shopify), sin deduplicación cross-section de productos, "Recomendado para vos" sin personalización real, sin toast al hacer clic en categoría no disponible.

## 21. CSS añadido

`section-hero.css`, `section-categories.css`, `section-product-showcases.css` (editorial + destacados + recomendados), `section-promo.css`, `section-newsletter-home.css`, `component-carousel.css` (compartido) — 6 archivos nuevos, más adiciones a `component-card.css` (overlay/badge del product card).

## 22. JS añadido

`assets/product-carousel.js` (~2 KB sin minificar) — única lógica nueva: visibilidad de flechas + scroll por tarjeta, para las 3 vidrieras de carrusel. Cero JS para Hero/Categorías/PromoBanner/Newsletter (100% CSS/HTML/form nativo).

## 23. Performance notes

- Hero: `video_tag` nativo de Shopify (sin SDK de terceros), sin `fetchpriority` explícito (Shopify no lo expone vía `video_tag`) — igual que el real, que tampoco lo declara.
- Imágenes: todas vía `snippets/image.liquid` (srcset responsive real) o `image_url`/`image_tag` nativos — sin URLs fijas.
- Carrusel: `loading` lazy por defecto en las tarjetas (heredado de `image.liquid`), sin librería externa.
- Sin JS innecesario: solo 1 archivo nuevo (~2 KB), sin frameworks, sin hydration.
- 7 sections nuevas + 1 snippet compartido + 1 JS + 6 CSS nuevos.

## 24. Theme Check errors: 0
## 25. Theme Check warnings: 0

```
44 files inspected with no offenses found.
```

## 26. JSON validation: PASS
## 27. Liquid validation: PASS
## 28. secrets: 0
## 29. store-specific IDs/domains: 0
## 30. Next/React refs funcionales: 0

Únicas coincidencias de grep fueron comentarios documentando que Cloudinary NO se usa (lo opuesto a una fuga).

## 31. Production tocada: NO
## 32. Staging tocado: NO
## 33. Shopify Store creada: NO
## 34. Deploy: NO
## 35. Push main: NO

## Divergencias documentadas (código real prioritario sobre el blueprint)

1. **Deduplicación cross-section**: el real coordina en el servidor (`app/page.tsx`) para que ningún producto se repita entre "La belleza de sentirte tú", "Productos destacados" y "Recomendado para vos" en la misma carga. Shopify no tiene una forma nativa de coordinar esto entre secciones independientes — cada una es su propio `collection` picker. Documentado, no resuelto con lógica nueva (sobreingeniería fuera de alcance).
2. **"Recomendado para vos" sin personalización real**: el real lee `localStorage` (historial de vistos) + pide productos recomendados a un endpoint propio, 100% client-side. El theme muestra una colección estática curada por Daniela en su lugar. La personalización real requeriría Storefront API + JS, fuera de alcance de 02E (mismo criterio que Wishlist/Search autocomplete en 02C: función que necesita arquitectura propia, no se improvisa).
3. **Toast "disponible muy pronto"** (categorías no disponibles): el real usa `sonner` para notificar. El theme simplemente no navega (botón inerte) — no se construyó un sistema de notificaciones nuevo solo para esto.
4. **PromoBanner no está atado a ningún % de descuento real** — confirmado en la auditoría: es texto estático incluso en el código actual, a diferencia de la announcement bar del header (02C). Se preserva esa misma naturaleza estática.
5. **Grid de categorías fijo por código (React) → bloques repetibles (Shopify)**: mismo resultado visual (borde a borde, 1 columna), pero ahora Daniela agrega/quita categorías sin código, en vez de depender de un flag en la base de datos.

## READY FOR PHASE 02F — PRODUCT CARD

**YES**, condicionado a: (a) handoff de esta fase actualizado y empujado a `origin/ai-handoff`, (b) confirmación de ChatGPT, (c) autorización de continuar (regla "una fase a la vez").

## CERO TAREAS DE SEGUNDO PLANO ACTIVAS
