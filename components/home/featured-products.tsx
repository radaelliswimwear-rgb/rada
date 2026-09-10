import { catalogRepository } from "lib/catalog/catalog-repository";
import { ProductCarousel } from "./product-carousel";

export async function FeaturedProducts() {
  const featuredProducts = await catalogRepository.listFeatured();

  return (
    <section
      id="productos"
      className="scroll-mt-20 bg-brand-blush/10 py-20"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-crimson">
            Lo más nuevo
          </p>
          <h2 className="mt-2 font-semibold tracking-tight text-3xl text-neutral-900 sm:text-4xl">
            Productos destacados
          </h2>
        </div>
        <ProductCarousel products={featuredProducts} />
      </div>
    </section>
  );
}
