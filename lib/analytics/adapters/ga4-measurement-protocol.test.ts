// Fase 2B (auditoría de pre-activación): el comentario de este adapter
// decía "escrito y probado" pero no existía ningún test -- la auditoría lo
// marcó como hallazgo menor. Este adapter sigue SIN conectarse a Purchase
// (ver el comentario al inicio de ga4-measurement-protocol.ts para el
// motivo real), pero queda cubierto igual: es código que ya existe en el
// repo y podría llamarse manualmente (ej. para validar contra el endpoint
// de debug de GA4), así que su contrato básico debe estar probado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sendGa4MeasurementProtocolPurchase } from "./ga4-measurement-protocol";

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
  clientId: "123456789.987654321",
  transactionId: "1042",
  value: 150000,
  currency: "COP",
  products: [
    { item_id: "sku-1", item_name: "Bikini Foam", quantity: 1, price: 150000, currency: "COP" },
  ],
};

test("sin GA4_MEASUREMENT_PROTOCOL_API_SECRET/NEXT_PUBLIC_GA4_MEASUREMENT_ID -> skip sin llamar a la red", async () => {
  await withEnv(
    {
      GA4_MEASUREMENT_PROTOCOL_API_SECRET: undefined,
      NEXT_PUBLIC_GA4_MEASUREMENT_ID: undefined,
    },
    async () => {
      let fetchCalled = false;
      const result = await withFetchMock(
        async () => {
          fetchCalled = true;
          throw new Error("no debería llamarse");
        },
        () => sendGa4MeasurementProtocolPurchase(BASE_PAYLOAD),
      );
      assert.equal(fetchCalled, false);
      assert.equal(result.success, false);
      assert.ok(!result.success && "skippedReason" in result);
    },
  );
});

test("con credenciales -> manda client_id/transaction_id/value/currency/items, con timeout configurado", async () => {
  await withEnv(
    {
      GA4_MEASUREMENT_PROTOCOL_API_SECRET: "secret-test",
      NEXT_PUBLIC_GA4_MEASUREMENT_ID: "G-TEST123",
    },
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
        () => sendGa4MeasurementProtocolPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, true);
      assert.match(capturedUrl, /google-analytics\.com\/mp\/collect/);
      assert.match(capturedUrl, /G-TEST123/);
      assert.match(capturedUrl, /secret-test/);
      assert.ok(capturedInit?.signal, "debe mandar un AbortSignal (timeout)");
      const body = capturedBody as {
        client_id: string;
        events: Array<{ name: string; params: Record<string, unknown> }>;
      };
      assert.equal(body.client_id, "123456789.987654321");
      assert.equal(body.events[0]!.name, "purchase");
      assert.equal(body.events[0]!.params.transaction_id, "1042");
      assert.equal(body.events[0]!.params.value, 150000);
      assert.equal(body.events[0]!.params.currency, "COP");
    },
  );
});

test("respuesta no-ok de GA4 -> success:false con el status, nunca el api_secret en el mensaje", async () => {
  await withEnv(
    {
      GA4_MEASUREMENT_PROTOCOL_API_SECRET: "secret-secreto",
      NEXT_PUBLIC_GA4_MEASUREMENT_ID: "G-TEST123",
    },
    async () => {
      const result = await withFetchMock(
        async () => new Response("invalid api_secret", { status: 400 }),
        () => sendGa4MeasurementProtocolPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, false);
      assert.ok(!result.success && "error" in result);
      const message = !result.success && "error" in result ? result.error : "";
      assert.match(message, /400/);
      assert.equal(message.includes("secret-secreto"), false);
    },
  );
});
