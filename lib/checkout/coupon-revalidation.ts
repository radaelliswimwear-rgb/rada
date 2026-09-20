import type { CouponValidationResult } from "lib/coupons/types";

// Auditoría go-live (sep. 2026): decisión pura, extraída de
// components/checkout/checkout-content.tsx para poder testearla sin
// renderizar el componente (mismo criterio que
// components/cart-drawer/cart-store.compute-cart-display-status.test.ts) --
// qué hacer con un cupón ya aplicado cuando se lo revalida contra un
// subtotal nuevo (el carrito cambió sin salir de /checkout). El cupón
// congelaba su descuento en COP al aplicarse, así que un cambio de subtotal
// podía dejar el total mostrado desalineado de lo que reserveAndPriceCheckout
// termina cobrando server-side -- esto es lo que cierra esa brecha.
export type CouponRevalidationOutcome =
  | { action: "clear" }
  | { action: "update"; code: string; discount: number }
  | { action: "keep" };

export function resolveCouponRevalidationOutcome(
  current: { code: string; discount: number },
  result: CouponValidationResult,
): CouponRevalidationOutcome {
  if (!result.success) return { action: "clear" };
  if (result.discount !== current.discount) {
    return { action: "update", code: result.code, discount: result.discount };
  }
  return { action: "keep" };
}
