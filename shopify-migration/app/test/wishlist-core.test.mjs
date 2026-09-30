import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyWishlistOps,
  validateOpsRequest,
  parseRequestId,
  productIdToGid,
  gidToProductId,
  toProductId,
  parseMetafieldList,
  serializeMetafieldList,
  LIMITS,
} from "../server/wishlist-core.mjs";
import { bigCatalog, range } from "./helpers.mjs";

// Ids FALSOS: A=1, B=2, C=3, D=4 (diseño § 7.2).
const A = "1";
const B = "2";
const C = "3";
const D = "4";
const catalog = new Map([[A, "a"], [B, "b"], [C, "c"], [D, "d"]]);

test("invitada {A,B,C} + cuenta {B,D} = [B,D,A,C]", () => {
  const result = applyWishlistOps([B, D], catalog, { add: [A, B, C], remove: [] });
  assert.deepEqual(result.next, [B, D, A, C]);
  assert.deepEqual(result.rejected, []);
  assert.deepEqual(result.notFound, []);
  assert.equal(result.changed, true);
});

test("idempotencia: reenviar la misma unión no cambia nada (0 escrituras)", () => {
  const first = applyWishlistOps([B, D], catalog, { add: [A, B, C] });
  const second = applyWishlistOps(first.next, catalog, { add: [A, B, C] });
  assert.deepEqual(second.next, [B, D, A, C]);
  assert.equal(second.changed, false);
});

test("refresco (sin add ni remove) no cambia nada", () => {
  const result = applyWishlistOps([B, D], catalog, {});
  assert.deepEqual(result.next, [B, D]);
  assert.equal(result.changed, false);
});

test("orden determinista: misma entrada, misma salida; la cuenta siempre primero", () => {
  const runs = Array.from({ length: 5 }, () => applyWishlistOps([D, B], catalog, { add: [C, A, B] }).next);
  for (const run of runs) assert.deepEqual(run, [D, B, C, A]);
});

test("duplicados en add se ignoran (primera aparición manda)", () => {
  assert.deepEqual(applyWishlistOps([], catalog, { add: [C, A, C, A] }).next, [C, A]);
});

test("quitar mantiene el orden del resto", () => {
  const result = applyWishlistOps([B, D, A, C], catalog, { remove: [D] });
  assert.deepEqual(result.next, [B, A, C]);
  assert.equal(result.changed, true);
});

test("quitar un id que no está es un no-op (sin escritura)", () => {
  const result = applyWishlistOps([B, D], catalog, { remove: [C] });
  assert.deepEqual(result.next, [B, D]);
  assert.equal(result.changed, false);
});

test("notFound: alta de un id inexistente y poda de uno de la lista que ya no existe", () => {
  const result = applyWishlistOps([B, "9"], catalog, { add: ["8", A] });
  assert.deepEqual(result.next, [B, A]);
  assert.deepEqual(result.notFound, ["9", "8"]);
  assert.equal(result.changed, true);
});

test("tope 100: 99 + [X,Y] -> X entra, Y rechazado", () => {
  const big = bigCatalog(200);
  const result = applyWishlistOps(range(1, 99), big, { add: ["150", "151"] });
  assert.equal(result.next.length, 100);
  assert.equal(result.next.at(-1), "150");
  assert.deepEqual(result.rejected, ["151"]);
});

test("tope 100: una alta que ya está no cuenta como nueva (no se rechaza)", () => {
  const big = bigCatalog(200);
  const result = applyWishlistOps(range(1, 100), big, { add: ["5", "150"] });
  assert.deepEqual(result.rejected, ["150"]);
  assert.equal(result.changed, false);
});

test("lista heredada de 110 NO se recorta; toda alta nueva se rechaza", () => {
  const big = bigCatalog(200);
  const legacy = range(1, 110);
  const result = applyWishlistOps(legacy, big, { add: ["150", "151"] });
  assert.deepEqual(result.next, legacy);
  assert.deepEqual(result.rejected, ["150", "151"]);
  assert.equal(result.changed, false);
});

test("lista heredada de 110: quitar uno deja 109 y el alta sigue rechazada (tope 100)", () => {
  const big = bigCatalog(200);
  const result = applyWishlistOps(range(1, 110), big, { add: ["150"], remove: ["1"] });
  assert.equal(result.next.length, 109);
  assert.deepEqual(result.rejected, ["150"]);
});

test("quitar y agregar en la misma operación libera lugar para el alta", () => {
  const big = bigCatalog(200);
  const result = applyWishlistOps(range(1, 100), big, { add: ["150"], remove: ["1"] });
  assert.equal(result.next.length, 100);
  assert.deepEqual(result.rejected, []);
  assert.equal(result.next.at(-1), "150");
});

test("invariante: nunca más de 128 (límite de Shopify)", () => {
  const big = bigCatalog(300);
  assert.throws(() => applyWishlistOps(range(1, 129), big, {}), /invariant/);
  assert.equal(LIMITS.SHOPIFY_LIST_MAX, 128);
});

test("normalización GID <-> numérico", () => {
  assert.equal(productIdToGid("123"), "gid://shopify/Product/123");
  assert.equal(productIdToGid(123), "gid://shopify/Product/123");
  assert.equal(gidToProductId("gid://shopify/Product/123"), "123");
  assert.equal(gidToProductId("gid://shopify/Customer/123"), null);
  assert.equal(gidToProductId("gid://shopify/Product/0"), null);
  assert.equal(toProductId("gid://shopify/Product/9"), "9");
  assert.equal(toProductId("9"), "9");
  assert.equal(toProductId("abc"), null);
  assert.throws(() => productIdToGid("gid://shopify/Product/1"));
});

test("parseRequestId: enteros positivos como string o número seguro", () => {
  assert.equal(parseRequestId("7"), "7");
  assert.equal(parseRequestId(7), "7");
  assert.equal(parseRequestId("12345678901234567890"), "12345678901234567890");
  for (const bad of ["0", "-1", "01", "1.5", " 1", "", "123456789012345678901", 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 2, null, {}, [], true]) {
    assert.equal(parseRequestId(bad), null, `debería rechazar ${JSON.stringify(bad)}`);
  }
});

test("metafield: GIDs en orden, sin duplicados ni basura; ida y vuelta", () => {
  const value = ["gid://shopify/Product/2", "gid://shopify/Product/4", "gid://shopify/Product/2", "gid://shopify/Collection/1", 5, "x"];
  assert.deepEqual(parseMetafieldList(value), ["2", "4"]);
  assert.deepEqual(parseMetafieldList(JSON.stringify(value)), ["2", "4"]);
  assert.deepEqual(parseMetafieldList("no-json"), []);
  assert.deepEqual(parseMetafieldList(null), []);
  assert.equal(serializeMetafieldList(["2", "4"]), '["gid://shopify/Product/2","gid://shopify/Product/4"]');
  assert.equal(serializeMetafieldList([]), "[]");
});

/* ---------------- schema del request ---------------- */

test("schema: body válido del transporte (ids string, handle vacío) y ids numéricos", () => {
  assert.deepEqual(validateOpsRequest({ v: 1, add: [{ id: "1", handle: "" }, { id: 2 }], remove: ["3", 4] }), {
    ok: true,
    value: { add: ["1", "2"], remove: ["3", "4"] },
  });
});

test("schema: cuerpo vacío = refresco válido", () => {
  assert.deepEqual(validateOpsRequest({}), { ok: true, value: { add: [], remove: [] } });
  assert.deepEqual(validateOpsRequest({ v: 1, add: [], remove: [] }), { ok: true, value: { add: [], remove: [] } });
});

test("schema: campos desconocidos -> invalid_body (arriba y dentro de add)", () => {
  assert.equal(validateOpsRequest({ v: 1, customerId: "7000000000002" }).error, "invalid_body");
  assert.equal(validateOpsRequest({ v: 1, email: "fake@example.com" }).error, "invalid_body");
  assert.equal(validateOpsRequest({ add: [{ id: "1", customer: "x" }] }).error, "invalid_body");
  assert.equal(validateOpsRequest(JSON.parse('{"__proto__": {"x": 1}}')).error, "invalid_body");
});

test("schema: versión distinta de 1 o tipos equivocados -> invalid_body", () => {
  assert.equal(validateOpsRequest({ v: 2 }).error, "invalid_body");
  assert.equal(validateOpsRequest({ add: "1" }).error, "invalid_body");
  assert.equal(validateOpsRequest({ add: null }).error, "invalid_body");
  assert.equal(validateOpsRequest({ remove: {} }).error, "invalid_body");
  assert.equal(validateOpsRequest({ add: ["1"] }).error, "invalid_body");
  assert.equal(validateOpsRequest({ add: [{ id: "1", handle: 5 }] }).error, "invalid_body");
  assert.equal(validateOpsRequest({ add: [{ id: "1", handle: "h".repeat(256) }] }).error, "invalid_body");
  for (const bad of [null, [], "x", 5]) assert.equal(validateOpsRequest(bad).error, "invalid_body");
});

test("schema: ids negativos, cero, decimales o GIDs -> invalid_id", () => {
  assert.equal(validateOpsRequest({ add: [{ id: "-1" }] }).error, "invalid_id");
  assert.equal(validateOpsRequest({ add: [{ id: -1 }] }).error, "invalid_id");
  assert.equal(validateOpsRequest({ add: [{ id: 0 }] }).error, "invalid_id");
  assert.equal(validateOpsRequest({ add: [{ id: 1.5 }] }).error, "invalid_id");
  assert.equal(validateOpsRequest({ add: [{}] }).error, "invalid_id");
  assert.equal(validateOpsRequest({ add: [{ id: "gid://shopify/Product/1" }] }).error, "invalid_id");
  assert.equal(validateOpsRequest({ remove: ["abc"] }).error, "invalid_id");
});

test("schema: arrays enormes -> too_many_ops (256 pasa, 257 no)", () => {
  const ok = validateOpsRequest({ add: range(1, 256).map((id) => ({ id })) });
  assert.equal(ok.ok, true);
  assert.equal(validateOpsRequest({ add: range(1, 257).map((id) => ({ id })) }).error, "too_many_ops");
  assert.equal(validateOpsRequest({ remove: range(1, 257) }).error, "too_many_ops");
  assert.equal(validateOpsRequest({ remove: Array.from({ length: 100000 }, () => "1") }).error, "too_many_ops");
});

test("schema: el mismo id en add y remove -> overlap", () => {
  assert.equal(validateOpsRequest({ add: [{ id: "1" }], remove: ["1"] }).error, "overlap");
  assert.equal(validateOpsRequest({ add: [{ id: 1 }], remove: ["1"] }).error, "overlap");
});
