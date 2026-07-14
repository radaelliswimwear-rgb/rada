"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// La búsqueda real contra Shopify se conecta en una fase posterior (ver docs/09-ROADMAP.md).
export default function NavSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="flex items-center">
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-out",
          open ? "w-40 opacity-100 sm:w-56" : "w-0 opacity-0",
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast("La búsqueda estará disponible muy pronto.");
            setOpen(false);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            name="q"
            placeholder="Buscar..."
            autoComplete="off"
            className="w-full rounded-full border border-neutral-300 bg-transparent px-3 py-1.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none dark:border-neutral-700 dark:text-white"
          />
        </form>
      </div>
      <button
        type="button"
        aria-label={open ? "Cerrar buscador" : "Buscar"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        {open ? (
          <XMarkIcon className="h-5 w-5" />
        ) : (
          <MagnifyingGlassIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
