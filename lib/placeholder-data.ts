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
  slug: string;
  name: string;
  category: "Hombre" | "Mujer" | "Niños" | "Calzado" | "Accesorios";
  price: string; // formato de visualización, ej. "189,00"
  priceValue: number; // valor numérico para filtrar/ordenar, ej. 189
  tone: Tone;
  sizes: string[];
  color: string;
  description: string;
  images: string[];
  featured?: boolean;
  // Campos de Sprint 19 — opcionales para no romper el catálogo de demo
  // estático (lib/placeholder-data.ts, sin estos datos); los productos
  // reales (lib/catalog/catalog-actions.ts) siempre los traen.
  sku?: string | null;
  totalStock?: number;
  realViews?: number;
  promotionalViews?: number;
  showViews?: boolean;
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
  { id: "menos-50", label: "Menos de $50", min: 0, max: 50 },
  { id: "50-100", label: "$50 – $100", min: 50, max: 100 },
  { id: "100-200", label: "$100 – $200", min: 100, max: 200 },
  { id: "mas-200", label: "Más de $200", min: 200, max: Infinity },
] as const;

export const SORT_OPTIONS = [
  { id: "novedades", label: "Novedades" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
] as const;

function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?q=80&w=1200&auto=format&fit=crop`;
}

// Datos de ejemplo mientras Shopify no está conectado (ver docs/09-ROADMAP.md, Fase 0).
export const products: PlaceholderProduct[] = [
  {
    id: "01",
    slug: "abrigo-oversize-lana",
    name: "Abrigo Oversize Lana",
    category: "Mujer",
    price: "189,00",
    priceValue: 189,
    tone: "stone",
    sizes: ["S", "M", "L"],
    color: "Camel",
    description:
      "Abrigo de lana oversize con caída fluida y silueta relajada. Una pieza atemporal para las estaciones frías, pensada para durar.",
    images: [
      unsplash("1768460608433-d3af5148832c"),
      unsplash("1783512785580-9a8995e7cea6"),
    ],
    featured: true,
  },
  {
    id: "02",
    slug: "camisa-lino-regular",
    name: "Camisa Lino Regular",
    category: "Hombre",
    price: "79,00",
    priceValue: 79,
    tone: "linen",
    sizes: ["S", "M", "L", "XL"],
    color: "Beige",
    description:
      "Camisa de lino 100% transpirable, corte regular. El básico perfecto para el día a día, dentro y fuera de la oficina.",
    images: [
      unsplash("1602810318383-e386cc2a3ccf"),
      unsplash("1602810316693-3667c854239a"),
    ],
    featured: true,
  },
  {
    id: "03",
    slug: "vestido-midi-saten",
    name: "Vestido Midi Satén",
    category: "Mujer",
    price: "129,00",
    priceValue: 129,
    tone: "clay",
    sizes: ["XS", "S", "M"],
    color: "Terracota",
    description:
      "Vestido midi en satén fluido con caída al cuerpo. Elegancia discreta para cualquier ocasión.",
    images: [
      unsplash("1783512785564-0d728a1d63b5"),
      unsplash("1768982597008-1085842f297a"),
    ],
    featured: true,
  },
  {
    id: "04",
    slug: "blazer-estructurado",
    name: "Blazer Estructurado",
    category: "Hombre",
    price: "159,00",
    priceValue: 159,
    tone: "ink",
    sizes: ["M", "L", "XL"],
    color: "Negro",
    description:
      "Blazer de corte estructurado en lana mezcla. Sastrería moderna que eleva cualquier look.",
    images: [
      unsplash("1602810320073-1230c46d89d4"),
      unsplash("1602810319428-019690571b5b"),
    ],
    featured: true,
  },
  {
    id: "05",
    slug: "bolso-cuero-mini",
    name: "Bolso Cuero Mini",
    category: "Accesorios",
    price: "99,00",
    priceValue: 99,
    tone: "sand",
    sizes: ["Única"],
    color: "Camel",
    description:
      "Bolso mini de cuero curtido a mano, con asa desmontable. El complemento que redondea el conjunto.",
    images: [
      unsplash("1628483211662-9bcc692c46dc"),
      unsplash("1644258676710-ffb99d7d7a1b"),
    ],
    featured: true,
  },
  {
    id: "06",
    slug: "pantalon-sastre-recto",
    name: "Pantalón Sastre Recto",
    category: "Hombre",
    price: "89,00",
    priceValue: 89,
    tone: "fog",
    sizes: ["S", "M", "L", "XL"],
    color: "Gris",
    description:
      "Pantalón de sastrería en corte recto, tejido con caída perfecta. Versátil para looks formales e informales.",
    images: [
      unsplash("1602810316693-3667c854239a"),
      unsplash("1602810316498-ab67cf68c8e1"),
    ],
    featured: true,
  },
  {
    id: "07",
    slug: "falda-plisada-midi",
    name: "Falda Plisada Midi",
    category: "Mujer",
    price: "69,00",
    priceValue: 69,
    tone: "moss",
    sizes: ["XS", "S", "M", "L"],
    color: "Verde Oliva",
    description:
      "Falda plisada midi en tejido ligero con movimiento. Un clásico reinventado con una mirada actual.",
    images: [
      unsplash("1779398969439-99c38b9df638"),
      unsplash("1779398970408-1454e2a126c2"),
    ],
    featured: true,
  },
  {
    id: "08",
    slug: "cinturon-piel-italiana",
    name: "Cinturón Piel Italiana",
    category: "Accesorios",
    price: "49,00",
    priceValue: 49,
    tone: "rust",
    sizes: ["Única"],
    color: "Negro",
    description:
      "Cinturón de piel italiana con hebilla minimalista. Detalle esencial de la sastrería moderna.",
    images: [
      unsplash("1473188588951-666fce8e7c68"),
      unsplash("1628483212179-49f29440423e"),
    ],
    featured: true,
  },

  {
    id: "09",
    slug: "sudadera-premium-algodon",
    name: "Sudadera Premium Algodón",
    category: "Hombre",
    price: "69,00",
    priceValue: 69,
    tone: "stone",
    sizes: ["S", "M", "L", "XL"],
    color: "Gris",
    description:
      "Sudadera de algodón premium con tacto suave y corte relajado. Comodidad sin renunciar al estilo.",
    images: [
      unsplash("1602810319428-019690571b5b"),
      unsplash("1602810319250-a663f0af2f75"),
    ],
  },
  {
    id: "10",
    slug: "chaqueta-denim-recta",
    name: "Chaqueta Denim Recta",
    category: "Hombre",
    price: "119,00",
    priceValue: 119,
    tone: "fog",
    sizes: ["M", "L", "XL"],
    color: "Azul Marino",
    description:
      "Chaqueta denim de corte recto en lavado medio. Un básico renovado para toda la temporada.",
    images: [
      unsplash("1602810316498-ab67cf68c8e1"),
      unsplash("1602810318383-e386cc2a3ccf"),
    ],
  },
  {
    id: "11",
    slug: "jersey-cuello-alto",
    name: "Jersey Cuello Alto",
    category: "Hombre",
    price: "59,00",
    priceValue: 59,
    tone: "linen",
    sizes: ["S", "M", "L"],
    color: "Negro",
    description:
      "Jersey de punto fino con cuello alto. Abriga con una silueta estilizada y minimalista.",
    images: [
      unsplash("1602810319250-a663f0af2f75"),
      unsplash("1602810320073-1230c46d89d4"),
    ],
  },
  {
    id: "12",
    slug: "pantalon-chino-slim",
    name: "Pantalón Chino Slim",
    category: "Hombre",
    price: "75,00",
    priceValue: 75,
    tone: "sand",
    sizes: ["S", "M", "L", "XL"],
    color: "Beige",
    description:
      "Pantalón chino slim en algodón elástico. Comodidad y precisión en un mismo corte.",
    images: [
      unsplash("1602810318383-e386cc2a3ccf"),
      unsplash("1602810316693-3667c854239a"),
    ],
  },

  {
    id: "13",
    slug: "blusa-seda-fluida",
    name: "Blusa Seda Fluida",
    category: "Mujer",
    price: "99,00",
    priceValue: 99,
    tone: "linen",
    sizes: ["XS", "S", "M"],
    color: "Blanco",
    description:
      "Blusa en seda fluida con caída ligera. Sofisticación natural para el día o la noche.",
    images: [
      unsplash("1783512785580-9a8995e7cea6"),
      unsplash("1612739980306-908bac4fc9fe"),
    ],
  },
  {
    id: "14",
    slug: "pantalon-palazzo",
    name: "Pantalón Palazzo",
    category: "Mujer",
    price: "89,00",
    priceValue: 89,
    tone: "clay",
    sizes: ["XS", "S", "M", "L"],
    color: "Terracota",
    description:
      "Pantalón palazzo de pierna ancha y cintura alta. Movimiento y comodidad en una silueta elegante.",
    images: [
      unsplash("1768982597008-1085842f297a"),
      unsplash("1763719161790-1e8edf704820"),
    ],
  },
  {
    id: "15",
    slug: "chaqueta-bomber",
    name: "Chaqueta Bomber",
    category: "Mujer",
    price: "149,00",
    priceValue: 149,
    tone: "ink",
    sizes: ["S", "M", "L"],
    color: "Negro",
    description:
      "Chaqueta bomber con acabado mate y corte contemporáneo. El toque urbano de la colección.",
    images: [
      unsplash("1779398970408-1454e2a126c2"),
      unsplash("1768460608433-d3af5148832c"),
    ],
  },
  {
    id: "16",
    slug: "vestido-camisero-lino",
    name: "Vestido Camisero Lino",
    category: "Mujer",
    price: "109,00",
    priceValue: 109,
    tone: "sand",
    sizes: ["XS", "S", "M", "L"],
    color: "Beige",
    description:
      "Vestido camisero en lino natural, silueta relajada. Fresco y versátil para los días cálidos.",
    images: [
      unsplash("1612739980306-908bac4fc9fe"),
      unsplash("1783512785564-0d728a1d63b5"),
    ],
  },

  {
    id: "17",
    slug: "bufanda-lana-merino",
    name: "Bufanda Lana Merino",
    category: "Accesorios",
    price: "45,00",
    priceValue: 45,
    tone: "moss",
    sizes: ["Única"],
    color: "Verde Oliva",
    description:
      "Bufanda de lana merino extra suave. Calidez y textura para completar el abrigo.",
    images: [
      unsplash("1637868796504-32f45a96d5a0"),
      unsplash("1554825959-e9a6670d4f18"),
    ],
  },
  {
    id: "18",
    slug: "gafas-de-sol-acetato",
    name: "Gafas de Sol Acetato",
    category: "Accesorios",
    price: "89,00",
    priceValue: 89,
    tone: "ink",
    sizes: ["Única"],
    color: "Negro",
    description:
      "Gafas de sol en acetato con montura minimalista. Protección con carácter atemporal.",
    images: [
      unsplash("1644258676710-ffb99d7d7a1b"),
      unsplash("1537832816519-689ad163238b"),
    ],
  },
  {
    id: "19",
    slug: "gorra-algodon-organico",
    name: "Gorra Algodón Orgánico",
    category: "Accesorios",
    price: "35,00",
    priceValue: 35,
    tone: "fog",
    sizes: ["Única"],
    color: "Gris",
    description:
      "Gorra de algodón orgánico con visera curva. Un básico deportivo con espíritu LAGO.",
    images: [
      unsplash("1628483212179-49f29440423e"),
      unsplash("1657603738389-951c374b740c"),
    ],
  },
  {
    id: "20",
    slug: "reloj-acero-minimalista",
    name: "Reloj Acero Minimalista",
    category: "Accesorios",
    price: "219,00",
    priceValue: 219,
    tone: "stone",
    sizes: ["Única"],
    color: "Negro",
    description:
      "Reloj de acero con esfera minimalista y correa de piel. El detalle final de cualquier look.",
    images: [
      unsplash("1554825959-e9a6670d4f18"),
      unsplash("1628483211662-9bcc692c46dc"),
    ],
  },
];

export const featuredProducts: PlaceholderProduct[] = products.filter(
  (product) => product.featured,
);

export function getProductBySlug(slug: string): PlaceholderProduct | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string): PlaceholderProduct | undefined {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(
  product: PlaceholderProduct,
  limit = 4,
): PlaceholderProduct[] {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

// Búsqueda simple por texto sobre nombre, categoría, color y descripción.
// Cuando exista un catálogo real (Shopify o Postgres), esta es la única
// función a reemplazar — app/buscar/page.tsx y los formularios del Navbar
// no necesitan cambiar (ver docs/ARCHITECTURE.md).
export function searchProducts(query: string): PlaceholderProduct[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return products.filter((product) =>
    [product.name, product.category, product.color, product.description]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

export type CatalogSearchParams = {
  [key: string]: string | string[] | undefined;
};

export function toArray(value: string | string[] | undefined): string[] {
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
    const matchesSize =
      sizes.length === 0 || product.sizes.some((s) => sizes.includes(s));
    const matchesColor = colors.length === 0 || colors.includes(product.color);
    const matchesPrice =
      priceBuckets.length === 0 ||
      priceBuckets.some(
        (bucket) =>
          product.priceValue >= bucket.min && product.priceValue < bucket.max,
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
