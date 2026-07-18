import type { PaymentProvider } from "./types";

// En producción esto se fija con una variable de entorno según qué pasarela
// tenga credenciales configuradas (NEXT_PUBLIC_PAYMENT_PROVIDER=stripe|wompi).
// Hoy no hay backend que la sirva, así que cae al valor por defecto.
export const ACTIVE_PAYMENT_PROVIDER: PaymentProvider =
  (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER as PaymentProvider | undefined) ??
  "stripe";

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  stripe: "Stripe",
  wompi: "Wompi",
  whatsapp: "WhatsApp",
};
