import type { PaymentProvider } from "lib/payments/types";

export type OrderStatus =
  | "Procesando"
  | "Enviado"
  | "Entregado"
  | "Cancelado"
  | "Pendiente de pago";

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
};

// Misma lógica de snapshot que OrderItem: si el usuario edita o borra la
// dirección guardada más adelante, el pedido ya hecho no debe cambiar.
export type ShippingAddressSnapshot = {
  fullName: string;
  street: string;
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
};

export type Order = {
  id: string;
  userId: string;
  date: string;
  status: OrderStatus;
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
  // Cupón aplicado (Sprint 17) — ausente en pedidos sin cupón, no solo en
  // los simulados; mismo criterio opcional que subtotal/tax de arriba.
  couponCode?: string;
  discountValue?: number;
};

export type CreateOrderInput = {
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddressSnapshot;
  shippingMethod: ShippingMethodId;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  payment: PaymentSnapshot;
  status?: OrderStatus;
  couponCode?: string;
  discountValue?: number;
};
