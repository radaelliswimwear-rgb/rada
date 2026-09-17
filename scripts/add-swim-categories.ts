import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  describeDatabaseTarget,
  resolveDatabaseUrl,
} from "./lib/load-safe-env";

const { databaseUrl, target } = resolveDatabaseUrl({
  requireEnvironmentLabel: true,
});
console.log("add-swim-categories -> este script va a escribir en:");
console.log(describeDatabaseTarget(target));

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const NEW_CATEGORIES = [
  { slug: "oasis-natural", name: "Oasis Natural" },
  { slug: "aurora-viva", name: "Aurora Viva" },
  { slug: "espuma-de-ola", name: "Espuma de Ola" },
  { slug: "salidas-de-bano", name: "Salidas de Baño" },
] as const;

async function main() {
  for (const category of NEW_CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    console.log("Categoría lista:", row.slug, row.id);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
