import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const WOMPI_TX_ID = "1502702-1789675435-91473";

const payment = await prisma.payment.findFirst({
  where: { wompiTransactionId: WOMPI_TX_ID },
});
console.log("=== PAYMENT ===");
console.log(JSON.stringify(payment, null, 2));

if (payment?.orderId) {
  const order = await prisma.order.findUnique({
    where: { id: payment.orderId },
    include: { items: true },
  });
  console.log("=== ORDER ===");
  console.log(JSON.stringify(order, null, 2));

  const outbox = await prisma.emailOutbox.findMany({
    where: { orderId: payment.orderId },
    orderBy: { createdAt: "asc" },
  });
  console.log("=== EMAIL OUTBOX ===");
  console.log(JSON.stringify(outbox, null, 2));
} else {
  console.log("=== ORDER ===");
  console.log("Sin orderId en el Payment todavia (o Payment no encontrado).");
}

// Cuantos Orders/Payments existen en total para este mismo wompiTransactionId
// (para descartar duplicados) y para el producto bikini-foam en general.
const allPaymentsForTx = await prisma.payment.findMany({
  where: { wompiTransactionId: WOMPI_TX_ID },
  select: { id: true, orderId: true, status: true, createdAt: true },
});
console.log("=== TODOS LOS PAYMENTS CON ESTE wompiTransactionId ===");
console.log(JSON.stringify(allPaymentsForTx, null, 2));

const variantM = await prisma.productVariant.findFirst({
  where: { product: { slug: "bikini-foam" }, size: "M" },
  select: { id: true, size: true, stock: true },
});
console.log("=== STOCK ACTUAL TALLA M (bikini-foam) ===");
console.log(JSON.stringify(variantM, null, 2));

await prisma.$disconnect();
