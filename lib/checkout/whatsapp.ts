import { formatPrice } from "lib/format";
import type { OrderItem } from "lib/orders/types";

// Número real del negocio para coordinar pagos manuales (sin pasarela) con
// clientes que no tienen tarjeta de crédito — alternativa al pago online en
// el checkout, ver components/checkout/checkout-content.tsx.
export const WHATSAPP_BUSINESS_NUMBER = "573006683190";

export function buildWhatsappOrderMessage(
  items: OrderItem[],
  total: number,
): string {
  const lines = items.map(
    (item) =>
      `• ${item.name} (talla ${item.size}) x${item.quantity} — ${formatPrice(
        item.priceValue * item.quantity,
      )}`,
  );
  return [
    "¡Hola! Quiero confirmar mi pedido en LAGO:",
    "",
    ...lines,
    "",
    `Total: ${formatPrice(total)}`,
  ].join("\n");
}

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}
