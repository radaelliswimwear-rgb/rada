import { prisma } from "lib/prisma";
import { computeDiscountedPrice } from "lib/pricing/discount";
import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";

// Núcleo de la auditoría de seguridad de pagos (Sprint 29): antes, el monto
// que se le cobraba a la tarjeta en Wompi (y el que quedaba guardado en
// Order.total) era el `total` que mandaba el navegador — calculado sobre el
// carrito en memoria del cliente, sin ninguna revalidación server-side.
// Cualquiera podía llamar directo a createPaymentIntentAction con un monto
// manipulado y conseguir que se le cobrara de menos. Esta función es la
// única fuente de verdad: recibe solo product/size/quantity + código de
// cupón, y recalcula todo (precio real, descuento vigente, cupón vigente)
// contra Postgres. El cliente puede PEDIR, el servidor SIEMPRE calcula.
//
// También reserva el stock acá mismo, atómicamente, ANTES de cobrar la
// tarjeta (nunca se descontaba en ningún punto del código anterior — se
// podía vender la misma última unidad a todos los que llegaran a pagar
// primero). Si el pago después falla o se cancela, releaseReservedStock
// devuelve exactamente lo reservado, leyendo el snapshot guardado en
// Payment.reservedItems — nunca lo que vuelva a mandar el cliente.

export type ServerOrderItemInput = {
  productId: string;
  size: string;
  quantity: number;
};

export type ReservedItemSnapshot = {
  productId: string;
  size: string;
  quantity: number;
};

export type ServerOrderTotals = {
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  resolvedPrices: Map<string, number>; // "productId-size" -> precio unitario
  reservedItems: ReservedItemSnapshot[];
};

export class CheckoutValidationError extends Error {}

const MAX_LINE_QUANTITY = 20;
const MAX_LINES = 40;

function priceKey(productId: string, size: string): string {
  return `${productId}-${size}`;
}

function validateItemsShape(items: ServerOrderItemInput[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new CheckoutValidationError("El carrito está vacío.");
  }
  if (items.length > MAX_LINES) {
    throw new CheckoutValidationError("El carrito tiene demasiadas líneas.");
  }
  for (const item of items) {
    if (
      typeof item.productId !== "string" ||
      !item.productId ||
      typeof item.size !== "string" ||
      !item.size
    ) {
      throw new CheckoutValidationError("Producto o talla inválidos.");
    }
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > MAX_LINE_QUANTITY
    ) {
      throw new CheckoutValidationError("Cantidad de producto inválida.");
    }
  }
}

// Revalida (sin mutar) el cupón contra la base de datos — mismas reglas que
// validateCouponAction (lib/coupons/coupons-actions.ts), reimplementadas acá
// porque esa función es un Server Action separado pensado para el botón
// "Aplicar" del checkout, y este cálculo necesita el resultado en el mismo
// paso que el precio, no una llamada aparte que el cliente pueda omitir. Un
// cupón que ya no es válido (venció, alcanzó su límite, etc.) simplemente no
// se aplica acá — nunca hace fallar el pago por eso.
async function resolveCouponDiscount(
  couponCode: string | null | undefined,
  subtotal: number,
): Promise<{ discount: number; code: string | null }> {
  if (!couponCode) return { discount: 0, code: null };
  const normalized = couponCode.trim().toUpperCase();
  if (!normalized) return { discount: 0, code: null };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon || !coupon.active) return { discount: 0, code: null };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { discount: 0, code: null };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { discount: 0, code: null };
  }
  if (subtotal < coupon.minSubtotal) return { discount: 0, code: null };

  const discount =
    coupon.type === "PERCENTAGE"
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);

  return { discount, code: coupon.code };
}

// Reserva atómica: cada línea se descuenta con un UPDATE condicional
// (stock >= cantidad pedida) dentro de la misma transacción — si cualquier
// línea no tiene stock suficiente, se revierte TODA la reserva (ninguna
// queda a mitad de camino). Esto es lo que faltaba por completo antes: el
// código viejo solo leía el stock para decidir si bloquear la venta, nunca
// lo tocaba, así que la misma última unidad se le podía vender a cualquiera
// que llegara a pagar antes de que un admin corrigiera el número a mano.
async function reserveStock(
  items: ServerOrderItemInput[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const result = await tx.productVariant.updateMany({
        where: {
          productId: item.productId,
          size: item.size,
          stock: { gte: item.quantity },
        },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        throw new CheckoutValidationError(
          "Uno de los productos de tu carrito ya no tiene stock suficiente.",
        );
      }
    }
  });
}

// Único punto de entrada llamado antes de cobrar (ver
// createVerifiedPaymentIntentAction en lib/payments/payments-actions.ts):
// valida cantidades, recalcula precios reales, revalida el cupón, reserva
// el stock y devuelve el total que de verdad se le va a cobrar a la
// tarjeta. Tira CheckoutValidationError (con mensaje seguro para mostrar al
// cliente) si algo no es válido.
export async function reserveAndPriceCheckout(
  items: ServerOrderItemInput[],
  couponCode: string | null | undefined,
): Promise<ServerOrderTotals> {
  validateItemsShape(items);

  const sitewideDiscountPercent = await getSitewideDiscountPercentAction();
  const rows = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    include: { category: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const resolvedPrices = new Map<string, number>();
  let subtotal = 0;
  for (const item of items) {
    const row = byId.get(item.productId);
    if (!row || !row.active) {
      throw new CheckoutValidationError(
        "Uno de los productos de tu carrito ya no está disponible.",
      );
    }
    const { priceValue } = computeDiscountedPrice(row.priceValue, {
      productDiscountPercent: row.discountPercent,
      categoryDiscountPercent: row.category.discountPercent,
      sitewideDiscountPercent,
    });
    resolvedPrices.set(priceKey(item.productId, item.size), priceValue);
    subtotal += priceValue * item.quantity;
  }

  // Reservar ANTES de calcular el cupón sobre el subtotal ya es irrelevante
  // para el monto (el cupón se aplica sobre `subtotal`, no sobre el stock),
  // pero se hace después de resolver precios para no reservar stock de un
  // producto que resultó no existir/estar inactivo.
  await reserveStock(items);

  const { discount, code } = await resolveCouponDiscount(couponCode, subtotal);
  const total = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    total,
    couponCode: code,
    resolvedPrices,
    reservedItems: items.map((item) => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
    })),
  };
}

// Contraparte de reserveStock: repone exactamente lo reservado para un pago
// que terminó fallando, siendo rechazado o cancelado. Idempotente (el
// `where: stockReleased: false` en el update hace que una segunda llamada,
// por ejemplo un reintento del webhook, no vuelva a sumar stock de más).
export async function releaseReservedStock(paymentId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.stockReleased || !payment.reservedItems) return;

    const released = await tx.payment.updateMany({
      where: { id: paymentId, stockReleased: false },
      data: { stockReleased: true },
    });
    if (released.count === 0) return; // ya liberado por otra llamada concurrente

    const items = payment.reservedItems as unknown as ReservedItemSnapshot[];
    for (const item of items) {
      await tx.productVariant.updateMany({
        where: { productId: item.productId, size: item.size },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}
