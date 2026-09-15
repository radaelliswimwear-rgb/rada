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
  reload: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined,
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    wishlistStorage.getAll().then(setItems);
  }, []);

  // Vuelve a pedir la wishlist al servidor — se llama desde auth-store.tsx
  // después de iniciar/cerrar sesión, mismo motivo que reload() en
  // components/cart-drawer/cart-store.tsx.
  const reload = useCallback(async () => {
    setItems(await wishlistStorage.getAll());
  }, []);

  // El guardado (wishlistStorage.save, una Server Action) va DESPUÉS de
  // setItems, nunca adentro del actualizador que se le pasa — un
  // actualizador de setState tiene que ser puro (React puede invocarlo más
  // de una vez), y llamar ahí una Server Action producía en la consola
  // "Cannot update a component (Router) while rendering a different
  // component (WishlistProvider)" seguido de un mismatch de hidratación en
  // cualquier otro componente con useId() en la misma página (ej. los
  // acordeones de la ficha de producto) — nunca rompía el guardado en sí,
  // pero sí ensuciaba la consola en cada click al corazón.
  const addToWishlist = useCallback(
    async (productId: string) => {
      if (items.some((item) => item.productId === productId)) return;
      const next = [...items, { productId, createdAt: new Date().toISOString() }];
      setItems(next);
      void wishlistStorage.save(next);
    },
    [items],
  );

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      const next = items.filter((item) => item.productId !== productId);
      setItems(next);
      void wishlistStorage.save(next);
    },
    [items],
  );

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
    () => ({ items, isSaved, addToWishlist, removeFromWishlist, toggle, reload }),
    [items, isSaved, addToWishlist, removeFromWishlist, toggle, reload],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

// Valor de reserva cuando el contexto no está disponible. Antes esto
// lanzaba una excepción ("useWishlist must be used within a
// WishlistProvider"), que la app SIEMPRE envuelve en <WishlistProvider>
// (ver app/layout.tsx) — pero en desarrollo, Turbopack Fast Refresh puede
// dejar viva por un instante una copia vieja del módulo que define este
// Context mientras se recarga en caliente un archivo que lo importa
// (problema conocido, no un bug de la app en sí: en producción no hay
// Fast Refresh, así que no puede pasar ahí). El error se propagaba hasta
// tumbar toda la página con la pantalla "Ha ocurrido un error" por algo
// que en la práctica solo afecta el corazón de favoritos. Ahora degrada
// sin romper nada: la lista de favoritos queda vacía y los botones no
// hacen nada hasta que el contexto real vuelva a estar disponible (la
// próxima navegación ya lo resuelve), en vez de crashear el sitio entero.
const FALLBACK_WISHLIST: WishlistContextValue = {
  items: [],
  isSaved: () => false,
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  toggle: async () => {},
  reload: async () => {},
};

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "useWishlist: WishlistContext no disponible (probablemente un Fast Refresh a mitad de carga) — usando favoritos vacíos como reserva en vez de tumbar la página.",
      );
    }
    return FALLBACK_WISHLIST;
  }
  return context;
}
