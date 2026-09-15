import {
  applyWompiWebhookUpdateAction,
  cancelPaymentAction,
  confirmPaymentAction,
  createVerifiedPaymentIntentAction,
  createVerifiedWhatsappIntentAction,
  getWompiAcceptanceInfoAction,
  linkPaymentToOrderAction,
} from "./payments-actions";

// Adaptador Prisma/Postgres (Sprint 12). applyWompiWebhookUpdate se agrega
// en el Sprint 16, consumido solo por app/api/webhooks/wompi/route.ts.
// getWompiAcceptanceInfo se agrega en el Sprint 27 para los checkboxes de
// aceptación de contratos. Auditoría de seguridad (Sprint 29):
// createIntent/createWhatsappIntent dejaron de existir — el checkout ya no
// puede pedir un intent con un monto propio, solo createVerifiedIntent/
// createVerifiedWhatsappIntent, que recalculan el total server-side a
// partir de los productos del carrito (ver lib/checkout/server-order-totals.ts).
export const paymentsRepository = {
  createVerifiedIntent: createVerifiedPaymentIntentAction,
  createVerifiedWhatsappIntent: createVerifiedWhatsappIntentAction,
  confirmPayment: confirmPaymentAction,
  cancel: cancelPaymentAction,
  linkToOrder: linkPaymentToOrderAction,
  applyWompiWebhookUpdate: applyWompiWebhookUpdateAction,
  getWompiAcceptanceInfo: getWompiAcceptanceInfoAction,
};
