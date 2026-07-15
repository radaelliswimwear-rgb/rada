import {
  cancelPaymentAction,
  confirmPaymentAction,
  createPaymentIntentAction,
  getPaymentByIdAction,
  linkPaymentToOrderAction,
} from "./payments-actions";

// Adaptador Prisma/Postgres (Sprint 12). Mismo contrato público que antes
// (Sprint 11, localStorage) — components/checkout/checkout-content.tsx no
// cambia.
export const paymentsRepository = {
  createIntent: createPaymentIntentAction,
  confirmPayment: confirmPaymentAction,
  cancel: cancelPaymentAction,
  linkToOrder: linkPaymentToOrderAction,
  getById: getPaymentByIdAction,
};
