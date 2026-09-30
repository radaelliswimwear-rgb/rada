import { test } from "node:test";
import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import { verifySessionToken, bearerToken, destHost } from "../server/session-token.mjs";
import { FAKE_SECRET, FAKE_CLIENT_ID, FAKE_SHOP, FAKE_TS, FAKE_CUSTOMER_GID, signJwtHS256, fakeSessionPayload } from "./helpers.mjs";

const options = { secret: FAKE_SECRET, clientId: FAKE_CLIENT_ID, allowedShops: [FAKE_SHOP], nowSec: FAKE_TS + 10, leewaySec: 5 };
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

test("token FALSO válido -> clienta y tienda del token", () => {
  assert.deepEqual(verifySessionToken(signJwtHS256(fakeSessionPayload()), options), { ok: true, shop: FAKE_SHOP, customerGid: FAKE_CUSTOMER_GID });
});

test("vencido (now = ts + 400) -> expired; dentro de la tolerancia (exp + 5) pasa", () => {
  const token = signJwtHS256(fakeSessionPayload());
  assert.equal(verifySessionToken(token, { ...options, nowSec: FAKE_TS + 400 }).reason, "expired");
  assert.equal(verifySessionToken(token, { ...options, nowSec: FAKE_TS + 305 }).ok, true);
  assert.equal(verifySessionToken(token, { ...options, nowSec: FAKE_TS + 306 }).reason, "expired");
});

test("todavía no válido (nbf en el futuro) -> not_yet_valid", () => {
  const token = signJwtHS256(fakeSessionPayload({ nbf: FAKE_TS + 60 }));
  assert.equal(verifySessionToken(token, options).reason, "not_yet_valid");
});

test("sin exp o sin nbf -> rechazado", () => {
  const { exp, ...withoutExp } = fakeSessionPayload();
  const { nbf, ...withoutNbf } = fakeSessionPayload();
  assert.equal(verifySessionToken(signJwtHS256(withoutExp), options).reason, "expired");
  assert.equal(verifySessionToken(signJwtHS256(withoutNbf), options).reason, "not_yet_valid");
});

test("aud ajeno -> bad_aud", () => {
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload({ aud: "otra-app" })), options).reason, "bad_aud");
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload({ aud: [FAKE_CLIENT_ID] })), options).reason, "bad_aud");
});

test('alg "none" -> bad_alg (con firma vacía y aun con una firma HMAC correcta)', () => {
  const payload = b64(fakeSessionPayload());
  const header = b64({ alg: "none", typ: "JWT" });
  assert.equal(verifySessionToken(`${header}.${payload}.`, options).reason, "malformed");
  // Misma firma HMAC que aceptaría HS256: solo el chequeo de alg la frena.
  const signedAsNone = signJwtHS256(fakeSessionPayload(), FAKE_SECRET, { alg: "none", typ: "JWT" });
  assert.equal(verifySessionToken(signedAsNone, options).reason, "bad_alg");
});

test("alg RS256 / HS512 -> bad_alg", () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const header = b64({ alg: "RS256", typ: "JWT" });
  const payload = b64(fakeSessionPayload());
  const signature = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(privateKey).toString("base64url");
  assert.equal(verifySessionToken(`${header}.${payload}.${signature}`, options).reason, "bad_alg");
  const hs512 = signJwtHS256(fakeSessionPayload(), FAKE_SECRET, { alg: "HS512", typ: "JWT" });
  assert.equal(verifySessionToken(hs512, options).reason, "bad_alg");
});

test("firma inválida (otro secreto o payload alterado) -> bad_signature", () => {
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload(), "otro-secreto-FAKE"), options).reason, "bad_signature");
  const [head, , signature] = signJwtHS256(fakeSessionPayload()).split(".");
  const forged = b64(fakeSessionPayload({ sub: "gid://shopify/Customer/7000000000002" }));
  assert.equal(verifySessionToken(`${head}.${forged}.${signature}`, options).reason, "bad_signature");
});

test("sin sub (sin sesión) -> no_customer; sub que no es de cliente -> no_customer", () => {
  const { sub, ...withoutSub } = fakeSessionPayload();
  assert.equal(verifySessionToken(signJwtHS256(withoutSub), options).reason, "no_customer");
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload({ sub: "gid://shopify/Product/1" })), options).reason, "no_customer");
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload({ sub: "7000000000001" })), options).reason, "no_customer");
});

test("dest de otra tienda o mal formado -> bad_dest", () => {
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload({ dest: "https://otra-fake.myshopify.com" })), options).reason, "bad_dest");
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload({ dest: `http://${FAKE_SHOP}` })), options).reason, "bad_dest");
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload({ dest: 42 })), options).reason, "bad_dest");
});

test("dest sin esquema (formato sin verificar, GO/NO-GO 12) se acepta si es la tienda", () => {
  assert.equal(verifySessionToken(signJwtHS256(fakeSessionPayload({ dest: FAKE_SHOP })), options).ok, true);
  assert.equal(destHost(`https://${FAKE_SHOP}/`), FAKE_SHOP);
  assert.equal(destHost("https://user@radaelli-fake.myshopify.com"), null);
});

test("token mal formado -> malformed", () => {
  assert.equal(verifySessionToken("", options).reason, "malformed");
  assert.equal(verifySessionToken("a.b", options).reason, "malformed");
  assert.equal(verifySessionToken("a.b.c.d", options).reason, "malformed");
  assert.equal(verifySessionToken(`${b64([1])}.${b64({})}.x`, options).reason, "malformed");
  assert.equal(verifySessionToken("x".repeat(5000), options).reason, "malformed");
});

test("bearerToken extrae solo tokens con forma de JWT", () => {
  assert.equal(bearerToken("Bearer a.b.c"), "a.b.c");
  assert.equal(bearerToken("bearer a.b.c"), null);
  assert.equal(bearerToken("Basic abc"), null);
  assert.equal(bearerToken(undefined), null);
});
