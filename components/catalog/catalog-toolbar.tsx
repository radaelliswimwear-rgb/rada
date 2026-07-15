"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const VIEW_OPTIONS = [2, 3, 4] as const;

export function CatalogToolbar({
  category,
  resultCount,
}: {
  category: string;
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilterCount =
    searchParams.getAll("talla").length +
    searchParams.getAll("color").length +
    searchParams.getAll("precio").length;

  const currentView = Number(searchParams.get("vista")) || 3;

  const setView = (columns: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (columns === 3) {
      params.delete("vista");
    } else {
      params.set("vista", String(columns));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("talla");
    params.delete("color");
    params.delete("precio");
    params.delete("pagina");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:-mx-8 lg:px-8 dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <nav aria-label="Miga de pan" className="text-xs text-neutral-500">
          <Link href="/" className="hover:text-black dark:hover:text-white">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800 dark:text-neutral-300">
            {category}
          </span>
        </nav>

        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span>
            {resultCount} {resultCount === 1 ? "producto" : "productos"}
          </span>

          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-black underline-offset-4 hover:underline dark:text-white"
            >
              Filtros ({activeFilterCount}) · Limpiar
            </button>
          ) : null}

          <div className="flex items-center gap-1 rounded-full border border-neutral-300 p-0.5 dark:border-neutral-700">
            {VIEW_OPTIONS.map((columns) => (
              <button
                key={columns}
                type="button"
                onClick={() => setView(columns)}
                aria-pressed={currentView === columns}
                aria-label={`Ver en ${columns} columnas`}
                className={clsx(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition-colors duration-200",
                  currentView === columns
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-neutral-500 hover:text-black dark:hover:text-white",
                )}
              >
                {columns}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
