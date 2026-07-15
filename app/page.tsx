import Footer from "components/layout/footer";
import { CategoriesSection } from "components/categories/categories-section";
import { FeaturedProducts } from "components/home/featured-products";
import { Hero } from "components/home/hero";
import { Newsletter } from "components/home/newsletter";
import { PromoBanner } from "components/home/promo-banner";
import { RecommendedForYou } from "components/home/recommended-for-you";

export const metadata = {
  description:
    "LAGO, la firma de Laura Gómez — moda premium atemporal. Sastrería moderna, materiales nobles y una mirada minimalista para hombre y mujer.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <FeaturedProducts />
      <RecommendedForYou />
      <PromoBanner />
      <Newsletter />
      <Footer />
    </>
  );
}
