import {
  findUserByEmailAction,
  getAllUsersAction,
  updateUserRoleAction,
  upsertUserAction,
} from "./users-actions";

// Adaptador Prisma/Postgres (Sprint 12). Mismo contrato público que antes
// (localStorage, Sprint 9) — components/auth/auth-store.tsx no cambia.
// updateRole se agrega en el Sprint 14 para el Panel Administrativo.
export const usersStorage = {
  getAll: getAllUsersAction,
  findByEmail: findUserByEmailAction,
  upsert: upsertUserAction,
  updateRole: updateUserRoleAction,
};
