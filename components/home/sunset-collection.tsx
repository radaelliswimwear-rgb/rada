import type { PlaceholderProduct } from "lib/placeholder-data";
import { SunsetCarousel } from "./sunset-carousel";

// Vidriera del home: productos de la colección Oasis Natural (antes era una
// selección fija de 4 slugs de distintas colecciones para "Sueños al
// atardecer" — ahora muestra directamente el catálogo real de una sola
// colección, así que se mantiene solo con lo que haya activo ahí).
export const SUNSET_PAGE_SIZE = 8;

// Recibe `products` ya resueltos por app/page.tsx (Sprint 22) en vez de
// pedirlos acá adentro: el home necesita saber qué slugs usó esta sección
// ANTES de pedir "Productos destacados"/"Recomendado para vos", para que
// ninguna prenda se repita en dos vidrieras del home a la vez — eso solo
// se puede coordinar desde el componente padre que las renderiza en orden.
export function SunsetCollection({
  products,
}: {
  products: PlaceholderProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="scroll-mt-20 bg-[#f0ece3] py-20">
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-crimson">
          Radaelli Swimwear
        </p>
        <h2 className="mt-2 font-serif text-3xl italic tracking-tight text-[#1c2b45] sm:text-4xl">
          La belleza de sentirte tú
        </h2>

        <div className="mt-10">
          <SunsetCarousel products={products} />
        </div>
      </div>
    </section>
  );
}
