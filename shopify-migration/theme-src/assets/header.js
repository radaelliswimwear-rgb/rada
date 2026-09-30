/**
 * Header & Navigation JS (Fase 02C). Vanilla JS, sin dependencias.
 * Implementa SOLO: drawer mobile, accesibilidad de dropdown desktop,
 * comportamiento sticky (clase visual al hacer scroll), y el
 * expandir/colapsar del buscador (rehecho en 02J). Las sugerencias de
 * búsqueda viven en search.js (02J) y el carrito en cart.js (02I).
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ============================================================
   STICKY HEADER -- EXACT: scrollY > 8 (mismo umbral real)
   ============================================================ */
function initStickyHeader() {
  const header = document.getElementById("site-header");
  if (!header || !header.hasAttribute("data-sticky")) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ============================================================
   SEARCH TRIGGER (Fase 02J) -- EXACT de components/layout/navbar/
   search.tsx: la lupa expande el input a su izquierda y pasa a ser X
   ("Cerrar buscador"); la X lo cierra. Sin JS la lupa es un link a
   /search. Las sugerencias las maneja <predictive-search> (search.js).
   El real no cierra al hacer clic afuera (solo oculta las sugerencias),
   así que acá tampoco.
   ============================================================ */
function initSearchTrigger() {
  const wrapper = document.querySelector("[data-search-trigger-wrapper]");
  const trigger = wrapper?.querySelector("[data-search-trigger]");
  const input = wrapper?.querySelector("input[name='q']");
  if (!wrapper || !trigger || !input) return;

  const label = trigger.querySelector("[data-search-trigger-label]");
  const openIcon = trigger.querySelector("[data-search-icon='open']");
  const closeIcon = trigger.querySelector("[data-search-icon='close']");

  // Con JS el link pasa a ser un botón que expande/colapsa (disclosure).
  trigger.setAttribute("role", "button");
  trigger.setAttribute("aria-expanded", "false");

  function setOpen(isOpen) {
    wrapper.toggleAttribute("data-open", isOpen);
    trigger.setAttribute("aria-expanded", String(isOpen));
    if (label) label.textContent = isOpen ? trigger.dataset.labelClose : trigger.dataset.labelOpen;
    if (openIcon) openIcon.hidden = isOpen;
    if (closeIcon) closeIcon.hidden = !isOpen;
  }

  function open() {
    setOpen(true);
    input.focus();
  }

  function close() {
    setOpen(false);
    // Avisa a <predictive-search> para que oculte las sugerencias.
    wrapper.dispatchEvent(new CustomEvent("search:collapse"));
    trigger.focus();
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    if (wrapper.hasAttribute("data-open")) {
      close();
    } else {
      open();
    }
  });

  // role="button" sobre un <a>: Espacio también tiene que activarlo.
  trigger.addEventListener("keydown", (event) => {
    if (event.key === " ") {
      event.preventDefault();
      trigger.click();
    }
  });

  // Escape cierra el buscador. Si hay sugerencias abiertas, search.js las
  // cierra primero y corta la propagación: el segundo Escape llega acá.
  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && wrapper.hasAttribute("data-open")) {
      event.preventDefault();
      close();
    }
  });
}

/* ============================================================
   DESKTOP DROPDOWN (capacidad preparada -- ver section-header.css)
   ============================================================ */
function initDesktopDropdowns() {
  const items = document.querySelectorAll(".site-header__nav-item--dropdown");

  items.forEach((item) => {
    const trigger = item.querySelector("[data-dropdown-trigger]");
    const menu = item.querySelector("[data-dropdown-menu]");
    if (!trigger || !menu) return;

    function open() {
      menu.removeAttribute("hidden");
      trigger.setAttribute("aria-expanded", "true");
      item.setAttribute("data-open", "true");
    }

    function close() {
      menu.setAttribute("hidden", "");
      trigger.setAttribute("aria-expanded", "false");
      item.removeAttribute("data-open");
    }

    trigger.addEventListener("click", () => {
      const isOpen = item.hasAttribute("data-open");
      if (isOpen) {
        close();
      } else {
        open();
      }
    });

    item.addEventListener("focusout", (event) => {
      if (!item.contains(event.relatedTarget)) close();
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
        trigger.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!item.contains(event.target)) close();
    });
  });
}

/* ============================================================
   MOBILE MENU DRAWER -- Custom Element
   ============================================================ */
class MobileMenuDrawer extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.trigger = document.querySelector("[data-mobile-menu-trigger]");
    this.closeButton = this.querySelector("[data-mobile-menu-close]");
    this.overlay = this.querySelector("[data-mobile-menu-overlay]");
    this.panel = this.querySelector(".mobile-menu-drawer__panel");

    this.trigger?.addEventListener("click", () => this.open());
    this.closeButton?.addEventListener("click", () => this.close());
    this.overlay?.addEventListener("click", () => this.close());
    this.addEventListener("keydown", (event) => this.handleKeydown(event));

    this.initSubmenus();
  }

  open() {
    this.removeAttribute("hidden");
    // requestAnimationFrame para que la transición de entrada (transform)
    // sí se anime -- si se agrega [data-open] en el mismo frame que se
    // quita [hidden], el navegador no anima el estado inicial.
    requestAnimationFrame(() => {
      this.setAttribute("data-open", "true");
    });
    document.body.classList.add("has-mobile-menu-open");
    this.trigger?.setAttribute("aria-expanded", "true");
    const firstFocusable = this.panel?.querySelector(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();
  }

  close() {
    this.removeAttribute("data-open");
    document.body.classList.remove("has-mobile-menu-open");
    this.trigger?.setAttribute("aria-expanded", "false");
    this.trigger?.focus();
    // Espera a que termine la transición de salida antes de re-aplicar
    // [hidden] (evita un "salto" visual del panel).
    window.setTimeout(() => {
      if (!this.hasAttribute("data-open")) this.setAttribute("hidden", "");
    }, 220);
  }

  handleKeydown(event) {
    if (event.key === "Escape") {
      this.close();
      return;
    }
    if (event.key === "Tab") {
      this.trapFocus(event);
    }
  }

  /** Focus trap básico: mientras el drawer está abierto, Tab/Shift+Tab
   *  quedan dentro del panel -- no un trap-library completo, cubre el
   *  caso real (primer/último elemento enfocable). */
  trapFocus(event) {
    if (!this.panel) return;
    const focusable = this.panel.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  initSubmenus() {
    const triggers = this.querySelectorAll("[data-mobile-submenu-trigger]");
    triggers.forEach((trigger) => {
      const submenu = document.getElementById(trigger.getAttribute("aria-controls"));
      if (!submenu) return;
      const backButton = submenu.querySelector("[data-mobile-submenu-back]");

      trigger.addEventListener("click", () => {
        submenu.removeAttribute("hidden");
        trigger.setAttribute("aria-expanded", "true");
        backButton?.focus();
      });

      backButton?.addEventListener("click", () => {
        submenu.setAttribute("hidden", "");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      });
    });
  }
}

window.Radaelli.defineElement("mobile-menu-drawer", MobileMenuDrawer);

initStickyHeader();
initSearchTrigger();
initDesktopDropdowns();
