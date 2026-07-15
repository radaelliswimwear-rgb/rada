"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { wishlistStorage } from "lib/wishlist/storage-adapter";
import type { WishlistItem } from "lib/wishlist/types";

type WishlistContextValue = {
  items: WishlistItem[];
  isSaved: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggle: (productId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined,
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    wishlistStorage.getAll().then(setItems);
  }, []);

  const addToWishlist = useCallback(async (productId: string) => {
    setItems((prev) => {
      if (prev.some((item) => item.productId === productId)) return prev;
      const next = [...prev, { productId, createdAt: new Date().toISOString() }];
      void wishlistStorage.save(next);
      return next;
    });
  }, []);

  const removeFromWishlist = useCallback(async (productId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.productId !== productId);
      void wishlistStorage.save(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items],
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (isSaved(productId)) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    },
    [isSaved, addToWishlist, removeFromWishlist],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ items, isSaved, addToWishlist, removeFromWishlist, toggle }),
    [items, isSaved, addToWishlist, removeFromWishlist, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
