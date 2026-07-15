"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hashPassword, verifyPassword } from "lib/auth/password";
import { resetTokensStorage } from "lib/auth/reset-tokens-storage";
import { sessionStorage } from "lib/auth/session-storage";
import type { AuthResult, PublicUser, User } from "lib/auth/types";
import { usersStorage } from "lib/auth/users-storage";

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

type AuthContextValue = {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  requestPasswordReset: (
    email: string,
  ) => Promise<{ success: true; resetUrl: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthResult>;
  updateProfile: (data: { name: string; email: string }) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Simula un backend de autenticación completo sobre localStorage. Todos los
// métodos son async: al conectar Prisma + Auth.js/Clerk, este archivo es el
// único a reemplazar por llamadas reales — la UI (formularios, RequireAuth,
// páginas de /cuenta) no cambia (ver docs/ARCHITECTURE.md).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userId = await sessionStorage.get();
      if (userId) {
        const users = await usersStorage.getAll();
        const found = users.find((u) => u.id === userId);
        if (found) setUser(toPublicUser(found));
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const found = await usersStorage.findByEmail(email);
      if (!found) return { success: false, error: "Email o contraseña incorrectos." };
      const valid = await verifyPassword(password, found.passwordHash);
      if (!valid) return { success: false, error: "Email o contraseña incorrectos." };
      await sessionStorage.set(found.id);
      setUser(toPublicUser(found));
      return { success: true };
    },
    [],
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const existing = await usersStorage.findByEmail(email);
      if (existing) {
        return { success: false, error: "Ya existe una cuenta con este email." };
      }
      const passwordHash = await hashPassword(password);
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      await usersStorage.upsert(newUser);
      await sessionStorage.set(newUser.id);
      setUser(toPublicUser(newUser));
      return { success: true };
    },
    [],
  );

  const logout = useCallback(async () => {
    await sessionStorage.clear();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const token = await resetTokensStorage.create(email);
    // En producción esto se envía por email; en modo demo se devuelve la URL
    // directamente para poder completar el flujo sin backend de correo.
    const resetUrl = `/cuenta/restablecer-contrasena?token=${token}`;
    return { success: true as const, resetUrl };
  }, []);

  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<AuthResult> => {
      const email = await resetTokensStorage.consume(token);
      if (!email) {
        return { success: false, error: "El enlace no es válido o expiró." };
      }
      const found = await usersStorage.findByEmail(email);
      if (!found) {
        return { success: false, error: "No encontramos una cuenta con ese email." };
      }
      found.passwordHash = await hashPassword(newPassword);
      await usersStorage.upsert(found);
      return { success: true };
    },
    [],
  );

  const updateProfile = useCallback(
    async (data: { name: string; email: string }): Promise<AuthResult> => {
      if (!user) return { success: false, error: "No hay sesión activa." };
      const conflict = await usersStorage.findByEmail(data.email);
      if (conflict && conflict.id !== user.id) {
        return { success: false, error: "Ese email ya está en uso." };
      }
      const users = await usersStorage.getAll();
      const found = users.find((u) => u.id === user.id);
      if (!found) return { success: false, error: "No encontramos tu cuenta." };
      found.name = data.name;
      found.email = data.email;
      await usersStorage.upsert(found);
      setUser(toPublicUser(found));
      return { success: true };
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      requestPasswordReset,
      resetPassword,
      updateProfile,
    }),
    [user, isLoading, login, register, logout, requestPasswordReset, resetPassword, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
