/**
 * Favoritos (Fases 02K + 02L). Vanilla JS, sin dependencias. Ver
 * theme/wishlist-report.md y theme/customer-accounts-report.md.
 *
 * DOS MODOS, UNA SOLA UI (corazones, contador del header, página):
 *
 * 1. INVITADA (02K, sin cambios de comportamiento): favoritos por navegador
 *    en localStorage (`localAdapter`, clave radaelli:wishlist v1, solo
 *    { id, handle } por producto).
 *
 * 2. CUENTA (02L, decisión de Daniela: favoritos sincronizados entre
 *    dispositivos para la clienta con sesión, New Customer Accounts). La
 *    lista vive en Shopify, en el metafield del cliente custom.wishlist
 *    (list.product_reference, propiedad del comercio). Un theme no puede
 *    escribir metafields: las escrituras las hace una app de Radaelli (app
 *    proxy con la identidad firmada por Shopify). Este archivo NO trae ese
 *    transporte ni simula nada: el modo cuenta se activa SOLO si se cumplen
 *    las dos condiciones:
 *      a) Liquid imprimió #wishlist-account-state (clienta con sesión +
 *         setting "wishlist_account_sync", apagado por defecto), y
 *      b) la app registró un transporte con
 *         window.Radaelli.wishlist.connectAccount(transport).
 *    Sin eso (hoy, offline), todo sigue en modo invitada.
 *
 *    Contrato del transporte (lo implementa la app, no el theme):
 *      transport.apply({ add: [{ id, handle }], remove: [id] })
 *        -> Promise<{ items: [{ id, handle }], rejected: [id], notFound: [id] }>
 *        items = lista canónica de la cuenta después de aplicar; add/remove
 *        vacíos = solo refrescar. Rechaza con error.status: 401 (Shopify no
 *        confirmó la sesión), 409 (conflicto tras reintentos), 0/5xx
 *        (transitorio).
 *      transport.accountPageUrl  (opcional) página "Mis favoritos" de la cuenta.
 *
 *    Reglas (ver customer-accounts-report.md § merge):
 *    - La cuenta es la fuente de verdad: vista = base del servidor ⊕
 *      intenciones pendientes (nunca se copia la lista remota al navegador).
 *    - Intenciones sin confirmar en una cola persistente separada por
 *      clienta (hash que calcula Liquid), la última por producto gana.
 *    - Unión al ingresar: primero la cuenta, después lo de invitada, sin
 *      duplicados. Lo local se borra SOLO después de un OK y SOLO lo que el
 *      servidor confirmó (o dijo que ya no existe). Si falla, no se pierde
 *      nada y se reintenta (la unión es idempotente).
 *    - Fallos transitorios: reintento con espera, sin revertir. Rechazos
 *      definitivos (tope de la lista): se revierte solo ese producto y se
 *      avisa.
 *    - La cola vence a los 30 días sin actividad; si se descarta algo, la
 *      página de favoritos lo avisa (nunca en silencio).
 *    - Cerrar sesión: la primera página sin sesión avisa a las otras
 *      pestañas (BroadcastChannel) y dejan de mostrar la lista de la cuenta.
 *
 * Eventos (en document, sin IDs de GA/Meta ni datos personales):
 *   wishlist:updated      { count, ids, source, persistent, mode }
 *   wishlist:add          { productId, handle }
 *   wishlist:remove       { productId, handle, source }
 *   wishlist:view         { count }
 *   wishlist:sync-status  { state: "synced" | "pending" | "retrying" | "auth-failed" | "rejected" | "expired" }
 */

const STORAGE_KEY = "radaelli:wishlist";
const OUTBOX_PREFIX = "radaelli:wishlist:outbox:";
const CHANNEL_NAME = "radaelli:wishlist";
const SCHEMA_VERSION = 1;
const MAX_ITEMS = 100;
const FETCH_CONCURRENCY = 4;
const FLUSH_DEBOUNCE_MS = 400;
const RETRY_DELAYS_MS = [2000, 8000, 30000];
const OUTBOX_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

/* ============================================================
   NÚCLEO PURO -- sin DOM ni red; es lo que prueban los tests
   ============================================================ */
function normalizeItems(rawItems) {
  const seen = new Set();
  const items = [];
  for (const raw of Array.isArray(rawItems) ? rawItems : []) {
    const id = raw && (typeof raw.id === "string" || typeof raw.id === "number") ? String(raw.id) : "";
    if (!/^\d+$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    items.push({ id, handle: typeof raw.handle === "string" ? raw.handle : "" });
  }
  return items;
}

const core = {
  normalizeItems,

  /** Lista de invitada (02K): normalizada y con tope (quedan las últimas). */
  sanitizeGuest(rawItems) {
    return normalizeItems(rawItems).slice(-MAX_ITEMS);
  },

  /**
   * Unión para el ingreso: primero la cuenta (en su orden), después lo de
   * invitada que no esté (en su orden). Idempotente: unir dos veces da lo
   * mismo. {A,B,C} + cuenta {B,D} -> [B, D, A, C].
   */
  union(accountItems, guestItems) {
    const result = normalizeItems(accountItems);
    const seen = new Set(result.map((item) => item.id));
    for (const item of normalizeItems(guestItems)) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  },

  /** Vista = base del servidor con las intenciones pendientes aplicadas (sin recortar la base). */
  applyOps(baseItems, ops) {
    const view = normalizeItems(baseItems).filter((item) => ops[item.id]?.op !== "remove");
    const present = new Set(view.map((item) => item.id));
    for (const [id, entry] of Object.entries(ops)) {
      if (entry.op === "add" && !present.has(id)) {
        present.add(id);
        view.push({ id, handle: entry.handle ?? "" });
      }
    }
    return view;
  },

  /**
   * Registra una intención; la última por producto gana. Si la intención ya
   * coincide con la base (agregar algo que la cuenta ya tiene, quitar algo
   * que no tiene), no queda nada pendiente.
   */
  setIntent(ops, baseItems, id, op, handle) {
    const next = { ...ops };
    const inBase = normalizeItems(baseItems).some((item) => item.id === id);
    if ((op === "add" && inBase) || (op === "remove" && !inBase)) {
      delete next[id];
    } else {
      next[id] = { op, handle: handle ?? "" };
    }
    return next;
  },

  /** Quita de la lista local solo lo que el servidor confirmó o dijo que ya no existe. */
  pruneConfirmed(guestItems, confirmedIds) {
    return normalizeItems(guestItems).filter((item) => !confirmedIds.has(item.id));
  },
};

/* ============================================================
   ADAPTADOR DE INVITADA (localStorage) -- 02K
   ============================================================ */
const localAdapter = {
  storage: null,

  init() {
    // localStorage puede no existir o lanzar (modo privado estricto,
    // cookies bloqueadas): se prueba una sola vez.
    try {
      const storage = window.localStorage;
      const probe = `${STORAGE_KEY}:probe`;
      storage.setItem(probe, "1");
      storage.removeItem(probe);
      this.storage = storage;
    } catch {
      this.storage = null;
    }
    return Boolean(this.storage);
  },

  load() {
    if (!this.storage) return null;
    let raw = null;
    try {
      raw = this.storage.getItem(STORAGE_KEY);
    } catch {
      return [];
    }
    if (!raw) return [];
    try {
      const data = JSON.parse(raw);
      // Versión desconocida: acá se migraría. Hoy solo existe la v1.
      if (!data || data.v !== SCHEMA_VERSION) throw new Error("unsupported version");
      return core.sanitizeGuest(data.items);
    } catch {
      // JSON corrupto o formato ajeno: se descarta sin romper la página.
      try {
        this.storage.removeItem(STORAGE_KEY);
      } catch {
        /* nada más que hacer */
      }
      return [];
    }
  },

  save(items) {
    if (!this.storage) return false;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, items }));
      return true;
    } catch {
      // Cuota llena o almacenamiento bloqueado a mitad de sesión.
      return false;
    }
  },

  /** Otra pestaña cambió los favoritos (evento nativo "storage"). */
  subscribe(callback) {
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY || event.key === null) callback();
    });
  },
};

/* ============================================================
   ESTADO DE INVITADA -- 02K
   ============================================================ */
const store = {
  adapter: localAdapter,
  items: [],
  persistent: false,

  init() {
    this.persistent = this.adapter.init();
    this.items = this.adapter.load() ?? [];
  },

  reload() {
    const loaded = this.adapter.load();
    if (loaded) this.items = loaded;
  },

  commit() {
    // Si no se puede guardar, sigue funcionando en memoria (se pierde al
    // cerrar la pestaña) y la página de favoritos lo avisa.
    if (!this.adapter.save(this.items)) this.persistent = false;
  },

  has(id) {
    return this.items.some((item) => item.id === id);
  },

  find(id) {
    return this.items.find((item) => item.id === id);
  },

  add(id, handle) {
    if (this.has(id)) return "exists";
    if (this.items.length >= MAX_ITEMS) return "full";
    this.items = [...this.items, { id, handle: handle ?? "" }];
    this.commit();
    return "added";
  },

  remove(id) {
    const next = this.items.filter((item) => item.id !== id);
    if (next.length === this.items.length) return false;
    this.items = next;
    this.commit();
    return true;
  },

  updateHandle(id, handle) {
    const item = this.find(id);
    if (!item || item.handle === handle) return;
    this.items = this.items.map((entry) => (entry.id === id ? { ...entry, handle } : entry));
    this.commit();
  },
};

/* ============================================================
   MODO CUENTA -- 02L (inactivo hasta que la app registre transporte)
   ============================================================ */
/**
 * Lo que imprimió Liquid (solo con el setting encendido):
 *   { kind: "account", owner, items }  clienta con sesión
 *   { kind: "signed-out" }             sin sesión (para avisar a otras pestañas)
 *   null                               setting apagado o bloque inválido
 */
function readAccountState() {
  const element = document.getElementById("wishlist-account-state");
  if (!element) return null;
  try {
    const data = JSON.parse(element.textContent);
    if (!data || data.v !== SCHEMA_VERSION) return null;
    if (data.signedOut === true) return { kind: "signed-out" };
    if (typeof data.owner !== "string" || !/^[a-f0-9]{64}$/.test(data.owner)) return null;
    return { kind: "account", owner: data.owner, items: normalizeItems(data.items) };
  } catch {
    return null;
  }
}

function idList(values) {
  return normalizeItems((Array.isArray(values) ? values : []).map((id) => ({ id }))).map((item) => item.id);
}

/** Favoritos de invitada guardados en este navegador (o en memoria si no hay almacenamiento). */
function readGuest() {
  return localAdapter.load() ?? store.items;
}

function writeGuest(items) {
  store.items = items;
  store.commit();
}

function withLock(task) {
  // Web Locks: una sola pestaña sincroniza a la vez (evita uniones dobles
  // al ingresar con varias pestañas). Sin soporte, el resultado sigue siendo
  // correcto porque la unión es idempotente.
  if (navigator.locks?.request) return navigator.locks.request("radaelli:wishlist:sync", task);
  return task();
}

const account = {
  active: false,
  owner: "",
  base: [],
  ops: {},
  rejected: [],
  view: [],
  transport: null,
  flushTimer: null,
  retryTimer: null,
  attempt: 0,
  inFlight: false,
  again: false,
  channel: null,
  outboxExpired: false,
  lastStatus: null,

  outboxKey() {
    return `${OUTBOX_PREFIX}${this.owner}`;
  },

  /** Cola de intenciones sin confirmar de ESTA clienta (clave separada por hash). */
  loadOutbox() {
    // Sin almacenamiento la cola vive solo en memoria: no se pisa.
    if (!localAdapter.storage) return;
    this.ops = {};
    this.rejected = [];
    try {
      const data = JSON.parse(localAdapter.storage.getItem(this.outboxKey()) ?? "null");
      if (!data || data.v !== SCHEMA_VERSION || data.owner !== this.owner) return;
      if (typeof data.updatedAt !== "number" || Date.now() - data.updatedAt > OUTBOX_TTL_MS) {
        // Vencida: se descarta, pero si tenía cambios sin guardar se avisa.
        localAdapter.storage.removeItem(this.outboxKey());
        if (Object.keys(data.ops ?? {}).length > 0) this.outboxExpired = true;
        return;
      }
      for (const [id, entry] of Object.entries(data.ops ?? {})) {
        if (/^\d+$/.test(id) && (entry?.op === "add" || entry?.op === "remove")) {
          this.ops[id] = { op: entry.op, handle: typeof entry.handle === "string" ? entry.handle : "" };
        }
      }
      this.rejected = idList(data.rejected);
    } catch {
      /* cola ilegible: se ignora, la cuenta sigue siendo la verdad */
    }
  },

  saveOutbox() {
    if (!localAdapter.storage) return;
    try {
      if (Object.keys(this.ops).length === 0 && this.rejected.length === 0) {
        localAdapter.storage.removeItem(this.outboxKey());
      } else {
        localAdapter.storage.setItem(
          this.outboxKey(),
          JSON.stringify({ v: SCHEMA_VERSION, owner: this.owner, ops: this.ops, rejected: this.rejected, updatedAt: Date.now() }),
        );
      }
    } catch {
      /* cuota llena: la cola sigue en memoria durante la pestaña */
    }
  },

  /** Favoritos de invitada que todavía hay que subir (sin los que la cuenta ya rechazó). */
  pendingGuest() {
    const rejected = new Set(this.rejected);
    return readGuest().filter((item) => !rejected.has(item.id));
  },

  /**
   * Base efectiva = cuenta ∪ invitada pendiente: mientras la unión no se
   * confirma, lo de invitada se sigue viendo guardado (nada "desaparece").
   */
  effectiveBase() {
    return core.union(this.base, this.pendingGuest());
  },

  recompute() {
    this.view = core.applyOps(this.effectiveBase(), this.ops);
  },

  activate(bootstrap, transport) {
    if (this.active) return;
    this.active = true;
    this.owner = bootstrap.owner;
    this.base = bootstrap.items;
    this.transport = transport;
    this.loadOutbox();
    this.recompute();

    // Otras pestañas: la cola vive en localStorage (evento "storage") y la
    // base confirmada se avisa por BroadcastChannel. La lista de la cuenta
    // NUNCA se guarda en el navegador.
    window.addEventListener("storage", (event) => {
      if (!this.active) return;
      if (event.key === this.outboxKey() || event.key === STORAGE_KEY || event.key === null) {
        this.loadOutbox();
        this.recompute();
        notify("storage");
      }
    });
    if ("BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.addEventListener("message", (event) => {
        if (event.data?.type === "signed-out") {
          this.deactivate();
        } else if (event.data?.type === "base" && event.data.owner === this.owner) {
          this.base = normalizeItems(event.data.items);
          this.recompute();
          notify("storage");
        }
      });
    }
    // Volver con "atrás" (bfcache): se revalida contra la cuenta.
    window.addEventListener("pageshow", (event) => {
      if (event.persisted && this.active) this.flush({ refresh: true });
    });

    notify("account");
    if (this.outboxExpired) syncStatus("expired");
    this.flush({ refresh: false });
  },

  /**
   * Otra pestaña cargó una página sin sesión (la clienta salió): esta deja
   * de mostrar la lista de la cuenta y vuelve a invitada, sin recargar. Lo
   * pendiente queda en la cola de ESA clienta para su próximo ingreso.
   */
  deactivate() {
    if (!this.active) return;
    this.active = false;
    this.transport = null;
    this.base = [];
    this.ops = {};
    this.rejected = [];
    this.view = [];
    window.clearTimeout(this.flushTimer);
    window.clearTimeout(this.retryTimer);
    this.channel?.close();
    this.channel = null;
    notify("signed-out");
  },

  toggle(id, handle) {
    const saved = this.view.some((item) => item.id === id);
    // Tope solo para altas nuevas; una lista existente más larga no se recorta.
    if (!saved && this.view.length >= MAX_ITEMS) return "full";
    this.ops = core.setIntent(this.ops, this.effectiveBase(), id, saved ? "remove" : "add", handle);
    this.saveOutbox();
    this.recompute();
    this.scheduleFlush();
    return saved ? "removed" : "added";
  },

  scheduleFlush() {
    window.clearTimeout(this.flushTimer);
    this.flushTimer = window.setTimeout(() => this.flush({ refresh: false }), FLUSH_DEBOUNCE_MS);
  },

  /** Envía la unión de invitada + intenciones pendientes; con refresh también si no hay nada. */
  async flush({ refresh }) {
    if (!this.transport) return;
    if (this.inFlight) {
      this.again = true;
      return;
    }
    this.inFlight = true;
    window.clearTimeout(this.retryTimer);
    try {
      await withLock(async () => {
        // Se relee dentro del lock: otra pestaña pudo sincronizar antes.
        this.loadOutbox();
        const guest = this.pendingGuest();
        const sentOps = { ...this.ops };
        const remove = Object.keys(sentOps).filter((id) => sentOps[id].op === "remove");
        const removeSet = new Set(remove);
        const addMap = new Map();
        for (const item of guest) if (!removeSet.has(item.id)) addMap.set(item.id, item);
        for (const [id, entry] of Object.entries(sentOps)) {
          if (entry.op === "add") addMap.set(id, { id, handle: entry.handle });
        }
        const add = [...addMap.values()];
        if (!refresh && add.length === 0 && remove.length === 0) return;

        syncStatus("pending");
        const result = await this.transport.apply({ add, remove });
        // La clienta salió mientras viajaba la request: no se toca nada (la
        // cola queda para su próximo ingreso; reenviar es idempotente).
        if (!this.active) return;
        const items = normalizeItems(result?.items);
        const rejected = new Set(idList(result?.rejected));
        const notFound = new Set(idList(result?.notFound));
        const inAccount = new Set(items.map((item) => item.id));

        // Solo se confirman las intenciones que no cambiaron mientras viajaba la request.
        this.loadOutbox();
        for (const [id, entry] of Object.entries(sentOps)) {
          const current = this.ops[id];
          if (!current || current.op !== entry.op) continue;
          const settled = entry.op === "remove" ? !inAccount.has(id) : inAccount.has(id) || rejected.has(id) || notFound.has(id);
          if (settled) delete this.ops[id];
        }

        // Invitada -> cuenta: de lo local se borra SOLO lo que el servidor
        // confirmó, lo que ya no existe o lo que la clienta quitó con sesión.
        const prune = new Set([...inAccount, ...notFound, ...remove.filter((id) => !inAccount.has(id))]);
        const localGuest = readGuest();
        const pruned = core.pruneConfirmed(localGuest, prune);
        if (pruned.length !== localGuest.length) writeGuest(pruned);

        // Tope de la cuenta: lo rechazado queda en este navegador y no se
        // reenvía en cada página.
        this.rejected = [...new Set([...this.rejected, ...rejected])].filter((id) => !inAccount.has(id));
        this.base = items;
        // Primero la base nueva a las otras pestañas y después se vacía la
        // cola: así no ven un instante sin lo que se acaba de confirmar.
        this.channel?.postMessage({ type: "base", owner: this.owner, items: this.base });
        this.saveOutbox();
        this.recompute();
        this.attempt = 0;
        notify("sync");
        if (rejected.size > 0) {
          announce(document.documentElement.dataset.wishlistFullMessage);
          syncStatus("rejected");
        } else {
          syncStatus("synced");
        }
      });
    } catch (error) {
      if (!this.active) {
        /* sesión cerrada en otra pestaña: sin reintentos */
      } else if (error?.status === 401) {
        // Shopify no confirmó la sesión: no se reintenta en bucle ni se
        // recarga. Nada se pierde (cola e invitada intactas) y la página de
        // favoritos ofrece guardar desde la cuenta.
        syncStatus("auth-failed");
      } else if (this.attempt < RETRY_DELAYS_MS.length) {
        // Transitorio (red, 5xx, 409 tras reintentos del servidor): se
        // reintenta con espera, SIN revertir lo que la clienta ve.
        syncStatus("retrying");
        this.retryTimer = window.setTimeout(() => this.flush({ refresh: false }), RETRY_DELAYS_MS[this.attempt]);
        this.attempt += 1;
      } else {
        syncStatus("pending");
      }
    } finally {
      this.inFlight = false;
      if (this.again) {
        this.again = false;
        this.scheduleFlush();
      }
    }
  },
};

function syncStatus(state) {
  const detail = { state, accountPageUrl: account.transport?.accountPageUrl ?? "" };
  // La página de favoritos puede conectarse después: lee el último estado.
  account.lastStatus = detail;
  emit("wishlist:sync-status", detail);
}

/* ============================================================
   FACHADA -- lo que usa la UI, sin saber en qué modo está
   ============================================================ */
function activeItems() {
  return account.active ? account.view : store.items;
}

function isSaved(id) {
  return activeItems().some((item) => item.id === id);
}

/* ============================================================
   UI GLOBAL -- corazones (tarjetas/ficha) y contadores del header
   ============================================================ */
function syncTriggers(root = document) {
  root.querySelectorAll("[data-wishlist-trigger]").forEach((trigger) => {
    const saved = isSaved(trigger.dataset.productId);
    trigger.setAttribute("aria-pressed", String(saved));
    const label = trigger.querySelector("[data-wishlist-label]");
    const text = saved ? trigger.dataset.labelRemove : trigger.dataset.labelAdd;
    if (label && text && label.textContent !== text) label.textContent = text;
    // Nacen ocultos: se muestran recién con el estado correcto (sin flash).
    trigger.hidden = false;
  });

  const count = activeItems().length;
  document.querySelectorAll("[data-wishlist-count]").forEach((element) => {
    element.textContent = String(count);
  });
  document.querySelectorAll("[data-wishlist-count-bubble]").forEach((element) => {
    element.hidden = count === 0;
  });
}

function notify(source) {
  syncTriggers();
  const items = activeItems();
  emit("wishlist:updated", {
    count: items.length,
    ids: items.map((item) => item.id),
    source,
    persistent: account.active ? true : store.persistent,
    mode: account.active ? "account" : "guest",
  });
}

let liveRegion = null;
function announce(message) {
  if (!message) return;
  if (!liveRegion) {
    liveRegion = document.createElement("p");
    liveRegion.className = "visually-hidden";
    liveRegion.setAttribute("role", "status");
    document.body.append(liveRegion);
  }
  liveRegion.textContent = "";
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 50);
}

function pop(trigger) {
  trigger.classList.remove("is-popping");
  // Reinicia la animación aunque se toque dos veces seguidas.
  void trigger.offsetWidth;
  trigger.classList.add("is-popping");
  trigger.addEventListener("animationend", () => trigger.classList.remove("is-popping"), { once: true });
}

/** Agrega o quita un favorito en el modo activo. Devuelve "added" | "removed" | "full" | "". */
function toggleFavorite(id, handle, source) {
  if (!id) return "";
  let result;
  if (account.active) {
    result = account.toggle(id, handle);
  } else if (store.has(id)) {
    store.remove(id);
    result = "removed";
  } else {
    result = store.add(id, handle) === "full" ? "full" : "added";
  }

  if (result === "full") {
    announce(document.documentElement.dataset.wishlistFullMessage);
    return result;
  }
  if (result === "added") emit("wishlist:add", { productId: id, handle });
  if (result === "removed") emit("wishlist:remove", { productId: id, handle, source });
  notify(source === "page" ? "page" : "toggle");
  return result;
}

function toggle(trigger) {
  const result = toggleFavorite(trigger.dataset.productId, trigger.dataset.productHandle ?? "", "trigger");
  if (result === "added" || result === "removed") pop(trigger);
}

// Un solo listener para todos los corazones del sitio (delegación).
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-wishlist-trigger]");
  if (!trigger) return;
  event.preventDefault();
  toggle(trigger);
});

/* ============================================================
   PÁGINA DE FAVORITOS -- <wishlist-page>
   ============================================================ */
class WishlistPage extends window.Radaelli.RadaelliElement {
  onConnect() {
    this.list = this.querySelector("[data-wishlist-list]");
    this.loading = this.querySelector("[data-wishlist-loading]");
    this.empty = this.querySelector("[data-wishlist-empty]");
    this.countElement = this.querySelector("[data-wishlist-page-count]");
    this.live = this.querySelector("[data-wishlist-live]");
    this.heading = this.querySelector("[data-wishlist-heading]");
    this.warning = this.querySelector("[data-wishlist-storage-warning]");
    this.syncNotice = this.querySelector("[data-wishlist-sync-notice]");
    this.unavailableTemplate = this.querySelector("[data-wishlist-unavailable-template]");
    this.messages = this.querySelector("[data-wishlist-messages]");
    this.rootUrl = (this.dataset.rootUrl || "/").replace(/\/$/, "");
    this.rendered = new Map();
    this.queue = Promise.resolve();

    this.addEventListener("click", (event) => this.onClick(event));
    this.onWishlistUpdated = (event) => {
      if (event.detail?.source !== "page") this.sync();
    };
    this.onSyncStatus = (event) => this.showSyncStatus(event.detail);
    document.addEventListener("wishlist:updated", this.onWishlistUpdated);
    document.addEventListener("wishlist:sync-status", this.onSyncStatus);

    if (!account.active && !store.persistent && this.warning) this.warning.hidden = false;
    if (account.active && account.outboxExpired) this.showSyncStatus({ state: "expired" });
    if (account.active && account.lastStatus) this.showSyncStatus(account.lastStatus);
    this.sync().then(() => emit("wishlist:view", { count: activeItems().length }));
  }

  onDisconnect() {
    document.removeEventListener("wishlist:updated", this.onWishlistUpdated);
    document.removeEventListener("wishlist:sync-status", this.onSyncStatus);
  }

  /**
   * Solo avisa lo que la clienta necesita saber: sesión no confirmada, tope
   * de la cuenta o cambios vencidos. El de vencidos no se oculta solo.
   */
  showSyncStatus(detail) {
    if (!this.syncNotice || !detail) return;
    const key = { "auth-failed": "auth", rejected: "full", expired: "expired" }[detail.state] ?? "";
    if (!key) {
      if (this.syncKey !== "expired") {
        this.syncNotice.hidden = true;
        this.syncKey = "";
      }
      return;
    }
    this.syncKey = key;
    const text = this.messages?.content.querySelector(`[data-message="sync-${key}"]`)?.textContent ?? "";
    const textSlot = this.syncNotice.querySelector("[data-wishlist-sync-text]");
    const link = this.syncNotice.querySelector("[data-wishlist-sync-link]");
    if (textSlot) textSlot.textContent = text;
    if (link) {
      link.hidden = !(key === "auth" && detail.accountPageUrl);
      if (!link.hidden) link.href = detail.accountPageUrl;
    }
    this.syncNotice.hidden = false;
  }

  /** Serializado: una sincronización a la vez (p. ej. otra pestaña cambia algo mientras carga). */
  sync() {
    this.queue = this.queue.then(() => this.render()).catch(() => {});
    return this.queue;
  }

  async render() {
    const items = activeItems();
    const present = new Set(items.map((item) => item.id));
    // Quita lo que ya no está guardado.
    for (const [id, row] of this.rendered) {
      if (!present.has(id)) {
        row.remove();
        this.rendered.delete(id);
      }
    }

    const missing = items.filter((item) => !this.rendered.has(item.id));
    if (missing.length > 0) {
      if (this.rendered.size === 0 && this.loading) this.loading.hidden = false;
      this.list.setAttribute("aria-busy", "true");
      await this.fetchAll(missing);
      this.list.removeAttribute("aria-busy");
    }

    // Mismo orden que la lista (el real muestra en orden de alta).
    activeItems().forEach((item) => {
      const row = this.rendered.get(item.id);
      if (row) this.list.append(row);
    });

    if (this.loading) this.loading.hidden = true;
    this.updateCount();
  }

  async fetchAll(items) {
    const pending = [...items];
    // Hasta 4 requests a la vez: no satura la red con listas largas.
    const workers = Array.from({ length: Math.min(FETCH_CONCURRENCY, pending.length) }, async () => {
      while (pending.length > 0) {
        const item = pending.shift();
        const row = await this.fetchRow(item);
        if (isSaved(item.id)) this.rendered.set(item.id, row);
      }
    });
    await Promise.all(workers);
  }

  async fetchRow(item) {
    if (!item.handle) return this.unavailableRow(item, "unavailable");
    const url = `${this.rootUrl}/products/${encodeURIComponent(item.handle)}?section_id=wishlist-item`;
    try {
      const response = await fetch(url, { headers: { Accept: "text/html" } });
      if (response.status === 404) return this.unavailableRow(item, "unavailable");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const row = new DOMParser().parseFromString(html, "text/html").querySelector("[data-wishlist-item]");
      // Si el handle ahora es de OTRO producto, no se muestra algo que la
      // clienta no guardó.
      if (!row || row.dataset.productId !== item.id) return this.unavailableRow(item, "unavailable");
      // Shopify redirige un handle cambiado al nuevo: se actualiza lo guardado
      // (solo en modo invitada; en modo cuenta el handle lo da Shopify).
      if (!account.active && row.dataset.productHandle && row.dataset.productHandle !== item.handle) {
        store.updateHandle(item.id, row.dataset.productHandle);
      }
      return document.adoptNode(row);
    } catch {
      return this.unavailableRow(item, "error");
    }
  }

  unavailableRow(item, kind) {
    const row = this.unavailableTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.productId = item.id;
    const message = this.messages?.content.querySelector(`[data-message="${kind}"]`)?.textContent ?? "";
    const slot = row.querySelector("[data-wishlist-unavailable-message]");
    if (slot) slot.textContent = message;
    return row;
  }

  onClick(event) {
    const button = event.target.closest("[data-wishlist-remove]");
    if (!button) return;
    const row = button.closest("[data-wishlist-item]");
    const id = row?.dataset.productId;
    if (!row || !id) return;

    const handle = activeItems().find((item) => item.id === id)?.handle ?? "";
    const next = row.nextElementSibling ?? row.previousElementSibling;
    row.remove();
    this.rendered.delete(id);
    toggleFavorite(id, handle, "page");
    this.updateCount();
    this.announce(this.dataset.labelRemoved);
    // El foco no se pierde: pasa al siguiente favorito o al título.
    (next?.querySelector("[data-wishlist-remove]") ?? this.heading)?.focus();
  }

  updateCount() {
    const count = activeItems().length;
    if (this.countElement) {
      const template = count === 1 ? this.dataset.labelCountOne : this.dataset.labelCountOther;
      this.countElement.textContent = (template ?? "").replace("__COUNT__", String(count));
      this.countElement.hidden = false;
    }
    if (this.empty) this.empty.hidden = count > 0;
    this.list.hidden = count === 0;
  }

  announce(message) {
    if (!this.live || !message) return;
    this.live.textContent = "";
    window.setTimeout(() => {
      this.live.textContent = message;
    }, 50);
  }
}

/* ============================================================
   INICIO
   ============================================================ */
store.init();
store.adapter.subscribe(() => {
  store.reload();
  if (!account.active) notify("storage");
});

const accountState = readAccountState();

// Página sin sesión con el setting encendido: si otra pestaña seguía en
// modo cuenta (la clienta acaba de salir), deja de mostrar su lista.
if (accountState?.kind === "signed-out" && "BroadcastChannel" in window) {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: "signed-out" });
  channel.close();
}

/**
 * Punto de conexión para la app de Radaelli (02M+): su app embed registra
 * el transporte. Sin bootstrap de Liquid (sin sesión o setting apagado) se
 * ignora y todo sigue en modo invitada.
 */
function connectAccount(transport) {
  if (accountState?.kind !== "account" || account.active) return false;
  if (!transport || typeof transport.apply !== "function") return false;
  account.activate(accountState, transport);
  return true;
}

syncTriggers();
emit("wishlist:updated", {
  count: store.items.length,
  ids: store.items.map((item) => item.id),
  source: "init",
  persistent: store.persistent,
  mode: "guest",
});

window.Radaelli.wishlist = {
  has: (id) => isSaved(String(id)),
  items: () => activeItems().map((item) => ({ ...item })),
  sync: syncTriggers,
  connectAccount,
  mode: () => (account.active ? "account" : "guest"),
  core,
};

// Si la app cargó antes que este archivo, dejó su transporte en espera.
if (window.Radaelli.wishlistAccountTransport) connectAccount(window.Radaelli.wishlistAccountTransport);

window.Radaelli.defineElement("wishlist-page", WishlistPage);
