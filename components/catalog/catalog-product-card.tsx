"use client";

import { EyeIcon, HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { useWishlist } from "components/wishlist/wishlist-store";

export function CatalogProductCard({
  product,
  index,
  onQuickView,
}: {
  product: PlaceholderProduct;
  index: number;
  onQuickView: (product: PlaceholderProduct) => void;
}) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product.id);
  const secondImage = product.images[1] ?? product.images[0]!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: "easeOut" }}
      className="group"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 shadow-sm transition-shadow duration-300 group-hover:shadow-lg dark:bg-neutral-900">
        <Link
          href={`/producto/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 block"
        >
          <Image
            src={product.images[0]!}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-0"
          />
          <Image
            src={secondImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
          />
        </Link>

        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-wide text-black dark:bg-black/80 dark:text-white">
          {product.category}
        </span>

        <motion.button
          type="button"
          onClick={() => toggle(product.id)}
          whileTap={{ scale: 0.8 }}
          aria-label={saved ? "Quitar de favoritos" : "Añadir a favoritos"}
          aria-pressed={saved}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black shadow-sm dark:bg-black/80 dark:text-white"
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

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 justify-center gap-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onQuickView(product);
            }}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-black shadow-md transition-transform duration-200 hover:scale-105 dark:bg-neutral-900 dark:text-white"
          >
            <EyeIcon className="h-3.5 w-3.5" />
            Vista rápida
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-sm text-neutral-800 dark:text-neutral-200">
          {product.name}
        </h3>
        <span className="whitespace-nowrap text-sm font-medium text-black dark:text-white">
          {product.price} €
        </span>
      </div>
    </motion.div>
  );
}
