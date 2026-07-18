"use client";

import clsx from "clsx";
import {
  COLOR_OPTIONS,
  PRICE_BUCKETS,
  SIZE_OPTIONS,
  SORT_OPTIONS,
} from "lib/placeholder-data";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useToggleParam(key: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);

    params.delete(key);
    if (current.includes(value)) {
      current.filter((v) => v !== value).forEach((v) => params.append(key, v));
    } else {
      [...current, value].forEach((v) => params.append(key, v));
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
}

function FilterGroup({
  title,
  paramKey,
  options,
}: {
  title: string;
  paramKey: string;
  options: readonly string[];
}) {
  const searchParams = useSearchParams();
  const active = searchParams.getAll(paramKey);
  const toggle = useToggleParam(paramKey);

  return (
    <div className="border-b border-neutral-200 py-5 dark:border-neutral-800">
      <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = active.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={isActive}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs transition-colors duration-200",
                isActive
                  ? "border-brand-crimson bg-brand-crimson text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-brand-crimson hover:text-brand-crimson",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PriceGroup() {
  const searchParams = useSearchParams();
  const active = searchParams.getAll("precio");
  const toggle = useToggleParam("precio");

  return (
    <div className="border-b border-neutral-200 py-5 dark:border-neutral-800">
      <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
        Precio
      </h3>
      <div className="flex flex-col gap-2">
        {PRICE_BUCKETS.map((bucket) => {
          const isActive = active.includes(bucket.id);
          return (
            <label
              key={bucket.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => toggle(bucket.id)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-crimson focus:ring-brand-crimson"
              />
              {bucket.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("orden") ?? SORT_OPTIONS[0].id;

  return (
    <div className="py-5">
      <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
        Ordenar por
      </h3>
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value === SORT_OPTIONS[0].id) {
            params.delete("orden");
          } else {
            params.set("orden", e.target.value);
          }
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CatalogFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasActiveFilters =
    searchParams.getAll("talla").length > 0 ||
    searchParams.getAll("color").length > 0 ||
    searchParams.getAll("precio").length > 0;

  return (
    <div>
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <h2 className="text-sm font-medium text-neutral-900">
          Filtros
        </h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="text-xs text-neutral-500 underline-offset-4 hover:underline"
          >
            Limpiar
          </button>
        ) : null}
      </div>
      <SortSelect />
      <FilterGroup title="Talla" paramKey="talla" options={SIZE_OPTIONS} />
      <FilterGroup title="Color" paramKey="color" options={COLOR_OPTIONS} />
      <PriceGroup />
    </div>
  );
}
