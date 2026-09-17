// Carga DATABASE_URL (y demás env vars) con el mismo loader central que
// usan los scripts de scripts/*.ts (ver scripts/lib/load-safe-env.ts) --
// esa misma lógica reproduce la precedencia de Next.js: process.env
// explícito siempre gana, después .env.local, después .env. Antes este
// archivo usaba `dotenv/config`, que solo carga `.env` (nunca `.env.local`)
// -- eso permitía que Prisma CLI y la app en ejecución resolvieran bases de
// datos distintas en silencio. Un solo loader central evita tener dos
// sistemas de precedencia distintos en el repo.
import { defineConfig } from "prisma/config";
import { loadProjectEnv } from "./scripts/lib/load-safe-env";

loadProjectEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
