/**
 * Núcleo PURO de favoritos (sin red ni reloj). Replica las reglas de
 * theme-src/assets/wishlist.js (core.union, tope 100 solo para altas) y el
 * algoritmo del diseño § 7.1.
 *
 * Ids: SIEMPRE numéricos como string en el contrato (wishlist.js descarta lo
 * que no cumpla ^\d+$, W:81). El metafield guarda GIDs
 * (gid://shopify/Product/<id>); la conversión vive acá.
 */

export const LIMITS = Object.freeze({
  /** Tope para altas NUEVAS (W:63, REPORT:284). Una lista existente más larga no se recorta. */
  NEW_ITEMS_CAP: 100,
  /** Máximo de Shopify para list.* (metafield-limits). */
  SHOPIFY_LIST_MAX: 128,
  /** Máximo de operaciones por request (diseño § 4, propio). */
  MAX_OPS: 256,
  /** Body máximo de E1/E2 (diseño § 4). */
  MAX_BODY_BYTES: 32 * 1024,
  MAX_HANDLE_LENGTH: 255,
});

const PRODUCT_ID_RE = /^[1-9][0-9]{0,19}$/;
const PRODUCT_GID_RE = /^gid:\/\/shopify\/Product\/([1-9][0-9]{0,19})$/;
const REQUEST_KEYS = new Set(["v", "add", "remove"]);
const ADD_ITEM_KEYS = new Set(["id", "handle"]);

/* ---------------- ids ---------------- */

/**
 * Id numérico del contrato: entero positivo como string ("123") o número
 * seguro (123). Sin ceros a la izquierda. Devuelve el string o null.
 */
export function parseRequestId(value) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  }
  if (typeof value === "string" && PRODUCT_ID_RE.test(value)) return value;
  return null;
}

export function productIdToGid(id) {
  const parsed = parseRequestId(id);
  if (parsed === null) throw new TypeError("invalid product id");
  return `gid://shopify/Product/${parsed}`;
}

/** GID de producto -> id numérico (string) o null. */
export function gidToProductId(gid) {
  if (typeof gid !== "string") return null;
  const match = PRODUCT_GID_RE.exec(gid);
  return match ? match[1] : null;
}

/** Acepta id numérico o GID de producto y devuelve el id numérico (string) o null. */
export function toProductId(value) {
  return parseRequestId(value) ?? gidToProductId(value);
}

/**
 * Valor del metafield list.product_reference (jsonValue = array de GIDs, o
 * `value` como string JSON) -> ids numéricos en orden, sin duplicados ni
 * entradas inválidas.
 */
export function parseMetafieldList(jsonValue) {
  let data = jsonValue;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];
  const seen = new Set();
  const ids = [];
  for (const entry of data) {
    const id = gidToProductId(entry);
    if (id !== null && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/** ids numéricos -> string JSON de GIDs para metafieldsSet. */
export function serializeMetafieldList(ids) {
  return JSON.stringify(ids.map((id) => productIdToGid(id)));
}

/* ---------------- validación del request (schema del diseño § 4 E1) ---------------- */

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function invalid(error) {
  return { ok: false, error };
}

function dedupe(ids) {
  return [...new Set(ids)];
}

/**
 * Validador escrito a mano, estricto (additionalProperties: false en todos
 * los niveles). No usa librerías.
 * @returns {{ok: true, value: {add: string[], remove: string[]}}
 *         | {ok: false, error: "invalid_body"|"invalid_id"|"too_many_ops"|"overlap"}}
 */
export function validateOpsRequest(body) {
  if (!isPlainObject(body)) return invalid("invalid_body");
  for (const key of Object.keys(body)) {
    if (!REQUEST_KEYS.has(key)) return invalid("invalid_body");
  }
  if (Object.hasOwn(body, "v") && body.v !== 1) return invalid("invalid_body");

  const add = Object.hasOwn(body, "add") ? body.add : [];
  const remove = Object.hasOwn(body, "remove") ? body.remove : [];
  if (!Array.isArray(add) || !Array.isArray(remove)) return invalid("invalid_body");
  if (add.length > LIMITS.MAX_OPS || remove.length > LIMITS.MAX_OPS) return invalid("too_many_ops");

  const addIds = [];
  for (const item of add) {
    if (!isPlainObject(item)) return invalid("invalid_body");
    for (const key of Object.keys(item)) {
      if (!ADD_ITEM_KEYS.has(key)) return invalid("invalid_body");
    }
    const id = parseRequestId(item.id);
    if (id === null) return invalid("invalid_id");
    if (Object.hasOwn(item, "handle")) {
      // El servidor IGNORA el handle (devuelve el canónico); solo se valida la forma.
      if (typeof item.handle !== "string" || item.handle.length > LIMITS.MAX_HANDLE_LENGTH) return invalid("invalid_body");
    }
    addIds.push(id);
  }

  const removeIds = [];
  for (const raw of remove) {
    const id = parseRequestId(raw);
    if (id === null) return invalid("invalid_id");
    removeIds.push(id);
  }

  const removeSet = new Set(removeIds);
  if (addIds.some((id) => removeSet.has(id))) return invalid("overlap");

  return { ok: true, value: { add: dedupe(addIds), remove: dedupe(removeIds) } };
}

/* ---------------- unión (diseño § 7.1, pasos 3 a 6) ---------------- */

/**
 * @param {string[]} current ids del metafield, en orden
 * @param {Map<string, string>} existing id -> handle, SOLO productos que existen
 * @param {{add?: string[], remove?: string[]}} ops ids ya validados
 * @returns {{next: string[], rejected: string[], notFound: string[], changed: boolean}}
 */
export function applyWishlistOps(current, existing, ops) {
  const add = ops.add ?? [];
  const removeSet = new Set(ops.remove ?? []);
  const notFound = [];
  const notFoundSet = new Set();
  const markNotFound = (id) => {
    if (!notFoundSet.has(id)) {
      notFoundSet.add(id);
      notFound.push(id);
    }
  };

  // Paso 3: la cuenta primero, en su orden. Lo borrado en Shopify se poda y
  // se informa. Una lista heredada de más de 100 NO se recorta.
  const kept = [];
  const present = new Set();
  for (const id of current) {
    if (!existing.has(id)) {
      markNotFound(id);
      continue;
    }
    if (removeSet.has(id) || present.has(id)) continue;
    kept.push(id);
    present.add(id);
  }

  // Paso 4: altas en el orden recibido (invitada en su orden + cola). El
  // tope se aplica SOLO a las altas nuevas.
  const appended = [];
  const rejected = [];
  const seenAdd = new Set();
  for (const id of add) {
    if (seenAdd.has(id)) continue;
    seenAdd.add(id);
    if (!existing.has(id)) {
      markNotFound(id);
      continue;
    }
    if (present.has(id)) continue; // idempotente
    if (kept.length + appended.length >= LIMITS.NEW_ITEMS_CAP) {
      rejected.push(id);
      continue;
    }
    appended.push(id);
    present.add(id);
  }

  const next = [...kept, ...appended];
  // Paso 5: invariante del límite de Shopify.
  if (next.length > LIMITS.SHOPIFY_LIST_MAX) throw new Error("invariant: list above Shopify maximum");

  // Paso 6: sin cambios = sin escritura.
  const changed = next.length !== current.length || next.some((id, index) => id !== current[index]);
  return { next, rejected, notFound, changed };
}

/** Respuesta `items` del contrato: [{ id, handle }] en el orden canónico. */
export function toResponseItems(ids, existing) {
  return ids.map((id) => ({ id, handle: existing.get(id) ?? "" }));
}
