import { catalogRepository } from "lib/catalog/catalog-repository";
import { ProductCard } from "./product-card";

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
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
