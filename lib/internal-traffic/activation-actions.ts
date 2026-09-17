"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "lib/prisma";
import { INTERNAL_TRAFFIC_COOKIE_NAME } from "./resolve";

// Cookie persistente del dispositivo (no la del enlace de activación, que
// vive en InternalTrafficActivationToken con un TTL corto de minutos) --
// 365 días: el equipo/familia no debería tener que reactivar seguido, y
// requiere una acción explícita (borrar cookies, otro navegador) para
// necesitarlo de nuevo, tal como se pidió.
const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type ActivateInternalTrafficResult =
  | { success: true }
  | { success: false; error: string };

// Público a propósito (sin requireAdmin/requireUser): quien activa su
// dispositivo puede no tener ninguna cuenta de Radaelli -- lo único que
// autoriza la activación es conocer el token del enlace de un solo uso que
// el admin generó y compartió a mano (ver
// lib/admin/internal-traffic-actions.ts). Nunca reutiliza ese token como
// cookie: genera uno NUEVO y distinto para el dispositivo, para que un
// enlace de vida corta no termine siendo el mismo secreto que la cookie usa
// por meses.
export async function activateInternalTrafficAction(
  token: string,
): Promise<ActivateInternalTrafficResult> {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
    return { success: false, error: "El enlace de activación no es válido." };
  }

  const tokenHash = hashToken(token);
  const activation = await prisma.internalTrafficActivationToken.findUnique({
    where: { tokenHash },
  });
  if (!activation) {
    return {
      success: false,
      error:
        "Este enlace ya no es válido (venció o ya se usó). Pedí uno nuevo desde el panel de administración.",
    };
  }

  // Reclamo atómico, mismo patrón que Payment.checkoutAttemptId /
  // createOrderForPayment (lib/orders/order-creation-core.ts): el
  // findUnique de arriba es solo el camino rápido para el error legible de
  // "no existe": la garantía real de un solo uso la da este updateMany
  // condicionado -- si dos requests casi simultáneas llegan con el mismo
  // token (doble clic, un cliente de email que "precarga" el enlace, un
  // reintento de red), Postgres serializa las dos y solo UNA consigue
  // count === 1. Sin esto, ambas podían pasar isActivationTokenUsable()
  // leyendo la misma fila todavía sin usar y terminar creando dos
  // InternalTrafficDevice para un solo enlace.
  const claim = await prisma.internalTrafficActivationToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claim.count === 0) {
    return {
      success: false,
      error:
        "Este enlace ya no es válido (venció o ya se usó). Pedí uno nuevo desde el panel de administración.",
    };
  }

  const deviceToken = randomBytes(32).toString("hex");
  await prisma.internalTrafficDevice.create({
    data: { label: activation.label, tokenHash: hashToken(deviceToken) },
  });

  const store = await cookies();
  store.set(INTERNAL_TRAFFIC_COOKIE_NAME, deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
  });

  return { success: true };
}

// Desde el propio dispositivo: revoca la fila (si existe) Y borra la
// cookie. Revocar server-side, no solo borrar la cookie local, importa
// porque una copia filtrada del valor de la cookie seguiría funcionando si
// solo se borrara acá. Idempotente -- sin cookie o sin fila que coincida,
// igual "tiene éxito" en el sentido de que el estado final es "no interno".
export async function deactivateInternalTrafficAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(INTERNAL_TRAFFIC_COOKIE_NAME)?.value;
  if (token) {
    await prisma.internalTrafficDevice.updateMany({
      where: { tokenHash: hashToken(token) },
      data: { revokedAt: new Date() },
    });
  }
  store.delete(INTERNAL_TRAFFIC_COOKIE_NAME);
}
