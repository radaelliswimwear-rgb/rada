"use server";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/auth/authorize";
import { logAdminMutation } from "lib/observability/log";

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
  const admin = await requireAdmin();

  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    throw new Error("El nombre del dispositivo no puede estar vacío.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + ACTIVATION_TOKEN_TTL_MINUTES * 60 * 1000,
  );

  const created = await prisma.internalTrafficActivationToken.create({
    data: { label: trimmedLabel, tokenHash: hashToken(token), expiresAt },
    select: { id: true },
  });

  // Nunca el token real -- solo que se generó un enlace, para qué
  // dispositivo (la etiqueta que el propio admin eligió, no un dato de
  // cliente) y el id de la fila.
  logAdminMutation({
    adminId: admin.id,
    action: "internal_traffic_activation_link_create",
    targetType: "InternalTrafficActivationToken",
    targetId: created.id,
    outcome: "success",
    reason: `label: ${trimmedLabel}`,
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
  const admin = await requireAdmin();
  await prisma.internalTrafficDevice.update({
    where: { id: deviceId },
    data: { revokedAt: new Date() },
  });
  logAdminMutation({
    adminId: admin.id,
    action: "internal_traffic_device_revoke",
    targetType: "InternalTrafficDevice",
    targetId: deviceId,
    outcome: "success",
  });
}
