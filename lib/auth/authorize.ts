import { getCurrentUser } from "./session";

// Guard central de autorización (Sprint 26). Toda Server Action que mute o
// exponga datos sensibles llama a una de estas dos funciones como PRIMERA
// línea de su cuerpo — nunca se confía en que la UI ya ocultó el botón: la
// auditoría de seguridad encontró que ninguna de las 17 acciones de
// lib/admin/* ni updateUserRoleAction verificaban quién llamaba, así que
// cualquiera podía invocarlas directo (DevTools, replay de la request) y
// convertirse en administrador o leer/editar todo el catálogo y los
// pedidos de cualquier clienta. Lanzar en vez de devolver un valor de
// error: cada Server Action existente ya maneja excepciones a su manera
// (algunas las dejan burbujear a la UI como toast, otras las capturan) —
// esto se integra sin tener que rediseñar el manejo de errores de cada una.
export class UnauthorizedError extends Error {
  constructor(message = "No autorizado.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError("Necesitás iniciar sesión.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new UnauthorizedError("No tenés permisos de administrador.");
  }
  return user;
}
