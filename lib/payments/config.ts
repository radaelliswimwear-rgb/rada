import type { PaymentProvider } from "./types";

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

// Este archivo se comparte con el cliente — components/checkout/
// payment-form.tsx y order-confirmation.tsx ("use client") lo importan
// para textos de UI. CUALQUIER chequeo de seguridad puesto acá (por
// ejemplo, comparar contra VERCEL_ENV) se evalúa TAMBIÉN dentro del
// bundle del navegador, donde esa variable nunca está definida — confiar
// en esto como punto de aplicación real sería confiar en un detalle de
// bundling, no en una verificación real. Por eso este archivo solo valida
// FORMATO (que el valor configurado sea uno de los proveedores
// reconocidos); la decisión de "¿esto puede procesar dinero real?" se
// hace en lib/payments/guard-real-payments.ts, server-only, llamada
// explícitamente en el punto donde de verdad se ejecuta un pago.
const VALID_PROVIDERS: ReadonlySet<string> = new Set<PaymentProvider>([
  "stripe",
  "wompi",
  "whatsapp",
]);

function resolveActivePaymentProvider(): PaymentProvider {
  const raw = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;
  // undefined (variable ni siquiera definida) sí cae al default "stripe" —
  // pero un string vacío definido A PROPÓSITO ("") es una configuración
  // reconocible y se rechaza como cualquier otro valor inválido, no se
  // trata igual que "no está definida".
  const resolved = raw === undefined ? "stripe" : raw;

  if (!VALID_PROVIDERS.has(resolved)) {
    throw new Error(
      `NEXT_PUBLIC_PAYMENT_PROVIDER="${raw ?? ""}" no es un proveedor de pago válido ` +
        '(esperado: "stripe", "wompi" o "whatsapp"). Un valor desconocido o vacío no debe ' +
        "caer en silencio a ningún proveedor por defecto.",
    );
  }

  return resolved as PaymentProvider;
}

export const ACTIVE_PAYMENT_PROVIDER: PaymentProvider = resolveActivePaymentProvider();

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  stripe: "Stripe",
  wompi: "Wompi",
  whatsapp: "WhatsApp",
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
