// Lógica pura, sin cookies() ni Prisma -- separada de resolve.ts a
// propósito, para poder probarla sin un request real ni DATABASE_URL (mismo
// patrón que computeInvalidCartLineIds / computeCartDisplayStatus en
// components/cart-drawer/cart-store.tsx).
export type InternalTrafficStatus = {
  isInternal: boolean;
  deviceId?: string;
};

// `device` es la fila YA buscada (o null si no había cookie o no hubo
// ningún match) -- un dispositivo revocado cuenta como "no interno", nunca
// se borra la fila (ver InternalTrafficDevice en prisma/schema.prisma).
export function computeInternalTrafficStatus(
  device: { id: string; revokedAt: Date | null } | null,
): InternalTrafficStatus {
  if (!device || device.revokedAt) return { isInternal: false };
  return { isInternal: true, deviceId: device.id };
}

// Único lugar que decide el string exacto que se guarda en
// Payment.marketingExclusionReason a partir del resultado de arriba -- para
// que nunca queden dos criterios (uno acá, otro donde se lea después).
export function marketingExclusionReasonFor(
  status: InternalTrafficStatus,
): string | null {
  return status.isInternal ? "internal_traffic" : null;
}

// Documenta y fija (con tests) la regla exacta de "¿este enlace de
// activación todavía sirve?" -- NO es lo que activateInternalTrafficAction
// usa para decidir de verdad: ahí la puerta real es un updateMany atómico
// condicionado (mismas dos condiciones: usedAt null, expiresAt en el
// futuro), necesario porque dos requests casi simultáneas con el mismo
// token no pueden resolverse de forma segura con un "leer y después
// escribir" en JS (ver el comentario en activation-actions.ts). Esta
// función existe para poder probar la regla sin Postgres; si esas dos
// condiciones cambian alguna vez, hay que cambiarlas acá Y en el
// updateMany.
export function isActivationTokenUsable(
  record: { usedAt: Date | null; expiresAt: Date } | null,
  now: Date,
): boolean {
  if (!record) return false;
  if (record.usedAt) return false;
  if (record.expiresAt < now) return false;
  return true;
}
