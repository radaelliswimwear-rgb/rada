/**
 * Visor de pantalla completa de la PDP (Fase 02H). Réplica de
 * components/product-detail/product-lightbox.tsx:
 *   - zoom 1x..4x con rueda (±0.3), botones y teclado (+ / -) (±0.5);
 *   - clic/tap sobre la foto alterna 2.5x <-> 1x (salvo que haya sido el
 *     final de un arrastre de más de 6px);
 *   - arrastrar para mover cuando está ampliada; pinch con dos dedos;
 *   - flechas del teclado y botones para anterior/siguiente (circular);
 *   - miniaturas abajo; Escape cierra; fondo oscuro.
 *
 * Diferencias deliberadas:
 *   - <dialog> nativo con showModal(): el foco inicial, Escape, el fondo
 *     inerte y el top layer (nunca queda debajo del header sticky) los
 *     resuelve el navegador; el scroll de la página se bloquea con CSS
 *     (:root:has(dialog[open])).
 *   - Pointer Events unificados (mouse + touch + lápiz) en vez de dos
 *     juegos de handlers mouse/touch.
 *   - Límites de arrastre: la foto ampliada no se puede sacar de la
 *     pantalla (el real no tiene tope).
 *   - La caja de la foto ("contain") se calcula en CSS con unidades de
 *     container query -- el real necesitaba ResizeObserver + cálculo a mano.
 *   - Carga bajo demanda: cada foto grande se descarga recién al mostrarse
 *     (el real pide todas con prioridad al abrir).
 */

const LIGHTBOX_MIN_SCALE = 1;
const LIGHTBOX_MAX_SCALE = 4;
const LIGHTBOX_TAP_SCALE = 2.5;
const LIGHTBOX_MOVE_THRESHOLD = 6;

function clampScale(value) {
  return Math.min(LIGHTBOX_MAX_SCALE, Math.max(LIGHTBOX_MIN_SCALE, value));
}

/** Máximo desplazamiento permitido por eje para que la foto no se salga. */
function panLimit(baseSize, scale, viewportSize) {
  return Math.max(0, (baseSize * scale - viewportSize) / 2);
}

class ProductLightbox extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.dialog = this.querySelector("[data-lightbox-dialog]");
    this.viewer = this.querySelector("[data-lightbox-viewer]");
    this.stage = this.querySelector("[data-lightbox-stage]");
    this.slides = Array.from(this.querySelectorAll("[data-lightbox-slide]"));
    this.thumbs = Array.from(this.querySelectorAll("[data-lightbox-thumb]"));
    this.counter = this.querySelector("[data-lightbox-counter]");
    if (!this.dialog || !this.viewer || !this.stage) return;

    this.index = 0;
    this.scale = 1;
    this.offset = { x: 0, y: 0 };
    this.pointers = new Map();
    this.pinch = null;
    this.drag = null;
    this.moved = false;
    this.downTarget = null;

    this.querySelector("[data-lightbox-close]")?.addEventListener("click", () => this.close());
    this.querySelector("[data-lightbox-zoom-in]")?.addEventListener("click", () => this.setScale(this.scale + 0.5));
    this.querySelector("[data-lightbox-zoom-out]")?.addEventListener("click", () => this.setScale(this.scale - 0.5));
    this.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => this.goTo(this.index - 1));
    this.querySelector("[data-lightbox-next]")?.addEventListener("click", () => this.goTo(this.index + 1));
    this.thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => this.goTo(i)));

    this.dialog.addEventListener("keydown", (event) => this.onKeydown(event));
    this.dialog.addEventListener("close", () => this.onClosed());

    this.viewer.addEventListener("wheel", (event) => this.onWheel(event), { passive: false });
    this.viewer.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.viewer.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.viewer.addEventListener("pointerup", (event) => this.onPointerEnd(event));
    this.viewer.addEventListener("pointercancel", (event) => this.onPointerEnd(event));
    this.viewer.addEventListener("click", (event) => this.onViewerClick(event));
    this.viewer.addEventListener("dragstart", (event) => event.preventDefault());

    this.onResize = () => {
      if (!this.dialog.open) return;
      this.clampOffset();
      this.apply();
    };
    window.addEventListener("resize", this.onResize);
  }

  onDisconnect() {
    window.removeEventListener("resize", this.onResize);
  }

  open(mediaId, { scale = 1, opener } = {}) {
    if (!this.dialog || this.dialog.open) return;
    this.opener = opener ?? document.activeElement;
    const i = this.slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
    this.dialog.showModal();
    this.goTo(i === -1 ? 0 : i);
    this.setScale(scale);
  }

  close() {
    this.dialog?.close();
  }

  onClosed() {
    this.pointers.clear();
    this.pinch = null;
    this.drag = null;
    this.resetZoom();
    this.opener?.focus?.();
  }

  goTo(target) {
    const count = this.slides.length;
    if (count === 0) return;
    this.index = (target + count) % count;
    this.slides.forEach((slide, j) => {
      slide.hidden = j !== this.index;
    });
    this.thumbs.forEach((thumb, j) => thumb.setAttribute("aria-current", String(j === this.index)));
    this.thumbs[this.index]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (this.counter) {
      this.counter.textContent = this.dataset.counterTemplate.replace("__CURRENT__", String(this.index + 1));
    }
    this.resetZoom();
  }

  resetZoom() {
    this.scale = 1;
    this.offset = { x: 0, y: 0 };
    this.apply();
  }

  setScale(value) {
    this.scale = clampScale(value);
    if (this.scale === LIGHTBOX_MIN_SCALE) this.offset = { x: 0, y: 0 };
    this.clampOffset();
    this.apply();
  }

  toggleZoom() {
    if (this.scale > LIGHTBOX_MIN_SCALE) {
      this.resetZoom();
    } else {
      this.setScale(LIGHTBOX_TAP_SCALE);
    }
  }

  clampOffset() {
    const frame = this.slides[this.index];
    if (!frame) return;
    const maxX = panLimit(frame.offsetWidth, this.scale, this.viewer.clientWidth);
    const maxY = panLimit(frame.offsetHeight, this.scale, this.viewer.clientHeight);
    this.offset.x = Math.min(maxX, Math.max(-maxX, this.offset.x));
    this.offset.y = Math.min(maxY, Math.max(-maxY, this.offset.y));
  }

  apply() {
    if (!this.stage) return;
    this.stage.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px) scale(${this.scale})`;
    this.viewer.toggleAttribute("data-zoomed", this.scale > LIGHTBOX_MIN_SCALE);
  }

  setDragging(isDragging) {
    this.viewer.classList.toggle("is-dragging", isDragging);
  }

  pinchDistance() {
    const [a, b] = Array.from(this.pointers.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  onKeydown(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.goTo(this.index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      this.goTo(this.index + 1);
    } else if (event.key === "+" || event.key === "=") {
      this.setScale(this.scale + 0.5);
    } else if (event.key === "-") {
      this.setScale(this.scale - 0.5);
    }
  }

  onWheel(event) {
    event.preventDefault();
    this.setScale(this.scale + (event.deltaY < 0 ? 0.3 : -0.3));
  }

  onPointerDown(event) {
    // Los botones (anterior/siguiente) manejan su propio clic: capturar el
    // puntero acá les robaría el evento.
    if (event.target.closest("button")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    this.downTarget = event.target;
    this.viewer.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size === 1) {
      this.moved = false;
      this.start = { x: event.clientX, y: event.clientY };
      if (this.scale > LIGHTBOX_MIN_SCALE) {
        this.drag = { x: event.clientX, y: event.clientY, offsetX: this.offset.x, offsetY: this.offset.y };
        this.setDragging(true);
      }
    } else if (this.pointers.size === 2) {
      // Un pinch nunca cuenta como "tap".
      this.moved = true;
      this.drag = null;
      this.pinch = { distance: this.pinchDistance(), scale: this.scale };
      this.setDragging(true);
    }
  }

  onPointerMove(event) {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pinch && this.pointers.size >= 2) {
      const distance = this.pinchDistance();
      if (this.pinch.distance > 0) {
        this.scale = clampScale(this.pinch.scale * (distance / this.pinch.distance));
        this.clampOffset();
        this.apply();
      }
      return;
    }

    if (this.start) {
      const dx = event.clientX - this.start.x;
      const dy = event.clientY - this.start.y;
      if (Math.abs(dx) > LIGHTBOX_MOVE_THRESHOLD || Math.abs(dy) > LIGHTBOX_MOVE_THRESHOLD) {
        this.moved = true;
      }
    }

    if (this.drag) {
      this.offset = {
        x: this.drag.offsetX + (event.clientX - this.drag.x),
        y: this.drag.offsetY + (event.clientY - this.drag.y),
      };
      this.clampOffset();
      this.apply();
    }
  }

  onPointerEnd(event) {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.delete(event.pointerId);

    if (this.pointers.size < 2) this.pinch = null;

    if (this.pointers.size === 1 && this.scale > LIGHTBOX_MIN_SCALE) {
      // Terminó el pinch pero queda un dedo: seguir moviendo desde ahí.
      const [remaining] = Array.from(this.pointers.values());
      this.drag = { x: remaining.x, y: remaining.y, offsetX: this.offset.x, offsetY: this.offset.y };
    }

    if (this.pointers.size === 0) {
      this.drag = null;
      this.start = null;
      this.setDragging(false);
      if (this.scale <= LIGHTBOX_MIN_SCALE) this.resetZoom();
    }
  }

  onViewerClick(event) {
    if (event.target.closest("button")) return;
    const target = this.downTarget ?? event.target;
    this.downTarget = null;
    if (this.moved) {
      this.moved = false;
      return;
    }
    if (target.closest("[data-lightbox-slide]")) {
      this.toggleZoom();
    } else if (this.scale === LIGHTBOX_MIN_SCALE) {
      // Clic en el área oscura alrededor de la foto: cerrar.
      this.close();
    }
  }
}

window.Radaelli.defineElement("product-lightbox", ProductLightbox);
