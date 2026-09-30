/**
 * Utilidades de prueba. ⚠ TODO lo "FAKE" es FALSO a propósito (secreto,
 * tienda, client id, token e ids): sirve solo para estos tests y no
 * corresponde a ningún entorno real.
 */
import { createHash, createHmac } from "node:crypto";
import { loadConfig } from "../server/config.mjs";
import { createLogger } from "../server/logger.mjs";
import { createAppServer } from "../server/server.mjs";

/* ---------------- vectores FALSOS (diseño § 5.3 y § 5.4) ---------------- */
export const FAKE_SECRET = "FAKE-03D-radaelli-app-secret-NOT-REAL"; // ⚠ FALSO
export const FAKE_CLIENT_ID = "FAKE-client-id-03d"; // ⚠ FALSO
export const FAKE_SHOP = "radaelli-fake.myshopify.com"; // ⚠ FALSO
export const FAKE_TS = 1790000000;
export const FAKE_CUSTOMER_ID = "7000000000001"; // ⚠ FALSO
export const FAKE_CUSTOMER_GID = `gid://shopify/Customer/${FAKE_CUSTOMER_ID}`;
export const FAKE_ADMIN_TOKEN = "FAKE-admin-token-NOT-REAL-03d"; // ⚠ FALSO
/** Reloj fijo de los tests: 10 s después del timestamp de los vectores. */
export const FAKE_NOW_MS = (FAKE_TS + 10) * 1000;

export function testEnv(overrides = {}) {
  return {
    SHOPIFY_API_KEY: FAKE_CLIENT_ID,
    SHOPIFY_API_SECRET: FAKE_SECRET,
    ALLOWED_SHOPS: FAKE_SHOP,
    SHOPIFY_ADMIN_ACCESS_TOKEN: FAKE_ADMIN_TOKEN,
    ...overrides,
  };
}

export function testConfig(overrides = {}) {
  return loadConfig(testEnv(overrides));
}

/* ---------------- firmas, implementadas aparte del código de producción ---------------- */

/** Firma de app proxy escrita de nuevo (independiente de server/proxy-signature.mjs). */
export function signQueryIndependently(pairs, secret = FAKE_SECRET) {
  const grouped = new Map();
  for (const [key, value] of pairs) {
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(value);
  }
  const message = [...grouped].map(([key, values]) => `${key}=${values.join(",")}`).sort().join("");
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

/** Query firmada del proxy (como la reenvía Shopify). */
export function signedProxyQuery({
  shop = FAKE_SHOP,
  customerId = FAKE_CUSTOMER_ID,
  pathPrefix = "/apps/radaelli",
  timestamp = FAKE_TS,
  extra = [],
  secret = FAKE_SECRET,
} = {}) {
  const pairs = [["shop", shop]];
  // customerId null = parámetro ausente (undefined toma el valor por defecto).
  if (customerId !== null) pairs.push(["logged_in_customer_id", customerId]);
  pairs.push(["path_prefix", pathPrefix], ["timestamp", String(timestamp)], ...extra);
  const signature = signQueryIndependently(pairs, secret);
  const query = new URLSearchParams(pairs);
  query.append("signature", signature);
  return query.toString();
}

export function signJwtHS256(payload, secret = FAKE_SECRET, header = { alg: "HS256", typ: "JWT" }) {
  const head = Buffer.from(JSON.stringify(header)).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${signature}`;
}

export function fakeSessionPayload(overrides = {}) {
  return {
    dest: `https://${FAKE_SHOP}`,
    aud: FAKE_CLIENT_ID,
    sub: FAKE_CUSTOMER_GID,
    exp: FAKE_TS + 300,
    nbf: FAKE_TS,
    iat: FAKE_TS,
    jti: "00000000-0000-4000-8000-000000000000",
    ...overrides,
  };
}

/* ---------------- Admin GraphQL simulado ---------------- */

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const gidOf = (id) => `gid://shopify/Product/${id}`;
const idOf = (gid) => String(gid).split("/").pop();

/**
 * Shopify simulado (Admin GraphQL + client credentials) como `fetch`.
 * - compareDigest con semántica real: null = "no debe existir"; ausente =
 *   escritura incondicional (así se detecta un código que lo olvide).
 * - `conflicts`: cuántas escrituras fallan porque "otro dispositivo" escribió.
 * - `yieldEachCall`: cede el turno en cada llamada para intercalar escritores.
 */
export function createFakeShopify({
  catalog = new Map([["1", "a"], ["2", "b"], ["3", "c"], ["4", "d"]]),
  lists = {},
  customers = null,
  conflicts = 0,
  conflictCode = "STALE_OBJECT",
  rejectEmptyList = false,
  throttle = false,
  httpStatus = null,
  hang = false,
  graphqlErrors = false,
  yieldEachCall = false,
} = {}) {
  const store = new Map();
  let version = 0;
  for (const [gid, ids] of Object.entries(lists)) store.set(gid, { value: ids.map(gidOf), version: ++version });
  const state = { calls: [], writes: 0, deletes: 0, conflictsLeft: conflicts, tokenRequests: 0 };

  const digestOf = (entry) => (entry ? createHash("sha256").update(`${entry.version}|${JSON.stringify(entry.value)}`).digest("hex") : null);
  const data = (payload) => jsonResponse(200, { data: payload });

  async function fetchImpl(url, init = {}) {
    const target = new URL(url);
    if (target.pathname === "/admin/oauth/access_token") {
      state.tokenRequests += 1;
      state.calls.push({ op: "token", url, headers: init.headers, body: String(init.body) });
      return jsonResponse(200, { access_token: `FAKE-cc-token-${state.tokenRequests}`, scope: "read_customers", expires_in: 86399 });
    }
    const { query, variables } = JSON.parse(init.body);
    const op = /(?:query|mutation) (\w+)/.exec(query)?.[1] ?? "unknown";
    state.calls.push({ op, url, headers: init.headers, variables });
    if (yieldEachCall) await new Promise((resolve) => setImmediate(resolve));
    if (hang) {
      return new Promise((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    }
    if (httpStatus) return jsonResponse(httpStatus, { errors: "fake" });
    if (throttle) return jsonResponse(200, { errors: [{ message: "Throttled", extensions: { code: "THROTTLED" } }] });
    if (graphqlErrors) return jsonResponse(200, { errors: [{ message: "fake graphql error" }] });

    switch (op) {
      case "RadaelliReadWishlist": {
        const gid = variables.customerId;
        if (customers && !customers.has(gid)) return data({ customer: null });
        const entry = store.get(gid);
        return data({ customer: { metafield: entry ? { jsonValue: [...entry.value], compareDigest: digestOf(entry) } : null } });
      }
      case "RadaelliLookupProducts":
        return data({ nodes: variables.ids.map((gid) => (catalog.has(idOf(gid)) ? { id: gid, handle: catalog.get(idOf(gid)) } : null)) });
      case "RadaelliSetWishlist": {
        const input = variables.metafields[0];
        const entry = store.get(input.ownerId);
        if (state.conflictsLeft > 0) {
          state.conflictsLeft -= 1;
          // Otro dispositivo escribió en el medio (misma lista, digest nuevo).
          store.set(input.ownerId, { value: entry ? entry.value : [], version: ++version });
          return data({ metafieldsSet: { metafields: [], userErrors: [{ field: ["metafields", "0"], message: "stale", code: conflictCode }] } });
        }
        if (Object.hasOwn(input, "compareDigest") && input.compareDigest !== digestOf(entry)) {
          return data({ metafieldsSet: { metafields: [], userErrors: [{ field: ["metafields", "0"], message: "stale", code: "STALE_OBJECT" }] } });
        }
        const value = JSON.parse(input.value);
        if (rejectEmptyList && value.length === 0) {
          return data({ metafieldsSet: { metafields: [], userErrors: [{ field: ["metafields", "0", "value"], message: "blank", code: "INVALID_VALUE" }] } });
        }
        const next = { value, version: ++version };
        store.set(input.ownerId, next);
        state.writes += 1;
        return data({ metafieldsSet: { metafields: [{ compareDigest: digestOf(next) }], userErrors: [] } });
      }
      case "RadaelliDeleteWishlist": {
        const input = variables.metafields[0];
        const existed = store.delete(input.ownerId);
        state.deletes += 1;
        return data({ metafieldsDelete: { deletedMetafields: [existed ? { key: input.key } : null], userErrors: [] } });
      }
      default:
        return jsonResponse(400, { errors: [{ message: "unknown operation" }] });
    }
  }

  return {
    fetch: fetchImpl,
    state,
    /** ids numéricos guardados para una clienta (null si no hay metafield). */
    listOf(customerGid = FAKE_CUSTOMER_GID) {
      const entry = store.get(customerGid);
      return entry ? entry.value.map(idOf) : null;
    },
    /** Simula un cambio desde otro dispositivo. */
    setList(customerGid, ids) {
      store.set(customerGid, { value: ids.map(gidOf), version: ++version });
    },
  };
}

/** Catálogo de n productos (ids 1..n, handle "h<id>"). */
export function bigCatalog(n) {
  return new Map(Array.from({ length: n }, (_, index) => [String(index + 1), `h${index + 1}`]));
}

export function range(from, to) {
  return Array.from({ length: to - from + 1 }, (_, index) => String(from + index));
}

/* ---------------- servidor real sobre 127.0.0.1 ---------------- */

export async function startTestServer({ env = {}, shopify = createFakeShopify(), nowMs = () => FAKE_NOW_MS, ...overrides } = {}) {
  // Reloj fijo = el balde no se recarga: por defecto se sube el límite para
  // que solo el test de rate limit lo toque.
  const config = testConfig({ RATE_LIMIT_BURST: "1000", ...env });
  const logLines = [];
  const logger = createLogger({ sink: (line) => logLines.push(line) });
  const server = createAppServer({ config, fetchImpl: shopify.fetch, logger, nowMs, ...overrides });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    config,
    server,
    shopify,
    logLines,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

export function postProxy(base, body, { query = signedProxyQuery(), headers = {}, method = "POST" } = {}) {
  return fetch(`${base}/proxy/wishlist?${query}`, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-Radaelli-Wishlist": "1", ...headers },
    body: method === "GET" || method === "HEAD" ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

export function postCustomerAccount(base, body, { token = signJwtHS256(fakeSessionPayload()), headers = {} } = {}) {
  return fetch(`${base}/ca/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
