/**
 * Product carousel JS (Fase 02E). EXACT: réplica de la lógica real
 * compartida por components/home/product-carousel.tsx (usada hoy por
 * SunsetCollection, FeaturedProducts y RecommendedForYou) -- mismo
 * EPSILON, mismo cálculo de distancia de scroll (offsetWidth de la
 * primera tarjeta + 24px de gap), mismo scrollBy({behavior:'smooth'}).
 * Sin librería de carrusel -- scroll-snap nativo (ver
 * assets/component-carousel.css) + este JS solo maneja las flechas.
 */

const CAROUSEL_EPSILON = 4;
const CAROUSEL_GAP_PX = 24; // EXACT: debe coincidir con --space-6 (gap real, gap-6) en component-carousel.css

class ProductCarousel extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.track = this.querySelector("[data-carousel-track]");
    this.prevButton = this.querySelector("[data-carousel-prev]");
    this.nextButton = this.querySelector("[data-carousel-next]");
    if (!this.track || !this.prevButton || !this.nextButton) return;

    this.updateArrows = this.updateArrows.bind(this);
    this.track.addEventListener("scroll", this.updateArrows, { passive: true });
    window.addEventListener("resize", this.updateArrows);
    this.prevButton.addEventListener("click", () => this.scrollByCard(-1));
    this.nextButton.addEventListener("click", () => this.scrollByCard(1));

    // El layout todavía puede no estar listo en connectedCallback (imágenes
    // sin cargar aún) -- un frame extra asegura que scrollWidth/clientWidth
    // ya reflejen el ancho real de las tarjetas.
    requestAnimationFrame(this.updateArrows);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    if (!this.track) return;
    this.track.removeEventListener("scroll", this.updateArrows);
    window.removeEventListener("resize", this.updateArrows);
  }

  updateArrows() {
    const { scrollLeft, clientWidth, scrollWidth } = this.track;
    const canScrollPrev = scrollLeft > CAROUSEL_EPSILON;
    const canScrollNext = scrollLeft + clientWidth < scrollWidth - CAROUSEL_EPSILON;
    // 03E (A11Y-10): si la flecha que tiene el foco se oculta, el foco pasa
    // a la otra en vez de perderse en <body>.
    const focused = document.activeElement;
    this.prevButton.hidden = !canScrollPrev;
    this.nextButton.hidden = !canScrollNext;
    if (focused === this.prevButton && this.prevButton.hidden && !this.nextButton.hidden) this.nextButton.focus();
    if (focused === this.nextButton && this.nextButton.hidden && !this.prevButton.hidden) this.prevButton.focus();
  }

  scrollByCard(direction) {
    const firstCard = this.track.querySelector("[data-carousel-item]");
    const amount = (firstCard?.offsetWidth || 320) + CAROUSEL_GAP_PX;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.track.scrollBy({ left: direction * amount, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
}

window.Radaelli.defineElement("product-carousel", ProductCarousel);
