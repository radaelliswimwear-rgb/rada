import { featuredProducts } from "lib/placeholder-data";
import { ProductCard } from "./product-card";

export function FeaturedProducts() {
  return (
    <section
      id="productos"
      className="scroll-mt-20 bg-neutral-50 py-20 dark:bg-neutral-900/40"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Lo más nuevo
          </p>
          <h2 className="mt-2 font-semibold tracking-tight text-3xl text-black sm:text-4xl dark:text-white">
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
