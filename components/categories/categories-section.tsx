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

      {/* 1 columna a todo el ancho (Sprint 22, antes 2x2): cada categoría
          es ahora su propia franja panorámica de izquierda a derecha, con
          espacio para un video en loop destacando la colección (ver
          coverVideoUrl y CategoryCard) en vez de una foto fija chica. El
          marco pasó de 3/4 (vertical) a 16/9 (panorámico) — ver
          CONTAINER_ASPECT.cover en lib/image-framing.ts. */}
      <div className="grid grid-cols-1 gap-8 lg:gap-10">
        {visibleCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
