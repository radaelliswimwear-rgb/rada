// Motor de descuentos (producto / categoría / sitio completo): funciones
// puras, sin acceso a base de datos, para poder llamarse dentro de un
// .map() sobre muchas filas sin costo extra. La resolución real (leer el
// descuento del sitio) vive en discount-actions.ts — se hace una sola vez
// por request, no por producto.
export type DiscountInputs = {
  productDiscountPercent: number;
  categoryDiscountPercent: number;
  sitewideDiscountPercent: number;
};

export type ResolvedDiscount = {
  percent: number; // 0-100, 0 = ninguno activo
  source: "product" | "category" | "sitewide" | "none";
};

export function clampDiscountPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.trunc(value || 0)));
}

// Precedencia, no acumulación: el nivel más específico que tenga un valor
// mayor a 0 gana entero — nunca se suman/combinan descuentos de distintos
// niveles (un producto con 20% propio en una categoría con 15% muestra 20%,
// no 35%).
export function resolveDiscountPercent(
  inputs: DiscountInputs,
): ResolvedDiscount {
  const product = clampDiscountPercent(inputs.productDiscountPercent);
  if (product > 0) return { percent: product, source: "product" };

  const category = clampDiscountPercent(inputs.categoryDiscountPercent);
  if (category > 0) return { percent: category, source: "category" };

  const sitewide = clampDiscountPercent(inputs.sitewideDiscountPercent);
  if (sitewide > 0) return { percent: sitewide, source: "sitewide" };

  return { percent: 0, source: "none" };
}

export function applyDiscount(basePriceValue: number, percent: number): number {
  if (percent <= 0) return basePriceValue;
  return Math.round(basePriceValue * (1 - percent / 100));
}

// API principal que usan catalog-actions.ts y orders-actions.ts: una sola
// llamada devuelve todo lo que PlaceholderProduct necesita para mostrar
// precio final + precio tachado + etiqueta de porcentaje.
export function computeDiscountedPrice(
  basePriceValue: number,
  inputs: DiscountInputs,
): {
  priceValue: number;
  originalPriceValue: number;
  activeDiscountPercent: number;
} {
  const { percent } = resolveDiscountPercent(inputs);
  if (percent <= 0) {
    return {
      priceValue: basePriceValue,
      originalPriceValue: basePriceValue,
      activeDiscountPercent: 0,
    };
  }
  return {
    priceValue: applyDiscount(basePriceValue, percent),
    originalPriceValue: basePriceValue,
    activeDiscountPercent: percent,
  };
}
