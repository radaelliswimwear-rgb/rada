"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-store";

// Protección de rutas privadas client-side (no hay sesión server-side todavía
// — al conectar Auth.js/Clerk esto se reemplaza por middleware verificando
// una cookie de sesión real; ver docs/ARCHITECTURE.md).
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/cuenta/iniciar-sesion");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-neutral-500">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}
