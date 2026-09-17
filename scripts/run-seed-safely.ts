// Wrapper de `npm run db:seed`. NO modifica prisma/seed.ts -- esa
// restricción sigue vigente. En su lugar, resuelve DATABASE_URL de forma
// segura con el loader central (scripts/lib/load-safe-env.ts) ANTES de
// lanzar prisma/seed.ts, y se lo pasa explícitamente como variable de
// entorno al proceso hijo. Así, sin importar qué haga seed.ts internamente
// con dotenv, nunca puede terminar apuntando en silencio a `.env` (hoy: la
// base histórica ep-solitary-scene) -- si DATABASE_URL no se puede resolver
// de forma segura, este wrapper aborta antes de ejecutar nada.
import { spawnSync } from "node:child_process";
import {
  describeDatabaseTarget,
  resolveDatabaseUrl,
} from "./lib/load-safe-env";

const { databaseUrl, target } = resolveDatabaseUrl({
  requireEnvironmentLabel: true,
});
console.log("db:seed -> ejecutando prisma/seed.ts contra:");
console.log(describeDatabaseTarget(target));

const result = spawnSync("npx tsx prisma/seed.ts", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

if (result.error) {
  console.error("db:seed -> no se pudo ejecutar prisma/seed.ts:", result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
