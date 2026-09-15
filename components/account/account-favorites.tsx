"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { QuickViewModal } from "components/catalog/quick-view-modal";
import { useFavoriteProducts } from "components/wishlist/use-favorite-products";
import { WishlistItemCard } from "components/wishlist/wishlist-item-card";
import type { PlaceholderProduct } from "lib/placeholder-data";

// Misma fuente de datos que la página pública /favoritos
// (components/wishlist/wishlist-page.tsx: mismo hook, misma tarjeta) — acá
// solo cambia el contenedor (AccountShell, con el menú de "Mi cuenta" al
// costado) para que la clienta también las encuentre sin salir de su
// cuenta.
export function AccountFavorites() {
  const { favoriteProducts, isLoading } = useFavoriteProducts();
  const [quickViewProduct, setQuickViewProduct] =
    useState<PlaceholderProduct | null>(null);

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Cargando favoritos...</p>;
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
        <HeartIcon className="h-7 w-7 text-neutral-400" />
        <p className="text-sm text-neutral-500">
          Todavía no guardaste ningún favorito.
        </p>
        <Link
          href="/#categorias"
          className="mt-2 text-xs font-medium text-brand-crimson underline-offset-4 hover:underline"
        >
          Explorar colección
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {favoriteProducts.map((product) => (
          <WishlistItemCard
            key={product.id}
            product={product}
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}
