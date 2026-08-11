import type { PlaceholderProduct } from "lib/placeholder-data";

// Hombre, Mujer, Niños y Calzado quedan archivadas (fuera de nav/home, ver
// components/layout/navbar/index.tsx y lib/categories.ts) tras el rebrand a
// Radaelli Swimwear — sus productos y rutas siguen intactos, solo se
// reemplazan en la navegación por las 4 colecciones de trajes de baño.
export const CATEGORY_LABELS = [
  "Hombre",
  "Mujer",
  "Niños",
  "Calzado",
  "Accesorios",
  "Oasis Natural",
  "Aurora Viva",
  "Espuma de Ola",
  "Salidas de Baño",
] as const;
export type CategoryLabel = (typeof CATEGORY_LABELS)[number];

// Mapea la etiqueta que usa la UI (Product.category en PlaceholderProduct)
// al slug real de la fila Category en Postgres. Único lugar donde vive esta
// correspondencia — prisma/seed.ts siembra exactamente estos slugs.
export const CATEGORY_SLUG_BY_LABEL: Record<CategoryLabel, string> = {
  Hombre: "hombre",
  Mujer: "mujer",
  Niños: "ninos",
  Calzado: "calzado",
  Accesorios: "accesorios",
  "Oasis Natural": "oasis-natural",
  "Aurora Viva": "aurora-viva",
  "Espuma de Ola": "espuma-de-ola",
  "Salidas de Baño": "salidas-de-bano",
};

// Inverso del mapa de arriba: el slug es lo estable (nunca se edita desde el
// panel), a diferencia de Category.name que sí se puede renombrar libremente
// en /admin/categorias — nunca derivar el CategoryLabel a partir de `name`.
export const CATEGORY_LABEL_BY_SLUG: Record<string, CategoryLabel> =
  Object.fromEntries(
    CATEGORY_LABELS.map((label) => [CATEGORY_SLUG_BY_LABEL[label], label]),
  ) as Record<string, CategoryLabel>;

// `tone` es puramente decorativo (paleta de PlaceholderArt) y no se usa por
// producto en ningún componente — no se persiste en Postgres, se deriva de
// la categoría con el mismo criterio que components/catalog/catalog-page.tsx.
const CATEGORY_TONE: Record<CategoryLabel, PlaceholderProduct["tone"]> = {
  Hombre: "ink",
  Mujer: "clay",
  Niños: "moss",
  Calzado: "stone",
  Accesorios: "sand",
  "Oasis Natural": "moss",
  "Aurora Viva": "linen",
  "Espuma de Ola": "fog",
  "Salidas de Baño": "sand",
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
