// event_id determinístico para deduplicación de Purchase (Fase 2A, secciones
// 19-20 del proceso). Función PURA: dado el mismo order.id, siempre
// devuelve el mismo string -- browser Pixel y server CAPI lo calculan cada
// uno por su cuenta con esta misma función (nunca se pasa de uno a otro por
// la red) y llegan al mismo valor, así Meta puede deduplicar. Una recarga
// de la página de confirmación recalcula el MISMO id, nunca uno nuevo.
export function buildPurchaseEventId(orderId: string): string {
  return `purchase:${orderId}`;
}

// GA4 no usa event_id para Purchase -- su mecanismo de dedup es
// transaction_id (ver lib/analytics/product-payload.ts / decisión
// documentada en order-confirmation). Este helper solo formaliza cuál
// campo de Order es la fuente de verdad para transaction_id, para que
// ningún call site tenga que decidirlo por su cuenta.
export function buildGa4TransactionId(orderNumber: number): string {
  return String(orderNumber);
}
