"use server";

import { prisma } from "lib/prisma";
import type { User as UserRow } from "@prisma/client";
import type { User } from "./types";

// Server Actions que hablan con Postgres vía Prisma. Un "use server" file
// solo puede exportar funciones async al nivel superior (no objetos) — por
// eso users-storage.ts las reagrupa en el objeto `usersStorage` que ya
// consumía components/auth/auth-store.tsx, sin tocar ese archivo.
function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash ?? "",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAllUsersAction(): Promise<User[]> {
  // AuthProvider llama esto al montar (en toda página, vía app/layout.tsx)
  // cuando hay una sesión guardada — si Postgres no está disponible, degrada
  // a "sin sesión" en vez de tirar abajo el render. Se loguea igual
  // server-side, no se oculta el fallo.
  try {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toUser);
  } catch (error) {
    console.error("getAllUsersAction: no se pudo leer usuarios", error);
    return [];
  }
}

export async function findUserByEmailAction(
  email: string,
): Promise<User | undefined> {
  const row = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  return row ? toUser(row) : undefined;
}

export async function upsertUserAction(user: User): Promise<void> {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
    },
    create: {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
    },
  });
}
