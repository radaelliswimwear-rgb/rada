"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listRecentlyViewed,
  recordView,
  type RecentlyViewedItem,
} from "lib/recently-viewed/storage";

// Registra la vista del producto actual y muestra el historial (Sprint 17).
// Cliente puro: lee/escribe localStorage, así que no puede vivir en
// ProductDetail (Server Component) — se monta ahí como una isla de cliente.
export function RecentlyViewed({ current }: { current: RecentlyViewedItem }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    recordView(current);
    setItems(listRecentlyViewed(current.slug));
    // Solo al montar/cambiar de producto — no se re-ejecuta por cambios de
    // `current` que no sean un slug distinto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.slug]);

  if (items.length === 0) return null;

  return (
    <div className="py-12">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">
        Vistos recientemente
      </h2>
      {/* Tarjetas grandes con "peek" (Sprint 22), mismo criterio que
          SunsetCarousel: antes eran miniaturas fijas de 128-160px que
          cabían varias sin necesidad de deslizar — ahora cada una ocupa
          buena parte del ancho a propósito, con la siguiente asomando. */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/producto/${item.slug}`}
            className="group w-[42%] flex-none snap-start sm:w-[28%] lg:w-[18%]"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <p className="mt-2 truncate text-xs text-neutral-600 dark:text-neutral-400">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
