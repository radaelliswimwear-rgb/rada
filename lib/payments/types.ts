export type PaymentProvider = "stripe" | "wompi";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled";

export type PaymentIntent = {
  id: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  orderId?: string; // se completa recién cuando el pedido se crea (pago -> pedido, no al revés)
  createdAt: string;
  failureReason?: string;
};

export type CardInput = {
  cardholderName: string;
  cardNumber: string;
  expiry: string; // MM/AA
  cvc: string;
};

// Contrato que implementa cada pasarela (lib/payments/providers/*). La UI y
// payments-repository.ts solo conocen esta forma — nunca el SDK real de
// Stripe/Wompi directamente. Reemplazar un adaptador simulado por el SDK
// real (Payment Intents API de Stripe, API de transacciones de Wompi) no
// requiere tocar nada fuera de providers/ (ver docs/ARCHITECTURE.md).
export type PaymentGateway = {
  provider: PaymentProvider;
  createIntent(amount: number, currency: string): Promise<PaymentIntent>;
  confirmPayment(intent: PaymentIntent, card: CardInput): Promise<PaymentIntent>;
};
