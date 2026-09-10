import Footer from "components/layout/footer";
import { CategoriesSection } from "components/categories/categories-section";
import { FeaturedProducts } from "components/home/featured-products";
import { Hero } from "components/home/hero";
import { Newsletter } from "components/home/newsletter";
import { PromoBanner } from "components/home/promo-banner";
import { RecommendedForYou } from "components/home/recommended-for-you";
import { SUNSET_PAGE_SIZE, SunsetCollection } from "components/home/sunset-collection";
import { catalogRepository } from "lib/catalog/catalog-repository";

export const metadata = {
  description:
    "Radaelli Swimwear — trajes de baño de diseño premium y atemporal. Materiales nobles y una mirada minimalista.",
  openGraph: {
    type: "website",
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
