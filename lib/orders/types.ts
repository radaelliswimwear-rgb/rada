import type { PaymentProvider, PaymentStatus } from "lib/payments/types";
import type { AttributionState } from "lib/attribution/types";

export type OrderStatus =
  | "Procesando"
  | "Enviado"
  | "Entregado"
  | "Cancelado"
  | "Pendiente de pago";

// Estado logístico del pedido (Sprint 30) — lo que se muestra y edita en
// /admin/pedidos. Deliberadamente separado de OrderStatus (arriba, ya no se
// expone en el panel, se mantiene solo por compatibilidad) y de
// PaymentStatus (lib/payments/types.ts, responde "¿se cobró?" — ver
// prisma/schema.prisma FulfillmentStatus para la razón completa).
export type FulfillmentStatus =
  | "Pendiente por preparar"
  | "Preparando pedido"
  | "Cliente contactado"
  | "Entrega coordinada"
  | "Despachado"
  | "Entregado"
  | "Cancelado"
  | "Reembolsado";

export type OrderStatusEvent = {
  id: string;
  status: FulfillmentStatus;
  changedByEmail?: string | null;
  createdAt: string;
};

// A diferencia de CartLine (lib/cart/types.ts), un pedido SÍ guarda una copia
// (snapshot) de nombre/precio: es un registro histórico e inmutable, debe
// reflejar lo que se cobró en su momento, no el precio actual del catálogo.
export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  priceValue: number;
  sku?: string | null;
  color?: string | null;
  collection?: string | null;
};

// Misma lógica de snapshot que OrderItem: si el usuario edita o borra la
// dirección guardada más adelante, el pedido ya hecho no debe cambiar.
// `email` se agregó en el checkout de invitado (antes no se pedía ningún
// correo real: Wompi recibía un "invitado@lago.com" fijo como
// customer_email — ver checkout-content.tsx) — para una cuenta con sesión
// se prellena con el correo de la cuenta, pero queda editable por si
// quiere que la confirmación/factura llegue a otro correo.
// `phone` es el WhatsApp de la clienta — obligatorio para poder coordinar la
// entrega (Sprint 30); el checkout lo pide explícitamente como tal (ver
// shipping-address-form.tsx). `neighborhood` (barrio) es obligatorio;
// `apartmentDetails`/`deliveryNotes` son opcionales.
export type ShippingAddressSnapshot = {
  fullName: string;
  email: string;
  street: string;
  neighborhood: string;
  apartmentDetails?: string;
  deliveryNotes?: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
};

export type ShippingMethodId = "standard" | "express";

// Snapshot del pago aprobado que originó el pedido — mismo criterio que
// OrderItem/ShippingAddressSnapshot: es un registro histórico, no una
// referencia en vivo al PaymentIntent (que puede seguir cambiando de estado
// por reembolsos, disputas, etc. en lib/payments).
export type PaymentSnapshot = {
  provider: PaymentProvider;
  transactionId: string;
  last4: string;
  // Estado EN VIVO del pago (no un snapshot congelado): a diferencia de
  // OrderItem/ShippingAddressSnapshot, esto sí puede cambiar después de
  // creado el pedido (un webhook de Wompi puede terminar marcando FAILED/
  // CANCELLED un pago que se creó como succeeded) — order-confirmation.tsx
  // lo usa para no mostrar "Pago aprobado" de un pago que ya no lo está.
  status?: PaymentStatus;
  // P0 admin operativo (auditoría de septiembre 2026): antes estos 4 campos
  // no llegaban más allá de Payment (fila Prisma) -- la fundadora no podía
  // comparar un pedido contra el dashboard de Wompi sin pedirle a Claude que
  // consultara la base directamente. No son secretos: son metadata de un
  // pago ya realizado, igual de visible para la clienta que `status` arriba.
  // Opcionales (a diferencia de provider/transactionId/last4): CreateOrderInput
  // arma este mismo tipo ANTES de que exista la fila Payment real leída de
  // la base (ver checkout-content.tsx/order-recovery.ts) -- solo toOrder()/
  // toPaymentSnapshot() (order-mapping.ts), que sí parten de una fila real,
  // los completan siempre.
  wompiTransactionId?: string | null;
  amount?: number;
  currency?: string;
  createdAt?: string;
};

export type Order = {
  id: string;
  orderNumber: number;
  userId: string;
  date: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentHistory?: OrderStatusEvent[];
  items: OrderItem[];
  total: number;
  // Presentes en pedidos creados desde el checkout real (Sprint 10/11);
  // ausentes en los pedidos simulados de demo generados por
  // orders-repository.ts para que el historial no rompa mostrando "undefined".
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  shippingAddress?: ShippingAddressSnapshot;
  shippingMethod?: ShippingMethodId;
  payment?: PaymentSnapshot;
  // Campos operativos de envío (P0 admin operativo) -- ver comentario en
  // prisma/schema.prisma, modelo Order. Todos ausentes en pedidos que
  // todavía no se despacharon o que son anteriores a esta migración.
  freeShippingThresholdSnapshot?: number | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  dispatchedAt?: string | null;
  quotedShippingCost?: number | null;
  // Cupón aplicado (Sprint 17) — ausente en pedidos sin cupón, no solo en
  // los simulados; mismo criterio opcional que subtotal/tax de arriba.
  couponCode?: string;
  discountValue?: number;
  // Fase 0 de analytics (lib/internal-traffic, lib/analytics/purchase-eligibility.ts)
  // -- heredado de Payment.marketingExclusionReason, nunca recalculado acá.
  // No financiero: ausente/undefined en pedidos simulados de demo, igual
  // criterio que el resto de campos opcionales de este tipo.
  marketingExclusionReason?: string | null;
  // Fase 1 de analytics (lib/attribution) -- heredado de
  // Payment.attributionSnapshot, nunca recalculado acá. null si el pedido
  // es de tráfico excluido o si no había atribución guardada.
  attributionSnapshot?: AttributionState | null;
};

// Auditoría de seguridad (Sprint 29): antes este tipo incluía userId,
// subtotal, shippingCost, tax, total, discountValue y couponCode como si el
// navegador los pudiera decidir — createOrderAction los recalculaba a
// medias (solo subtotal/priceValue) y confiaba el resto tal cual. Ahora el
// servidor deriva TODO lo relacionado a plata a partir de la fila Payment
// que ya se cobró (ver lib/checkout/server-order-totals.ts y
// createOrderAction) — el dueño del pedido sale de la sesión, nunca de un
// userId que mande el cliente. Este tipo solo declara lo que el checkout
// de verdad necesita mandar: qué se compró, a dónde se envía, y con qué
// pago (para encontrar la fila Payment correspondiente).
export type CreateOrderInput = {
  items: OrderItem[];
  shippingAddress: ShippingAddressSnapshot;
  shippingMethod: ShippingMethodId;
  payment: PaymentSnapshot;
  status?: OrderStatus;
};
