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
import { cartStorage } from "lib/cart/storage-adapter";
import type { CartLine } from "lib/cart/types";
import { getProductById, type PlaceholderProduct } from "lib/placeholder-data";

export type EnrichedCartLine = CartLine & {
  product: PlaceholderProduct;
};

type CartContextValue = {
  lines: EnrichedCartLine[];
  totalQuantity: number;
  totalAmount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    product: PlaceholderProduct,
    size: string,
    quantity?: number,
  ) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Carrito persistido en localStorage mientras no haya checkout real (Shopify)
// ni backend propio. Sigue el mismo patrón Context + Adaptador que la wishlist
// (ver docs/ARCHITECTURE.md): los datos de producto (nombre, imagen, precio) se
// resuelven en vivo desde el catálogo, no se guardan en el carrito.
export function LocalCartProvider({ children }: { children: ReactNode }) {
  const [rawLines, setRawLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    cartStorage.getAll().then(setRawLines);
  }, []);

  const addItem = useCallback(
    async (product: PlaceholderProduct, size: string, quantity = 1) => {
      const lineId = `${product.id}-${size}`;
      setRawLines((prev) => {
        const existing = prev.find((line) => line.id === lineId);
        const next = existing
          ? prev.map((line) =>
              line.id === lineId
                ? { ...line, quantity: line.quantity + quantity }
                : line,
            )
          : [
              ...prev,
              {
                id: lineId,
                productId: product.id,
                size,
                quantity,
                createdAt: new Date().toISOString(),
              },
            ];
        void cartStorage.save(next);
        return next;
      });
      setIsOpen(true);
    },
    [],
  );

  const removeItem = useCallback(async (lineId: string) => {
    setRawLines((prev) => {
      const next = prev.filter((line) => line.id !== lineId);
      void cartStorage.save(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    setRawLines((prev) => {
      const next =
        quantity <= 0
          ? prev.filter((line) => line.id !== lineId)
          : prev.map((line) =>
              line.id === lineId ? { ...line, quantity } : line,
            );
      void cartStorage.save(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(async () => {
    setRawLines([]);
    void cartStorage.save([]);
  }, []);

  const lines = useMemo<EnrichedCartLine[]>(
    () =>
      rawLines
        .map((line) => {
          const product = getProductById(line.productId);
          return product ? { ...line, product } : null;
        })
        .filter((line): line is EnrichedCartLine => line !== null),
    [rawLines],
  );

  const totalQuantity = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );
  const totalAmount = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + line.product.priceValue * line.quantity,
        0,
      ),
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      totalQuantity,
      totalAmount,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      lines,
      totalQuantity,
      totalAmount,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useLocalCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useLocalCart must be used within a LocalCartProvider");
  }
  return context;
}
