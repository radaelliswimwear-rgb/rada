/**
 * Búsqueda (Fase 02J): sugerencias del buscador del header
 * (<predictive-search>) + hooks neutros de analytics. Vanilla JS, sin
 * dependencias. Ver theme/search-report.md.
 *
 * EXACT de components/layout/navbar/search.tsx:
 *   - sugerencias desde 2 caracteres, debounce de 250 ms, solo productos;
 *   - la lista solo aparece si hay resultados y se oculta al salir del input.
 * Mejoras documentadas: teclado (flechas/Enter/Escape con
 * aria-activedescendant; el real tiene role="combobox" pero no maneja
 * teclas), cancelación de la request anterior (el real deja que una
 * respuesta vieja pise a la nueva) y botón para borrar.
 *
 * Datos: Shopify Predictive Search (routes.predictive_search_url) con
 * section_id=predictive-search, así el HTML y el precio llegan
 * renderizados y escapados por Liquid; acá solo se mueven los <li>.
 *
 * Eventos (en document, sin IDs de GA/Meta):
 *   search:submitted            { query, source: "header" | "mobile-menu" | "page" }
 *   search:suggestion-selected  { query, url, position }
 *   search:results              { query, resultCount }   (página de resultados)
 *   search:no-results           { query, source: "page" | "predictive" }
 */

const MIN_QUERY_LENGTH = 2; // EXACT: query.trim().length < 2 en el real
const DEBOUNCE_MS = 250; // EXACT
const CACHE_LIMIT = 20;
const SEARCH_FIELDS = "title,product_type,tag";

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

class PredictiveSearch extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.input = this.querySelector("input[name='q']");
    this.listbox = this.querySelector("[role='listbox']");
    this.status = this.querySelector("[data-predictive-status]");
    this.clearButton = this.querySelector("[data-search-clear]");
    if (!this.input) return;

    this.cache = new Map();
    this.query = "";
    this.activeIndex = -1;
    this.enabled = this.dataset.enabled === "true" && Boolean(this.listbox);

    this.input.addEventListener("input", () => this.onInput());
    this.clearButton?.addEventListener("click", () => this.clear());
    if (!this.enabled) return;

    this.input.addEventListener("keydown", (event) => this.onKeydown(event));
    this.input.addEventListener("focus", () => {
      if (this.listbox.children.length > 0) this.open();
    });
    // EXACT del real (onBlur): la lista se oculta cuando el foco sale del buscador.
    this.addEventListener("focusout", (event) => {
      if (!this.contains(event.relatedTarget)) this.close();
    });
    // Evita que el clic en una sugerencia le saque el foco al input antes
    // de navegar (Safari no enfoca links al hacer clic). El real lo resolvía
    // con un setTimeout de 150 ms.
    this.listbox.addEventListener("mousedown", (event) => event.preventDefault());
    this.listbox.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link) this.trackSelection(link);
    });
    this.closest("[data-search-trigger-wrapper]")?.addEventListener("search:collapse", () => this.close());
  }

  get options() {
    return [...this.listbox.querySelectorAll("[role='option']")];
  }

  onInput() {
    const value = this.input.value;
    if (this.clearButton) this.clearButton.hidden = value === "";
    if (!this.enabled) return;

    window.clearTimeout(this.debounceTimer);
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      this.abort();
      this.query = "";
      this.reset();
      return;
    }
    this.debounceTimer = window.setTimeout(() => this.search(query), DEBOUNCE_MS);
  }

  async search(query) {
    this.query = query;
    const cacheKey = query.toLowerCase();
    if (this.cache.has(cacheKey)) {
      this.render(this.cache.get(cacheKey), query);
      return;
    }

    // La request anterior se cancela: la respuesta más reciente manda.
    this.abort();
    const controller = new AbortController();
    this.controller = controller;

    // URLSearchParams codifica el texto: nunca se arma la URL a mano.
    const url = new URL(this.dataset.url, window.location.origin);
    url.searchParams.set("q", query);
    url.searchParams.set("resources[type]", "product");
    url.searchParams.set("resources[limit]", this.dataset.limit || "5");
    url.searchParams.set("resources[options][fields]", SEARCH_FIELDS);
    url.searchParams.set("section_id", "predictive-search");

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      this.remember(cacheKey, html);
      if (query === this.query) this.render(html, query);
    } catch (error) {
      if (error.name === "AbortError") return;
      // Mismo criterio que el real (devuelve [] si falla): sin sugerencias,
      // y Enter sigue llevando a la página de resultados.
      if (query === this.query) this.reset();
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }

  abort() {
    this.controller?.abort();
    this.controller = null;
  }

  remember(key, html) {
    this.cache.set(key, html);
    if (this.cache.size > CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value);
  }

  render(html, query) {
    const source = new DOMParser().parseFromString(html, "text/html").querySelector("[data-predictive-results]");
    const options = source ? [...source.querySelectorAll("[role='option']")] : [];
    this.listbox.replaceChildren(...options);
    this.activeIndex = -1;
    this.input.removeAttribute("aria-activedescendant");

    if (options.length === 0) {
      // EXACT: el real no muestra la lista vacía. Solo se anuncia.
      this.close();
      this.announce(this.dataset.labelEmpty);
      emit("search:no-results", { query, source: "predictive" });
      return;
    }

    if (document.activeElement === this.input) this.open();
    const template = options.length === 1 ? this.dataset.labelCountOne : this.dataset.labelCountOther;
    this.announce(template?.replace("__COUNT__", String(options.length)));
  }

  open() {
    this.listbox.hidden = false;
    this.input.setAttribute("aria-expanded", "true");
  }

  close() {
    if (!this.listbox) return;
    this.listbox.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.setActive(-1);
  }

  reset() {
    this.listbox?.replaceChildren();
    this.close();
  }

  clear() {
    window.clearTimeout(this.debounceTimer);
    this.abort();
    this.input.value = "";
    this.query = "";
    if (this.clearButton) this.clearButton.hidden = true;
    this.reset();
    this.input.focus();
  }

  onKeydown(event) {
    const options = this.options;
    switch (event.key) {
      case "ArrowDown": {
        if (options.length === 0) return;
        event.preventDefault();
        this.open();
        this.setActive(this.activeIndex + 1 >= options.length ? 0 : this.activeIndex + 1);
        break;
      }
      case "ArrowUp": {
        if (options.length === 0 || this.listbox.hidden) return;
        event.preventDefault();
        this.setActive(this.activeIndex <= 0 ? options.length - 1 : this.activeIndex - 1);
        break;
      }
      case "Enter": {
        // Sin sugerencia activa: envío normal del form a la página de resultados.
        if (this.listbox.hidden || this.activeIndex < 0) return;
        const link = options[this.activeIndex]?.querySelector("a");
        if (!link) return;
        event.preventDefault();
        this.trackSelection(link);
        window.location.assign(link.href);
        break;
      }
      case "Escape": {
        // Primer Escape: cierra la lista. El segundo lo recibe header.js y
        // cierra el buscador.
        if (this.listbox.hidden) return;
        event.preventDefault();
        event.stopPropagation();
        this.close();
        break;
      }
      default:
    }
  }

  setActive(index) {
    const options = this.options;
    this.activeIndex = index;
    options.forEach((option, optionIndex) => {
      option.setAttribute("aria-selected", String(optionIndex === index));
    });
    const active = options[index];
    if (active) {
      this.input.setAttribute("aria-activedescendant", active.id);
      active.scrollIntoView({ block: "nearest" });
    } else {
      this.input.removeAttribute("aria-activedescendant");
    }
  }

  trackSelection(link) {
    emit("search:suggestion-selected", {
      query: this.query,
      url: link.href,
      position: Number(link.dataset.position),
    });
  }

  announce(message) {
    if (!this.status || !message) return;
    // Un solo anuncio por respuesta (no por tecla).
    window.clearTimeout(this.announceTimer);
    // 03E (A11Y-15): vaciar primero para que un texto igual se re-anuncie.
    this.status.textContent = "";
    this.announceTimer = window.setTimeout(() => {
      this.status.textContent = message;
    }, 100);
  }
}

window.Radaelli.defineElement("predictive-search", PredictiveSearch);

/* ============================================================
   HOOKS NEUTROS DE ANALYTICS
   ============================================================ */
document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches("form[role='search']")) return;
  emit("search:submitted", {
    query: form.querySelector("input[name='q']")?.value.trim() ?? "",
    source: form.dataset.searchSource ?? "unknown",
  });
});

// Página de resultados: término + cantidad, como SearchAnalytics real.
function emitPageResults() {
  const results = document.querySelector("[data-search-results]");
  if (!results) return;
  const query = results.dataset.terms ?? "";
  const resultCount = Number(results.dataset.count ?? 0);
  emit("search:results", { query, resultCount });
  if (resultCount === 0) emit("search:no-results", { query, source: "page" });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", emitPageResults, { once: true });
} else {
  emitPageResults();
}
