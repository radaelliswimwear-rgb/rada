// Relación de aspecto (ancho/alto) de cada marco — fija por diseño, no
// depende del tamaño real en píxeles en pantalla (responsive por %).
// cover: 16/9 desde Sprint 22 (antes 3/4) — la tarjeta de categoría del home
// pasó de 2 por fila a 1 por fila a todo el ancho, así que el marco se volvió
// panorámico en vez de vertical (ver components/categories/category-card.tsx
// y CategoryImageFramer, que comparten esta misma constante).
export const CONTAINER_ASPECT: Record<"cover" | "banner", number> = {
  cover: 16 / 9,
  banner: 12 / 5,
};

// Zoom + encuadre de las fotos de categoría (portada del home, banner de
// colección) vía background-image — NO usar <img> con
// object-fit/object-position + transform:scale para esto: el navegador
// decide el recorte de object-fit ANTES de aplicar el transform, así que
// "zoom" solo amplía lo que ya quedó recortado y mover object-position
// nunca revela contenido nuevo de la imagen. Confirmado con una prueba CSS
// aislada (sin componentes de React) durante el desarrollo de este editor.
//
// background-size/background-position no tienen ese problema: el navegador
// los resuelve juntos en una sola pasada. Trabajar en porcentajes (no
// píxeles) los hace responsive sin necesitar medir el contenedor en JS —
// solo hace falta la relación de aspecto real de la imagen (guardada al
// subir, ver Category.coverImageWidth/Height) y la relación de aspecto del
// marco (fija por diseño: 3/4 la portada, 12/5 el banner).
export function getBackgroundFrame(
  imageWidth: number,
  imageHeight: number,
  containerAspect: number,
  zoom: number,
): { backgroundSize: string } {
  const imageAspect = imageWidth / imageHeight;
  let widthPercent: number;
  let heightPercent: number;

  if (imageAspect > containerAspect) {
    // La imagen es "más panorámica" que el marco: a zoom 1 cubre por
    // altura (100%) y sobra a los costados.
    heightPercent = 100 * zoom;
    widthPercent = 100 * (imageAspect / containerAspect) * zoom;
  } else {
    widthPercent = 100 * zoom;
    heightPercent = 100 * (containerAspect / imageAspect) * zoom;
  }

  return { backgroundSize: `${widthPercent}% ${heightPercent}%` };
}

export function getBackgroundPosition(posX: number, posY: number): string {
  return `${posX}% ${posY}%`;
}
