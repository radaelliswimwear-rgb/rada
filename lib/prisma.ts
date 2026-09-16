import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { areWritesPaused, WritesPausedError, WRITE_OPERATIONS } from "lib/system/write-pause";

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
  const client = new PrismaClient({ adapter });

  // Único punto de bloqueo de escrituras de toda la app (ver
  // lib/system/write-pause.ts): esta app entera —sitio, panel /admin y
  // cron— usa este mismo cliente exportado, así que un solo $extends acá
  // cubre las tres superficies sin tocar cada acción de escritura por
  // separado. Las lecturas nunca se ven afectadas.
  return client.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        if (WRITE_OPERATIONS.has(operation) && areWritesPaused()) {
          throw new WritesPausedError(model ? `${model}.${operation}` : operation);
        }
        return query(args);
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
