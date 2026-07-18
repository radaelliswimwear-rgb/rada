import { ACTIVE_PAYMENT_PROVIDER } from "./config";
import { stripeGateway } from "./providers/stripe-gateway";
import { wompiGateway } from "./providers/wompi-gateway";
import type { PaymentGateway, PaymentProvider } from "./types";

// "whatsapp" nunca se resuelve por acá: el checkout coordina el pago manual
// por WhatsApp llamando directo a payments-repository.createWhatsappIntent,
// sin pasar por este gateway. Este stub solo existe para que el Record
// tipado abajo compile — no se invoca en ningún flujo real.
const whatsappGateway: PaymentGateway = {
  provider: "whatsapp",
  createIntent() {
    throw new Error("whatsappGateway no debe invocarse directamente.");
  },
  confirmPayment() {
    throw new Error("whatsappGateway no debe invocarse directamente.");
  },
};

const GATEWAYS: Record<PaymentProvider, PaymentGateway> = {
  stripe: stripeGateway,
  wompi: wompiGateway,
  whatsapp: whatsappGateway,
};

// Único punto de entrada que usa payments-repository.ts. Cambiar de
// pasarela es cambiar ACTIVE_PAYMENT_PROVIDER (o, en producción, la
// variable de entorno que la fija) — nada en components/checkout necesita
// saber cuál está activa.
export const paymentGateway: PaymentGateway = GATEWAYS[ACTIVE_PAYMENT_PROVIDER];
