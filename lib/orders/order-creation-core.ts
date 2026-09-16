import { prisma } from "lib/prisma";
import type { ReservedItemSnapshot } from "lib/checkout/server-order-totals";
import { getFreeShippingThresholdAction } from "lib/checkout/free-shipping-actions";
import { notifyAdminsOfNewOrder } from "lib/email/order-notifications";
import { computeDiscountedPrice } from "lib/pricing/discount";
import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";
import type { Payment as PaymentRow } from "@prisma/client";
import {
  METHOD_TO_DB,
  ORDER_INCLUDE,
  PAYMENT_STATUS_FROM_DB,
  PROVIDER_FROM_DB,
  STATUS_TO_DB,
  toCents,
  toEuros,
  toOrder,
} from "./order-mapping";
import type { OrderWithRelations } from "./order-mapping";
import type { CreateOrderInput, Order } from "./types";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos) — lógica de creación
// de pedido, extraída de orders-actions.ts a un módulo PLANO (sin
// "use server") a propósito.
//
// Cualquier función exportada de un archivo "use server" se convierte en
// una Server Action invocable por RPC desde el navegador, exista o no un
// componente que la referencie de verdad. Eso es exactamente lo que NO
// puede pasar con createOrderForPayment: recibe `userId` YA RESUELTO como
// parámetro y no vuelve a verificarlo contra ninguna sesión — si viviera en
// un archivo "use server", cualquiera podría invocarla directo pasando
// cualquier userId y crear un pedido a nombre de otra persona. Al vivir acá,
// en un módulo común, solo puede llamarse desde código que la importe de
// verdad (compilado en el mismo deploy, nunca por una petición HTTP común).
//
// Los dos llamadores de confianza hoy:
//   - createOrderAction (./orders-actions.ts, SÍ "use server"): resuelve
//     `userId` desde getCurrentUser() — la sesión real de quien llama.
//   - recoverOrderForApprovedPayment (./order-recovery.ts, sin "use
//     server", usado solo por el cron de pagos vencidos): resuelve
//     `userId` desde Payment.originalUserId, capturado una sola vez al
//     iniciar el checkout — un cron no tiene sesión de nadie que leer, y
//     aceptar un userId como parámetro de una función alcanzable desde
//     afuera reabriría el hueco que la auditoría de seguridad del Sprint 26
//     ya había cerrado.

// Vuelve a calcular el precio real y el SKU de cada línea contra la base de
// datos (con su descuento vigente, producto/categoría/sitio) en vez de
// confiar en lo que mandó el navegador — mismo criterio que antes, pero ya
// no decide cuánto se cobra (eso lo fija Payment.amount, ver más abajo):
// solo arma el snapshot de cada OrderItem para el historial del pedido.
type ItemSnapshot = {
  priceValue: number;
  sku: string | null;
  color: string | null;
  collection: string | null;
};

async function resolveOrderItemSnapshots(
  items: CreateOrderInput["items"],
): Promise<Map<string, ItemSnapshot>> {
  const sitewideDiscountPercent = await getSitewideDiscountPercentAction();
  const rows = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    include: { category: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const resolved = new Map<string, ItemSnapshot>();
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
      color: row.color,
      collection: row.category.name,
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

// Arma el Order de dominio a partir de la fila ya leída/verificada. El
// snapshot de pago nunca sale de input.payment (lo que mandó el navegador,
// sin estado real) — sale de la fila Payment, la única fuente confiable de
// "provider/status" (auditoría de seguridad Sprint 29). Se necesita como
// helper y no solo al final de createOrderForPayment porque ahora hay dos
// caminos que devuelven un pedido: el que lo acaba de crear (donde
// row.payment todavía es null, el enlace se hace después del create) y el
// reintento idempotente, que devuelve el pedido que ya existía.
function toOrderWithPayment(
  row: OrderWithRelations,
  payment: PaymentRow,
): Order {
  return {
    ...toOrder(row),
    payment: {
      provider: PROVIDER_FROM_DB[payment.provider],
      transactionId: payment.providerRef,
      last4: payment.cardLast4 ?? "",
      status: PAYMENT_STATUS_FROM_DB[payment.status],
    },
  };
}

// Señal interna (nunca sale de este módulo) para abortar la transacción del
// que PIERDE la carrera por reclamar el pago. Se usa un error propio en vez
// de un string para no confundirlo con un fallo real de base de datos: el
// único efecto buscado es el rollback, el pedido correcto se lee después.
class PaymentAlreadyClaimedError extends Error {}

// Lee el pedido que ya quedó enlazado a este pago. Se vuelve a consultar el
// Payment (consulta fresca, no la copia en memoria que se leyó al entrar):
// en el camino de carrera perdida la copia vieja todavía dice orderId null,
// porque la ganadora enlazó el pago después de esa lectura.
async function readOrderAlreadyCreatedFor(paymentId: string): Promise<Order> {
  const fresh = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!fresh?.orderId) {
    throw new Error("No se pudo recuperar el pedido de este pago.");
  }
  const row = await prisma.order.findUnique({
    where: { id: fresh.orderId },
    include: ORDER_INCLUDE,
  });
  if (!row) {
    throw new Error("No se pudo recuperar el pedido de este pago.");
  }
  return toOrderWithPayment(row, fresh);
}

// Auditoría de seguridad (Sprint 29): no recibe ni confía en subtotal/
// shippingCost/tax/total/discountValue/couponCode del navegador. El pago
// (tarjeta vía Wompi, o la reserva por WhatsApp) ya se hizo ANTES de llegar
// acá — ver createVerifiedPaymentIntentAction/createVerifiedWhatsappIntentAction/
// startWompiHostedCheckoutAction (lib/payments/payments-actions.ts) — así
// que la fila Payment ya tiene el monto real cobrado/reservado y la lista
// de productos que se reservaron. Este pedido se arma a partir de esa fila,
// nunca de lo que vuelva a mandar el cliente en este segundo paso.
//
// Idempotencia real (carrera Payment->Order): el chequeo "¿este pago ya
// generó un pedido?" se hace primero como atajo (evita recalcular precios y
// abrir una transacción para después revertirla), pero la garantía real es
// el reclamo atómico de más abajo — un updateMany condicionado a
// `orderId: null`, dentro de la misma transacción que crea el Order. Dos
// llamadas casi simultáneas (doble click en el checkout, reintento de red,
// un retorno duplicado del checkout alojado de Wompi, o el cron de pagos
// vencidos compitiendo con el regreso real de la clienta) pueden pasar las
// dos el atajo, pero solo una gana el reclamo — la que pierde revierte TODA
// su transacción (el Order que alcanzó a crear desaparece, no queda
// huérfano) y lee el pedido de la ganadora.
export async function createOrderForPayment(
  userId: string,
  input: CreateOrderInput,
): Promise<Order> {
  const payment = await prisma.payment.findUnique({
    where: { providerRef: input.payment.transactionId },
  });
  if (!payment) {
    throw new Error("No se encontró el pago para este pedido.");
  }

  // Este chequeo se mantiene ANTES del camino de reintento, no solo antes de
  // crear: exigir que quien llama conozca exactamente las líneas reservadas
  // es lo que hoy impide que alguien con un providerRef suelto obtenga un
  // pedido. Si se devolviera el pedido existente sin verificarlo, el
  // reintento idempotente se convertiría en una forma nueva de LEER el
  // pedido de otra persona (nombre, dirección, teléfono) sabiendo solo esa
  // referencia — un permiso de lectura que hoy no existe.
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

  // Reintento posterior de un pago que ya tiene pedido: se devuelve ese
  // pedido en vez de tirar "Este pago ya generó un pedido." El estado del
  // pago NO se vuelve a exigir acá: el pedido ya existe, y un webhook
  // posterior de Wompi (o un pago de WhatsApp que dejó de estar PENDING) no
  // debe hacer que un reintento falle al leer algo que ya está confirmado
  // en la base.
  if (payment.orderId) {
    return readOrderAlreadyCreatedFor(payment.id);
  }

  if (payment.provider === "WHATSAPP") {
    if (payment.status !== "PENDING") {
      throw new Error("Este pago ya no está pendiente.");
    }
  } else if (payment.status !== "SUCCEEDED") {
    throw new Error("Este pago todavía no fue aprobado.");
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

  let row: OrderWithRelations;
  try {
    row = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
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
                color: snapshot.color,
                collection: snapshot.collection,
              };
            }),
          },
        },
        include: ORDER_INCLUDE,
      });

      // RECLAMO ATÓMICO del pago. Este updateMany condicional es la garantía
      // de "un solo pedido por pago": solo enlaza si orderId TODAVÍA está en
      // null, y Postgres serializa las dos llamadas concurrentes sobre esta
      // misma fila (la segunda espera el lock de la primera y, al soltarse,
      // vuelve a evaluar el WHERE contra la fila ya actualizada — ahí ve el
      // orderId no nulo y no toca nada). No sirve un `update` a secas: ese
      // pisa el valor anterior sin mirarlo, que es exactamente el bug que
      // dejaba pedidos huérfanos.
      //
      // Por qué se crea el Order ANTES de reclamar, y no al revés: la idea de
      // pre-generar el id del pedido y reclamar primero no es posible acá.
      // Payment.orderId tiene una FOREIGN KEY común hacia Order(id)
      // (Payment_orderId_fkey, no DEFERRABLE — ver la migración init), así
      // que apuntar el pago a un id de pedido que todavía no existe lo
      // rechaza Postgres en el acto. El orden real es: crear, reclamar, y si
      // el reclamo no gana, abortar la transacción entera.
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, orderId: null },
        data: { orderId: created.id },
      });
      if (claimed.count === 0) {
        // Perdimos la carrera: otra llamada enlazó este pago un instante
        // antes. Lanzar acá revierte TODA la transacción — el Order y sus
        // OrderItem que se acaban de crear desaparecen, no quedan huérfanos
        // (que era justamente el bug anterior). El pedido bueno, el de la
        // ganadora, se lee después de salir de la transacción.
        throw new PaymentAlreadyClaimedError();
      }

      // Primer evento del historial logístico — arranca siempre en
      // "pendiente por preparar" (ver FulfillmentStatus), tanto para pagos
      // con tarjeta ya aprobados como para pedidos coordinados por WhatsApp.
      await tx.orderStatusEvent.create({
        data: { orderId: created.id, status: "PENDIENTE_POR_PREPARAR" },
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
  } catch (error) {
    // Única excepción que se traga: la carrera perdida. Cualquier otro
    // fallo de la transacción sigue propagándose tal cual.
    if (error instanceof PaymentAlreadyClaimedError) {
      // La ganadora ya creó el pedido, lo enlazó y (ella sí) mandó el aviso
      // al admin. Acá solo se devuelve ese mismo pedido: sin crear nada y
      // sin volver a notificar, para que un doble click no dispare dos
      // correos de "pedido nuevo".
      return readOrderAlreadyCreatedFor(payment.id);
    }
    throw error;
  }

  // El snapshot de pago que se devuelve (y que arma el email admin) nunca
  // sale de input.payment (lo que mandó el navegador, sin estado real) —
  // sale de la fila Payment que ya se leyó y verificó arriba, la única
  // fuente confiable de "provider/status" (mismo criterio que el resto de
  // esta función, auditoría de seguridad Sprint 29).
  const order = toOrderWithPayment(row, payment);

  // Notificación administrativa (Sprint 30, sección 3/4): se manda acá,
  // justo después de que el pedido quedó confirmado en la base de datos —
  // nunca antes, nunca desde el navegador. Solo se llega hasta acá cuando el
  // pago ya fue verificado (tarjeta aprobada por Wompi, o reserva por
  // WhatsApp) Y cuando esta llamada fue la que GANÓ el reclamo atómico del
  // pago: los dos caminos que devuelven un pedido ya existente (reintento
  // posterior y carrera perdida) retornan antes de llegar acá. Por eso sigue
  // mandándose exactamente una vez por pago — ni un webhook repetido, ni un
  // doble submit, ni dos llamadas simultáneas (incluido el cron compitiendo
  // con el regreso real de la clienta) pueden hacer que se mande dos veces.
  // Un fallo de envío nunca debe hacer fallar la creación del pedido, ya
  // confirmada.
  const freeShippingThreshold = await getFreeShippingThresholdAction();
  await notifyAdminsOfNewOrder(order, freeShippingThreshold);

  return order;
}
