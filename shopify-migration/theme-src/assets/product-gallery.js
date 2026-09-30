/**
 * Galería de la PDP (Fase 02H). Réplica de components/product/gallery.tsx:
 *   - flechas y miniaturas en escritorio, swipe + puntos en mobile;
 *   - navegación circular (después de la última vuelve a la primera);
 *   - lupa tipo background-position al pasar el mouse (solo puntero fino,
 *     desde lg), con el mismo 220% del real;
 *   - clic en la foto -> visor a pantalla completa ya acercado (x2.5).
 *
 * El swipe mobile es scroll-snap nativo (ver CSS): este archivo solo
 * detecta qué foto quedó visible (IntersectionObserver) para actualizar
 * puntos/contador. Tampoco hay listeners por foto: un solo listener en el
 * track para abrir el visor.
 */

const GALLERY_MAGNIFIER_SIZE = "220%";

class ProductGallery extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.track = this.querySelector("[data-gallery-track]");
    if (!this.track) return;

    this.slides = Array.from(this.querySelectorAll("[data-gallery-slide]"));
    this.thumbs = Array.from(this.querySelectorAll("[data-gallery-thumb]"));
    this.dots = Array.from(this.querySelectorAll("[data-gallery-dot]"));
    this.counter = this.querySelector("[data-gallery-counter]");
    this.status = this.querySelector("[data-gallery-status]");
    this.magnifier = this.querySelector("[data-gallery-magnifier]");
    this.lightbox = this.querySelector("product-lightbox");
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.index = Math.max(
      0,
      this.slides.findIndex((slide) => slide.classList.contains("is-active")),
    );
    this.pendingIndex = null;

    this.querySelector("[data-gallery-prev]")?.addEventListener("click", () => this.goTo(this.index - 1));
    this.querySelector("[data-gallery-next]")?.addEventListener("click", () => this.goTo(this.index + 1));
    this.thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => this.goTo(i)));

    this.track.addEventListener("click", (event) => {
      const button = event.target.closest("[data-gallery-open]");
      if (!button || !this.lightbox?.open) return;
      const slide = button.closest("[data-gallery-slide]");
      this.lightbox.open(slide.dataset.mediaId, { scale: 2.5, opener: button });
    });

    this.observer = new IntersectionObserver((entries) => this.onIntersect(entries), {
      root: this.track,
      threshold: 0.6,
    });
    this.slides.forEach((slide) => this.observer.observe(slide));

    if (this.magnifier) this.initMagnifier();

    this.onVariantChange = (event) => {
      if (event.detail?.sectionId !== this.dataset.sectionId) return;
      const mediaId = event.detail.variant?.featuredMediaId;
      if (!mediaId) return;
      const i = this.slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
      if (i !== -1 && i !== this.index) this.goTo(i);
    };
    document.addEventListener("product:variant-change", this.onVariantChange);

    // Foto inicial distinta de la primera (?variant= con foto propia):
    // posicionar sin animación.
    if (this.index > 0) this.scrollToIndex(this.index, "instant");
  }

  onDisconnect() {
    this.observer?.disconnect();
    document.removeEventListener("product:variant-change", this.onVariantChange);
  }

  goTo(target) {
    const count = this.slides.length;
    if (count === 0) return;
    const i = (target + count) % count;
    const behavior = this.reducedMotion.matches ? "instant" : "smooth";
    if (i === this.index) {
      this.scrollToIndex(i, behavior);
      return;
    }
    // Si el scroll no llega a disparar el observer (p. ej. interrumpido por
    // un toque), no dejar la galería "esperando" para siempre.
    this.pendingIndex = i;
    window.clearTimeout(this.pendingTimer);
    this.pendingTimer = window.setTimeout(() => {
      this.pendingIndex = null;
    }, 1000);
    this.setActive(i);
    this.scrollToIndex(i, behavior);
  }

  scrollToIndex(i, behavior) {
    const slide = this.slides[i];
    if (!slide) return;
    this.track.scrollTo({ left: slide.offsetLeft, behavior });
  }

  onIntersect(entries) {
    const visible = entries.find((entry) => entry.isIntersecting);
    if (!visible) return;
    const i = this.slides.indexOf(visible.target);
    // Durante un salto programado (miniatura/flecha/variante) el scroll
    // suave pasa por las fotos intermedias: se ignoran hasta llegar.
    if (this.pendingIndex !== null) {
      if (i === this.pendingIndex) {
        this.pendingIndex = null;
        window.clearTimeout(this.pendingTimer);
      }
      return;
    }
    if (i !== this.index) this.setActive(i);
  }

  setActive(i) {
    this.index = i;
    const total = this.slides.length;

    this.slides.forEach((slide, j) => {
      const isActive = j === i;
      slide.classList.toggle("is-active", isActive);
      slide.querySelector("[data-gallery-open]")?.setAttribute("tabindex", isActive ? "0" : "-1");
      if (!isActive) slide.querySelector("video")?.pause();
    });
    this.dots.forEach((dot, j) => dot.classList.toggle("is-active", j === i));
    this.thumbs.forEach((thumb, j) => thumb.setAttribute("aria-current", String(j === i)));

    const counterText = this.dataset.counterTemplate.replace("__CURRENT__", String(i + 1));
    if (this.counter) this.counter.textContent = counterText;
    if (this.status) this.status.textContent = counterText;
    this.hideMagnifier();

    this.dispatchEvent(
      new CustomEvent("product:gallery-change", {
        bubbles: true,
        detail: { sectionId: this.dataset.sectionId, index: i, total, mediaId: this.slides[i].dataset.mediaId },
      }),
    );
  }

  initMagnifier() {
    const viewport = this.track.parentElement;
    const canMagnify = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");

    viewport.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || !canMagnify.matches) return;
      const slide = this.slides[this.index];
      const image = slide?.dataset.mediaType === "image" ? slide.querySelector("img") : null;
      if (!image) {
        this.hideMagnifier();
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      // currentSrc = la versión que el navegador YA descargó para esta
      // foto: la lupa aparece al instante, sin otra descarga (igual que
      // el real, que reusa el mismo src).
      const source = image.currentSrc || image.src;
      if (this.magnifier.dataset.source !== source) {
        this.magnifier.style.backgroundImage = `url("${source}")`;
        this.magnifier.style.backgroundSize = GALLERY_MAGNIFIER_SIZE;
        this.magnifier.dataset.source = source;
      }
      this.magnifier.style.backgroundPosition = `${x}% ${y}%`;
      this.magnifier.hidden = false;
    });
    viewport.addEventListener("pointerleave", () => this.hideMagnifier());
  }

  hideMagnifier() {
    if (this.magnifier) this.magnifier.hidden = true;
  }
}

window.Radaelli.defineElement("product-gallery", ProductGallery);
