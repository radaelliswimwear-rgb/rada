import type { CategoryLabel } from "lib/catalog/types";
import type { FulfillmentStatus, Order, OrderStatus } from "lib/orders/types";

export type AdminProductVariant = { size: string; stock: number };

// publicId es null para imágenes sembradas desde Unsplash
// (lib/placeholder-data.ts) — solo las subidas vía Cloudinary (Sprint 15)
// tienen uno, y son las únicas que se borran del lado de Cloudinary.
export type AdminProductImage = { url: string; publicId: string | null };

// Forma de escritura del catálogo (Sprint 14) — a diferencia de
// PlaceholderProduct (lectura, lib/placeholder-data.ts), esta es la que
// entiende el Panel Administrativo: precio en euros (se convierte a
// centavos en el borde, mismo criterio que catalog-actions.ts).
export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: CategoryLabel;
  priceValue: number;
  // 0-100; 0 = sin descuento propio. Ver lib/pricing/discount.ts — este es
  // el precio y el descuento REALES sin resolver (el panel admin siempre
  // edita el precio de lista, nunca el precio ya rebajado).
  discountPercent: number;
  color: string;
  description: string;
  featured: boolean;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  createdAt: string;
  sku: string | null;
  totalStock: number;
  realViews: number;
  promotionalViews: number;
  showViews: boolean;
  active: boolean;
};

export type AdminProductInput = {
  slug: string;
  name: string;
  category: CategoryLabel;
  priceValue: number;
  discountPercent: number;
  color: string;
  description: string;
  featured: boolean;
  images: AdminProductImage[];
  sizes: string[];
  // SKU vacío/undefined => se autogenera (ver lib/admin/sku.ts).
  sku?: string | null;
  promotionalViews: number;
  showViews: boolean;
};

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

// Mismo Order que lib/orders/types.ts, con el email del dueño para el
// listado de pedidos del panel (que no filtra por userId, a diferencia de
// ordersRepository.listByUser).
export type AdminOrder = Order & { userEmail: string };

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "Pendiente de pago",
  "Procesando",
  "Enviado",
  "Entregado",
  "Cancelado",
];

// Estado logístico (Sprint 30) — el que de verdad se edita en
// /admin/pedidos hoy. Ver FulfillmentStatus en lib/orders/types.ts.
export const FULFILLMENT_STATUS_OPTIONS: FulfillmentStatus[] = [
  "Pendiente por preparar",
  "Preparando pedido",
  "Cliente contactado",
  "Entrega coordinada",
  "Despachado",
  "Entregado",
  "Cancelado",
  "Reembolsado",
];

// P0 admin operativo (auditoría de septiembre 2026): reemplaza las dos
// métricas anteriores (pendingOrders/revenue), que leían Order.status
// legado -- un campo que ninguna pantalla real del panel escribe. Separa
// explícitamente PAYMENT (¿se cobró de verdad?) de FULFILLMENT (¿en qué
// va la operación del pedido?), ver lib/admin/dashboard-actions.ts.
export type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  // B: derivado de fulfillmentStatus (estados no terminales).
  ordersInProgress: number;
  // C: suma de Order.total de pedidos con Payment.status SUCCEEDED --
  // dinero efectivamente aprobado por la pasarela, sin importar en qué
  // fulfillmentStatus estén hoy.
  approvedSales: number;
  // D: igual que C, pero excluyendo fulfillment CANCELADO/REEMBOLSADO --
  // la cifra principal de negocio (plata cobrada Y el pedido sigue en pie).
  operationalRevenue: number;
  // E: Payment SUCCEEDED + fulfillment CANCELADO/REEMBOLSADO -- plata
  // cobrada que nadie confirmó como devuelta todavía (Payment.status nunca
  // se toca para fabricar este número, ver fulfillment-rules.ts).
  pendingRefundCount: number;
  pendingRefundAmount: number;
};
