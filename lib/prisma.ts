import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma 7 eliminó la resolución implícita de `DATABASE_URL` vía el bloque
// `datasource` del schema: el runtime exige un adaptador de driver explícito
// (independientemente del generador usado). `prisma.config.ts` sigue
// resolviendo DATABASE_URL para la CLI (migrate/generate); este archivo es
// el único responsable de la conexión en tiempo de ejecución de la app.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Configurala en .env (ver .env.example).",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
