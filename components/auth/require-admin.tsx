"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-store";

// Protección de /admin/*, mismo criterio client-side que RequireAuth (no hay
// sesión server-side todavía — ver docs/ARCHITECTURE.md). Además de exigir
// sesión, exige `role === "ADMIN"`; un usuario autenticado sin ese rol se
// redirige a /cuenta en vez de a login, porque sí tiene sesión válida, solo
// no tiene permiso para esta sección.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/cuenta/iniciar-sesion");
      return;
    }
    if (!isAdmin) {
      router.replace("/cuenta");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-neutral-500">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}
