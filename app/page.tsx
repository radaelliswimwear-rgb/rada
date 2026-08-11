import Footer from "components/layout/footer";
import { CategoriesSection } from "components/categories/categories-section";
import { FeaturedProducts } from "components/home/featured-products";
import { Hero } from "components/home/hero";
import { Newsletter } from "components/home/newsletter";
import { PromoBanner } from "components/home/promo-banner";
import { RecommendedForYou } from "components/home/recommended-for-you";
import { SunsetCollection } from "components/home/sunset-collection";

export const metadata = {
  description:
    "Radaelli Swimwear — trajes de baño de diseño premium y atemporal. Materiales nobles y una mirada minimalista.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <SunsetCollection />
      <FeaturedProducts />
      <RecommendedForYou />
      <PromoBanner />
      <Newsletter />
      <Footer />
    </>
  );
}
