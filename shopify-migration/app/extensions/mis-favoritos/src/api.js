/**
 * Acceso a datos de "Mis favoritos" (diseño E5), con dependencias
 * inyectadas para poder probarlo en Node sin el runtime de Shopify:
 *   fetchImpl       -> fetch del Web Worker (Customer Account API y función)
 *   storefrontQuery -> shopify.query (Storefront API, api_access = true)
 *   getSessionToken -> shopify.sessionToken.get
 *
 * 1. Lista: Customer Account API, metafield custom.wishlist (solo lectura;
 *    la definición del comercio necesita acceso "Customer accounts").
 * 2. Productos: Storefront API nodes(ids) en cada carga (precio y stock
 *    frescos; nada se guarda).
 * 3. Quitar: UN solo camino de escritura (R2): POST {BACKEND_URL}/ca/wishlist
 *    con el session token; la función aplica el mismo núcleo que el proxy.
 */
import { parseWishlistValue, buildFavorites, gidToId } from "./model.js";
import { isConfiguredBackend } from "./config.js";

export const CUSTOMER_WISHLIST_QUERY = `query RadaelliMisFavoritos {
  customer {
    metafield(namespace: "custom", key: "wishlist") {
      value
    }
  }
}`;

export const STOREFRONT_PRODUCTS_QUERY = `query RadaelliMisFavoritosProductos($ids: [ID!]!) {
  shop {
    primaryDomain {
      url
    }
  }
  nodes(ids: $ids) {
    ... on Product {
      id
      title
      onlineStoreUrl
      availableForSale
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
}`;

function apiError(status, code) {
  const error = new Error(code || "request_failed");
  error.status = status;
  error.code = code || "";
  return error;
}

const NUMERIC_ID_RE = /^[1-9][0-9]{0,19}$/;

export function createFavoritesApi({
  fetchImpl,
  storefrontQuery,
  getSessionToken,
  backendUrl,
  customerAccountApiVersion,
  storefrontApiVersion,
  timeoutMs = 10000,
}) {
  async function readWishlistGids() {
    let response;
    try {
      response = await fetchImpl(`shopify://customer-account/api/${customerAccountApiVersion}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: CUSTOMER_WISHLIST_QUERY }),
      });
    } catch {
      throw apiError(0, "network");
    }
    if (!response.ok) throw apiError(response.status, "customer_account_api");
    const payload = await response.json().catch(() => null);
    if (!payload || (Array.isArray(payload.errors) && payload.errors.length > 0)) throw apiError(502, "customer_account_api");
    return parseWishlistValue(payload.data?.customer?.metafield?.value ?? null);
  }

  return {
    /** @returns {Promise<{items: object[], storeUrl: string | null}>} */
    async loadFavorites() {
      const gids = await readWishlistGids();
      const result = await storefrontQuery(STOREFRONT_PRODUCTS_QUERY, {
        variables: { ids: gids },
        version: storefrontApiVersion,
      });
      if (!result || !result.data) throw apiError(502, "storefront_api");
      const domain = result.data.shop?.primaryDomain?.url;
      const storeUrl = typeof domain === "string" && /^https:\/\//.test(domain) ? domain.replace(/\/$/, "") : null;
      return { items: buildFavorites(gids, result.data.nodes), storeUrl };
    },

    /**
     * Quita un favorito por la función (E2). Devuelve los ids canónicos que
     * quedaron en la cuenta, en orden.
     * @returns {Promise<string[]>}
     */
    async removeFavorite(productId) {
      const id = gidToId(productId) ?? String(productId);
      if (!NUMERIC_ID_RE.test(id)) throw apiError(400, "invalid_id");
      if (!isConfiguredBackend(backendUrl)) throw apiError(0, "not_configured");
      const token = await getSessionToken();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await fetchImpl(`${backendUrl}/ca/wishlist`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ v: 1, remove: [id] }),
          signal: controller.signal,
        });
      } catch {
        throw apiError(0, "network");
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) throw apiError(response.status, "backend");
      const payload = await response.json().catch(() => null);
      if (!payload || payload.v !== 1 || !Array.isArray(payload.items)) throw apiError(502, "backend_payload");
      return payload.items.map((item) => String(item?.id ?? "")).filter((value) => NUMERIC_ID_RE.test(value));
    },
  };
}
