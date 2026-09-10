import type { PlaceholderProduct } from "lib/placeholder-data";
import { ProductCarousel } from "./product-carousel";

// Recibe `products` ya resueltos por app/page.tsx — mismo motivo que
// SunsetCollection: la deduplicación entre vidrieras del home se coordina
// desde el padre, que sabe qué slugs ya usó cada sección anterior.
export function FeaturedProducts({
  products,
}: {
  products: PlaceholderProduct[];
}) {
  if (products.length === 0) return null;

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
        <ProductCarousel products={products} />
      </div>
    </section>
  );
}
