import type { CategoryLabel } from "lib/catalog/types";
import type { Order, OrderStatus } from "lib/orders/types";

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
  color: string;
  description: string;
  featured: boolean;
  images: AdminProductImage[];
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
  images: AdminProductImage[];
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
  "Pendiente de pago",
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
