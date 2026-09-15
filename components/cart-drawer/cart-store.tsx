"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cartStorage } from "lib/cart/storage-adapter";
import type { CartLine } from "lib/cart/types";
import { catalogRepository } from "lib/catalog/catalog-repository";
import type { PlaceholderProduct } from "lib/placeholder-data";

export type EnrichedCartLine = CartLine & {
  product: PlaceholderProduct;
};

type CartContextValue = {
  lines: EnrichedCartLine[];
  totalQuantity: number;
  totalAmount: number;
  isOpen: boolean;
  isLoading: boolean;
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
  reload: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Carrito persistido en localStorage: solo guarda productId/size/quantity
// (lib/cart/types.ts), nunca nombre/precio/imagen. Los datos vigentes se
// resuelven en vivo contra Postgres (lib/catalog/catalog-repository.ts) cada
// vez que cambian las líneas guardadas.
//
// Antes de este fix la resolución usaba getProductById() de
// lib/placeholder-data.ts (catálogo de demo de ~20 productos del Sprint
// 1-4): cualquier producto real creado desde el panel (Sprint 12+) tiene un
// id que no existe ahí, así que quedaba guardado en localStorage (el
// contador subía) pero no aparecía nunca en el carrito — la causa raíz del
// bug de "carrito vacío" / "el contador cambia pero no hay líneas".
export function LocalCartProvider({ children }: { children: ReactNode }) {
  const [rawLines, setRawLines] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Record<string, PlaceholderProduct>>(
    {},
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    cartStorage.getAll().then(setRawLines);
  }, []);

  // Vuelve a pedir el carrito al servidor — se llama desde auth-store.tsx
  // después de iniciar/cerrar sesión, porque el carrito que corresponde
  // leer cambia (el de la cuenta vs. el de invitado) y el merge en el login
  // ya pasó server-side antes de que esto se llame.
  const reload = useCallback(async () => {
    setRawLines(await cartStorage.getAll());
  }, []);

  // Reconciliación: por cada set distinto de productIds guardados, trae el
  // estado actual desde Postgres. `requestIdRef` descarta respuestas viejas
  // si el usuario agrega/quita líneas antes de que la consulta anterior
  // vuelva (evita que una carga asíncrona vieja pise el estado más nuevo).
  useEffect(() => {
    const ids = Array.from(new Set(rawLines.map((line) => line.productId)));
    if (ids.length === 0) {
      setProducts({});
      setIsLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    catalogRepository.getByIds(ids).then((found) => {
      if (requestId !== requestIdRef.current) return;
      setProducts((prev) => {
        const next = { ...prev };
        for (const product of found) next[product.id] = product;
        return next;
      });
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawLines.map((line) => line.productId).join(",")]);

  // Auto-limpieza: una línea guardada que ya no resuelve a ningún producto
  // (eliminado desde el panel) se retira sola en vez de romper el resto del
  // carrito o quedar invisible para siempre.
  //
  // El guardado (cartStorage.save, una Server Action) siempre va DESPUÉS de
  // setRawLines, nunca adentro del actualizador que se le pasa — un
  // actualizador de setState tiene que ser puro (React puede invocarlo más
  // de una vez), y llamar ahí una Server Action producía en la consola
  // "Cannot update a component (Router) while rendering a different
  // component (LocalCartProvider)" en cada agregar/quitar/actualizar
  // cantidad — nunca rompía el guardado en sí, pero sí ensuciaba la
  // consola (mismo fix que components/wishlist/wishlist-store.tsx).
  useEffect(() => {
    if (isLoading || rawLines.length === 0) return;
    const invalidIds = rawLines
      .filter((line) => !products[line.productId])
      .map((line) => line.id);
    if (invalidIds.length === 0) return;
    const next = rawLines.filter((line) => !invalidIds.includes(line.id));
    setRawLines(next);
    void cartStorage.save(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, products, rawLines]);

  const addItem = useCallback(
    async (product: PlaceholderProduct, size: string, quantity = 1) => {
      const lineId = `${product.id}-${size}`;
      // Estado optimista: el producto ya se conoce (viene de la ficha/quick
      // view que el usuario tiene abierta), así que se muestra de inmediato
      // sin esperar el round-trip de reconciliación.
      setProducts((prev) => ({ ...prev, [product.id]: product }));
      const existing = rawLines.find((line) => line.id === lineId);
      const next = existing
        ? rawLines.map((line) =>
            line.id === lineId
              ? { ...line, quantity: line.quantity + quantity }
              : line,
          )
        : [
            ...rawLines,
            {
              id: lineId,
              productId: product.id,
              size,
              quantity,
              createdAt: new Date().toISOString(),
            },
          ];
      setRawLines(next);
      void cartStorage.save(next);
      setIsOpen(true);
    },
    [rawLines],
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      const next = rawLines.filter((line) => line.id !== lineId);
      setRawLines(next);
      void cartStorage.save(next);
    },
    [rawLines],
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      const next =
        quantity <= 0
          ? rawLines.filter((line) => line.id !== lineId)
          : rawLines.map((line) =>
              line.id === lineId ? { ...line, quantity } : line,
            );
      setRawLines(next);
      void cartStorage.save(next);
    },
    [rawLines],
  );

  const clearCart = useCallback(async () => {
    setRawLines([]);
    void cartStorage.save([]);
  }, []);

  const lines = useMemo<EnrichedCartLine[]>(
    () =>
      rawLines
        .map((line) => {
          const product = products[line.productId];
          return product ? { ...line, product } : null;
        })
        .filter((line): line is EnrichedCartLine => line !== null),
    [rawLines, products],
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
      isLoading,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      reload,
    }),
    [
      lines,
      totalQuantity,
      totalAmount,
      isOpen,
      isLoading,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      reload,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Ver el mismo comentario en components/wishlist/wishlist-store.tsx: antes
// esto lanzaba una excepción y tumbaba toda la página (pantalla "Ha
// ocurrido un error") ante un desajuste transitorio del Context — típico
// de Fast Refresh en desarrollo, imposible en producción — por algo que en
// la práctica solo afecta el ícono/drawer del carrito. Degrada a un
// carrito vacío e inerte en vez de romper el sitio entero.
const FALLBACK_CART: CartContextValue = {
  lines: [],
  totalQuantity: 0,
  totalAmount: 0,
  isOpen: false,
  isLoading: false,
  openCart: () => {},
  closeCart: () => {},
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  reload: async () => {},
};

export function useLocalCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "useLocalCart: CartContext no disponible (probablemente un Fast Refresh a mitad de carga) — usando un carrito vacío como reserva en vez de tumbar la página.",
      );
    }
    return FALLBACK_CART;
  }
  return context;
}
