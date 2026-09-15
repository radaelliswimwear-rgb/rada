"use server";

import { prisma } from "lib/prisma";
import { getCurrentUser } from "lib/auth/session";
import { checkRateLimit, RateLimitError } from "lib/auth/rate-limit";
import { getClientIp } from "lib/request/client-ip";
import type { BackInStockRequestResult } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Avísame cuando vuelva" (Fase 2, P2). Server Action pública, llamada desde
// components/product-detail/back-in-stock-button.tsx. El color no es un
// parámetro propio: cada Product ya tiene un solo color (ver comentario del
// modelo en prisma/schema.prisma), así que productId ya lo implica.
export async function requestBackInStockAction(
  productId: string,
  size: string,
  emailInput: string,
): Promise<BackInStockRequestResult> {
  try {
    await checkRateLimit(await getClientIp(), "back-in-stock");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  if (!productId || !size) {
    return { success: false, error: "Producto o talla inválidos." };
  }

  // Con sesión iniciada, el correo SIEMPRE es el de la cuenta — nunca el
  // que mande el cliente (evita que alguien logueado anote el correo de
  // otra persona a una lista de espera usando su propia sesión).
  const sessionUser = await getCurrentUser();
  const normalizedEmail = (sessionUser?.email ?? emailInput).trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { success: false, error: "Ingresá un email válido." };
  }

  // Revalida contra el inventario real: no tiene sentido anotar a alguien
  // en una lista de espera de una talla que en este momento sí tiene stock
  // (el botón no debería aparecer en ese caso, pero el server nunca confía
  // solo en lo que muestra el frontend).
  const variant = await prisma.productVariant.findUnique({
    where: { productId_size: { productId, size } },
    select: { stock: true },
  });
  if (!variant) {
    return { success: false, error: "Esa talla no existe para este producto." };
  }
  if (variant.stock > 0) {
    return { success: false, error: "Esa talla ya está disponible." };
  }

  try {
    // Ya en lista (PENDING) para esta combinación exacta: no duplicar. El
    // índice único parcial de la migración hace cumplir esto también en
    // base de datos (no solo acá) ante una carrera entre dos requests.
    const existing = await prisma.backInStockRequest.findFirst({
      where: { productId, size, email: normalizedEmail, status: "PENDING" },
      select: { id: true },
    });
    if (existing) {
      return { success: true, alreadyRequested: true };
    }

    await prisma.backInStockRequest.create({
      data: {
        productId,
        size,
        email: normalizedEmail,
        userId: sessionUser?.id ?? null,
      },
    });
    return { success: true, alreadyRequested: false };
  } catch (error) {
    // P2002 = violación del índice único parcial — otra request concurrente
    // ganó la carrera y ya creó la misma fila; no es un error real para la
    // clienta, es exactamente el caso "ya estás en la lista".
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { success: true, alreadyRequested: true };
    }
    console.error(
      "requestBackInStockAction: no se pudo guardar la solicitud",
      error,
    );
    return { success: false, error: "No se pudo procesar la solicitud." };
  }
}
