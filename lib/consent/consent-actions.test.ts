// Fase 2B (cierre de gap de la auditoría de pre-activación): setConsentPreferencesAction
// no tenía ningún test -- estos prueban de punta a punta (con next/headers
// mockeado, sin un request real) que revocar consentimiento limpia las
// cookies de terceros correctas, ninguna de más, y deja intactas
// radaelli_consent/radaelli_attribution/el resto de cookies del sitio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../../tests/mock-module";

type FakeCookie = { name: string; value: string };
type Deletion = { name: string; domain?: string; path?: string };

function createFakeCookieStore(initial: FakeCookie[]) {
  const jar = new Map<string, string>(initial.map((c) => [c.name, c.value]));
  const deletions: Deletion[] = [];

  const store = {
    get(name: string) {
      return jar.has(name) ? { name, value: jar.get(name)! } : undefined;
    },
    getAll() {
      return [...jar.entries()].map(([name, value]) => ({ name, value }));
    },
    set(name: string, value: string) {
      jar.set(name, value);
      return store;
    },
    delete(nameOrOptions: string | Deletion) {
      const options =
        typeof nameOrOptions === "string" ? { name: nameOrOptions } : nameOrOptions;
      deletions.push(options);
      jar.delete(options.name);
      return store;
    },
  };

  return { store, jar, deletions };
}

// next/headers solo se puede mockear UNA vez por proceso (mock.module tira
// ERR_INVALID_STATE en el segundo intento) -- se mockea acá, al cargar el
// archivo, con implementaciones que delegan a una variable reasignable,
// para que cada test pueda "cambiar" el store fake sin volver a llamar
// mock.module().
let currentCookieStore: ReturnType<typeof createFakeCookieStore>["store"] | null = null;

mockModule("next/headers", {
  cookies: async () => {
    if (!currentCookieStore) throw new Error("cookie store no configurado para este test");
    return currentCookieStore;
  },
  headers: async () => ({
    get: (name: string) => (name.toLowerCase() === "host" ? "radaelliswimwear.com" : null),
  }),
});

function setupHeaderMocks(fake: ReturnType<typeof createFakeCookieStore>) {
  currentCookieStore = fake.store;
}

const ALL_SEED_COOKIES: FakeCookie[] = [
  { name: "radaelli_consent", value: "seed" },
  { name: "radaelli_attribution", value: "seed" },
  { name: "_ga", value: "GA1.1.111.222" },
  { name: "_ga_ABC123DEF", value: "GS1.1.x" },
  { name: "_ga_OTHERCONTAINER", value: "GS1.1.y" },
  { name: "_fbp", value: "fb.1.111.222" },
  { name: "_fbc", value: "fb.1.111.click" },
  { name: "lago-cart-id", value: "cart-1" },
  { name: "lago-wishlist-id", value: "wishlist-1" },
];

const loadSetConsent = async () =>
  (await import("./consent-actions")).setConsentPreferencesAction;

test("A: analytics true -> false elimina _ga y todos los _ga_*", async () => {
  const fake = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: false, marketing: true });

  assert.equal(fake.jar.has("_ga"), false);
  assert.equal(fake.jar.has("_ga_ABC123DEF"), false);
  assert.equal(fake.jar.has("_ga_OTHERCONTAINER"), false);
});

test("B: marketing true -> false elimina _fbp/_fbc", async () => {
  const fake = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: true, marketing: false });

  assert.equal(fake.jar.has("_fbp"), false);
  assert.equal(fake.jar.has("_fbc"), false);
});

test("C: revocar analytics no elimina cookies de marketing si marketing sigue true", async () => {
  const fake = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: false, marketing: true });

  assert.equal(fake.jar.has("_fbp"), true);
  assert.equal(fake.jar.has("_fbc"), true);
});

test("D: revocar marketing no elimina cookies de GA si analytics sigue true", async () => {
  const fake = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: true, marketing: false });

  assert.equal(fake.jar.has("_ga"), true);
  assert.equal(fake.jar.has("_ga_ABC123DEF"), true);
  assert.equal(fake.jar.has("_ga_OTHERCONTAINER"), true);
});

test("E: rechazar todos (analytics=false, marketing=false) elimina ambos grupos", async () => {
  const fake = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: false, marketing: false });

  assert.equal(fake.jar.has("_ga"), false);
  assert.equal(fake.jar.has("_ga_ABC123DEF"), false);
  assert.equal(fake.jar.has("_ga_OTHERCONTAINER"), false);
  assert.equal(fake.jar.has("_fbp"), false);
  assert.equal(fake.jar.has("_fbc"), false);
});

test("F: radaelli_consent permanece (nunca se borra a sí misma) y se actualiza con la nueva preferencia", async () => {
  const fake = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: false, marketing: false });

  assert.equal(fake.jar.has("radaelli_consent"), true);
  const raw = fake.jar.get("radaelli_consent")!;
  const parsed = JSON.parse(raw);
  assert.equal(parsed.analytics, false);
  assert.equal(parsed.marketing, false);
});

test("G: radaelli_attribution sigue el diseño ya existente -- se borra si marketing=false, se conserva si marketing=true", async () => {
  const fakeCleared = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fakeCleared);
  const setConsentPreferencesAction1 = await loadSetConsent();
  await setConsentPreferencesAction1({ analytics: true, marketing: false });
  assert.equal(fakeCleared.jar.has("radaelli_attribution"), false);

  const fakeKept = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fakeKept);
  await setConsentPreferencesAction1({ analytics: true, marketing: true });
  assert.equal(fakeKept.jar.has("radaelli_attribution"), true);
});

test("no borra cookies sin relación (carrito/favoritos quedan intactos)", async () => {
  const fake = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: false, marketing: false });

  assert.equal(fake.jar.has("lago-cart-id"), true);
  assert.equal(fake.jar.has("lago-wishlist-id"), true);
});

test("intenta borrar tanto host-only como calificado con el dominio del request (defensa ante Domain explícito de gtag.js/fbevents.js)", async () => {
  const fake = createFakeCookieStore(ALL_SEED_COOKIES);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: false, marketing: false });

  const gaDeletions = fake.deletions.filter((d) => d.name === "_ga");
  assert.ok(
    gaDeletions.some((d) => d.domain === undefined),
    "debe intentar borrar host-only",
  );
  assert.ok(
    gaDeletions.some((d) => d.domain === "radaelliswimwear.com"),
    "debe intentar borrar calificada con el dominio del request",
  );
});

test("sin _ga_* presentes -> solo intenta borrar _ga (no inventa nombres)", async () => {
  const fake = createFakeCookieStore([
    { name: "radaelli_consent", value: "seed" },
    { name: "lago-cart-id", value: "cart-1" },
  ]);
  setupHeaderMocks(fake);
  const setConsentPreferencesAction = await loadSetConsent();

  await setConsentPreferencesAction({ analytics: false, marketing: true });

  const hostOnlyNames = fake.deletions.filter((d) => d.domain === undefined).map((d) => d.name);
  const ga4Related = hostOnlyNames.filter(
    (name) => name === "_ga" || name.startsWith("_ga_"),
  );
  assert.deepEqual(ga4Related, ["_ga"]);
});
