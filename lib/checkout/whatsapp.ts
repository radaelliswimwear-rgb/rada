import { formatPrice } from "lib/format";
import type { OrderItem } from "lib/orders/types";

// Número real del negocio para coordinar pagos manuales (sin pasarela) con
// clientes que no tienen tarjeta de crédito — alternativa al pago online en
// el checkout, ver components/checkout/checkout-content.tsx.
export const WHATSAPP_BUSINESS_NUMBER = "573135359668";

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
    "¡Hola! Quiero confirmar mi pedido en Radaelli Swimwear:",
    "",
    ...lines,
    "",
    `Total: ${formatPrice(total)}`,
  ].join("\n");
}

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Normaliza el celular que dejó la clienta en el checkout (puede venir como
// "300 123 4567", "300-123-4567", "+57 3001234567", etc. — ver
// PHONE_REGEX en lib/checkout/validation.ts, que ya lo valida pero no lo
// normaliza) al formato que wa.me necesita: solo dígitos, con el 57 de
// Colombia adelante. Usado para armar el botón "Contactar por WhatsApp" del
// email administrativo de un pedido nuevo (nunca para enviar nada solo:
// wa.me solo ABRE una conversación con el texto precargado, nadie más que
// la fundadora decide si lo manda).
export function buildCustomerWhatsappUrl(
  phone: string,
  message: string,
): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("57") ? digits : `57${digits}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
