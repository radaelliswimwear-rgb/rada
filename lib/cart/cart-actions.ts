"use server";

import { prisma } from "lib/prisma";
import { resolveGuestId } from "lib/guest-identity";
import type { CartLine } from "./types";

// Server Actions Prisma/Postgres. El carrito sigue sin exigir sesión (igual
// que en Sprint 5/8): el navegador se identifica con una cookie propia
// (`lago-cart-id`), y Cart.userId queda null — mismo comportamiento que la
// versión en localStorage, ahora persistido server-side.
const COOKIE_NAME = "lago-cart-id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 días

async function resolveCartId(): Promise<string> {
  return resolveGuestId(COOKIE_NAME, COOKIE_MAX_AGE);
}

export async function getCartLinesAction(): Promise<CartLine[]> {
  const cartId = await resolveCartId();

  // Esta lectura corre al montar LocalCartProvider en cada página (vía
  // app/layout.tsx), sin interacción del usuario — si Postgres no está
  // disponible, degrada a carrito vacío en vez de tirar abajo el render de
  // toda la app. Se loguea igual server-side, no se oculta el fallo.
  let cart;
  try {
    cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });
  } catch (error) {
    console.error("getCartLinesAction: no se pudo leer el carrito", error);
    return [];
  }
  if (!cart) return [];

  return cart.items.map((item) => ({
    id: `${item.productId}-${item.size}`,
    productId: item.productId,
    size: item.size,
    quantity: item.quantity,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function saveCartLinesAction(lines: CartLine[]): Promise<void> {
  const cartId = await resolveCartId();

  await prisma.$transaction(async (tx) => {
    await tx.cart.upsert({
      where: { id: cartId },
      update: {},
      create: { id: cartId },
    });
    await tx.cartItem.deleteMany({ where: { cartId } });
    if (lines.length > 0) {
      await tx.cartItem.createMany({
        data: lines.map((line) => ({
          cartId,
          productId: line.productId,
          size: line.size,
          quantity: line.quantity,
        })),
      });
    }
  });
}
