"use server";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/auth/authorize";

// Enlace de un solo uso: mismo TTL que PASSWORD_RESET
// (lib/auth/verification-tokens.ts) -- mismo nivel de sensibilidad, un
// secreto de vida corta que autoriza una acción puntual.
const ACTIVATION_TOKEN_TTL_MINUTES = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type CreateInternalTrafficActivationLinkResult = {
  token: string;
  expiresAt: string;
};

// El token real solo se devuelve ACÁ, una vez, a quien ya demostró ser
// admin -- nunca se guarda en texto plano (ver hashToken arriba) ni vuelve
// a mostrarse después.
export async function createInternalTrafficActivationLinkAction(
  label: string,
): Promise<CreateInternalTrafficActivationLinkResult> {
  await requireAdmin();

  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    throw new Error("El nombre del dispositivo no puede estar vacío.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + ACTIVATION_TOKEN_TTL_MINUTES * 60 * 1000,
  );

  await prisma.internalTrafficActivationToken.create({
    data: { label: trimmedLabel, tokenHash: hashToken(token), expiresAt },
  });

  return { token, expiresAt: expiresAt.toISOString() };
}

export type InternalTrafficDeviceSummary = {
  id: string;
  label: string;
  activatedAt: string;
  revoked: boolean;
};

export async function listInternalTrafficDevicesAction(): Promise<
  InternalTrafficDeviceSummary[]
> {
  await requireAdmin();
  const rows = await prisma.internalTrafficDevice.findMany({
    orderBy: { activatedAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    activatedAt: row.activatedAt.toISOString(),
    revoked: row.revokedAt !== null,
  }));
}

export async function revokeInternalTrafficDeviceAction(
  deviceId: string,
): Promise<void> {
  await requireAdmin();
  await prisma.internalTrafficDevice.update({
    where: { id: deviceId },
    data: { revokedAt: new Date() },
  });
}
