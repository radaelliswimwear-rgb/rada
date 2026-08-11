import { PlaceholderArt } from "components/home/placeholder-art";
import Footer from "components/layout/footer";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { CATEGORY_SLUG_BY_LABEL, type CategoryLabel } from "lib/catalog/types";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Tone } from "lib/placeholder-data";
import { CatalogFilters } from "./catalog-filters";
import { CatalogGrid } from "./catalog-grid";
import { CatalogToolbar } from "./catalog-toolbar";
import { Pagination } from "./pagination";

const CATEGORY_COPY: Record<
  CategoryLabel,
  { tone: Tone; description: string }
> = {
  Hombre: {
    tone: "ink",
    description: "Sastrería moderna y esenciales atemporales.",
  },
  Mujer: { tone: "clay", description: "Siluetas fluidas, materiales nobles." },
  Niños: {
    tone: "moss",
    description: "Comodidad y estilo para los más pequeños.",
  },
  Calzado: {
    tone: "stone",
    description: "Zapatillas y calzado de diseño atemporal.",
  },
  Accesorios: {
    tone: "sand",
    description: "Los detalles que definen el conjunto.",
  },
  "Oasis Natural": {
    tone: "moss",
    description: "Trajes de baño inspirados en tonos tierra y vegetación exuberante.",
  },
  "Aurora Viva": {
    tone: "linen",
    description: "Colores luminosos y siluetas frescas para los primeros rayos del día.",
  },
  "Espuma de Ola": {
    tone: "fog",
    description: "Texturas suaves y tonos marinos, como la espuma sobre la arena.",
  },
  "Salidas de Baño": {
    tone: "sand",
    description: "Prendas ligeras para después del sol, entre la playa y la ciudad.",
  },
};

const PAGE_SIZE = 4;
const VALID_COLUMNS = [2, 3, 4];

export async function CatalogPage({
  category,
  searchParams,
}: {
  category: CategoryLabel;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const { tone, description } = CATEGORY_COPY[category];

  const requestedPage = Math.max(1, Number(params.pagina) || 1);
  let { products: paginated, total } = await catalogRepository.listByCategory(
    category,
    params,
    requestedPage,
    PAGE_SIZE,
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  if (currentPage !== requestedPage) {
    ({ products: paginated } = await catalogRepository.listByCategory(
      category,
      params,
      currentPage,
      PAGE_SIZE,
    ));
  }

  const requestedColumns = Number(params.vista);
  const columns = VALID_COLUMNS.includes(requestedColumns)
    ? requestedColumns
    : 3;

  const categoryHref = `/${CATEGORY_SLUG_BY_LABEL[category]}`;
  const buildPageHref = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "pagina") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else if (typeof value === "string") {
        query.append(key, value);
      }
    }
    if (page > 1) query.set("pagina", String(page));
    const queryString = query.toString();
    return queryString ? `${categoryHref}?${queryString}` : categoryHref;
  };

  return (
    <>
      <section className="relative flex h-[38vh] min-h-[260px] items-end overflow-hidden text-white">
        <PlaceholderArt tone={tone} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/80 via-brand-bg/30 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            Colección
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            {category}
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/80">{description}</p>
        </div>
      </section>

      <CatalogToolbar category={category} resultCount={total} />

      <div className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full flex-none md:w-56">
            <CatalogFilters />
          </aside>
          <div className="flex-1">
            <CatalogGrid products={paginated} columns={columns} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={buildPageHref}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
