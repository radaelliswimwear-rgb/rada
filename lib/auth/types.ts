export type UserRole = "USER" | "ADMIN";

// Formas pensadas para mapear 1:1 a un futuro esquema de Prisma / Auth.js / Clerk:
// User -> tabla `User` (passwordHash solo se usará si se sigue con credenciales
// propias; con Auth.js/Clerk esta tabla se reemplaza por la del proveedor).
export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
};

// Nunca se expone passwordHash a la UI ni al Context.
export type PublicUser = Omit<User, "passwordHash">;

export type ResetToken = {
  token: string;
  email: string;
  expiresAt: string;
};

export type AuthResult = { success: true } | { success: false; error: string };
