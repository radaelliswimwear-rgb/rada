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
export async function consumeVerificationToken(
  token: string,
  type: VerificationTokenType,
): Promise<string | null> {
  const tokenHash = hashToken(token);
  const row = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) {
    return null;
  }
  await prisma.verificationToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return row.userId;
}
