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

// Lógica pura de la auto-limpieza, separada del efecto para poder probarla
// sin renderizar el componente (el proyecto no tiene un harness de React
// Testing Library todavía). Solo puede señalar una línea como inválida
// cuando `resolvedRequestId` coincide con la consulta VIGENTE
// (`currentRequestId`) — nunca mientras esa consulta sigue en vuelo, falló,
// o corresponde a un conjunto de ids distinto del `rawLines` actual (ver
// bug de carrito, Sprint 31, y el efecto de reconciliación más abajo).
export function computeInvalidCartLineIds(params: {
  rawLines: CartLine[];
  products: Record<string, PlaceholderProduct>;
  resolvedRequestId: number | null;
  currentRequestId: number;
}): string[] {
  const { rawLines, products, resolvedRequestId, currentRequestId } = params;
  if (rawLines.length === 0 || resolvedRequestId !== currentRequestId) {
    return [];
  }
  return rawLines
    .filter((line) => !products[line.productId])
    .map((line) => line.id);
}

export type CartDisplayStatus = "loading" | "empty" | "ready";

// Único criterio de "¿qué mostrar?" para checkout-content.tsx y
// cart-drawer.tsx (bug de desincronización, Sprint 33): antes, cada
// consumidor comparaba `lines.length === 0` directamente, que también es
// cierto ANTES de que cartStorage.getAll() responda la primera vez -- en
// cada mount fresco del árbol de React (recarga completa, pestaña nueva,
// link externo a /checkout) un carrito con productos guardados se veía
// "vacío" durante la ventana entre el mount y esa respuesta. `isHydrated`
// (ver LocalCartProvider más abajo) es lo que distingue "todavía no sé" de
// "ya sé que no hay nada".
export function computeCartDisplayStatus(params: {
  isHydrated: boolean;
  lineCount: number;
}): CartDisplayStatus {
  if (!params.isHydrated) return "loading";
  return params.lineCount === 0 ? "empty" : "ready";
}

type CartContextValue = {
  lines: EnrichedCartLine[];
  totalQuantity: number;
  totalAmount: number;
  isOpen: boolean;
  isLoading: boolean;
  isHydrated: boolean;
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

// Carrito persistido en Postgres/Prisma (lib/cart/storage-adapter.ts, Sprint
// 12 -- el comentario decía "localStorage" porque así arrancó en el Sprint
// 8, pero el contrato público no cambió): solo guarda productId/size/quantity
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
  // Distinto de `isLoading` (que es sobre la reconciliación contra el
  // catálogo, más abajo): esto es sobre si la carga INICIAL desde
  // cartStorage.getAll() ya respondió al menos una vez en este mount. Sin
  // esto, `lines.length === 0` es indistinguible de "todavía no llegó la
  // respuesta" -- ver computeCartDisplayStatus arriba y el bug que resuelve.
  // No se resetea en `reload()` (login/logout): ese camino ya funcionaba
  // bien reemplazando `rawLines` directamente y no es lo que reportó el bug.
  const [isHydrated, setIsHydrated] = useState(false);
  const requestIdRef = useRef(0);
  // El id de la última consulta a catalogRepository.getByIds que terminó
  // con éxito Y todavía es la vigente (no una respuesta vieja). Auditoría
  // del bug de carrito (Sprint 31): antes, la limpieza de abajo se guiaba
  // por `isLoading === false`, pero ese booleano puede seguir en `false`
  // (el valor del render anterior) en el mismo commit de React en el que
  // el efecto de reconciliación recién llamó a setIsLoading(true) y arrancó
  // una consulta nueva — su actualización todavía no se refleja en la
  // clausura de un efecto ya en curso ese mismo commit. Con
  // `resolvedRequestId` la limpieza solo puede actuar cuando la respuesta
  // que tiene en mano corresponde EXACTAMENTE a la consulta vigente
  // (`requestIdRef.current`), nunca a una que sigue en vuelo.
  const [resolvedRequestId, setResolvedRequestId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    cartStorage.getAll().then((initialLines) => {
      setRawLines(initialLines);
      setIsHydrated(true);
    });
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
    catalogRepository.getByIds(ids).then((result) => {
      if (requestId !== requestIdRef.current) return; // respuesta vieja, no pisa la vigente
      setIsLoading(false);
      if (!result.ok) {
        // Falla transitoria del catálogo: no se toca `products` ni se marca
        // esta consulta como resuelta, así que la limpieza de abajo queda
        // bloqueada para este conjunto de ids — nunca se interpreta un
        // error como "producto inexistente". La próxima vez que cambie el
        // carrito (o se vuelva a montar la página) se reintenta solo.
        return;
      }
      setProducts((prev) => {
        const next = { ...prev };
        for (const product of result.products) next[product.id] = product;
        return next;
      });
      setResolvedRequestId(requestId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawLines.map((line) => line.productId).join(",")]);

  // Auto-limpieza: una línea guardada que ya no resuelve a ningún producto
  // (eliminado desde el panel) se retira sola en vez de romper el resto del
  // carrito o quedar invisible para siempre.
  //
  // Solo puede actuar cuando `resolvedRequestId` coincide con la consulta
  // VIGENTE (`requestIdRef.current`) — es decir, cuando ya existe una
  // respuesta exitosa y actual para el conjunto de ids de este mismo
  // `rawLines`, nunca mientras esa consulta sigue en vuelo, falló, o
  // corresponde a un conjunto de ids distinto (ver el efecto de arriba).
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
    const invalidIds = computeInvalidCartLineIds({
      rawLines,
      products,
      resolvedRequestId,
      currentRequestId: requestIdRef.current,
    });
    if (invalidIds.length === 0) return;
    const next = rawLines.filter((line) => !invalidIds.includes(line.id));
    setRawLines(next);
    void cartStorage.save(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRequestId, products, rawLines]);

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
      isHydrated,
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
      isHydrated,
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
  // `true`, no `false`: esto nunca va a pasar a tener un Provider real (no
  // hay una carga en curso que esperar), así que es un estado ya asentado,
  // no un "todavía cargando" -- computeCartDisplayStatus debe poder mostrar
  // "vacío" acá, no quedarse en "cargando" para siempre.
  isHydrated: true,
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
