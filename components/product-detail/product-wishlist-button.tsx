"use client";

import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useWishlist } from "components/wishlist/wishlist-store";

// Versión con etiqueta del corazón de favoritos, para la ficha de producto
// (hay espacio de sobra al lado del precio, a diferencia de una tarjeta de
// grilla) — mismo estado/lógica que components/wishlist/wishlist-heart-button.tsx,
// que es la versión compacta usada en tarjetas.
export function ProductWishlistButton({ productId }: { productId: string }) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(productId);

  return (
    <button
      type="button"
      onClick={() => void toggle(productId)}
      aria-pressed={saved}
      className={`inline-flex w-fit flex-none items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
        saved
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-neutral-300 text-neutral-700 hover:border-brand-crimson hover:text-brand-crimson"
      }`}
    >
      {saved ? (
        <HeartSolid className="h-4 w-4 text-red-500" />
      ) : (
        <HeartOutline className="h-4 w-4" />
      )}
      {saved ? "Guardado" : "Agregar a favoritos"}
    </button>
  );
}
