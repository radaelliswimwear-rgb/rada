"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DiscountedMoney } from "components/currency/discounted-money";
import type { PlaceholderProduct } from "lib/placeholder-data";

export function SunsetCarousel({
  products,
}: {
  products: PlaceholderProduct[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Oculta las flechas cuando no hay nada para deslizar en esa dirección
  // (Sprint 22) — ver mismo comentario en ProductCarousel.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const EPSILON = 4;
    const updateScrollState = () => {
      setCanScrollPrev(track.scrollLeft > EPSILON);
      setCanScrollNext(
        track.scrollLeft + track.clientWidth < track.scrollWidth - EPSILON,
      );
    };
    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products]);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const amount = (card?.offsetWidth ?? 320) + 24;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollPrev ? (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Anterior"
          className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md transition-transform duration-200 hover:scale-105"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      ) : null}

      {/* Tarjetas grandes con "peek" del siguiente producto (Sprint 22,
          inspirado en OndadeMar): antes cabían ~4 tarjetas chicas de 220-260px
          fijos sin necesidad de deslizar; ahora cada una ocupa la mayoría del
          ancho a propósito, para que la prenda se vea grande y quede claro
          que hay que deslizar para ver la siguiente. gap-6 (24px) es fijo en
          todos los breakpoints porque scrollByCard lo usa hardcodeado. */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/producto/${product.slug}`}
            data-card
            className="group w-[85%] flex-none snap-start sm:w-[62%] lg:w-[42%]"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#e7e2d8]">
              <Image
                src={product.images[0]!}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 62vw, 85vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-sm text-[#1c2b45]">{product.name}</h3>
              <p className="mt-1 text-sm text-brand-coral">
                <DiscountedMoney
                  amountCop={product.priceValue}
                  originalAmountCop={product.originalPriceValue ?? product.priceValue}
                  discountPercent={product.activeDiscountPercent ?? 0}
                />
              </p>
            </div>
          </Link>
        ))}
      </div>

      {canScrollNext ? (
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Siguiente"
          className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md transition-transform duration-200 hover:scale-105"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
