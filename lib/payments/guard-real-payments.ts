import { ACTIVE_PAYMENT_PROVIDER, IS_SIMULATED_PROVIDER } from "lib/payments/config";

// SOLO SERVIDOR — igual que lib/auth/password.ts, nunca debe importarse
// desde un componente "use client". No se agregó el paquete "server-only"
// (haría falta instalarlo, fuera del alcance de este cambio) — la
// garantía real es que el único importador es payments-actions.ts, que
// tiene "use server" al principio del archivo.
//
// Este es el punto de verificación real: se llama explícitamente al
// principio de cada Server Action que efectivamente mueve o confirma un
// pago (ver payments-actions.ts), no se confía en que evaluar config.ts
// alguna vez "de casualidad" alcance para bloquear algo.
//
// Requiere una bandera EXPLÍCITA (PAYMENTS_TEST_MODE=true), no una
// detección de entorno: chequear solo VERCEL_ENV=="production" dejaría
// pasar el simulado en cualquier despliegue público que no sea la
// Production de Vercel (un despliegue en otro proveedor, o uno donde esa
// variable no llegue a estar seteada por el motivo que sea) — el
// simulado nunca debería ser el comportamiento por defecto de un
// despliegue accesible públicamente, tiene que declararse a propósito.
export function assertRealPaymentConfigOrThrow(): void {
  if (!IS_SIMULATED_PROVIDER[ACTIVE_PAYMENT_PROVIDER]) return;

  if (process.env.PAYMENTS_TEST_MODE === "true") return;

  // Pagos deshabilitados por configuración inválida — esto es distinto de
  // "Wompi en modo sandbox" (NEXT_PUBLIC_WOMPI_SANDBOX=true): sandbox es
  // Wompi real, contra su propio entorno de pruebas, con validaciones
  // reales de firma/monto/moneda. Este error es "no hay ningún proveedor
  // real configurado en absoluto" — no se resuelve activando ninguna
  // clave real, se resuelve completando NEXT_PUBLIC_PAYMENT_PROVIDER=wompi
  // (con o sin sandbox) o declarando PAYMENTS_TEST_MODE=true a propósito.
  throw new Error(
    `Pagos deshabilitados: el proveedor activo ("${ACTIVE_PAYMENT_PROVIDER}") es SIMULADO y ` +
      "PAYMENTS_TEST_MODE no está en \"true\". Un proveedor simulado nunca cobra ni verifica dinero " +
      "real. Configurá NEXT_PUBLIC_PAYMENT_PROVIDER=wompi para aceptar pagos reales, o declará " +
      "PAYMENTS_TEST_MODE=true si este es un entorno de pruebas a propósito.",
  );
}
