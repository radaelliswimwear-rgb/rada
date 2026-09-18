// Fase 2B (auditoría de pre-activación): este adapter no tenía ningún test
// -- la auditoría encontró que Meta Events Manager esperaba `user_agent`
// (uno de los 8 parámetros seleccionados a mano) pero el código nunca lo
// mandaba. Estos tests fijan: sin credenciales -> skip sin llamar a la red;
// con credenciales -> el payload real que se manda a Meta, con y sin
// user_agent disponible.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sendMetaCapiPurchase } from "./meta-capi";

function withFetchMock<T>(
  impl: (url: string, init: RequestInit) => Promise<Response>,
  fn: () => Promise<T>,
): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

function withEnv<T>(vars: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) previous[key] = process.env[key];
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return fn().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

const BASE_PAYLOAD = {
  eventId: "purchase:order-1",
  eventSourceUrl: "https://radaelliswimwear.com/checkout/confirmacion/order-1",
  value: 150000,
  currency: "COP",
  products: [
    { item_id: "sku-1", item_name: "Bikini Foam", quantity: 1, price: 150000, currency: "COP" },
  ],
};

test("sin META_CAPI_ACCESS_TOKEN/NEXT_PUBLIC_META_PIXEL_ID -> skip sin llamar a la red", async () => {
  await withEnv(
    { META_CAPI_ACCESS_TOKEN: undefined, NEXT_PUBLIC_META_PIXEL_ID: undefined },
    async () => {
      let fetchCalled = false;
      const result = await withFetchMock(
        async () => {
          fetchCalled = true;
          throw new Error("no debería llamarse");
        },
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      assert.equal(fetchCalled, false);
      assert.equal(result.success, false);
      assert.ok(!result.success && "skippedReason" in result);
    },
  );
});

test("con credenciales, sin userAgent -> manda el payload sin user_data, con timeout configurado", async () => {
  await withEnv(
    { META_CAPI_ACCESS_TOKEN: "token-test", NEXT_PUBLIC_META_PIXEL_ID: "pixel-test" },
    async () => {
      let capturedUrl = "";
      let capturedBody: unknown;
      let capturedInit: RequestInit | undefined;
      const result = await withFetchMock(
        async (url, init) => {
          capturedUrl = url;
          capturedInit = init;
          capturedBody = JSON.parse(init.body as string);
          return new Response(JSON.stringify({}), { status: 200 });
        },
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, true);
      assert.match(capturedUrl, /graph\.facebook\.com/);
      assert.match(capturedUrl, /pixel-test/);
      assert.match(capturedUrl, /token-test/);
      assert.ok(capturedInit?.signal, "debe mandar un AbortSignal (timeout)");
      const event = (capturedBody as { data: Array<Record<string, unknown>> }).data[0]!;
      assert.equal(event.event_name, "Purchase");
      assert.equal(event.event_id, "purchase:order-1");
      assert.equal(event.action_source, "website");
      assert.equal("user_data" in event, false, "sin userAgent no debe mandar user_data");
      const customData = event.custom_data as Record<string, unknown>;
      assert.equal(customData.currency, "COP");
      assert.equal(customData.value, 150000);
      // Sin PII: nunca email/teléfono/nombre/IP/fbc/fbp.
      assert.equal(JSON.stringify(event).includes("email"), false);
      assert.equal(JSON.stringify(event).includes("fbc"), false);
      assert.equal(JSON.stringify(event).includes("fbp"), false);
    },
  );
});

test("con credenciales y userAgent -> manda client_user_agent dentro de user_data", async () => {
  await withEnv(
    { META_CAPI_ACCESS_TOKEN: "token-test", NEXT_PUBLIC_META_PIXEL_ID: "pixel-test" },
    async () => {
      let capturedBody: unknown;
      await withFetchMock(
        async (_url, init) => {
          capturedBody = JSON.parse(init.body as string);
          return new Response(JSON.stringify({}), { status: 200 });
        },
        () =>
          sendMetaCapiPurchase({
            ...BASE_PAYLOAD,
            userAgent: "Mozilla/5.0 (test)",
          }),
      );
      const event = (capturedBody as { data: Array<Record<string, unknown>> }).data[0]!;
      assert.deepEqual(event.user_data, { client_user_agent: "Mozilla/5.0 (test)" });
    },
  );
});

test("respuesta no-ok de Meta -> success:false con el status, nunca el token en el mensaje", async () => {
  await withEnv(
    { META_CAPI_ACCESS_TOKEN: "token-secreto", NEXT_PUBLIC_META_PIXEL_ID: "pixel-test" },
    async () => {
      const result = await withFetchMock(
        async () =>
          new Response("Invalid OAuth access token", { status: 401 }),
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, false);
      assert.ok(!result.success && "error" in result);
      const message = !result.success && "error" in result ? result.error : "";
      assert.match(message, /401/);
      assert.equal(message.includes("token-secreto"), false);
    },
  );
});
