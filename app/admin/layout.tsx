import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "lib/auth/session";

// Candado server-side de /admin/* (Sprint 26). Antes de esto, cada página
// admin pedía sus datos (usersStorage.getAll(), etc.) directo en el Server
// Component, y la única protección era <RequireAdmin> — un componente
// client-side que decide DESPUÉS de que React ya se montó en el navegador,
// no antes de que el servidor haya hecho las consultas. Con requireAdmin()
// ya agregado a cada Server Action (ver lib/auth/authorize.ts), un
// visitante sin permiso ya no podía ver los datos — pero se encontraba con
// una página de error en vez de una redirección prolija. Este layout
// corta el paso más temprano, antes de que cualquier página hija intente
// pedir nada.
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/cuenta/iniciar-sesion");
  }
  if (user.role !== "ADMIN") {
    redirect("/cuenta");
  }
  return <>{children}</>;
}
