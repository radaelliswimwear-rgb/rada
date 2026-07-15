import type { CategoryLabel } from "lib/catalog/types";
import type { Order, OrderStatus } from "lib/orders/types";

export type AdminProductVariant = { size: string; stock: number };

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
  color: string;
  description: string;
  featured: boolean;
  images: string[];
  variants: AdminProductVariant[];
  createdAt: string;
};

export type AdminProductInput = {
  slug: string;
  name: string;
  category: CategoryLabel;
  priceValue: number;
  color: string;
  description: string;
  featured: boolean;
  images: string[];
  sizes: string[];
};

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

// Mismo Order que lib/orders/types.ts, con el email del dueño para el
// listado de pedidos del panel (que no filtra por userId, a diferencia de
// ordersRepository.listByUser).
export type AdminOrder = Order & { userEmail: string };

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "Procesando",
  "Enviado",
  "Entregado",
  "Cancelado",
];

export type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  pendingOrders: number;
  revenue: number;
};
