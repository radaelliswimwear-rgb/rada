"use server";

import { prisma } from "lib/prisma";
import {
  FULFILLMENT_STATUS_FROM_DB,
  FULFILLMENT_STATUS_TO_DB,
  ORDER_INCLUDE,
  STATUS_TO_DB,
  toCents,
  toOrder,
} from "lib/orders/order-mapping";
import type { FulfillmentStatus, OrderStatus } from "lib/orders/types";
import { requireAdmin } from "lib/auth/authorize";
import { logAdminMutation } from "lib/observability/log";
import { releaseReservedStock } from "lib/checkout/server-order-totals";
import { isFulfillmentTransitionAllowed } from "./fulfillment-rules";
import type {
  AdminActionResult,
  AdminMarketingDelivery,
  AdminOrder,
} from "./types";

// Server Actions de administración de pedidos (Sprint 14): a diferencia de
// ordersRepository.listByUser (lib/orders/orders-actions.ts), no filtra por
// userId — devuelve todos los pedidos, con el email del comprador para
// identificarlos en el listado.
export async function listAllOrdersAction(): Promise<AdminOrder[]> {
  await requireAdmin();
  try {
    const rows = await prisma.order.findMany({
      include: { ...ORDER_INCLUDE, user: true },
      orderBy: { createdAt: "desc" },
    });
    // El listado no necesita el detalle de entrega de analytics de CADA
    // pedido (evita N+1 queries) -- solo el detalle individual lo carga,
    // ver getAdminOrderByIdAction.
    return rows.map((row) => ({
      ...toOrder(row),
      userEmail: row.user.email,
      marketingDelivery: [],
    }));
  } catch (error) {
    console.error("listAllOrdersAction: no se pudo leer los pedidos", error);
    return [];
  }
}

// Diagnóstico E2E #1006 (sep. 2026): única vía de lectura, autenticada como
// ADMIN (requireAdmin() de arriba), para ver el estado real de un envío de
// MarketingEventOutbox sin acceso directo a la base de datos -- ver
// AdminMarketingDelivery en ./types para qué campos se exponen y por qué
// (nunca el payload completo, `lastError` ya sale sanitizado del propio
// adapter). Solo lectura: ninguna función de este archivo escribe sobre
// MarketingEventOutbox.
async function getMarketingDeliveryForOrder(
  orderId: string,
): Promise<AdminMarketingDelivery[]> {
  const rows = await prisma.marketingEventOutbox.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    select: {
      provider: true,
      eventName: true,
      status: true,
      attemptCount: true,
      eventId: true,
      lastAttemptAt: true,
      sentAt: true,
      lastError: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows.map((row) => ({
    provider: row.provider,
    eventName: row.eventName,
    status: row.status,
    attemptCount: row.attemptCount,
    eventId: row.eventId,
    lastAttemptAt: row.lastAttemptAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

// Detalle de un pedido para /admin/pedidos/[id] — a diferencia de
// getOrderByIdAction (lib/orders/orders-actions.ts, usado por la
// confirmación de compra de la propia clienta), este SIEMPRE exige rol
// ADMIN, sin la excepción de "pedido de invitado" que tiene aquel.
export async function getAdminOrderByIdAction(
  orderId: string,
): Promise<AdminOrder | null> {
  await requireAdmin();
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: { ...ORDER_INCLUDE, user: true },
  });
  if (!row) return null;
  const marketingDelivery = await getMarketingDeliveryForOrder(orderId);
  return { ...toOrder(row), userEmail: row.user.email, marketingDelivery };
}

// Estado logístico real que se edita desde /admin/pedidos (Sprint 30) — ver
// FulfillmentStatus en lib/orders/types.ts para por qué está separado del
// `status` legado de abajo y de Payment.status. Cada cambio queda en
// OrderStatusEvent (historial visible en el detalle del pedido) con el
// correo del admin que lo hizo.
//
// P0 admin operativo (auditoría de septiembre 2026): antes esta función
// actualizaba sin mirar el estado anterior -- seleccionar dos veces
// "Cancelado" generaba dos OrderStatusEvent idénticos, y nada impedía
// transiciones sin sentido operativo (CANCELADO -> un estado activo, que
// "revendería" stock ya liberado; ENTREGADO -> CANCELADO). Ahora: (1) mismo
// estado que ya tenía = no-op idempotente, no crea evento nuevo; (2)
// transición inválida según isFulfillmentTransitionAllowed = rechazada
// server-side, sin importar qué mande el cliente (no se confía solo en que
// el <select> de la UI no ofrezca esa opción).
export async function updateFulfillmentStatusAction(
  orderId: string,
  status: FulfillmentStatus,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  try {
    const dbStatus = FULFILLMENT_STATUS_TO_DB[status];
    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: { fulfillmentStatus: true },
    });
    if (!current) {
      return { success: false, error: "Pedido no encontrado." };
    }
    if (current.fulfillmentStatus === dbStatus) {
      // Ya está en ese estado -- éxito silencioso, sin duplicar el
      // historial ni volver a intentar liberar stock.
      return { success: true };
    }
    if (!isFulfillmentTransitionAllowed(current.fulfillmentStatus, dbStatus)) {
      const from = FULFILLMENT_STATUS_FROM_DB[current.fulfillmentStatus];
      return {
        success: false,
        error: `No se puede cambiar un pedido de "${from}" a "${status}".`,
      };
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { fulfillmentStatus: dbStatus },
      }),
      prisma.orderStatusEvent.create({
        data: { orderId, status: dbStatus, changedByEmail: admin.email },
      }),
    ]);

    // Mismo criterio que updateOrderStatusAction: cancelar devuelve el
    // stock reservado, para que no quede bloqueado para otras compradoras.
    // releaseReservedStock ya es idempotente (updateMany condicionado a
    // stockReleased: false) -- el guard de arriba además evita que esta
    // rama se alcance dos veces para el mismo pedido.
    if (status === "Cancelado") {
      const payment = await prisma.payment.findUnique({ where: { orderId } });
      if (payment) await releaseReservedStock(payment.id);
    }
    logAdminMutation({
      adminId: admin.id,
      action: "order_fulfillment_status_update",
      targetType: "Order",
      targetId: orderId,
      outcome: "success",
      reason: `fulfillmentStatus -> ${status}`,
    });
    return { success: true };
  } catch (error) {
    console.error(
      "updateFulfillmentStatusAction: no se pudo actualizar el estado",
      error,
    );
    return {
      success: false,
      error: "No se pudo actualizar el estado del pedido.",
    };
  }
}

// Validación de los campos operativos de envío (P0 admin operativo, sección
// 6 del proceso: "no permitir HTML/script", "URL válida cuando exista",
// "costo >= 0"). No hay un helper compartido de sanitización HTML en el
// repo (ver lib/email/templates.ts:escapeHtml, privado a ese módulo) -- se
// usa el mismo patrón corto ya establecido: rechazar '<'/'>' en vez de
// intentar escapar, y new URL() + try/catch para validar URLs (mismo
// criterio que lib/utils.ts normalizeAppBaseUrl).
const MAX_SHIPPING_TEXT_LENGTH = 80;

function sanitizeShippingText(
  value: string | null | undefined,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (!value || !value.trim()) return { ok: true, value: null };
  const trimmed = value.trim();
  if (trimmed.length > MAX_SHIPPING_TEXT_LENGTH) {
    return {
      ok: false,
      error: `No puede superar los ${MAX_SHIPPING_TEXT_LENGTH} caracteres.`,
    };
  }
  if (trimmed.includes("<") || trimmed.includes(">")) {
    return { ok: false, error: "No se permiten los caracteres < o >." };
  }
  return { ok: true, value: trimmed };
}

function validateTrackingUrl(
  value: string | null | undefined,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (!value || !value.trim()) return { ok: true, value: null };
  const trimmed = value.trim();
  if (trimmed.length > 500) {
    return { ok: false, error: "El link de seguimiento es demasiado largo." };
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        ok: false,
        error: "El link de seguimiento debe ser una URL http(s) válida.",
      };
    }
  } catch {
    return {
      ok: false,
      error: "El link de seguimiento debe ser una URL válida.",
    };
  }
  return { ok: true, value: trimmed };
}

export type UpdateOrderShippingDetailsInput = {
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  // ISO 8601 o null para borrar la fecha de despacho ya guardada.
  dispatchedAt?: string | null;
  // Costo cotizado en pesos COP (no centavos) -- se convierte acá, mismo
  // criterio que el resto de montos del pedido.
  quotedShippingCost?: number | null;
};

// Sección 5/6 del proceso P0: guardar/editar guía de envío -- solo ADMIN,
// validado server-side, nunca depende de que el formulario esté oculto.
// No integra ninguna transportadora ni cobra envío: es información que la
// fundadora carga a mano después de despachar.
export async function updateOrderShippingDetailsAction(
  orderId: string,
  input: UpdateOrderShippingDetailsInput,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  try {
    const carrier = sanitizeShippingText(input.shippingCarrier);
    if (!carrier.ok)
      return { success: false, error: `Transportadora: ${carrier.error}` };
    const tracking = sanitizeShippingText(input.trackingNumber);
    if (!tracking.ok)
      return { success: false, error: `N° de guía: ${tracking.error}` };
    const trackingUrl = validateTrackingUrl(input.trackingUrl);
    if (!trackingUrl.ok) return { success: false, error: trackingUrl.error };

    let dispatchedAt: Date | null = null;
    if (input.dispatchedAt) {
      const parsed = new Date(input.dispatchedAt);
      if (Number.isNaN(parsed.getTime())) {
        return { success: false, error: "Fecha de despacho inválida." };
      }
      dispatchedAt = parsed;
    }

    let quotedShippingCost: number | null = null;
    if (input.quotedShippingCost != null) {
      if (
        typeof input.quotedShippingCost !== "number" ||
        !Number.isFinite(input.quotedShippingCost) ||
        input.quotedShippingCost < 0
      ) {
        return {
          success: false,
          error: "El costo cotizado debe ser un número mayor o igual a 0.",
        };
      }
      quotedShippingCost = toCents(input.quotedShippingCost);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingCarrier: carrier.value,
        trackingNumber: tracking.value,
        trackingUrl: trackingUrl.value,
        dispatchedAt,
        quotedShippingCost,
      },
    });
    logAdminMutation({
      adminId: admin.id,
      action: "order_shipping_details_update",
      targetType: "Order",
      targetId: orderId,
      outcome: "success",
    });
    return { success: true };
  } catch (error) {
    console.error(
      "updateOrderShippingDetailsAction: no se pudo guardar el envío",
      error,
    );
    return {
      success: false,
      error: "No se pudieron guardar los datos de envío.",
    };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: STATUS_TO_DB[status] },
    });
    // Cancelar un pedido desde el panel también devuelve el inventario que
    // se había reservado al cobrar/coordinar el pago (Sprint 29) — si no,
    // el stock de un pedido cancelado a mano quedaba bloqueado para siempre
    // (ver lib/checkout/server-order-totals.ts).
    if (status === "Cancelado") {
      const payment = await prisma.payment.findUnique({ where: { orderId } });
      if (payment) await releaseReservedStock(payment.id);
    }
    logAdminMutation({
      adminId: admin.id,
      action: "order_status_update",
      targetType: "Order",
      targetId: orderId,
      outcome: "success",
      reason: `status -> ${status}`,
      // "Cancelado" desde el panel es la única mutación de esta acción con
      // consecuencias reales de negocio (libera stock) -- vale una alerta.
      alert: status === "Cancelado",
    });
    return { success: true };
  } catch (error) {
    console.error(
      "updateOrderStatusAction: no se pudo actualizar el estado",
      error,
    );
    return {
      success: false,
      error: "No se pudo actualizar el estado del pedido.",
    };
  }
}
