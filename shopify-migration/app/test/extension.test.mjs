/**
 * Lógica pura de la extensión "Mis favoritos" (sin runtime de Shopify).
 * El componente JSX no se ejecuta acá (necesita Preact + componentes Polaris).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseWishlistValue,
  toFavoriteViewModel,
  buildFavorites,
  presentFavorite,
  errorMessageKey,
  toErrorInfo,
  reducer,
  initialState,
  gidToId,
  idToGid,
} from "../extensions/mis-favoritos/src/model.js";
import { createFavoritesApi } from "../extensions/mis-favoritos/src/api.js";
import { isConfiguredBackend, BACKEND_URL } from "../extensions/mis-favoritos/src/config.js";

const G = (id) => `gid://shopify/Product/${id}`;
const locales = JSON.parse(readFileSync(new URL("../extensions/mis-favoritos/locales/es.default.json", import.meta.url), "utf8"));

/** Traductor de prueba con el archivo real de textos (interpolación {{x}} y plurales one/other). */
function t(key, params = {}) {
  let entry = locales[key];
  assert.ok(entry !== undefined, `falta la clave ${key} en es.default.json`);
  if (typeof entry === "object") entry = params.count === 1 ? entry.one : entry.other;
  return entry.replace(/\{\{(\w+)\}\}/g, (_, name) => String(params[name]));
}
const formatCurrency = (amount, { currency }) => `${currency} ${amount.toFixed(0)}`;

function productNode(id, overrides = {}) {
  return {
    id: G(id),
    title: `Bikini ${id}`,
    onlineStoreUrl: `https://radaelli-fake.example/products/bikini-${id}`,
    availableForSale: true,
    featuredImage: { url: `https://cdn.shopify.com/fake/${id}.jpg`, altText: "" },
    priceRange: { minVariantPrice: { amount: "189000.0", currencyCode: "COP" }, maxVariantPrice: { amount: "189000.0", currencyCode: "COP" } },
    ...overrides,
  };
}

test("parseWishlistValue: GIDs válidos en orden, sin duplicados; basura -> []", () => {
  assert.deepEqual(parseWishlistValue(JSON.stringify([G(2), G(4), G(2), "gid://shopify/Customer/1", 7])), [G(2), G(4)]);
  assert.deepEqual(parseWishlistValue(null), []);
  assert.deepEqual(parseWishlistValue("{no json"), []);
  assert.deepEqual(parseWishlistValue(JSON.stringify({ a: 1 })), []);
  assert.equal(gidToId(G(9)), "9");
  assert.equal(idToGid("9"), G(9));
  assert.equal(idToGid("x"), null);
});

test("view-model: disponible", () => {
  const view = toFavoriteViewModel(G(1), productNode(1));
  assert.equal(view.state, "available");
  assert.equal(view.id, "1");
  assert.equal(view.url, "https://radaelli-fake.example/products/bikini-1");
  assert.deepEqual(view.image, { src: "https://cdn.shopify.com/fake/1.jpg", alt: "Bikini 1" });
  assert.deepEqual(view.price, { amount: 189000, currencyCode: "COP", from: false });
});

test("view-model: agotado (existe, con página, sin stock)", () => {
  assert.equal(toFavoriteViewModel(G(1), productNode(1, { availableForSale: false })).state, "sold_out");
});

test("view-model: sin página en la tienda online -> unavailable", () => {
  const view = toFavoriteViewModel(G(1), productNode(1, { onlineStoreUrl: null }));
  assert.equal(view.state, "unavailable");
  assert.equal(view.url, null);
});

test("view-model: borrado / no publicado (nodo null o de otro id) -> deleted", () => {
  assert.equal(toFavoriteViewModel(G(1), null).state, "deleted");
  assert.equal(toFavoriteViewModel(G(1), productNode(2)).state, "deleted");
});

test("view-model: URLs no https se descartan (sin link ni imagen)", () => {
  const view = toFavoriteViewModel(G(1), productNode(1, { onlineStoreUrl: "javascript:alert(1)", featuredImage: { url: "http://x/1.jpg" } }));
  assert.equal(view.state, "unavailable");
  assert.equal(view.image, null);
});

test("buildFavorites respeta el orden de la cuenta aunque la API devuelva otro", () => {
  const items = buildFavorites([G(2), G(9), G(1)], [productNode(1), null, productNode(2)]);
  assert.deepEqual(items.map((item) => [item.id, item.state]), [["2", "available"], ["9", "deleted"], ["1", "available"]]);
});

test("presentación: disponible con precio, rango 'Desde', etiquetas accesibles", () => {
  const view = presentFavorite(toFavoriteViewModel(G(1), productNode(1)), { t, formatCurrency });
  assert.equal(view.title, "Bikini 1");
  assert.equal(view.priceText, "COP 189000");
  assert.equal(view.badgeText, "Disponible");
  assert.equal(view.removeLabel, "Eliminar Bikini 1 de favoritos");
  assert.equal(view.removeText, "Quitar de favoritos");
  assert.equal(view.viewLabel, "Ver producto");
  assert.equal(view.href, "https://radaelli-fake.example/products/bikini-1");
  const range = presentFavorite(
    toFavoriteViewModel(G(1), productNode(1, { priceRange: { minVariantPrice: { amount: "150000", currencyCode: "COP" }, maxVariantPrice: { amount: "190000", currencyCode: "COP" } } })),
    { t, formatCurrency },
  );
  assert.equal(range.priceText, "Desde COP 150000");
});

test("presentación: agotado", () => {
  const view = presentFavorite(toFavoriteViewModel(G(1), productNode(1, { availableForSale: false })), { t, formatCurrency });
  assert.equal(view.badgeText, "Agotado");
  assert.ok(view.href);
});

test("presentación: borrado -> mensaje de no disponible, sin link, se puede quitar", () => {
  const view = presentFavorite(toFavoriteViewModel(G(1), null), { t, formatCurrency });
  assert.equal(view.href, null);
  assert.equal(view.priceText, "");
  assert.equal(view.message, "Este producto ya no está disponible.");
  assert.equal(view.removeLabel, "Eliminar de favoritos");
});

test("presentación: sin página (unavailable) conserva el título pero no link ni precio", () => {
  const view = presentFavorite(toFavoriteViewModel(G(1), productNode(1, { onlineStoreUrl: null })), { t, formatCurrency });
  assert.equal(view.title, "Bikini 1");
  assert.equal(view.href, null);
  assert.equal(view.priceText, "");
  assert.equal(view.message, "Este producto ya no está disponible.");
});

test("errores -> claves de texto", () => {
  assert.equal(errorMessageKey({ status: 401 }, "remove"), "error_session");
  for (const status of [0, 400, 409, 429, 500, 502, 503, 504]) assert.equal(errorMessageKey({ status }, "remove"), "error_remove");
  assert.equal(errorMessageKey({ status: 401 }, "load"), "error_load");
  assert.deepEqual(toErrorInfo(Object.assign(new Error("secreto en el mensaje"), { status: 409, code: "backend" })), { status: 409, code: "backend" });
  assert.deepEqual(toErrorInfo(undefined), { status: 0, code: "" });
  for (const key of ["error_session", "error_remove", "error_load"]) assert.ok(t(key));
});

test("estado: carga -> lista; vacía -> ready sin items (estado vacío)", () => {
  let state = reducer(initialState, { type: "load_started" });
  assert.equal(state.status, "loading");
  state = reducer(state, { type: "load_succeeded", items: [], storeUrl: "https://radaelli-fake.example" });
  assert.equal(state.status, "ready");
  assert.equal(state.items.length, 0);
  assert.ok(t("empty_title") && t("empty_text") && t("explore"));
});

test("estado: quitar ok reordena según la cuenta; alta remota marca recarga", () => {
  const items = buildFavorites([G(1), G(2), G(3)], [productNode(1), productNode(2), productNode(3)]);
  let state = reducer(initialState, { type: "load_succeeded", items });
  state = reducer(state, { type: "remove_started", id: "2" });
  assert.deepEqual(state.removing, ["2"]);
  state = reducer(state, { type: "remove_succeeded", id: "2", ids: ["1", "3"] });
  assert.deepEqual(state.items.map((item) => item.id), ["1", "3"]);
  assert.deepEqual(state.removing, []);
  assert.equal(state.stale, false);
  state = reducer(state, { type: "remove_succeeded", id: "3", ids: ["1", "8"] });
  assert.equal(state.stale, true);
  assert.deepEqual(state.items.map((item) => item.id), ["1"]);
});

test("estado: quitar falla -> aviso crítico y el producto sigue en la lista", () => {
  const items = buildFavorites([G(1)], [productNode(1)]);
  let state = reducer(initialState, { type: "load_succeeded", items });
  state = reducer(state, { type: "remove_started", id: "1" });
  state = reducer(state, { type: "remove_failed", id: "1", error: { status: 401 } });
  assert.deepEqual(state.notice, { key: "error_session", tone: "critical" });
  assert.equal(state.items.length, 1);
  assert.deepEqual(state.removing, []);
});

test("estado: error de carga -> status error con aviso", () => {
  const state = reducer(initialState, { type: "load_failed", error: { status: 0 } });
  assert.equal(state.status, "error");
  assert.deepEqual(state.notice, { key: "error_load", tone: "critical" });
});

test("todas las claves que usa el modelo existen en es.default.json; count tiene one/other", () => {
  for (const key of ["title", "loading", "view_product", "remove", "remove_item", "remove_unavailable", "unavailable", "available", "sold_out", "price_from", "removed"]) {
    assert.ok(typeof locales[key] === "string" && locales[key].length > 0, key);
  }
  assert.equal(t("count", { count: 1 }), "1 producto guardado");
  assert.equal(t("count", { count: 3 }), "3 productos guardados");
});

/* ---------------- api.js con dependencias falsas ---------------- */

function fakeFetchFactory({ metafieldValue = JSON.stringify([G(2), G(9)]), backend } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.startsWith("shopify://customer-account/api/")) {
      return new Response(JSON.stringify({ data: { customer: { metafield: metafieldValue === null ? null : { value: metafieldValue } } } }), { status: 200 });
    }
    return backend(url, init);
  };
  return { fetchImpl, calls };
}

const storefrontQuery = async (_query, { variables }) => ({
  data: {
    shop: { primaryDomain: { url: "https://radaelli-fake.example/" } },
    nodes: variables.ids.map((gid) => (gid === G(9) ? null : productNode(gidToId(gid)))),
  },
});

test("api.loadFavorites: lista fresca desde Customer Account API + Storefront (versión fijada)", async () => {
  const { fetchImpl, calls } = fakeFetchFactory();
  const api = createFavoritesApi({ fetchImpl, storefrontQuery, getSessionToken: async () => "t", backendUrl: BACKEND_URL, customerAccountApiVersion: "2026-07", storefrontApiVersion: "2026-07" });
  const { items, storeUrl } = await api.loadFavorites();
  assert.equal(calls[0].url, "shopify://customer-account/api/2026-07/graphql.json");
  assert.deepEqual(items.map((item) => [item.id, item.state]), [["2", "available"], ["9", "deleted"]]);
  assert.equal(storeUrl, "https://radaelli-fake.example");
});

test("api.loadFavorites: sin metafield -> lista vacía", async () => {
  const { fetchImpl } = fakeFetchFactory({ metafieldValue: null });
  const api = createFavoritesApi({ fetchImpl, storefrontQuery, getSessionToken: async () => "t", backendUrl: BACKEND_URL, customerAccountApiVersion: "2026-07", storefrontApiVersion: "2026-07" });
  assert.deepEqual((await api.loadFavorites()).items, []);
});

test("api.removeFavorite: con el placeholder de BACKEND_URL no llama a nada", async () => {
  assert.equal(isConfiguredBackend(BACKEND_URL), false);
  const { fetchImpl, calls } = fakeFetchFactory({ backend: () => assert.fail("no debería llamar") });
  const api = createFavoritesApi({ fetchImpl, storefrontQuery, getSessionToken: async () => "t", backendUrl: BACKEND_URL, customerAccountApiVersion: "2026-07" });
  await assert.rejects(api.removeFavorite("2"), (error) => error.code === "not_configured" && error.status === 0);
  assert.equal(calls.length, 0);
});

test("api.removeFavorite: POST /ca/wishlist con Bearer y {v:1, remove:[id]}", async () => {
  const backend = async (url, init) => {
    assert.equal(url, "https://funcion.radaelli-fake.test/ca/wishlist");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer FAKE.session.token");
    assert.deepEqual(JSON.parse(init.body), { v: 1, remove: ["2"] });
    return new Response(JSON.stringify({ v: 1, items: [{ id: "4", handle: "d" }], rejected: [], notFound: [] }), { status: 200 });
  };
  const { fetchImpl } = fakeFetchFactory({ backend });
  const api = createFavoritesApi({ fetchImpl, storefrontQuery, getSessionToken: async () => "FAKE.session.token", backendUrl: "https://funcion.radaelli-fake.test", customerAccountApiVersion: "2026-07" });
  assert.deepEqual(await api.removeFavorite(G(2)), ["4"]);
});

test("api.removeFavorite: errores HTTP y de red conservan el status", async () => {
  for (const [backend, status] of [
    [async () => new Response("{}", { status: 401 }), 401],
    [async () => new Response("{}", { status: 409 }), 409],
    [async () => { throw new TypeError("network"); }, 0],
    [async () => new Response("<html>", { status: 200 }), 502],
  ]) {
    const { fetchImpl } = fakeFetchFactory({ backend });
    const api = createFavoritesApi({ fetchImpl, storefrontQuery, getSessionToken: async () => "t", backendUrl: "https://funcion.radaelli-fake.test", customerAccountApiVersion: "2026-07" });
    await assert.rejects(api.removeFavorite("2"), (error) => error.status === status);
  }
});
