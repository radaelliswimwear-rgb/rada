"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRef } from "react";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { ProductCard } from "./product-card";

// Carrusel de tarjetas grandes con "peek" del siguiente producto (Sprint
// 22), mismo patrón que SunsetCarousel — se extrae acá porque ahora lo
// usan tres secciones del home (esa, "Productos destacados" y
// "Recomendado para vos") y duplicar la lógica de scroll/flechas tres
// veces no aporta nada. ProductCard ya resuelve foto+nombre+precio, este
// componente solo decide el tamaño de cada tarjeta y el scroll.
export function ProductCarousel({
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
          <div
            key={product.id}
            data-card
            className="w-[85%] flex-none snap-start sm:w-[62%] lg:w-[42%]"
          >
            <ProductCard product={product} />
          </div>
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
