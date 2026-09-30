import { test } from "node:test";
import assert from "node:assert/strict";
import { computeProxySignature, proxyMessage, verifyProxyRequest, rawQueryOf, isAllowedShop } from "../server/proxy-signature.mjs";
import { FAKE_SECRET, FAKE_SHOP, FAKE_TS, FAKE_CUSTOMER_ID, signedProxyQuery, signQueryIndependently } from "./helpers.mjs";

// Vector OFICIAL de shopify.dev (authenticate-app-proxies), secreto "hush".
// La doc muestra el host como placeholder; las firmas publicadas se
// reproducen con shop=shop-name.myshopify.com (diseño § 5.2, probe-official.mjs).
const OFFICIAL_LOGGED_IN =
  "extra=1&extra=2&shop=shop-name.myshopify.com&logged_in_customer_id=1&path_prefix=%2Fapps%2Fawesome_reviews&timestamp=1317327555";
const OFFICIAL_ANONYMOUS =
  "extra=1&extra=2&shop=shop-name.myshopify.com&logged_in_customer_id=&path_prefix=%2Fapps%2Fawesome_reviews&timestamp=1317327555";

// Vector FALSO de Radaelli (diseño § 5.3). ⚠ Secreto, tienda e ids FALSOS.
const FAKE_QUERY = `shop=${FAKE_SHOP}&logged_in_customer_id=7000000000001&path_prefix=%2Fapps%2Fradaelli&timestamp=${FAKE_TS}`;
const FAKE_QUERY_ANON = `shop=${FAKE_SHOP}&logged_in_customer_id=&path_prefix=%2Fapps%2Fradaelli&timestamp=${FAKE_TS}`;
const FAKE_SIGNATURE = "8f649bdd8f4f3a51dec71ec1768714868f8c23580fbd86ad2743a0780a7e3de7";
const FAKE_SIGNATURE_ANON = "fe21a300cad63bd67f17a3af80d70832c2960b92e541805615fef14945f328c8";

const options = {
  secret: FAKE_SECRET,
  nowSec: FAKE_TS + 10,
  maxSkewSec: 300,
  allowedShops: [FAKE_SHOP],
  allowedPathPrefixes: ["/apps/radaelli"],
};

test("vector oficial con sesión (hush) se reproduce", () => {
  assert.equal(computeProxySignature(OFFICIAL_LOGGED_IN, "hush"), "4c68c8624d737112c91818c11017d24d334b524cb5c2b8ba08daa056f7395ddb");
});

test("vector oficial anónimo (hush) se reproduce", () => {
  assert.equal(computeProxySignature(OFFICIAL_ANONYMOUS, "hush"), "e072b6d7e6622d85912a5214b860d3100dc1e73d9bc29f43796ac8c9ff8093cb");
});

test("vector oficial: mensaje con valores repetidos unidos por coma y path_prefix decodificado", () => {
  assert.equal(
    proxyMessage(OFFICIAL_LOGGED_IN),
    "extra=1,2logged_in_customer_id=1path_prefix=/apps/awesome_reviewsshop=shop-name.myshopify.comtimestamp=1317327555",
  );
});

test("vector FALSO (secreto FAKE-03D-…-NOT-REAL): mensaje y firma del diseño", () => {
  assert.equal(proxyMessage(FAKE_QUERY), "logged_in_customer_id=7000000000001path_prefix=/apps/radaellishop=radaelli-fake.myshopify.comtimestamp=1790000000");
  assert.equal(computeProxySignature(FAKE_QUERY, FAKE_SECRET), FAKE_SIGNATURE);
  assert.equal(computeProxySignature(FAKE_QUERY_ANON, FAKE_SECRET), FAKE_SIGNATURE_ANON);
});

test("vector FALSO válido -> identidad = GID del id firmado", () => {
  const result = verifyProxyRequest(`${FAKE_QUERY}&signature=${FAKE_SIGNATURE}`, options);
  assert.deepEqual(result, {
    ok: true,
    shop: FAKE_SHOP,
    customerId: "7000000000001",
    customerGid: "gid://shopify/Customer/7000000000001",
  });
});

test("anónimo con firma válida -> no_customer", () => {
  assert.deepEqual(verifyProxyRequest(`${FAKE_QUERY_ANON}&signature=${FAKE_SIGNATURE_ANON}`, options), { ok: false, reason: "no_customer" });
});

test("sin logged_in_customer_id (parámetro ausente, bien firmado) -> no_customer", () => {
  const query = signedProxyQuery({ customerId: null });
  assert.equal(verifyProxyRequest(query, options).reason, "no_customer");
});

test("parámetro alterado con la misma firma -> invalid_signature", () => {
  const tampered = FAKE_QUERY.replace("7000000000001", "7000000000002");
  assert.equal(verifyProxyRequest(`${tampered}&signature=${FAKE_SIGNATURE}`, options).reason, "invalid_signature");
});

test("parámetro agregado sin volver a firmar -> invalid_signature", () => {
  assert.equal(verifyProxyRequest(`${FAKE_QUERY}&extra=1&signature=${FAKE_SIGNATURE}`, options).reason, "invalid_signature");
});

test("sin signature -> invalid_signature", () => {
  assert.equal(verifyProxyRequest(FAKE_QUERY, options).reason, "invalid_signature");
});

test("signature duplicada -> invalid_signature", () => {
  assert.equal(verifyProxyRequest(`${FAKE_QUERY}&signature=${FAKE_SIGNATURE}&signature=${FAKE_SIGNATURE}`, options).reason, "invalid_signature");
});

test("signature con formato inválido (mayúsculas / corta) -> invalid_signature", () => {
  assert.equal(verifyProxyRequest(`${FAKE_QUERY}&signature=${FAKE_SIGNATURE.toUpperCase()}`, options).reason, "invalid_signature");
  assert.equal(verifyProxyRequest(`${FAKE_QUERY}&signature=${FAKE_SIGNATURE.slice(0, 62)}`, options).reason, "invalid_signature");
});

test("secreto equivocado -> invalid_signature", () => {
  assert.equal(verifyProxyRequest(`${FAKE_QUERY}&signature=${FAKE_SIGNATURE}`, { ...options, secret: "otro-secreto-FAKE" }).reason, "invalid_signature");
});

test("query vacía o gigante -> invalid_signature", () => {
  assert.equal(verifyProxyRequest("", options).reason, "invalid_signature");
  assert.equal(verifyProxyRequest(`${FAKE_QUERY}&pad=${"x".repeat(5000)}`, options).reason, "invalid_signature");
});

test("parámetros reordenados: la firma sigue siendo válida", () => {
  const reordered = `timestamp=${FAKE_TS}&path_prefix=%2Fapps%2Fradaelli&signature=${FAKE_SIGNATURE}&logged_in_customer_id=7000000000001&shop=${FAKE_SHOP}`;
  assert.equal(verifyProxyRequest(reordered, options).ok, true);
});

test("parámetros repetidos: se unen con coma antes de firmar", () => {
  const pairs = [["shop", FAKE_SHOP], ["logged_in_customer_id", FAKE_CUSTOMER_ID], ["path_prefix", "/apps/radaelli"], ["timestamp", String(FAKE_TS)], ["x", "1"], ["x", "2"]];
  const signature = signQueryIndependently(pairs);
  const query = `${new URLSearchParams(pairs)}&signature=${signature}`;
  assert.equal(verifyProxyRequest(query, options).ok, true);
  // Unir distinto (una sola "x=1,2" vs dos valores) firma el MISMO mensaje:
  assert.equal(proxyMessage("x=1&x=2"), proxyMessage("x=1%2C2"));
});

test("orden: se ordenan los strings k=v, no las claves (a-b antes que a=)", () => {
  assert.equal(proxyMessage("a=1&a-b=2"), "a-b=2a=1");
});

test("logged_in_customer_id repetido y bien firmado -> no_customer (nunca se elige uno)", () => {
  const query = signedProxyQuery({ extra: [["logged_in_customer_id", "7000000000002"]] });
  assert.equal(verifyProxyRequest(query, options).reason, "no_customer");
});

test("logged_in_customer_id no numérico o con cero inicial -> no_customer", () => {
  assert.equal(verifyProxyRequest(signedProxyQuery({ customerId: "abc" }), options).reason, "no_customer");
  assert.equal(verifyProxyRequest(signedProxyQuery({ customerId: "0123" }), options).reason, "no_customer");
  assert.equal(verifyProxyRequest(signedProxyQuery({ customerId: "gid://shopify/Customer/1" }), options).reason, "no_customer");
});

test("otra tienda bien firmada -> shop_not_allowed", () => {
  assert.equal(verifyProxyRequest(signedProxyQuery({ shop: "otra-fake.myshopify.com" }), options).reason, "shop_not_allowed");
});

test("tienda de la allowlist con otro dominio o sufijo -> shop_not_allowed", () => {
  assert.equal(verifyProxyRequest(signedProxyQuery({ shop: "radaelli-fake.myshopify.com.evil.example" }), options).reason, "shop_not_allowed");
  assert.equal(verifyProxyRequest(signedProxyQuery({ shop: "radaelli-fake.example.com" }), { ...options, allowedShops: ["radaelli-fake.example.com"] }).reason, "shop_not_allowed");
});

test("tienda en mayúsculas: se compara sin distinguir mayúsculas", () => {
  const result = verifyProxyRequest(signedProxyQuery({ shop: "RADAELLI-FAKE.myshopify.com" }), options);
  assert.equal(result.ok, true);
  assert.equal(result.shop, FAKE_SHOP);
  assert.equal(isAllowedShop("Radaelli-Fake.MyShopify.com", [FAKE_SHOP]), true);
});

test("path_prefix fuera de la allowlist -> prefix_not_allowed", () => {
  assert.equal(verifyProxyRequest(signedProxyQuery({ pathPrefix: "/apps/otra" }), options).reason, "prefix_not_allowed");
});

test("timestamp viejo (+301 s) y futuro (-301 s) -> stale_request; en el borde (300 s) pasa", () => {
  const query = `${FAKE_QUERY}&signature=${FAKE_SIGNATURE}`;
  assert.equal(verifyProxyRequest(query, { ...options, nowSec: FAKE_TS + 301 }).reason, "stale_request");
  assert.equal(verifyProxyRequest(query, { ...options, nowSec: FAKE_TS - 301 }).reason, "stale_request");
  assert.equal(verifyProxyRequest(query, { ...options, nowSec: FAKE_TS + 300 }).ok, true);
  assert.equal(verifyProxyRequest(query, { ...options, nowSec: FAKE_TS - 300 }).ok, true);
});

test("ventana configurable", () => {
  const query = `${FAKE_QUERY}&signature=${FAKE_SIGNATURE}`;
  assert.equal(verifyProxyRequest(query, { ...options, nowSec: FAKE_TS + 61, maxSkewSec: 60 }).reason, "stale_request");
});

test("timestamp no numérico (bien firmado) -> stale_request", () => {
  assert.equal(verifyProxyRequest(signedProxyQuery({ timestamp: "ayer" }), options).reason, "stale_request");
});

test("rawQueryOf toma la query cruda sin decodificar", () => {
  assert.equal(rawQueryOf("/proxy/wishlist?a=%2F&b=+"), "a=%2F&b=+");
  assert.equal(rawQueryOf("/proxy/wishlist"), "");
});
