import { PlaceholderArt } from "components/home/placeholder-art";
import { ProductCard } from "components/home/product-card";
import Footer from "components/layout/footer";
import {
  filterAndSortProducts,
  products,
  type CatalogSearchParams,
  type Tone,
} from "lib/placeholder-data";
import { CatalogFilters } from "./catalog-filters";

type Category = "Hombre" | "Mujer" | "Accesorios";

const CATEGORY_COPY: Record<Category, { tone: Tone; description: string }> = {
  Hombre: { tone: "ink", description: "Sastrería moderna y esenciales atemporales." },
  Mujer: { tone: "clay", description: "Siluetas fluidas, materiales nobles." },
  Accesorios: { tone: "sand", description: "Los detalles que definen el conjunto." },
};

export async function CatalogPage({
  category,
  searchParams,
}: {
  category: Category;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const categoryProducts = products.filter((p) => p.category === category);
  const filtered = filterAndSortProducts(categoryProducts, params);
  const { tone, description } = CATEGORY_COPY[category];

  return (
    <>
      <section className="relative flex h-[38vh] min-h-[260px] items-end overflow-hidden text-white">
        <PlaceholderArt tone={tone} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            Colección
          </p>
          <h1 className="mt-2 font-semibold tracking-tight text-4xl sm:text-5xl">{category}</h1>
          <p className="mt-2 max-w-md text-sm text-white/80">{description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full flex-none md:w-56">
            <CatalogFilters />
          </aside>
          <div className="flex-1">
            <p className="mb-6 text-sm text-neutral-500">
              {filtered.length}{" "}
              {filtered.length === 1 ? "producto" : "productos"}
            </p>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                No hay productos que coincidan con estos filtros.
              </p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
