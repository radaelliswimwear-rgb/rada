import { getAllUsersAction, updateUserRoleAction } from "./users-actions";

// Adaptador Prisma/Postgres (Sprint 12), usado hoy solo por el Panel
// Administrativo (/admin/usuarios). El flujo de sesión de clientas
// (registro/login/logout/perfil) llama directo a lib/auth/users-actions.ts
// desde components/auth/auth-store.tsx desde el Sprint 26 — ya no pasa por
// este adaptador. `findByEmail`/`upsert` se eliminaron junto con el hashing
// client-side que los llamaba: findUserByEmailAction exponía passwordHash
// completo como Server Action pública, un hueco de seguridad que dejó de
// existir al borrarla.
export const usersStorage = {
  getAll: getAllUsersAction,
  updateRole: updateUserRoleAction,
};
