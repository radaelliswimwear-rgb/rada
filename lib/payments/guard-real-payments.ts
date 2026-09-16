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
// DOS defensas independientes, a propósito — la primera vez que se
// escribió esto, PAYMENTS_TEST_MODE=true anulaba incluso una producción
// identificada, lo cual era una regresión real (un valor de prueba
// olvidado en Vercel habría dejado el simulado activo en producción de
// verdad). Ahora:
//
//   1. Si esto es una producción IDENTIFICADA (VERCEL_ENV=="production"),
//      el simulado nunca se permite, ni siquiera con PAYMENTS_TEST_MODE —
//      esa bandera no tiene forma de anular esta primera defensa.
//   2. En cualquier otro caso (preview, fuera de Vercel, VERCEL_ENV sin
//      definir), el simulado sigue prohibido por defecto — necesita la
//      bandera EXPLÍCITA PAYMENTS_TEST_MODE=true para permitirse. No
//      alcanza con "no ser production": el simulado nunca es el default
//      de ningún despliegue accesible públicamente, tiene que declararse
//      a propósito en cada entorno donde se necesite.
export function assertRealPaymentConfigOrThrow(): void {
  if (!IS_SIMULATED_PROVIDER[ACTIVE_PAYMENT_PROVIDER]) return;

  const esProduccionIdentificada = process.env.VERCEL_ENV === "production";
  if (esProduccionIdentificada) {
    throw new Error(
      `Pagos deshabilitados: el proveedor activo ("${ACTIVE_PAYMENT_PROVIDER}") es SIMULADO en ` +
        "producción identificada de Vercel (VERCEL_ENV=production). Esto nunca se permite acá, " +
        "ni siquiera con PAYMENTS_TEST_MODE=true. Configurá NEXT_PUBLIC_PAYMENT_PROVIDER=wompi con " +
        "credenciales reales antes de aceptar pagos en producción.",
    );
  }

  if (process.env.PAYMENTS_TEST_MODE === "true") return;

  // Pagos deshabilitados por configuración inválida — esto es distinto de
  // "Wompi en modo sandbox" (NEXT_PUBLIC_WOMPI_SANDBOX=true): sandbox es
  // Wompi real, contra su propio entorno de pruebas, con validaciones
  // reales de firma/monto/moneda. Este error es "no hay ningún proveedor
  // real configurado en absoluto" — no se resuelve activando ninguna
  // clave real, se resuelve completando NEXT_PUBLIC_PAYMENT_PROVIDER=wompi
  // (con o sin sandbox) o declarando PAYMENTS_TEST_MODE=true a propósito,
  // en un entorno que NO sea producción identificada.
  throw new Error(
    `Pagos deshabilitados: el proveedor activo ("${ACTIVE_PAYMENT_PROVIDER}") es SIMULADO y ` +
      "PAYMENTS_TEST_MODE no está en \"true\". Un proveedor simulado nunca cobra ni verifica dinero " +
      "real. Configurá NEXT_PUBLIC_PAYMENT_PROVIDER=wompi para aceptar pagos reales, o declará " +
      "PAYMENTS_TEST_MODE=true si este es un entorno de pruebas aislado a propósito.",
  );
}
