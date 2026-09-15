"use client";

import { useEffect, useState } from "react";
import { catalogRepository } from "lib/catalog/catalog-repository";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { useWishlist } from "./wishlist-store";

// Compartido por /favoritos (components/wishlist/wishlist-page.tsx) y
// /cuenta/favoritos (components/account/account-favorites.tsx) — la
// wishlist solo guarda productId (ver wishlist-store.tsx), así que ambas
// pantallas necesitan resolverlos contra el catálogo real en vivo (foto,
// color, precio con descuento activo, stock) de la misma manera.
export function useFavoriteProducts() {
  const { items } = useWishlist();
  const [favoriteProducts, setFavoriteProducts] = useState<
    PlaceholderProduct[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ids = items.map((item) => item.productId);
    if (ids.length === 0) {
      setFavoriteProducts([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    catalogRepository.getByIds(ids).then((found) => {
      if (cancelled) return;
      const byId = new Map(found.map((product) => [product.id, product]));
      setFavoriteProducts(
        items
          .map((item) => byId.get(item.productId))
          .filter((product): product is PlaceholderProduct => Boolean(product)),
      );
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  return { favoriteProducts, isLoading };
}
