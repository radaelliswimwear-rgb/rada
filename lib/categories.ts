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
    // Archivada (rebrand a Radaelli Swimwear): ruta y productos siguen
    // existiendo, solo se oculta del menú/home con el mismo mecanismo que
    // "Novedades" ("Próximamente").
    available: false,
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
    available: false, // archivada (rebrand a Radaelli Swimwear)
  },
  {
    id: "oasis-natural",
    slug: "oasis-natural",
    name: "Oasis Natural",
    description: "Tonos tierra y vegetación exuberante.",
    image: "/images/products/002.webp",
    imageAlt: "Traje de baño Radaelli en tonos naturales",
    href: "/oasis-natural",
    available: true,
  },
  {
    id: "aurora-viva",
    slug: "aurora-viva",
    name: "Aurora Viva",
    description: "Colores luminosos para los primeros rayos del día.",
    image: "/images/products/1.webp",
    imageAlt: "Traje de baño Radaelli en colores luminosos",
    href: "/aurora-viva",
    available: true,
  },
  {
    id: "espuma-de-ola",
    slug: "espuma-de-ola",
    name: "Espuma de Ola",
    description: "Texturas suaves y tonos marinos.",
    image: "/images/products/1 (1).webp",
    imageAlt: "Traje de baño Radaelli en tonos marinos",
    href: "/espuma-de-ola",
    available: true,
  },
  {
    id: "salidas-de-bano",
    slug: "salidas-de-bano",
    name: "Salidas de Baño",
    description: "Prendas ligeras para después del sol.",
    image: "/images/products/002.webp",
    imageAlt: "Salida de baño Radaelli",
    href: "/salidas-de-bano",
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
    available: false, // archivada (rebrand a Radaelli Swimwear)
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
    available: false, // archivada (rebrand a Radaelli Swimwear)
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
    available: false, // archivada de "Categorías destacadas" (solo quedan las 4 de swimwear)
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
