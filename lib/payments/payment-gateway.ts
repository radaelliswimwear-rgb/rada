import { ACTIVE_PAYMENT_PROVIDER } from "./config";
import { stripeGateway } from "./providers/stripe-gateway";
import { wompiGateway } from "./providers/wompi-gateway";
import type { PaymentGateway, PaymentProvider } from "./types";

const GATEWAYS: Record<PaymentProvider, PaymentGateway> = {
  stripe: stripeGateway,
  wompi: wompiGateway,
};

// Único punto de entrada que usa payments-repository.ts. Cambiar de
// pasarela es cambiar ACTIVE_PAYMENT_PROVIDER (o, en producción, la
// variable de entorno que la fija) — nada en components/checkout necesita
// saber cuál está activa.
export const paymentGateway: PaymentGateway = GATEWAYS[ACTIVE_PAYMENT_PROVIDER];
