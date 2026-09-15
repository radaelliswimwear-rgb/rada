"use server";

import { prisma } from "lib/prisma";
import type { User as UserRow } from "@prisma/client";
import { mergeGuestCartIntoUserAction } from "lib/cart/cart-actions";
import { sendEmail } from "lib/email/send";
import { mergeGuestWishlistIntoUserAction } from "lib/wishlist/wishlist-actions";
import {
  passwordChangedEmail,
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
} from "lib/email/templates";
import { getClientIp } from "lib/request/client-ip";
import { requireAdmin, requireUser, UnauthorizedError } from "./authorize";
import { hashPassword, verifyPassword } from "./password";
import { checkRateLimit, RateLimitError } from "./rate-limit";
import {
  createSession,
  destroyAllSessionsForUser,
  destroySession,
  getCurrentUser as getSessionUser,
} from "./session";
import type { AuthResult, PublicUser, User } from "./types";
import { consumeVerificationToken, createVerificationToken } from "./verification-tokens";

// Server Actions que hablan con Postgres vía Prisma. Un "use server" file
// solo puede exportar funciones async al nivel superior (no objetos) — por
// eso users-storage.ts las reagrupa en el objeto `usersStorage` que ya
// consumía components/auth/auth-store.tsx.
//
// Sprint 26: reescrito de punta a punta para dejar de simular un backend
// (SHA-256 sin sal en el cliente, sesión en localStorage) y pasar a sesión
// real de servidor (lib/auth/session.ts) + hashing scrypt (lib/auth/
// password.ts). El contrato público (nombres de función, forma de
// AuthResult) se mantiene igual para que auth-store.tsx cambie lo mínimo.
function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash ?? "",
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    emailVerifiedAt: row.emailVerifiedAt ? row.emailVerifiedAt.toISOString() : null,
  };
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

// Solo para /admin/usuarios — expone todos los correos, por eso exige
// admin. Ver auditoría de seguridad en el plan: antes cualquiera podía
// llamar esto directo y listar todas las clientas.
export async function getAllUsersAction(): Promise<User[]> {
  try {
    await requireAdmin();
    const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toUser);
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    console.error("getAllUsersAction: no se pudo leer usuarios", error);
    return [];
  }
}

// Separado del alta/edición normal a propósito (Sprint 14): el rol solo lo
// cambia el Panel Administrativo. Sprint 26 agrega el candado real: exige
// admin (antes cualquiera podía llamarlo sin sesión y autopromoverse) y
// bloquea que un admin se quite el rol a sí mismo por accidente y se quede
// afuera del panel sin nadie más que se lo pueda devolver.
export async function updateUserRoleAction(
  userId: string,
  role: User["role"],
): Promise<AuthResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return {
      success: false,
      error: "No podés cambiar tu propio rol.",
    };
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  return { success: true };
}

// Devuelve el usuario de la sesión actual (cookie httpOnly verificada
// contra la tabla Session) — reemplaza el `sessionStorage.get() +
// usersStorage.getAll()` de localStorage. AuthProvider llama esto al
// montar en vez de pedir la lista completa de usuarios.
export async function getCurrentUserAction(): Promise<PublicUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
  };
}

export async function registerAction(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  if (!trimmedName || !trimmedEmail || password.length < 8) {
    return { success: false, error: "Completá todos los campos correctamente." };
  }

  try {
    await checkRateLimit(trimmedEmail, "register");
    await checkRateLimit(await getClientIp(), "register-ip");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: trimmedEmail, mode: "insensitive" } },
  });
  if (existing) {
    return { success: false, error: "Ya existe una cuenta con este email." };
  }

  const passwordHash = await hashPassword(password);
  // El registro público SIEMPRE crea role: "USER" — nunca se lee un rol del
  // formulario ni de ningún otro dato que mande el cliente. Convertirse en
  // ADMIN solo puede pasar vía updateUserRoleAction, y solo otro admin
  // puede llamarla.
  const row = await prisma.user.create({
    data: { name: trimmedName, email: trimmedEmail, passwordHash, role: "USER" },
  });

  await createSession(row.id);
  // Carrito/favoritos de invitado (si venía navegando sin cuenta) pasan a
  // ser los de la cuenta recién creada — ver lib/cart/cart-actions.ts.
  await Promise.all([
    mergeGuestCartIntoUserAction(row.id),
    mergeGuestWishlistIntoUserAction(row.id),
  ]);

  const token = await createVerificationToken(row.id, "EMAIL_VERIFY");
  const verification = verificationEmail(row.name, token);
  const welcome = welcomeEmail(row.name);
  await Promise.all([
    sendEmail({ to: row.email, ...verification }),
    sendEmail({ to: row.email, ...welcome }),
  ]);

  return { success: true };
}

export async function loginAction(
  email: string,
  password: string,
): Promise<AuthResult> {
  const trimmedEmail = email.trim().toLowerCase();

  try {
    await checkRateLimit(trimmedEmail, "login");
    await checkRateLimit(await getClientIp(), "login-ip");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  const row = await prisma.user.findFirst({
    where: { email: { equals: trimmedEmail, mode: "insensitive" } },
  });
  // Mismo mensaje genérico tanto si el email no existe como si la
  // contraseña es incorrecta — no hay que ayudar a un atacante a enumerar
  // qué correos tienen cuenta.
  if (!row || !row.passwordHash) {
    return { success: false, error: "Email o contraseña incorrectos." };
  }
  const { valid, needsRehash } = await verifyPassword(password, row.passwordHash);
  if (!valid) {
    return { success: false, error: "Email o contraseña incorrectos." };
  }

  if (needsRehash) {
    // Cuenta creada antes del Sprint 26 (hash SHA-256 sin sal, calculado en
    // el navegador) — ya que tenemos la contraseña en texto plano acá
    // (nunca antes, nunca después de este request), se aprovecha para
    // migrarla a scrypt sin que la clienta tenga que hacer nada.
    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: row.id }, data: { passwordHash } });
  }

  await createSession(row.id);
  // Mismo motivo que en registerAction: si venía con carrito/favoritos de
  // invitado en este navegador, se suman a los de la cuenta.
  await Promise.all([
    mergeGuestCartIntoUserAction(row.id),
    mergeGuestWishlistIntoUserAction(row.id),
  ]);
  return { success: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}

// Ya no recibe email desde el cliente para el reset: siempre opera sobre la
// cuenta con sesión activa. Nunca confirma si el email existe o no en la
// respuesta (evita que alguien use esto para descubrir qué correos están
// registrados) — el mensaje en la UI es siempre el mismo genérico.
export async function requestPasswordResetAction(
  email: string,
): Promise<{ success: true }> {
  const trimmedEmail = email.trim().toLowerCase();
  try {
    await checkRateLimit(trimmedEmail, "password-reset-request");
  } catch {
    // Igual devuelve éxito genérico — no revela si el límite se disparó por
    // el email en sí (sería otra forma de enumerar cuentas).
    return { success: true };
  }

  const row = await prisma.user.findFirst({
    where: { email: { equals: trimmedEmail, mode: "insensitive" } },
  });
  if (row) {
    const token = await createVerificationToken(row.id, "PASSWORD_RESET");
    const { subject, html } = passwordResetEmail(row.name, token);
    await sendEmail({ to: row.email, subject, html });
  }

  return { success: true };
}

export async function resetPasswordAction(
  token: string,
  newPassword: string,
): Promise<AuthResult> {
  if (newPassword.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const userId = await consumeVerificationToken(token, "PASSWORD_RESET");
  if (!userId) {
    return { success: false, error: "El enlace no es válido o expiró." };
  }

  const passwordHash = await hashPassword(newPassword);
  const row = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Cambiar la contraseña cierra la sesión en todos los dispositivos — si
  // alguien más tenía acceso a la cuenta, este cambio lo saca.
  await destroyAllSessionsForUser(userId);
  await sendEmail({ to: row.email, ...passwordChangedEmail(row.name) });

  return { success: true };
}

export async function verifyEmailAction(token: string): Promise<AuthResult> {
  const userId = await consumeVerificationToken(token, "EMAIL_VERIFY");
  if (!userId) {
    return { success: false, error: "El enlace no es válido o expiró." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  return { success: true };
}

// Ya no recibe el usuario a editar desde el cliente: siempre opera sobre la
// cuenta con sesión activa (requireUser()), cerrando el hueco de que
// alguien pudiera editar el perfil de otra persona pasando otro id.
export async function updateProfileAction(data: {
  name: string;
  email: string;
}): Promise<AuthResult> {
  const currentUser = await requireUser();
  const trimmedEmail = data.email.trim().toLowerCase();
  const trimmedName = data.name.trim();
  if (!trimmedName || !trimmedEmail) {
    return { success: false, error: "Completá nombre y email." };
  }

  const conflict = await prisma.user.findFirst({
    where: { email: { equals: trimmedEmail, mode: "insensitive" }, NOT: { id: currentUser.id } },
  });
  if (conflict) {
    return { success: false, error: "Ese email ya está en uso." };
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { name: trimmedName, email: trimmedEmail },
  });
  return { success: true };
}
