"use client";

import { useEffect, useRef } from "react";
import { registerProductViewAction } from "lib/catalog/view-actions";

// Dispara el registro de vista una sola vez al montar la ficha de
// producto — no renderiza nada. La deduplicación real (máx. una vista por
// visitante en 12h) vive en la cookie que fija la Server Action, no acá;
// el ref solo evita el doble disparo de React StrictMode/dev.
export function ViewTracker({ productId }: { productId: string }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void registerProductViewAction(productId);
  }, [productId]);

  return null;
}
