import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CatalogGrid } from "components/catalog/catalog-grid";
import Footer from "components/layout/footer";
import { catalogRepository } from "lib/catalog/catalog-repository";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Buscá productos en LAGO.",
  robots: { index: false, follow: false },
};

export default async function BuscarPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q?.trim() ?? "";
  const results = query ? await catalogRepository.search(query) : [];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <nav aria-label="Miga de pan" className="mb-6 text-xs text-neutral-500">
          <Link href="/" className="hover:text-black dark:hover:text-white">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800 dark:text-neutral-300">Buscar</span>
        </nav>

        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Búsqueda
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {query ? `Resultados para "${query}"` : "Buscar productos"}
          </h1>
          {query ? (
            <p className="mt-2 text-sm text-neutral-500">
              {results.length}{" "}
              {results.length === 1
                ? "producto encontrado"
                : "productos encontrados"}
            </p>
          ) : null}
        </div>

        {!query ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 text-center dark:border-neutral-700">
            <MagnifyingGlassIcon className="h-8 w-8 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Escribí algo para empezar a buscar.
            </p>
            <p className="max-w-xs text-xs text-neutral-500">
              Podés buscar por nombre de producto, categoría o color.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 text-center dark:border-neutral-700">
            <MagnifyingGlassIcon className="h-8 w-8 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              No encontramos productos que coincidan con &quot;{query}&quot;.
            </p>
            <p className="max-w-xs text-xs text-neutral-500">
              Probá con otro nombre, categoría o color.
            </p>
            <Link
              href="/#categorias"
              className="mt-4 rounded-full bg-black px-6 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90 dark:bg-white dark:text-black"
            >
              Explorar colección
            </Link>
          </div>
        ) : (
          <CatalogGrid products={results} columns={3} />
        )}
      </div>
      <Footer />
    </>
  );
}
