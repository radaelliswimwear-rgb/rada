import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Investigación y fix de bug (sep. 2026): la wishlist de invitado no
// sobrevivía un reload. Causa raíz confirmada con un test contra la DB
// real de desarrollo (ver el commit): la carga inicial al montar
// WishlistProvider (una LECTURA, useEffect en components/wishlist/wishlist-store.tsx)
// y el guardado disparado por un click casi inmediato en el corazón de
// favoritos podían llegar al servidor como dos requests verdaderamente
// concurrentes, ninguno con la cookie de invitado todavía -- ANTES, la
// lectura también podía mintear un guestId nuevo (mismo resolveGuestId
// que usa el guardado), así que las dos terminaban creando identidades
// DISTINTAS, y cualquiera de las dos respuestas podía ser la que el
// navegador terminara aplicando. Si ganaba la de la lectura (que nunca
// escribe nada), el producto agregado quedaba huérfano bajo el guestId de
// la escritura, que ya nadie volvía a referenciar.
//
// Fix: lib/guest-identity.ts gana peekGuestId (lectura, nunca crea
// cookie) -- getWishlistItemsAction/getCartLinesAction lo usan en vez de
// resolveGuestId. La ÚNICA operación que puede mintear un guestId nuevo
// para un invitado sin cookie es ahora un guardado real, así que ya no hay
// dos operaciones compitiendo por crear la identidad del mismo invitado a
// la vez. El mismo fix se aplicó a carrito (lib/cart/cart-actions.ts) por
// consistencia -- comparte guest-identity.ts y tenía la misma exposición
// estructural, aunque en la práctica sea menos probable de disparar (elegir
// talla antes de "agregar al carrito" le da tiempo de sobra a la lectura
// inicial para terminar).
//
// Este archivo cubre el checklist obligatorio A-K con prisma mockeado
// (rápido, determinístico) -- la causa raíz en sí ya se demostró y
// verificó por separado contra Postgres real durante la investigación.
//
// Cómo correrlo:
//   node --env-file=.env.test --experimental-test-module-mocks --import tsx --test lib/wishlist/wishlist-persistence.test.ts

type FakeWishlist = { id: string; userId: string | null };
type FakeWishlistItem = {
  id: string;
  wishlistId: string;
  productId: string;
  createdAt: Date;
};
type FakeUser = { id: string };

let wishlists: Record<string, FakeWishlist>;
let wishlistItems: FakeWishlistItem[];
let attempts: Array<{ identifier: string; action: string; createdAt: Date }>;
let currentUser: FakeUser | null;
let idCounter: number;

// Cookie jar COMPARTIDO entre llamadas dentro de un mismo test -- simula un
// navegador real reenviando la cookie que el servidor seteó en la
// respuesta anterior (a diferencia del test de la carrera, acá cada
// llamada SÍ ve lo que la anterior ya dejó, que es el caso normal/no-race
// que domina el checklist A-K).
let jar: Map<string, string>;
let lastSetCookieOptions: Record<string, unknown> | undefined;

function resetStore(): void {
  wishlists = {};
  wishlistItems = [];
  attempts = [];
  currentUser = null;
  idCounter = 1;
  jar = new Map();
  lastSetCookieOptions = undefined;
}

function nextId(prefix: string): string {
  return `${prefix}_${idCounter++}`;
}

mock.module("next/headers", {
  namedExports: {
    cookies: async () => ({
      get: (name: string) => {
        const value = jar.get(name);
        return value !== undefined ? { name, value } : undefined;
      },
      set: (name: string, value: string, options?: Record<string, unknown>) => {
        jar.set(name, value);
        lastSetCookieOptions = options;
      },
      delete: (name: string) => {
        jar.delete(name);
      },
    }),
  },
});

mock.module("lib/auth/session", {
  namedExports: {
    getCurrentUser: async () => currentUser,
  },
});

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      authAttempt: {
        count: async () => 0, // nunca se dispara el rate limit en estos tests
        create: async ({
          data,
        }: {
          data: { identifier: string; action: string };
        }) => {
          attempts.push({ ...data, createdAt: new Date() });
        },
      },
      wishlist: {
        findUnique: async ({
          where,
        }: {
          where: { id?: string; userId?: string };
        }) => {
          const row = where.id
            ? wishlists[where.id]
            : Object.values(wishlists).find((w) => w.userId === where.userId);
          if (!row) return null;
          return {
            ...row,
            items: wishlistItems.filter((item) => item.wishlistId === row.id),
          };
        },
      },
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          wishlist: {
            findUnique: async ({
              where,
            }: {
              where: { id?: string; userId?: string };
            }) => {
              const row = where.id
                ? wishlists[where.id]
                : Object.values(wishlists).find(
                    (w) => w.userId === where.userId,
                  );
              if (!row) return null;
              return {
                ...row,
                items: wishlistItems.filter(
                  (item) => item.wishlistId === row.id,
                ),
              };
            },
            upsert: async ({
              where,
              create,
            }: {
              where: { id?: string; userId?: string };
              create: { id?: string; userId?: string };
            }) => {
              const existing = where.id
                ? wishlists[where.id]
                : Object.values(wishlists).find(
                    (w) => w.userId === where.userId,
                  );
              if (existing) return existing;
              const row: FakeWishlist = {
                id: create.id ?? nextId("wishlist"),
                userId: create.userId ?? null,
              };
              wishlists[row.id] = row;
              return row;
            },
            delete: async ({ where }: { where: { id: string } }) => {
              delete wishlists[where.id];
              wishlistItems = wishlistItems.filter(
                (item) => item.wishlistId !== where.id,
              );
            },
          },
          wishlistItem: {
            deleteMany: async ({
              where,
            }: {
              where: { wishlistId: string };
            }) => {
              const before = wishlistItems.length;
              wishlistItems = wishlistItems.filter(
                (item) => item.wishlistId !== where.wishlistId,
              );
              return { count: before - wishlistItems.length };
            },
            createMany: async ({
              data,
            }: {
              data: { wishlistId: string; productId: string }[];
              skipDuplicates?: boolean;
            }) => {
              for (const entry of data) {
                const dup = wishlistItems.some(
                  (item) =>
                    item.wishlistId === entry.wishlistId &&
                    item.productId === entry.productId,
                );
                if (dup) continue;
                wishlistItems.push({
                  id: nextId("item"),
                  ...entry,
                  createdAt: new Date(),
                });
              }
              return { count: data.length };
            },
          },
        };
        return fn(tx);
      },
    },
  },
});

async function loadWishlistActions() {
  return import("./wishlist-actions");
}

test("A: invitado agrega un producto -- queda guardado (persiste server-side)", async () => {
  resetStore();
  const { saveWishlistItemsAction, getWishlistItemsAction } =
    await loadWishlistActions();

  await saveWishlistItemsAction([{ productId: "prod-1", createdAt: "" }]);
  const items = await getWishlistItemsAction();

  assert.deepEqual(
    items.map((i) => i.productId),
    ["prod-1"],
  );
});

test("B: reload (llamada nueva, misma cookie que quedó del guardado) -- el item sigue presente", async () => {
  resetStore();
  const { saveWishlistItemsAction, getWishlistItemsAction } =
    await loadWishlistActions();

  await saveWishlistItemsAction([{ productId: "prod-1", createdAt: "" }]);
  // "Reload": una llamada de LECTURA nueva e independiente -- antes del
  // fix, esta llamada por sí sola podía crear un guestId nuevo si algo
  // salía mal; ahora nunca lo hace (peekGuestId).
  const afterReload = await getWishlistItemsAction();

  assert.deepEqual(
    afterReload.map((i) => i.productId),
    ["prod-1"],
  );
});

test("C: remove + reload -- el item no vuelve a aparecer", async () => {
  resetStore();
  const { saveWishlistItemsAction, getWishlistItemsAction } =
    await loadWishlistActions();

  await saveWishlistItemsAction([{ productId: "prod-1", createdAt: "" }]);
  await saveWishlistItemsAction([]); // remove (wishlist-store.tsx guarda la lista sin el producto)
  const afterReload = await getWishlistItemsAction();

  assert.deepEqual(afterReload, []);
});

test("D: dos productos distintos -- ambos persisten", async () => {
  resetStore();
  const { saveWishlistItemsAction, getWishlistItemsAction } =
    await loadWishlistActions();

  await saveWishlistItemsAction([
    { productId: "prod-1", createdAt: "" },
    { productId: "prod-2", createdAt: "" },
  ]);
  const afterReload = await getWishlistItemsAction();

  assert.deepEqual(afterReload.map((i) => i.productId).sort(), [
    "prod-1",
    "prod-2",
  ]);
});

test("E: guardar el mismo producto dos veces (duplicado) -- no lo duplica", async () => {
  resetStore();
  const { saveWishlistItemsAction, getWishlistItemsAction } =
    await loadWishlistActions();

  // skipDuplicates en el createMany real (y en el fake de arriba) es lo
  // que garantiza esto -- un guardado con el mismo productId repetido en
  // la misma llamada nunca crea dos filas.
  await saveWishlistItemsAction([
    { productId: "prod-1", createdAt: "" },
    { productId: "prod-1", createdAt: "" },
  ]);
  const items = await getWishlistItemsAction();

  assert.equal(items.length, 1);
});

test("F: dos invitados con cookies distintas -- wishlists completamente aisladas", async () => {
  resetStore();
  const { saveWishlistItemsAction, getWishlistItemsAction } =
    await loadWishlistActions();

  await saveWishlistItemsAction([{ productId: "prod-1", createdAt: "" }]);
  const guestAId = jar.get("lago-wishlist-id");
  assert.ok(guestAId);

  jar.clear(); // "otro navegador" -- ninguna cookie compartida
  await saveWishlistItemsAction([{ productId: "prod-2", createdAt: "" }]);
  const guestBId = jar.get("lago-wishlist-id");

  assert.notEqual(guestAId, guestBId);
  const wishlistB = await getWishlistItemsAction();
  assert.deepEqual(
    wishlistB.map((i) => i.productId),
    ["prod-2"],
  );
});

test("G: usuario autenticado -- nunca lee/escribe la wishlist de invitado por accidente", async () => {
  resetStore();
  const { saveWishlistItemsAction, getWishlistItemsAction } =
    await loadWishlistActions();

  // Guarda algo como invitado primero (cookie en el jar).
  await saveWishlistItemsAction([
    { productId: "prod-invitado", createdAt: "" },
  ]);

  // Ahora "inicia sesión" -- la cookie de invitado SIGUE en el jar (el
  // merge real es responsabilidad de mergeGuestWishlistIntoUserAction, no
  // de getWishlistItemsAction/saveWishlistItemsAction), pero con sesión
  // activa estas dos funciones deben ignorarla por completo.
  currentUser = { id: "user_1" };
  const items = await getWishlistItemsAction();
  assert.deepEqual(
    items,
    [],
    "la cuenta recién logueada no debe heredar la wishlist de invitado sin pasar por el merge",
  );

  await saveWishlistItemsAction([{ productId: "prod-cuenta", createdAt: "" }]);
  const userWishlist = Object.values(wishlists).find(
    (w) => w.userId === "user_1",
  );
  assert.ok(
    userWishlist,
    "el guardado con sesión debe crear/usar el Wishlist de la cuenta, no el de invitado",
  );
});

test("H: la cookie de invitado sigue httpOnly/secure/sameSite tras este fix", async () => {
  resetStore();
  const { saveWishlistItemsAction } = await loadWishlistActions();

  // El guardado real es la ÚNICA operación que sigue pasando por
  // resolveGuestId (lib/guest-identity.ts) -- su cuerpo no se tocó, solo
  // se agregó peekGuestId al lado para las lecturas. Esto confirma
  // end-to-end que las opciones de la cookie siguen siendo exactamente
  // las endurecidas en el hardening P2/P3 (mismo criterio que
  // lib/guest-identity.test.ts, que prueba resolveGuestId en aislado).
  await saveWishlistItemsAction([{ productId: "prod-1", createdAt: "" }]);

  assert.ok(
    jar.get("lago-wishlist-id"),
    "el guardado real sigue seteando la cookie de invitado",
  );
  assert.ok(lastSetCookieOptions, "debe haber seteado la cookie con opciones");
  assert.equal(lastSetCookieOptions!.httpOnly, true);
  assert.equal(lastSetCookieOptions!.sameSite, "lax");
  assert.equal(lastSetCookieOptions!.path, "/");
  assert.ok("secure" in lastSetCookieOptions!);
});

test("I: hydration inicial -- una lectura de invitado SIN cookie nunca sobrescribe nada (nunca crea guestId)", async () => {
  resetStore();
  const { getWishlistItemsAction } = await loadWishlistActions();

  const items = await getWishlistItemsAction();

  assert.deepEqual(items, []);
  assert.equal(
    jar.get("lago-wishlist-id"),
    undefined,
    "una lectura nunca debe crear una cookie de invitado -- ver la causa raíz del bug",
  );
  assert.equal(
    Object.keys(wishlists).length,
    0,
    "tampoco debe crear ninguna fila Wishlist",
  );
});

test("J: navegación entre productos (varias lecturas seguidas) -- estado consistente", async () => {
  resetStore();
  const { saveWishlistItemsAction, getWishlistItemsAction } =
    await loadWishlistActions();

  await saveWishlistItemsAction([{ productId: "prod-1", createdAt: "" }]);

  // Simula visitar 3 páginas de producto distintas seguidas -- cada una
  // monta WishlistProvider y dispara su propia lectura.
  const readA = await getWishlistItemsAction();
  const readB = await getWishlistItemsAction();
  const readC = await getWishlistItemsAction();

  for (const read of [readA, readB, readC]) {
    assert.deepEqual(
      read.map((i) => i.productId),
      ["prod-1"],
    );
  }
});

test("K: merge invitado -> cuenta (si existe) sigue funcionando sin regresión", async () => {
  resetStore();
  const { saveWishlistItemsAction, mergeGuestWishlistIntoUserAction } =
    await loadWishlistActions();

  await saveWishlistItemsAction([
    { productId: "prod-invitado", createdAt: "" },
  ]);
  const guestWishlistId = jar.get("lago-wishlist-id")!;
  assert.ok(guestWishlistId);

  currentUser = { id: "user_merge" };
  await mergeGuestWishlistIntoUserAction("user_merge");

  const userWishlist = Object.values(wishlists).find(
    (w) => w.userId === "user_merge",
  );
  assert.ok(
    userWishlist,
    "debe existir un Wishlist para la cuenta después del merge",
  );
  const mergedItems = wishlistItems.filter(
    (item) => item.wishlistId === userWishlist!.id,
  );
  assert.deepEqual(
    mergedItems.map((i) => i.productId),
    ["prod-invitado"],
  );
  assert.equal(
    wishlists[guestWishlistId],
    undefined,
    "el Wishlist de invitado debe borrarse una vez fusionado",
  );
  assert.equal(
    jar.get("lago-wishlist-id"),
    undefined,
    "la cookie de invitado debe borrarse tras el merge",
  );
});
