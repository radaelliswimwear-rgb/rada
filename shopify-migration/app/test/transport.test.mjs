/**
 * Transporte del app embed (E4) contra el contrato de theme-src/assets/wishlist.js.
 * Se ejecuta el archivo REAL en un contexto vm con window/document/fetch falsos.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SOURCE = readFileSync(new URL("../extensions/wishlist-transport/assets/wishlist-transport.js", import.meta.url), "utf8");

function load({ fetchImpl, configJson = '{"accountPageUrl":"/account"}', preloaded = null, timers = {} } = {}) {
  const context = {
    AbortController,
    JSON,
    Array,
    String,
    Error,
    Promise,
    setTimeout: timers.setTimeout ?? setTimeout,
    clearTimeout: timers.clearTimeout ?? clearTimeout,
    fetch: fetchImpl,
    document: {
      getElementById: (id) => (id === "radaelli-wishlist-transport-config" && configJson !== null ? { textContent: configJson } : null),
    },
  };
  context.window = context;
  if (preloaded) context.Radaelli = preloaded;
  vm.runInNewContext(SOURCE, context, { filename: "wishlist-transport.js" });
  return context;
}

const json = (status, body, type = "application/json; charset=utf-8") =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "content-type": type } });

test("wishlist.js cargó antes: conecta con connectAccount", () => {
  let received = null;
  const context = load({ preloaded: { wishlist: { connectAccount: (transport) => (received = transport) } } });
  assert.ok(received && typeof received.apply === "function");
  assert.equal(context.Radaelli.wishlistAccountTransport, undefined);
});

test("wishlist.js todavía no cargó: deja el transporte en espera sin pisar window.Radaelli", () => {
  const existing = { RadaelliElement: class {} };
  const context = load({ preloaded: existing });
  assert.equal(context.Radaelli, existing);
  assert.equal(typeof context.Radaelli.wishlistAccountTransport.apply, "function");
  assert.equal(context.Radaelli.wishlistAccountTransport.accountPageUrl, "/account");
});

test("accountPageUrl solo acepta rutas propias o https", () => {
  assert.equal(load({ configJson: '{"accountPageUrl":"javascript:alert(1)"}' }).Radaelli.wishlistAccountTransport.accountPageUrl, "");
  assert.equal(load({ configJson: '{"accountPageUrl":"//evil.example"}' }).Radaelli.wishlistAccountTransport.accountPageUrl, "");
  // 03E (SEC-05): "/\host" = "//host" para el parser URL de WHATWG.
  assert.equal(new URL("/\\evil.example/x", "https://tienda.example").host, "evil.example");
  assert.equal(load({ configJson: '{"accountPageUrl":"/\\\\evil.example/x"}' }).Radaelli.wishlistAccountTransport.accountPageUrl, "");
  assert.equal(load({ configJson: '{"accountPageUrl":"https://shopify.com/1/account/pages/x"}' }).Radaelli.wishlistAccountTransport.accountPageUrl, "https://shopify.com/1/account/pages/x");
  assert.equal(load({ configJson: null }).Radaelli.wishlistAccountTransport.accountPageUrl, "");
  assert.equal(load({ configJson: "{roto" }).Radaelli.wishlistAccountTransport.accountPageUrl, "");
});

test("apply: POST mismo origen a /apps/radaelli/wishlist con JSON, header anti-CSRF y SIN id de clienta", async () => {
  let request = null;
  const context = load({
    fetchImpl: async (url, init) => {
      request = { url, init };
      return json(200, { v: 1, items: [{ id: "2", handle: "b" }], rejected: [], notFound: [] });
    },
  });
  const result = await context.Radaelli.wishlistAccountTransport.apply({ add: [{ id: "1", handle: "a" }, { id: 3 }], remove: ["4"] });
  assert.deepEqual(result.items, [{ id: "2", handle: "b" }]);
  assert.equal(request.url, "/apps/radaelli/wishlist");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.credentials, "same-origin");
  assert.equal(request.init.headers["Content-Type"], "application/json");
  assert.equal(request.init.headers["X-Radaelli-Wishlist"], "1");
  assert.deepEqual(JSON.parse(request.init.body), { v: 1, add: [{ id: "1", handle: "a" }, { id: "3", handle: "" }], remove: ["4"] });
});

test("apply: 401 se propaga como status 401 (wishlist.js no reintenta)", async () => {
  const context = load({ fetchImpl: async () => json(401, { v: 1, error: "no_customer" }) });
  await assert.rejects(context.Radaelli.wishlistAccountTransport.apply({ add: [], remove: [] }), (error) => error.status === 401);
});

test("apply: 409 / 5xx se propagan con su status", async () => {
  for (const status of [409, 502, 503, 504]) {
    const context = load({ fetchImpl: async () => json(status, { v: 1, error: "x" }) });
    await assert.rejects(context.Radaelli.wishlistAccountTransport.apply({}), (error) => error.status === status);
  }
});

test("apply: respuesta HTML (página de error de Shopify) -> status 502", async () => {
  const context = load({ fetchImpl: async () => json(200, "<html>", "text/html") });
  await assert.rejects(context.Radaelli.wishlistAccountTransport.apply({}), (error) => error.status === 502);
});

test("apply: error de red -> status 0", async () => {
  const context = load({ fetchImpl: async () => { throw new TypeError("Failed to fetch"); } });
  await assert.rejects(context.Radaelli.wishlistAccountTransport.apply({}), (error) => error.status === 0);
});

test("apply: timeout de 10 s aborta y da status 0 (libera el Web Lock)", async () => {
  let scheduledMs = null;
  let fire = null;
  const context = load({
    timers: {
      setTimeout: (fn, ms) => {
        scheduledMs = ms;
        fire = fn;
        return 1;
      },
      clearTimeout: () => {},
    },
    fetchImpl: (_url, init) =>
      new Promise((_, reject) => {
        init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      }),
  });
  const pending = context.Radaelli.wishlistAccountTransport.apply({});
  assert.equal(scheduledMs, 10000);
  fire();
  await assert.rejects(pending, (error) => error.status === 0);
});
