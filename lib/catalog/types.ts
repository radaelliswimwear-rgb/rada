import type { PlaceholderProduct } from "lib/placeholder-data";

export const CATEGORY_LABELS = ["Hombre", "Mujer", "Accesorios"] as const;
export type CategoryLabel = (typeof CATEGORY_LABELS)[number];

// Mapea la etiqueta que usa la UI (Product.category en PlaceholderProduct)
// al slug real de la fila Category en Postgres. Único lugar donde vive esta
// correspondencia — prisma/seed.ts siembra exactamente estos slugs.
export const CATEGORY_SLUG_BY_LABEL: Record<CategoryLabel, string> = {
  Hombre: "hombre",
  Mujer: "mujer",
  Accesorios: "accesorios",
};

// `tone` es puramente decorativo (paleta de PlaceholderArt) y no se usa por
// producto en ningún componente — no se persiste en Postgres, se deriva de
// la categoría con el mismo criterio que components/catalog/catalog-page.tsx.
const CATEGORY_TONE: Record<CategoryLabel, PlaceholderProduct["tone"]> = {
  Hombre: "ink",
  Mujer: "clay",
  Accesorios: "sand",
};

export function toneForCategory(
  category: CategoryLabel,
): PlaceholderProduct["tone"] {
  return CATEGORY_TONE[category];
}

export type CatalogListResult = {
  products: PlaceholderProduct[];
  total: number;
};
