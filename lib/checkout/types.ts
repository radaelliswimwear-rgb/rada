import type { ShippingAddressSnapshot, ShippingMethodId } from "lib/orders/types";

export type ShippingAddressInput = ShippingAddressSnapshot;
export type ShippingAddressErrors = Partial<Record<keyof ShippingAddressInput, string>>;

export type ShippingMethod = {
  id: ShippingMethodId;
  name: string;
  description: string;
  price: number;
  etaLabel: string;
};

// El checkout no exige sesión (igual que el carrito). Los pedidos creados
// como invitado usan este userId y por lo tanto no aparecen en ningún
// historial de cuenta (no hay userId real que los liste).
export const GUEST_USER_ID = "guest";
