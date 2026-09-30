/**
 * Collection Page JS (Fase 02G). 2 responsabilidades, ambas justificadas
 * por lo que Liquid/CSS no pueden resolver solos:
 *
 * 1. Selector de columnas 2/3/4 (EXACT: réplica de catalog-toolbar.tsx
 *    real, param `vista`). Liquid renderiza en el servidor y NO tiene
 *    acceso a query params arbitrarios (a diferencia de `page`/
 *    `sort_by`/filtros nativos, que sí resuelve `collection`/`paginate`) --
 *    por eso esto es 100% client-side: lee `vista` de la URL al cargar,
 *    aplica la clase .grid--N, y al hacer click actualiza la URL
 *    (history.replaceState, sin recargar) + la clase, igual criterio que
 *    el real (router.replace, sin push a history, sin scroll jump).
 *
 * 2. Drawer de filtros mobile (bottom-sheet) -- mismo patrón que
 *    MobileMenuDrawer (header.js): Custom Element, focus trap, Escape,
 *    scroll lock, sin librería.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ============================================================
   SELECTOR DE COLUMNAS (2/3/4) -- Custom Element
   ============================================================ */
class CollectionToolbar extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.viewButtons = this.querySelectorAll("[data-view-button]");
    this.grid = document.querySelector("[data-collection-grid]");
    this.drawerTrigger = this.querySelector("[data-filter-drawer-trigger]");

    const params = new URLSearchParams(window.location.search);
    const defaultView = this.dataset.defaultView || "3";
    // 03E (SEC-04): solo 2/3/4. Un valor con espacios (?vista=2%203) hacía
    // tirar classList.add y abortaba onConnect: sin botones ni drawer.
    const requestedView = params.get("vista");
    const currentView = ["2", "3", "4"].includes(requestedView) ? requestedView : defaultView;
    this.applyView(currentView, { updateUrl: false });

    this.viewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.applyView(button.dataset.viewButton, { updateUrl: true });
      });
    });

    this.drawerTrigger?.addEventListener("click", () => {
      const drawer = document.getElementById("collection-filter-drawer");
      drawer?.open?.();
    });
  }

  applyView(columns, { updateUrl }) {
    if (!this.grid) return;
    this.grid.classList.remove("grid--2", "grid--3", "grid--4");
    this.grid.classList.add(`grid--${columns}`);

    this.viewButtons.forEach((button) => {
      const isActive = button.dataset.viewButton === String(columns);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (updateUrl) {
      const params = new URLSearchParams(window.location.search);
      const defaultView = this.dataset.defaultView || "3";
      if (String(columns) === defaultView) {
        params.delete("vista");
      } else {
        params.set("vista", String(columns));
      }
      const query = params.toString();
      const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }
}

window.Radaelli.defineElement("collection-toolbar", CollectionToolbar);

/* ============================================================
   FILTER DRAWER -- Custom Element (mismo patrón que MobileMenuDrawer)
   ============================================================ */
class FilterDrawer extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.trigger = document.querySelector("[data-filter-drawer-trigger]");
    this.overlay = this.querySelector("[data-filter-drawer-overlay]");
    this.panel = this.querySelector(".filter-drawer__panel");
    this.closeButtons = this.querySelectorAll("[data-filter-drawer-close]");

    this.closeButtons.forEach((button) => button.addEventListener("click", () => this.close()));
    this.overlay?.addEventListener("click", () => this.close());
    this.addEventListener("keydown", (event) => this.handleKeydown(event));
  }

  open() {
    this.removeAttribute("hidden");
    requestAnimationFrame(() => {
      this.setAttribute("data-open", "true");
    });
    document.body.classList.add("has-filter-drawer-open");
    this.trigger?.setAttribute("aria-expanded", "true");
    const firstFocusable = this.panel?.querySelector(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();
  }

  close() {
    this.removeAttribute("data-open");
    document.body.classList.remove("has-filter-drawer-open");
    this.trigger?.setAttribute("aria-expanded", "false");
    this.trigger?.focus();
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
}

window.Radaelli.defineElement("filter-drawer", FilterDrawer);

/* ============================================================
   ORDEN (03E) -- reemplaza el onchange="this.form.submit()" inline
   (único JS inline del theme, SEC-06). Con mouse/touch aplica al elegir
   (EXACT real: el SortSelect navega al cambiar); con teclado NO navega en
   cada flecha (WCAG 3.2.2, A11Y-03): aplica con Enter o con el botón
   "Aplicar" del mismo form, que también es el camino sin JS.
   ============================================================ */
const SORT_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"];
document.querySelectorAll('.collection-filters select[name="sort_by"]').forEach((select) => {
  let keyboardChange = false;
  select.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      select.form?.requestSubmit();
      return;
    }
    if (SORT_KEYS.includes(event.key) || event.key.length === 1) keyboardChange = true;
  });
  select.addEventListener("pointerdown", () => {
    keyboardChange = false;
  });
  select.addEventListener("change", () => {
    if (keyboardChange) {
      keyboardChange = false;
      return;
    }
    select.form?.requestSubmit();
  });
});

/* ============================================================
   VOLVER ATRÁS (03D) -- el navegador restaura la página desde el bfcache
   con el ÚLTIMO valor tocado en los controles, no con el que dibujó el
   servidor para esa URL (verificado en la Dev Store: "atrás" a la URL sin
   sort_by mostraba "Precio, menor a mayor" con las tarjetas en orden
   manual). Se re-sincroniza con los valores del HTML y se cierra el
   drawer si la navegación salió desde él. Solo en restauraciones: en una
   carga normal no se toca nada que la clienta ya haya escrito.
   ============================================================ */
window.addEventListener("pageshow", (event) => {
  const navigation = performance.getEntriesByType?.("navigation")[0];
  if (!event.persisted && navigation?.type !== "back_forward") return;
  document.querySelectorAll(".collection-filters select").forEach((select) => {
    const initial = [...select.options].find((option) => option.defaultSelected) ?? select.options[0];
    if (initial) select.value = initial.value;
  });
  document.querySelectorAll('.collection-filters input[type="number"]').forEach((input) => {
    input.value = input.defaultValue;
  });
  const drawer = document.getElementById("collection-filter-drawer");
  if (drawer && (drawer.hasAttribute("data-open") || !drawer.hasAttribute("hidden"))) {
    drawer.removeAttribute("data-open");
    drawer.setAttribute("hidden", "");
    document.body.classList.remove("has-filter-drawer-open");
    document.querySelector("[data-filter-drawer-trigger]")?.setAttribute("aria-expanded", "false");
  }
});
