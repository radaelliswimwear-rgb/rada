"use server";

import { prisma } from "lib/prisma";
import { requireUser } from "lib/auth/authorize";
import { getCurrentUser } from "lib/auth/session";
import { GUEST_USER_ID } from "lib/checkout/types";
import type { ReservedItemSnapshot } from "lib/checkout/server-order-totals";
import { computeDiscountedPrice } from "lib/pricing/discount";
import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";
import {
  METHOD_TO_DB,
  ORDER_INCLUDE,
  STATUS_TO_DB,
  toCents,
  toEuros,
  toOrder,
} from "./order-mapping";
import type { CreateOrderInput, Order } from "./types";

// Server Actions Prisma/Postgres. orders-repository.ts conserva los mismos
// nombres que antes (Sprint 10, generador simulado + localStorage) — la UI
// no cambia. El generador de pedidos de demo desaparece: ahora hay pedidos
// reales seeded (prisma/seed.ts) y creados desde /checkout. El mapeo
// DB <-> dominio vive en ./order-mapping.ts (un archivo "use server" solo
// puede exportar funciones async, no esos objetos/funciones auxiliares).
// Ya no recibe userId del cliente (auditoría de seguridad, Sprint 26):
// cualquiera podía llamar esto pasando el id de otra clienta y leer todo su
// historial de pedidos. Ahora siempre se deriva de la sesión real.
export async function listOrdersByUserAction(): Promise<Order[]> {
  const user = await requireUser();
  const rows = await prisma.order.findMany({
    where: { userId: user.id },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

// Vuelve a calcular el precio real y el SKU de cada línea contra la base de
// datos (con su descuento vigente, producto/categoría/sitio) en vez de
// confiar en lo que mandó el navegador — mismo criterio que antes, pero ya
// no decide cuánto se cobra (eso lo fija Payment.amount, ver más abajo):
// solo arma el snapshot de cada OrderItem para el historial del pedido.
async function resolveOrderItemSnapshots(
  items: CreateOrderInput["items"],
): Promise<Map<string, { priceValue: number; sku: string | null }>> {
  const sitewideDiscountPercent = await getSitewideDiscountPercentAction();
  const rows = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    include: { category: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const resolved = new Map<string, { priceValue: number; sku: string | null }>();
  for (const item of items) {
    const row = byId.get(item.productId);
    if (!row) {
      throw new Error(`"${item.name}" ya no está disponible.`);
    }
    const { priceValue } = computeDiscountedPrice(row.priceValue, {
      productDiscountPercent: row.discountPercent,
      categoryDiscountPercent: row.category.discountPercent,
      sitewideDiscountPercent,
    });
    resolved.set(`${item.productId}-${item.size}`, {
      priceValue,
      sku: row.sku,
    });
  }
  return resolved;
}

// El pedido solo puede crearse a partir de líneas que de verdad se
// reservaron (y cobraron, o van a coordinarse por WhatsApp) al crear el
// intent de pago — comparar contra Payment.reservedItems (no contra lo que
// vuelva a mandar el navegador acá) cierra la posibilidad de pagar por
// unos productos y terminar con un pedido de otros distintos.
function sameLineItems(
  a: ReservedItemSnapshot[],
  b: { productId: string; size: string; quantity: number }[],
): boolean {
  if (a.length !== b.length) return false;
  const key = (x: { productId: string; size: string; quantity: number }) =>
    `${x.productId}::${x.size}::${x.quantity}`;
  const sortedA = a.map(key).sort();
  const sortedB = b.map(key).sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

// Auditoría de seguridad (Sprint 29): createOrderAction ya no recibe ni
// confía en subtotal/shippingCost/tax/total/discountValue/couponCode del
// navegador. El pago (tarjeta vía Wompi, o la reserva por WhatsApp) ya se
// hizo ANTES de llegar acá — ver createVerifiedPaymentIntentAction/
// createVerifiedWhatsappIntentAction (lib/payments/payments-actions.ts) —
// así que la fila Payment ya tiene el monto real cobrado/reservado y la
// lista de productos que se reservaron. Este pedido se arma a partir de esa
// fila, nunca de lo que vuelva a mandar el cliente en este segundo paso.
export async function createOrderAction(
  input: CreateOrderInput,
): Promise<Order> {
  // El dueño del pedido nunca sale de un userId que mande el cliente
  // (auditoría de seguridad, Sprint 26) — una clienta con sesión siempre
  // compra como ella misma, sin sesión el pedido queda como invitado.
  const sessionUser = await getCurrentUser();
  const resolvedUserId = sessionUser?.id ?? GUEST_USER_ID;

  const payment = await prisma.payment.findUnique({
    where: { providerRef: input.payment.transactionId },
  });
  if (!payment) {
    throw new Error("No se encontró el pago para este pedido.");
  }
  if (payment.orderId) {
    throw new Error("Este pago ya generó un pedido.");
  }
  if (payment.provider === "WHATSAPP") {
    if (payment.status !== "PENDING") {
      throw new Error("Este pago ya no está pendiente.");
    }
  } else if (payment.status !== "SUCCEEDED") {
    throw new Error("Este pago todavía no fue aprobado.");
  }

  const reserved =
    (payment.reservedItems as unknown as ReservedItemSnapshot[] | null) ?? [];
  const requested = input.items.map((item) => ({
    productId: item.productId,
    size: item.size,
    quantity: item.quantity,
  }));
  if (!sameLineItems(reserved, requested)) {
    throw new Error(
      "Los productos del pedido no coinciden con los que se cobraron.",
    );
  }

  const resolvedSnapshots = await resolveOrderItemSnapshots(input.items);
  const serverSubtotal = input.items.reduce(
    (sum, item) =>
      sum +
      resolvedSnapshots.get(`${item.productId}-${item.size}`)!.priceValue *
        item.quantity,
    0,
  );
  // El total del pedido ES el monto que ya se cobró/reservó — nunca se
  // vuelve a tomar de lo que mande el cliente. discountValue es derivado
  // (subtotal recalculado menos ese total), no un número que llegue suelto.
  const total = toEuros(payment.amount);
  const discountValue = Math.max(0, Math.round(serverSubtotal - total));

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: resolvedUserId,
        status: STATUS_TO_DB[input.status ?? "Procesando"],
        subtotal: toCents(serverSubtotal),
        shippingCost: 0,
        tax: 0,
        total: toCents(total),
        shippingMethod: METHOD_TO_DB[input.shippingMethod],
        shippingAddress: input.shippingAddress as object,
        couponCode: discountValue > 0 ? payment.couponCode : null,
        discountValue: toCents(discountValue),
        items: {
          create: input.items.map((item) => {
            const snapshot = resolvedSnapshots.get(
              `${item.productId}-${item.size}`,
            )!;
            return {
              productId: item.productId,
              name: item.name,
              image: item.image,
              size: item.size,
              quantity: item.quantity,
              priceValue: toCents(snapshot.priceValue),
              sku: snapshot.sku,
            };
          }),
        },
      },
      include: ORDER_INCLUDE,
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { orderId: created.id },
    });

    // Incremento atómico y condicional (nunca supera maxUses, aunque dos
    // pedidos con el mismo cupón se estén creando al mismo tiempo) — si el
    // cupón ya no califica (alguien más agotó el cupo justo antes), esta
    // consulta simplemente no actualiza ninguna fila; nunca bloquea la
    // creación del pedido, la clienta ya pagó.
    if (payment.couponCode) {
      await tx.$executeRaw`
        UPDATE "Coupon" SET "usedCount" = "usedCount" + 1
        WHERE code = ${payment.couponCode}
          AND active = true
          AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
      `;
    }

    return created;
  });

  return { ...toOrder(row), payment: input.payment };
}

// Antes devolvía cualquier pedido con solo saber su id, sin importar quién
// preguntara (auditoría de seguridad, Sprint 26) — un id de pedido cuid es
// impredecible, pero una clienta con sesión podía adivinar/probar otro id y
// leer nombre, dirección y contenido del pedido de otra persona. La página
// de confirmación post-compra sigue funcionando para invitados (no tienen
// sesión): esos pedidos se identifican solo por el id impredecible de la
// URL, igual que en Shopify o Stripe Checkout. Un pedido de una cuenta real
// sí exige que quien pregunta sea esa misma cuenta (o un admin).
export async function getOrderByIdAction(
  orderId: string,
): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });
  if (!row) return null;
  if (row.userId === GUEST_USER_ID) return toOrder(row);

  const sessionUser = await getCurrentUser();
  if (!sessionUser) return null;
  if (sessionUser.id !== row.userId && sessionUser.role !== "ADMIN") {
    return null;
  }
  return toOrder(row);
}
