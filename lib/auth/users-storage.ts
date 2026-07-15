import type { User } from "./types";

// "Tabla" de usuarios. Adaptador reemplazable por Prisma/Auth.js/Clerk sin
// tocar components/auth/auth-store.tsx (mismo patrón que lib/wishlist y lib/cart,
// ver docs/ARCHITECTURE.md).
const STORAGE_KEY = "lago-users:v1";

function isUser(value: unknown): value is User {
  const v = value as User;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.passwordHash === "string" &&
    typeof v.createdAt === "string"
  );
}

export const usersStorage = {
  async getAll(): Promise<User[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isUser);
    } catch {
      return [];
    }
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const users = await this.getAll();
    return users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  },

  async save(users: User[]): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  async upsert(user: User): Promise<void> {
    const users = await this.getAll();
    const index = users.findIndex((u) => u.id === user.id);
    if (index === -1) {
      users.push(user);
    } else {
      users[index] = user;
    }
    await this.save(users);
  },
};
