import { prisma } from "lib/prisma";
import { getAppBaseUrl } from "lib/utils";
import { formatPrice } from "lib/format";
import { computeDiscountedPrice } from "lib/pricing/discount";
import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";
import { sendEmail } from "./send";
import { backInStockEmail } from "./templates";

type EmailContext = {
  productName: string;
  productColor: string;
  priceLabel: string;
  imageUrl: string;
  productUrl: string;
};

type BackInStockRequestForEmail = {
  id: string;
  email: string;
  user: { name: string | null } | null;
};

// Precio/imagen/URL de un producto+talla en el momento del envío — nunca se
// guarda un snapshot, siempre se recalcula (así el precio del correo es
// siempre el vigente, con cualquier descuento activo al momento de enviar).
// Compartido entre notifyBackInStockSubscribers (todas las PENDING de una
// combinación) y retryFailedBackInStockRequest (una sola solicitud puntual)
// para no duplicar la lógica de precio/plantilla entre las dos.
async function loadEmailContext(
  productId: string,
  size: string,
): Promise<EmailContext | null> {
  const [product, sitewideDiscountPercent] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    getSitewideDiscountPercentAction(),
  ]);
  if (!product) return null;

  const baseUrl = getAppBaseUrl();
  const { priceValue } = computeDiscountedPrice(product.priceValue, {
    productDiscountPercent: product.discountPercent,
    categoryDiscountPercent: product.category.discountPercent,
    sitewideDiscountPercent,
  });

  return {
    productName: product.name,
    productColor: product.color,
    priceLabel: formatPrice(priceValue),
    imageUrl: product.images[0]?.url ?? "",
    productUrl: `${baseUrl}/producto/${product.slug}?talla=${encodeURIComponent(size)}`,
  };
}

// Envía UN correo y guarda el resultado — nunca marca "notified" si el
// envío no se pudo confirmar (ver SendEmailResult en lib/email/send.ts), y
// nunca guarda la respuesta cruda del proveedor como failReason, solo un
// mensaje seguro. Devuelve el resultado para que el llamador (reintento
// manual desde el panel) pueda mostrárselo a quien administra.
async function sendBackInStockEmail(
  request: BackInStockRequestForEmail,
  size: string,
  context: EmailContext,
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = backInStockEmail(
    request.user?.name ?? null,
    context.productName,
    context.productColor,
    size,
    context.priceLabel,
    context.imageUrl,
    context.productUrl,
  );

  try {
    const result = await sendEmail({ to: request.email, subject, html });
    if (result.success) {
      await prisma.backInStockRequest.update({
        where: { id: request.id },
        data: { status: "NOTIFIED", notifiedAt: new Date() },
      });
      return { success: true };
    }
    await prisma.backInStockRequest.update({
      where: { id: request.id },
      data: { status: "FAILED", failReason: result.error ?? "Error desconocido" },
    });
    return { success: false, error: result.error };
  } catch (error) {
    console.error("sendBackInStockEmail: fallo notificando una solicitud", request.id, error);
    await prisma.backInStockRequest
      .update({
        where: { id: request.id },
        data: { status: "FAILED", failReason: "Error interno al notificar." },
      })
      .catch(() => {});
    return { success: false, error: "Error interno al notificar." };
  }
}

// Dos disparadores reales, ambos comparten la misma regla de origen
// (stock 0 -> stock > 0 en ProductVariant, el único campo que de verdad
// determina si algo se puede comprar en este momento):
// 1) updateVariantStockAction (lib/admin/inventory-actions.ts) — el admin
//    repone inventario a mano.
// 2) releaseReservedStock (lib/checkout/server-order-totals.ts) — un pago
//    reservado (tarjeta rechazada, cancelado, o vencido por el cron diario
//    de pagos viejos) devuelve la unidad al mismo contador de stock; si esa
//    unidad era la última, la talla vuelve a estar genuinamente disponible
//    para el siguiente cliente, así que también avisa (ver el razonamiento
//    completo en el comentario de releaseReservedStock).
// Recorre las solicitudes PENDING de esa combinación producto+talla y le
// manda el correo a cada una — cada envío en su propio try/catch, así una
// falla de una no le impide notificarse a las demás. Nunca lanza: un fallo
// acá no debe tumbar el guardado del stock que lo disparó, que ya se
// confirmó en la base de datos antes de llamar esto.
export async function notifyBackInStockSubscribers(
  productId: string,
  size: string,
): Promise<void> {
  try {
    const [context, requests] = await Promise.all([
      loadEmailContext(productId, size),
      prisma.backInStockRequest.findMany({
        where: { productId, size, status: "PENDING" },
        include: { user: { select: { name: true } } },
      }),
    ]);

    if (!context || requests.length === 0) return;

    for (const request of requests) {
      await sendBackInStockEmail(request, size, context);
    }
  } catch (error) {
    console.error(
      "notifyBackInStockSubscribers: no se pudo procesar la reposición",
      productId,
      size,
      error,
    );
  }
}

export type RetryBackInStockResult =
  | { success: true }
  | { success: false; error: string };

// Reintento manual desde el panel admin (Fase 2, P2 — validación final)
// sobre UNA solicitud puntual que quedó FAILED — nunca toca las demás
// solicitudes de la misma combinación producto+talla (ni las PENDING ni las
// que ya están NOTIFIED, así nunca se manda un correo duplicado a alguien
// que ya lo recibió). Vuelve a comprobar el stock real antes de reintentar:
// si la talla ya no tiene stock (alguien más la compró entre el fallo y el
// reintento), NO envía nada — dejarla en FAILED es más seguro que mandar un
// "¡volvió!" falso para algo que ya no está disponible.
export async function retryFailedBackInStockRequest(
  requestId: string,
): Promise<RetryBackInStockResult> {
  const request = await prisma.backInStockRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { name: true } } },
  });
  if (!request) return { success: false, error: "La solicitud no existe." };
  if (request.status !== "FAILED") {
    return { success: false, error: "Solo se puede reintentar una solicitud que falló." };
  }

  const variant = await prisma.productVariant.findUnique({
    where: { productId_size: { productId: request.productId, size: request.size } },
    select: { stock: true },
  });
  if (!variant || variant.stock <= 0) {
    return {
      success: false,
      error: "Esa talla ya no tiene stock disponible — no se reintentó el envío.",
    };
  }

  const context = await loadEmailContext(request.productId, request.size);
  if (!context) return { success: false, error: "No se encontró el producto." };

  const result = await sendBackInStockEmail(request, request.size, context);
  if (result.success) return { success: true };
  return { success: false, error: result.error ?? "No se pudo reenviar el correo." };
}
