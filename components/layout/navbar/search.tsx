"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { catalogRepository } from "lib/catalog/catalog-repository";

type Suggestion = { slug: string; name: string; image: string; price: string };

// Busca sobre Postgres real (lib/catalog/catalog-actions.ts) desde el
// Sprint 13; el autocompletado (Sprint 17) es una capa nueva encima, con
// debounce, que no reemplaza la búsqueda de página completa en /buscar —
// solo ofrece un atajo a los primeros resultados mientras se escribe.
export default function NavSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await catalogRepository.searchSuggestions(query);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative flex items-center">
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-out",
          open ? "w-40 opacity-100 sm:w-56" : "w-0 opacity-0",
        )}
      >
        <Form action="/buscar">
          <input
            ref={inputRef}
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Buscar..."
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="search-suggestions"
            className="w-full rounded-full border border-neutral-300 bg-transparent px-3 py-1.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none dark:border-neutral-700 dark:text-white"
          />
        </Form>

        {open && showSuggestions && suggestions.length > 0 ? (
          <ul
            id="search-suggestions"
            role="listbox"
            aria-label="Sugerencias de búsqueda"
            className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
          >
            {suggestions.map((item) => (
              <li key={item.slug} role="option" aria-selected="false">
                <Link
                  href={`/producto/${item.slug}`}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  <span className="relative h-10 w-8 flex-none overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-neutral-500">
                    {item.price} €
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
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
