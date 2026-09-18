import Footer from "components/layout/footer";
import { CategoriesSection } from "components/categories/categories-section";
import { FeaturedProducts } from "components/home/featured-products";
import { Hero } from "components/home/hero";
import { Newsletter } from "components/home/newsletter";
import { PromoBanner } from "components/home/promo-banner";
import { RecommendedForYou } from "components/home/recommended-for-you";
import { SUNSET_PAGE_SIZE, SunsetCollection } from "components/home/sunset-collection";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { SITE_NAME, SITE_URL } from "lib/seo/site";

// SEO técnico (sep. 2026): antes la home heredaba solo el title genérico de
// marca (app/layout.tsx: "Radaelli Swimwear", sin intención comercial ni
// ubicación) -- se agrega acá uno propio, más específico, sin tocar el
// default del layout (que sigue siendo el fallback correcto para cualquier
// página sin metadata propia).
const HOME_TITLE = "Trajes de baño de diseño en Colombia";
const HOME_DESCRIPTION =
  "Radaelli Swimwear — trajes de baño de diseño premium y atemporal. Materiales nobles y una mirada minimalista.";

// Social share / Open Graph (auditoría sep. 2026): Next.js SÍ hace fallback
// de openGraph.title/description al title/description de la página cuando
// no se especifican acá -- pero NO hace lo mismo con openGraph.siteName/url
// (quedaban vacíos, confirmado en el HTML real) ni con twitter.title/
// description (heredaban el genérico de app/layout.tsx en vez de este más
// específico). Se declaran los tres explícitos acá, mismo criterio que ya
// usa app/producto/[slug]/page.tsx, para no depender de qué SÍ y qué NO
// hace merge automático Next.js entre layout y página.
export const metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

export default async function HomePage() {
  // Evita que la misma prenda aparezca en más de una vidriera del home a
  // la vez (Sprint 22): cada sección se pide en el mismo orden en que se
  // renderiza y excluye los slugs que ya usaron las anteriores. Antes cada
  // componente se pedía sus propios productos por separado, sin saber qué
  // había elegido el resto — por eso a veces "Costa Esmeralda Azul"
  // aparecía tanto en "La belleza de sentirte tú" como en "Productos
  // destacados" en la misma carga de página.
  const { products: sunsetProducts } = await catalogRepository.listByCategory(
    "Oasis Natural",
    {},
    1,
    SUNSET_PAGE_SIZE,
  );
  const usedAfterSunset = sunsetProducts.map((product) => product.slug);

  const featuredProducts = await catalogRepository.listFeatured(usedAfterSunset);
  const usedAfterFeatured = [
    ...usedAfterSunset,
    ...featuredProducts.map((product) => product.slug),
  ];

  return (
    <>
      <Hero />
      <CategoriesSection />
      <SunsetCollection products={sunsetProducts} />
      <FeaturedProducts products={featuredProducts} />
      <RecommendedForYou excludeSlugs={usedAfterFeatured} />
      <PromoBanner />
      <Newsletter />
      <Footer />
    </>
  );
}
