"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { DiscountedMoney } from "components/currency/discounted-money";
import { STATUS_LABELS, stockStatus } from "components/product-detail/product-meta";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { useWishlist } from "./wishlist-store";

// Tarjeta dedicada para /favoritos y /cuenta/favoritos — a diferencia de
// CatalogProductCard (pensada para grillas de catálogo, con "Vista rápida"
// solo visible al hover), acá los tres botones van siempre visibles: en una
// lista de favoritos la clienta ya decidió el producto, así que "ver",
// "agregar al carrito" y "eliminar" tienen que estar a un toque, sobre todo
// en móvil donde no existe el hover.
const AVAILABILITY_STYLES: Record<string, string> = {
  available: "text-emerald-700",
  low: "text-amber-700",
  soldout: "text-red-600",
};

export function WishlistItemCard({
  product,
  onQuickView,
}: {
  product: PlaceholderProduct;
  onQuickView: (product: PlaceholderProduct) => void;
}) {
  const { removeFromWishlist } = useWishlist();
  const status = stockStatus(product.totalStock ?? 0);
  const soldOut = status === "soldout";

  return (
    <div className="flex gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <Link
        href={`/producto/${product.slug}`}
        className="relative h-28 w-24 flex-none overflow-hidden rounded-lg bg-brand-blush/20 sm:h-36 sm:w-28"
      >
        <Image
          src={product.images[0]!}
          alt={product.name}
          fill
          sizes="128px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/producto/${product.slug}`}
              className="text-sm font-medium text-neutral-900 hover:text-brand-crimson dark:text-white"
            >
              {product.name}
            </Link>
            {product.color ? (
              <p className="mt-0.5 text-xs text-neutral-500">
                Color: {product.color}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void removeFromWishlist(product.id)}
            aria-label="Eliminar de favoritos"
            className="flex-none rounded-full p-1.5 text-neutral-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
          <DiscountedMoney
            amountCop={product.priceValue}
            originalAmountCop={product.originalPriceValue ?? product.priceValue}
            discountPercent={product.activeDiscountPercent ?? 0}
          />
        </p>

        <p className={`mt-1 text-xs font-medium ${AVAILABILITY_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <Link
            href={`/producto/${product.slug}`}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson dark:border-neutral-700 dark:text-neutral-300"
          >
            Ver producto
          </Link>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onQuickView(product)}
            className="rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
          >
            {soldOut ? "Agotado" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}
