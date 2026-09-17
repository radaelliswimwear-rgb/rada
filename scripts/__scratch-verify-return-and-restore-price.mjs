import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const WOMPI_TX_ID = "1502702-1789675435-91473";
const EXPECTED_ORDER_ID = "cmu5ykds4000104l25t0eoxdi";
const EXPECTED_PAYMENT_ID = "cmu5yhx1900010agm6l5wj22k";
const EXPECTED_STOCK_M = 24;

function fail(msg) {
  console.error("ABORTADO (no se restaura el precio):", msg);
  process.exit(1);
}

// --- FASE 1: verificar que el return fue idempotente ---

const payments = await prisma.payment.findMany({
  where: { wompiTransactionId: WOMPI_TX_ID },
  select: { id: true, orderId: true, status: true, createdAt: true, updatedAt: true },
});
console.log("=== PAYMENTS con este wompiTransactionId (post-return) ===");
console.log(JSON.stringify(payments, null, 2));
if (payments.length !== 1) fail(`Se esperaba exactamente 1 Payment, hay ${payments.length}.`);
const payment = payments[0];
if (payment.id !== EXPECTED_PAYMENT_ID) fail(`Payment ID distinto: ${payment.id}`);
if (payment.status !== "SUCCEEDED") fail(`Payment status inesperado: ${payment.status}`);
if (payment.orderId !== EXPECTED_ORDER_ID) fail(`orderId distinto: ${payment.orderId}`);

const orders = await prisma.order.findMany({
  where: { id: EXPECTED_ORDER_ID },
  select: { id: true, orderNumber: true, total: true },
});
console.log("=== ORDER (post-return) ===");
console.log(JSON.stringify(orders, null, 2));
if (orders.length !== 1) fail(`Order #1005 no encontrado o duplicado: ${orders.length} filas.`);

const ordersForSameNumber = await prisma.order.findMany({
  where: { orderNumber: orders[0].orderNumber },
  select: { id: true },
});
if (ordersForSameNumber.length !== 1) {
  fail(`orderNumber ${orders[0].orderNumber} aparece en ${ordersForSameNumber.length} Orders -- no es único.`);
}

const variantM = await prisma.productVariant.findFirst({
  where: { product: { slug: "bikini-foam" }, size: "M" },
  select: { id: true, stock: true },
});
console.log("=== STOCK M (post-return) ===");
console.log(JSON.stringify(variantM, null, 2));
if (variantM.stock !== EXPECTED_STOCK_M) {
  fail(`Stock M cambió: esperado ${EXPECTED_STOCK_M}, actual ${variantM.stock}.`);
}

const outbox = await prisma.emailOutbox.findMany({
  where: { orderId: EXPECTED_ORDER_ID },
  orderBy: { createdAt: "asc" },
  select: { id: true, type: true, recipient: true, status: true, attemptCount: true, sentAt: true, lastError: true },
});
console.log("=== EMAIL OUTBOX (post-return) ===");
console.log(JSON.stringify(outbox, null, 2));
if (outbox.length !== 3) fail(`Se esperaban exactamente 3 jobs de EmailOutbox, hay ${outbox.length}.`);
for (const job of outbox) {
  if (job.status !== "SENT") fail(`Job ${job.id} no está SENT: ${job.status}`);
  if (job.attemptCount !== 1) fail(`Job ${job.id} tiene attemptCount ${job.attemptCount}, se esperaba 1.`);
}

console.log("=== FASE 1: TODAS LAS VERIFICACIONES DE IDEMPOTENCIA PASARON ===");

// --- FASE 2: restaurar el precio (solo si Fase 1 pasó) ---

const SLUG = "bikini-foam";
const EXPECTED_TEST_PRICE = 6250;
const ORIGINAL_PRICE = 199900;

const beforeRestore = await prisma.product.findUnique({
  where: { slug: SLUG },
  select: { id: true, slug: true, priceValue: true, discountPercent: true },
});
console.log("=== PRECIO ANTES DE RESTAURAR ===");
console.log(JSON.stringify(beforeRestore, null, 2));
if (!beforeRestore) fail(`Producto ${SLUG} no encontrado.`);
if (beforeRestore.priceValue !== EXPECTED_TEST_PRICE) {
  fail(`priceValue actual (${beforeRestore.priceValue}) no coincide con el precio temporal esperado (${EXPECTED_TEST_PRICE}).`);
}

const restoreResult = await prisma.product.updateMany({
  where: { slug: SLUG, priceValue: EXPECTED_TEST_PRICE },
  data: { priceValue: ORIGINAL_PRICE },
});
console.log("=== UPDATE (restauración) ===");
console.log("filas afectadas:", restoreResult.count);

const afterRestore = await prisma.product.findUnique({
  where: { slug: SLUG },
  select: { id: true, slug: true, priceValue: true, discountPercent: true },
});
console.log("=== PRECIO DESPUÉS DE RESTAURAR ===");
console.log(JSON.stringify(afterRestore, null, 2));

await prisma.$disconnect();
console.log("=== LISTO ===");
