import type { ShippingMethodId } from "lib/orders/types";
import type { ShippingMethod } from "./types";

// Catálogo estático de métodos de envío. Pensado para migrar a una tabla
// `ShippingMethod` (o a la API del proveedor logístico) sin cambiar la firma
// de getShippingCost/SHIPPING_METHODS que consume la UI.
export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    name: "Envío estándar",
    description: "Entrega en 3 a 5 días hábiles",
    price: 4.95,
    etaLabel: "3-5 días hábiles",
  },
  {
    id: "express",
    name: "Envío express",
    description: "Entrega en 24 a 48 horas",
    price: 9.95,
    etaLabel: "24-48 horas",
  },
];

export const FREE_SHIPPING_THRESHOLD = 100;

export function getShippingCost(
  methodId: ShippingMethodId,
  subtotal: number,
): number {
  const method = SHIPPING_METHODS.find((m) => m.id === methodId);
  if (!method) return 0;
  if (methodId === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return method.price;
}
