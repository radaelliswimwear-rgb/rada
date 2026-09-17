import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SLUG = "bikini-foam";
const EXPECTED_TEST_PRICE = 6250;
const ORIGINAL_PRICE = 199900;

const before = await prisma.product.findUnique({
  where: { slug: SLUG },
  select: { id: true, slug: true, priceValue: true, discountPercent: true },
});
if (!before) throw new Error(`Producto con slug "${SLUG}" no encontrado.`);

console.log("=== ANTES DE RESTAURAR ===");
console.log(JSON.stringify(before, null, 2));

if (before.priceValue !== EXPECTED_TEST_PRICE) {
  throw new Error(
    `ABORTADO: priceValue actual (${before.priceValue}) no coincide con el precio temporal esperado (${EXPECTED_TEST_PRICE}). No se aplica ningún cambio.`,
  );
}

const result = await prisma.product.updateMany({
  where: { slug: SLUG, priceValue: EXPECTED_TEST_PRICE },
  data: { priceValue: ORIGINAL_PRICE },
});
console.log("=== UPDATE (restauración) ===");
console.log("filas afectadas:", result.count);

const after = await prisma.product.findUnique({
  where: { slug: SLUG },
  select: { id: true, slug: true, priceValue: true, discountPercent: true },
});
console.log("=== DESPUÉS DE RESTAURAR ===");
console.log(JSON.stringify(after, null, 2));

await prisma.$disconnect();
