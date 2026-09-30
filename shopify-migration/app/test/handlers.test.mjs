import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  startTestServer,
  createFakeShopify,
  postProxy,
  postCustomerAccount,
  signedProxyQuery,
  signJwtHS256,
  fakeSessionPayload,
  FAKE_CUSTOMER_GID,
  FAKE_CUSTOMER_ID,
  FAKE_SECRET,
  FAKE_ADMIN_TOKEN,
  FAKE_NOW_MS,
  FAKE_TS,
} from "./helpers.mjs";
import { computeWebhookHmac } from "../server/webhook-signature.mjs";
import { LIMITS } from "../server/wishlist-core.mjs";

const OTHER_CUSTOMER_GID = "gid://shopify/Customer/7000000000002"; // ⚠ FALSO

async function expectError(response, status, code) {
  assert.equal(response.status, status, `status esperado ${status}`);
  assert.deepEqual(await response.json(), { v: 1, error: code });
}

function assertBaseHeaders(response) {
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
}

describe("E1 /proxy/wishlist (app proxy)", () => {
  let app;
  before(async () => {
    app = await startTestServer({ shopify: createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2", "4"] } }) });
  });
  after(() => app.close());

  test("refresco (bootstrap/reconciliar): 200 con la lista canónica, sin escribir", async () => {
    const response = await postProxy(app.base, { v: 1, add: [], remove: [] });
    assert.equal(response.status, 200);
    assertBaseHeaders(response);
    assert.equal(response.headers.get("access-control-allow-origin"), null, "E1 es mismo origen: sin CORS");
    assert.deepEqual(await response.json(), {
      v: 1,
      items: [
        { id: "2", handle: "b" },
        { id: "4", handle: "d" },
      ],
      rejected: [],
      notFound: [],
    });
    assert.equal(app.shopify.state.writes, 0);
  });

  test("unión invitada -> cuenta: [B,D] + [A,B,C] = [B,D,A,C]; reenviar no escribe", async () => {
    const body = { v: 1, add: [{ id: "1", handle: "x" }, { id: "2", handle: "" }, { id: "3", handle: "c" }], remove: [] };
    const first = await postProxy(app.base, body);
    assert.equal(first.status, 200);
    const payload = await first.json();
    assert.deepEqual(payload.items.map((item) => item.id), ["2", "4", "1", "3"]);
    assert.equal(payload.items[2].handle, "a", "el handle lo da Shopify, no el cliente");
    const writes = app.shopify.state.writes;
    const second = await postProxy(app.base, body);
    assert.equal(second.status, 200);
    assert.equal(app.shopify.state.writes, writes);
  });

  test("quitar", async () => {
    const response = await postProxy(app.base, { v: 1, remove: ["4"] });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).items.map((item) => item.id), ["2", "1", "3"]);
  });

  test("alta inexistente -> notFound", async () => {
    const response = await postProxy(app.base, { v: 1, add: [{ id: "999" }] });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).notFound, ["999"]);
  });

  test("identidad = SOLO la firmada: body con customerId -> 400 y no se toca a nadie", async () => {
    const before = app.shopify.state.calls.length;
    await expectError(await postProxy(app.base, { v: 1, customerId: "7000000000002", add: [{ id: "1" }] }), 400, "invalid_body");
    assert.equal(app.shopify.state.calls.length, before, "no llegó a la Admin API");
  });

  test("headers con otra identidad se ignoran: se escribe en la clienta firmada", async () => {
    const response = await postProxy(app.base, { v: 1, add: [{ id: "4" }] }, {
      headers: { "X-Customer-Id": "7000000000002", "X-Shopify-Customer-Id": "7000000000002", "X-Logged-In-Customer-Id": "7000000000002" },
    });
    assert.equal(response.status, 200);
    const owners = app.shopify.state.calls.filter((call) => call.op === "RadaelliSetWishlist").map((call) => call.variables.metafields[0].ownerId);
    assert.ok(owners.length > 0);
    assert.ok(owners.every((owner) => owner === FAKE_CUSTOMER_GID));
    assert.equal(app.shopify.listOf(OTHER_CUSTOMER_GID), null);
  });

  test("401: firma inválida, sin firma, vencida, otra tienda, otro prefijo, anónima", async () => {
    const valid = signedProxyQuery();
    await expectError(await postProxy(app.base, {}, { query: valid.replace(FAKE_CUSTOMER_ID, "7000000000002") }), 401, "invalid_signature");
    await expectError(await postProxy(app.base, {}, { query: valid.replace(/&signature=[0-9a-f]+/, "") }), 401, "invalid_signature");
    await expectError(await postProxy(app.base, {}, { query: signedProxyQuery({ timestamp: FAKE_TS - 400 }) }), 401, "stale_request");
    await expectError(await postProxy(app.base, {}, { query: signedProxyQuery({ timestamp: FAKE_TS + 400 }) }), 401, "stale_request");
    await expectError(await postProxy(app.base, {}, { query: signedProxyQuery({ shop: "otra-fake.myshopify.com" }) }), 401, "shop_not_allowed");
    await expectError(await postProxy(app.base, {}, { query: signedProxyQuery({ pathPrefix: "/apps/otra" }) }), 401, "prefix_not_allowed");
    await expectError(await postProxy(app.base, {}, { query: signedProxyQuery({ customerId: "" }) }), 401, "no_customer");
    await expectError(await postProxy(app.base, {}, { query: signedProxyQuery({ customerId: null }) }), 401, "no_customer");
  });

  test("405 con Allow: POST", async () => {
    const response = await postProxy(app.base, null, { method: "GET" });
    await expectError(response, 405, "method_not_allowed");
    assert.equal(response.headers.get("allow"), "POST");
  });

  test("415 si no es application/json; 400 sin header anti-CSRF", async () => {
    await expectError(await postProxy(app.base, "{}", { headers: { "Content-Type": "text/plain" } }), 415, "unsupported_media_type");
    await expectError(await postProxy(app.base, "{}", { headers: { "Content-Type": "application/x-www-form-urlencoded" } }), 415, "unsupported_media_type");
    await expectError(await postProxy(app.base, {}, { headers: { "X-Radaelli-Wishlist": "0" } }), 400, "missing_csrf_header");
  });

  test("400: JSON inválido, schema, ids, overlap, demasiadas operaciones", async () => {
    await expectError(await postProxy(app.base, "{no-json"), 400, "invalid_json");
    await expectError(await postProxy(app.base, ""), 400, "invalid_json");
    await expectError(await postProxy(app.base, { v: 1, extra: true }), 400, "invalid_body");
    await expectError(await postProxy(app.base, { add: [{ id: "-5" }] }), 400, "invalid_id");
    await expectError(await postProxy(app.base, { add: [{ id: "1" }], remove: ["1"] }), 400, "overlap");
    const many = Array.from({ length: 257 }, (_, index) => String(index + 1));
    await expectError(await postProxy(app.base, { remove: many }), 400, "too_many_ops");
  });

  test("413 si el body supera 32 KB", async () => {
    const huge = JSON.stringify({ v: 1, add: [{ id: "1", handle: "x".repeat(LIMITS.MAX_BODY_BYTES) }] });
    await expectError(await postProxy(app.base, huge), 413, "body_too_large");
  });

  test("404 para rutas desconocidas", async () => {
    await expectError(await fetch(`${app.base}/proxy/otra`, { method: "POST" }), 404, "not_found");
  });
});

describe("E1: conflictos, throttle y timeout", () => {
  test("409 tras 3 conflictos de CAS", async () => {
    const app = await startTestServer({ shopify: createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] }, conflicts: 3 }) });
    try {
      await expectError(await postProxy(app.base, { add: [{ id: "1" }] }), 409, "conflict");
    } finally {
      await app.close();
    }
  });

  test("503 con throttle de la Admin API (con Retry-After)", async () => {
    const app = await startTestServer({ shopify: createFakeShopify({ throttle: true }) });
    try {
      const response = await postProxy(app.base, {});
      await expectError(response, 503, "admin_throttled");
      assert.equal(response.headers.get("retry-after"), "2");
    } finally {
      await app.close();
    }
  });

  test("502 con error de la Admin API", async () => {
    const app = await startTestServer({ shopify: createFakeShopify({ httpStatus: 500 }) });
    try {
      await expectError(await postProxy(app.base, {}), 502, "admin_error");
    } finally {
      await app.close();
    }
  });

  test("504 si Shopify no responde dentro del corte (UPSTREAM_TIMEOUT_MS)", async () => {
    const app = await startTestServer({ env: { UPSTREAM_TIMEOUT_MS: "50" }, shopify: createFakeShopify({ hang: true }) });
    try {
      const started = Date.now();
      await expectError(await postProxy(app.base, {}), 504, "upstream_timeout");
      assert.ok(Date.now() - started < 5000);
    } finally {
      await app.close();
    }
  });

  test("401 si la clienta firmada no existe en Admin", async () => {
    const app = await startTestServer({ shopify: createFakeShopify({ customers: new Set() }) });
    try {
      await expectError(await postProxy(app.base, {}), 401, "no_customer");
    } finally {
      await app.close();
    }
  });

  test("429 por clienta con token bucket (best effort) y Retry-After", async () => {
    const app = await startTestServer({ env: { RATE_LIMIT_BURST: "2", RATE_LIMIT_PER_MINUTE: "6" } });
    try {
      assert.equal((await postProxy(app.base, {})).status, 200);
      assert.equal((await postProxy(app.base, {})).status, 200);
      const limited = await postProxy(app.base, {});
      await expectError(limited, 429, "rate_limited");
      assert.equal(limited.headers.get("retry-after"), "10");
      // Otra clienta tiene su propio balde.
      assert.equal((await postProxy(app.base, {}, { query: signedProxyQuery({ customerId: "7000000000002" }) })).status, 200);
    } finally {
      await app.close();
    }
  });

  test("REQUIRE_CSRF_HEADER=false (si GO/NO-GO 8 falla) acepta sin el header", async () => {
    const app = await startTestServer({ env: { REQUIRE_CSRF_HEADER: "false" } });
    try {
      assert.equal((await postProxy(app.base, {}, { headers: { "X-Radaelli-Wishlist": "" } })).status, 200);
    } finally {
      await app.close();
    }
  });
});

describe("E2 /ca/wishlist (extensión con session token)", () => {
  let app;
  before(async () => {
    app = await startTestServer({ shopify: createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2", "4", "1"] } }) });
  });
  after(() => app.close());

  test("preflight OPTIONS -> 204 con CORS *", async () => {
    const response = await fetch(`${app.base}/ca/wishlist`, { method: "OPTIONS" });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.equal(response.headers.get("access-control-allow-methods"), "POST, OPTIONS");
    assert.equal(response.headers.get("access-control-allow-headers"), "Authorization, Content-Type");
    assert.equal(response.headers.get("access-control-max-age"), "600");
  });

  test("quitar con token válido -> 200 + CORS *", async () => {
    const response = await postCustomerAccount(app.base, { v: 1, remove: ["4"] });
    assert.equal(response.status, 200);
    assertBaseHeaders(response);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.deepEqual((await response.json()).items.map((item) => item.id), ["2", "1"]);
  });

  test("401: sin token, vencido, aud ajeno, alg none, sin sub, otra tienda (con CORS)", async () => {
    const noToken = await postCustomerAccount(app.base, {}, { token: null });
    assert.equal(noToken.headers.get("access-control-allow-origin"), "*");
    await expectError(noToken, 401, "missing_token");
    await expectError(await postCustomerAccount(app.base, {}, { token: signJwtHS256(fakeSessionPayload({ exp: FAKE_TS - 100, nbf: FAKE_TS - 400 })) }), 401, "token_expired");
    await expectError(await postCustomerAccount(app.base, {}, { token: signJwtHS256(fakeSessionPayload({ aud: "otra" })) }), 401, "invalid_token");
    await expectError(await postCustomerAccount(app.base, {}, { token: signJwtHS256(fakeSessionPayload(), FAKE_SECRET, { alg: "none" }) }), 401, "invalid_token");
    const { sub, ...noSub } = fakeSessionPayload();
    await expectError(await postCustomerAccount(app.base, {}, { token: signJwtHS256(noSub) }), 401, "no_customer");
    await expectError(await postCustomerAccount(app.base, {}, { token: signJwtHS256(fakeSessionPayload({ dest: "https://otra-fake.myshopify.com" })) }), 401, "shop_not_allowed");
  });

  test("el body no puede cambiar la clienta del token", async () => {
    await expectError(await postCustomerAccount(app.base, { v: 1, remove: ["2"], customerId: "7000000000002" }), 400, "invalid_body");
    const response = await postCustomerAccount(app.base, { v: 1 }, { headers: { "X-Customer-Id": "7000000000002" } });
    assert.equal(response.status, 200);
    const reads = app.shopify.state.calls.filter((call) => call.op === "RadaelliReadWishlist");
    assert.ok(reads.every((call) => call.variables.customerId === FAKE_CUSTOMER_GID));
  });

  test("405 / 415 / 400 / 413 en E2", async () => {
    const get = await fetch(`${app.base}/ca/wishlist`, { method: "GET" });
    await expectError(get, 405, "method_not_allowed");
    assert.equal(get.headers.get("allow"), "POST, OPTIONS");
    await expectError(await postCustomerAccount(app.base, "{}", { headers: { "Content-Type": "text/plain" } }), 415, "unsupported_media_type");
    await expectError(await postCustomerAccount(app.base, "nope"), 400, "invalid_json");
    await expectError(await postCustomerAccount(app.base, "x".repeat(LIMITS.MAX_BODY_BYTES + 1)), 413, "body_too_large");
  });
});

describe("E3 /webhooks (compliance, no-op)", () => {
  let app;
  before(async () => {
    app = await startTestServer();
  });
  after(() => app.close());

  test("HMAC válido -> 200 sin acción", async () => {
    const body = JSON.stringify({ shop_domain: "radaelli-fake.myshopify.com", customer: { id: 1 } });
    const response = await fetch(`${app.base}/webhooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Hmac-SHA256": computeWebhookHmac(Buffer.from(body), FAKE_SECRET), "X-Shopify-Topic": "customers/redact" },
      body,
    });
    assert.equal(response.status, 200);
    assert.equal(app.shopify.state.calls.length, 0);
  });

  test("HMAC inválido o ausente -> 401", async () => {
    const body = JSON.stringify({ x: 1 });
    await expectError(await fetch(`${app.base}/webhooks`, { method: "POST", headers: { "X-Shopify-Hmac-SHA256": computeWebhookHmac(Buffer.from(body), "otro") }, body }), 401, "invalid_signature");
    await expectError(await fetch(`${app.base}/webhooks`, { method: "POST", body }), 401, "invalid_signature");
  });
});

describe("GET / (sin panel)", () => {
  test("responde texto mínimo", async () => {
    const app = await startTestServer();
    try {
      const response = await fetch(`${app.base}/`);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /sin panel/);
    } finally {
      await app.close();
    }
  });
});

describe("logs sin datos personales", () => {
  test("ningún log contiene id de clienta, GID, email, firma, query firmada, token ni secreto", async () => {
    const app = await startTestServer({ shopify: createFakeShopify({ lists: { [FAKE_CUSTOMER_GID]: ["2"] } }) });
    const query = signedProxyQuery();
    const signature = new URLSearchParams(query).get("signature");
    const jwt = signJwtHS256(fakeSessionPayload());
    try {
      await postProxy(app.base, { v: 1, add: [{ id: "1" }] }, { query });
      await postProxy(app.base, { v: 1, email: "clienta.fake@example.com" }, { query });
      await postProxy(app.base, {}, { query: query.replace(FAKE_CUSTOMER_ID, "7000000000002") });
      await postProxy(app.base, {}, { query: signedProxyQuery({ customerId: "" }) });
      await postCustomerAccount(app.base, { v: 1, remove: ["1"] }, { token: jwt });
      await postCustomerAccount(app.base, {}, { token: `${jwt}x` });
      await postProxy(app.base, "{bad", { query, headers: { "X-Customer-Email": "clienta.fake@example.com" } });
    } finally {
      await app.close();
    }
    assert.ok(app.logLines.length >= 7, "hay una línea por request");
    const all = app.logLines.join("\n");
    const forbidden = [
      FAKE_CUSTOMER_ID,
      "7000000000002",
      "gid://shopify/Customer",
      "@",
      "clienta.fake",
      signature,
      "signature=",
      "logged_in_customer_id",
      "path_prefix",
      jwt.split(".")[1],
      jwt.split(".")[2],
      FAKE_SECRET,
      FAKE_ADMIN_TOKEN,
    ];
    for (const needle of forbidden) assert.ok(!all.includes(needle), `el log contiene algo prohibido: ${needle.slice(0, 12)}…`);
    for (const line of app.logLines) {
      const entry = JSON.parse(line);
      assert.equal(entry.event, "request");
      if (entry.subj !== undefined) assert.match(entry.subj, /^[0-9a-f]{12}$/);
    }
    const codes = app.logLines.map((line) => JSON.parse(line).code);
    assert.ok(codes.includes("ok") && codes.includes("invalid_signature") && codes.includes("no_customer"));
  });
});

describe("reloj", () => {
  test("usa el reloj inyectado (FAKE_NOW_MS) para la ventana", async () => {
    const app = await startTestServer({ nowMs: () => FAKE_NOW_MS + 400_000 });
    try {
      await expectError(await postProxy(app.base, {}), 401, "stale_request");
    } finally {
      await app.close();
    }
  });
});
