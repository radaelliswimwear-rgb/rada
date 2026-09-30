/**
 * Lógica PURA de "Mis favoritos" (sin runtime de Shopify, sin red): parseo
 * del metafield, modelo de vista por producto, reducer de estado y mapeo de
 * errores. Se prueba en Node (test/extension-model.test.mjs).
 *
 * Nada de precio ni stock se guarda: el modelo se arma en cada carga con lo
 * que devuelve la Storefront API en ese momento.
 */

const PRODUCT_GID_RE = /^gid:\/\/shopify\/Product\/([1-9][0-9]{0,19})$/;
const PRODUCT_ID_RE = /^[1-9][0-9]{0,19}$/;

export function gidToId(gid) {
  const match = typeof gid === "string" ? PRODUCT_GID_RE.exec(gid) : null;
  return match ? match[1] : null;
}

export function idToGid(id) {
  const value = String(id);
  return PRODUCT_ID_RE.test(value) ? `gid://shopify/Product/${value}` : null;
}

/**
 * `value` del metafield custom.wishlist (string JSON con GIDs, en orden de
 * alta) -> GIDs válidos, en orden y sin duplicados. Cualquier otra cosa: [].
 */
export function parseWishlistValue(value) {
  let data = value;
  if (typeof value === "string") {
    try {
      data = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];
  const seen = new Set();
  const gids = [];
  for (const entry of data) {
    if (typeof entry === "string" && PRODUCT_GID_RE.test(entry) && !seen.has(entry)) {
      seen.add(entry);
      gids.push(entry);
    }
  }
  return gids;
}

function httpsUrl(value) {
  return typeof value === "string" && /^https:\/\/[^\s]+$/.test(value) ? value : null;
}

function money(value) {
  if (!value || typeof value !== "object") return null;
  const amount = Number(value.amount);
  if (!Number.isFinite(amount) || typeof value.currencyCode !== "string" || !/^[A-Z]{3}$/.test(value.currencyCode)) return null;
  return { amount, currencyCode: value.currencyCode };
}

/**
 * Estado de un favorito:
 * - "available": se puede comprar y tiene página en la tienda online;
 * - "sold_out":  existe y tiene página, pero no se puede comprar (Agotado);
 * - "unavailable": existe para la Storefront API pero no tiene página en la
 *   tienda online (sin link);
 * - "deleted": la Storefront API no lo devuelve (borrado o no publicado).
 */
export function toFavoriteViewModel(gid, node) {
  const id = gidToId(gid);
  if (!node || typeof node !== "object" || node.id !== gid) {
    return { id, gid, state: "deleted", title: "", url: null, image: null, price: null };
  }
  const title = typeof node.title === "string" ? node.title : "";
  const url = httpsUrl(node.onlineStoreUrl);
  const imageSrc = httpsUrl(node.featuredImage?.url);
  const image = imageSrc
    ? { src: imageSrc, alt: typeof node.featuredImage.altText === "string" && node.featuredImage.altText ? node.featuredImage.altText : title }
    : null;
  const min = money(node.priceRange?.minVariantPrice);
  const max = money(node.priceRange?.maxVariantPrice);
  const price = min ? { ...min, from: Boolean(max && max.amount !== min.amount) } : null;
  let state = "available";
  if (!url) state = "unavailable";
  else if (node.availableForSale !== true) state = "sold_out";
  return { id, gid, state, title, url, image, price };
}

/** Cruza la lista (orden de la cuenta) con los nodos de la Storefront API por id. */
export function buildFavorites(gids, nodes) {
  const byId = new Map();
  for (const node of Array.isArray(nodes) ? nodes : []) {
    if (node && typeof node.id === "string") byId.set(node.id, node);
  }
  return gids.map((gid) => toFavoriteViewModel(gid, byId.get(gid)));
}

/**
 * Textos de una tarjeta (sin componentes): `t` = shopify.i18n.translate,
 * `formatCurrency` = shopify.i18n.formatCurrency.
 */
export function presentFavorite(item, { t, formatCurrency }) {
  const hasPage = item.state === "available" || item.state === "sold_out";
  let priceText = "";
  if (hasPage && item.price) {
    const formatted = formatCurrency(item.price.amount, { currency: item.price.currencyCode });
    priceText = item.price.from ? t("price_from", { price: formatted }) : formatted;
  }
  return {
    title: item.title,
    href: hasPage ? item.url : null,
    image: hasPage ? item.image : null,
    priceText,
    badgeText: item.state === "available" ? t("available") : item.state === "sold_out" ? t("sold_out") : "",
    message: hasPage ? "" : t("unavailable"),
    viewLabel: t("view_product"),
    removeText: t("remove"),
    removeLabel: item.title ? t("remove_item", { title: item.title }) : t("remove_unavailable"),
  };
}

/* ---------------- errores ---------------- */

/**
 * Error de red/HTTP -> clave de texto. Operación "load" (leer la lista) o
 * "remove" (quitar un favorito por la función con session token).
 */
export function errorMessageKey(error, operation) {
  if (operation === "remove" && error && error.status === 401) return "error_session";
  return operation === "load" ? "error_load" : "error_remove";
}

/** Reduce un error cualquiera a {status, code} sin mensajes ni datos. */
export function toErrorInfo(error) {
  const status = error && Number.isInteger(error.status) ? error.status : 0;
  const code = error && typeof error.code === "string" ? error.code : "";
  return { status, code };
}

/* ---------------- estado ---------------- */

export const initialState = Object.freeze({
  status: "loading", // "loading" | "ready" | "error"
  items: [],
  storeUrl: null,
  removing: [],
  notice: null, // { key, tone: "critical" }
  stale: false,
});

export function reducer(state, action) {
  switch (action.type) {
    case "load_started":
      return { ...state, status: "loading", stale: false };
    case "load_succeeded":
      return { ...state, status: "ready", items: action.items, storeUrl: action.storeUrl ?? null, notice: null, stale: false };
    case "load_failed":
      return { ...state, status: "error", notice: { key: errorMessageKey(action.error, "load"), tone: "critical" } };
    case "remove_started":
      return { ...state, removing: [...new Set([...state.removing, action.id])], notice: null };
    case "remove_succeeded": {
      // `ids` = lista canónica que devolvió la función, en orden. Lo que
      // quedó en la vista se reordena; si la cuenta trae ids que la vista no
      // tiene (alta desde otro dispositivo), se marca para recargar.
      const byId = new Map(state.items.map((item) => [item.id, item]));
      const ids = Array.isArray(action.ids) ? action.ids : [];
      return {
        ...state,
        items: ids.filter((id) => byId.has(id)).map((id) => byId.get(id)),
        removing: state.removing.filter((id) => id !== action.id),
        stale: ids.some((id) => !byId.has(id)),
      };
    }
    case "remove_failed":
      return {
        ...state,
        removing: state.removing.filter((id) => id !== action.id),
        notice: { key: errorMessageKey(action.error, "remove"), tone: "critical" },
      };
    default:
      return state;
  }
}
