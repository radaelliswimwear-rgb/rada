import {
  findUserByEmailAction,
  getAllUsersAction,
  upsertUserAction,
} from "./users-actions";

// Adaptador Prisma/Postgres (Sprint 12). Mismo contrato público que antes
// (localStorage, Sprint 9) — components/auth/auth-store.tsx no cambia.
export const usersStorage = {
  getAll: getAllUsersAction,
  findByEmail: findUserByEmailAction,
  upsert: upsertUserAction,
};
