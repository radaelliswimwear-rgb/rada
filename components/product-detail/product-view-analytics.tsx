"use client";

import { useEffect, useRef } from "react";
import { track } from "lib/analytics/client/track";
import { buildProductPayload } from "lib/analytics/product-payload";
import type { AnalyticsProductPayload } from "lib/analytics/types";

// Fase 2A de analytics (sección 8): view_item, DISTINTO de ViewTracker
// (registerProductViewAction, Product.realViews) -- ese contador es un
// dato de negocio propio ya existente y no se toca acá (sección 8 del
// proceso lo pide explícito). Mismo patrón mount-once que ViewTracker: una
// vista lógica por navegación relevante, nunca por re-render.
export function ProductViewAnalytics({
  product,
}: {
  product: Omit<Parameters<typeof buildProductPayload>[0], "quantity">;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const payload: AnalyticsProductPayload = buildProductPayload(product);
    track({ name: "view_item", products: [payload], value: payload.price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return null;
}
