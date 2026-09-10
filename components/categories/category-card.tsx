"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import type { Category } from "lib/categories";
import {
  CONTAINER_ASPECT,
  getBackgroundFrame,
  getBackgroundPosition,
} from "lib/image-framing";

export function CategoryCard({ category }: { category: Category }) {
  // Foto real subida desde /admin/categorias: usa background-image, NO
  // next/image (object-fit/object-position) + transform:scale — esa
  // combinación tiene un bug real (el recorte se decide antes del
  // transform, así que el zoom nunca revela contenido nuevo al mover la
  // posición). Ver lib/image-framing.ts. La imagen curada de fallback no
  // tiene zoom/pan que ajustar, así que sigue usando next/image normal.
  const hasRealFraming = Boolean(category.imageWidth && category.imageHeight);
  const zoom = category.imageZoom ?? 1;

  const media = (
    <>
      {hasRealFraming ? (
        <div
          aria-label={category.imageAlt}
          role="img"
          className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-110"
          style={{
            backgroundImage: `url(${category.image})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: getBackgroundPosition(
              category.imagePosX ?? 50,
              category.imagePosY ?? 50,
            ),
            ...getBackgroundFrame(
              category.imageWidth!,
              category.imageHeight!,
              CONTAINER_ASPECT.cover,
              zoom,
            ),
          }}
        />
      ) : (
        <Image
          src={category.image}
          alt={category.imageAlt}
          fill
          sizes="(min-width: 640px) 50vw, 45vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

      {!category.available ? (
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-900">
          Próximamente
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
        <h3 className="font-semibold tracking-tight text-2xl text-white sm:text-3xl lg:text-4xl">
          {category.name}
        </h3>
        <p className="mt-2 max-w-[30ch] text-sm text-white/80 lg:text-base">
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
