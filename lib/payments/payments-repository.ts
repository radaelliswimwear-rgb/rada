import {
  applyWompiWebhookUpdateAction,
  cancelPaymentAction,
  confirmPaymentAction,
  createPaymentIntentAction,
  createWhatsappPaymentAction,
  getPaymentByIdAction,
  linkPaymentToOrderAction,
} from "./payments-actions";

// Adaptador Prisma/Postgres (Sprint 12). Mismo contrato público que antes
// (Sprint 11, localStorage) — components/checkout/checkout-content.tsx no
// cambia. applyWompiWebhookUpdate se agrega en el Sprint 16, consumido solo
// por app/api/webhooks/wompi/route.ts.
export const paymentsRepository = {
  createIntent: createPaymentIntentAction,
  createWhatsappIntent: createWhatsappPaymentAction,
  confirmPayment: confirmPaymentAction,
  cancel: cancelPaymentAction,
  linkToOrder: linkPaymentToOrderAction,
  getById: getPaymentByIdAction,
  applyWompiWebhookUpdate: applyWompiWebhookUpdateAction,
};
