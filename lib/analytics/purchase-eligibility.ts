// Fase 0 de analytics: todavía no existe ningún envío real de eventos
// (GA4/Meta CAPI) -- esto es solo el criterio, listo para que la próxima
// fase lo use así:
//
//   if (isEligibleForMarketingPurchaseEvent(order)) {
//     // enviar Purchase a GA4 / Meta CAPI
//   }
//
// order.marketingExclusionReason ya viaja heredado desde Payment (ver
// createOrderForPayment, lib/orders/order-creation-core.ts) para cualquier
// pedido nuevo. null = compra elegible para marketing/CAC/ROAS.
export function isEligibleForMarketingPurchaseEvent(order: {
  marketingExclusionReason?: string | null;
}): boolean {
  return (order.marketingExclusionReason ?? null) === null;
}
