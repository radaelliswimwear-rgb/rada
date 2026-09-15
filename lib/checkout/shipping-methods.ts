import type { ShippingMethod } from "./types";

// El envío es gratis desde el monto configurado en Settings (ver
// lib/checkout/free-shipping-actions.ts) y por debajo de ese monto queda
// "por confirmar" — no hay tarifario por ciudad, así que este catálogo no
// tiene precio propio. Queda solo para que el cliente elija la velocidad de
// entrega que prefiere (ver ShippingMethodSelector).
export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    name: "Envío estándar",
    description: "Entrega en 3 a 5 días hábiles",
    etaLabel: "3-5 días hábiles",
  },
  {
    id: "express",
    name: "Envío express",
    description: "Entrega en 24 a 48 horas",
    etaLabel: "24-48 horas",
  },
];
