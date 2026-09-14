import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "lib/prisma";
import type { User as UserRow } from "@prisma/client";

// Sesión real de servidor (Sprint 26) — reemplaza el localStorage
// client-only anterior (lib/auth/session-storage.ts, ya no se usa). Patrón
// estándar de "token opaco en cookie": el valor que viaja en la cookie es
// un secreto aleatorio de 32 bytes; en la base de datos SOLO se guarda su
// hash SHA-256 (igual que una contraseña), así una fuga de la tabla
// Session no entrega tokens utilizables. Verificar una sesión es: leer la
// cookie -> hashear -> buscar ese hash en la tabla -> chequear vencimiento.
const COOKIE_NAME = "radaelli_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 días

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toPublicUser(row: UserRow) {
  const { passwordHash: _passwordHash, ...publicUser } = row;
  return publicUser;
}

export async function createSession(
  userId: string,
  userAgent?: string | null,
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt, userAgent: userAgent ?? null },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

// Punto único de verdad de "quién está conectado" — toda Server Action que
// necesite saber el usuario actual llama a esto (o a requireUser/
// requireAdmin en lib/auth/authorize.ts), nunca confía en un userId que
// mande el cliente. Null tanto si no hay cookie como si el token no existe
// o ya venció en la base de datos — un solo camino de "no autenticado", sin
// distinguir el motivo (no hay nada útil que un atacante deba aprender de
// la diferencia).
export async function getCurrentUser(): Promise<Omit<UserRow, "passwordHash"> | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      // Sesión vencida encontrada: se borra de una vez (housekeeping barato,
      // no hace falta un cron aparte) en vez de dejarla acumulada.
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return toPublicUser(session.user);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(COOKIE_NAME);
}

// Cerrar sesión en TODOS los dispositivos (usado tras un cambio de
// contraseña, por ejemplo) — invalida cada fila de Session del usuario, no
// solo la cookie del navegador actual.
export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
