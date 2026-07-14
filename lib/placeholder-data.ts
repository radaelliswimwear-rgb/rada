export type Tone =
  | "sand"
  | "stone"
  | "ink"
  | "clay"
  | "moss"
  | "fog"
  | "rust"
  | "linen";

export type PlaceholderProduct = {
  id: string;
  name: string;
  category: "Hombre" | "Mujer" | "Accesorios";
  price: string; // formato de visualización, ej. "189,00"
  priceValue: number; // valor numérico para filtrar/ordenar, ej. 189
  tone: Tone;
  sizes: string[];
  color: string;
  featured?: boolean;
};

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "Única"] as const;

export const COLOR_OPTIONS = [
  "Negro",
  "Blanco",
  "Beige",
  "Camel",
  "Gris",
  "Azul Marino",
  "Verde Oliva",
  "Terracota",
] as const;

export const PRICE_BUCKETS = [
  { id: "menos-50", label: "Menos de 50€", min: 0, max: 50 },
  { id: "50-100", label: "50€ – 100€", min: 50, max: 100 },
  { id: "100-200", label: "100€ – 200€", min: 100, max: 200 },
  { id: "mas-200", label: "Más de 200€", min: 200, max: Infinity },
] as const;

export const SORT_OPTIONS = [
  { id: "novedades", label: "Novedades" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
] as const;

// Datos de ejemplo mientras Shopify no está conectado (ver docs/09-ROADMAP.md, Fase 0).
export const products: PlaceholderProduct[] = [
  { id: "01", name: "Abrigo Oversize Lana", category: "Mujer", price: "189,00", priceValue: 189, tone: "stone", sizes: ["S", "M", "L"], color: "Camel", featured: true },
  { id: "02", name: "Camisa Lino Regular", category: "Hombre", price: "79,00", priceValue: 79, tone: "linen", sizes: ["S", "M", "L", "XL"], color: "Beige", featured: true },
  { id: "03", name: "Vestido Midi Satén", category: "Mujer", price: "129,00", priceValue: 129, tone: "clay", sizes: ["XS", "S", "M"], color: "Terracota", featured: true },
  { id: "04", name: "Blazer Estructurado", category: "Hombre", price: "159,00", priceValue: 159, tone: "ink", sizes: ["M", "L", "XL"], color: "Negro", featured: true },
  { id: "05", name: "Bolso Cuero Mini", category: "Accesorios", price: "99,00", priceValue: 99, tone: "sand", sizes: ["Única"], color: "Camel", featured: true },
  { id: "06", name: "Pantalón Sastre Recto", category: "Hombre", price: "89,00", priceValue: 89, tone: "fog", sizes: ["S", "M", "L", "XL"], color: "Gris", featured: true },
  { id: "07", name: "Falda Plisada Midi", category: "Mujer", price: "69,00", priceValue: 69, tone: "moss", sizes: ["XS", "S", "M", "L"], color: "Verde Oliva", featured: true },
  { id: "08", name: "Cinturón Piel Italiana", category: "Accesorios", price: "49,00", priceValue: 49, tone: "rust", sizes: ["Única"], color: "Negro", featured: true },

  { id: "09", name: "Sudadera Premium Algodón", category: "Hombre", price: "69,00", priceValue: 69, tone: "stone", sizes: ["S", "M", "L", "XL"], color: "Gris" },
  { id: "10", name: "Chaqueta Denim Recta", category: "Hombre", price: "119,00", priceValue: 119, tone: "fog", sizes: ["M", "L", "XL"], color: "Azul Marino" },
  { id: "11", name: "Jersey Cuello Alto", category: "Hombre", price: "59,00", priceValue: 59, tone: "linen", sizes: ["S", "M", "L"], color: "Negro" },
  { id: "12", name: "Pantalón Chino Slim", category: "Hombre", price: "75,00", priceValue: 75, tone: "sand", sizes: ["S", "M", "L", "XL"], color: "Beige" },

  { id: "13", name: "Blusa Seda Fluida", category: "Mujer", price: "99,00", priceValue: 99, tone: "linen", sizes: ["XS", "S", "M"], color: "Blanco" },
  { id: "14", name: "Pantalón Palazzo", category: "Mujer", price: "89,00", priceValue: 89, tone: "clay", sizes: ["XS", "S", "M", "L"], color: "Terracota" },
  { id: "15", name: "Chaqueta Bomber", category: "Mujer", price: "149,00", priceValue: 149, tone: "ink", sizes: ["S", "M", "L"], color: "Negro" },
  { id: "16", name: "Vestido Camisero Lino", category: "Mujer", price: "109,00", priceValue: 109, tone: "sand", sizes: ["XS", "S", "M", "L"], color: "Beige" },

  { id: "17", name: "Bufanda Lana Merino", category: "Accesorios", price: "45,00", priceValue: 45, tone: "moss", sizes: ["Única"], color: "Verde Oliva" },
  { id: "18", name: "Gafas de Sol Acetato", category: "Accesorios", price: "89,00", priceValue: 89, tone: "ink", sizes: ["Única"], color: "Negro" },
  { id: "19", name: "Gorra Algodón Orgánico", category: "Accesorios", price: "35,00", priceValue: 35, tone: "fog", sizes: ["Única"], color: "Gris" },
  { id: "20", name: "Reloj Acero Minimalista", category: "Accesorios", price: "219,00", priceValue: 219, tone: "stone", sizes: ["Única"], color: "Negro" },
];

export const featuredProducts: PlaceholderProduct[] = products.filter(
  (product) => product.featured,
);

export type CatalogSearchParams = { [key: string]: string | string[] | undefined };

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function filterAndSortProducts(
  source: PlaceholderProduct[],
  params: CatalogSearchParams,
): PlaceholderProduct[] {
  const sizes = toArray(params.talla);
  const colors = toArray(params.color);
  const priceBucketIds = toArray(params.precio);
  const sort = typeof params.orden === "string" ? params.orden : undefined;

  const priceBuckets = PRICE_BUCKETS.filter((bucket) =>
    priceBucketIds.includes(bucket.id),
  );

  let result = source.filter((product) => {
    const matchesSize = sizes.length === 0 || product.sizes.some((s) => sizes.includes(s));
    const matchesColor = colors.length === 0 || colors.includes(product.color);
    const matchesPrice =
      priceBuckets.length === 0 ||
      priceBuckets.some(
        (bucket) => product.priceValue >= bucket.min && product.priceValue < bucket.max,
      );

    return matchesSize && matchesColor && matchesPrice;
  });

  if (sort === "precio-asc") {
    result = [...result].sort((a, b) => a.priceValue - b.priceValue);
  } else if (sort === "precio-desc") {
    result = [...result].sort((a, b) => b.priceValue - a.priceValue);
  }

  return result;
}
