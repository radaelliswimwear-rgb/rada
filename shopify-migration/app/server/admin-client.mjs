/**
 * Cliente mínimo de la Admin GraphQL API + bucle CAS (diseño § 7.1, R3, R9, R10).
 *
 * - Versión fijada (config.apiVersion, por defecto 2026-07).
 * - El token de Admin vive SOLO en el servidor (variable de entorno o client
 *   credentials en memoria). Nunca se loguea ni se devuelve.
 * - `fetchImpl` inyectable: los tests usan un Admin simulado, sin red.
 * - Todas las llamadas respetan la señal de corte del request (timeout
 *   total de la función, 10 s por defecto).
 */
import { parseMetafieldList, serializeMetafieldList, gidToProductId, productIdToGid, applyWishlistOps, toResponseItems } from "./wishlist-core.mjs";

export const CAS_MAX_ATTEMPTS = 3;
export const METAFIELD_NAMESPACE = "custom";
export const METAFIELD_KEY = "wishlist";
export const METAFIELD_TYPE = "list.product_reference";
/** Lote de ids por consulta nodes(). El máximo de Admin no está documentado: se usa un valor conservador. */
export const NODES_CHUNK_SIZE = 100;
/** Códigos de userErrors que significan "otro escribió antes" (el enum no dice cuál llega: GO/NO-GO 15). */
const CAS_CONFLICT_CODES = new Set(["STALE_OBJECT", "INVALID_COMPARE_DIGEST"]);

export const READ_WISHLIST_QUERY = `query RadaelliReadWishlist($customerId: ID!) {
  customer(id: $customerId) {
    metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") {
      jsonValue
      compareDigest
    }
  }
}`;

export const LOOKUP_PRODUCTS_QUERY = `query RadaelliLookupProducts($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Product {
      id
      handle
    }
  }
}`;

export const SET_WISHLIST_MUTATION = `mutation RadaelliSetWishlist($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      compareDigest
    }
    userErrors {
      field
      message
      code
    }
  }
}`;

export const DELETE_WISHLIST_MUTATION = `mutation RadaelliDeleteWishlist($metafields: [MetafieldIdentifierInput!]!) {
  metafieldsDelete(metafields: $metafields) {
    deletedMetafields {
      key
    }
    userErrors {
      field
      message
    }
  }
}`;

/**
 * Error de la Admin API ya clasificado.
 * kind: "admin_error" (502) | "admin_throttled" (503) | "upstream_timeout" (504) | "no_customer" (401)
 * detail: código corto SIN datos de la clienta (va al log).
 */
export class AdminError extends Error {
  constructor(kind, detail) {
    super(kind);
    this.name = "AdminError";
    this.kind = kind;
    this.detail = detail;
  }
}

/** 3 conflictos de CAS seguidos (409). */
export class ConflictError extends Error {
  constructor() {
    super("conflict");
    this.name = "ConflictError";
  }
}

function timeoutError() {
  return new AdminError("upstream_timeout", "deadline");
}

/** Corta una promesa cuando la señal se aborta (aunque fetch no la respete). */
function withSignal(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(timeoutError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(timeoutError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

/**
 * Proveedor del token de Admin (R3).
 * - source "env": token offline guardado como secreto del hosting (R3b).
 * - source "client_credentials": solo si la tienda está en la misma
 *   organización del Dev Dashboard (R3a). Token de ~24 h en memoria.
 */
export function createAccessTokenProvider({ source, staticToken, apiKey, apiSecret, fetchImpl, nowMs = Date.now }) {
  if (source === "env") {
    return async () => {
      if (!staticToken) throw new AdminError("admin_error", "token_missing");
      return staticToken;
    };
  }
  const cache = new Map();
  const inflight = new Map();
  return async function getAccessToken(shop, signal) {
    const hit = cache.get(shop);
    if (hit && hit.expiresAtMs - 60_000 > nowMs()) return hit.token;
    if (inflight.has(shop)) return withSignal(inflight.get(shop), signal);
    const request = (async () => {
      const body = new URLSearchParams({ grant_type: "client_credentials", client_id: apiKey, client_secret: apiSecret }).toString();
      let response;
      try {
        response = await fetchImpl(`https://${shop}/admin/oauth/access_token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body,
          signal,
        });
      } catch {
        throw signal?.aborted ? timeoutError() : new AdminError("admin_error", "token_network");
      }
      if (!response.ok) {
        throw new AdminError(response.status === 429 ? "admin_throttled" : "admin_error", `token_http_${response.status}`);
      }
      const payload = await response.json().catch(() => null);
      if (!payload || typeof payload.access_token !== "string" || payload.access_token.length === 0) {
        throw new AdminError("admin_error", "token_invalid");
      }
      const ttlSec = Number.isFinite(payload.expires_in) && payload.expires_in > 0 ? payload.expires_in : 3600;
      cache.set(shop, { token: payload.access_token, expiresAtMs: nowMs() + ttlSec * 1000 });
      return payload.access_token;
    })().finally(() => inflight.delete(shop));
    inflight.set(shop, request);
    return withSignal(request, signal);
  };
}

/**
 * @param {{shop: string, apiVersion: string, getAccessToken: (shop: string, signal?: AbortSignal) => Promise<string>,
 *          fetchImpl: typeof fetch}} options  `shop` ya validado contra la allowlist.
 */
export function createAdminClient({ shop, apiVersion, getAccessToken, fetchImpl }) {
  const endpoint = `https://${shop}/admin/api/${apiVersion}/graphql.json`;

  async function graphql(query, variables, signal) {
    if (signal?.aborted) throw timeoutError();
    const token = await getAccessToken(shop, signal);
    let response;
    try {
      response = await withSignal(
        fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Shopify-Access-Token": token,
          },
          body: JSON.stringify({ query, variables }),
          signal,
        }),
        signal,
      );
    } catch (error) {
      if (error instanceof AdminError) throw error;
      throw signal?.aborted ? timeoutError() : new AdminError("admin_error", "network");
    }
    if (response.status === 429) throw new AdminError("admin_throttled", "http_429");
    if (!response.ok) throw new AdminError("admin_error", `http_${response.status}`);
    let payload;
    try {
      payload = await withSignal(response.json(), signal);
    } catch (error) {
      if (error instanceof AdminError) throw error;
      throw new AdminError("admin_error", "invalid_json");
    }
    if (payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
      const throttled = payload.errors.some((entry) => entry?.extensions?.code === "THROTTLED");
      throw new AdminError(throttled ? "admin_throttled" : "admin_error", throttled ? "throttled" : "graphql_errors");
    }
    if (!payload || typeof payload.data !== "object" || payload.data === null) {
      throw new AdminError("admin_error", "no_data");
    }
    return payload.data;
  }

  return {
    /** @returns {Promise<{ids: string[], digest: string | null}>} digest null = el metafield no existe */
    async readWishlist(customerGid, signal) {
      const data = await graphql(READ_WISHLIST_QUERY, { customerId: customerGid }, signal);
      if (!data.customer) throw new AdminError("no_customer", "customer_not_found");
      const metafield = data.customer.metafield;
      if (!metafield) return { ids: [], digest: null };
      return {
        ids: parseMetafieldList(metafield.jsonValue),
        digest: typeof metafield.compareDigest === "string" ? metafield.compareDigest : null,
      };
    },

    /**
     * Productos que existen (R10: borrado = null en nodes(); sin documentar,
     * GO/NO-GO 11). Archivados y borradores existen y se conservan.
     * @returns {Promise<Map<string, string>>} id -> handle
     */
    async lookupProducts(ids, signal) {
      const existing = new Map();
      for (let start = 0; start < ids.length; start += NODES_CHUNK_SIZE) {
        const chunk = ids.slice(start, start + NODES_CHUNK_SIZE);
        const data = await graphql(LOOKUP_PRODUCTS_QUERY, { ids: chunk.map((id) => productIdToGid(id)) }, signal);
        const nodes = Array.isArray(data.nodes) ? data.nodes : [];
        for (const node of nodes) {
          const id = node && gidToProductId(node.id);
          if (id !== null && id !== undefined && chunk.includes(id)) {
            existing.set(id, typeof node.handle === "string" ? node.handle : "");
          }
        }
      }
      return existing;
    },

    /**
     * metafieldsSet con compareDigest (null = "no debe existir").
     * @returns {Promise<{ok: true} | {ok: false, conflict: true, code: string}>}
     */
    async setWishlist(customerGid, ids, compareDigest, signal) {
      const input = {
        ownerId: customerGid,
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
        type: METAFIELD_TYPE,
        value: serializeMetafieldList(ids),
        compareDigest,
      };
      const data = await graphql(SET_WISHLIST_MUTATION, { metafields: [input] }, signal);
      const result = data.metafieldsSet;
      if (!result) throw new AdminError("admin_error", "no_payload");
      const errors = Array.isArray(result.userErrors) ? result.userErrors : [];
      if (errors.length === 0) return { ok: true };
      const conflict = errors.find((entry) => CAS_CONFLICT_CODES.has(entry?.code));
      if (conflict) return { ok: false, conflict: true, code: conflict.code };
      const code = typeof errors[0]?.code === "string" ? errors[0].code.slice(0, 40) : "unknown";
      throw new AdminError("admin_error", `user_error_${code}`);
    },

    /** R9, estrategia "delete": metafieldsDelete NO tiene compareDigest. */
    async deleteWishlist(customerGid, signal) {
      const data = await graphql(
        DELETE_WISHLIST_MUTATION,
        { metafields: [{ ownerId: customerGid, namespace: METAFIELD_NAMESPACE, key: METAFIELD_KEY }] },
        signal,
      );
      const result = data.metafieldsDelete;
      if (!result) throw new AdminError("admin_error", "no_payload");
      if (Array.isArray(result.userErrors) && result.userErrors.length > 0) {
        throw new AdminError("admin_error", "delete_user_error");
      }
      return { ok: true };
    },
  };
}

/**
 * Bucle CAS (diseño § 7.1): leer -> nodes() -> unión -> metafieldsSet con
 * compareDigest; ante conflicto se vuelve a leer, hasta 3 veces -> 409.
 *
 * Lista vacía (R9):
 * - "set_empty" (por defecto): metafieldsSet con "[]" + CAS. Que Shopify lo
 *   acepte NO está documentado (GO/NO-GO 10).
 * - "delete": metafieldsDelete, que no tiene CAS. Para achicar la ventana se
 *   relee el digest justo antes de borrar; si cambió, cuenta como conflicto.
 *   Riesgo residual aceptado: un alta simultánea desde otro dispositivo entre
 *   esa relectura y el borrado puede perderse.
 *
 * @returns {Promise<{items: {id: string, handle: string}[], rejected: string[], notFound: string[], writes: number, attempts: number}>}
 * @throws {ConflictError | AdminError}
 */
export async function applyOpsWithCas({ admin, customerGid, ops, signal, emptyListStrategy = "set_empty", maxAttempts = CAS_MAX_ATTEMPTS }) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const current = await admin.readWishlist(customerGid, signal);
    const lookupIds = [...new Set([...current.ids, ...(ops.add ?? [])])];
    const existing = lookupIds.length > 0 ? await admin.lookupProducts(lookupIds, signal) : new Map();
    const result = applyWishlistOps(current.ids, existing, ops);
    const response = {
      items: toResponseItems(result.next, existing),
      rejected: result.rejected,
      notFound: result.notFound,
    };
    if (!result.changed) return { ...response, writes: 0, attempts: attempt };

    let outcome;
    if (result.next.length === 0 && emptyListStrategy === "delete") {
      const fresh = await admin.readWishlist(customerGid, signal);
      if (fresh.digest !== current.digest) {
        outcome = { ok: false, conflict: true, code: "DIGEST_CHANGED" };
      } else {
        outcome = await admin.deleteWishlist(customerGid, signal);
      }
    } else {
      outcome = await admin.setWishlist(customerGid, result.next, current.digest, signal);
    }
    if (outcome.ok) return { ...response, writes: 1, attempts: attempt };
  }
  throw new ConflictError();
}
