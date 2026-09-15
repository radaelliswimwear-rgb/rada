import { validateCouponAction } from "./coupons-actions";

// incrementUsage ya no existe acá — el uso del cupón se incrementa de forma
// atómica y server-side dentro de createOrderAction (lib/orders/orders-actions.ts),
// nunca por una llamada aparte que el cliente podía omitir (auditoría de
// seguridad, Sprint 29).
export const couponsRepository = {
  validate: validateCouponAction,
};
