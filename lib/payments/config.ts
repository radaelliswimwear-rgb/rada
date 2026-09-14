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

// stripe-gateway.ts sigue siendo un adaptador simulado (nunca llama a la
// API real de Stripe); wompi-gateway.ts, en cambio, sí llama a la API real
// de Wompi (sandbox o producción según WOMPI_BASE_URL) — el texto del
// formulario de pago (components/checkout/payment-form.tsx) no puede decir
// "pago simulado" ni "no se envían datos reales" cuando esto es true.
export const IS_SIMULATED_PROVIDER: Record<PaymentProvider, boolean> = {
  stripe: true,
  wompi: false,
  whatsapp: false,
};

// Con Wompi en modo sandbox (NEXT_PUBLIC_WOMPI_SANDBOX="true", ver
// .env.example) tiene sentido mostrar sus tarjetas de prueba — pero una vez
// se pase a llaves de producción, esta variable debe quitarse/ponerse en
// "false": mostrarle a una clienta real "probá esta tarjeta de prueba" en
// el checkout real sería un error grave, no solo un detalle estético.
const WOMPI_IS_SANDBOX = process.env.NEXT_PUBLIC_WOMPI_SANDBOX === "true";

// Tarjetas de prueba: cada pasarela documenta las suyas y no coinciden
// entre sí (ver docs.stripe.com/testing y docs.wompi.co/.../datos-de-prueba-en-sandbox) —
// mostrar las de Stripe cuando Wompi está activo confundía a quien probara
// el checkout, ya que Wompi las rechaza con estado ERROR.
export const PAYMENT_PROVIDER_TEST_CARDS_HINT: Record<PaymentProvider, string> = {
  stripe:
    "Probá 4242 4242 4242 4242 (éxito) o 4000 0000 0000 0002 (rechazo) — cualquier fecha futura y CVC.",
  wompi: WOMPI_IS_SANDBOX
    ? "Modo de pruebas Wompi — probá 4242 4242 4242 4242 (aprobada) o 4111 1111 1111 1111 (rechazada), cualquier fecha futura y CVC de 3 dígitos."
    : "",
  whatsapp: "",
};
