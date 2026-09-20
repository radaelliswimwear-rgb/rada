import {
  ACTIVE_PAYMENT_PROVIDER,
  IS_SIMULATED_PROVIDER,
} from "lib/payments/config";
import { requireAppEnvironment } from "lib/env/app-environment";
import { logEvent } from "lib/observability/log";

// Auditoría go-live (sep. 2026): las dos funciones de este archivo son el
// gate que corre ANTES de cualquier checkout real -- si alguna dispara en
// producción (drift de variables de entorno, rotación de llaves Wompi mal
// alineada), el 100% de los checkouts empieza a fallar de inmediato, pero
// hasta ahora eso no dejaba ningún rastro en SystemLog ni disparaba ninguna
// alerta -- la falla más severa posible del sistema de pagos era, a la
// vez, la menos visible. Ambas funciones son sync (se llaman como primera
// línea de Server Actions ya async, antes de cualquier otro trabajo) -- se
// dispara el logEvent en segundo plano (fire-and-forget, mismo criterio no
// bloqueante que el resto del código) justo antes de cada throw, nunca
// esperado, para no volver estas funciones async ni demorar el error real.
function logConfigGuardFailure(event: string, reason: string): void {
  logEvent({
    event,
    severity: "critical",
    reason: reason.slice(0, 200),
    dedupeKey: event,
    alert: true,
  }).catch(() => {});
}

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
// olvidado en el hosting habría dejado el simulado activo en producción
// de verdad). Ahora:
//
//   1. Si APP_ENVIRONMENT=="production", el simulado nunca se permite, ni
//      siquiera con PAYMENTS_TEST_MODE — esa bandera no tiene forma de
//      anular esta primera defensa. APP_ENVIRONMENT es una variable
//      propia del proyecto (no de ningún hosting específico) — ver
//      lib/env/app-environment.ts — así que esta defensa funciona igual
//      en Vercel, Railway, Render, Fly.io, AWS o cualquier otro Node host.
//   2. En cualquier otro caso (development, staging, test), el simulado
//      sigue prohibido por defecto — necesita la bandera EXPLÍCITA
//      PAYMENTS_TEST_MODE=true para permitirse. No alcanza con "no ser
//      production": el simulado nunca es el default de ningún entorno
//      accesible, tiene que declararse a propósito donde se necesite.
//
// Si APP_ENVIRONMENT no está definida en absoluto, esto lanza (fail
// closed) en vez de asumir "probablemente no es production" — una
// aplicación que ni siquiera sabe en qué entorno corre no debe poder
// decidir si un proveedor simulado es aceptable.
export function assertRealPaymentConfigOrThrow(): void {
  if (!IS_SIMULATED_PROVIDER[ACTIVE_PAYMENT_PROVIDER]) return;

  const appEnvironment = requireAppEnvironment(
    "si un proveedor de pago SIMULADO puede estar activo",
  );

  if (appEnvironment === "production") {
    const reason = `Proveedor activo ("${ACTIVE_PAYMENT_PROVIDER}") es SIMULADO en APP_ENVIRONMENT=production.`;
    logConfigGuardFailure("payment.config_guard_blocked_checkout", reason);
    throw new Error(
      `Pagos deshabilitados: el proveedor activo ("${ACTIVE_PAYMENT_PROVIDER}") es SIMULADO en ` +
        "APP_ENVIRONMENT=production. Esto nunca se permite acá, ni siquiera con " +
        "PAYMENTS_TEST_MODE=true. Configurá NEXT_PUBLIC_PAYMENT_PROVIDER=wompi con credenciales " +
        "reales antes de aceptar pagos en producción.",
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
  logConfigGuardFailure(
    "payment.config_guard_blocked_checkout",
    `Proveedor activo ("${ACTIVE_PAYMENT_PROVIDER}") es SIMULADO y PAYMENTS_TEST_MODE no está en "true".`,
  );
  throw new Error(
    `Pagos deshabilitados: el proveedor activo ("${ACTIVE_PAYMENT_PROVIDER}") es SIMULADO y ` +
      'PAYMENTS_TEST_MODE no está en "true". Un proveedor simulado nunca cobra ni verifica dinero ' +
      "real. Configurá NEXT_PUBLIC_PAYMENT_PROVIDER=wompi para aceptar pagos reales, o declará " +
      "PAYMENTS_TEST_MODE=true si este es un entorno de pruebas aislado a propósito.",
  );
}

// ============================================================================
// Hardening P2/P3 (sep. 2026) -- validación cruzada de configuración Wompi
// ============================================================================
// Hallazgo del backlog de la auditoría: nada verificaba que WOMPI_BASE_URL,
// las llaves (WOMPI_PUBLIC_KEY/PRIVATE_KEY) y NEXT_PUBLIC_WOMPI_SANDBOX
// apuntaran de verdad al MISMO entorno de Wompi. Una combinación cruzada
// (ej. llaves pub_prod_/prv_prod_ reales contra WOMPI_BASE_URL de sandbox,
// o NEXT_PUBLIC_WOMPI_SANDBOX="true" con llaves de producción reales)
// nunca falla de forma obvia: Wompi simplemente rechaza la llave contra el
// host equivocado con un error genérico, o -- el caso más peligroso -- deja
// el checkout mostrando "tarjeta de prueba" mientras cobra dinero real (o
// al revés, aceptando "pagos" que nunca fueron reales).
//
// Clasifica cada señal por su PREFIJO/HOST público -- nunca por el valor
// completo del secreto. El formato pub_test_/prv_test_ vs pub_prod_/prv_prod_
// es la propia convención pública de Wompi (documentada en .env.example de
// este repo, confirmada contra sus llaves reales) -- no es un dato sensible,
// es literalmente lo que el prefijo ya declara a cualquiera que vea la
// llave en el dashboard de Wompi.
type WompiEnvironmentSignal = "sandbox" | "production" | "unknown";

function classifyWompiBaseUrl(baseUrl: string): WompiEnvironmentSignal {
  if (baseUrl.includes("sandbox.wompi.co")) return "sandbox";
  if (baseUrl.includes("production.wompi.co")) return "production";
  // Host no reconocido (ej. un proxy/mirror propio) -- no se puede
  // clasificar con confianza, así que esta señal se descarta en vez de
  // arriesgar un falso positivo que bloquee una configuración legítima
  // pero fuera de lo esperado.
  return "unknown";
}

function classifyWompiKeyPrefix(key: string): WompiEnvironmentSignal {
  if (key.startsWith("pub_test_") || key.startsWith("prv_test_")) {
    return "sandbox";
  }
  if (key.startsWith("pub_prod_") || key.startsWith("prv_prod_")) {
    return "production";
  }
  return "unknown";
}

// Llamada desde wompi-gateway.ts (getCredentials()) -- el único punto por
// el que pasan TODAS las llamadas reales a la API de Wompi (crear intent,
// verificar transacción, tokens de aceptación), así que este chequeo corre
// antes de cualquier uso real de las credenciales, sin depender de
// instrumentar cada Server Action una por una.
export function assertWompiConfigConsistencyOrThrow(params: {
  baseUrl: string;
  publicKey: string;
  privateKey: string;
}): void {
  const baseUrlSignal = classifyWompiBaseUrl(params.baseUrl);
  const publicKeySignal = classifyWompiKeyPrefix(params.publicKey);
  const privateKeySignal = classifyWompiKeyPrefix(params.privateKey);

  const knownSignals = [
    baseUrlSignal,
    publicKeySignal,
    privateKeySignal,
  ].filter(
    (signal): signal is "sandbox" | "production" => signal !== "unknown",
  );
  const distinctKnown = new Set(knownSignals);

  if (distinctKnown.size > 1) {
    logConfigGuardFailure(
      "payment.wompi_config_inconsistent",
      `WOMPI_BASE_URL parece "${baseUrlSignal}", WOMPI_PUBLIC_KEY parece "${publicKeySignal}", WOMPI_PRIVATE_KEY parece "${privateKeySignal}".`,
    );
    throw new Error(
      "Configuración de Wompi inconsistente: WOMPI_BASE_URL parece " +
        `"${baseUrlSignal}", WOMPI_PUBLIC_KEY parece "${publicKeySignal}" y ` +
        `WOMPI_PRIVATE_KEY parece "${privateKeySignal}". Las tres deben apuntar ` +
        "al MISMO entorno (las tres sandbox, o las tres producción) -- nunca una mezcla. " +
        "Revisá las variables de entorno antes de aceptar pagos.",
    );
  }

  // Si las tres coinciden (o las que se pudieron clasificar coinciden), hay
  // un único entorno resuelto con confianza -- si ninguna se pudo
  // clasificar, no hay nada más que verificar acá.
  const resolvedEnvironment =
    distinctKnown.size === 1 ? [...distinctKnown][0]! : null;
  if (!resolvedEnvironment) return;

  const sandboxFlagSet = process.env.NEXT_PUBLIC_WOMPI_SANDBOX === "true";

  if (sandboxFlagSet && resolvedEnvironment === "production") {
    logConfigGuardFailure(
      "payment.wompi_config_inconsistent",
      "NEXT_PUBLIC_WOMPI_SANDBOX=true pero las credenciales/WOMPI_BASE_URL son de PRODUCCIÓN real.",
    );
    throw new Error(
      'Configuración de Wompi inconsistente: NEXT_PUBLIC_WOMPI_SANDBOX="true" pero las ' +
        "credenciales/WOMPI_BASE_URL son de PRODUCCIÓN real. Esto mostraría tarjetas de " +
        "prueba en un checkout que cobra dinero real -- corregí NEXT_PUBLIC_WOMPI_SANDBOX " +
        'a "false" (o quitala) antes de aceptar pagos.',
    );
  }
  if (!sandboxFlagSet && resolvedEnvironment === "sandbox") {
    logConfigGuardFailure(
      "payment.wompi_config_inconsistent",
      "NEXT_PUBLIC_WOMPI_SANDBOX no está en true pero las credenciales/WOMPI_BASE_URL son de SANDBOX.",
    );
    throw new Error(
      "Configuración de Wompi inconsistente: NEXT_PUBLIC_WOMPI_SANDBOX no está en " +
        '"true" pero las credenciales/WOMPI_BASE_URL son de SANDBOX. Los pagos parecerían ' +
        "reales para quien compra, pero nunca cobrarían dinero de verdad.",
    );
  }

  const appEnvironment = process.env.APP_ENVIRONMENT;
  if (appEnvironment === "production" && resolvedEnvironment === "sandbox") {
    logConfigGuardFailure(
      "payment.wompi_config_inconsistent",
      "APP_ENVIRONMENT=production pero las credenciales/WOMPI_BASE_URL de Wompi son de SANDBOX.",
    );
    throw new Error(
      "Configuración de Wompi inconsistente: APP_ENVIRONMENT=production pero las " +
        "credenciales/WOMPI_BASE_URL de Wompi son de SANDBOX. Producción nunca debe " +
        "correr contra el entorno de pruebas de Wompi.",
    );
  }
}
