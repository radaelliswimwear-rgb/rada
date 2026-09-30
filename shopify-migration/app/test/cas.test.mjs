import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyOpsWithCas,
  createAdminClient,
  createAccessTokenProvider,
  AdminError,
  ConflictError,
  CAS_MAX_ATTEMPTS,
} from "../server/admin-client.mjs";
import { PINNED_API_VERSION } from "../server/config.mjs";
import { createFakeShopify, FAKE_SHOP, FAKE_ADMIN_TOKEN, FAKE_CUSTOMER_GID, bigCatalog, range } from "./helpers.mjs";

function adminFor(shopify, overrides = {}) {
  const getAccessToken = createAccessTokenProvider({ source: "env", staticToken: FAKE_ADMIN_TOKEN });
  return createAdminClient({ shop: FAKE_SHOP, apiVersion: PINNED_API_VERSION, getAccessToken, fetchImpl: shopify.fetch, ...overrides });
}

const run = (shopify, ops, extra = {}) => applyOpsWithCas({ admin: adminFor(shopify), customerGid: FAKE_CUSTOMER_GID, ops, ...extra });

test("metafield inexistente (digest null) -> se crea con compareDigest null", async () => {
  const shopify = createFakeShopify();
  const result = await run(shopify, { add: ["1"], remove: [] });
  assert.deepEqual(result.items, [{ id: "1", handle: "a" }]);
  assert.equal(result.writes, 1);
  assert.deepEqual(shopify.listOf(), ["1"]);
  const set = shopify.state.calls.find((call) => call.op === "RadaelliSetWishlist");
  assert.equal(set.variables.metafields[0].compareDigest, null);
  assert.equal(set.variables.metafields[0].type, "list.product_reference");
  assert.equal(set.variables.metafields[0].namespace, "custom");
  assert.equal(set.variables.metafields[0].key, "wishlist");
  assert.equal(set.variables.metafields[0].ownerId, FAKE_CUSTOMER_GID);
  assert.equal(set.variables.metafields[0].value, '["gid://shopify/Product/1"]');
});

test("Admin API: versión fijada, token solo en el header, dominio de la tienda", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] } });
  await run(shopify, {});
  for (const call of shopify.state.calls) {
    assert.equal(call.url, `https://${FAKE_SHOP}/admin/api/2026-07/graphql.json`);
    assert.equal(call.headers["X-Shopify-Access-Token"], FAKE_ADMIN_TOKEN);
  }
});

test("unión [B,D] + [A,B,C] = [B,D,A,C] con handles canónicos", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2", "4"] } });
  const result = await run(shopify, { add: ["1", "2", "3"], remove: [] });
  assert.deepEqual(result.items, [
    { id: "2", handle: "b" },
    { id: "4", handle: "d" },
    { id: "1", handle: "a" },
    { id: "3", handle: "c" },
  ]);
  assert.deepEqual(shopify.listOf(), ["2", "4", "1", "3"]);
});

test("idempotencia: la segunda unión igual no escribe", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2", "4"] } });
  await run(shopify, { add: ["1", "2", "3"] });
  const writesAfterFirst = shopify.state.writes;
  const second = await run(shopify, { add: ["1", "2", "3"] });
  assert.equal(second.writes, 0);
  assert.equal(shopify.state.writes, writesAfterFirst);
});

test("digest viejo -> se relee y el reintento funciona (STALE_OBJECT)", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] }, conflicts: 1 });
  const result = await run(shopify, { add: ["1"] });
  assert.equal(result.attempts, 2);
  assert.deepEqual(shopify.listOf(), ["2", "1"]);
});

test("digest viejo con INVALID_COMPARE_DIGEST también cuenta como conflicto", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] }, conflicts: 2, conflictCode: "INVALID_COMPARE_DIGEST" });
  const result = await run(shopify, { add: ["1"] });
  assert.equal(result.attempts, 3);
  assert.deepEqual(shopify.listOf(), ["2", "1"]);
});

test("3 conflictos seguidos -> ConflictError (409) sin escribir", async () => {
  assert.equal(CAS_MAX_ATTEMPTS, 3);
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] }, conflicts: 3 });
  await assert.rejects(run(shopify, { add: ["1"] }), ConflictError);
  assert.deepEqual(shopify.listOf(), ["2"]);
  assert.equal(shopify.state.calls.filter((call) => call.op === "RadaelliSetWishlist").length, 3);
});

test("un alta hecha desde otro dispositivo entre intentos no se pierde", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] } });
  const admin = adminFor(shopify);
  let first = true;
  const racingAdmin = {
    ...admin,
    async setWishlist(...args) {
      if (first) {
        first = false;
        shopify.setList(FAKE_CUSTOMER_GID, ["2", "4"]); // otro dispositivo agregó D
      }
      return admin.setWishlist(...args);
    },
  };
  const result = await applyOpsWithCas({ admin: racingAdmin, customerGid: FAKE_CUSTOMER_GID, ops: { add: ["1"], remove: [] } });
  assert.deepEqual(shopify.listOf(), ["2", "4", "1"]);
  assert.equal(result.attempts, 2);
});

test("escritores concurrentes: ninguna alta confirmada (200) se pierde", async () => {
  const shopify = createFakeShopify({ catalog: bigCatalog(20), lists: { [FAKE_CUSTOMER_GID]: [] }, yieldEachCall: true });
  const ids = ["11", "12"];
  const results = await Promise.allSettled(ids.map((id) => run(shopify, { add: [id], remove: [] })));
  assert.ok(results.every((result) => result.status === "fulfilled"), "con 2 escritores los 3 intentos alcanzan");
  assert.deepEqual([...shopify.listOf()].sort(), ids);
});

test("escritores concurrentes (5): lo que respondió 200 está; lo que dio 409 no aparece de la nada", async () => {
  const shopify = createFakeShopify({ catalog: bigCatalog(20), lists: { [FAKE_CUSTOMER_GID]: ["1"] }, yieldEachCall: true });
  const ids = ["11", "12", "13", "14", "15"];
  const results = await Promise.allSettled(ids.map((id) => run(shopify, { add: [id], remove: [] })));
  const final = shopify.listOf();
  assert.equal(final[0], "1", "la lista previa sigue primero");
  assert.equal(new Set(final).size, final.length, "sin duplicados");
  results.forEach((result, index) => {
    if (result.status === "fulfilled") assert.ok(final.includes(ids[index]), `alta ${ids[index]} confirmada y perdida`);
    else assert.ok(result.reason instanceof ConflictError);
  });
  const confirmed = ids.filter((_, index) => results[index].status === "fulfilled");
  assert.deepEqual([...final].slice(1).sort(), confirmed.sort());
});

test("lista vacía (set_empty): metafieldsSet con '[]' y compareDigest", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] } });
  const result = await run(shopify, { add: [], remove: ["2"] });
  assert.deepEqual(result.items, []);
  assert.deepEqual(shopify.listOf(), []);
  const set = shopify.state.calls.find((call) => call.op === "RadaelliSetWishlist");
  assert.equal(set.variables.metafields[0].value, "[]");
  assert.equal(typeof set.variables.metafields[0].compareDigest, "string");
});

test("lista vacía rechazada por Shopify (GO/NO-GO 10) con set_empty -> admin_error (502), no se pierde nada", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] }, rejectEmptyList: true });
  await assert.rejects(run(shopify, { remove: ["2"] }), (error) => error instanceof AdminError && error.kind === "admin_error" && error.detail === "user_error_INVALID_VALUE");
  assert.deepEqual(shopify.listOf(), ["2"]);
});

test("lista vacía con estrategia delete: relee el digest y usa metafieldsDelete", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] }, rejectEmptyList: true });
  const result = await run(shopify, { remove: ["2"] }, { emptyListStrategy: "delete" });
  assert.deepEqual(result.items, []);
  assert.equal(result.writes, 1);
  assert.equal(shopify.listOf(), null);
  assert.equal(shopify.state.deletes, 1);
});

test("estrategia delete: si otro dispositivo escribió antes de borrar, cuenta como conflicto y se reintenta", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] } });
  const admin = adminFor(shopify);
  let reads = 0;
  const racingAdmin = {
    ...admin,
    async readWishlist(...args) {
      reads += 1;
      if (reads === 2) shopify.setList(FAKE_CUSTOMER_GID, ["2", "3"]); // alta simultánea
      return admin.readWishlist(...args);
    },
  };
  const result = await applyOpsWithCas({ admin: racingAdmin, customerGid: FAKE_CUSTOMER_GID, ops: { add: [], remove: ["2"] }, emptyListStrategy: "delete" });
  assert.deepEqual(result.items, [{ id: "3", handle: "c" }]);
  assert.deepEqual(shopify.listOf(), ["3"]);
  assert.equal(shopify.state.deletes, 0);
});

test("lista vacía sin metafield previo: no escribe nada", async () => {
  const shopify = createFakeShopify();
  const result = await run(shopify, { remove: ["2"] });
  assert.equal(result.writes, 0);
  assert.equal(shopify.listOf(), null);
});

test("producto borrado (nodes = null) se poda y va a notFound", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2", "9"] } });
  const result = await run(shopify, { add: ["8"] });
  assert.deepEqual(result.notFound, ["9", "8"]);
  assert.deepEqual(shopify.listOf(), ["2"]);
});

test("nodes() en lotes de 100 (lista heredada de 110 + alta)", async () => {
  const shopify = createFakeShopify({ catalog: bigCatalog(200), lists: { [FAKE_CUSTOMER_GID]: range(1, 110) } });
  const result = await run(shopify, { add: ["150"] });
  assert.deepEqual(result.rejected, ["150"]);
  assert.equal(result.items.length, 110);
  const lookups = shopify.state.calls.filter((call) => call.op === "RadaelliLookupProducts");
  assert.deepEqual(lookups.map((call) => call.variables.ids.length), [100, 11]);
});

test("clienta inexistente en Admin -> AdminError no_customer", async () => {
  const shopify = createFakeShopify({ customers: new Set() });
  await assert.rejects(run(shopify, {}), (error) => error instanceof AdminError && error.kind === "no_customer");
});

test("throttle, HTTP 5xx, errores GraphQL -> clasificados", async () => {
  await assert.rejects(run(createFakeShopify({ throttle: true }), {}), (error) => error.kind === "admin_throttled");
  await assert.rejects(run(createFakeShopify({ httpStatus: 429 }), {}), (error) => error.kind === "admin_throttled");
  await assert.rejects(run(createFakeShopify({ httpStatus: 500 }), {}), (error) => error.kind === "admin_error" && error.detail === "http_500");
  await assert.rejects(run(createFakeShopify({ graphqlErrors: true }), {}), (error) => error.kind === "admin_error" && error.detail === "graphql_errors");
});

test("corte por señal (timeout) -> upstream_timeout, aunque fetch no responda nunca", async () => {
  const shopify = createFakeShopify({ hang: true });
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 20);
  await assert.rejects(run(shopify, {}, { signal: controller.signal }), (error) => error.kind === "upstream_timeout");
});

test("client credentials: un pedido de token por tienda, en memoria, form-urlencoded", async () => {
  const shopify = createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] } });
  const getAccessToken = createAccessTokenProvider({
    source: "client_credentials",
    apiKey: "FAKE-client-id-03d",
    apiSecret: "FAKE-secret",
    fetchImpl: shopify.fetch,
    nowMs: () => 1_000_000,
  });
  const admin = createAdminClient({ shop: FAKE_SHOP, apiVersion: "2026-07", getAccessToken, fetchImpl: shopify.fetch });
  await applyOpsWithCas({ admin, customerGid: FAKE_CUSTOMER_GID, ops: {} });
  await applyOpsWithCas({ admin, customerGid: FAKE_CUSTOMER_GID, ops: {} });
  assert.equal(shopify.state.tokenRequests, 1);
  const tokenCall = shopify.state.calls.find((call) => call.op === "token");
  assert.equal(tokenCall.url, `https://${FAKE_SHOP}/admin/oauth/access_token`);
  assert.equal(tokenCall.headers["Content-Type"], "application/x-www-form-urlencoded");
  assert.match(tokenCall.body, /grant_type=client_credentials/);
  const graphqlCall = shopify.state.calls.find((call) => call.op === "RadaelliReadWishlist");
  assert.equal(graphqlCall.headers["X-Shopify-Access-Token"], "FAKE-cc-token-1");
});
