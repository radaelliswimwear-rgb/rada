"use server";

import { prisma } from "lib/prisma";
import { requireUser } from "lib/auth/authorize";
import { getCurrentUser } from "lib/auth/session";
import { GUEST_USER_ID } from "lib/checkout/types";
import { computeDiscountedPrice } from "lib/pricing/discount";
import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";
import {
  METHOD_TO_DB,
  ORDER_INCLUDE,
  STATUS_TO_DB,
  toCents,
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

// Guarda real de stock (Sprint 19): el frontend ya deshabilita "Añadir al
// carrito" cuando un producto está agotado, pero un cliente podría saltarse
// esa validación llamando a esta Server Action directo (DevTools, replay de
// la request). Nunca se confía solo en lo que mandó el navegador — se
// vuelve a consultar el stock real de cada talla contra Postgres antes de
// crear el pedido.
async function assertStockAvailable(
  items: CreateOrderInput["items"],
): Promise<void> {
  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { productId_size: { productId: item.productId, size: item.size } },
    });
    if (!variant || variant.stock < item.quantity) {
      throw new Error(
        `"${item.name}" (talla ${item.size}) ya no tiene stock suficiente.`,
      );
    }
  }
}

// Vuelve a calcular el precio real de cada línea contra la base de datos
// (con su descuento vigente, producto/categoría/sitio) en vez de confiar en
// el priceValue que mandó el navegador — cierra el hueco de que alguien
// intente manipular el precio antes de confirmar la compra (DevTools,
// replay de la request). No toca shippingCost/tax/discountValue/total
// (dependen de reglas de envío/cupón/impuestos aparte, fuera de este
// arreglo puntual) — solo subtotal y cada OrderItem.priceValue, que sí se
// derivan directamente del catálogo.
async function resolveServerSidePrices(
  items: CreateOrderInput["items"],
): Promise<Map<string, number>> {
  const sitewideDiscountPercent = await getSitewideDiscountPercentAction();
  const rows = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    include: { category: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const resolved = new Map<string, number>();
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
    resolved.set(`${item.productId}-${item.size}`, priceValue);
  }
  return resolved;
}

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<Order> {
  // input.userId nunca se usa para decidir el dueño del pedido — antes
  // cualquiera podía llamar esto con el id de otra clienta y crear pedidos
  // a su nombre (auditoría de seguridad, Sprint 26). El checkout no exige
  // sesión (ver GUEST_USER_ID en lib/checkout/types.ts), así que acá se
  // vuelve a resolver: una clienta con sesión siempre compra como ella
  // misma, sin sesión el pedido queda como invitado.
  const sessionUser = await getCurrentUser();
  const resolvedUserId = sessionUser?.id ?? GUEST_USER_ID;

  await assertStockAvailable(input.items);
  const resolvedPrices = await resolveServerSidePrices(input.items);
  const serverSubtotal = input.items.reduce(
    (sum, item) =>
      sum +
      resolvedPrices.get(`${item.productId}-${item.size}`)! * item.quantity,
    0,
  );

  const row = await prisma.order.create({
    data: {
      userId: resolvedUserId,
      status: STATUS_TO_DB[input.status ?? "Procesando"],
      subtotal: toCents(serverSubtotal),
      shippingCost: toCents(input.shippingCost),
      tax: toCents(input.tax),
      total: toCents(input.total),
      shippingMethod: METHOD_TO_DB[input.shippingMethod],
      shippingAddress: input.shippingAddress as object,
      couponCode: input.couponCode ?? null,
      discountValue: input.discountValue ? toCents(input.discountValue) : 0,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          size: item.size,
          quantity: item.quantity,
          priceValue: toCents(
            resolvedPrices.get(`${item.productId}-${item.size}`)!,
          ),
          sku: item.sku ?? null,
        })),
      },
    },
    include: ORDER_INCLUDE,
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
