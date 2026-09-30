# 03M — C4: contraste de los botones blancos sobre arena (parche preparado, NO aplicado ni publicado)

- **Estado:** `OWNER DECISION`. El parche `launch/03m/c4-contrast-option-a.patch` **no se aplicó** a `theme-src` ni se subió a ninguna tienda: cambia el aspecto visible de la marca (texto oscuro en el botón principal del hero y del banner) y la decisión es de la dueña.
- **Medición (fórmula WCAG 2.x, cálculo de 03E):** texto blanco `#ffffff` sobre la arena `#d6c5ae` = **1,69:1** (falla AA 4,5:1; igual que el sitio actual). Opción A: texto `#171717` sobre `#d6c5ae` = **8,34:1** (pasa AA y AAA); en hover, texto blanco sobre negro `#000` = **21:1**.
- **Parche (opción A):** 4 cambios de color en `assets/section-hero.css` y `assets/section-promo.css` (el CTA y su hover). Sin cambios de layout ni de tokens.
- **Otras opciones para la dueña:** B) arena más oscuro con texto blanco (cambia el color de marca); C) excepción firmada (se lanza con 1,69:1, igual que el sitio actual).
- **Si elige A:** aplicar el parche en `theme-src`, construir RC1.11 (Theme Check, regresión completa 89/89, mutante nuevo, dos construcciones con el mismo hash), subirlo sin publicar y repetir la paridad. Sin decisión, RC1.10 queda como candidato.
