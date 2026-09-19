import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../../tests/mock-module";

// Hardening P2/P3 (sep. 2026): saveCartLinesAction/saveWishlistItemsAction
// eran las últimas Server Actions públicas de escritura sin ningún freno.
// Prueba contra el rate limiter REAL (lib/auth/rate-limit.ts, con
// AuthAttempt mockeado en memoria, no el propio checkRateLimit) que: uso
// normal sigue guardando, un abuso repetido se descarta en silencio
// (nunca lanza -- estos stores se llaman con `void` desde el cliente,
// sin manejo de error), y que el límite es por dueño (usuario o invitado),
// nunca compartido entre sesiones distintas.
//
// Cómo correrlo:
//   node --env-file=.env.test --experimental-test-module-mocks --import tsx --test lib/cart/cart-wishlist-rate-limit.test.ts

type FakeAttempt = { identifier: string; action: string; createdAt: Date };

let attempts: FakeAttempt[];
let currentUser: { id: string } | null;
let guestId: string;
let saveCallCount: number;

function resetStore(): void {
  attempts = [];
  currentUser = null;
  guestId = "guest-1";
  saveCallCount = 0;
}

mockModule("lib/auth/session", {
  getCurrentUser: async () => currentUser,
});

mockModule("lib/guest-identity", {
  resolveGuestId: async () => guestId,
});

mockModule("lib/prisma", {
  prisma: {
    authAttempt: {
      count: async ({
        where,
      }: {
        where: { identifier: string; action: string; createdAt: { gte: Date } };
      }) =>
        attempts.filter(
          (a) =>
            a.identifier === where.identifier &&
            a.action === where.action &&
            a.createdAt >= where.createdAt.gte,
        ).length,
      create: async ({
        data,
      }: {
        data: { identifier: string; action: string };
      }) => {
        attempts.push({ ...data, createdAt: new Date() });
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      saveCallCount++;
      const tx = {
        cart: { upsert: async () => ({ id: "cart-1" }) },
        cartItem: {
          deleteMany: async () => ({ count: 0 }),
          createMany: async () => ({ count: 0 }),
        },
        wishlist: { upsert: async () => ({ id: "wishlist-1" }) },
        wishlistItem: {
          deleteMany: async () => ({ count: 0 }),
          createMany: async () => ({ count: 0 }),
        },
      };
      return fn(tx);
    },
  },
});

test("uso normal: varios guardados seguidos, dentro del límite, todos persisten", async () => {
  resetStore();
  currentUser = { id: "user_1" };
  const { saveCartLinesAction } = await import("./cart-actions");

  for (let i = 0; i < 10; i++) {
    await saveCartLinesAction([
      { id: "p1-M", productId: "p1", size: "M", quantity: 1, createdAt: "" },
    ]);
  }

  assert.equal(saveCallCount, 10, "los 10 guardados normales deben persistir");
});

test("abuso repetido: al superar el límite, el guardado se descarta en silencio (nunca lanza)", async () => {
  resetStore();
  currentUser = { id: "user_abusivo" };
  const { saveCartLinesAction } = await import("./cart-actions");

  for (let i = 0; i < 101; i++) {
    await assert.doesNotReject(() =>
      saveCartLinesAction([
        { id: "p1-M", productId: "p1", size: "M", quantity: 1, createdAt: "" },
      ]),
    );
  }

  // Límite: 100/15min -- el intento 101 debe haberse descartado.
  assert.equal(saveCallCount, 100);
});

test("el límite es por dueño -- otra cuenta distinta no se ve afectada por el abuso de la primera", async () => {
  resetStore();

  currentUser = { id: "user_abusivo_2" };
  const { saveCartLinesAction } = await import("./cart-actions");
  for (let i = 0; i < 101; i++) {
    await saveCartLinesAction([
      { id: "p1-M", productId: "p1", size: "M", quantity: 1, createdAt: "" },
    ]);
  }
  assert.equal(saveCallCount, 100, "la cuenta abusiva se frena en 100");

  currentUser = { id: "user_normal" };
  await saveCartLinesAction([
    { id: "p1-M", productId: "p1", size: "M", quantity: 1, createdAt: "" },
  ]);
  assert.equal(
    saveCallCount,
    101,
    "una cuenta DISTINTA debe poder guardar igual, sin heredar el freno de la otra",
  );
});

test("invitado (sin sesión) también tiene su propio freno, aislado por guestId", async () => {
  resetStore();
  currentUser = null;
  guestId = "guest-abusivo";
  const { saveCartLinesAction } = await import("./cart-actions");

  for (let i = 0; i < 101; i++) {
    await saveCartLinesAction([
      { id: "p1-M", productId: "p1", size: "M", quantity: 1, createdAt: "" },
    ]);
  }
  assert.equal(saveCallCount, 100);

  guestId = "guest-normal";
  await saveCartLinesAction([
    { id: "p1-M", productId: "p1", size: "M", quantity: 1, createdAt: "" },
  ]);
  assert.equal(saveCallCount, 101);
});

test("wishlist: mismo comportamiento -- uso normal persiste, abuso se descarta en silencio", async () => {
  resetStore();
  currentUser = { id: "user_wishlist" };
  const { saveWishlistItemsAction } = await import(
    "../wishlist/wishlist-actions"
  );

  for (let i = 0; i < 5; i++) {
    await saveWishlistItemsAction([{ productId: "p1", createdAt: "" }]);
  }
  assert.equal(saveCallCount, 5);

  for (let i = 0; i < 96; i++) {
    await assert.doesNotReject(() =>
      saveWishlistItemsAction([{ productId: "p1", createdAt: "" }]),
    );
  }
  assert.equal(saveCallCount, 100, "también se frena en 100, nunca lanza");
});
