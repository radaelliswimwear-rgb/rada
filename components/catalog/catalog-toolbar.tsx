"use client";

import { Dialog, Transition } from "@headlessui/react";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { CatalogFilters } from "./catalog-filters";

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  // Igual que SizeGuideModal: el Dialog del panel de filtros solo se monta
  // después de hidratar — montarlo ya en el HTML del servidor desalinea los
  // ids (useId) de Headless UI entre servidor y cliente y dispara un error
  // de hydration mismatch en otros componentes de la página que también
  // usan useId (ver components/product-detail/size-guide-modal.tsx).
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

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
    <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:-mx-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <nav aria-label="Miga de pan" className="text-xs text-neutral-500">
          <Link href="/" className="hover:text-brand-crimson">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">{category}</span>
        </nav>

        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span>
            {resultCount} {resultCount === 1 ? "producto" : "productos"}
          </span>

          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="hidden underline-offset-4 hover:underline md:inline text-brand-crimson"
            >
              Filtros ({activeFilterCount}) · Limpiar
            </button>
          ) : null}

          {/* Trigger del panel de filtros — solo en celular, ya que en
              desktop los filtros van siempre visibles en la barra lateral. */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson md:hidden"
          >
            <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
            Filtros
            {activeFilterCount > 0 ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-crimson text-[10px] text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <div className="flex items-center gap-1 rounded-full border border-neutral-300 p-0.5">
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
                    ? "bg-brand-crimson text-white"
                    : "text-neutral-500 hover:text-brand-crimson",
                )}
              >
                {columns}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasMounted ? (
      <Transition show={isFiltersOpen} as={Fragment}>
        <Dialog
          onClose={() => setIsFiltersOpen(false)}
          className="relative z-[70] md:hidden"
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-end">
            <Transition.Child
              as={Fragment}
              enter="transition-transform ease-out duration-300"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="transition-transform ease-in duration-200"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <Dialog.Panel
                aria-label="Filtros y orden"
                className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white"
              >
                <div className="flex justify-center pt-2">
                  <div className="h-1 w-10 rounded-full bg-neutral-300" />
                </div>
                <div className="flex items-center justify-end px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setIsFiltersOpen(false)}
                    aria-label="Cerrar filtros"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4">
                  <CatalogFilters />
                </div>
                <div className="border-t border-neutral-200 p-4">
                  <button
                    type="button"
                    onClick={() => setIsFiltersOpen(false)}
                    className="w-full rounded-full bg-brand-crimson py-3 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90"
                  >
                    Ver {resultCount} {resultCount === 1 ? "producto" : "productos"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      ) : null}
    </div>
  );
}
