import { simulateLatency } from "../simulate-latency";
import type { PaymentGateway } from "../types";

// Adaptador simulado de Stripe. Genera IDs con el mismo prefijo que usa la
// API real (`pi_`) y reacciona a los mismos números de tarjeta de prueba
// que documenta Stripe (https://stripe.com/docs/testing), para que la demo
// se sienta realista. Reemplazable por `stripe` (SDK real + Payment
// Intents API) sin tocar payments-repository.ts ni la UI — misma firma
// (ver docs/ARCHITECTURE.md).
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

const DECLINE_REASONS: Record<string, string> = {
  "4000000000000002": "Tarjeta rechazada por el emisor.",
  "4000000000009995": "Fondos insuficientes.",
};

export const stripeGateway: PaymentGateway = {
  provider: "stripe",

  async createIntent(amount, currency) {
    return {
      id: generateId("pi"),
      provider: "stripe",
      amount,
      currency,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  },

  async confirmPayment(intent, card, _customerEmail, _wompiAcceptance) {
    await simulateLatency();
    const digits = card.cardNumber.replace(/\s/g, "");
    const declineReason = DECLINE_REASONS[digits];
    if (declineReason) {
      return { ...intent, status: "failed", failureReason: declineReason };
    }
    return { ...intent, status: "succeeded" };
  },
};
