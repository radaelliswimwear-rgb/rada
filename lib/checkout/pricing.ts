export type CostSummaryValues = {
  subtotal: number;
  discount: number;
  total: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Sprint 28: Radaelli no está cobrando IVA todavía (no aplica ese cargo en
// el checkout). El envío tampoco se cobra acá: sin tarifario por ciudad, no
// hay un costo real que sumarle al total — arriba del monto de envío
// gratis (ver getFreeShippingThresholdAction en free-shipping-actions.ts)
// queda gratis, por debajo queda "por confirmar" y se informa antes del
// despacho (ver components/checkout/cost-summary.tsx). El total del
// pedido, entonces, es solo el subtotal con el descuento aplicado.
export function calculateCostSummary(
  subtotal: number,
  discount = 0,
): CostSummaryValues {
  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    total: round2(subtotal - discount),
  };
}

// El monto que aplica para la promoción de envío gratis: subtotal de
// productos después del cupón aplicado (no del descuento automático de
// producto/categoría/sitio, que ya está incluido en `subtotal` mismo desde
// el catálogo — ver lib/pricing/discount.ts).
export function qualifiesForFreeShipping(
  subtotal: number,
  discount: number,
  freeShippingThreshold: number,
): boolean {
  return subtotal - discount >= freeShippingThreshold;
}
