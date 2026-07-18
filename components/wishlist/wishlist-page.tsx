"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CatalogGrid } from "components/catalog/catalog-grid";
import { catalogRepository } from "lib/catalog/catalog-repository";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { useWishlist } from "./wishlist-store";

export function WishlistPage() {
  const { items } = useWishlist();
  const [favoriteProducts, setFavoriteProducts] = useState<
    PlaceholderProduct[]
  >([]);

  // Igual que el carrito (components/cart-drawer/cart-store.tsx): favoritos
  // solo guarda productId, y los datos se resuelven en vivo contra el
  // catálogo real — antes resolvía contra el catálogo de demo hardcodeado
  // (lib/placeholder-data.ts), por lo que un producto real guardado como
  // favorito nunca aparecía acá.
  useEffect(() => {
    const ids = items.map((item) => item.productId);
    if (ids.length === 0) {
      setFavoriteProducts([]);
      return;
    }
    let cancelled = false;
    catalogRepository.getByIds(ids).then((found) => {
      if (cancelled) return;
      const byId = new Map(found.map((product) => [product.id, product]));
      setFavoriteProducts(
        items
          .map((item) => byId.get(item.productId))
          .filter((product): product is PlaceholderProduct => Boolean(product)),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <nav aria-label="Miga de pan" className="mb-6 text-xs text-neutral-500">
        <Link href="/" className="hover:text-brand-crimson">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">
          Favoritos
        </span>
      </nav>

      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Tu selección
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Favoritos
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {favoriteProducts.length}{" "}
          {favoriteProducts.length === 1 ? "producto guardado" : "productos guardados"}
        </p>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 text-center">
          <HeartIcon className="h-8 w-8 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-700">
            Tu lista de favoritos está vacía.
          </p>
          <p className="max-w-xs text-xs text-neutral-500">
            Guardá las prendas que más te gusten tocando el corazón en
            cualquier producto.
          </p>
          <Link
            href="/#categorias"
            className="mt-4 rounded-full bg-brand-coral px-6 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors duration-200 hover:bg-brand-crimson"
          >
            Explorar colección
          </Link>
        </div>
      ) : (
        <CatalogGrid products={favoriteProducts} columns={3} />
      )}
    </div>
  );
}
