import { test } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../tests/mock-module";

// @types/node (vía Next.js) tipa NODE_ENV como una propiedad readonly de
// NodeJS.ProcessEnv -- se accede a través de una referencia sin ese tipo
// específico para poder simularlo en los dos tests de abajo, sin `any`.
const mutableEnv = process.env as Record<string, string | undefined>;

// Auditoría de seguridad (sep. 2026, hardening P2/P3): resolveGuestId
// (lago-cart-id/lago-wishlist-id) seteaba la cookie sin httpOnly/secure.
// Ningún componente cliente lee estas cookies directo (confirmado: no hay
// ningún document.cookie ni js-cookie sobre estos nombres en todo el
// repo) -- todo pasa por Server Actions, así que agregar httpOnly no
// rompe nada. Este archivo prueba que la cookie queda seteada con los
// atributos correctos y que el id se reusa entre llamadas (no se
// regenera en cada request).

type SetCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createFakeCookieStore(initialValue?: string) {
  const jar = new Map<string, string>();
  if (initialValue !== undefined) jar.set("test-cookie", initialValue);
  const setCalls: SetCall[] = [];

  const store = {
    get(name: string) {
      return jar.has(name) ? { name, value: jar.get(name)! } : undefined;
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      jar.set(name, value);
      setCalls.push({ name, value, options });
      return store;
    },
  };
  return { store, setCalls };
}

// next/headers solo se puede mockear UNA vez por proceso -- mismo patrón
// que lib/consent/consent-actions.test.ts: se delega a una variable
// reasignable para que cada test "cambie" el store fake sin volver a
// llamar mock.module().
let currentCookieStore:
  | ReturnType<typeof createFakeCookieStore>["store"]
  | null = null;

mockModule("next/headers", {
  cookies: async () => {
    if (!currentCookieStore) {
      throw new Error("cookie store no configurado para este test");
    }
    return currentCookieStore;
  },
});

test("sin cookie previa: crea un id nuevo y setea la cookie con httpOnly/sameSite=lax", async () => {
  const fake = createFakeCookieStore();
  currentCookieStore = fake.store;
  const { resolveGuestId } = await import("./guest-identity");

  const id = await resolveGuestId("test-cookie", 60 * 60 * 24 * 180);

  assert.match(
    id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "debe ser un UUID real (randomUUID)",
  );
  assert.equal(fake.setCalls.length, 1);
  const call = fake.setCalls[0]!;
  assert.equal(call.name, "test-cookie");
  assert.equal(call.value, id);
  assert.equal(call.options.httpOnly, true);
  assert.equal(call.options.sameSite, "lax");
  assert.equal(call.options.path, "/");
  assert.equal(call.options.maxAge, 60 * 60 * 24 * 180);
});

test("secure es true en producción", async () => {
  const fake = createFakeCookieStore();
  currentCookieStore = fake.store;
  const previousEnv = mutableEnv.NODE_ENV;
  mutableEnv.NODE_ENV = "production";
  try {
    const { resolveGuestId } = await import("./guest-identity");
    await resolveGuestId("test-cookie", 100);
    assert.equal(fake.setCalls[0]!.options.secure, true);
  } finally {
    mutableEnv.NODE_ENV = previousEnv;
  }
});

test("secure es false fuera de producción (no rompe desarrollo local sin HTTPS)", async () => {
  const fake = createFakeCookieStore();
  currentCookieStore = fake.store;
  const previousEnv = mutableEnv.NODE_ENV;
  mutableEnv.NODE_ENV = "development";
  try {
    const { resolveGuestId } = await import("./guest-identity");
    await resolveGuestId("test-cookie", 100);
    assert.equal(fake.setCalls[0]!.options.secure, false);
  } finally {
    mutableEnv.NODE_ENV = previousEnv;
  }
});

test("con cookie previa: reusa el id existente y NUNCA vuelve a llamar set()", async () => {
  const fake = createFakeCookieStore("id-ya-existente");
  currentCookieStore = fake.store;
  const { resolveGuestId } = await import("./guest-identity");

  const id = await resolveGuestId("test-cookie", 100);

  assert.equal(id, "id-ya-existente");
  assert.equal(fake.setCalls.length, 0);
});

test("dos llamadas sin cookie previa generan ids distintos (no un valor fijo/predecible)", async () => {
  const fakeA = createFakeCookieStore();
  currentCookieStore = fakeA.store;
  const { resolveGuestId } = await import("./guest-identity");
  const idA = await resolveGuestId("test-cookie", 100);

  const fakeB = createFakeCookieStore();
  currentCookieStore = fakeB.store;
  const idB = await resolveGuestId("test-cookie", 100);

  assert.notEqual(idA, idB);
});
