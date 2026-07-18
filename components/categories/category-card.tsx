"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import type { Category } from "lib/categories";

export function CategoryCard({ category }: { category: Category }) {
  const media = (
    <>
      <Image
        src={category.image}
        alt={category.imageAlt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

      {!category.available ? (
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-900">
          Próximamente
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
        <h3 className="font-semibold tracking-tight text-2xl text-white sm:text-3xl">
          {category.name}
        </h3>
        <p className="mt-2 max-w-[26ch] text-sm text-white/80">
          {category.description}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 border-b border-white/70 pb-1 text-xs uppercase tracking-[0.2em] text-white opacity-0 transition-all duration-300 group-hover:opacity-100 motion-reduce:opacity-100">
          {category.available ? "Explorar" : "Próximamente"}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </>
  );

  const baseClassName =
    "group relative isolate block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-brand-blush/30 text-left focus-visible:outline-none";

  if (category.available) {
    return (
      <Link
        href={category.href}
        aria-label={`Explorar la categoría ${category.name}`}
        className={baseClassName}
      >
        {media}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        toast(`La categoría "${category.name}" estará disponible muy pronto.`)
      }
      aria-label={`${category.name}, categoría próximamente disponible`}
      className={baseClassName}
    >
      {media}
    </button>
  );
}
