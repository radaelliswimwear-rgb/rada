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
import { logAdminMutation, logEvent } from "lib/observability/log";
import { requireAdmin, requireUser, UnauthorizedError } from "./authorize";
import { hashPassword, verifyPassword } from "./password";
import {
  checkRateLimit,
  hashRateLimitIdentifier,
  RateLimitError,
} from "./rate-limit";
import {
  createSession,
  destroyAllSessionsForUser,
  destroySession,
  getCurrentUser as getSessionUser,
} from "./session";
import type { AuthResult, PublicUser, User } from "./types";
import {
  consumeVerificationToken,
  createVerificationToken,
} from "./verification-tokens";

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
    emailVerifiedAt: row.emailVerifiedAt
      ? row.emailVerifiedAt.toISOString()
      : null,
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
  // El evento de mayor severidad de todo el hardening de mutaciones admin:
  // alerta siempre, sin importar a qué rol se cambió. Nunca el email de la
  // cuenta afectada, solo su id -- suficiente para investigar desde
  // SystemLog o la propia base.
  logAdminMutation({
    adminId: admin.id,
    action: "role_change",
    targetType: "User",
    targetId: userId,
    outcome: "success",
    reason: `role -> ${role}`,
    alert: true,
  });
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
    emailVerifiedAt: user.emailVerifiedAt
      ? user.emailVerifiedAt.toISOString()
      : null,
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
    return {
      success: false,
      error: "Completá todos los campos correctamente.",
    };
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
    data: {
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      role: "USER",
    },
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
  // qué correos tienen cuenta. El logueo interno (nunca expuesto al
  // cliente) SÍ puede distinguir el motivo -- solo lo ve SystemLog/consola.
  if (!row || !row.passwordHash) {
    await logEvent({
      event: "auth.login_failed",
      severity: "warn",
      outcome: "unknown_email",
    });
    return { success: false, error: "Email o contraseña incorrectos." };
  }
  const { valid, needsRehash } = await verifyPassword(
    password,
    row.passwordHash,
  );
  if (!valid) {
    await logEvent({
      event: "auth.login_failed",
      severity: "warn",
      userId: row.id,
      outcome: "invalid_password",
    });
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
  await logEvent({
    event: "auth.login_success",
    severity: "info",
    userId: row.id,
  });
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
  // Auditoría de seguridad (sep. 2026): freno propio por IP, además del
  // freno existente por email -- el límite por email por sí solo no frena a
  // quien prueba muchos correos distintos desde la misma IP (barrido de
  // enumeración, o simple abuso para spamear la bandeja de terceros con
  // correos de "recuperación" no pedidos). Se resuelve la IP UNA sola vez,
  // se reusa tanto para el chequeo de límite como para el dedupeKey de la
  // alerta si se dispara.
  const ip = await getClientIp();
  try {
    await checkRateLimit(trimmedEmail, "password-reset-request");
    await checkRateLimit(ip, "password-reset-request-ip");
  } catch (error) {
    if (error instanceof RateLimitError) {
      // .catch(), no try/catch -- un fallo de observabilidad (SystemLog/
      // correo de alerta caídos) nunca debe poder tumbar esta respuesta:
      // seguiría siendo genérica igual, pero un throw acá la convertiría en
      // un error visible para la clienta por un problema que no es suyo ni
      // tiene nada que ver con su solicitud real.
      logEvent({
        event: "auth.password_reset_rate_limited",
        severity: "warn",
        reason: "Límite de solicitudes de recuperación de contraseña superado",
        dedupeKey: `auth.password_reset_rate_limited:${hashRateLimitIdentifier(ip)}`,
        alert: true,
      }).catch(() => undefined);
    }
    // Igual devuelve éxito genérico — no revela si el límite se disparó por
    // el email en sí (sería otra forma de enumerar cuentas).
    return { success: true };
  }

  const row = await prisma.user.findFirst({
    where: { email: { equals: trimmedEmail, mode: "insensitive" } },
  });
  // Mismo criterio que arriba: la observabilidad nunca debe poder bloquear
  // ni romper el flujo real de recuperación de contraseña.
  logEvent({
    event: "auth.password_reset_requested",
    severity: "info",
    userId: row?.id,
    outcome: row ? "known_email" : "unknown_email",
  }).catch(() => undefined);
  if (row) {
    const token = await createVerificationToken(row.id, "PASSWORD_RESET");
    const { subject, html } = passwordResetEmail(row.name, token);
    // Enumeración de usuarios por timing (auditoría de seguridad, sep.
    // 2026): esperar acá la llamada de red real a Resend haría que responder
    // tardara sistemáticamente más para un email que SÍ existe que para uno
    // que no -- una señal de timing remotamente medible. La respuesta a la
    // clienta ya es la misma genérica de siempre (arriba, "success: true"
    // en todos los casos) y nunca depende de que el correo ya haya salido;
    // el envío real sigue su curso server-side sin bloquear la respuesta,
    // mismo criterio "fire and forget tolerante a fallos" que ya usa el
    // resto de la app para correos que no son la fuente de verdad de nada.
    sendEmail({ to: row.email, subject, html }).catch((error) => {
      console.error(
        "requestPasswordResetAction: no se pudo enviar el correo de recuperación",
        error,
      );
    });
  }

  return { success: true };
}

export async function resetPasswordAction(
  token: string,
  newPassword: string,
): Promise<AuthResult> {
  if (newPassword.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  const userId = await consumeVerificationToken(token, "PASSWORD_RESET");
  if (!userId) {
    // Nunca se registra el token en sí -- solo el hecho de que un intento
    // de reset falló (enlace inválido/vencido/ya usado, sin distinguir
    // cuál, mismo criterio que el mensaje que ve la clienta). No bloqueante
    // (mismo criterio que el resto de este flujo): un fallo de
    // observabilidad acá nunca debe impedir que la clienta vea el mensaje
    // real de "enlace inválido".
    logEvent({
      event: "auth.password_reset_invalid_token",
      severity: "warn",
    }).catch(() => undefined);
    return { success: false, error: "El enlace no es válido o expiró." };
  }

  const passwordHash = await hashPassword(newPassword);
  const row = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Cambiar la contraseña cierra la sesión en todos los dispositivos — si
  // alguien más tenía acceso a la cuenta, este cambio lo saca. Esto y el
  // cambio de contraseña de arriba son el trabajo de seguridad real de esta
  // función -- ya sucedieron antes de que la observabilidad tenga
  // oportunidad de fallar, así que un fallo de logEvent/sendEmail de acá en
  // adelante nunca puede dejar la cuenta en un estado inseguro (contraseña
  // sin cambiar, o sesiones viejas sin invalidar).
  await destroyAllSessionsForUser(userId);
  logEvent({
    event: "auth.password_reset_completed",
    severity: "info",
    userId,
  }).catch(() => undefined);
  sendEmail({ to: row.email, ...passwordChangedEmail(row.name) }).catch(
    (error) => {
      console.error(
        "resetPasswordAction: no se pudo enviar el correo de confirmación",
        error,
      );
    },
  );

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
    where: {
      email: { equals: trimmedEmail, mode: "insensitive" },
      NOT: { id: currentUser.id },
    },
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
