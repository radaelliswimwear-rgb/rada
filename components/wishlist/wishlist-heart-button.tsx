"use client";

import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { useWishlist } from "./wishlist-store";

// Corazón compacto para superponer en miniaturas de producto (carruseles del
// home, "también te puede interesar", tarjetas de colección) — mismo look
// que ya usaba components/catalog/catalog-product-card.tsx, extraído acá
// para no repetir la lógica de toggle/estado en cada carrusel que lo
// necesite. Siempre va dentro de un <Link> que cubre toda la tarjeta, por
// eso frena la propagación del click además del navegate por defecto.
export function WishlistHeartButton({
  productId,
  className = "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm",
}: {
  productId: string;
  className?: string;
}) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(productId);

  return (
    <motion.button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle(productId);
      }}
      whileTap={{ scale: 0.8 }}
      aria-label={saved ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={saved}
      className={className}
    >
      <motion.span
        key={saved ? "saved" : "unsaved"}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="flex"
      >
        {saved ? (
          <HeartSolid className="h-4 w-4 text-red-500" />
        ) : (
          <HeartOutline className="h-4 w-4" />
        )}
      </motion.span>
    </motion.button>
  );
}
