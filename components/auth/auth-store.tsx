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
import {
  getCurrentUserAction,
  loginAction,
  logoutAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  updateProfileAction,
} from "lib/auth/users-actions";
import type { AuthResult, PublicUser } from "lib/auth/types";
import { useLocalCart } from "components/cart-drawer/cart-store";
import { useWishlist } from "components/wishlist/wishlist-store";

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
  requestPasswordReset: (email: string) => Promise<{ success: true }>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthResult>;
  updateProfile: (data: { name: string; email: string }) => Promise<AuthResult>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Sprint 26: sesión real de servidor (cookie HttpOnly + tabla Session, ver
// lib/auth/session.ts) en vez de simularse sobre localStorage. Este
// Provider ya no guarda ni hashea nada client-side — cada método llama
// directo a la Server Action correspondiente en lib/auth/users-actions.ts,
// que valida todo contra Postgres. El contrato público (mismos nombres,
// misma forma de AuthResult) se mantiene igual a propósito: los formularios
// (login-form.tsx, register-form.tsx, etc.) y RequireAuth/RequireAdmin no
// necesitan cambiar nada.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // AuthProvider se monta dentro de LocalCartProvider/WishlistProvider (ver
  // app/layout.tsx), así que puede leer sus contextos directamente — se usa
  // solo para pedirles que vuelvan a cargar su estado (reload()) después de
  // iniciar/cerrar sesión, nunca para leer/mostrar carrito o favoritos acá.
  const { reload: reloadCart } = useLocalCart();
  const { reload: reloadWishlist } = useWishlist();

  const refresh = useCallback(async () => {
    const current = await getCurrentUserAction();
    setUser(current);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setIsLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const result = await loginAction(email, password);
      if (result.success) {
        // El merge de carrito/favoritos de invitado ya pasó server-side
        // dentro de loginAction — esto solo trae ese resultado a la UI.
        await Promise.all([refresh(), reloadCart(), reloadWishlist()]);
      }
      return result;
    },
    [refresh, reloadCart, reloadWishlist],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
    ): Promise<AuthResult> => {
      const result = await registerAction(name, email, password);
      if (result.success) {
        await Promise.all([refresh(), reloadCart(), reloadWishlist()]);
      }
      return result;
    },
    [refresh, reloadCart, reloadWishlist],
  );

  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
    // Vuelve a mostrar el carrito/favoritos de invitado de este navegador
    // (los de la cuenta quedan guardados server-side, no se pierden).
    await Promise.all([reloadCart(), reloadWishlist()]);
  }, [reloadCart, reloadWishlist]);

  const requestPasswordReset = useCallback(async (email: string) => {
    return requestPasswordResetAction(email);
  }, []);

  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<AuthResult> => {
      return resetPasswordAction(token, newPassword);
    },
    [],
  );

  const updateProfile = useCallback(
    async (data: { name: string; email: string }): Promise<AuthResult> => {
      const result = await updateProfileAction(data);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
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
      refresh,
    }),
    [
      user,
      isLoading,
      login,
      register,
      logout,
      requestPasswordReset,
      resetPassword,
      updateProfile,
      refresh,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Ver el mismo comentario en components/wishlist/wishlist-store.tsx: antes
// esto lanzaba una excepción y tumbaba toda la página ante un desajuste
// transitorio del Context (Fast Refresh en desarrollo, imposible en
// producción). Degrada a "sesión no disponible" (los intentos de
// login/registro devuelven un error claro) en vez de romper el sitio.
const AUTH_UNAVAILABLE_ERROR =
  "No se pudo verificar la sesión. Recargá la página e intentá de nuevo.";
const FALLBACK_AUTH: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => ({ success: false, error: AUTH_UNAVAILABLE_ERROR }),
  register: async () => ({ success: false, error: AUTH_UNAVAILABLE_ERROR }),
  logout: async () => {},
  requestPasswordReset: async () => ({ success: true }),
  resetPassword: async () => ({ success: false, error: AUTH_UNAVAILABLE_ERROR }),
  updateProfile: async () => ({ success: false, error: AUTH_UNAVAILABLE_ERROR }),
  refresh: async () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "useAuth: AuthContext no disponible (probablemente un Fast Refresh a mitad de carga) — usando una sesión vacía como reserva en vez de tumbar la página.",
      );
    }
    return FALLBACK_AUTH;
  }
  return context;
}
