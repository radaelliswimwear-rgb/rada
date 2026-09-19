import { prisma } from "lib/prisma";
import { computeDiscountedPrice } from "lib/pricing/discount";
import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";
import { notifyBackInStockSubscribers } from "lib/email/back-in-stock-notifications";
import { logEvent } from "lib/observability/log";

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

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
  });
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
async function reserveStock(items: ServerOrderItemInput[]): Promise<void> {
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
//
// También dispara "Avísame cuando vuelva" (Fase 2, P2 — validación final)
// cuando la liberación hace que una talla pase de 0 a disponible. Decisión
// tomada a propósito, no es un descuido: reserveStock DESCUENTA el mismo
// contador ProductVariant.stock que ve la tienda ANTES de cobrar la
// tarjeta (ver arriba) — no existe un "pool de reservas" aparte. Eso
// significa que en todo momento stock=0 quiere decir exactamente "nadie
// puede comprar esto ahora mismo", sin ningún estado intermedio ambiguo.
// Si la última unidad reservada de una talla vuelve acá (tarjeta
// rechazada, cliente cancela, o el cron diario libera un pago vencido), el
// contador pasa de 0 a positivo y la talla queda GENUINAMENTE comprable
// por la siguiente clienta que entre — es la misma garantía que ya tenía
// el disparador de updateVariantStockAction, así que no hay riesgo de
// aviso falso: nunca se notifica mientras la unidad siga reservada o
// bloqueada, porque en ese caso el stock sigue en 0.
export async function releaseReservedStock(paymentId: string): Promise<void> {
  const backInStock: { productId: string; size: string }[] = [];
  let released = false;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.stockReleased || !payment.reservedItems) return;

    const claimedRelease = await tx.payment.updateMany({
      where: { id: paymentId, stockReleased: false },
      data: { stockReleased: true },
    });
    if (claimedRelease.count === 0) return; // ya liberado por otra llamada concurrente
    released = true;

    const items = payment.reservedItems as unknown as ReservedItemSnapshot[];
    for (const item of items) {
      const previous = await tx.productVariant.findUnique({
        where: {
          productId_size: { productId: item.productId, size: item.size },
        },
        select: { stock: true },
      });

      await tx.productVariant.updateMany({
        where: { productId: item.productId, size: item.size },
        data: { stock: { increment: item.quantity } },
      });

      if (previous && previous.stock === 0) {
        backInStock.push({ productId: item.productId, size: item.size });
      }
    }
  });

  if (released) {
    await logEvent({
      event: "stock.released",
      severity: "info",
      paymentId,
    });
  }

  // Fuera de la transacción, igual que en updateVariantStockAction — el
  // envío de correos nunca debe poder hacer fallar ni demorar la
  // liberación de stock que ya quedó confirmada en la base de datos.
  for (const { productId, size } of backInStock) {
    await notifyBackInStockSubscribers(productId, size);
  }
}

// ============================================================================
// P0 (corrección de leak de inventario, sep. 2026)
// ============================================================================
// Hallazgo de la auditoría: un Payment PENDING del checkout alojado de Wompi
// decrementa stock real al crearse (arriba, reserveStock). Si la clienta
// abandona antes de que exista wompiTransactionId (ni webhook ni regreso),
// el cron de pagos vencidos SOLO marcaba flaggedForReviewAt y dejaba el
// stock reservado indefinidamente -- sin ninguna herramienta de admin que
// lo resolviera (releaseReservedStock, en todos sus demás usos, exige un
// Order ya existente). Las dos funciones de abajo cierran ese hueco sin
// reabrir el riesgo que la versión original evitaba a propósito: cancelar
// a ciegas un pago que en realidad SÍ se aprobó en Wompi con un webhook
// perdido.

// Señal interna para abortar la transacción de reclamo cuando ya no queda
// stock real -- nunca sale de este módulo (mismo patrón que
// PaymentAlreadyClaimedError en lib/orders/order-creation-core.ts).
class StockUnavailableForReclaimError extends Error {}

// Cierra definitivamente un Payment PENDING sin wompiTransactionId conocido
// que ya superó el TTL del link de checkout (caso "(A)" del cron de pagos
// vencidos): cancela el pago Y libera el stock reservado EN LA MISMA
// transacción -- no en dos pasos separados. Eso importa porque un webhook
// tardío pero genuinamente aprobado (applyWompiWebhookUpdateAction hace un
// UPDATE incondicional por id, sin mirar el status actual) puede llegar
// justo en el medio: el lock de fila de Postgres sobre esa misma fila
// Payment serializa las dos escrituras, así que exactamente una de las dos
// pasa primero --
//   - si esta función gana primero: cancela y libera; el webhook tardío que
//     llega después vuelve a poner status=SUCCEEDED (nunca se pierde el
//     evento real), y reclaimReleasedStockForLateApproval (ver abajo) es la
//     red de seguridad que evita crear un pedido con stock que ya no existe.
//   - si el webhook gana primero (el pago SÍ se aprobó): el status ya no es
//     "PENDING" cuando esta función intenta reclamarlo, así que el `where`
//     condicional no matchea nada y esta función no toca absolutamente
//     nada -- ni cancela, ni libera, ni pisa lo que el webhook acaba de
//     escribir.
// El mismo `where: { status: "PENDING" }` condicionado dentro de un
// updateMany (nunca un update a secas) es lo que da exactamente-una-vez
// también entre dos corridas del cron superpuestas: la segunda ve el
// status ya en CANCELLED y no hace nada.
export async function cancelAbandonedPaymentAndReleaseStock(
  paymentId: string,
  failureReason: string,
): Promise<"cancelled" | "not-pending"> {
  const backInStock: { productId: string; size: string }[] = [];

  const outcome = await prisma.$transaction(async (tx) => {
    const claimedCancel = await tx.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: { status: "CANCELLED", failureReason },
    });
    if (claimedCancel.count === 0) {
      // Perdimos la carrera contra un webhook/return que ya resolvió este
      // pago (o ya lo canceló otra corrida) -- no hay nada más que hacer.
      return "not-pending" as const;
    }

    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.stockReleased || !payment.reservedItems) {
      return "cancelled" as const;
    }

    // Mismo reclamo atómico que releaseReservedStock, pero inline dentro de
    // ESTA transacción -- no se puede llamar a esa función aparte porque
    // abriría su propia transacción nueva, reabriendo exactamente la
    // ventana de carrera que todo este diseño existe para cerrar.
    const claimedRelease = await tx.payment.updateMany({
      where: { id: paymentId, stockReleased: false },
      data: { stockReleased: true },
    });
    if (claimedRelease.count === 0) return "cancelled" as const;

    const items = payment.reservedItems as unknown as ReservedItemSnapshot[];
    for (const item of items) {
      const previous = await tx.productVariant.findUnique({
        where: {
          productId_size: { productId: item.productId, size: item.size },
        },
        select: { stock: true },
      });
      await tx.productVariant.updateMany({
        where: { productId: item.productId, size: item.size },
        data: { stock: { increment: item.quantity } },
      });
      if (previous && previous.stock === 0) {
        backInStock.push({ productId: item.productId, size: item.size });
      }
    }
    return "cancelled" as const;
  });

  if (outcome === "cancelled") {
    await logEvent({
      event: "stock.released_abandoned_payment",
      severity: "info",
      paymentId,
      reason: failureReason,
    });
  }

  for (const { productId, size } of backInStock) {
    await notifyBackInStockSubscribers(productId, size);
  }
  return outcome;
}

// Red de seguridad para el caso "late approval": un Payment llega a
// SUCCEEDED (webhook, regreso, o el propio cron reverificando contra
// Wompi) DESPUÉS de que su stock ya había sido liberado -- por el TTL de
// arriba, o por cualquier otro camino que ya llamaba a releaseReservedStock
// (tarjeta rechazada y luego, contra toda lógica, un evento posterior dice
// aprobada -- Wompi no debería mandar eso, pero esta función no confía en
// que nunca pase). Llamada SIEMPRE desde finalizeApprovedPayment, el único
// funnel que ya usan las tres vías (webhook/return/cron) antes de crear
// ningún pedido -- así que este es el único lugar que hace falta tocar
// para que la garantía aplique sin importar por cuál de las tres vías llegó
// el evento.
//
// "held" (el caso normal, sin liberar nunca) sale de inmediato sin tocar
// stock -- no hace falta reclamar lo que nunca se soltó.
//
// "reclaimed": se re-reservó atómicamente la MISMA cantidad exacta que
// pedía Payment.reservedItems -- nunca lo que vuelva a mandar nadie. El
// decremento usa el mismo UPDATE condicional (`stock >= cantidad`) que
// reserveStock arriba: solo puede tener éxito si de verdad hay unidades
// físicas disponibles AHORA, así que nunca puede overselear, sin importar
// cuántas otras clientas hayan comprado esas unidades mientras tanto.
//
// "unavailable": no hay stock suficiente para reclamar -- la clienta SÍ
// pagó, pero esas unidades ya se vendieron a alguien más entretanto.
// finalizeApprovedPayment NUNCA debe crear un pedido en este caso: marca
// flaggedForReviewAt/flaggedForReviewReason en su lugar (revisión humana --
// reembolso o reposición, nunca un pedido fantasma).
//
// "unknown-items": anomalía real (Payment SUCCEEDED con stockReleased pero
// sin reservedItems, no debería poder pasar) -- mismo tratamiento que
// "unavailable": nunca se inventa un pedido, se marca para revisión.
export async function reclaimReleasedStockForLateApproval(
  paymentId: string,
): Promise<"held" | "reclaimed" | "unavailable" | "unknown-items"> {
  try {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment || !payment.stockReleased) return "held" as const;
      if (!payment.reservedItems) return "unknown-items" as const;

      // Reclamo atómico: si dos llamadas concurrentes (p. ej. webhook y
      // cron reverificando el mismo pago casi a la vez) ven stockReleased
      // en true, el lock de fila de Postgres sobre este mismo UPDATE
      // condicionado serializa las dos -- solo una gana (count 1) e
      // intenta el decremento real; la otra ve count 0 e interpreta
      // correctamente que el stock ya quedó resuelto (reclamado por la
      // ganadora, o -- si la ganadora terminó fallando y su transacción
      // completa revirtió, incluido este mismo flag -- vuelve a estar en
      // true y la siguiente llamada retoma el intento).
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, stockReleased: true },
        data: { stockReleased: false },
      });
      if (claimed.count === 0) return "held" as const;

      const items = payment.reservedItems as unknown as ReservedItemSnapshot[];
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
          // Revierte TODA la transacción -- incluido el updateMany de
          // stockReleased de arriba, que vuelve a quedar en true. Nunca se
          // decrementa a medias: o se reclaman todas las líneas, o
          // ninguna.
          throw new StockUnavailableForReclaimError();
        }
      }
      return "reclaimed" as const;
    });
  } catch (error) {
    if (error instanceof StockUnavailableForReclaimError) return "unavailable";
    throw error;
  }
}
