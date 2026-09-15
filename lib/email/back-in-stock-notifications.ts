import { prisma } from "lib/prisma";
import { baseUrl } from "lib/utils";
import { formatPrice } from "lib/format";
import { computeDiscountedPrice } from "lib/pricing/discount";
import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";
import { sendEmail } from "./send";
import { backInStockEmail } from "./templates";

// Único disparador real: updateVariantStockAction (lib/admin/
// inventory-actions.ts), cuando detecta que una talla pasó de 0 a stock
// disponible. Recorre las solicitudes PENDING de esa combinación
// producto+talla y le manda el correo a cada una — cada envío en su propio
// try/catch, así una falla de una no le impide notificarse a las demás.
// Nunca lanza: un fallo acá no debe tumbar el guardado del stock que lo
// disparó, que ya se confirmó en la base de datos antes de llamar esto.
export async function notifyBackInStockSubscribers(
  productId: string,
  size: string,
): Promise<void> {
  try {
    const [product, sitewideDiscountPercent, requests] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
      }),
      getSitewideDiscountPercentAction(),
      prisma.backInStockRequest.findMany({
        where: { productId, size, status: "PENDING" },
        include: { user: { select: { name: true } } },
      }),
    ]);

    if (!product || requests.length === 0) return;

    const { priceValue } = computeDiscountedPrice(product.priceValue, {
      productDiscountPercent: product.discountPercent,
      categoryDiscountPercent: product.category.discountPercent,
      sitewideDiscountPercent,
    });
    const priceLabel = formatPrice(priceValue);
    const imageUrl = product.images[0]?.url ?? "";
    const productUrl = `${baseUrl}/producto/${product.slug}?talla=${encodeURIComponent(size)}`;

    for (const request of requests) {
      const { subject, html } = backInStockEmail(
        request.user?.name ?? null,
        product.name,
        product.color,
        size,
        priceLabel,
        imageUrl,
        productUrl,
      );

      try {
        const result = await sendEmail({ to: request.email, subject, html });
        if (result.success) {
          await prisma.backInStockRequest.update({
            where: { id: request.id },
            data: { status: "NOTIFIED", notifiedAt: new Date() },
          });
        } else {
          await prisma.backInStockRequest.update({
            where: { id: request.id },
            // Mensaje seguro (nunca la respuesta cruda de Resend, que podría
            // traer datos sensibles) — ver SendEmailResult en lib/email/send.ts.
            data: { status: "FAILED", failReason: result.error ?? "Error desconocido" },
          });
        }
      } catch (error) {
        console.error(
          "notifyBackInStockSubscribers: fallo notificando una solicitud",
          request.id,
          error,
        );
        await prisma.backInStockRequest
          .update({
            where: { id: request.id },
            data: { status: "FAILED", failReason: "Error interno al notificar." },
          })
          .catch(() => {});
      }
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
