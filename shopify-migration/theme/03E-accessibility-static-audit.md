# 03E — Auditoría estática de accesibilidad del theme

> **Estado tras RC1.5 (2026-09-29, 14:00).**
>
> **Corregidos, probados** (tests "R A11y" / "Q Contraste" / "R Orden") **y pusheados:**
>
> | ID | Corrección |
> |---|---|
> | A11Y-02 | Links de contenido subrayados, EXACT real (`underline` en los legales) |
> | A11Y-03 | El orden no navega con flechas; Enter / "Aplicar" / mouse sí |
> | A11Y-04 | "Precio anterior" visually-hidden en ficha y tarjetas, con `position:relative` para no generar overflow en carruseles |
> | A11Y-05 | `role="group"` en las redes |
> | A11Y-06 | `aria-current` en chips activos, en lugar de `aria-pressed` sobre `<a>` |
> | A11Y-07 | `autocomplete="email"` |
> | A11Y-08 | Sin botón "Vista rápida" inerte: overlay "Ver producto"; el overlay no captura taps |
> | A11Y-09 | Foco de la tarjeta hacia adentro |
> | A11Y-10 | La flecha del carrusel pasa el foco a la otra |
> | A11Y-11 | Precio de sugerencias #666, 5,27:1 |
> | A11Y-12 | Alt "Guía de tallas", EXACT real |
> | A11Y-15 | Se re-anuncia un conteo igual |
> | A11Y-16 | `aria-haspopup`/`aria-controls`/`aria-expanded` en el botón de filtros |
> | A11Y-17 | Contador del visor `aria-live` |
> | A11Y-20 | Sin `aria-haspopup` en el disclosure del header |
>
> - **Además, contraste real detectado en vivo:**
>   - el **h1 del banner de colección** salía #171717 sobre #0a0a0a (invisible); ahora hereda el blanco, EXACT real;
>   - el mismo defecto latente estaba en el **h1 del hero con video**.
>   - Mutantes 26–27 y 32–45 detectados.
> - **Refutado:** A11Y-18, porque el banner (y su h1) se renderiza siempre; `collection_show_banner` solo afecta la media.
> - **No corregido, requiere decisión de marca (Daniela):** A11Y-01/A11Y-14, CTAs blancos sobre arena (#d6c5ae, 1,69:1).
>   - Es **idéntico al sitio real** (`bg-brand-coral text-white`).
>   - Opciones: texto oscuro sobre arena (#171717 → 8,34:1) o un arena más oscuro. Cambia el look de la marca.
> - **Latentes que dependen de la media o de S&D, documentados:**
>   - A11Y-13: los videos en autoplay sin control de pausa, igual que el real. Resolver al subir los videos: botón de pausa o `prefers-reduced-motion`;
>   - A11Y-19: botón "próximamente" con encabezado adentro. Es EXACT real y hoy no se ve, porque las 4 categorías están disponibles.
> - **Medición en vivo de la estructura** (Home, Colección, Ficha):
>   - 1 h1, sin saltos de encabezados, landmarks completos, skip link, `lang="es"`;
>   - 0 controles sin nombre/label, 0 imágenes sin alt, 0 IDs duplicados.
>   - El teclado real no se pudo probar en vivo (ventana de Chrome en segundo plano). Está cubierto offline con el Liquid real, y ahora con `eq` por identidad de nodos (antes las aserciones de foco no comparaban nada).

- **Fecha:** 2026-09-29. **Alcance:** `shopify-migration/theme-src` (RC1.4 + cambios locales 03E sin pushear): `layout/`, `sections/`, `snippets/`, `assets/*.js`, `assets/*.css`, `config/`, `locales/`; contenido legal de `content/legal/`.
- **Método:** lectura de código, sin navegador ni lector de pantalla. Contrastes **calculados** con la fórmula WCAG 2.x, incluida la composición de colores con transparencia. El script está en el scratchpad de la sesión; no se agregó al repo.
- **Complementa, no reemplaza,** el pase de teclado en vivo que hace otra persona. La sección 9 lista lo que ese pase tiene que confirmar.
- **No se editó** ningún archivo del theme ni de la app. Solo se escribió este reporte.
- **Referencia:** WCAG 2.2 nivel AA. Cuando algo es buena práctica y no un criterio, se aclara.
- **Verificación adversarial (2026-09-29):** se recalcularon todos los contrastes de la sección 7 y se reabrieron las citas `archivo:línea`. Cambios respecto de la versión del productor:
  - A11Y-01: la corrección también tiene que fijar el texto blanco en los 2 hovers (si no, 1,17:1);
  - A11Y-15 y A11Y-16 pasan a robustez y buena práctica; A11Y-17 queda como discutible;
  - áreas táctiles: no todos los controles miden 24 px o más (sección 6);
  - `.shopify-policy__body` queda NOT_VERIFIED; se agregan la política de reembolso (2 links, ya publicada) y los blobs del hero (riesgo bajo de 2.2.2);
  - precisiones menores en A11Y-08, A11Y-24, E7, encabezados y la sección 8.

## Estados usados

- **CONFIRMADO:** el código produce el defecto hoy, con la configuración actual del Dev Store (`templates/*.json`, `config/settings_data.json`).
- **LATENTE:** el código tiene el defecto, pero solo aparece cuando se active un contenido o ajuste pendiente (video del hero, guía de tallas, Search & Discovery, etc.).
- **PROBABLE:** es una estimación sobre degradados o fotos. Hay que medirlo en vivo con un cuentagotas.

## 1. Resumen ejecutivo

- **Base sólida.** El theme ya resuelve bien varias cosas:
  - skip link y `lang` dinámico;
  - anillo de foco global de 5,74:1;
  - `<dialog>` nativo para carrito, guía de tallas y visor;
  - combobox de sugerencias con `aria-activedescendant`;
  - radios reales con `<fieldset>` para las tallas;
  - live regions en carrito, ficha y favoritos;
  - `prefers-reduced-motion` global, respetado también en JS;
  - botones de ícono y controles de 28 px o más; los links y botones de texto más chicos (~18–20 px de alto) pasan 2.5.8 por la excepción de espaciado (ver sección 6).
- **Defectos confirmados en el código hoy (13).** 10 fallan un criterio A/AA (A11Y-17 es discutible); A11Y-08, A11Y-15 y A11Y-16 son buena práctica o robustez, no fallas estrictas. Los 5 de mayor prioridad:

| Prioridad | Defecto | Criterio | Hallazgo |
|---|---|---|---|
| 1 | CTAs del Home en blanco sobre nude: **1,69:1** | 1.4.3 AA | A11Y-01 |
| 2 | Links del texto de las páginas legales y políticas sin ninguna marca visual | 1.4.1 A | A11Y-02 |
| 3 | El `select` de orden recarga la página con cada flecha del teclado | 3.2.2 A | A11Y-03 |
| 4 | El precio tachado no se anuncia como "precio anterior" | 1.3.1 A | A11Y-04 |
| 5 | Botón "Vista rápida" inerte: una parada de Tab muerta por tarjeta (hasta 24 por página) | — | A11Y-08 |

  Los otros ocho confirmados:
  - anillo de foco recortado en la imagen de la tarjeta (A11Y-09);
  - el foco se pierde en las flechas del carrusel (A11Y-10);
  - `role="list"` sin ítems en el footer (A11Y-05);
  - newsletter sin `autocomplete="email"` (A11Y-07);
  - contraste del precio en la sugerencia activa (A11Y-11);
  - conteo de sugerencias repetido que no se reanuncia (A11Y-15, robustez);
  - botón de filtros mobile sin estado inicial (A11Y-16, buena práctica);
  - cambio de imagen en el visor no anunciado (A11Y-17).
- **Latentes que hay que corregir antes de activar el contenido pendiente:**
  - video del hero sin pausa y sin respetar movimiento reducido (A11Y-13); el video M01 es owner-only #4;
  - guía de tallas con `alt=""` (A11Y-12); M14;
  - chips de filtro con `aria-pressed` sobre links (A11Y-06); se activa con Search & Discovery.

## 2. Hallazgos

Severidad:

- **Alta:** bloquea o falla un criterio A/AA en un flujo principal.
- **Media:** falla un criterio con impacto acotado.
- **Baja:** impacto menor o buena práctica.

### Confirmados

**A11Y-01. CTA en blanco sobre nude**

- **Criterio:** 1.4.3 AA. **Severidad:** Alta.
- **Dónde:**
  - `assets/section-hero.css:239-243` (`.section-hero__cta--fallback { color: #fff }`);
  - `assets/section-promo.css:51-62` (`.section-promo__cta`, `color: #fff` en :59).
- **Evidencia:**
  - `#fff` sobre `--color-accent` `#d6c5ae` da **1,69:1**, con texto de 14 px.
  - Hoy el Home usa la rama sin video del hero: `templates/index.json` no tiene `hero_video`, y el CTA sale con el default del schema (`hero.liquid:89-94`).
  - El promo usa `cta_label` por defecto (`promo-banner.liquid:59-63`).
  - El mismo patrón ya se había corregido en el carrito (`component-cart.css:418-425`) y en favoritos (`section-wishlist.css:127-141`).
- **Corrección mínima (2 reglas + 2 hovers):**
  - `color: var(--color-text-primary);` en `.section-hero__cta--fallback` y `.section-promo__cta` (10,63:1);
  - **y además** `color: var(--color-primary-contrast);` en `.section-hero__cta--fallback:hover` (`section-hero.css:245-247`) y `.section-promo__cta:hover` (`section-promo.css:64-66`). Esos hovers hoy solo cambian el fondo a `--color-brand` (`#000`): si solo se cambia el color base, el hover queda `#171717` sobre negro = **1,17:1**. Con el texto blanco explícito vuelve a 21:1.
  - Es el mismo patrón que ya usan el carrito (`component-cart.css:428-433`) y favoritos (`section-wishlist.css:143-148`), con el hover dentro de `@media (hover: hover)`.
  - *(Corrección del verificador: la versión anterior de este reporte daba por hecho que el hover mantenía el texto blanco.)*

**A11Y-02. Links del texto enriquecido indistinguibles**

- **Criterio:** 1.4.1 A (F73). **Severidad:** Alta.
- **Dónde:**
  - `assets/base.css:207-210` (`a { color: inherit; text-decoration: none; }`);
  - ninguna regla para `.main-page__content a` (`main-page.liquid:10-12`), `.main-article__content a` (`main-article.liquid:22-24`), la descripción del producto (`main-product.liquid:269-270`) ni `.shopify-policy__body a`.
- **Evidencia:**
  - `/pages/garantia` ya está migrada y tiene 2 links dentro del texto: `/policies/refund-policy` y WhatsApp (`content/legal/garantia.html`).
  - Se ven igual que el texto que los rodea: mismo color y sin subrayado.
  - Lo mismo va a pasar en envíos (3 links), términos (5) y privacidad (3)/cookies (2) cuando se creen.
  - La política de reembolso (ya migrada, `content/legal/devoluciones.html`) tiene 2 links: `/pages/garantia` y WhatsApp. Shopify la dibuja con su propia plantilla de políticas dentro de `theme.liquid`, así que la regla global `a { text-decoration: none }` probablemente también la alcanza. Queda NOT_VERIFIED hasta verla en vivo.
- **Corrección mínima:** en `base.css`, `.main-page__content a, .main-article__content a, .product-accordion__content a:not([class]), .shopify-policy__body a { text-decoration: underline; text-underline-offset: 2px; }`.
  - `.shopify-policy__body` es una clase que genera Shopify en `/policies/*`. No aparece en el repo ni se confirmó en documentación oficial: NOT_VERIFIED. Confirmar el nombre con el inspector en `/policies/refund-policy` antes de aplicar; si no coincide, usar el contenedor que exista.

**A11Y-03. El orden cambia de contexto al cambiar el valor**

- **Criterio:** 3.2.2 A. **Severidad:** Media.
- **Dónde:** `snippets/collection-filters.liquid:85` (`onchange="this.form.submit()"`).
- **Evidencia:**
  - `settings_data.json` tiene `collection_enable_sorting: true`, así que el `select` se dibuja hoy.
  - En Chrome y Firefox de Windows, la flecha ↓ sobre el `select` cerrado dispara `change` y la página navega en el primer toque. Es comportamiento conocido de esos navegadores; no se probó en vivo (sección 9).
  - Recorrer las opciones con el teclado es imposible sin recargar.
  - Ya existe el botón "Aplicar" (`:92-95`).
- **Corrección mínima:** quitar `onchange` y dejar el envío con "Aplicar" o Enter. Si se quiere conservar el envío automático, tiene que ir con aviso previo visible.

**A11Y-04. Precio tachado sin semántica**

- **Criterio:** 1.3.1 A. **Severidad:** Media.
- **Dónde:** `snippets/price.liquid:42-44` (versión interactiva) y `:55-57` (tarjetas y favoritos).
- **Evidencia:**
  - `<s>` no se anuncia por defecto, así que un lector lee "$183.920 $229.900 -20%" sin decir cuál es el precio anterior.
  - Afecta a los productos con `compare_at` en tarjetas, ficha y favoritos. Hoy son todos: en `import/shopify-products-03c.csv`, 98 de 98 variantes tienen un compare-at mayor que el precio.
  - El carrito ya lo resuelve: `cart-line-item.liquid:108`, con `cart.item.compare_at` = "Precio anterior".
- **Corrección mínima:** `<span class="visually-hidden">{{ 'cart.item.compare_at' | t }}</span>` dentro de `.price__compare`, antes de `<s>`, en las dos ramas. Tiene que quedar **fuera** de `<s data-price-compare-value>`, porque `product-form.js:175` reescribe ese nodo.

**A11Y-05. `role="list"` sin `listitem`**

- **Criterio:** 1.3.1 / 4.1.2 A (ARIA required children). **Severidad:** Baja.
- **Dónde:** `sections/footer.liquid:55`.
- **Evidencia:** el `div role="list"` contiene los `<a>` de redes directamente. `settings_data.json` tiene las 4 redes cargadas, así que el bloque se dibuja hoy.
- **Corrección mínima:** cambiar a `role="group"` (conserva `aria-label`) o envolver cada link en `<span role="listitem">`.

**A11Y-07. Email de newsletter sin propósito identificado**

- **Criterio:** 1.3.5 AA. **Severidad:** Baja.
- **Dónde:** `sections/newsletter-home.liquid:27-34`. También `footer.liquid:177-184`, latente porque el bloque no está en el orden.
- **Corrección mínima:** `autocomplete="email"`.

**A11Y-08. "Vista rápida" inerte en cada tarjeta**

- **Criterio:** buena práctica; afecta el orden de foco (2.4.3). **Severidad:** Media.
- **Dónde:** `snippets/product-card.liquid:161-167`, pedido por `main-collection.liquid:80` y `main-search.liquid:92`.
- **Evidencia:**
  - Un grep de `quick-view` solo encuentra CSS y locales; ningún JS escucha `data-quick-view-trigger`. `README.md:233` lo confirma: "sigue inerte".
  - Cada tarjeta suma una parada de Tab que se anuncia como botón y no hace nada: hasta 24 por página (`collection_products_per_page` y `search_products_per_page` = 24). Con 29 productos, una búsqueda amplia o `/collections/all` llegan a 24 en la página 1.
- **Corrección mínima:** pasar `overlay_cta: 'view_product'` (o vacío) en las 2 secciones hasta que exista el modal.

**A11Y-09. Anillo de foco invisible en el link de la imagen de la tarjeta**

- **Criterio:** 2.4.7 AA. **Severidad:** Media.
- **Dónde:**
  - `assets/component-card.css:133-138` (`.product-card__media-wrap { overflow: hidden }`);
  - `:152-156` (link `inset: 0`);
  - `base.css:294-302` (`outline-offset: 2px`).
- **Evidencia:**
  - El contorno se dibuja fuera de la caja del link y el contenedor lo recorta entero.
  - El único indicio es que aparece el overlay (`:316-320`, `focus-within`), que también queda visible cuando el foco pasa al corazón o al botón.
  - La galería ya resolvió lo mismo con `outline-offset: -2px` (`component-product-gallery.css:65-68`).
- **Corrección mínima:** `.product-card__link:focus-visible { outline-offset: -2px; }`.

**A11Y-10. El foco se pierde al llegar al final del carrusel**

- **Criterio:** 2.4.3 A / 2.4.7 AA. **Severidad:** Media.
- **Dónde:** `assets/product-carousel.js:40-46`.
- **Evidencia:** con Enter repetido sobre "Siguiente", al llegar al final `nextButton.hidden = true` oculta el botón **que tiene el foco**. El foco cae al `body` y desaparece el indicador. Lo mismo pasa con "Anterior" al volver al inicio.
- **Corrección mínima:** en `updateArrows`, si `button === document.activeElement` y se va a ocultar, pasar el foco a la otra flecha antes. La otra opción es mantenerlo visible con `aria-disabled="true"`.

**A11Y-11. Precio de la sugerencia activa bajo 4,5:1**

- **Criterio:** 1.4.3 AA. **Severidad:** Baja.
- **Dónde:** `assets/section-header.css:477-481` (`#737373`, 12 px) sobre `:442-449` (`#f5f5f5` en hover o `aria-selected`).
- **Evidencia:** **4,35:1**. Con el fondo blanco da 4,74:1, así que solo falla en la opción activa.
- **Corrección mínima:** `color: #666666` (5,27:1 sobre `#f5f5f5`).

**A11Y-15. Conteo de sugerencias repetido no se reanuncia**

- **Criterio:** robustez relacionada con 4.1.3 AA. No es falla estricta: el live region existe (`role="status"`, `header.liquid:165`); el problema es que un texto idéntico no se vuelve a anunciar. **Severidad:** Baja.
- **Dónde:** `assets/search.js:246-253`.
- **Evidencia:** si "bik" y "biki" devuelven la misma cantidad, `textContent` no cambia y el lector no anuncia nada. `cart.js:380-388` ya vacía el texto antes de escribir.
- **Corrección mínima:** `this.status.textContent = ""` antes del `setTimeout`.

**A11Y-16. Botón de filtros sin estado inicial**

- **Criterio:** buena práctica (consistencia de estado). No es falla de 4.1.2: un botón que abre un diálogo modal no está obligado a exponer `aria-expanded`; lo raro es que el JS lo agrega recién al abrir. **Severidad:** Baja.
- **Dónde:** `sections/main-collection.liquid:37`.
- **Evidencia:** el disparador del drawer mobile no tiene `aria-expanded`, `aria-controls` ni `aria-haspopup` hasta el primer `open()` (`collection-filters.js:96`).
- **Corrección mínima:** `aria-haspopup="dialog" aria-controls="collection-filter-drawer" aria-expanded="false"` en el markup.

**A11Y-17. Cambio de imagen en el visor no anunciado**

- **Criterio:** 4.1.3 AA (discutible: el contador es el resultado de una acción, pero también puede leerse como contenido del visor y no como mensaje de estado). **Severidad:** Baja.
- **Dónde:** `snippets/product-gallery.liquid:165` y `assets/product-lightbox.js:119-121`.
- **Evidencia:**
  - El contador "Imagen X de N" del visor no es live region.
  - El `aria-live` de la galería (`product-gallery.liquid:155`) queda fuera del `<dialog>` modal, que es inerte.
  - Con ←/→ no hay ninguna respuesta audible: todas las fotos tienen el mismo alt (el título).
- **Corrección mínima:** `aria-live="polite"` en `[data-lightbox-counter]`.

### Latentes

**A11Y-06. `aria-pressed` sobre links en los chips de filtro**

- **Criterio:** 4.1.2 A (atributo no permitido en `link`). **Severidad:** Media al activarse.
- **Dónde:** `snippets/collection-filters.liquid:156` y `:172`.
- **Evidencia:** los chips son `<a>` que navegan. Hoy no se dibujan: sin Search & Discovery solo hay precio, y disponibilidad está oculta. Aparecen al instalar la app (owner-only #2).
- **Corrección mínima:** reemplazar por `{% if value.active %}aria-current="true"{% endif %}`, o agregar texto oculto "(filtro activo)".

**A11Y-12. Guía de tallas como imagen con `alt=""`**

- **Criterio:** 1.1.1 A. **Severidad:** Alta al activarse.
- **Dónde:** `sections/main-product.liquid:347`.
- **Evidencia:** la guía real es una imagen PNG. Su contenido de texto es NOT_AVAILABLE (03D #31). Con `alt=""` el diálogo queda vacío para un lector de pantalla.
- **Corrección mínima:**
  - `alt: guide_image.alt | default: <título de la guía>`;
  - una alternativa de texto real: tabla en `size_guide_content`. El contenido es NOT_AVAILABLE y lo tiene que dar la dueña.

**A11Y-13. Videos en autoplay y loop sin pausa y sin respetar movimiento reducido**

- **Criterio:** 2.2.2 A. Además 2.3.3 AAA, como recomendación. **Severidad:** Alta al activarse.
- **Dónde:** `sections/hero.liquid:29`, `snippets/collection-banner.liquid:49` y `sections/featured-categories.liquid:52`.
- **Evidencia:**
  - `autoplay`, `loop` y `controls: false`, sin botón de pausa.
  - La regla global de `base.css:324-333` solo frena animaciones CSS, no `<video>`.
  - Hoy no hay videos. El del hero (M01) está pendiente de subir.
  - **Relacionado y visible hoy (riesgo bajo, a juzgar en vivo):** los 3 blobs del hero sin video se mueven en loop infinito (`section-hero.css:91`, `:100`, `:109`, ciclos de 22–30 s) y no tienen pausa. Con colores casi blancos al 20–40 %, blur de 64 px y desplazamientos de 4–6 %, el movimiento es apenas perceptible. La regla de movimiento reducido los frena, pero eso no cuenta como mecanismo de pausa para 2.2.2. Si en vivo se nota el movimiento, conviene frenarlos tras un ciclo o agregar la misma pausa que al video.
- **Corrección mínima:**
  - botón visible de pausa/reproducción;
  - JS que no inicie la reproducción con `prefers-reduced-motion: reduce`;
  - `aria-hidden="true"` si el video es decorativo.

**A11Y-14. Hover del CTA del hero con video**

- **Criterio:** 1.4.3 AA. **Severidad:** Baja.
- **Dónde:** `assets/section-hero.css:234-237`.
- **Evidencia:** en hover, `#fff` sobre `#c3ae8e` da **2,15:1**.
- **Corrección mínima:** `color: var(--color-text-primary)` en el hover (8,34:1).

**A11Y-18. Colección sin h1 si se apaga el banner**

- **Criterio:** 1.3.1 / 2.4.6 (buena práctica). **Severidad:** Baja.
- **Dónde:** `main-collection.liquid:19-21` y `collection-banner.liquid:77`.
- **Evidencia:** el único h1 vive en el banner, y el setting `collection_show_banner` lo apaga entero.
- **Corrección mínima:** en la rama `else`, `<h1 class="visually-hidden">{{ collection.title }}</h1>`.

**A11Y-19. Categoría "Próximamente" como `<button>` con h3, div y p adentro**

- **Criterio:** 4.1.2 / 1.3.1. **Severidad:** Baja.
- **Dónde:** `sections/featured-categories.liquid:47`, `:65`, `:82`.
- **Evidencia:** contenido no permitido dentro de `button`, el heading se pierde y el botón no hace nada. Hoy las 4 categorías están disponibles.
- **Corrección mínima:** usar un `<div>` no interactivo en esa rama.

**A11Y-20. `aria-haspopup="true"` en un disclosure**

- **Criterio:** 4.1.2 (el rol no coincide). **Severidad:** Baja.
- **Dónde:** `sections/header.liquid:82`.
- **Evidencia:** anuncia "menú" sobre una lista de links. Hoy el menú es plano.
- **Corrección mínima:** quitar `aria-haspopup`.

### Probables (hay que medirlos en vivo)

**A11Y-21. Eyebrow "COLECCIÓN" del banner**

- **Criterio:** 1.4.3 AA. **Severidad:** Media.
- **Dónde:** `assets/section-collection-banner.css:46-51` (blanco al 70%).
- **Evidencia:**
  - Estimado sobre el arte de fondo de cada tono (`description_tone`: aurora = linen, salidas = sand, espuma = fog), con overlay de ~0,30 a esa altura: **3,16–3,70:1**.
  - Oasis Natural (moss) da 7,5:1.
- **Corrección mínima:**
  - `color: #fff`, que da ~4,5–5:1 estimado: queda en el límite con el overlay más débil (mobile, con descripción);
  - o reforzar el overlay a la altura del eyebrow, que es la opción segura.

**A11Y-22. Texto blanco de las tarjetas de categoría sobre fotos**

- **Criterio:** 1.4.3 AA. **Severidad:** Alta si falla.
- **Dónde:** `assets/section-categories.css:75-85` (scrim) y `:121-151` (texto).
- **Evidencia:**
  - El scrim pasa de 60% abajo a 5% a mitad de altura.
  - El título queda a ~45–56% de altura, casi sin protección: sobre una foto clara da ≈1,3:1.
  - La imagen hoy es `collection.featured_image`, que cae a la foto del primer producto.
- **Corrección mínima:** scrim de 55% o más en toda la altura del bloque de texto. Con 0,55, blanco sobre foto blanca da 4,76:1.

**A11Y-23. Texto `#737373` en el drawer translúcido**

- **Criterio:** 1.4.3 AA. **Severidad:** Baja.
- **Dónde:** `assets/component-cart.css:68-74` (panel blanco al 95% + blur) con `:216-221`, `:318-321`, `:400-402`, `:410-414`.
- **Evidencia:** entre 4,54:1 (página clara debajo) y **4,24:1** (página oscura debajo).
- **Corrección mínima:** texto `#666` (5,14:1 en el peor caso) o panel al 98%.

### Buenas prácticas y riesgos menores (no son fallas confirmadas)

**A11Y-24. Corazones de favoritos: `aria-pressed` con etiqueta que cambia**

- **Dónde:** `wishlist.js:590-599`, `product-card.liquid:145-158`, `main-product.liquid:130-143`.
- **Qué pasa:** cambian la etiqueta **y** además `aria-pressed`. En las tarjetas alternan entre "Añadir a favoritos" y "Quitar de favoritos" (texto oculto), así que un lector puede anunciar "Quitar de favoritos, activado". En la ficha el texto visible alterna entre "Agregar a favoritos" y "Guardado" (`main-product.liquid:136-137`).
- **Además:** el nombre no incluye el producto: 24 botones "Añadir a favoritos" iguales.
- **Sugerencia:** una etiqueta fija con el nombre del producto, más `aria-pressed`. Requiere un string nuevo, con el mismo patrón que `cart.item.remove`.

**A11Y-25. Drawers ARIA sin `inert` de fondo**

- **Dónde:** mobile y filtros: `header.js:162-186`, `collection-filters.js:90-109`.
- **Qué pasa:** dependen de `aria-modal`. TalkBack y lectores viejos lo ignoran.
- **Sugerencia:** `inert` en `header`, `main` y `footer` mientras están abiertos, o migrar a `<dialog>.showModal()` como el carrito.

**A11Y-26. Link dentro de `role="option"`**

- **Dónde:** `sections/predictive-search.liquid:16-17`.
- **Qué pasa:** es contenido interactivo anidado; axe lo marca como `nested-interactive`. Es el mismo patrón que Dawn. Impacto bajo, porque el foco no entra en la lista.

**A11Y-27. Bordes de campos de 1,24–1,48:1**

- **Dónde:**
  - `.input` `#e7e7e7`: `component-form.css:45`;
  - buscadores `#d4d4d4`: `section-header.css:353` y `section-search.css:70`.
- **Qué pasa:** según cómo se interprete 1.4.11. Todos tienen etiqueta, placeholder (4,74:1) o ícono, así que no se clasifica como falla.

**A11Y-28. Visor: desplazar la foto ampliada solo se puede arrastrando**

- **Criterio:** 2.5.7 AA (WCAG 2.2).
- **Dónde:** `product-lightbox.js:237-244`.
- **Qué pasa:** hay alternativas sin arrastre para ampliar (botones y +/−), pero no para mover. Riesgo bajo: la foto completa se ve a 1×.

**A11Y-29. "Agregar al carrito" en favoritos navega a la ficha**

- **Criterio:** 2.4.4 A.
- **Dónde:** `sections/wishlist-item.liquid:83`.
- **Qué pasa:** el texto promete una acción que no hace.
- **Sugerencia:** otra etiqueta. El copy es NOT_AVAILABLE y lo decide la dueña.

**A11Y-30. El nombre del botón de la galería tapa el alt de la foto**

- **Dónde:** `snippets/product-gallery.liquid:80-88`.
- **Qué pasa:** `aria-label="Abrir visor…"` reemplaza el alt. Impacto bajo: el alt de las 95 fotos es el título del producto (`import/shopify-products-03c.csv`, 95/95).

**Otros puntos menores**

- **Encabezados:** las tarjetas usan `h3` (`product-card.liquid:176`). En colección, por debajo de 768 px se salta de h1 a h3, porque el h2 "Filtros" solo está en la barra lateral, que se oculta en esos anchos (`section-collection.css:127-137`). En búsqueda el salto pasa en todos los anchos: `main-search.liquid` no tiene ningún h2. Es buena práctica agregar un h2 oculto antes de la grilla.
- **Tarjetas de categoría:** el `aria-label` "Explorar la categoría {nombre}" (`featured-categories.liquid:45`) reemplaza todo el contenido del link, así que la descripción visible no llega al lector de pantalla. Impacto bajo.
- **Announcement bar:** queda fuera de todo landmark; es una sección aparte en `header-group.json`.
- **Enlaces externos:** en redes y en WhatsApp de los textos legales, `target="_blank"` no avisa que se abre otra pestaña.
- **Newsletter:** el éxito o el error se muestra con `role="status"`/`"alert"` después de recargar (`newsletter-home.liquid:37-45`). Un live region presente al cargar no se anuncia y el foco no se mueve al mensaje.
- **`/en`:** `lang="en"` con títulos, descripciones y legales en español. Es 3.1.2 AA, pero es contenido y traducción (Translate & Adapt), no theme.
- **Live region de favoritos:** se crea recién en el primer uso (`wishlist.js:622-635`), así que el primer aviso de "lista llena" puede perderse.

## 3. Diálogos y paneles

| Componente | Elemento / rol | Nombre | Foco inicial | Trampa de foco | Escape | Devuelve el foco | Fondo inerte / scroll | Resultado |
|---|---|---|---|---|---|---|---|---|
| Drawer de carrito | `<dialog>` + `showModal()` (`cart-drawer.liquid:27`, `cart.js:537`) | `aria-labelledby` → h2 (`:31`) | `autofocus` en Cerrar (`:32`) | Nativa | `cancel` → cierre animado (`cart.js:444-447`); inmediato con movimiento reducido (`:547-550`) | Al que abrió, o al ícono del header si ya no se ve (`cart.js:570-574`) | Top layer + `:root:has(dialog[open])` (`base.css:317-319`) | PASS |
| Guía de tallas | `<dialog>` (`main-product.liquid:337`) | `aria-labelledby` → h2 (`:344`) | Primer enfocable: Cerrar (`:339-343`) | Nativa | Nativo; clic en el fondo cierra (`product-form.js:314-318`) | Al que abrió (`product-form.js:311`) | Nativo + `base.css` | PASS (el contenido tiene A11Y-12) |
| Visor de fotos | `<dialog>` (`product-gallery.liquid:163`) | `aria-label` | `autofocus` en Cerrar (`:173`) | Nativa | Nativo | Al que abrió (`product-lightbox.js:107`) | Nativo | PASS (con A11Y-17, A11Y-28) |
| Menú mobile | `div role="dialog" aria-modal="true"` (`header.liquid:284`) | `aria-label` "Navegación principal" | Primer enfocable, el logo (`header.js:172-173`) | Manual, primero y último (`header.js:201-215`) | Sí (`:188-192`) | A la hamburguesa (`:180`) | Sin `inert`; `body` con `overflow: hidden` (`section-header.css:640-642`) | PASS con A11Y-25 |
| Drawer de filtros | `div role="dialog" aria-modal="true"` (`main-collection.liquid:94`) | `aria-label` "Filtros y orden" | Cerrar (`collection-filters.js:97-98`) | Manual (`:121-135`) | Sí (`:111-115`) | Al disparador (`:105`) | Sin `inert`; `body` con `overflow: hidden` (`section-collection.css:349-351`) | PASS con A11Y-16, A11Y-25 |
| Buscador del header | **No es overlay**: disclosure en línea, solo ≥1024 px; en mobile el form está dentro del menú | `<a role="button" aria-expanded aria-controls>` (`header.js:45-46`); nombre "Buscar"/"Cerrar buscador" | El input (`:56-59`) | n/a | El primer Escape cierra la lista (`search.js:210-218`), el segundo colapsa (`header.js:87-92`) | Al disparador (`:61-66`) | Colapsado = `visibility: hidden`, sin foco (`section-header.css:323-334`) | PASS |
| Dropdown de escritorio | Disclosure con `aria-expanded` (`header.liquid:79-86`) | Texto del link | n/a | n/a | Sí (`header.js:131-136`) | Al disparador | n/a | Latente A11Y-20 |

## 4. Búsqueda con sugerencias (combobox)

| Requisito | Estado | Evidencia |
|---|---|---|
| `role="combobox"` en el input, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-controls` | PASS | `header.liquid:148-154` |
| `aria-expanded` sincronizado | PASS | `search.js:157-166` |
| `role="listbox"` con nombre | PASS | `header.liquid:164` |
| `role="option"` + `aria-selected` + `id` | PASS | `predictive-search.liquid:16`, `search.js:223-236` |
| `aria-activedescendant` (el foco queda en el input) | PASS | `search.js:231-235` |
| Teclado ↓ ↑ Enter Escape | PASS | `search.js:184-221` (Inicio/Fin no, es opcional) |
| Live region con la cantidad de resultados y "sin sugerencias" | PASS con A11Y-15 | `header.liquid:165`, `search.js:144-155` |
| Opción activa visible sin depender solo del color | PASS | Fondo + barra de 3 px `#171717` (16,4:1) (`section-header.css:449-451`) |
| Contraste del precio en la opción activa | FAIL A11Y-11 | 4,35:1 |
| Nada interactivo anidado | Advertencia A11Y-26 | `predictive-search.liquid:17` |

## 5. Filtros, tallas, favoritos, carrito, contraseña y páginas legales

**Filtros de colección**

- **Chips:** `aria-pressed` sobre links no es válido (A11Y-06, latente).
- **Precio:** tiene labels ocultos asociados por `for`/`id` únicos por contexto (`collection-filters.liquid:119-141`), placeholders visibles (5,74:1) y botón "Aplicar" con nombre. PASS.
- **Orden:**
  - nombre: `aria-label` más el h3 visible "Ordenar por" (`:69`, `:85`). PASS;
  - cambio de contexto al cambiar el valor: FAIL (A11Y-03).
- **Columnas 2/3/4:**
  - `role="group"` con nombre y `aria-pressed` en botones (`main-collection.liquid:44-55`, `collection-filters.js:53-56`). PASS;
  - el nombre "Ver en 2 columnas" contiene el texto visible "2" (2.5.3). PASS.

**Selector de talla (`product-variant-picker.liquid`)**

- `<fieldset>` + `<legend>` oculto con el nombre de la opción; el rótulo visible es `aria-hidden` (`:59-68`).
- Radios nativos con flechas del teclado; foco visible con `:has(input:focus-visible)` (`component-variant-picker.css:83-86`).
- **Talla agotada:**
  - se anuncia con el texto oculto "no disponible" dentro del label (`:105-107`);
  - se recalcula al combinar opciones (`product-form.js:123-139`);
  - tiene tachado visual y texto a 5,74:1: no depende del color.
- **Anuncios:** la selección se anuncia en `role="status"` con talla, precio y disponibilidad (`main-product.liquid:250`, `product-form.js:194-202`).
- **Error sin talla:** sale en `role="alert"` y el foco va al primer radio (`product-form.js:210-227`).
- **Resultado:** PASS. Mejora opcional: `aria-describedby` del grupo al error.

**Favoritos**

- **Corazón:**
  - nace oculto hasta tener estado (sin JS no hay control falso);
  - área táctil de 44 px (`component-card.css:246-258`);
  - estado por `aria-pressed` + relleno + etiqueta, no solo color: `#ef4444` da 3,00:1 sobre blanco al 90% encima de una foto negra, en el límite de 1.4.11.
- **Página:**
  - `role="status"` al quitar (`main-wishlist.liquid:36`, `wishlist.js:854-860`);
  - el foco pasa al siguiente ítem o al h1 (`wishlist.js:839-840`);
  - `aria-busy` mientras carga.
- **Resultado:** PASS con A11Y-24 y A11Y-29.

**Carrito (drawer y página)**

- **Nombres:** "Restar cantidad de {título}", "Sumar cantidad de {título}", "Cantidad de {título}" y "Quitar {título} del carrito" (`cart-line-item.liquid:77`, `:92`, `:100`, `:46`).
- **Estado ocupado:** `aria-disabled` + `readOnly` (`cart.js:346-361`).
- **Anuncios:** subtotal en `role="status"`, vaciando antes de escribir (`cart.js:380-388`, `:416-419`); errores por línea y anunciados (`:370-378`).
- **Foco:** se conserva en el mismo control después de re-renderizar; si la línea desapareció, va al título (`:403-414`).
- **Resultado:** PASS. El contraste del texto secundario es A11Y-23 (probable).

**Contraseña (`layout/password.liquid` + `main-password.liquid`)**

- `lang` dinámico, skip link, h1 que nunca queda vacío.
- Label visible asociado y `autocomplete="current-password"`.
- **Error:**
  - `aria-invalid` + `aria-describedby` + `role="alert"` (`:62-80`);
  - texto de error `#dc2626`: 4,83:1.
- **Mensaje:** `#666`, 5,74:1.
- **Área táctil:** 44 px en input, botón y link.
- **Resultado:** PASS.

**Páginas legales**

- **Orden de encabezados:** h1 = `page.title` (`main-page.liquid:9`) y el contenido solo tiene h2:

| Página | h2 |
|---|---|
| privacidad | 6 |
| términos | 5 |
| envíos | 10 |
| cookies | 6 |
| garantía | 3 |
| devoluciones | 4 |

  Orden correcto: PASS.
- **Links:** falla A11Y-02.
- **Enlaces externos:** WhatsApp con `target="_blank"` sin aviso (buena práctica).

## 6. Imágenes, movimiento, skip link, idioma y foco

**Texto alternativo**

- **Productos:** 95/95 imágenes importadas tienen alt = título (`import/shopify-products-03c.csv`, columna `Image alt text`). Es correcto pero repetitivo: no describe el ángulo.
- **Decorativas:** `alt=""` bien usado en:
  - la foto secundaria de la tarjeta, además `aria-hidden` (`product-card.liquid:117-118`);
  - las miniaturas de sugerencias (`predictive-search.liquid:20`);
  - el carrito (`cart-line-item.liquid:34`);
  - favoritos (`wishlist-item.liquid:42`);
  - las miniaturas con `aria-label` en el botón (`product-gallery.liquid:145`, `:219`);
  - el banner de colección (`collection-banner.liquid:64`).
- **Logos:** `alt = shop.name` (`header.liquid:57`, `footer.liquid:38`, `main-password.liquid:44`).
- **SVG:** los íconos llevan `aria-hidden` + `focusable="false"` (`icon.liquid`) y la textura de marca también (`brand-pattern.liquid:14`).
- **Fallas:** A11Y-12 (guía de tallas) y A11Y-30 (galería).

**`prefers-reduced-motion`**

- **Regla global CSS:** `base.css:324-333` pone duración de animación y transición en 0,01 ms, 1 iteración y `scroll-behavior: auto`. Cubre:
  - los blobs del hero (`section-hero.css:91`, `:100`, `:109`);
  - la entrada del hero;
  - el pop del corazón;
  - el skeleton;
  - los drawers;
  - la expansión del buscador.
- **JS que lo respeta:**
  - entrada de tarjetas (`product-card-entry.js:15-19`);
  - carrusel (`product-carousel.js:51-52`);
  - galería (`product-gallery.js:78`);
  - cierre del carrito (`cart.js:547-550`).
- **Overrides por componente:** `component-card.css:389-402`, `section-collection.css:406-417`, `section-product.css:474-489`, `component-product-gallery.css:466-473` y `component-variant-picker.css:112-116`.
- **Falla:** los `<video autoplay loop>` no lo respetan (A11Y-13, latente).
- **Riesgo sin JS:** `.product-card--animate-entry { opacity: 0 }` (`component-card.css:378-382`). Si `product-card-entry.js` no carga, las tarjetas de colección y búsqueda quedan invisibles. No es un criterio WCAG, pero sí un riesgo de robustez.

**Skip link:** `theme.liquid:104-106` y `password.liquid:34-36` → `#MainContent` (`<main>`); se ve al recibir foco (`base.css:275-290`, z-index por encima del header). PASS.

**Idioma:** `<html lang="{{ request.locale.iso_code }}">` (`theme.liquid:2`, `password.liquid:2`) → `es` en `/` (verificado en 03B). PASS. Lo de `/en` está en la sección 2.

**Foco visible**

- **Anillo global:** 2 px `#666`, separado 2 px (`base.css:294-302`): 5,74:1 sobre blanco, 4,87:1 sobre `#f0ece3` y 3,45:1 sobre `#0a0a0a`. PASS.
- **Excepciones revisadas:**
  - buscadores: solo cambia el borde de `#d4d4d4` a `#171717` (`section-header.css:361-364`, `section-search.css:78-81`). Pasa 2.4.7, pero el indicador es débil (1 px);
  - títulos con `tabindex="-1"` sin contorno (`component-cart.css:101-103`, `:487-489`, `section-wishlist.css:40-42`): correcto, el foco es programático;
  - tarjetas de categoría: contorno blanco interno de 3 px (`section-categories.css:49-52`) más zoom, scrim y CTA. Sobre una foto clara el contorno blanco se pierde (hay que verificarlo en vivo);
  - tarjeta de producto: A11Y-09.

**Áreas táctiles (2.5.8 AA)**

- Botones de ícono y controles: 28 px o más; los menores son columnas y borrar búsqueda (28 px). El corazón mide 32 px visibles y 44 px táctiles.
- Hay links y botones de texto de ~18–20 px de alto: "Guía de tallas" (`component-variant-picker.css:32-43`, 12 px sin padding), "Limpiar" de filtros (`section-collection.css:160-164`), miga de pan y links del footer. No llegan a 24 px, pero pasan por la excepción de espaciado de 2.5.8 (el círculo de 24 px no toca otro control) o por ser texto en línea.
- **Resultado:** PASS probable. Confirmar en vivo que "Guía de tallas" no queda a menos de 24 px de las tallas en mobile.
- *(Corrección del verificador: la versión anterior decía que todos los controles medían 24 px o más.)*

## 7. Tabla de contraste calculada

**Cómo leerla**

- Umbral: 4,5:1 para texto normal; 3:1 para texto grande (≥24 px, o ≥18,66 px en negrita) y para elementos no textuales (1.4.11).
- Se usan los valores por defecto de `variables.css` + `css-variables.liquid` + `settings_data.json`, que coinciden (`#171717`, `#666666`, `#000000`, `#D6C5AE`, `#C3AE8E`, `#F7F4EF`, `#E7E7E7`).
- Los colores con transparencia se compusieron sobre el fondo real, o sobre el peor caso cuando se indica.

### Texto sólido

| Id | Par (uso real) | Tamaño | Ratio | Umbral | Resultado |
|---|---|---|---|---|---|
| C01 | Texto base `#171717` / `#fff` | 16 px | 17,93 | 4,5 | PASS |
| C02 | Texto secundario `#666` / `#fff` (nav, filtros, footer, precio tachado) | 11–14 px | 5,74 | 4,5 | PASS |
| C03 | `#666` / `#f7f4ef` (fondo suave) | 12–14 px | 5,23 | 4,5 | PASS |
| C04 | `#666` / `#f0ece3` (precio tachado en la vidriera editorial) | 12 px | 4,87 | 4,5 | PASS |
| C05 | `#171717` / `#f0ece3` (títulos de tarjeta, editorial) | 14 px | 15,21 | 4,5 | PASS |
| C06 | Título editorial `#1c2b45` / `#f0ece3` | 30–36 px | 12,03 | 3 | PASS |
| C07 | Eyebrow `#000` / `#f0ece3` | 12 px | 17,81 | 4,5 | PASS |
| C08 | `#737373` / `#fff` (conteo de búsqueda, nota del carrito, placeholder) | 12–14 px | 4,74 | 4,5 | PASS (justo) |
| C09 | `#737373` / `#f5f5f5` (precio en la sugerencia activa) | 12 px | **4,35** | 4,5 | **FAIL** (A11Y-11) |
| C10 | `#525252` / `#fff` (envío gratis, "Volver a…") | 12–14 px | 7,81 | 4,5 | PASS |
| C11 | `#404040` / `#fff` (talla, favoritos, botón outline) | 14 px | 10,37 | 4,5 | PASS |
| C12 | `#fff` / `#000` (barra de anuncios, botón primario, badge −X%, chip activo, página actual) | 9–14 px | 21,00 | 4,5 | PASS |
| C13 | `#fff` / `#171717` (badge "Agotado") | 10 px | 17,93 | 4,5 | PASS |
| C14 | `#171717` / `#d6c5ae` ("Finalizar compra", CTA de favoritos vacío) | 12–14 px | 10,63 | 4,5 | PASS |
| C15 | **`#fff` / `#d6c5ae` (CTA del hero sin video, CTA del promo)** | 14 px | **1,69** | 4,5 | **FAIL** (A11Y-01) |
| C16 | `#fff` / `#c3ae8e` (hover del CTA del hero con video) | 14 px | **2,15** | 4,5 | **FAIL** (A11Y-14, latente) |
| C17 | `#fff` / `#000` (hover de los CTAs nude) | 14 px | 21,00 | 4,5 | PASS |
| C18 | Error `#dc2626` / `#fff` | 12–14 px | 4,83 | 4,5 | PASS |
| C19 | Éxito `#047857` / `#fff` | 12–14 px | 5,48 | 4,5 | PASS |
| C20 | Aviso `#92400e` / `#fffbeb` | 14 px | 6,84 | 4,5 | PASS |
| C21 | "Últimas unidades" `#92400e` / `#fef3c7` | 12 px | 6,37 | 4,5 | PASS |
| C22 | "Agotado" `#991b1b` / `#fee2e2` | 12 px | 6,80 | 4,5 | PASS |
| C23 | Stock bajo en favoritos `#b45309` / `#fff` | 12 px | 5,02 | 4,5 | PASS |
| C24 | "Guardado" `#b91c1c` / `#fef2f2` | 14 px | 5,91 | 4,5 | PASS |
| C25 | Envío gratis alcanzado `#15803d` / `#f0fdf4` (cerrojo OFF) | 12 px | 4,79 | 4,5 | PASS |
| C28 | Talla `#404040` / `#fff` | 14 px | 10,37 | 4,5 | PASS |
| C29 | Botón de compra deshabilitado `#737373` / `#d4d4d4` | 14 px | 3,20 | — | Exento (inactivo) |
| C30 | Botón primario deshabilitado `#666` / `#e7e7e7` | 14 px | 4,64 | — | Exento |
| C31 | "Agotado" en favoritos `#525252` / `#d4d4d4` | 12 px | 5,27 | 4,5 | PASS |
| C32 | CTA del hero con video `#171717` / `#fff` | 14 px | 17,93 | 4,5 | PASS |
| C33 | Botón secundario `#171717` / `#f7f4ef` | 14 px | 16,34 | 4,5 | PASS |

### Texto sobre fondos translúcidos (peor caso calculado)

| Id | Par | Tamaño | Ratio | Umbral | Resultado |
|---|---|---|---|---|---|
| C34 | Badge de categoría `#171717` / blanco 90% sobre foto negra | 10 px | 14,30 | 4,5 | PASS |
| C35 | Nav `#666` / header blanco 90% sobre contenido negro (sticky con scroll) | 12 px | 4,58 | 4,5 | PASS (justo) |
| C36 | Miga de pan `#666` / barra blanca 90% sobre foto negra | 12 px | 4,58 | 4,5 | PASS (justo) |
| C37 | Contador de galería `#fff` / negro 60% sobre foto blanca | 12 px | 5,74 | 4,5 | PASS |
| C38 | Contador del visor blanco 70% / `#0a0a0a` 95% | 14 px | 9,22 | 4,5 | PASS |
| C39 | Drawer `#737373` / panel 95% (página clara debajo) | 12–14 px | 4,54 | 4,5 | PASS (justo) |
| C40 | Drawer `#737373` / panel 95% (página oscura debajo) | 12–14 px | **4,24** | 4,5 | **PROBABLE FAIL** (A11Y-23) |

### Estimaciones sobre degradados y fotos (medir en vivo)

| Id | Par | Ratio estimado | Umbral | Resultado |
|---|---|---|---|---|
| E1 | Eyebrow del banner, blanco 70%, tono sand/linen (Salidas de Baño, Aurora Viva) | 3,16 | 4,5 | PROBABLE FAIL (A11Y-21) |
| E2 | Mismo eyebrow, tono fog (Espuma de Ola) | 3,70 | 4,5 | PROBABLE FAIL |
| E3 | Mismo eyebrow, tono moss (Oasis Natural) | 7,46 | 4,5 | PASS |
| E4 | Título del banner, blanco, 36–48 px (los 3 tonos claros) | 5,50–6,60 | 3 | PASS |
| E5 | Descripción del banner, blanco 80% (overlay ~0,53) | 6,02–6,81 | 4,5 | PASS |
| E6 | Título de tarjeta de categoría, blanco, a ~45% de altura sobre foto blanca (scrim ~0,11) | 1,27 | 4,5 (18 px) | PROBABLE FAIL si la foto es clara (A11Y-22) |
| E7 | Descripción de tarjeta de categoría, blanco 80%, calculada con el scrim máximo de la base (0,60). Es el mejor caso: a la altura real de la descripción el scrim es menor | 4,37 o menos | 4,5 | PROBABLE FAIL sobre foto clara |

### No textual (1.4.11)

| Id | Elemento | Ratio | Umbral | Resultado |
|---|---|---|---|---|
| N01 | Corazón guardado `#ef4444` / blanco 90% sobre foto negra | 3,00 | 3 | PASS (justo) |
| N03–N06 | Anillo de foco `#666` / blanco, `#f0ece3`, `#0a0a0a` y `#000` | 5,74 / 4,87 / 3,45 / 3,66 | 3 | PASS |
| N07 | Borde de `.input` `#e7e7e7` / `#fff` | 1,24 | 3 | Riesgo (A11Y-27) |
| N08 | Borde de buscadores y tallas `#d4d4d4` / `#fff` | 1,48 | 3 | Riesgo; las tallas tienen texto que las identifica |
| N10 | Flechas de galería `#666` / píldora blanca 80% sobre foto negra | 3,43 | 3 | PASS |
| N11 | Borde de talla elegida y agotada `#737373` | 4,74 | 3 | PASS |
| N12 | Puntos inactivos de galería `#d4d4d4` | 1,48 | 3 | Bajo riesgo: `aria-hidden`; el activo, `#171717`, sí contrasta |
| N13 | Barra de la opción activa en sugerencias `#171717` / `#f5f5f5` | 16,44 | 3 | PASS |
| N14 | Barra de envío gratis `#d6c5ae` / pista `#e5e5e5` | 1,34 | 3 | Riesgo bajo: `aria-hidden` y el monto está en texto; cerrojo OFF |

## 8. Hallazgo funcional relacionado (no es un criterio WCAG)

**El overlay de la tarjeta intercepta los clics**

- **Dónde:** `assets/component-card.css:301-314`.
- **Qué pasa:**
  - `.product-card__overlay` tiene `z-index: 1` y ocupa todo el ancho de la franja inferior de la foto: ~58 px en Home y relacionados (píldora de 34 px + 12 px de padding arriba y abajo) y ~68 px en colección y búsqueda (el botón tiene `.tap-target` de 44 px).
  - No tiene `pointer-events: none` y con `opacity: 0` sigue recibiendo clics.
  - En los carruseles del Home (`product-carousel.liquid:33`) y en los relacionados de la ficha (`product-recommendations.liquid:48`), la píldora "Ver producto" es un `<span>`: tocar esa franja no navega. En colección y búsqueda la franja contiene el botón inerte (A11Y-08).
- **Corrección mínima:** `pointer-events: none` en `.product-card__overlay` y `pointer-events: auto` en `.product-card__quick-view`.

## 9. Para el pase en vivo: qué confirmar

1. **A11Y-21, A11Y-22 y A11Y-23:** medir con cuentagotas el eyebrow del banner (Aurora Viva, Salidas de Baño, Espuma de Ola), el título de las 4 tarjetas de categoría y el texto `#737373` del drawer abierto sobre una foto oscura.
2. **Header sticky en Shopify real (NOT_VERIFIED):**
   - `<header>` es `position: sticky` (`section-header.css:38-40`), pero Shopify lo envuelve en `div.shopify-section`, cuyo alto es el del header. Lo más probable es que **no se quede fijo**. Dawn resuelve esto fijando el wrapper.
   - Contradicción a resolver: `offline-release-candidate-report.md:165` marca el header como "Sticky" PASS, pero esa prueba fue offline y no hay evidencia de que el harness reprodujera el wrapper `.shopify-section`.
   - Si sí se queda fijo, la barra de colección (`top: 4rem`, `section-collection.css:10-11`) queda 32 px debajo del header de 96 px, y en mobile el link "Inicio" de la miga podría quedar tapado al recibir foco (2.4.11 AA).
3. **A11Y-03:** con el `select` de orden enfocado, ↓ en Chrome de Windows debería recargar la página.
4. **A11Y-09 y A11Y-10:** Tab sobre la imagen de una tarjeta (¿se ve un anillo?) y Enter repetido sobre "Siguiente" del carrusel hasta el final (¿dónde queda el foco?).
5. **A11Y-02:** en `/pages/garantia` y `/policies/refund-policy`, ¿se distinguen los links del texto?
6. **Menú mobile y filtros con lector de pantalla (TalkBack/VoiceOver):** ¿se puede salir al contenido de fondo con el cursor virtual? (A11Y-25)
7. **Anuncio de "Carrito actualizado. Subtotal…":** debería oírse al añadir desde la ficha, con el drawer recién abierto (`cart.js:416-419` + `:537`).
8. **Contorno de las tarjetas de categoría:** ¿se ve el contorno blanco interno sobre fotos claras?
9. **Sin JS:** las tarjetas de colección y búsqueda, ¿quedan invisibles (`opacity: 0`)?
10. **Blobs del hero (A11Y-13):** en el Home sin video, ¿se percibe el movimiento de fondo?
11. **País del pase:** hoy el mercado principal es Estados Unidos y con país CO los 29 productos salen agotados (no hay zona de envío a Colombia). Para probar tallas, "Añadir al carrito" y el drawer con productos, hacer el pase con el país que resuelve la tienda (US). Con CO se ven "Agotado" en todas las tarjetas y el botón de compra deshabilitado. Esos estados ya pasan contraste (C13, C22) o están exentos (C29).

## 10. Fuera de alcance / NOT_VERIFIED

- **Checkout, login, cuenta y `<shopify-account>`:** la UI la hace Shopify; el theme no la controla.
- **Lectores de pantalla reales:** este reporte es estático; ningún anuncio se escuchó.
- **Legales pendientes:** privacidad, términos, envíos y cookies no están creadas (límite de permisos). Se auditó su HTML verbatim en `content/legal/`.
- **Video del hero, portadas y guía de tallas:** no migrados (owner-only #4). Sus defectos están marcados como latentes.
- **Search & Discovery:** no instalada, así que los chips de talla y color no se dibujan hoy (A11Y-06 latente).
- **Colores:** si Daniela los cambia desde el editor del theme (`settings_schema.json:50-96`), no hay ningún control de contraste. La tabla vale solo para los valores por defecto.
