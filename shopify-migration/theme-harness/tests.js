// Regresión global 02M sobre el HTML que produce el Liquid REAL del theme.
// Páginas en iframes del mismo origen. Clicks/teclas = eventos sintéticos.
const results = [];
window.__results = results;
window.__done = false;

const WIDTHS = [320, 375, 390, 430, 640, 768, 1024, 1280, 1440];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeout = 4000, step = 40) {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* reintenta */
    }
    await sleep(step);
  }
  return null;
}
function assert(c, m) {
  if (!c) throw new Error(m);
}
// 03E: los nodos DOM se comparan por IDENTIDAD. Antes JSON.stringify(nodo)
// daba "{}" para cualquier elemento, y eq(activeElement, botón) pasaba
// siempre (lo destapó el mutante 39).
const isNode = (x) => !!x && typeof x === "object" && typeof x.nodeType === "number";
const describeNode = (x) => (isNode(x) ? `<${x.nodeName.toLowerCase()}${x.id ? "#" + x.id : ""}${x.className && typeof x.className === "string" ? "." + x.className.trim().split(/\s+/).join(".") : ""}>` : JSON.stringify(x));
function eq(a, b, m) {
  if (isNode(a) || isNode(b)) {
    if (a !== b) throw new Error(`${m}: esperado ${describeNode(b)}, obtenido ${describeNode(a)}`);
    return;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)}`);
}
function clearFrames() {
  document.querySelectorAll("#frames iframe").forEach((f) => f.remove());
}
async function reset(cart = 2) {
  clearFrames();
  localStorage.clear();
  await fetch(`/__rc/reset?cart=${cart}`);
}
async function load(path, { width = 1280, height = 800, keep = false } = {}) {
  if (!keep) clearFrames();
  const frame = document.createElement("iframe");
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  document.getElementById("frames").append(frame);
  const url = path + (path.includes("?") ? "&" : "?") + "h=1";
  await new Promise((resolve) => {
    frame.onload = resolve;
    frame.src = url;
  });
  const win = frame.contentWindow;
  if (!path.includes("nojs=1")) await waitFor(() => win.Radaelli && win.customElements.get("cart-drawer") !== undefined, 5000);
  await sleep(120);
  return win;
}
const $ = (win, sel) => win.document.querySelector(sel);
const $$ = (win, sel) => [...win.document.querySelectorAll(sel)];
const visible = (el) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const cs = el.ownerDocument.defaultView.getComputedStyle(el);
  return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
};
const overflow = (win) => win.document.documentElement.scrollWidth - win.document.documentElement.clientWidth;
const key = (win, k, target) => (target ?? win.document.activeElement ?? win.document.body).dispatchEvent(new win.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const rootOverflow = (win) => win.getComputedStyle(win.document.documentElement).overflow + "/" + win.getComputedStyle(win.document.body).overflow;
const errs = (win) => (win.__errors ?? []).filter(Boolean);

function render() {
  document.getElementById("out").innerHTML = results
    .map((r, i) => `<tr><td>${i + 1}</td><td>${r.area}</td><td>${r.name}</td><td class="${r.pass ? "pass" : "fail"}">${r.pass ? "PASS" : "FAIL"}</td><td>${String(r.detail).replace(/</g, "&lt;")}</td></tr>`)
    .join("");
  document.getElementById("summary").textContent = `${results.filter((r) => r.pass).length}/${results.length} PASS${window.__done ? " (fin)" : "…"}`;
}
async function test(area, name, fn) {
  try {
    const d = await fn();
    results.push({ area, name, pass: true, detail: d ?? "" });
  } catch (e) {
    results.push({ area, name, pass: false, detail: String(e?.message ?? e) });
  }
  render();
}

await fetch("/__rc/reset?all=1");

/* ============ Responsive: 6 páginas × 9 anchos ============ */
const PAGES = ["/?configured=1", "/collections/oasis-natural", "/products/bikini-oasis-natural-arena", "/cart", "/search?q=bikini", "/pages/favoritos"];
for (const page of PAGES) {
  await test("Responsive", `${page} en 9 anchos: sin overflow, sin errores JS/recursos`, async () => {
    await reset();
    const bad = [];
    for (const w of WIDTHS) {
      const win = await load(page, { width: w, height: 700 });
      const o = overflow(win);
      if (o > 0) bad.push(`${w}px overflow ${o}`);
      if (errs(win).length) bad.push(`${w}px ${errs(win).join(" | ")}`);
    }
    assert(bad.length === 0, bad.join("; "));
    return WIDTHS.join("/");
  });
}

/* ============ A. Header ============ */
await test("A Header", "desktop: 4 links, dropdown con aria-expanded, acciones sin solaparse, sticky", async () => {
  await reset();
  const win = await load("/", { width: 1280 });
  const links = $$(win, ".site-header__nav-list > li > a, .site-header__nav-list > li > button, .site-header__nav-list > li > [data-dropdown-trigger]").filter(visible);
  assert(links.length >= 4, `links visibles ${links.length}`);
  const trigger = $(win, "[data-dropdown-trigger]");
  trigger.click();
  await sleep(80);
  eq(trigger.getAttribute("aria-expanded"), "true", "dropdown abierto");
  assert(visible($(win, "[data-dropdown-menu]")), "menú visible");
  key(win, "Escape", trigger);
  await sleep(80);
  eq(trigger.getAttribute("aria-expanded"), "false", "Escape cierra");
  const actions = [".site-header__search-trigger", ".site-header__wishlist", ".site-header__account", ".site-header__cart"].map((s) => $(win, s)).filter(visible);
  eq(actions.length, 4, "4 acciones visibles (buscar, favoritos, cuenta, carrito)");
  const rects = actions.map((a) => a.getBoundingClientRect());
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) assert(rects[i].right <= rects[j].left + 0.5 || rects[j].right <= rects[i].left + 0.5, `acciones ${i} y ${j} se solapan`);
  const header = $(win, ".site-header");
  const pos = win.getComputedStyle(header).position;
  assert(pos === "sticky" || pos === "fixed", `header position ${pos}`);
  return `position ${pos}`;
});

await test("A Header", "mobile: menú abre/cierra con Escape, foco vuelve, submenú, sin scroll lock residual", async () => {
  await reset();
  const win = await load("/", { width: 375 });
  const before = rootOverflow(win);
  const trigger = $(win, "[data-mobile-menu-trigger]");
  trigger.focus();
  trigger.click();
  await sleep(120);
  eq(trigger.getAttribute("aria-expanded"), "true", "abierto");
  assert(!$(win, "mobile-menu-drawer").hidden, "drawer visible");
  const sub = $(win, "[data-mobile-submenu-trigger]");
  if (sub) {
    sub.click();
    await sleep(80);
    const back = $$(win, "[data-mobile-submenu-back]").find(visible);
    assert(back, "submenú abierto (botón volver visible)");
    back.click();
    await sleep(80);
  }
  key(win, "Escape");
  await sleep(350);
  eq(trigger.getAttribute("aria-expanded"), "false", "Escape cierra");
  eq(win.document.activeElement, trigger, "foco vuelve al botón");
  eq(rootOverflow(win), before, "scroll lock limpio");
  assert(!win.document.body.classList.contains("has-mobile-menu-open"), "clase de bloqueo removida");
});

/* ============ B. Footer ============ */
await test("B Footer", "menú desde linklist, newsletter nativo con label, redes/contacto", async () => {
  const win = await load("/", { width: 1280 });
  const footer = $(win, "footer, .site-footer");
  assert(footer, "footer");
  const menuLinks = $$(win, ".site-footer a").map((a) => a.getAttribute("href"));
  // 03C: el bloque "Comprar" usa el menú "comprar" (4 colecciones) y las redes reales del sitio.
  for (const h of ["/collections/oasis-natural", "/collections/aurora-viva", "/collections/espuma-de-ola", "/collections/salidas-de-bano"]) assert(menuLinks.includes(h), `falta ${h} en ${menuLinks.slice(0, 8)}`);
  assert(menuLinks.some((h) => /instagram\.com\/Radaelli_swimwear/.test(h)) && menuLinks.some((h) => /wa\.me\//.test(h)), `redes: ${menuLinks.filter((h) => /^https?:/.test(h))}`);
  const form = footer.querySelector('form[action^="/contact"]');
  if (form) {
    const input = form.querySelector('input[type="email"]');
    assert(input && input.required, "email requerido");
    const labelled = input.labels?.length || input.getAttribute("aria-label");
    assert(labelled, "email con label");
  }
  return form ? "con newsletter" : "sin bloque newsletter (config por defecto)";
});

/* ============ C. Home ============ */
await test("C Home", "sin configurar (primer upload): renderiza sin errores y sin secciones rotas", async () => {
  await reset();
  const win = await load("/", { width: 1280 });
  eq(errs(win), [], "errores");
  assert($(win, "#MainContent"), "main");
  const hero = $$(win, "[id^='shopify-section-template--index__hero']");
  eq(hero.length, 1, "hero presente");
  const diag = await (await fetch("/__rc/diag")).json();
  eq(diag.renderErrors, [], "errores de render Liquid");
});

await test("C Home", "configurada: 3 categorías (1 'próximamente' como botón), productos, carrusel con flechas", async () => {
  const win = await load("/?configured=1", { width: 1280 });
  const cards = $$(win, ".section-categories__card");
  eq(cards.length, 3, "tarjetas de categoría");
  eq(cards.map((c) => c.tagName), ["A", "A", "BUTTON"], "link/link/botón");
  assert($$(win, ".product-card").length >= 3, "tarjetas de producto");
  eq(errs(win), [], "errores");
});

await test("C Home", "03D: 'Productos destacados' dibuja la colección 'destacados' del index.json real", async () => {
  const win = await load("/", { width: 1280 });
  const sec = $(win, "[id*='__featured-products']");
  assert(sec, "sección featured-products presente");
  const handles = [...new Set($$(win, "[id*='__featured-products'] .product-card a[href*='/products/']").map((a) => a.getAttribute("href").split("?")[0].split("/products/")[1]))];
  eq(handles.sort(), ["bikini-oasis-natural-oliva", "enterizo-aurora-viva-negro"], "productos de destacados");
  eq(errs(win), [], "errores");
});

/* ============ D. Product Card ============ */
await test("D Product Card", "corazones visibles tras JS, badge agotado, link a la ficha", async () => {
  const win = await load("/collections/aurora-viva", { width: 1280 });
  const hearts = $$(win, ".product-card [data-wishlist-trigger]");
  assert(hearts.length >= 2 && hearts.every((h) => !h.hidden), "corazones visibles");
  const soldOut = $$(win, ".product-card").find((c) => c.textContent.includes("Coral"));
  assert(soldOut?.querySelector(".product-card__badge--sold-out"), "badge agotado en Coral");
  const link = $(win, ".product-card a[href*='/products/']");
  assert(link, "link a ficha");
});

/* ============ E. Collection ============ */
await test("E Collection", "selector de columnas, filtros (desktop), drawer de filtros mobile abre/cierra y devuelve foco", async () => {
  let win = await load("/collections/oasis-natural", { width: 1280 });
  const views = $$(win, "[data-view-button]").filter(visible);
  if (views.length > 1) {
    views[views.length - 1].click();
    await sleep(80);
    eq(views[views.length - 1].getAttribute("aria-pressed"), "true", "vista elegida");
  }
  assert($$(win, "a[href*='filter.v.option.talla']").length >= 4, "filtros de talla (links url_to_add)");
  win = await load("/collections/oasis-natural", { width: 375 });
  const trig = $$(win, "[data-filter-drawer-trigger]").find(visible);
  assert(trig, "botón filtros mobile");
  trig.focus();
  trig.click();
  await sleep(150);
  const panel = $(win, ".filter-drawer__panel");
  assert(visible(panel), "panel abierto");
  key(win, "Escape");
  await sleep(350);
  assert(!visible(panel), "Escape cierra");
  eq(win.document.activeElement, trig, "foco vuelve");
  eq(errs(win), [], "errores");
  return `${views.length} vistas`;
});

/* ============ F. Product Page ============ */
await test("F Product", "variante: talla S => id 1012; L agotada marcada; add to cart abre drawer y suma 1 (1 solo cart:updated)", async () => {
  await reset(2);
  const win = await load("/products/bikini-oasis-natural-arena", { width: 1280 });
  const events = [];
  win.document.addEventListener("cart:updated", (e) => events.push(e.detail.itemCount));
  const s = $$(win, "[data-option-input]").find((i) => i.value === "S");
  s.click();
  await sleep(80);
  const idInput = $(win, "[data-variant-id-input]");
  eq([idInput.value, idInput.disabled], ["1012", false], "id de variante");
  const l = $$(win, "[data-option-input]").find((i) => i.value === "L");
  assert(l.closest(".variant-pill")?.classList.contains("is-unavailable") || l.disabled, "L agotada marcada");
  const countBefore = Number($(win, "[data-cart-count]")?.textContent || 0);
  $(win, "[data-add-to-cart]").click();
  assert(await waitFor(() => $(win, "#CartDrawer")?.open, 4000), "drawer abierto");
  await sleep(150);
  eq(events.length, 1, "un solo cart:updated");
  eq(events[0], countBefore + 1, "contador +1");
  $$(win, "[data-cart-drawer-close]").find(visible)?.click();
  await sleep(400);
  assert(!$(win, "#CartDrawer").open, "drawer cerrado");
  eq(rootOverflow(win).split("/")[0] !== "hidden", true, "sin scroll lock residual");
  eq(errs(win), [], "errores");
  return `contador ${countBefore}→${events[0]}`;
});

await test("F Product", "variante agotada: agregar => error visible, sin abrir drawer", async () => {
  await reset(0);
  const win = await load("/products/enterizo-aurora-viva-coral", { width: 1280 });
  const btn = $(win, "[data-add-to-cart]");
  assert(btn.disabled || btn.getAttribute("aria-disabled") === "true", "botón deshabilitado para producto agotado");
  eq(errs(win), [], "errores");
});

await test("F Product", "galería: siguiente cambia el contador; lightbox abre (dialog) y Escape devuelve el foco", async () => {
  const win = await load("/products/bikini-oasis-natural-arena", { width: 1280 });
  const counter = $(win, "[data-gallery-counter]");
  const before = counter?.textContent;
  $$(win, "[data-gallery-next]").find(visible)?.click();
  assert(await waitFor(() => counter.textContent !== before, 2500), "siguiente cambia la imagen");
  const opener = $$(win, "[data-gallery-open]").find(visible);
  assert(opener, "botón abrir lightbox");
  opener.focus();
  opener.click();
  const dialog = $(win, "[data-lightbox-dialog]");
  assert(await waitFor(() => dialog.open, 2000), "lightbox abierto");
  eq(win.getComputedStyle(win.document.documentElement).overflow, "hidden", "scroll lock activo");
  dialog.dispatchEvent(new win.Event("cancel", { cancelable: true }));
  dialog.close();
  await sleep(400);
  assert(!dialog.open, "cerrado");
  assert(win.getComputedStyle(win.document.documentElement).overflow !== "hidden", "scroll lock liberado");
  eq(errs(win), [], "errores");
  return `contador ${before} → ${counter?.textContent}`;
});

/* ============ G. Cart drawer ============ */
await test("G Cart drawer", "abre desde el header, +1, quitar línea, cierra y libera scroll", async () => {
  await reset(2);
  const win = await load("/", { width: 1280 });
  const trig = $(win, "[data-cart-drawer-trigger]");
  trig.focus();
  trig.click();
  const dialog = $(win, "#CartDrawer");
  assert(await waitFor(() => dialog.open, 2000), "abierto");
  const firstLine = () => $(win, "#CartDrawer [data-cart-line]");
  const qty = () => Number(firstLine().querySelector("[data-cart-quantity-input]").value);
  const q0 = qty();
  firstLine().querySelector("[data-cart-quantity-step][data-quantity='plus'], [data-cart-quantity-step]:last-of-type").click();
  assert(await waitFor(() => qty() === q0 + 1, 3000), `cantidad ${q0}→${qty()}`);
  // Espera a que Shopify (mock) confirme y la sección se vuelva a pintar antes de la siguiente acción.
  assert(await waitFor(async () => (await (await fetch("/cart.js")).json()).items[0].quantity === q0 + 1, 3000), "servidor confirmó +1");
  await sleep(400);
  const lines0 = $$(win, "#CartDrawer [data-cart-line]").length;
  firstLine().querySelector("[data-cart-remove]").click();
  assert(await waitFor(() => $$(win, "#CartDrawer [data-cart-line]").length === lines0 - 1, 3000), "línea quitada");
  key(win, "Escape", dialog);
  dialog.close();
  await sleep(400);
  assert(!dialog.open, "cerrado");
  assert(win.getComputedStyle(win.document.documentElement).overflow !== "hidden", "scroll libre");
  eq(errs(win), [], "errores");
  return `qty ${q0}→${q0 + 1}, líneas ${lines0}→${lines0 - 1}`;
});

/* ============ H. Cart page ============ */
await test("H Cart page", "cambiar cantidad actualiza subtotal; vaciar muestra estado vacío", async () => {
  await reset(1);
  const win = await load("/cart", { width: 1280 });
  const sub0 = $(win, "[data-cart-subtotal]")?.textContent.trim();
  $(win, "[data-cart-line] [data-cart-quantity-step]:last-of-type").click();
  assert(await waitFor(() => $(win, "[data-cart-subtotal]")?.textContent.trim() !== sub0, 3000), "subtotal cambió");
  $(win, "[data-cart-line] [data-cart-remove]").click();
  assert(await waitFor(() => $$(win, "[data-cart-line]").length === 0, 3000), "sin líneas");
  assert(/vac/i.test($(win, "#MainContent").textContent), "texto de carrito vacío");
  eq(errs(win), [], "errores");
  return `subtotal ${sub0} → cambió → vacío`;
});

/* ============ I. Search page ============ */
await test("I Search", "q=bikini => 3 resultados; sin q => formulario sin resultados", async () => {
  let win = await load("/search?q=bikini", { width: 1280 });
  eq($$(win, "#MainContent .product-card").length, 3, "resultados");
  win = await load("/search", { width: 1280 });
  assert($(win, "#MainContent form[action='/search'] input[name='q']"), "formulario");
  eq($$(win, "#MainContent .product-card").length, 0, "sin resultados");
});

/* ============ J. Predictive search ============ */
await test("J Predictive", "abrir buscador, escribir 'bik' => sugerencias; Escape cierra", async () => {
  const win = await load("/", { width: 1280 });
  const trig = $(win, "[data-search-trigger]");
  trig.click();
  await sleep(250);
  const input = $(win, "#HeaderSearchInput");
  assert(visible(input), "input visible");
  input.focus();
  input.value = "bik";
  input.dispatchEvent(new win.Event("input", { bubbles: true }));
  const list = $(win, "#PredictiveSearchResults");
  assert(await waitFor(() => !list.hidden && list.querySelectorAll("a[href*='/products/']").length >= 3, 3000), "sugerencias");
  eq(input.getAttribute("aria-expanded"), "true", "combobox expandido");
  key(win, "Escape", input);
  await sleep(200);
  assert(list.hidden || input.getAttribute("aria-expanded") === "false", "Escape cierra sugerencias");
  eq(errs(win), [], "errores");
  return `${list.querySelectorAll("a[href*='/products/']").length} sugerencias`;
});

/* ============ K. Wishlist invitada ============ */
await test("K Wishlist", "corazón en colección => header 1; página de favoritos renderiza con wishlist-item.liquid real; quitar", async () => {
  await reset();
  let win = await load("/collections/oasis-natural", { width: 1280 });
  const heart = $(win, "[data-wishlist-trigger][data-product-id='101']");
  heart.click();
  eq(heart.getAttribute("aria-pressed"), "true", "guardado");
  const badge = $(win, ".site-header__badge[data-wishlist-count]");
  eq([badge.hidden, badge.textContent], [false, "1"], "badge");
  win = await load("/pages/favoritos", { width: 1280 });
  assert(await waitFor(() => $$(win, "[data-wishlist-list] [data-wishlist-item]").length === 1, 3000), "1 fila");
  const row = $(win, "[data-wishlist-list] [data-wishlist-item]");
  assert(row.textContent.includes("Bikini Oasis Natural Arena") && row.textContent.includes("$159.900"), "fila con datos reales");
  row.querySelector("[data-wishlist-remove]").click();
  await sleep(100);
  assert(!$(win, "[data-wishlist-empty]").hidden, "estado vacío");
  eq(errs(win), [], "errores");
});

/* ============ L. Wishlist cuenta inerte ============ */
await test("L Wishlist cuenta", "con sesión + setting ON pero sin app: modo invitada, 0 requests a /apps; signedOut sin errores", async () => {
  await reset();
  let win = await load("/?customer=1&sync=1", { width: 1280 });
  eq(win.Radaelli.wishlist.mode(), "guest", "modo");
  assert($(win, "#wishlist-account-state"), "bootstrap presente");
  eq(errs(win), [], "errores");
  win = await load("/?sync=1", { width: 1280 });
  eq(errs(win), [], "errores con signedOut");
  const diag = await (await fetch("/__rc/diag")).json();
  eq(diag.requests.filter((r) => r.includes("/apps")), [], "requests a /apps");
});

/* ============ M. Cuenta ============ */
await test("M Cuenta", "1280: <shopify-account> ≥44px; 375: oculto + 'Mi cuenta' en menú; accounts=0 => link; con sesión sin slot", async () => {
  let win = await load("/", { width: 1280 });
  const acc = $(win, ".site-header__account");
  const r = acc.getBoundingClientRect();
  assert(visible(acc) && r.width >= 44 && r.height >= 44, `cuenta ${r.width}x${r.height}`);
  win = await load("/", { width: 375 });
  assert(!visible($(win, ".site-header__account")), "oculto en mobile");
  assert($$(win, "mobile-menu-drawer a[href='/account']").length === 1, "Mi cuenta en menú mobile");
  win = await load("/?accounts=0", { width: 1280 });
  assert(visible($(win, "a.site-header__account-link[href='/account']")), "fallback link");
  win = await load("/?customer=1", { width: 1280 });
  eq($(win, ".site-header__account").children.length, 0, "avatar lo dibuja Shopify");
});

/* ============ No-JS ============ */
await test("No-JS", "header/búsqueda/ficha/carrito/favoritos/cuenta degradan correctamente", async () => {
  const notes = [];
  let win = await load("/?nojs=1", { width: 1280 });
  assert($$(win, ".site-header__nav a[href^='/collections/']").filter(visible).length >= 3, "nav desktop con links");
  assert($(win, ".site-header__search-trigger[href='/search']"), "buscar = link a /search");
  assert(!visible($(win, ".site-header__noscript-nav")), "nav noscript oculta en desktop");
  assert(visible($(win, "a.site-header__account-link[href='/account']")), "cuenta = link (noscript)");
  assert($(win, "a[href='/cart'].site-header__cart, .site-header__cart[href='/cart']"), "carrito = link a /cart");
  win = await load("/?nojs=1", { width: 375 });
  const mobileNav = $$(win, "a[href^='/collections/']").filter(visible).length;
  assert(mobileNav >= 4, `mobile sin JS: ${mobileNav} links de colección visibles`);
  notes.push(`mobile sin JS: ${mobileNav} links (noscript)`);
  win = await load("/products/bikini-oasis-natural-arena?nojs=1", { width: 1280 });
  const select = $(win, "select[name='id']");
  assert(select && visible(select), "select de variantes sin JS");
  assert($(win, "form[action='/cart/add'] button[type='submit']"), "submit nativo");
  win = await load("/cart?nojs=1", { width: 1280 });
  const cartForm = $(win, "form[action='/cart']");
  assert(cartForm, "form de carrito");
  const updates = $$(win, "input[name^='updates']").length;
  const checkout = $(win, "[name='checkout']");
  assert(checkout, "botón checkout");
  notes.push(`carrito sin JS: ${updates} inputs updates[]`);
  win = await load("/pages/favoritos?nojs=1", { width: 1280 });
  assert(/JavaScript/i.test($(win, "#MainContent").textContent), "aviso sin JS en favoritos");
  win = await load("/collections/oasis-natural?nojs=1", { width: 1280 });
  assert($$(win, "[data-wishlist-trigger]").every((h) => h.hidden), "corazones ocultos sin JS");
  return notes.join("; ");
});

/* ============ Accesibilidad cruzada ============ */
function a11yAudit(win) {
  const d = win.document;
  const issues = [];
  const name = (el) => (el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => d.getElementById(id)?.textContent || "").join("") || el.textContent || el.getAttribute("title") || [...el.querySelectorAll("img[alt]")].map((i) => i.alt).join("") || "").trim();
  for (const el of d.querySelectorAll("a[href], button, [role='button']")) if (!el.closest("template") && !name(el)) issues.push(`sin nombre: <${el.tagName.toLowerCase()} class="${el.className}">`);
  for (const el of d.querySelectorAll("input:not([type='hidden']), select, textarea")) {
    if (el.closest("template")) continue;
    const labelled = el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
    if (!labelled) issues.push(`control sin label: ${el.name || el.id}`);
  }
  for (const el of d.querySelectorAll("[aria-controls]")) for (const id of el.getAttribute("aria-controls").split(/\s+/)) if (!d.getElementById(id)) issues.push(`aria-controls roto: ${id}`);
  for (const el of d.querySelectorAll("[aria-labelledby]")) for (const id of el.getAttribute("aria-labelledby").split(/\s+/)) if (!d.getElementById(id)) issues.push(`aria-labelledby roto: ${id}`);
  const ids = [...d.querySelectorAll("[id]")].map((e) => e.id);
  const dup = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dup.length) issues.push(`ids duplicados: ${dup}`);
  if (d.querySelectorAll("a a, a button, button a, button button, form form").length) issues.push("interactivos/forms anidados");
  for (const img of d.querySelectorAll("img")) if (!img.hasAttribute("alt")) issues.push(`img sin alt: ${img.src.slice(-30)}`);
  const h1 = [...d.querySelectorAll("h1")].filter((h) => !h.closest("template")).length;
  if (h1 !== 1) issues.push(`h1 = ${h1}`);
  if (!d.querySelector("main")) issues.push("sin <main>");
  if (!d.querySelector("header")) issues.push("sin <header>");
  if (!d.querySelector("footer")) issues.push("sin <footer>");
  if (!d.documentElement.lang) issues.push("html sin lang");
  return issues;
}
for (const page of ["/?configured=1", "/collections/oasis-natural", "/products/bikini-oasis-natural-arena", "/cart", "/search?q=bikini", "/search", "/pages/favoritos", "/pages/sobre-nosotras", "/blogs/news", "/blogs/news/cuidados", "/nada"]) {
  await test("A11y", `${page}: nombres, labels, aria-*, ids, anidados, alt, 1 h1, landmarks`, async () => {
    await reset(2);
    const win = await load(page, { width: 1280 });
    const issues = a11yAudit(win);
    assert(issues.length === 0, issues.slice(0, 8).join(" | "));
  });
}

await test("A11y", "CSS: reglas prefers-reduced-motion y :focus-visible presentes; targets del header ≥44px en 375", async () => {
  const win = await load("/", { width: 375 });
  let reduced = 0;
  let focus = 0;
  for (const sheet of win.document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    const walk = (list) => {
      for (const r of list) {
        if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) reduced += 1;
        if (r.selectorText && r.selectorText.includes(":focus-visible")) focus += 1;
        if (r.cssRules) walk(r.cssRules);
      }
    };
    walk(rules);
  }
  assert(reduced > 0 && focus > 0, `reduced ${reduced}, focus-visible ${focus}`);
  const small = $$(win, ".site-header a, .site-header button").filter(visible).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width < 44 || r.height < 44;
  });
  assert(small.length === 0, `targets < 44px: ${small.map((e) => e.className).join(", ")}`);
  return `${reduced} bloques reduced-motion, ${focus} reglas :focus-visible`;
});

await test("A Header", "03A: nombre largo ('Radaelli Swimwear Dev') y logo de imagen: sin overflow y carrito dentro de la pantalla, 320→1440", async () => {
  await reset();
  const bad = [];
  for (const q of ["shopname=Radaelli%20Swimwear%20Dev", "logo=1", "shopname=Radaelli%20Swimwear%20Dev%20Colombia%20Tienda"]) {
    for (const w of [320, 375, 390, 768, 1024, 1280, 1440]) {
      const win = await load("/?" + q, { width: w, height: 500 });
      const cw = win.document.documentElement.clientWidth;
      const cart = $(win, ".site-header__cart").getBoundingClientRect();
      if (overflow(win) > 0) bad.push(q + " " + w + "px overflow " + overflow(win));
      if (cart.right > cw + 0.5 || cart.left < 0) bad.push(q + " " + w + "px carrito fuera (" + Math.round(cart.left) + "-" + Math.round(cart.right) + " / " + cw + ")");
      const logo = $(win, ".site-header__logo").getBoundingClientRect();
      if (logo.width < 40) bad.push(q + " " + w + "px logo demasiado chico " + Math.round(logo.width));
    }
  }
  assert(bad.length === 0, bad.join("; "));
  return "3 variantes × 7 anchos";
});

/* ============ K2. Link a Favoritos sin plantilla asignada (03B) ============ */
await test("K Wishlist", "03B: página sin plantilla asignada => header pide ?view=wishlist y renderiza la wishlist; asignada => link limpio", async () => {
  await reset();
  const bad = [];
  let win = await load("/?unassigned=1", { width: 1280 });
  const hrefs = $$(win, "[data-wishlist-link]").map((a) => a.getAttribute("href"));
  if (!hrefs.length || hrefs.some((h) => h !== "/pages/favoritos?view=wishlist")) bad.push(`sin asignar: ${hrefs.join(",")}`);
  win = await load("/", { width: 1280 });
  const clean = $$(win, "[data-wishlist-link]").map((a) => a.getAttribute("href"));
  if (!clean.length || clean.some((h) => h !== "/pages/favoritos")) bad.push(`asignada: ${clean.join(",")}`);
  win = await load("/pages/favoritos?view=wishlist&unassigned=1", { width: 390 });
  if (!win.document.body.className.includes("template-page--wishlist") || !$(win, "wishlist-page")) bad.push("?view=wishlist no renderiza la wishlist");
  if (overflow(win) > 0 || errs(win).length) bad.push(`view=wishlist: overflow ${overflow(win)} / ${errs(win).join("|")}`);
  win = await load("/pages/favoritos?unassigned=1&nojs=1", { width: 390 });
  if ($(win, "wishlist-page")) bad.push("control: sin asignar y sin view debería ser la página genérica");
  // Rama settings.wishlist_page (la página elegida en Theme settings), asignada y sin asignar.
  for (const [q, want] of [["wlpage=1", "/pages/favoritos"], ["wlpage=1&unassigned=1", "/pages/favoritos?view=wishlist"]]) {
    win = await load("/?" + q, { width: 1280 });
    const got = $$(win, "[data-wishlist-link]").map((a) => a.getAttribute("href"));
    if (!got.length || got.some((h) => h !== want)) bad.push(`${q}: ${got.join(",")} (esperado ${want})`);
  }
  assert(bad.length === 0, bad.join("; "));
  return `${hrefs.length} links → ${hrefs[0]}; rama setting OK`;
});

/* ============ D2. Tarjetas con el catálogo real (03C): título + precio -20% ============ */
await test("D Product Card", "03C: títulos en MAYÚSCULAS + precio con descuento: 0 overflow en colección y Home, 9 anchos", async () => {
  await reset();
  const bad = [];
  for (const page of ["/collections/oasis-natural?realsale=1", "/collections/all?realsale=1", "/?configured=1&realsale=1"]) {
    for (const w of WIDTHS) {
      const win = await load(page, { width: w, height: 700 });
      if (overflow(win) > 0) bad.push(`${page} ${w}px overflow ${overflow(win)}`);
      const sale = $$(win, "main .product-card .price--sale").length;
      if (!sale) bad.push(`${page} ${w}px sin precios en oferta (el modo realsale no aplicó)`);
      for (const card of $$(win, "main .product-card")) {
        const c = card.getBoundingClientRect();
        const p = card.querySelector(".product-card__price")?.getBoundingClientRect();
        if (p && (p.right > c.right + 0.5 || p.left < c.left - 0.5)) {
          bad.push(`${page} ${w}px precio fuera de la tarjeta`);
          break;
        }
      }
    }
  }
  assert(bad.length === 0, bad.slice(0, 6).join("; "));
  return "3 páginas × 9 anchos";
});

/* ============ I18n en (03B): /en publicado; | t ya viene escapado ============ */
await test("I18n en", "03B: /en sin doble escape (We're, couldn't) en textos ni atributos, 7 páginas", async () => {
  await reset(2);
  const bad = [];
  const pages = ["/?configured=1", "/products/bikini-oasis-natural-arena", "/collections/oasis-natural", "/cart", "/search?q=bikini", "/pages/favoritos", "/password"];
  for (const page of pages) {
    const win = page === "/password" ? await loadRaw(page + "?locale=en", { width: 1280 }) : await load(page + (page.includes("?") ? "&" : "?") + "locale=en", { width: 1280 });
    const d = win.document;
    if (d.documentElement.lang !== "en") bad.push(`${page}: lang ${d.documentElement.lang}`);
    const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
    // El texto fuente de <script>/<template> no se ve: su caso (cart-config) se prueba abajo por la UI.
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!n.parentElement.closest("script, style, template, noscript") && /&(#39|quot|amp|lt|gt);/.test(n.nodeValue)) bad.push(`${page}: texto "${n.nodeValue.trim().slice(0, 50)}"`);
    for (const el of d.querySelectorAll("*")) for (const a of el.attributes) if (/&(#39|quot|amp|lt|gt);/.test(a.value)) bad.push(`${page}: ${a.name}="${a.value.slice(0, 50)}"`);
  }
  const pdp = await load("/products/bikini-oasis-natural-arena?locale=en", { width: 1280 });
  eq($(pdp, "[data-error-add]")?.dataset.errorAdd, "We couldn't add the product. Please try again.", "data-error-add en");
  // Error del carrito que sale de cart-config (JSON en <script>) y se muestra con textContent.
  $$(pdp, "[data-option-input]").find((i) => i.value === "S").click();
  await sleep(80);
  $(pdp, "[data-variant-id-input]").value = "999999";
  $(pdp, "[data-add-to-cart]").click();
  const shown = await waitFor(() => $$(pdp, "body *").filter((e) => !e.closest("script, template") && e.childElementCount === 0 && visible(e)).map((e) => e.textContent.trim()).find((t) => /couldn/.test(t)), 4000);
  eq(shown, "We couldn't add the product. Please try again.", "error del carrito visible (cart.js) en en");
  const pw = await loadRaw("/password?locale=en", { width: 390 });
  eq($(pw, "h1").textContent.trim(), "We're preparing something special", "h1 en");
  assert(bad.length === 0, bad.slice(0, 6).join(" | "));
  return `${pages.length} páginas en inglés`;
});

/* ============ N. Password (03B) -- layout sin JS del theme ============ */
async function loadRaw(path, { width = 1280, height = 800 } = {}) {
  clearFrames();
  const frame = document.createElement("iframe");
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  document.getElementById("frames").append(frame);
  await new Promise((resolve) => {
    frame.onload = resolve;
    frame.src = path + (path.includes("?") ? "&" : "?") + "h=1";
  });
  await sleep(120);
  return frame.contentWindow;
}
await test("N Password", "03B: tarjeta centrada, input/botón/link ≥44px, sin overflow ni errores en 9 anchos; logo y nombre largo", async () => {
  const bad = [];
  for (const q of ["", "logo=1", "shopname=Radaelli%20Swimwear%20Dev%20Colombia%20Tienda%20Oficial"]) {
    for (const w of WIDTHS) {
      const win = await loadRaw("/password" + (q ? "?" + q : ""), { width: w, height: 700 });
      const cw = win.document.documentElement.clientWidth;
      if (overflow(win) > 0) bad.push(`${q} ${w}px overflow ${overflow(win)}`);
      if (errs(win).length) bad.push(`${q} ${w}px ${errs(win).join(" | ")}`);
      const card = $(win, ".password__card")?.getBoundingClientRect();
      if (!card) {
        bad.push(`${q} ${w}px sin tarjeta`);
        continue;
      }
      if (Math.abs(card.left - (cw - card.right)) > 2) bad.push(`${q} ${w}px descentrada ${Math.round(card.left)}/${Math.round(cw - card.right)}`);
      // Vertical: si la tarjeta entra en la pantalla, mismo espacio arriba y abajo
      // (en fila el wrapper .shopify-section se estira y la tarjeta queda arriba).
      const main = $(win, ".password-main").getBoundingClientRect();
      if (main.height <= win.innerHeight + 0.5 && Math.abs(card.top - main.top - (main.bottom - card.bottom)) > 2) bad.push(`${q} ${w}px no centrada en vertical ${Math.round(card.top - main.top)}/${Math.round(main.bottom - card.bottom)}`);
      for (const sel of [".password__input", ".password__submit", ".password__admin-link"]) {
        const r = $(win, sel).getBoundingClientRect();
        if (r.height < 44) bad.push(`${q} ${w}px ${sel} alto ${Math.round(r.height)}`);
        if (r.right > cw + 0.5 || r.left < 0) bad.push(`${q} ${w}px ${sel} fuera`);
      }
      if (q === "logo=1" && !$(win, "img.password__logo[alt]")) bad.push(`${w}px sin logo`);
    }
  }
  assert(bad.length === 0, bad.slice(0, 8).join("; "));
  return "3 variantes × 9 anchos";
});
await test("N Password", "03B: form nativo storefront_password, label, 1 h1, main + skip link, sin JS del theme, a11y", async () => {
  const win = await loadRaw("/password", { width: 390 });
  const d = win.document;
  assert(d.body.className.includes("template-password"), "body template-password");
  const form = $(win, "form.password__form");
  assert(form && form.getAttribute("action") === "/password" && form.querySelector("[name=form_type]")?.value === "storefront_password", "form storefront_password nativo");
  const input = $(win, "input[name=password]");
  assert(input.type === "password" && input.required && input.labels.length === 1, "input password con label");
  assert(!input.hasAttribute("aria-invalid") && !$(win, "[role=alert]"), "sin error por defecto");
  assert($(win, "main#MainContent") && $(win, "a[href='#MainContent']"), "main + skip link");
  eq($$(win, "script[src]").map((s) => s.getAttribute("src")), [], "sin <script src> del theme");
  const issues = a11yAudit(win).filter((i) => i !== "sin <header>" && i !== "sin <footer>");
  assert(issues.length === 0, issues.join(" | "));
  // Teclado: el orden de tab natural llega a input -> botón -> link admin.
  const order = $$(win, "a[href], button, input:not([type=hidden])").filter(visible).map((el) => el.className.split(" ").pop());
  return `orden de foco: ${order.join(" → ")}`;
});
await test("N Password", "03B: form.errors => role=alert + aria-invalid + aria-describedby; shop.password_message pisa el fallback", async () => {
  const win = await loadRaw("/password?pwerror=1&pwmsg=" + encodeURIComponent("Mensaje de Preferencias"), { width: 320 });
  const input = $(win, "input[name=password]");
  const alert = $(win, "[role=alert]");
  assert(alert && visible(alert) && alert.textContent.trim().length > 0, "alerta visible");
  eq(input.getAttribute("aria-invalid"), "true", "aria-invalid");
  eq(input.getAttribute("aria-describedby"), alert.id, "aria-describedby -> alerta");
  eq($(win, ".password__message").textContent.trim(), "Mensaje de Preferencias", "mensaje de Preferencias");
  assert(input.classList.contains("is-invalid"), "campo con .is-invalid");
  assert(overflow(win) === 0, "overflow con error en 320");
  const w2 = await loadRaw("/password", { width: 390 });
  assert($(w2, ".password__message").textContent.trim().length > 0, "fallback del idioma");
  assert(!/pronto|abre|lanz/i.test($(w2, ".password__card").textContent), "sin promesas de lanzamiento");
  assert(!$(w2, "input[name=password]").classList.contains("is-invalid"), "sin .is-invalid por defecto");
});
await test("N Password", "03B: h1 nunca vacío; mensaje largo sin espacios sin overflow a 320; saltos de línea respetados y escapados", async () => {
  const long = "https://radaelliswimwear.com/una-url-muy-larga-sin-espacios-que-no-debe-romper-la-tarjeta-" + "x".repeat(40);
  let win = await loadRaw("/password?pwmsg=" + encodeURIComponent(long), { width: 320 });
  assert($(win, "h1").textContent.trim().length > 0, "h1 vacío");
  assert(overflow(win) === 0, `overflow ${overflow(win)} con mensaje largo`);
  win = await loadRaw("/password?pwmsg=" + encodeURIComponent("Línea uno\nLínea <b>dos</b>"), { width: 390 });
  const msg = $(win, ".password__message");
  eq(msg.querySelectorAll("br").length, 1, "1 <br> por salto de línea");
  eq(msg.querySelectorAll("b").length, 0, "HTML escapado (texto plano)");
  return "h1 del idioma; 320px sin overflow; <br> + escape";
});

/* ============ E2. Filtros reales (03D): precio en centavos, orden, disponibilidad ============ */
await test("E2 Filtros precio", "precio aplicado vuelve en unidades (no x100) y el form de orden lo conserva", async () => {
  const win = await load("/collections/oasis-natural?filter.v.price.gte=150000&filter.v.price.lte=160000&sort_by=price-ascending", { width: 1280 });
  const cf = $(win, ".collection-filters");
  const min = cf.querySelector("input[type=number][name='filter.v.price.gte']");
  const max = cf.querySelector("input[type=number][name='filter.v.price.lte']");
  eq([min?.value, max?.value], ["150000", "160000"], "inputs de precio");
  const sortForm = cf.querySelector("select[name=sort_by]").form;
  const hidden = [...sortForm.querySelectorAll("input[type=hidden]")].map((i) => `${i.name}=${i.value}`);
  eq(hidden, ["filter.v.price.gte=150000", "filter.v.price.lte=160000"], "hidden del form de orden");
  const priceHidden = [...min.form.querySelectorAll("input[type=hidden]")].map((i) => `${i.name}=${i.value}`);
  eq(priceHidden, ["sort_by=price-ascending"], "hidden del form de precio");
  eq(cf.querySelector(".collection-filters__clear")?.getAttribute("href"), "/collections/oasis-natural?sort_by=price-ascending", "Limpiar conserva el orden");
  eq(cf.querySelector("select[name=sort_by]").value, "price-ascending", "orden elegido");
  eq($(win, ".collection-toolbar__count")?.textContent.trim(), "2 productos", "conteo filtrado");
  eq(errs(win), [], "errores");
});

await test("E2 Filtros round-trip", "cambiar el orden con precio activo navega con el MISMO rango (no x100)", async () => {
  const win = await load("/collections/oasis-natural?filter.v.price.gte=150000&filter.v.price.lte=160000", { width: 1280 });
  const frame = [...document.querySelectorAll("#frames iframe")].pop();
  const select = win.document.querySelector(".collection-filters select[name=sort_by]");
  const loaded = new Promise((r) => (frame.onload = r));
  select.value = "price-descending";
  select.dispatchEvent(new win.Event("change", { bubbles: true }));
  await Promise.race([loaded, sleep(4000)]);
  const params = new URL(frame.contentWindow.location.href).searchParams;
  eq([params.get("filter.v.price.gte"), params.get("filter.v.price.lte"), params.get("sort_by")], ["150000", "160000", "price-descending"], "query tras cambiar orden");
  const again = frame.contentWindow.document.querySelector(".collection-filters input[type=number][name='filter.v.price.gte']")?.value;
  eq(again, "150000", "el input sigue en unidades tras el round-trip");
});

await test("E2 Disponibilidad", "sin ajuste: no se ofrece Disponibilidad; con avail=1 aparece En existencia y se oculta Agotado (0)", async () => {
  let win = await load("/collections/oasis-natural?sd=0", { width: 1280 });
  let cf = $(win, ".collection-filters");
  const titles = [...cf.querySelectorAll(".collection-filters__group-title")].map((h) => h.textContent.trim());
  eq(titles, ["Ordenar por", "Precio"], "grupos sin Search & Discovery");
  eq(cf.querySelectorAll("a[href*='filter.v.availability']").length, 0, "links de disponibilidad");
  win = await load("/collections/salidas-de-bano?sd=0&avail=1", { width: 1280 });
  cf = $(win, ".collection-filters");
  const chips = [...cf.querySelectorAll("a[href*='filter.v.availability']")].map((a) => a.textContent.trim());
  eq(chips, ["En existencia (1)"], "chips con el ajuste activo");
});

await test("E2 Orden etiquetas", "manual se muestra como Destacados/Featured, no como el 'Características' de Shopify", async () => {
  let win = await load("/collections/oasis-natural", { width: 1280 });
  let opt = $(win, ".collection-filters select[name=sort_by] option[value=manual]");
  eq(opt?.textContent.trim(), "Destacados", "es");
  eq($(win, ".collection-filters select[name=sort_by]").options.length, 9, "opciones de Shopify intactas");
  win = await load("/collections/oasis-natural?locale=en", { width: 1280 });
  opt = $(win, ".collection-filters select[name=sort_by] option[value=manual]");
  eq(opt?.textContent.trim(), "Featured", "en");
});

await test("E2 Atrás bfcache", "restaurar desde bfcache re-sincroniza orden/precio con el HTML y cierra el drawer", async () => {
  const win = await load("/collections/oasis-natural?filter.v.price.gte=150000", { width: 375 });
  const select = $(win, ".collection-filters select[name=sort_by]");
  const min = $(win, ".collection-filters input[type=number][name='filter.v.price.gte']");
  select.value = "price-ascending";
  min.value = "999";
  $$(win, "[data-filter-drawer-trigger]").find(visible)?.click();
  await sleep(150);
  eq(win.document.body.classList.contains("has-filter-drawer-open"), true, "drawer abierto antes");
  win.dispatchEvent(new win.PageTransitionEvent("pageshow", { persisted: true }));
  eq([select.value, min.value], ["manual", "150000"], "controles tras restaurar");
  eq(win.document.body.classList.contains("has-filter-drawer-open"), false, "scroll lock liberado");
  eq(win.document.getElementById("collection-filter-drawer").hasAttribute("hidden"), true, "drawer cerrado");
  eq(errs(win), [], "errores");
});

/* ============ O. Envío gratis (03D): un solo cerrojo, sin promesa por defecto ============ */
const shippingState = async (qs) => {
  let win = await load("/" + qs, { width: 1280 });
  const home = $(win, ".section-promo__fine-print")?.textContent.replace(/\s+/g, " ").trim() ?? null;
  win = await load("/products/bikini-oasis-natural-arena" + qs, { width: 1280 });
  const acc = $$(win, ".product-accordion, details").map((d) => d.textContent.replace(/\s+/g, " ")).find((t) => /Garantía de 12 meses/.test(t)) ?? "";
  win = await load("/cart" + (qs ? qs + "&fsp=1" : "?fsp=1"), { width: 1280 });
  const cart = !!$(win, ".cart-free-shipping");
  return { home, pdpPromise: /Envío gratis en compras desde/.test(acc), pdpNote: /Por debajo de ese monto/.test(acc), pdpWarranty: /Garantía de 12 meses/.test(acc), cart };
};
await test("O Envío gratis", "sin tarifa confirmada: ni banner, ni ficha, ni barra del carrito (aunque la barra esté encendida)", async () => {
  await reset(2);
  const s = await shippingState("");
  eq(s, { home: null, pdpPromise: false, pdpNote: false, pdpWarranty: true, cart: false }, "estado por defecto");
});
await test("O Envío gratis", "con tarifa confirmada (fsr=1): vuelve la paridad -- banner, ficha con su nota y barra", async () => {
  await reset(2);
  const s = await shippingState("?fsr=1");
  assert(/299\.900/.test(s.home ?? ""), `banner: ${s.home}`);
  eq([s.pdpPromise, s.pdpNote, s.pdpWarranty, s.cart], [true, true, true, true], "ficha y carrito");
});
await test("O Envío gratis", "tarifa confirmada pero otra moneda (cur=USD): no se promete un umbral en pesos", async () => {
  await reset(2);
  const s = await shippingState("?fsr=1&cur=USD");
  eq(s, { home: null, pdpPromise: false, pdpNote: false, pdpWarranty: true, cart: false }, "moneda distinta");
});

/* ============ P. SEO noindex + LCP de tarjetas (03E) ============ */
const robotsOf = async (path) => {
  const html = await (await fetch(path)).text();
  const d = new DOMParser().parseFromString(html, "text/html");
  return [...d.querySelectorAll("meta[name=robots]")].map((m) => m.content).join("|");
};
await test("P SEO", "noindex como el sitio real: búsqueda y favoritos noindex,nofollow; 404 noindex,follow; ficha/colección/página sin robots", async () => {
  eq(await robotsOf("/search?q=bikini"), "noindex, nofollow", "búsqueda");
  eq(await robotsOf("/pages/favoritos"), "noindex, nofollow", "favoritos (plantilla page.wishlist)");
  // 03F: sin plantilla asignada (unassigned=1) la URL simple de favoritos también es noindex.
  eq(await robotsOf("/pages/favoritos?unassigned=1"), "noindex, nofollow", "favoritos sin plantilla asignada");
  eq(await robotsOf("/pages/sobre-nosotras?view=wishlist"), "noindex, nofollow", "?view=wishlist");
  eq(await robotsOf("/no-existe-03e"), "noindex, follow", "404");
  eq([await robotsOf("/products/bikini-oasis-natural-arena"), await robotsOf("/collections/oasis-natural"), await robotsOf("/pages/sobre-nosotras")], ["", "", ""], "indexables");
});
await test("P LCP", "colección y búsqueda: primeras 4 tarjetas eager, el resto lazy; imagen secundaria siempre lazy", async () => {
  for (const path of ["/collections/all", "/search?q=a"]) {
    const d = new DOMParser().parseFromString(await (await fetch(path)).text(), "text/html");
    const prim = [...d.querySelectorAll("#MainContent .product-card__image--primary")].map((i) => i.getAttribute("loading"));
    const sec = [...d.querySelectorAll("#MainContent .product-card__image--secondary")].map((i) => i.getAttribute("loading"));
    assert(prim.length >= 5, `${path}: tarjetas ${prim.length}`);
    eq(prim.slice(0, 5), ["eager", "eager", "eager", "eager", "lazy"], `${path} principales`);
    assert(sec.length > 0 && sec.every((l) => l === "lazy"), `${path} secundarias: ${sec}`);
  }
});

/* ============ Q. Títulos sobre fondos oscuros heredan el blanco (03E) ============ */
await test("Q Contraste", "banner de colección: el h1 hereda el blanco de la sección (antes #171717 sobre #0a0a0a)", async () => {
  const win = await load("/collections/oasis-natural", { width: 1280 });
  const h = $(win, ".collection-banner__title");
  assert(h, "título del banner");
  eq(win.getComputedStyle(h).color, "rgb(255, 255, 255)", "color del h1 del banner");
});
await test("Q Contraste", "hero: con video el h1 es blanco; sin video conserva el oscuro de la sección", async () => {
  const win = await load("/", { width: 1280 });
  const fb = $(win, ".section-hero__headline");
  eq(win.getComputedStyle(fb).color, win.getComputedStyle(fb.closest(".section-hero") || fb.parentElement).color, "sin video = color de la sección");
  const probe = win.document.createElement("section");
  probe.className = "section-hero section-hero--video";
  probe.innerHTML = '<h1 class="section-hero__headline h-display">Prueba</h1>';
  win.document.getElementById("MainContent").append(probe);
  eq(win.getComputedStyle(probe.querySelector("h1")).color, "rgb(255, 255, 255)", "con video");
});

await test("B Footer 03E", "columnas Comprar → Ayuda → Contacto; Ayuda solo con destinos reales (Devoluciones, Garantía); ancla #contacto", async () => {
  const win = await load("/", { width: 1280 });
  const footer = $(win, "footer#contacto");
  assert(footer, "footer con id contacto");
  const headings = [...footer.querySelectorAll("h2, h3, summary, .site-footer__heading")].map((h) => h.textContent.trim()).filter(Boolean);
  const iA = headings.findIndex((t) => /^Ayuda$/i.test(t));
  assert(iA > headings.findIndex((t) => /^Comprar$/i.test(t)), `orden de columnas: ${headings}`);
  const ayudaLinks = [...footer.querySelectorAll("a")].filter((a) => /\/policies\/refund-policy|\/pages\/garantia/.test(a.getAttribute("href"))).map((a) => a.textContent.trim() + "=" + a.getAttribute("href"));
  eq(ayudaLinks, ["Devoluciones=/policies/refund-policy", "Garantía=/pages/garantia"], "links de Ayuda");
  eq(errs(win), [], "errores");
});

/* ============ R. Seguridad, accesibilidad y metafields (03E, verificadores) ============ */
await test("R Seguridad", "SEC-04: ?vista con espacios no rompe el toolbar (columnas por defecto y drawer operativo)", async () => {
  const win = await load("/collections/oasis-natural?vista=2%203", { width: 375 });
  eq(errs(win), [], "errores");
  assert($(win, "[data-collection-grid]").classList.contains("grid--3"), "grid con la vista por defecto");
  const trig = $$(win, "[data-filter-drawer-trigger]").find(visible);
  trig.click();
  await sleep(150);
  assert(visible($(win, ".filter-drawer__panel")), "drawer abre");
});
await test("R Seguridad", "SEC-01: sort_by de la URL que no es una opción de Shopify no se imprime", async () => {
  const bad = encodeURIComponent('"><img id=inj src=x>');
  const d = new DOMParser().parseFromString(await (await fetch(`/collections/oasis-natural?filter.v.price.gte=150000&sort_by=${bad}`)).text(), "text/html");
  eq(d.querySelectorAll("#inj").length, 0, "sin elemento inyectado");
  eq([...d.querySelectorAll('.collection-filters input[name="sort_by"]')].length, 0, "sin hidden sort_by inválido");
  const clear = d.querySelector(".collection-filters__clear")?.getAttribute("href");
  eq(clear, "/collections/oasis-natural", "Limpiar sin sort_by inválido");
});
await test("R Seguridad", "SEC-02: <title> y og:title escapados; etiquetas traducidas (sin 'tagged')", async () => {
  const d = new DOMParser().parseFromString(await (await fetch(`/pages/sobre-nosotras?ptitle=${encodeURIComponent("A </title><img id=inj2 src=x>")}&tags=Mostaza`)).text(), "text/html");
  eq(d.querySelectorAll("#inj2").length, 0, "sin elemento inyectado");
  assert(d.title.includes("</title><img id=inj2 src=x>"), `el título conserva el texto literal: ${d.title}`);
  assert(/Etiquetas: Mostaza/.test(d.title) && !/tagged/.test(d.title), `etiquetas: ${d.title}`);
  eq(d.querySelector('meta[property="og:title"]').getAttribute("content"), "A </title><img id=inj2 src=x>", "og:title");
});
await test("R A11y", "precio tachado anunciado; footer role=group; newsletter autocomplete=email; trigger de filtros con aria; contador del visor live; dropdown sin aria-haspopup", async () => {
  let win = await load("/products/enterizo-aurora-viva-negro", { width: 1280 });
  const cmp = $(win, ".price__compare");
  assert(/Precio anterior/.test(cmp?.querySelector(".visually-hidden")?.textContent ?? ""), "texto oculto del precio anterior");
  eq(win.document.querySelector("[data-lightbox-counter]")?.getAttribute("aria-live"), "polite", "contador del visor");
  // Rama de tarjetas de price.liquid (sin data-attributes): también anunciada.
  win = await load("/collections/aurora-viva", { width: 1280 });
  const cardCmp = $$(win, ".product-card .price__compare");
  assert(cardCmp.length > 0 && cardCmp.every((c) => /Precio anterior/.test(c.querySelector(".visually-hidden")?.textContent ?? "")), "precio anterior en tarjetas");
  win = await load("/", { width: 1280 });
  eq($(win, ".site-footer__social")?.getAttribute("role"), "group", "redes");
  const emails = $$(win, 'input[type="email"][name="contact[email]"]');
  assert(emails.length > 0 && emails.every((i) => i.getAttribute("autocomplete") === "email"), "autocomplete email");
  eq($$(win, "[data-dropdown-trigger][aria-haspopup]").length, 0, "disclosure sin aria-haspopup");
  win = await load("/collections/oasis-natural", { width: 375 });
  const t = $(win, "[data-filter-drawer-trigger]");
  eq([t.getAttribute("aria-haspopup"), t.getAttribute("aria-controls")], ["dialog", "collection-filter-drawer"], "trigger de filtros");
});
await test("R A11y", "tarjetas de colección/búsqueda sin 'Vista rápida' inerte; overlay no captura taps; foco de la tarjeta hacia adentro", async () => {
  for (const path of ["/collections/oasis-natural", "/search?q=a"]) {
    const win = await load(path, { width: 1280 });
    eq($$(win, "#MainContent [data-quick-view-trigger]").length, 0, `${path}: botón inerte`);
    const ov = $(win, "#MainContent .product-card__overlay");
    assert(ov, `${path}: overlay`);
    eq(win.getComputedStyle(ov).pointerEvents, "none", `${path}: pointer-events`);
  }
  const win = await load("/collections/oasis-natural", { width: 1280 });
  const rule = [...win.document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).find((r) => r.selectorText === ".product-card__link:focus-visible");
  eq(rule?.style.outlineOffset, "-2px", "outline hacia adentro");
});
await test("R A11y", "carrusel: si la flecha con foco se oculta, el foco pasa a la otra", async () => {
  const win = await load("/?configured=1", { width: 375 });
  const car = $$(win, "product-carousel").find((c) => c.track && c.track.scrollWidth > c.track.clientWidth + 10);
  assert(car, "carrusel con overflow");
  car.track.style.scrollBehavior = "auto";
  car.nextButton.hidden = false;
  car.nextButton.focus();
  car.track.scrollLeft = car.track.scrollWidth;
  await sleep(80);
  car.updateArrows();
  assert(car.nextButton.hidden, "flecha siguiente oculta al final");
  eq(win.document.activeElement, car.prevButton, "foco en la flecha anterior");
});
await test("R A11y", "precio de sugerencias 5,27:1; live region vacía antes de re-anunciar; links de contenido subrayados", async () => {
  const win = await load("/", { width: 1280 });
  const probe = win.document.createElement("div");
  probe.innerHTML = '<span class="predictive-search__price">$ 1</span><div class="main-page__content"><p><a href="/x">x</a></p></div><div class="shopify-policy__body"><a href="/y">y</a></div>';
  win.document.getElementById("MainContent").append(probe);
  eq(win.getComputedStyle(probe.querySelector(".predictive-search__price")).color, "rgb(102, 102, 102)", "color del precio");
  assert(probe.querySelectorAll("a").length === 2 && [...probe.querySelectorAll("a")].every((a) => win.getComputedStyle(a).textDecorationLine.includes("underline")), "links subrayados");
  const ps = $(win, "predictive-search");
  if (ps?.status) {
    ps.status.textContent = "3 resultados";
    ps.announce("3 resultados");
    eq(ps.status.textContent, "", "vaciado inmediato");
    await sleep(160);
    eq(ps.status.textContent, "3 resultados", "re-anunciado");
  }
});
await test("R Metafields", "banner=1 (metafields como objetos, fiel a Shopify): el banner enmarcado recibe ancho/alto/encuadre", async () => {
  const d = new DOMParser().parseFromString(await (await fetch("/collections/oasis-natural?banner=1")).text(), "text/html");
  const f = d.querySelector("[data-collection-banner-frame]");
  assert(f, "banner enmarcado");
  eq([f.dataset.imageWidth, f.dataset.imageHeight, f.dataset.posX, f.dataset.posY, f.dataset.zoom], ["2400", "1600", "50", "26.69", "1"], "datos del banner");
});
await test("R Copy", "/en con tarifa confirmada: 'or more' (regla >=), no 'over'", async () => {
  const d = new DOMParser().parseFromString(await (await fetch("/?locale=en&fsr=1")).text(), "text/html");
  const fine = d.querySelector(".section-promo__fine-print")?.textContent.replace(/\s+/g, " ") ?? "";
  assert(/or more/.test(fine) && !/over/.test(fine), `fine print: ${fine}`);
});
await test("R Orden", "teclado: flechas NO navegan; Enter aplica el orden; mouse/change programático aplica", async () => {
  const win = await load("/collections/oasis-natural", { width: 1280 });
  const frame = [...document.querySelectorAll("#frames iframe")].pop();
  const select = win.document.querySelector(".collection-filters select[name=sort_by]");
  const before = frame.contentWindow.location.href;
  select.dispatchEvent(new win.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  select.value = "price-ascending";
  select.dispatchEvent(new win.Event("change", { bubbles: true }));
  await sleep(700);
  eq(frame.contentWindow.location.href, before, "sin navegación con flecha");
  const loaded = new Promise((r) => (frame.onload = r));
  select.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  await Promise.race([loaded, sleep(4000)]);
  eq(new URL(frame.contentWindow.location.href).searchParams.get("sort_by"), "price-ascending", "Enter aplica");
});

await test("F Product 03F", "el acordeón de envíos enlaza devoluciones (política nativa) y garantía (/pages/garantia)", async () => {
  const win = await load("/products/bikini-oasis-natural-arena", { width: 1280 });
  const links = $$(win, ".product-accordion__links a").map((a) => a.getAttribute("href")).filter((h) => /refund-policy|pages\/garantia/.test(h));
  eq(links, ["/policies/refund-policy", "/pages/garantia"], "links del acordeón");
});

/* ============ 03G: miga de la ficha = colección de categoría ============ */
// Shopify no garantiza el orden de product.collections: 4 fichas de Espuma de
// Ola mostraban "Destacados". El harness reproduce el orden malo (crumbs=N).
const crumbInfo = (win) => {
  const nav = $(win, ".breadcrumbs");
  const items = $$(win, ".breadcrumbs__item").map((li) => li.textContent.replace(/\s+/g, " ").replace("/", "").trim());
  const back = ($(win, ".main-product__back")?.textContent || "").replace(/\s+/g, " ").trim();
  const ld = $$(win, "script[type='application/ld+json']").map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } }).filter(Boolean).find((j) => j["@type"] === "BreadcrumbList");
  return { has: !!nav, items, back, ld: ld ? ld.itemListElement.map((e) => e.name) : null };
};
await test("P Product 03G", "con Destacados primero en product.collections, la miga, el 'Volver a' y el JSON-LD usan la categoría", async () => {
  const win = await load("/products/bikini-oasis-natural-oliva?crumbs=1", { width: 1280 });
  const c = crumbInfo(win);
  eq(c.items, ["Inicio", "Oasis Natural", "Bikini Oasis Natural Oliva"], "miga visible");
  eq(c.back, "Volver a Oasis Natural", "enlace Volver a");
  eq(c.ld, ["Inicio", "Oasis Natural", "Bikini Oasis Natural Oliva"], "JSON-LD BreadcrumbList");
  eq($(win, ".breadcrumbs__list li:nth-child(2) a")?.getAttribute("href"), "/collections/oasis-natural", "enlace de la categoría");
});
await test("P Product 03G", "llegando desde Destacados (contexto collection) la miga sigue siendo la categoría", async () => {
  const win = await load("/products/bikini-oasis-natural-oliva?crumbs=2", { width: 1280 });
  const c = crumbInfo(win);
  eq(c.items, ["Inicio", "Oasis Natural", "Bikini Oasis Natural Oliva"], "miga visible");
  eq(c.back, "Volver a Oasis Natural", "enlace Volver a");
});
await test("P Product 03G", "sin colección homónima al tipo se conserva el respaldo anterior (colección de contexto o la primera)", async () => {
  const win = await load("/products/bikini-oasis-natural-oliva?crumbs=3", { width: 1280 });
  const c = crumbInfo(win);
  eq(c.items, ["Inicio", "Destacados", "Bikini Oasis Natural Oliva"], "respaldo = product.collections.first");
});
await test("P Product 03G", "el fixture sin crumbs conserva su miga (producto sin colección homónima)", async () => {
  const win = await load("/products/bikini-oasis-natural-arena", { width: 1280 });
  const c = crumbInfo(win);
  eq(c.has, true, "hay miga");
  eq(c.items.length, 3, "3 niveles");
  eq(c.items[2], "Bikini Oasis Natural Arena", "producto actual");
});

/* ============ 03H: convergencia de la Home y del pie con el sitio actual ============ */
const cleanText = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
await test("Q Home 03H", "HP-03: el CTA del hero y el del promo saltan a #productos, y esa ancla existe", async () => {
  const win = await load("/", { width: 1280 });
  eq($(win, ".section-hero__cta")?.getAttribute("href"), "#productos", "CTA del hero");
  eq($(win, ".section-promo__cta")?.getAttribute("href"), "#productos", "CTA del promo");
  assert($(win, "section#productos"), "existe la ancla #productos");
  eq(errs(win), [], "errores");
});
await test("Q Home 03H", "HP-07: la editorial no muestra insignia ni 'Ver producto'; los destacados las conservan", async () => {
  const win = await load("/", { width: 1280 });
  const ed = $$(win, ".section-editorial .product-card");
  const ft = $$(win, ".section-featured-products .product-card");
  assert(ed.length > 0 && ft.length > 0, `tarjetas: editorial ${ed.length}, destacados ${ft.length}`);
  eq([$$(win, ".section-editorial .product-card__badge--category").length, $$(win, ".section-editorial .product-card__overlay--view-product").length], [0, 0], "editorial sin insignia ni overlay");
  eq([$$(win, ".section-featured-products .product-card__badge--category").length, $$(win, ".section-featured-products .product-card__overlay--view-product").length], [ft.length, ft.length], "destacados con ambos");
  assert(ed.every((c) => c.querySelector("a.product-card__link") && c.querySelector(".product-card__title") && c.querySelector(".product-card__price")), "la editorial conserva enlace, título y precio");
});
await test("Q Home 03H", "HP-08: el botón del newsletter dice 'Quiero enterarme'; con el ajuste vacío vuelve al texto del idioma", async () => {
  let win = await load("/", { width: 1280 });
  eq(cleanText($(win, ".section-newsletter-home button[type='submit']")), "Quiero enterarme", "botón con el ajuste");
  win = await load("/?nlblank=1", { width: 1280 });
  eq(cleanText($(win, ".section-newsletter-home button[type='submit']")), "Suscribirme", "respaldo de locale");
});
await test("Q Footer 03H", "HP-09: descripción y copyright con la marca del sitio actual, sin 'Dev' aunque la tienda se llame así", async () => {
  const win = await load("/?shopname=Radaelli%20Swimwear%20Dev", { width: 1280 });
  eq(cleanText($(win, ".site-footer__description")), "Radaelli Swimwear: trajes de baño de diseño atemporal, hechos para durar, con materiales nobles y una mirada minimalista.", "descripción de marca");
  const c = cleanText($(win, ".site-footer__copyright"));
  assert(/^© \d{4} Radaelli Swimwear\. Todos los derechos reservados\.$/.test(c), `copyright: ${c}`);
});
await test("Q Footer 03H", "HP-22: 'Contacto' una sola vez (el desplegable) y usuario o número como texto bajo cada red", async () => {
  const win = await load("/", { width: 1280 });
  const footer = $(win, "footer#contacto");
  const labels = [...footer.querySelectorAll("*")].filter((e) => e.children.length === 0 && e.textContent.trim() === "Contacto");
  eq(labels.map((e) => e.tagName.toLowerCase()), ["summary"], "'Contacto' solo en el summary");
  const items = $$(win, ".site-footer__contact-item").map((a) => cleanText(a.querySelector(".site-footer__contact-text > span:first-child")) + "=" + cleanText(a.querySelector(".site-footer__contact-handle")));
  // El número esperado se deriva del propio enlace de WhatsApp de la configuración del theme (03I: el número público de la marca
  // no se escribe literal en el repo; el formato esperado es "+CC AAA BBB CCCC").
  const waHref = ($$(win, ".site-footer__contact-item").find((a) => /wa\.me\//.test(a.getAttribute("href") || "")) || { getAttribute: () => "" }).getAttribute("href");
  const waDigits = (waHref.match(/wa\.me\/(\d+)/) || [])[1] || "";
  const waExpected = waDigits ? "+" + waDigits.slice(0, 2) + " " + waDigits.slice(2, 5) + " " + waDigits.slice(5, 8) + " " + waDigits.slice(8) : "(sin número en el enlace)";
  eq(items, ["Instagram=@Radaelli_swimwear", "Facebook=Radaelli_Swimwear", "TikTok=@RadaelliSwimwear", "WhatsApp=" + waExpected], "nombre = usuario o número");
  eq(errs(win), [], "errores");
});
await test("Q Footer 03H", "HP-22: usuario y número se derivan de las URLs (barra final, parámetros, sin '@'; enlace de WhatsApp que no es número; otro país; sin WhatsApp)", async () => {
  let win = await load("/?social=alt", { width: 1280 });
  let items = $$(win, ".site-footer__contact-item").map((a) => cleanText(a.querySelector(".site-footer__contact-handle")) || "(sin texto)");
  eq(items, ["@mi_marca", "MiMarca", "@mi_tiktok", "(sin texto)"], "URLs alternativas");
  win = await load("/?social=wa10", { width: 1280 });
  items = $$(win, ".site-footer__contact-item").map((a) => cleanText(a.querySelector(".site-footer__contact-handle")));
  eq(items[3], "+12025550123", "número de otro país");
  win = await load("/?social=nowa", { width: 1280 });
  eq($$(win, ".site-footer__contact-item").length, 3, "sin WhatsApp no hay ítem");
});

/* ============ 03K: SEO de la Home (HP-11) y contraste de la tarjeta sin imagen (H-01) ============ */
const seoDoc = async (path) => new DOMParser().parseFromString(await (await fetch(path)).text(), "text/html");
const metaC = (d, sel) => d.querySelector(sel)?.getAttribute("content") ?? null;
const ldOf = (d) => [...d.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
await test("K SEO 03K", "Home: og:type website, twitter:title/description/image y og:image con https: cuando image_url viene sin protocolo", async () => {
  const d = await seoDoc("/?pdesc=" + encodeURIComponent("Trajes de baño de diseño & materiales nobles") + "&socimg=1");
  eq(metaC(d, 'meta[property="og:type"]'), "website", "og:type");
  eq(metaC(d, 'meta[name="twitter:card"]'), "summary_large_image", "twitter:card");
  eq(metaC(d, 'meta[name="twitter:title"]'), metaC(d, 'meta[property="og:title"]'), "twitter:title = og:title");
  eq(metaC(d, 'meta[name="twitter:description"]'), "Trajes de baño de diseño & materiales nobles", "twitter:description");
  eq(metaC(d, 'meta[property="og:description"]'), "Trajes de baño de diseño & materiales nobles", "og:description");
  const og = metaC(d, 'meta[property="og:image"]');
  // En el arnés image_url devuelve una ruta sin dominio ("/__img/..."): lo que se prueba es que el theme antepone "https:".
  assert(og && /^https:.*\/__img\/2a4d69\.svg\?width=1200$/.test(og), "og:image con https: " + og);
  eq(metaC(d, 'meta[name="twitter:image"]'), og, "twitter:image = og:image");
});
await test("K SEO 03K", "imagen de compartir: la de la página gana; luego Ajustes; luego el logo; sin ninguna, sin og:image ni twitter:image (nunca inventada); URL con protocolo no se duplica", async () => {
  const has = (d) => [metaC(d, 'meta[property="og:image"]') !== null, metaC(d, 'meta[name="twitter:image"]') !== null];
  eq(has(await seoDoc("/")), [false, false], "sin imagen alguna");
  const logo = await seoDoc("/?logo=1");
  assert(/\/__img\/1f1f1f\.svg/.test(metaC(logo, 'meta[property="og:image"]') || ""), "respaldo al logo");
  const soc = await seoDoc("/?logo=1&socimg=1");
  assert(/\/__img\/2a4d69\.svg/.test(metaC(soc, 'meta[property="og:image"]') || ""), "Ajustes gana al logo");
  const page = await seoDoc("/?logo=1&socimg=1&pimg=1");
  assert(/\/__img\/8c5a3a\.svg/.test(metaC(page, 'meta[property="og:image"]') || ""), "la imagen de la página gana a Ajustes");
  const abs = await seoDoc("/?socimg=abs");
  eq(metaC(abs, 'meta[property="og:image"]'), "https://cdn.example.com/social.png?width=1200", "URL con protocolo intacta (sin https: duplicado)");
});
await test("K SEO 03K", "ficha: og:type product con la imagen destacada; colección y página: website", async () => {
  const p = await seoDoc("/products/bikini-oasis-natural-arena");
  eq(metaC(p, 'meta[property="og:type"]'), "product", "og:type ficha");
  assert(/\/__img\//.test(metaC(p, 'meta[property="og:image"]') || ""), "og:image de la ficha");
  eq(metaC(await seoDoc("/collections/oasis-natural"), 'meta[property="og:type"]'), "website", "colección");
  eq(metaC(await seoDoc("/pages/sobre-nosotras"), 'meta[property="og:type"]'), "website", "página");
});
await test("K SEO 03K", "JSON-LD de la Home: Organization + WebSite con SearchAction, sin logo ni description ni sameAs inventados; ninguno de los dos fuera de la Home", async () => {
  const d = await seoDoc("/?nosocial=1");
  const ld = ldOf(d);
  eq(ld.map((x) => x["@type"]), ["Organization", "WebSite"], "tipos en la Home");
  const [org, web] = ld;
  const O = location.origin; // el arnés corre en varios puertos (mutantes): el origen sale de la página
  eq([org["@context"], org.name, org.url], ["https://schema.org", "Radaelli Swimwear", O + "/"], "Organization");
  eq(["logo" in org, "description" in org, "sameAs" in org], [false, false, false], "sin datos que no existen");
  eq([web.name, web.url, web.potentialAction["@type"], web.potentialAction.target, web.potentialAction["query-input"]], ["Radaelli Swimwear", O + "/", "SearchAction", O + "/search?q={search_term_string}", "required name=search_term_string"], "WebSite + SearchAction");
  for (const path of ["/collections/oasis-natural", "/pages/sobre-nosotras", "/search?q=bikini", "/cart"]) {
    const types = ldOf(await seoDoc(path)).map((x) => x["@type"]);
    assert(!types.includes("Organization") && !types.includes("WebSite"), path + " no debe emitir Organization/WebSite: " + types);
  }
});
await test("K SEO 03K", "JSON-LD de la Home con datos: logo con https:, description de Preferencias sin HTML, sameAs solo con las redes cargadas (sin WhatsApp)", async () => {
  const org = ldOf(await seoDoc("/?logo=1&shopdesc=" + encodeURIComponent("<p>Trajes de baño de diseño.</p>")))[0];
  assert(/^https:.*\/__img\/1f1f1f\.svg\?width=600$/.test(org.logo), "logo " + org.logo);
  eq(org.description, "Trajes de baño de diseño.", "description");
  eq(org.sameAs, ["https://instagram.com/Radaelli_swimwear", "https://facebook.com/Radaelli_Swimwear", "https://tiktok.com/@RadaelliSwimwear"], "sameAs");
  assert(!org.sameAs.some((u) => /wa\.me/.test(u)), "WhatsApp fuera de sameAs");
});
await test("K SEO 03K", "JSON-LD seguro: nombre de tienda o descripción con comillas, & y </script> no rompen el script (siguen siendo 2 scripts ld+json y parsean)", async () => {
  const evil = 'Radaelli "Swim" & <b>Co</b></script><img id=inj3 src=x>';
  const d = await seoDoc("/?shopname=" + encodeURIComponent(evil) + "&shopdesc=" + encodeURIComponent("desc </script><img id=inj4 src=x> fin"));
  eq(d.querySelectorAll("#inj3, #inj4").length, 0, "sin elementos inyectados");
  const ld = ldOf(d);
  eq(ld.length, 2, "2 scripts ld+json");
  // "</" se cambia por "< /" (sin barras invertidas: Shopify y liquidjs las interpretan distinto).
  eq(ld[0].name, evil.split("</").join("< /"), "el nombre se conserva salvo el cierre de etiqueta neutralizado");
  eq(ld[1].name, ld[0].name, "WebSite = Organization");
  assert(!/</.test(ld[0].description) && /^desc/.test(ld[0].description) && /fin$/.test(ld[0].description), "descripción sin etiquetas: " + ld[0].description);
});
await test("K Contraste 03K", "H-01: la tarjeta de categoría sin imagen tiene fondo oscuro y texto con contraste AA (título, descripción >= 4,5:1); la tarjeta con imagen no cambia", async () => {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const over = (fg, bg) => {
    const a = fg[3] ?? 1;
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };
  const ratio = (fg, bg) => {
    const l1 = lum(over(fg, bg));
    const l2 = lum(bg);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  };
  const win = await load("/?configured=1&catimg=1", { width: 1280 });
  const cards = $$(win, ".section-categories__card");
  eq(cards.length, 3, "3 tarjetas");
  assert(!cards[0].classList.contains("section-categories__card--no-media"), "la tarjeta con imagen no lleva --no-media");
  assert(cards[1].classList.contains("section-categories__card--no-media") && cards[2].classList.contains("section-categories__card--no-media"), "las tarjetas sin imagen llevan --no-media");
  const c = cards[1];
  const bg = parse(win.getComputedStyle(c).backgroundColor);
  eq(bg.slice(0, 3), [23, 23, 23], "fondo #171717");
  const res = {};
  for (const [name, sel] of [["título", ".section-categories__card-title"], ["descripción", ".section-categories__card-description"]]) {
    const el = c.querySelector(sel);
    if (!el) continue;
    res[name] = ratio(parse(win.getComputedStyle(el).color), bg.slice(0, 3));
    assert(res[name] >= 4.5, name + " " + res[name].toFixed(2) + ":1");
  }
  assert(Object.keys(res).length === 2, "se midieron título y descripción: " + Object.keys(res));
  return Object.entries(res).map(([k, v]) => k + " " + v.toFixed(1) + ":1").join(", ");
});

await test("K Encabezados 03K", "colección y búsqueda con filtros colapsados (390 px): el orden de encabezados no salta de h1 a h3 (h2 'Productos' oculto a la vista) y también en 1280 px", async () => {
  const visibleHeadings = (win) =>
    $$(win, "main h1, main h2, main h3, main h4").filter((h) => {
      for (let n = h; n && n.nodeType === 1; n = n.parentElement) {
        const cs = win.getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden" || n.hasAttribute("hidden")) return false;
      }
      return true;
    });
  for (const [path, width] of [["/collections/oasis-natural", 390], ["/search?q=bikini", 390], ["/collections/oasis-natural", 1280], ["/search?q=bikini", 1280]]) {
    const win = await load(path, { width });
    const hs = visibleHeadings(win);
    const seq = hs.map((h) => Number(h.tagName[1]));
    let prev = 0;
    for (const l of seq) {
      assert(!(prev && l > prev + 1), `${path} a ${width}px: salto h${prev} -> h${l} (${seq.slice(0, 8).join(",")})`);
      prev = l;
    }
    const h2 = hs.find((h) => h.tagName === "H2" && /Productos/.test(h.textContent));
    assert(h2, `${path} a ${width}px: falta el h2 "Productos"`);
    const r = h2.getBoundingClientRect();
    assert(r.width <= 1 && r.height <= 1, `${path}: el h2 debe estar oculto a la vista (visually-hidden): ${r.width}x${r.height}`);
  }
});

await test("K Movimiento 03K", "A11Y-13: con movimiento reducido los 3 videos decorativos (hero, tarjeta de categoría, banner de colección) se pausan y pierden autoplay; al apagarlo se reanudan; es idempotente; el video de la ficha no se toca", async () => {
  const probe = async (path, sel) => {
    const win = await load(path, { width: 1280 });
    const v = $(win, sel);
    assert(v, `${path}: no hay ${sel}`);
    assert(v.hasAttribute("autoplay") && v.hasAttribute("muted") && v.hasAttribute("loop"), `${path}: el video debe traer autoplay, muted y loop`);
    let paused = 0;
    let played = 0;
    v.pause = () => { paused++; };
    v.play = () => { played++; return Promise.resolve(); };
    assert(typeof win.Radaelli?.applyReducedMotion === "function", "falta window.Radaelli.applyReducedMotion");
    win.Radaelli.applyReducedMotion(true);
    win.Radaelli.applyReducedMotion(true);
    eq([v.hasAttribute("autoplay"), v.dataset.motionPaused, paused], [false, "true", 1], `${path}: reducido (idempotente)`);
    win.Radaelli.applyReducedMotion(false);
    eq([v.hasAttribute("autoplay"), v.dataset.motionPaused === undefined, played], [true, true, 1], `${path}: restaurado`);
    win.Radaelli.applyReducedMotion(false);
    eq(played, 1, `${path}: sin preferencia no se vuelve a llamar play()`);
  };
  await probe("/?hv=1", "video.section-hero__video");
  await probe("/?configured=1&cv=1", "video.section-categories__media-el");
  await probe("/collections/oasis-natural?banner=1&bv=1", "video.collection-banner__media");
  const win = await load("/products/bikini-oasis-natural-arena", { width: 1280 });
  eq($$(win, "main video[autoplay]").length, 0, "la ficha no lleva videos con autoplay");
});

/* ============ Diagnóstico del render ============ */
await test("Render", "Liquid real: 0 errores de render, 0 traducciones faltantes, 0 assets inexistentes", async () => {
  const diag = await (await fetch("/__rc/diag")).json();
  eq([diag.renderErrors, diag.missingTranslations, diag.missingAssets], [[], [], []], "diagnóstico");
});

window.__done = true;
render();
