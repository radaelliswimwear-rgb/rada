# 07 · Sistema visual y estilos

## Motor: Tailwind CSS 4

El proyecto usa **Tailwind CSS 4**, la versión que elimina `tailwind.config.js` a favor de configuración **dentro del CSS** vía `@import`/`@theme`/`@plugin`.

`app/globals.css` es el único entry point de estilos:

```css
@import "tailwindcss";

@plugin "@tailwindcss/container-queries";
@plugin "@tailwindcss/typography";
```

Plugins activos:

| Plugin | Uso en el proyecto |
|---|---|
| `@tailwindcss/typography` | Clase `prose` en `components/prose.tsx` para renderizar HTML de páginas Shopify con tipografía cuidada |
| `@tailwindcss/container-queries` | Clases `@container`/`@[275px]/label` en `components/label.tsx` — el tamaño de la moneda en el precio responde al ancho del contenedor, no del viewport |

`postcss.config.mjs` conecta Tailwind 4 al pipeline de PostCSS (`@tailwindcss/postcss`).

## Dark mode

Basado en **preferencia del sistema**, no en un toggle manual:

```css
@media (prefers-color-scheme: dark) {
  html { color-scheme: dark; }
}
```

Cada componente aplica variantes `dark:` de Tailwind directamente en el JSX (no hay un theme provider ni contexto de tema). Ejemplo típico (`app/layout.tsx`):

```
bg-neutral-50 text-black dark:bg-neutral-900 dark:text-white
```

No hay persistencia de preferencia de usuario (no hay botón "modo oscuro/claro" ni localStorage) — si se quiere agregar un toggle manual en la fase premium, hay que introducirlo desde cero.

## Tipografía

- **Geist Sans** (`geist/font/sans`) — fuente principal, aplicada como variable CSS en `<html className={GeistSans.variable}>` (root layout).
- **Inter Bold** (`fonts/Inter-Bold.ttf`) — fuente local incluida pero de uso puntual/heredado del template; confirmar si sigue en uso real antes de la fase de rebranding.

## Selección de texto personalizada

```
selection:bg-teal-300 dark:selection:bg-pink-500 dark:selection:text-white
```
Detalle de marca del template original — candidato a reemplazar por los colores de marca reales.

## Accesibilidad de foco

Regla global en `globals.css` para todos los `a`, `input`, `button`:

```css
focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-400
focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50
dark:focus-visible:ring-neutral-600 dark:focus-visible:ring-offset-neutral-900
```

## Paleta de color actual

No hay una paleta de marca definida — el proyecto usa directamente la escala de grises/neutrales de Tailwind (`neutral-50` a `neutral-900`) más `blue-600` como color de acento (botones primarios, precios, estados activos) en todos los componentes. **Esto es 100% placeholder del template** y es uno de los primeros puntos a definir en la fase de diseño premium (ver [09-ROADMAP.md](./09-ROADMAP.md)).

| Uso | Clase actual |
|---|---|
| Acento primario (botones, precio, activo) | `blue-600` |
| Fondo claro / oscuro | `neutral-50` / `neutral-900` |
| Texto claro / oscuro | `black` / `white` |
| Bordes | `neutral-200` / `neutral-800` |

## Patrones de estilo recurrentes

- **`clsx`** para clases condicionales en casi todos los componentes interactivos (`VariantSelector`, `GridTileImage`, `FooterMenuItem`, etc.) — patrón a mantener por consistencia.
- **Utilidades de layout responsive** vía breakpoints estándar de Tailwind (`md:`, `lg:`) y algún breakpoint custom puntual (`min-[475px]:`, `min-[1320px]:`).
- **Animaciones**: clases custom como `animate-fadeIn` (`product-grid-items.tsx`) y `animate-carousel` (`carousel.tsx`) — definidas presumiblemente como utilidades Tailwind 4 vía `@theme`/`@keyframes` en `globals.css` o inline; revisar si se quiere extender el catálogo de animaciones.
- **Radio de bordes**: `rounded-lg`/`rounded-full` consistentes en tarjetas y botones — vocabulario visual a mantener o redefinir según la nueva identidad de marca.

## Imágenes

`next.config.ts` habilita formatos modernos y restringe los dominios remotos permitidos:

```ts
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" }],
}
```

Si se migra de proveedor de imágenes (CDN propio, otro DAM) este es el archivo a actualizar.

## Documentos relacionados

- [04-COMPONENTS.md](./04-COMPONENTS.md)
- [09-ROADMAP.md](./09-ROADMAP.md) — fase de identidad de marca
