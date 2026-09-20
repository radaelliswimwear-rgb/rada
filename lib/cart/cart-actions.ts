"use server";

import { cookies } from "next/headers";
import { prisma } from "lib/prisma";
import { getCurrentUser } from "lib/auth/session";
import { peekGuestId, resolveGuestId } from "lib/guest-identity";
import { checkRateLimit, RateLimitError } from "lib/auth/rate-limit";
import type { CartLine } from "./types";

// Server Actions Prisma/Postgres. Sprint 27: el carrito ya distingue sesión
// real de invitado. Con sesión, el carrito se identifica por Cart.userId
// (un solo carrito por cuenta, @unique en el schema — persiste entre
// dispositivos/navegadores). Sin sesión, sigue igual que siempre: el
// navegador se identifica con su propia cookie (`lago-cart-id`) y
// Cart.userId queda null. mergeGuestCartIntoUserAction (abajo) es lo que
// conecta ambos mundos al iniciar sesión.
const COOKIE_NAME = "lago-cart-id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 días

type CartOwner = { userId: string } | { guestId: string };

// Solo lectura -- NUNCA crea una cookie de invitado nueva (ver el
// comentario largo en lib/guest-identity.ts, peekGuestId, y la
// investigación del bug de persistencia de la wishlist que aplica el mismo
// fix acá por consistencia y para cerrar la misma exposición). Un invitado
// que todavía no tiene cookie simplemente no tiene carrito todavía
// (`null`), sin efecto secundario alguno.
async function resolveCartOwnerForRead(): Promise<CartOwner | null> {
  const sessionUser = await getCurrentUser();
  if (sessionUser) return { userId: sessionUser.id };
  const guestId = await peekGuestId(COOKIE_NAME);
  return guestId ? { guestId } : null;
}

// Para escritura -- la ÚNICA operación que puede mintear un guestId nuevo
// para un invitado que todavía no tiene cookie.
async function resolveCartOwnerForWrite(): Promise<CartOwner> {
  const sessionUser = await getCurrentUser();
  if (sessionUser) return { userId: sessionUser.id };
  return { guestId: await resolveGuestId(COOKIE_NAME, COOKIE_MAX_AGE) };
}

export async function getCartLinesAction(): Promise<CartLine[]> {
  const owner = await resolveCartOwnerForRead();
  if (!owner) return [];

  // Esta lectura corre al montar LocalCartProvider en cada página (vía
  // app/layout.tsx), sin interacción del usuario — si Postgres no está
  // disponible, degrada a carrito vacío en vez de tirar abajo el render de
  // toda la app. Se loguea igual server-side, no se oculta el fallo.
  let cart;
  try {
    cart =
      "userId" in owner
        ? await prisma.cart.findUnique({
            where: { userId: owner.userId },
            include: { items: true },
          })
        : await prisma.cart.findUnique({
            where: { id: owner.guestId },
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
  const owner = await resolveCartOwnerForWrite();

  // Hardening P2/P3 (sep. 2026): por identificador de dueño, no por IP --
  // ver el comentario largo junto a "cart-save" en lib/auth/rate-limit.ts.
  // Se descarta el guardado en silencio si se dispara (nunca se lanza el
  // error hacia el llamador): cartStorage.save se llama siempre con `void`
  // desde el store del carrito (components/cart-drawer/cart-store.tsx), sin
  // ningún manejo de error -- el estado en memoria del carrito ya se
  // actualizó de forma optimista antes de esta llamada, así que la clienta
  // no ve nada roto, solo ese guardado puntual no persiste hasta el
  // próximo intento dentro de la ventana.
  try {
    await checkRateLimit(
      "userId" in owner ? `user:${owner.userId}` : `guest:${owner.guestId}`,
      "cart-save",
    );
  } catch (error) {
    if (error instanceof RateLimitError) return;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    const cart =
      "userId" in owner
        ? await tx.cart.upsert({
            where: { userId: owner.userId },
            update: {},
            create: { userId: owner.userId },
          })
        : await tx.cart.upsert({
            where: { id: owner.guestId },
            update: {},
            create: { id: owner.guestId },
          });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    if (lines.length > 0) {
      await tx.cartItem.createMany({
        data: lines.map((line) => ({
          cartId: cart.id,
          productId: line.productId,
          size: line.size,
          quantity: line.quantity,
        })),
      });
    }
  });
}

// Se llama desde registerAction/loginAction (lib/auth/users-actions.ts)
// justo después de crear la sesión — en ese mismo request todavía se puede
// leer la cookie de invitado de ANTES de loguearse. Si esa cookie apunta a
// un carrito con productos, se suman sus líneas al carrito real de la
// cuenta (Cart.userId) — sumar, no reemplazar, porque puede haber productos
// agregados desde otro dispositivo ya guardados en la cuenta. La cookie de
// invitado se borra al final: una vez fusionado, ese carrito de invitado ya
// no debe volver a usarse (si cierra sesión después, se le arma uno nuevo).
// Idempotente: llamarlo sin cookie de invitado, o con una que ya no tiene
// carrito, simplemente no hace nada.
export async function mergeGuestCartIntoUserAction(
  userId: string,
): Promise<void> {
  // Defensa en profundidad (auditoría de seguridad, Sprint 29): esta acción
  // solo se llama internamente, justo después de crear la sesión en
  // registerAction/loginAction, nunca con un userId que decida el cliente —
  // pero al ser un Server Action exportado, técnicamente es invocable
  // directo. Si alguna vez se llamara con el id de OTRA cuenta, esto corta
  // acá en vez de fusionarle el carrito de invitado de quien llama.
  const sessionUser = await getCurrentUser();
  if (!sessionUser || sessionUser.id !== userId) return;

  const store = await cookies();
  const guestCartId = store.get(COOKIE_NAME)?.value;
  if (!guestCartId) return;

  await prisma.$transaction(async (tx) => {
    const guestCart = await tx.cart.findUnique({
      where: { id: guestCartId },
      include: { items: true },
    });
    if (!guestCart || guestCart.items.length === 0) {
      if (guestCart) await tx.cart.delete({ where: { id: guestCart.id } });
      return;
    }

    const userCart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    for (const guestItem of guestCart.items) {
      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_productId_size: {
            cartId: userCart.id,
            productId: guestItem.productId,
            size: guestItem.size,
          },
        },
      });
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + guestItem.quantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            size: guestItem.size,
            quantity: guestItem.quantity,
          },
        });
      }
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });

  store.delete(COOKIE_NAME);
}
