/**
 * Carrito (Fase 02I): cart drawer + página de carrito + contador del
 * header. Vanilla JS, sin dependencias. Ver theme/cart-report.md.
 *
 * Estrategia: Shopify Ajax Cart API + Section Rendering API. Cada cambio
 * (/cart/add.js, /cart/change.js) pide en la MISMA request el HTML ya
 * renderizado de las secciones de carrito visibles (drawer o página), y
 * este archivo solo reemplaza [data-cart-body]. Resultado: un único markup
 * (Liquid), precios y descuentos formateados por Shopify (cero cálculos de
 * dinero en JS), 1 request por acción.
 *
 * Consistencia: la respuesta de Shopify es la fuente de verdad. Las
 * mutaciones se ejecutan en una cola (nunca dos requests de carrito a la
 * vez, así una respuesta vieja no pisa una nueva); una línea con request
 * pendiente ignora nuevos clics; si algo falla, la línea vuelve a la última
 * cantidad confirmada y se muestra el error. Timeout de 15 s con
 * AbortController para que una request colgada no bloquee la cola.
 *
 * Eventos (en document, sin IDs de GA/Meta):
 *   cart:updated           { itemCount, source, cart }  -> sincroniza [data-cart-count]
 *   cart:opened            { source: "trigger" | "add" }
 *   cart:item-added        { variantId, quantity, item }
 *   cart:quantity-changed  { key, variantId, previousQuantity, quantity }
 *   cart:item-removed      { key, variantId, previousQuantity }
 *   cart:begin-checkout    { itemCount }
 *   cart:error             { source, message }
 */

const REQUEST_TIMEOUT_MS = 15000;
const CLOSE_DURATION_MS = 200; // EXACT: leave duration-200 del drawer real
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function readConfig() {
  try {
    return JSON.parse(document.getElementById("cart-config")?.textContent ?? "{}");
  } catch {
    return {};
  }
}

// | t de Shopify devuelve texto HTML-escapado ("couldn&#39;t") y dentro de
// <script type="application/json"> el navegador no lo decodifica. Los textos
// se muestran con textContent, así que se decodifican una vez acá (03B, /en).
function decodeEntities(value) {
  if (typeof value !== "string" || !value.includes("&")) return value;
  return new DOMParser().parseFromString(value, "text/html").documentElement.textContent;
}

const config = readConfig();
const routes = { cart: "/cart", add: "/cart/add", change: "/cart/change", ...config.routes };
const strings = Object.fromEntries(Object.entries(config.strings ?? {}).map(([key, value]) => [key, decodeEntities(value)]));

class CartError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "CartError";
    this.status = status;
  }
}

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

function isVisible(element) {
  if (!element?.isConnected) return false;
  return typeof element.checkVisibility === "function"
    ? element.checkVisibility()
    : element.offsetParent !== null;
}

/* ============================================================
   CAPA DE DATOS -- cola serial + requests a Shopify
   ============================================================ */

/** Secciones de carrito montadas (drawer y/o página). */
const views = new Set();
let queue = Promise.resolve();

function enqueue(job) {
  const run = queue.then(job);
  queue = run.catch(() => {});
  return run;
}

async function requestJSON(url, options, fallbackMessage) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { Accept: "application/json", ...options?.headers },
    });
  } catch {
    throw new CartError(strings.errorNetwork);
  } finally {
    window.clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // Shopify responde 422 con { description } para stock/cantidad (texto
  // pensado para la clienta, en el idioma de la tienda); cualquier otro
  // error usa nuestro mensaje, nunca un texto técnico.
  const description =
    typeof data?.description === "string"
      ? data.description
      : typeof data?.errors === "string"
        ? data.errors
        : null;
  if (!response.ok) {
    throw new CartError(response.status === 422 && description ? description : fallbackMessage, response.status);
  }
  if (data?.errors) throw new CartError(description ?? fallbackMessage, response.status);
  if (data === null) throw new CartError(fallbackMessage, response.status);
  return data;
}

function sectionIds() {
  return [...views].map((view) => view.sectionId).filter(Boolean);
}

/**
 * Aplica el HTML de secciones devuelto por Shopify a cada vista y avisa al
 * resto del theme (header) con cart:updated.
 */
function applySections(sections, cart, source) {
  let itemCount = typeof cart?.item_count === "number" ? cart.item_count : null;
  let missing = false;

  views.forEach((view) => {
    const html = sections?.[view.sectionId];
    if (typeof html !== "string") {
      missing = true;
      return;
    }
    const count = view.renderSection(html, { announce: source !== "refresh" });
    if (itemCount === null && count !== null) itemCount = count;
  });

  if (itemCount !== null) emit("cart:updated", { itemCount, source, cart: cart ?? null });
  // Si Shopify no pudo renderizar alguna sección, se pide de nuevo por GET
  // (una sola vez: el refresh no reintenta).
  if (missing && source !== "refresh") Cart.refresh().catch(() => {});
}

const Cart = {
  /** Alta desde un <form> de producto (FormData: id, quantity, properties...). */
  add(formData) {
    return enqueue(async () => {
      formData.append("sections", sectionIds().join(","));
      formData.append("sections_url", window.location.pathname);
      const item = await requestJSON(
        `${routes.add}.js`,
        { method: "POST", body: formData, headers: { "X-Requested-With": "XMLHttpRequest" } },
        strings.errorAdd,
      );
      applySections(item.sections, null, "add");
      return item;
    });
  },

  /** Cantidad absoluta de una línea (0 = quitar), por key: estable aunque cambien los índices. */
  change(key, quantity) {
    return enqueue(async () => {
      const cart = await requestJSON(
        `${routes.change}.js`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: key,
            quantity,
            sections: sectionIds(),
            sections_url: window.location.pathname,
          }),
        },
        strings.errorGeneric,
      );
      applySections(cart.sections, cart, "change");
      return cart;
    });
  },

  /**
   * Re-sincroniza desde Shopify (volver con "atrás", otra pestaña). Con
   * vistas montadas pide sus secciones por GET; sin vistas, /cart.js solo
   * para el contador del header.
   */
  refresh() {
    return enqueue(async () => {
      const ids = sectionIds();
      if (ids.length === 0) {
        const cart = await requestJSON(`${routes.cart}.js`, {}, strings.errorGeneric);
        emit("cart:updated", { itemCount: cart.item_count, source: "refresh", cart });
        return cart;
      }
      const url = new URL(window.location.pathname, window.location.origin);
      url.searchParams.set("sections", ids.join(","));
      const sections = await requestJSON(url.toString(), {}, strings.errorGeneric);
      applySections(sections, null, "refresh");
      return sections;
    });
  },
};

window.Radaelli.cart = Cart;

/* ============================================================
   CONTADOR DEL HEADER -- un solo contrato: cart:updated
   ============================================================ */
document.addEventListener("cart:updated", (event) => {
  const count = event.detail?.itemCount;
  if (typeof count !== "number") return;
  document.querySelectorAll("[data-cart-count]").forEach((element) => {
    element.textContent = String(count);
  });
  document.querySelectorAll("[data-cart-count-bubble]").forEach((element) => {
    element.hidden = count === 0;
  });
});

// Volver con "atrás" (bfcache) puede mostrar un carrito viejo.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) Cart.refresh().catch(() => {});
});

/* ============================================================
   VISTA DE CARRITO -- base común de drawer y página:
   delegación de eventos (1 listener por tipo, no por línea)
   ============================================================ */
class CartView extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.sectionId = this.dataset.sectionId;
    this.live = this.querySelector("[data-cart-live]");
    views.add(this);

    this.addEventListener("click", (event) => this.handleClick(event));
    this.addEventListener("change", (event) => this.handleChange(event));
    this.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.addEventListener("submit", (event) => this.handleSubmit(event));
  }

  onDisconnect() {
    views.delete(this);
  }

  get body() {
    return this.querySelector("[data-cart-body]");
  }

  findLine(key) {
    return this.querySelector(`[data-cart-line][data-line-key="${CSS.escape(key)}"]`);
  }

  handleClick(event) {
    const step = event.target.closest("[data-cart-quantity-step]");
    const remove = event.target.closest("[data-cart-remove]");
    const line = (step ?? remove)?.closest("[data-cart-line]");
    if (!line) return;

    // La X es un link a item.url_to_remove (sirve sin JS); con JS, AJAX.
    event.preventDefault();
    if (line.getAttribute("aria-busy") === "true") return; // anti doble clic

    if (remove) {
      this.updateLine(line, 0);
      return;
    }
    const input = line.querySelector("[data-cart-quantity-input]");
    const stepSize = Number(input?.step) || 1;
    const next = Math.max(0, Number(line.dataset.quantity) + Number(step.dataset.cartQuantityStep) * stepSize);
    if (input) input.value = String(next); // se revierte si Shopify lo rechaza
    this.updateLine(line, next);
  }

  handleChange(event) {
    const input = event.target.closest("[data-cart-quantity-input]");
    const line = input?.closest("[data-cart-line]");
    if (!line || line.getAttribute("aria-busy") === "true") return;

    const next = Number.parseInt(input.value, 10);
    const committed = Number(line.dataset.quantity);
    if (!Number.isInteger(next) || next < 0) {
      input.value = String(committed);
      return;
    }
    if (next !== committed) this.updateLine(line, next);
  }

  handleKeydown(event) {
    // Enter en la cantidad confirma ese cambio (en la página, el Enter
    // nativo enviaría el form con el botón de checkout).
    if (event.key !== "Enter" || !event.target.matches("[data-cart-quantity-input]")) return;
    event.preventDefault();
    event.target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  handleSubmit(event) {
    if (event.submitter?.name !== "checkout") return;
    emit("cart:begin-checkout", { itemCount: Number(this.body?.dataset.cartItemCount ?? 0) });
  }

  async updateLine(line, quantity) {
    const key = line.dataset.lineKey;
    const variantId = Number(line.dataset.variantId);
    const previousQuantity = Number(line.dataset.quantity);

    this.clearLineError(line);
    this.setLineBusy(line, true);
    try {
      const cart = await Cart.change(key, quantity);
      const updated = cart.items.find((item) => item.key === key);
      const finalQuantity = updated ? updated.quantity : 0;

      if (finalQuantity === 0) {
        emit("cart:item-removed", { key, variantId, previousQuantity });
      } else if (finalQuantity !== previousQuantity) {
        emit("cart:quantity-changed", { key, variantId, previousQuantity, quantity: finalQuantity });
      }
      // Shopify deja menos de lo pedido cuando no hay stock suficiente.
      if (updated && finalQuantity < quantity) {
        this.showLineError(key, strings.quantityLimited?.replace("__COUNT__", String(finalQuantity)));
      }
      if (line.isConnected) this.setLineBusy(line, false);
    } catch (error) {
      // Rollback: la línea no se re-renderizó; vuelve a lo último confirmado.
      if (line.isConnected) {
        const input = line.querySelector("[data-cart-quantity-input]");
        if (input) input.value = String(previousQuantity);
        this.setLineBusy(line, false);
      }
      const message = error.message || strings.errorGeneric;
      this.showLineError(key, message);
      emit("cart:error", { source: "change", message });
    }
  }

  setLineBusy(line, busy) {
    if (busy) {
      line.setAttribute("aria-busy", "true");
    } else {
      line.removeAttribute("aria-busy");
    }
    line.querySelectorAll("[data-cart-quantity-step], [data-cart-remove]").forEach((control) => {
      if (busy) {
        control.setAttribute("aria-disabled", "true");
      } else {
        control.removeAttribute("aria-disabled");
      }
    });
    const input = line.querySelector("[data-cart-quantity-input]");
    if (input) input.readOnly = busy;
  }

  clearLineError(line) {
    const slot = line.querySelector("[data-cart-line-error]");
    if (!slot) return;
    slot.hidden = true;
    slot.textContent = "";
  }

  showLineError(key, message) {
    if (!message) return;
    const slot = this.findLine(key)?.querySelector("[data-cart-line-error]");
    if (slot) {
      slot.textContent = message;
      slot.hidden = false;
    }
    this.announce(message);
  }

  announce(message) {
    if (!this.live || !message) return;
    window.clearTimeout(this.announceTimer);
    this.live.textContent = "";
    // Vaciar y volver a escribir: los lectores anuncian aunque el texto se repita.
    this.announceTimer = window.setTimeout(() => {
      this.live.textContent = message;
    }, 50);
  }

  /**
   * Reemplaza el contenido por el HTML nuevo de la sección, conservando el
   * foco (mismo control de la misma línea) y anunciando el subtotal.
   * Devuelve la cantidad de productos del carrito renderizado.
   */
  renderSection(html, { announce = true } = {}) {
    const nextBody = new DOMParser().parseFromString(html, "text/html").querySelector("[data-cart-body]");
    const body = this.body;
    if (!nextBody || !body) return null;
    // DOMParser parsea sin scripting: el contenido de <noscript> ("Actualizar
    // carrito") llegaría como botón real y sería el submit por defecto del form.
    nextBody.querySelectorAll("noscript").forEach((element) => element.remove());

    const active = document.activeElement;
    const hadFocus = body.contains(active);
    const focusId = hadFocus ? active.closest("[data-focus-id]")?.dataset.focusId : null;

    body.replaceChildren(...nextBody.childNodes);
    body.dataset.cartItemCount = nextBody.dataset.cartItemCount ?? "0";
    this.stale = false;

    if (hadFocus) {
      const target = focusId ? body.querySelector(`[data-focus-id="${CSS.escape(focusId)}"]`) : null;
      (target ?? this.querySelector("[data-cart-focus-fallback]"))?.focus();
    }

    if (announce) {
      const subtotal = body.querySelector("[data-cart-subtotal]")?.textContent.trim();
      this.announce(subtotal ? strings.updated?.replace("__SUBTOTAL__", subtotal) : strings.empty);
    }

    const count = Number.parseInt(body.dataset.cartItemCount, 10);
    return Number.isNaN(count) ? null : count;
  }
}

/** Página de carrito (sections/main-cart.liquid). */
class CartItems extends CartView {}

window.Radaelli.defineElement("cart-items", CartItems);

/* ============================================================
   CART DRAWER -- <dialog> nativo + animación CSS
   ============================================================ */
class CartDrawer extends CartView {
  onConnect() {
    super.onConnect();
    this.dialog = this.querySelector("dialog");
    if (!this.dialog || typeof this.dialog.showModal !== "function") return;

    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog || event.target.closest("[data-cart-drawer-close]")) this.close();
    });
    // Escape: se anima el cierre en vez del corte instantáneo nativo.
    this.dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      this.close();
    });
    this.dialog.addEventListener("close", () => this.onClosed());

    this.onTriggerClick = (event) => this.handleTriggerClick(event);
    this.onProductAdd = (event) => this.handleProductAdd(event);
    this.onVisibilityChange = () => {
      // Otra pestaña pudo cambiar el carrito: se re-sincroniza al abrir.
      if (document.visibilityState === "hidden") this.stale = true;
    };
    document.addEventListener("click", this.onTriggerClick);
    document.addEventListener("product:add-to-cart", this.onProductAdd);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.setTriggers(true);
  }

  onDisconnect() {
    super.onDisconnect();
    document.removeEventListener("click", this.onTriggerClick);
    document.removeEventListener("product:add-to-cart", this.onProductAdd);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.setTriggers(false);
  }

  /** El link del header pasa a abrir el drawer: se agrega la semántica de popup. */
  setTriggers(enabled) {
    document.querySelectorAll("[data-cart-drawer-trigger]").forEach((trigger) => {
      if (enabled) {
        trigger.setAttribute("aria-haspopup", "dialog");
        trigger.setAttribute("aria-controls", this.dialog.id);
        trigger.setAttribute("aria-expanded", String(this.dialog.open));
      } else {
        trigger.removeAttribute("aria-haspopup");
        trigger.removeAttribute("aria-controls");
        trigger.removeAttribute("aria-expanded");
      }
    });
  }

  handleTriggerClick(event) {
    const trigger = event.target.closest("[data-cart-drawer-trigger]");
    if (!trigger || event.defaultPrevented) return;
    // Ctrl/Cmd/Shift/clic del medio: el navegador abre /cart como link normal.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();

    // EXACT del real: el botón de carrito del menú mobile cierra el menú y abre el carrito.
    const menu = trigger.closest("mobile-menu-drawer");
    if (menu && typeof menu.close === "function") menu.close();
    this.open({ opener: trigger, source: "trigger" });
  }

  handleProductAdd(event) {
    const form = event.detail?.form;
    // Contrato de 02H: sin respondWith no se intercepta y sigue el envío nativo.
    if (!form || typeof event.detail.respondWith !== "function") return;
    event.preventDefault();

    const active = document.activeElement;
    const opener = active && active !== document.body ? active : form.querySelector("[type='submit']");
    const formData = new FormData(form);
    const quantity = Number(formData.get("quantity") ?? 1);

    const pending = Cart.add(formData).then(
      (item) => {
        emit("cart:item-added", { variantId: item.variant_id, quantity, item });
        this.open({ opener, source: "add" });
        return item;
      },
      (error) => {
        emit("cart:error", { source: "add", message: error.message });
        throw error;
      },
    );
    event.detail.respondWith(pending);
  }

  open({ opener = null, source = "trigger" } = {}) {
    if (this.closing) {
      // Se pidió abrir durante la animación de cierre: se cancela el cierre.
      window.clearTimeout(this.closeTimer);
      this.closing = false;
      this.dialog.setAttribute("data-open", "");
      return;
    }
    if (this.dialog.open) return;
    this.opener = opener;
    this.isOpen = true;
    if (this.stale) Cart.refresh().catch(() => {});

    this.dialog.showModal();
    // Un frame después, para que la transición de entrada sí se anime.
    requestAnimationFrame(() => this.dialog.setAttribute("data-open", ""));
    this.setExpanded(true);
    emit("cart:opened", { source });
  }

  close() {
    if (!this.dialog.open || this.closing) return;
    this.dialog.removeAttribute("data-open");
    if (reducedMotion.matches) {
      this.finishClose();
      return;
    }
    this.closing = true;
    this.closeTimer = window.setTimeout(() => this.finishClose(), CLOSE_DURATION_MS);
  }

  // La limpieza corre acá mismo: el evento "close" del <dialog> es asíncrono
  // (y Chrome lo demora con la pestaña oculta), así que no se depende de él.
  finishClose() {
    if (this.dialog.open) this.dialog.close();
    this.onClosed();
  }

  /** Idempotente: corre por finishClose() o por un cierre nativo del navegador. */
  onClosed() {
    if (!this.isOpen) return;
    this.isOpen = false;
    window.clearTimeout(this.closeTimer);
    this.closing = false;
    this.dialog.removeAttribute("data-open");
    this.setExpanded(false);
    // Foco de vuelta a quien abrió; si ya no se ve (menú mobile cerrado),
    // al ícono del header.
    const fallback = document.querySelector(".site-header [data-cart-drawer-trigger]");
    [this.opener, fallback].find(isVisible)?.focus();
    this.opener = null;
  }

  setExpanded(expanded) {
    document.querySelectorAll("[data-cart-drawer-trigger]").forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(expanded));
    });
  }
}

window.Radaelli.defineElement("cart-drawer", CartDrawer);
