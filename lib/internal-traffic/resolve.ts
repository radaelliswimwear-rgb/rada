import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "lib/prisma";
import { computeInternalTrafficStatus } from "./status";
import type { InternalTrafficStatus } from "./status";

export { computeInternalTrafficStatus, marketingExclusionReasonFor } from "./status";
export type { InternalTrafficStatus } from "./status";

// Fase 0 de analytics: cookie que marca un navegador/dispositivo del propio
// equipo (fundadora, familia) como tráfico interno -- ver
// lib/internal-traffic/activation-actions.ts para cómo se activa/desactiva.
export const INTERNAL_TRAFFIC_COOKIE_NAME = "radaelli_internal";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Única fuente que cualquier futura integración de analytics (GA4, Meta
// Pixel, Meta CAPI, dashboard propio, click_whatsapp, funnels) debe
// consultar para decidir si excluir un hit -- nunca una lógica aparte por
// plataforma. También es el punto que lib/payments/payments-actions.ts
// llama al crear un Payment, para congelar el resultado en
// Payment.marketingExclusionReason antes de que la clienta salga del sitio
// (el webhook/return/cron que confirman el pago después nunca tienen esta
// cookie disponible).
export async function resolveInternalTraffic(): Promise<InternalTrafficStatus> {
  const store = await cookies();
  const token = store.get(INTERNAL_TRAFFIC_COOKIE_NAME)?.value;
  if (!token) return computeInternalTrafficStatus(null);

  const device = await prisma.internalTrafficDevice.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, revokedAt: true },
  });
  return computeInternalTrafficStatus(device);
}
