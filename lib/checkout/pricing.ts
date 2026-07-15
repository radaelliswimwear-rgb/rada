export const TAX_RATE = 0.21;

export type CostSummaryValues = {
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// IVA calculado sobre el subtotal y desglosado como línea propia en el
// resumen de checkout. Pura y determinista: misma función serviría en un
// futuro endpoint /api/checkout sin cambios.
export function calculateCostSummary(
  subtotal: number,
  shippingCost: number,
): CostSummaryValues {
  const tax = round2(subtotal * TAX_RATE);
  return {
    subtotal: round2(subtotal),
    shippingCost: round2(shippingCost),
    tax,
    total: round2(subtotal + shippingCost + tax),
  };
}
