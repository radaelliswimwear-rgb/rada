"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Money } from "components/currency/money";
import type { PlaceholderProduct } from "lib/placeholder-data";

export function SunsetCarousel({
  products,
}: {
  products: PlaceholderProduct[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const amount = (card?.offsetWidth ?? 320) + 24;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Anterior"
        className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md transition-transform duration-200 hover:scale-105"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/producto/${product.slug}`}
            data-card
            className="group w-[220px] flex-none snap-start sm:w-[260px]"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#e7e2d8]">
              <Image
                src={product.images[0]!}
                alt={product.name}
                fill
                sizes="260px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-sm text-[#1c2b45]">{product.name}</h3>
              <p className="mt-1 text-sm text-brand-coral">
                <Money amountCop={product.priceValue} />
              </p>
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Siguiente"
        className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md transition-transform duration-200 hover:scale-105"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
