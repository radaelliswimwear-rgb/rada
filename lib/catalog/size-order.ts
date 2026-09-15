import { SIZE_OPTIONS } from "lib/placeholder-data";
import { isNumericSize } from "./shoe-sizes";

// Orden canónico y determinista de tallas (Fase 2, validación final de P2).
// Antes, product.sizes/sizeStock venían del orden que Postgres devolviera
// para ProductVariant sin ORDER BY explícito — sin garantía de ser siempre
// S, M, L (podía salir S, L, M en una carga y S, M, L en la siguiente). Esto
// ordena SIEMPRE igual, sin tocar inventario, ids ni el orden de la tabla de
// admin (que a propósito ordena por stock ascendente — ver
// listBackInStockDemandAction/admin/inventario, que no usan esto).
const LETTER_ORDER = new Map<string, number>(
  SIZE_OPTIONS.map((size, index) => [size, index]),
);

export function compareSizes(a: string, b: string): number {
  const aNumeric = isNumericSize(a);
  const bNumeric = isNumericSize(b);
  // Calzado / Niños con talla numérica: de menor a mayor.
  if (aNumeric && bNumeric) return parseFloat(a) - parseFloat(b);
  // No debería mezclarse numérica y de letra en el mismo producto, pero si
  // pasara, no rompe: las numéricas quedan primero, de forma estable.
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;

  const aIndex = LETTER_ORDER.get(a);
  const bIndex = LETTER_ORDER.get(b);
  if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
  if (aIndex !== undefined) return -1;
  if (bIndex !== undefined) return 1;
  // Talla libre no reconocida (ej. "4-5 años") — alfabético entre sí, para
  // que el resultado siga siendo siempre el mismo en cada carga.
  return a.localeCompare(b, "es");
}

export function sortSizes<T>(items: T[], sizeOf: (item: T) => string): T[] {
  return [...items].sort((a, b) => compareSizes(sizeOf(a), sizeOf(b)));
}
