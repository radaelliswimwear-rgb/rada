import { sendEmail } from "./send";
import { adminNewOrderEmail } from "./templates";
import { getAdminNotificationEmails } from "./admin-recipients";
import type { Order } from "lib/orders/types";

// Llamado una sola vez por pedido, justo después de crearlo con éxito (ver
// createOrderAction) — nunca desde el navegador, nunca por una redirección
// de "pago exitoso" (Sprint 30, sección 3/4 del pedido de la fundadora). Un
// fallo acá jamás debe tumbar la creación del pedido, que ya quedó
// confirmada en la base de datos — mismo criterio que el resto del envío
// de emails en este proyecto (ver lib/email/send.ts).
export async function notifyAdminsOfNewOrder(
  order: Order,
  freeShippingThreshold: number,
): Promise<void> {
  try {
    const { subject, html } = adminNewOrderEmail(order, freeShippingThreshold);
    const recipients = getAdminNotificationEmails();
    await Promise.all(
      recipients.map((to) => sendEmail({ to, subject, html })),
    );
  } catch (error) {
    console.error(
      "notifyAdminsOfNewOrder: no se pudo enviar la notificación de pedido nuevo",
      order.id,
      error,
    );
  }
}
