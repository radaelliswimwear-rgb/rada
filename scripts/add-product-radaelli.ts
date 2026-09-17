import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  describeDatabaseTarget,
  resolveDatabaseUrl,
} from "./lib/load-safe-env";

const { databaseUrl, target } = resolveDatabaseUrl({
  requireEnvironmentLabel: true,
});
console.log("add-product-radaelli -> este script va a escribir en:");
console.log(describeDatabaseTarget(target));

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: "mujer" },
  });
  if (!category) throw new Error("Categoría 'mujer' no encontrada");

  const product = await prisma.product.upsert({
    where: { slug: "radaelli-enterizo-navy" },
    update: {},
    create: {
      slug: "radaelli-enterizo-navy",
      name: "Radaelli",
      categoryId: category.id,
      priceValue: 250000,
      color: "Azul marino",
      description:
        "Enterizo de tiras finas con espalda cruzada y detalle de anudado, en azul marino.",
      featured: true,
      images: {
        create: [
          { url: "/images/products/1.webp", position: 0 },
          { url: "/images/products/1 (1).webp", position: 1 },
          { url: "/images/products/002.webp", position: 2 },
        ],
      },
      variants: {
        create: ["XS", "S", "M", "L", "XL"].map((size) => ({
          size,
          stock: 25,
        })),
      },
    },
  });

  console.log("Producto creado/actualizado:", product.slug, product.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
