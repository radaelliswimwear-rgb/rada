import { simulateLatency } from "../simulate-latency";
import type { PaymentGateway } from "../types";

// Adaptador simulado de Wompi. Mismo contrato que stripe-gateway.ts —
// intercambiables sin que la UI ni payments-repository.ts sepan cuál está
// activa (ver lib/payments/config.ts). Reemplazable por la API real de
// Wompi (transacciones + widget de checkout) sin tocar nada fuera de este
// archivo.
function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

const DECLINE_REASONS: Record<string, string> = {
  "4000000000000002": "Transacción rechazada por el emisor.",
  "4000000000009995": "Fondos insuficientes.",
};

export const wompiGateway: PaymentGateway = {
  provider: "wompi",

  async createIntent(amount, currency) {
    return {
      id: generateId("wompi-tx"),
      provider: "wompi",
      amount,
      currency,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  },

  async confirmPayment(intent, card) {
    await simulateLatency();
    const digits = card.cardNumber.replace(/\s/g, "");
    const declineReason = DECLINE_REASONS[digits];
    if (declineReason) {
      return { ...intent, status: "failed", failureReason: declineReason };
    }
    return { ...intent, status: "succeeded" };
  },
};
