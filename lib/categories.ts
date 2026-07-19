// Categorías de la Home. La forma de este tipo está pensada para mapear
// directamente a una Collection de Shopify cuando se conecte (ver docs/09-ROADMAP.md):
// id -> Collection.id, slug -> Collection.handle, image -> Collection.image.url, etc.
export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
  /** false = todavía no existe una página de catálogo real para esta categoría. */
  available: boolean;
};

export const categories: Category[] = [
  {
    id: "hombre",
    slug: "hombre",
    name: "Hombre",
    description: "Sastrería moderna y esenciales atemporales.",
    image:
      "https://images.unsplash.com/photo-1656695230389-01185e6fbff8?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Hombre vistiendo un abrigo de sastrería en tonos neutros",
    href: "/hombre",
    available: true,
  },
  {
    id: "mujer",
    slug: "mujer",
    name: "Mujer",
    description: "Siluetas fluidas y materiales nobles.",
    image:
      "https://images.unsplash.com/photo-1662532577856-e8ee8b138a8b?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Mujer con un conjunto elegante de temporada",
    href: "/mujer",
    available: true,
  },
  {
    id: "ninos",
    slug: "ninos",
    name: "Niños",
    description: "Comodidad y estilo para los más pequeños.",
    image:
      "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Ropa infantil moderna y cómoda",
    href: "/ninos",
    available: true,
  },
  {
    id: "calzado",
    slug: "calzado",
    name: "Calzado",
    description: "Zapatillas y calzado de diseño atemporal.",
    image:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Zapatillas de diseño sobre fondo minimalista",
    href: "/calzado",
    available: true,
  },
  {
    id: "accesorios",
    slug: "accesorios",
    name: "Accesorios",
    description: "Los detalles que definen el conjunto.",
    image:
      "https://images.unsplash.com/photo-1571974096035-bc3568627608?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Composición de accesorios de moda: bolso, gafas y reloj",
    href: "/accesorios",
    available: true,
  },
  {
    id: "novedades",
    slug: "novedades",
    name: "Novedades",
    description: "Lo último de la temporada, recién llegado.",
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Percha con las últimas prendas de la colección",
    href: "/novedades",
    available: false,
  },
];
