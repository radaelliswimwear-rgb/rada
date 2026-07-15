"use server";

import { prisma } from "lib/prisma";
import { resolveGuestId } from "lib/guest-identity";
import type { WishlistItem } from "./types";

// Server Actions Prisma/Postgres. La wishlist sigue sin exigir sesión (igual
// que en Sprint 6): el navegador se identifica con una cookie propia
// (`lago-wishlist-id`) — mismo patrón "contenedor + cookie" que el carrito
// (lib/cart/cart-actions.ts), ahora persistida server-side.
const COOKIE_NAME = "lago-wishlist-id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 días

async function resolveWishlistId(): Promise<string> {
  return resolveGuestId(COOKIE_NAME, COOKIE_MAX_AGE);
}

export async function getWishlistItemsAction(): Promise<WishlistItem[]> {
  const wishlistId = await resolveWishlistId();

  // Igual que getCartLinesAction: corre al montar WishlistProvider en cada
  // página, sin interacción del usuario — si Postgres no está disponible,
  // degrada a wishlist vacía en vez de tirar abajo el render.
  let wishlist;
  try {
    wishlist = await prisma.wishlist.findUnique({
      where: { id: wishlistId },
      include: { items: true },
    });
  } catch (error) {
    console.error("getWishlistItemsAction: no se pudo leer la wishlist", error);
    return [];
  }
  if (!wishlist) return [];

  return wishlist.items.map((item) => ({
    productId: item.productId,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function saveWishlistItemsAction(
  items: WishlistItem[],
): Promise<void> {
  const wishlistId = await resolveWishlistId();

  await prisma.$transaction(async (tx) => {
    await tx.wishlist.upsert({
      where: { id: wishlistId },
      update: {},
      create: { id: wishlistId },
    });
    await tx.wishlistItem.deleteMany({ where: { wishlistId } });
    if (items.length > 0) {
      await tx.wishlistItem.createMany({
        data: items.map((item) => ({
          wishlistId,
          productId: item.productId,
        })),
        skipDuplicates: true,
      });
    }
  });
}
