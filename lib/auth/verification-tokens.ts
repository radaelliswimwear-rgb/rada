import { createHash, randomBytes } from "node:crypto";
import { prisma } from "lib/prisma";
import type { VerificationTokenType } from "@prisma/client";

// Reemplaza lib/auth/reset-tokens-storage.ts (localStorage — cualquiera que
// conociera el correo de otra persona podía "recuperar" su cuenta, porque
// el enlace se mostraba en pantalla en vez de enviarse por email). Mismo
// principio que Session (ver lib/auth/session.ts): el valor real del token
// viaja solo en el email, en la base de datos se guarda su hash. Se
// reutiliza esta misma tabla para verificación de email y recuperación de
// contraseña — el campo `type` distingue una cosa de la otra.
const TOKEN_TTL_MINUTES: Record<VerificationTokenType, number> = {
  EMAIL_VERIFY: 60 * 24, // 24 horas
  PASSWORD_RESET: 30, // 30 minutos
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(
  userId: string,
  type: VerificationTokenType,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES[type] * 60 * 1000);

  // Invalida cualquier token sin usar del mismo tipo antes de crear uno
  // nuevo — pedir "reenviar" no debe dejar dos enlaces viejos funcionando
  // en paralelo.
  await prisma.verificationToken.deleteMany({
    where: { userId, type, usedAt: null },
  });
  await prisma.verificationToken.create({
    data: { userId, tokenHash, type, expiresAt },
  });
  return token;
}

// Null si el token no existe, es de otro tipo, ya se usó o venció — un solo
// camino de "enlace inválido", sin distinguir el motivo exacto al usuario.
//
// Auditoría de seguridad (sep. 2026, hardening auth/password reset): el
// consumo es un reclamo atómico (`updateMany` condicionado a `usedAt:
// null`, mismo patrón ya establecido en todo el proyecto para "exactamente
// una vez" -- ver Payment.stockReleased, Session) y no un "leer y después
// actualizar". Sin esto, dos requests concurrentes con el MISMO token
// (doble clic, dos pestañas con el mismo enlace de email) podían pasar el
// chequeo de `usedAt` antes de que cualquiera de las dos escribiera,
// violando la garantía de un solo uso.
export async function consumeVerificationToken(
  token: string,
  type: VerificationTokenType,
): Promise<string | null> {
  const tokenHash = hashToken(token);
  const row = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) {
    return null;
  }
  const claimed = await prisma.verificationToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return null; // otra llamada concurrente ya lo consumió
  return row.userId;
}
