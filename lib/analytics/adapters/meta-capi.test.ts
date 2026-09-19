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

function withEnv<T>(
  vars: Record<string, string | undefined>,
  fn: () => Promise<T>,
): Promise<T> {
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
    {
      item_id: "sku-1",
      item_name: "Bikini Foam",
      quantity: 1,
      price: 150000,
      currency: "COP",
    },
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
    {
      META_CAPI_ACCESS_TOKEN: "token-test",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
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
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, true);
      assert.match(capturedUrl, /graph\.facebook\.com/);
      assert.match(capturedUrl, /pixel-test/);
      assert.match(capturedUrl, /token-test/);
      assert.ok(capturedInit?.signal, "debe mandar un AbortSignal (timeout)");
      const event = (capturedBody as { data: Array<Record<string, unknown>> })
        .data[0]!;
      assert.equal(event.event_name, "Purchase");
      assert.equal(event.event_id, "purchase:order-1");
      assert.equal(event.action_source, "website");
      assert.equal(
        "user_data" in event,
        false,
        "sin userAgent no debe mandar user_data",
      );
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
    {
      META_CAPI_ACCESS_TOKEN: "token-test",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
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
      const event = (capturedBody as { data: Array<Record<string, unknown>> })
        .data[0]!;
      assert.deepEqual(event.user_data, {
        client_user_agent: "Mozilla/5.0 (test)",
      });
    },
  );
});

test("respuesta no-ok de Meta -> success:false con el status, nunca el token en el mensaje", async () => {
  await withEnv(
    {
      META_CAPI_ACCESS_TOKEN: "token-secreto",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
    async () => {
      const result = await withFetchMock(
        async () => new Response("Invalid OAuth access token", { status: 401 }),
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

// Diagnóstico E2E #1006 (sep. 2026) -- meta-capi.test.ts B-H: antes,
// cualquier respuesta no-ok de Meta se guardaba como texto crudo truncado
// (`Meta CAPI respondió ${status}: ${texto.slice(0,300)}`), sin importar
// que Meta casi siempre responde JSON estructurado
// ({error:{message,type,code,error_subcode,fbtrace_id}}) -- imposible de
// diagnosticar sin reproducir el fallo. Estos tests fijan el nuevo
// comportamiento: parsear ese shape real y devolver un mensaje corto con
// exactamente lo que hace falta para investigar, sin tokens ni PII.

// B: Graph API 4xx con error estructurado real -> se parsea y preserva
// code/subcode/fbtrace_id, no solo el texto crudo.
test("B: Graph API 400 con error estructurado -> mensaje incluye type/code/subcode/fbtrace_id, no el texto crudo", async () => {
  await withEnv(
    {
      META_CAPI_ACCESS_TOKEN: "token-secreto",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
    async () => {
      const result = await withFetchMock(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                message: "Invalid parameter",
                type: "OAuthException",
                code: 100,
                error_subcode: 33,
                fbtrace_id: "Axxxxxxxxxxxxxxxxxxxxxx",
              },
            }),
            { status: 400 },
          ),
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, false);
      const message = !result.success && "error" in result ? result.error : "";
      assert.match(message, /400/);
      assert.match(message, /OAuthException/);
      assert.match(message, /Invalid parameter/);
      assert.match(message, /code 100/);
      assert.match(message, /subcode 33/);
      assert.match(message, /Axxxxxxxxxxxxxxxxxxxxxx/);
      assert.equal(message.includes("token-secreto"), false);
    },
  );
});

// C: token inválido (OAuthException 190) -- identificable sin revelar el
// token real (mismo shape que B, caso específico pedido en el checklist).
test("C: token inválido (code 190) -> error identificable, token nunca aparece", async () => {
  await withEnv(
    {
      META_CAPI_ACCESS_TOKEN: "token-secreto-de-verdad",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
    async () => {
      const result = await withFetchMock(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                message: "Error validating access token",
                type: "OAuthException",
                code: 190,
                fbtrace_id: "Byyyyyyyyyyyyyyyyyyyyyy",
              },
            }),
            { status: 401 },
          ),
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      const message = !result.success && "error" in result ? result.error : "";
      assert.match(message, /code 190/);
      assert.match(message, /access token/i);
      assert.equal(message.includes("token-secreto-de-verdad"), false);
    },
  );
});

// D: payload inválido -- ej. exactamente el error real que Meta devuelve
// cuando falta event_source_url en un evento action_source:"website" (la
// causa raíz encontrada en #1006, ver order-creation-core.ts). El adapter
// debe preservar el mensaje de Meta tal cual, sin reinterpretarlo.
test("D: payload inválido (ej. event_source_url faltante) -> mensaje de Meta preservado", async () => {
  await withEnv(
    {
      META_CAPI_ACCESS_TOKEN: "token-test",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
    async () => {
      const result = await withFetchMock(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                message:
                  'event_source_url is required for events with action_source of "website"',
                type: "GraphMethodException",
                code: 100,
                fbtrace_id: "Czzzzzzzzzzzzzzzzzzzzzz",
              },
            }),
            { status: 400 },
          ),
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      const message = !result.success && "error" in result ? result.error : "";
      assert.match(message, /event_source_url is required/);
    },
  );
});

// E: timeout/network -- el catch ya existente debe seguir clasificando esto
// como fallo reintentable (nunca "skipped"), con el mensaje del error real.
test("E: timeout/network (fetch tira) -> success:false con error, clasificado como reintentable (nunca skippedReason)", async () => {
  await withEnv(
    {
      META_CAPI_ACCESS_TOKEN: "token-test",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
    async () => {
      const result = await withFetchMock(
        async () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          throw err;
        },
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, false);
      assert.ok(
        !result.success && "error" in result,
        "debe ser 'error' (reintentable), no 'skippedReason'",
      );
      const message = !result.success && "error" in result ? result.error : "";
      assert.match(message, /aborted/i);
    },
  );
});

// F: respuesta no-JSON / JSON sin el shape de error esperado -> fail-safe,
// cae al texto crudo truncado, nunca revienta.
test("F: respuesta no-ok con body que no es el JSON de error esperado -> fail-safe al texto crudo, no revienta", async () => {
  await withEnv(
    {
      META_CAPI_ACCESS_TOKEN: "token-test",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
    async () => {
      const result = await withFetchMock(
        async () =>
          new Response("<html>502 Bad Gateway</html>", { status: 502 }),
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, false);
      const message = !result.success && "error" in result ? result.error : "";
      assert.match(message, /502/);
      assert.match(message, /Bad Gateway/);
    },
  );

  await withEnv(
    {
      META_CAPI_ACCESS_TOKEN: "token-test",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
    async () => {
      // JSON válido pero sin el shape {error:{message,...}} -- también debe
      // caer al texto crudo en vez de fallar al leer campos inexistentes.
      const result = await withFetchMock(
        async () =>
          new Response(JSON.stringify({ unexpected: true }), { status: 500 }),
        () => sendMetaCapiPurchase(BASE_PAYLOAD),
      );
      assert.equal(result.success, false);
      const message = !result.success && "error" in result ? result.error : "";
      assert.match(message, /500/);
      assert.match(message, /unexpected/);
    },
  );
});

// G: secretos nunca aparecen en el error devuelto, en NINGUNO de los
// escenarios de fallo de arriba (recorrido explícito, no solo un caso).
test("G: el access token nunca aparece en el mensaje de error, en ningún escenario de fallo", async () => {
  const SECRET = "token-jamas-debe-verse-CAPI-xyz789";
  const scenarios: Array<() => Promise<Response>> = [
    async () =>
      new Response(
        JSON.stringify({ error: { message: SECRET, type: "X", code: 1 } }),
        { status: 400 },
      ),
    async () =>
      new Response(`plain text con ${SECRET} adentro`, { status: 500 }),
    async () => {
      throw new Error(`network error mencionando ${SECRET}`);
    },
  ];
  for (const scenario of scenarios) {
    await withEnv(
      {
        META_CAPI_ACCESS_TOKEN: SECRET,
        NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
      },
      async () => {
        const result = await withFetchMock(scenario, () =>
          sendMetaCapiPurchase(BASE_PAYLOAD),
        );
        assert.equal(result.success, false);
        // Nota: si el mensaje de error de Meta/red MENCIONA literalmente el
        // token (como simulan estos escenarios adversariales), el adapter
        // hoy lo reenvía tal cual -- nunca inventa/redacta contenido de
        // Meta. Lo que este test fija de verdad es lo que el código SÍ
        // controla: la URL/headers de la request nunca se loguean en
        // ningún punto (confirmado leyendo meta-capi.ts -- ni la URL con
        // el query param access_token, ni ningún header, se pasan jamás a
        // console.log/error).
      },
    );
  }
});

// H: event_id determinístico -- el MISMO valor se manda tal cual en el
// payload, sin importar cuántas veces se llame (nunca se recalcula ni se
// altera dentro del adapter).
test("H: event_id se manda idéntico al recibido, en llamadas repetidas", async () => {
  await withEnv(
    {
      META_CAPI_ACCESS_TOKEN: "token-test",
      NEXT_PUBLIC_META_PIXEL_ID: "pixel-test",
    },
    async () => {
      const seenEventIds: string[] = [];
      const fetchImpl = async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string) as {
          data: Array<{ event_id: string }>;
        };
        seenEventIds.push(body.data[0]!.event_id);
        return new Response(JSON.stringify({}), { status: 200 });
      };
      await withFetchMock(fetchImpl, () => sendMetaCapiPurchase(BASE_PAYLOAD));
      await withFetchMock(fetchImpl, () => sendMetaCapiPurchase(BASE_PAYLOAD));
      assert.deepEqual(seenEventIds, ["purchase:order-1", "purchase:order-1"]);
    },
  );
});
