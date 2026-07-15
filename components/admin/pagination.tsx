"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-4 text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="text-neutral-500 hover:text-black disabled:opacity-30 dark:hover:text-white"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <span className="text-neutral-500">
        Página {page} de {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Página siguiente"
        className="text-neutral-500 hover:text-black disabled:opacity-30 dark:hover:text-white"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
