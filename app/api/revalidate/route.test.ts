import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Pentest-handoff (sep. 2026): antes de este fix, un secreto ausente o
// incorrecto SÍ era rechazado internamente (nunca llamaba a
// revalidateTag), pero la respuesta HTTP visible era 200 igual --
// cualquier herramienta que decida por el código de estado (no por el
// body) veía "todo bien" ante un intento no autorizado. Estos tres casos
// cubren exactamente el fix: sin secreto, secreto inválido, secreto
// válido -- el comportamiento funcional de revalidación (qué tag se
// invalida) no cambia, solo el código de estado del caso no autorizado.

const SECRET = "test_revalidation_secret_FALSO";
process.env.SHOPIFY_REVALIDATION_SECRET = SECRET;

const revalidatedTags: string[] = [];

mock.module("next/headers", {
  namedExports: {
    headers: async () => ({
      get: (_name: string) => "products/update",
    }),
  },
});
mock.module("next/cache", {
  namedExports: {
    revalidateTag: (tag: string) => {
      revalidatedTags.push(tag);
    },
    unstable_cacheLife: () => undefined,
    unstable_cacheTag: () => undefined,
  },
});

function fakeRequest(secret: string | null) {
  const params = new URLSearchParams();
  if (secret !== null) params.set("secret", secret);
  return {
    nextUrl: { searchParams: params },
  } as unknown as Parameters<Awaited<typeof import("./route")>["POST"]>[0];
}

test("POST /api/revalidate sin secreto -- responde 401 real (no solo el body)", async () => {
  const { POST } = await import("./route");
  const antes = revalidatedTags.length;

  const response = await POST(fakeRequest(null));

  assert.equal(response.status, 401);
  assert.equal(revalidatedTags.length, antes);
});

test("POST /api/revalidate con secreto inválido -- responde 401 real", async () => {
  const { POST } = await import("./route");
  const antes = revalidatedTags.length;

  const response = await POST(fakeRequest("secreto-incorrecto"));

  assert.equal(response.status, 401);
  assert.equal(revalidatedTags.length, antes);
});

test("POST /api/revalidate con secreto válido -- responde 200 y revalida (comportamiento sin cambios)", async () => {
  const { POST } = await import("./route");
  const antes = revalidatedTags.length;

  const response = await POST(fakeRequest(SECRET));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.revalidated, true);
  assert.equal(revalidatedTags.length, antes + 1);
});
