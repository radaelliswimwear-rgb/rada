# Sprint 3 — Sección de categorías

## Objetivo

Reemplazar el bloque de 3 categorías con gradientes del Sprint 1 por una sección premium de 6 categorías con fotografía real, inspirada en Zara/Nike/Apple/COS.

## Qué se implementó

- `lib/categories.ts` — arreglo `categories` con las 6 categorías (Hombre, Mujer, Niños, Calzado, Accesorios, Novedades), cada una con imagen real de Unsplash, descripción, `href` y un flag `available` para las categorías que todavía no tienen catálogo propio.
- `components/categories/category-card.tsx` — componente reutilizable: imagen con `next/image`, overlay oscuro, nombre, descripción, botón "Explorar", zoom en hover. Para categorías sin página real (`available: false`) muestra un badge "Próximamente" y dispara un toast en vez de navegar, para no enlazar a rutas rotas.
- `components/categories/categories-section.tsx` — grilla responsive (3 columnas desktop / 2 tablet / 1 mobile) renderizada con `.map()`.
- `next.config.ts` ampliado: `images.unsplash.com` sumado a `remotePatterns` (necesario para que `next/image` optimice las fotos externas).

## Decisiones técnicas

- Solo Hombre, Mujer y Accesorios (las 3 categorías con página real del Sprint 2) son navegables; Niños, Calzado y Novedades quedan marcadas como "Próximamente" hasta que exista su catálogo.
- Se eliminaron `components/home/featured-categories.tsx` y `components/home/category-card.tsx` (versión Sprint 1), totalmente reemplazados.

## Verificación

`npm run build` exitoso. Confirmado en navegador: grid responsive en las 3 resoluciones, imágenes cargando (200 OK vía `/_next/image`), navegación real a categorías disponibles, toast en las no disponibles.

## Qué quedó para después

- El resto del rebranding (logo, paleta, tipografía) llegó en el sprint siguiente.
