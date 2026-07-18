// IVA general de Colombia (Sprint 18) — antes 21% (España).
export const TAX_RATE = 0.19;

export type CostSummaryValues = {
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// IVA calculado sobre el subtotal y desglosado como línea propia en el
// resumen de checkout. Pura y determinista: misma función serviría en un
// futuro endpoint /api/checkout sin cambios. `discount` (Sprint 17, cupones)
// se resta del total pero no afecta el cálculo del IVA — se descuenta sobre
// el subtotal ya gravado, mismo criterio que aplican la mayoría de tiendas
// (el impuesto se calcula sobre el precio de lista, no sobre el precio con
// cupón).
export function calculateCostSummary(
  subtotal: number,
  shippingCost: number,
  discount = 0,
): CostSummaryValues {
  const tax = round2(subtotal * TAX_RATE);
  return {
    subtotal: round2(subtotal),
    shippingCost: round2(shippingCost),
    tax,
    discount: round2(discount),
    total: round2(subtotal + shippingCost + tax - discount),
  };
}
