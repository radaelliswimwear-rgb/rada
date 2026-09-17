import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SLUG = "bikini-foam";
const EXPECTED_CURRENT_PRICE = 199900;
const NEW_PRICE = 6250; // con el 20% de descuento activo -> final $5.000 exacto

const before = await prisma.product.findUnique({
  where: { slug: SLUG },
  select: { id: true, slug: true, name: true, priceValue: true, discountPercent: true },
});
if (!before) throw new Error(`Producto con slug "${SLUG}" no encontrado.`);

console.log("=== ANTES ===");
console.log(JSON.stringify(before, null, 2));

const variantM = await prisma.productVariant.findUnique({
  where: { productId_size: { productId: before.id, size: "M" } },
  select: { id: true, size: true, stock: true },
});
console.log("=== VARIANTE M (antes) ===");
console.log(JSON.stringify(variantM, null, 2));

if (before.priceValue !== EXPECTED_CURRENT_PRICE) {
  throw new Error(
    `ABORTADO: priceValue actual (${before.priceValue}) no coincide con el esperado (${EXPECTED_CURRENT_PRICE}). No se aplica ningún cambio.`,
  );
}
if (before.discountPercent !== 0) {
  throw new Error(
    `ABORTADO: el producto tiene un discountPercent propio (${before.discountPercent}), no 0 como se esperaba. No se aplica ningún cambio para evitar un precio final inesperado.`,
  );
}

const result = await prisma.product.updateMany({
  where: { slug: SLUG, priceValue: EXPECTED_CURRENT_PRICE },
  data: { priceValue: NEW_PRICE },
});
console.log("=== UPDATE ===");
console.log("filas afectadas:", result.count);

const after = await prisma.product.findUnique({
  where: { slug: SLUG },
  select: { id: true, slug: true, priceValue: true, discountPercent: true },
});
console.log("=== DESPUÉS ===");
console.log(JSON.stringify(after, null, 2));

await prisma.$disconnect();
