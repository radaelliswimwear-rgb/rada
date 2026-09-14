"use server";

import { cookies } from "next/headers";
import { prisma } from "lib/prisma";
import { getCurrentUser } from "lib/auth/session";
import { resolveGuestId } from "lib/guest-identity";
import type { WishlistItem } from "./types";

// Server Actions Prisma/Postgres. Sprint 27: mismo tratamiento que
// lib/cart/cart-actions.ts — con sesión, la wishlist se identifica por
// Wishlist.userId (una sola por cuenta, @unique en el schema, persiste
// entre dispositivos). Sin sesión, sigue igual que siempre: cookie propia
// (`lago-wishlist-id`) y Wishlist.userId queda null.
const COOKIE_NAME = "lago-wishlist-id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 días

type WishlistOwner = { userId: string } | { guestId: string };

async function resolveWishlistOwner(): Promise<WishlistOwner> {
  const sessionUser = await getCurrentUser();
  if (sessionUser) return { userId: sessionUser.id };
  return { guestId: await resolveGuestId(COOKIE_NAME, COOKIE_MAX_AGE) };
}

export async function getWishlistItemsAction(): Promise<WishlistItem[]> {
  const owner = await resolveWishlistOwner();

  // Igual que getCartLinesAction: corre al montar WishlistProvider en cada
  // página, sin interacción del usuario — si Postgres no está disponible,
  // degrada a wishlist vacía en vez de tirar abajo el render.
  let wishlist;
  try {
    wishlist =
      "userId" in owner
        ? await prisma.wishlist.findUnique({
            where: { userId: owner.userId },
            include: { items: true },
          })
        : await prisma.wishlist.findUnique({
            where: { id: owner.guestId },
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
  const owner = await resolveWishlistOwner();

  await prisma.$transaction(async (tx) => {
    const wishlist =
      "userId" in owner
        ? await tx.wishlist.upsert({
            where: { userId: owner.userId },
            update: {},
            create: { userId: owner.userId },
          })
        : await tx.wishlist.upsert({
            where: { id: owner.guestId },
            update: {},
            create: { id: owner.guestId },
          });
    await tx.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
    if (items.length > 0) {
      await tx.wishlistItem.createMany({
        data: items.map((item) => ({
          wishlistId: wishlist.id,
          productId: item.productId,
        })),
        skipDuplicates: true,
      });
    }
  });
}

// Mismo criterio que mergeGuestCartIntoUserAction (lib/cart/cart-actions.ts)
// — se llama desde registerAction/loginAction justo después de crear la
// sesión. Acá no hay cantidad que sumar: un producto guardado como favorito
// en cualquiera de los dos lados simplemente queda favorito (unión de
// productIds, skipDuplicates cubre el solapamiento). Idempotente.
export async function mergeGuestWishlistIntoUserAction(
  userId: string,
): Promise<void> {
  const store = await cookies();
  const guestWishlistId = store.get(COOKIE_NAME)?.value;
  if (!guestWishlistId) return;

  await prisma.$transaction(async (tx) => {
    const guestWishlist = await tx.wishlist.findUnique({
      where: { id: guestWishlistId },
      include: { items: true },
    });
    if (!guestWishlist || guestWishlist.items.length === 0) {
      if (guestWishlist) {
        await tx.wishlist.delete({ where: { id: guestWishlist.id } });
      }
      return;
    }

    const userWishlist = await tx.wishlist.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await tx.wishlistItem.createMany({
      data: guestWishlist.items.map((item) => ({
        wishlistId: userWishlist.id,
        productId: item.productId,
      })),
      skipDuplicates: true,
    });

    await tx.wishlist.delete({ where: { id: guestWishlist.id } });
  });

  store.delete(COOKIE_NAME);
}
