export type PaymentProvider = "stripe" | "wompi" | "whatsapp";

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

// Tokens de aceptación de Wompi (Sprint 27) — la ley colombiana de Habeas
// Data exige mostrarle al cliente los contratos reales (política de
// privacidad y, si el comercio lo tiene configurado, autorización de datos
// personales) y solo enviar la transacción si los aceptó explícitamente.
// Se obtienen en vivo desde la API de Wompi (nunca se inventan acá) — ver
// fetchWompiAcceptanceInfo en providers/wompi-gateway.ts.
export type WompiAcceptanceTokens = {
  acceptanceToken: string;
  personalAuthToken?: string;
};

// Contrato que implementa cada pasarela (lib/payments/providers/*). La UI y
// payments-repository.ts solo conocen esta forma — nunca el SDK real de
// Stripe/Wompi directamente. Reemplazar un adaptador simulado por el SDK
// real (Payment Intents API de Stripe, API de transacciones de Wompi) no
// requiere tocar nada fuera de providers/ (ver docs/ARCHITECTURE.md).
export type PaymentGateway = {
  provider: PaymentProvider;
  createIntent(amount: number, currency: string): Promise<PaymentIntent>;
  // customerEmail es opcional y lo ignoran los adaptadores que no lo
  // necesitan (Stripe simulado); la API real de Wompi (Sprint 16) sí lo
  // exige para crear la transacción. Para checkout de invitado (sin email
  // en el formulario todavía) el adaptador de Wompi usa un valor por
  // defecto — ver providers/wompi-gateway.ts. wompiAcceptance lo ignoran
  // los adaptadores que no lo necesitan; Wompi lo exige (ver arriba).
  confirmPayment(
    intent: PaymentIntent,
    card: CardInput,
    customerEmail?: string,
    wompiAcceptance?: WompiAcceptanceTokens,
  ): Promise<PaymentIntent>;
};
