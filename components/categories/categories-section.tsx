import { catalogRepository } from "lib/catalog/catalog-repository";
import { categories } from "lib/categories";
import { CategoryCard } from "./category-card";

export async function CategoriesSection() {
  // Mismo interruptor que Navbar/Footer (Category.active, /admin/categorias):
  // lib/categories.ts sigue siendo la fuente de la copy/imagen curada de
  // cada tarjeta, pero qué se muestra lo decide la DB, no el flag
  // `available` fijo en el código.
  const activeCategories = await catalogRepository.listActiveCategories();
  const coverBySlug = new Map(
    activeCategories.map((category) => [category.slug, category]),
  );
  const visibleCategories = categories
    .filter((category) => coverBySlug.has(category.slug))
    .map((category) => {
      const cover = coverBySlug.get(category.slug);
      const withVideo = cover?.coverVideoUrl
        ? { ...category, coverVideoUrl: cover.coverVideoUrl }
        : category;
      if (!cover?.coverImageUrl || !cover.coverImageWidth || !cover.coverImageHeight) {
        return withVideo;
      }
      return {
        ...withVideo,
        image: cover.coverImageUrl,
        imageWidth: cover.coverImageWidth,
        imageHeight: cover.coverImageHeight,
        imagePosX: cover.coverImagePosX,
        imagePosY: cover.coverImagePosY,
        imageZoom: cover.coverImageZoom,
      };
    });

  if (visibleCategories.length === 0) return null;

  return (
    <section
      id="categorias"
      aria-labelledby="categorias-heading"
      className="scroll-mt-20 bg-white py-20"
    >
      <div className="mx-auto mb-10 max-w-7xl px-4 lg:px-8">
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

      {/* Borde a borde (prueba, inspirada en OndadeMar): el título se queda
          en el contenedor de siempre, pero la grilla sale de max-w-7xl y del
          padding horizontal — cada foto toca los bordes de la pantalla, sin
          gap entre categorías (se tocan directamente, igual que sus
          banners ENTERIZOS/BAGS/HATS). CategoryCard le quita el
          rounded-2xl mientras está en este modo. */}
      <div className="grid grid-cols-1">
        {visibleCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
