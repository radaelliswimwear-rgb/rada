import { categories } from "lib/categories";
import { CategoryCard } from "./category-card";

export function CategoriesSection() {
  return (
    <section
      id="categorias"
      aria-labelledby="categorias-heading"
      className="mx-auto max-w-7xl scroll-mt-20 bg-white px-4 py-20 lg:px-8"
    >
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-crimson">
          Explora
        </p>
        <h2
          id="categorias-heading"
          className="mt-2 font-semibold tracking-tight text-3xl text-neutral-900 sm:text-4xl"
        >
          Categorías destacadas
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
