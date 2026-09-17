import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  describeDatabaseTarget,
  resolveDatabaseUrl,
} from "./lib/load-safe-env";

const { databaseUrl, target } = resolveDatabaseUrl({
  requireEnvironmentLabel: true,
});
console.log("add-sunset-products -> este script va a escribir en:");
console.log(describeDatabaseTarget(target));

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const PRODUCTS = [
  {
    slug: "bikini-foam",
    name: "Bikini Foam",
    categorySlug: "oasis-natural",
    priceValue: 220000,
    color: "Blanco",
    description: "Bikini de triángulo en blanco espuma, con detalle de aro.",
    sizes: ["XS", "S", "M", "L"],
    image: "/images/products/1.webp",
  },
  {
    slug: "entero-shadow-palm",
    name: "Entero Shadow Palm",
    categorySlug: "aurora-viva",
    priceValue: 250000,
    color: "Negro",
    description: "Enterizo en negro con espalda anudada y escote profundo.",
    sizes: ["XS", "S", "M", "L", "XL"],
    image: "/images/products/1 (1).webp",
  },
  {
    slug: "entero-golden-hour",
    name: "Entero Golden Hour",
    categorySlug: "espuma-de-ola",
    priceValue: 250000,
    color: "Mostaza",
    description: "Enterizo escote profundo en tono mostaza, inspirado en la hora dorada.",
    sizes: ["S", "M", "L"],
    image: "/images/products/002.webp",
  },
  {
    slug: "bikini-palm",
    name: "Bikini Palm",
    categorySlug: "salidas-de-bano",
    priceValue: 220000,
    color: "Verde oliva",
    description: "Bikini de triángulo cruzado en verde oliva.",
    sizes: ["XS", "S", "M", "L"],
    image: "/images/products/1.webp",
  },
] as const;

async function main() {
  for (const [index, product] of PRODUCTS.entries()) {
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
    });
    if (!category) throw new Error(`Categoría '${product.categorySlug}' no encontrada`);

    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        slug: product.slug,
        name: product.name,
        categoryId: category.id,
        priceValue: product.priceValue,
        color: product.color,
        description: product.description,
        featured: false,
        images: { create: [{ url: product.image, position: 0 }] },
        variants: {
          create: product.sizes.map((size) => ({ size, stock: 25 })),
        },
      },
    });
    console.log(`[${index + 1}/${PRODUCTS.length}] Producto listo:`, row.slug, row.id);
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
