import { catalogRepository } from "lib/catalog/catalog-repository";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { SunsetCarousel } from "./sunset-carousel";

// Vidriera curada a mano (no una categoría propia): 4 productos fijos por
// slug, uno de cada colección de swimwear, para la sección "Sueños al
// atardecer" del home — igual patrón que RecommendedForYou, pero con una
// selección explícita en vez de un algoritmo.
const SUNSET_SLUGS = [
  "bikini-foam",
  "entero-shadow-palm",
  "entero-golden-hour",
  "bikini-palm",
] as const;

export async function SunsetCollection() {
  const products = (
    await Promise.all(SUNSET_SLUGS.map((slug) => catalogRepository.getBySlug(slug)))
  ).filter((product): product is PlaceholderProduct => product !== null);

  if (products.length === 0) return null;

  return (
    <section className="scroll-mt-20 bg-[#f0ece3] py-20">
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-crimson">
          Radaelli Swimwear
        </p>
        <h2 className="mt-2 font-serif text-3xl italic tracking-tight text-[#1c2b45] sm:text-4xl">
          Sueños al atardecer
        </h2>

        <div className="mt-10">
          <SunsetCarousel products={products} />
        </div>
      </div>
    </section>
  );
}
