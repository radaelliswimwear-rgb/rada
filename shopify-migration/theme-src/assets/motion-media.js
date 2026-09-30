/*
  03K (A11Y-13): movimiento reducido para los videos decorativos con autoplay
  (hero, tarjetas de categoría y banner de colección; ver theme/03E-accessibility-static-audit.md).

  Los navegadores NO pausan un <video autoplay> por la preferencia "reducir movimiento" del
  sistema. Acá se pausa y se le quita autoplay mientras la preferencia esté activa (queda el
  póster o el primer cuadro), y se reanuda si la persona la apaga. Los videos de la ficha de
  producto llevan controles y los maneja la persona: no se tocan.

  Sin video cargado (hoy la media está pendiente, A4) el módulo no hace nada.
*/
const SELECTOR = 'video.section-hero__video, video.section-categories__media-el, video.collection-banner__media';

function apply(reduce) {
  document.querySelectorAll(SELECTOR).forEach((video) => {
    if (reduce) {
      if (video.dataset.motionPaused === 'true') return;
      video.dataset.motionPaused = 'true';
      video.removeAttribute('autoplay');
      video.pause();
    } else if (video.dataset.motionPaused === 'true') {
      delete video.dataset.motionPaused;
      video.setAttribute('autoplay', '');
      const started = video.play();
      if (started && typeof started.catch === 'function') started.catch(() => {});
    }
  });
}

const query = window.matchMedia('(prefers-reduced-motion: reduce)');
apply(query.matches);
query.addEventListener('change', (event) => apply(event.matches));
// Editor de temas: una sección con video recién agregada o recargada.
document.addEventListener('shopify:section:load', () => apply(query.matches));

// Punto de prueba (el arnés no puede cambiar la preferencia del sistema).
window.Radaelli = window.Radaelli || {};
window.Radaelli.applyReducedMotion = apply;
