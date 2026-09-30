/**
 * Framing dinámico del banner de colección (Fase 02G). EXACT: puerto de
 * getBackgroundFrame/getBackgroundPosition (lib/image-framing.ts real) +
 * el ResizeObserver de components/catalog/category-banner-background.tsx.
 *
 * Por qué existe: el banner real vive en una caja de alto responsive
 * (`h-[38vh] min-h-[260px]`), así que su aspect-ratio real cambia por
 * viewport -- el cálculo de "background-size: cover" con zoom/posición
 * necesita el aspect-ratio REAL medido del contenedor. Liquid renderiza
 * en el servidor y no puede medir el layout; CSS puro tampoco puede
 * reaccionar al resize con esta fórmula. De ahí este JS mínimo,
 * exactamente igual de justificado que el real.
 */

// EXACT: misma fórmula real (lib/image-framing.ts getBackgroundFrame)
function getBackgroundFrame(imageWidth, imageHeight, containerAspect, zoom) {
  const imageAspect = imageWidth / imageHeight;
  let widthPercent;
  let heightPercent;

  if (imageAspect > containerAspect) {
    heightPercent = 100 * zoom;
    widthPercent = 100 * (imageAspect / containerAspect) * zoom;
  } else {
    widthPercent = 100 * zoom;
    heightPercent = 100 * (containerAspect / imageAspect) * zoom;
  }

  return `${widthPercent}% ${heightPercent}%`;
}

// EXACT: misma fórmula real (lib/image-framing.ts getBackgroundPosition)
function getBackgroundPosition(posX, posY) {
  return `${posX}% ${posY}%`;
}

function initCollectionBannerFraming() {
  const el = document.querySelector("[data-collection-banner-frame]");
  if (!el) return;

  const imageUrl = el.dataset.imageUrl;
  const imageWidth = Number(el.dataset.imageWidth);
  const imageHeight = Number(el.dataset.imageHeight);
  const posX = Number(el.dataset.posX);
  const posY = Number(el.dataset.posY);
  const zoom = Number(el.dataset.zoom) || 1;

  if (!imageUrl || !imageWidth || !imageHeight) return;

  el.style.backgroundImage = `url(${imageUrl})`;
  el.style.backgroundRepeat = "no-repeat";
  el.style.backgroundPosition = getBackgroundPosition(posX, posY);

  // EXACT: banner: 12/5 real (lib/image-framing.ts CONTAINER_ASPECT.banner)
  // hasta que el ResizeObserver mida el alto real -- evita fondo en blanco
  // durante el primer paint (mismo criterio que el componente real).
  let containerAspect = 12 / 5;
  const applyFrame = () => {
    el.style.backgroundSize = getBackgroundFrame(imageWidth, imageHeight, containerAspect, zoom);
  };
  applyFrame();

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        containerAspect = width / height;
        applyFrame();
      }
    });
    observer.observe(el);
  }
}

initCollectionBannerFraming();
