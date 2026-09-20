import { createHash } from "node:crypto";

const RESEND_API_URL = "https://api.resend.com/emails";

// Fase 2E del proyecto de staging/pentest (sep. 2026): SystemLog debe ver
// cada intento de envío (email.attempt/sent/skipped_allowlist/
// disabled_staging/provider_failed) -- ver docs/pentest-architecture.md.
// `import()` dinámico, NUNCA un `import` estático de lib/observability/log
// acá arriba: ese módulo importa `sendEmail` de ESTE archivo (para mandar
// el correo de alerta de maybeSendAlert), así que un import estático
// mutuo sería circular. La carga dinámica se resuelve recién cuando la
// función se llama de verdad (ya con los dos módulos completamente
// cargados), evitando el ciclo sin duplicar la lógica de logEvent acá.
// Fire-and-forget (.catch(() => {})): el mismo principio de siempre --
// logEvent NUNCA debe poder demorar ni romper un envío real.
function logEmailEvent(input: {
  event: string;
  severity: "info" | "warn" | "error";
  recipientHash: string;
  reason?: string;
}): void {
  import("lib/observability/log")
    .then(({ logEvent }) =>
      logEvent({
        event: input.event,
        severity: input.severity,
        outcome: input.recipientHash,
        reason: input.reason,
      }),
    )
    .catch(() => {});
}

// Hardening P2/P3 (sep. 2026): nunca el email completo en logs -- mismo
// criterio que EmailOutbox.idempotencyKey (lib/email/outbox.ts,
// computeIdempotencyKey): un hash corto alcanza para correlacionar "el
// mismo destinatario volvió a fallar" sin persistir la dirección real en
// ningún log de consola.
export function hashRecipientForLogs(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 12);
}

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const MAX_LOGGED_BODY_LENGTH = 300;

// Fase 2A del proyecto de staging/pentest (sep. 2026): en staging, NINGÚN
// correo puede salir a un destinatario arbitrario -- ver
// docs/pentest-architecture.md. Chequeo de PRIORIDAD MÁXIMA, antes de
// cualquier otra cosa en sendEmail (incluido el fallback de
// RESEND_API_KEY ausente): un destinatario fuera de la allowlist se
// bloquea sea cual sea el estado de la configuración de Resend. No se
// implementa vía APP_ENVIRONMENT !== "production" (ese criterio ya
// demostró ser insuficiente: NODE_ENV siempre es "production" en
// cualquier build de Vercel, incluidos los despliegues de staging/Preview
// -- ver el comentario de `isProduction` más abajo) -- este gate lee
// APP_ENVIRONMENT directamente, la única variable que de verdad distingue
// staging de production en este proyecto (lib/env/app-environment.ts).
function isStagingEnvironment(): boolean {
  return process.env.APP_ENVIRONMENT === "staging";
}

function parseStagingEmailAllowlist(): Set<string> {
  const raw = process.env.STAGING_EMAIL_ALLOWLIST ?? "";
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

// Exportada para que los tests (y, si hiciera falta, un diagnóstico) puedan
// verificar la decisión sin tener que llamar a sendEmail completo.
export function isRecipientAllowedInStaging(to: string): boolean {
  return parseStagingEmailAllowlist().has(to.trim().toLowerCase());
}

// La respuesta de error de Resend no es un formato que controlemos --
// podría traer de vuelta el destinatario (`to`) u otro dato de la request
// original. Se redacta cualquier cosa con forma de email ANTES de loguear,
// nunca se confía en que el body de un proveedor externo ya venga limpio.
export function sanitizeProviderErrorBody(rawBody: string): string {
  return rawBody
    .replace(EMAIL_PATTERN, "[email]")
    .slice(0, MAX_LOGGED_BODY_LENGTH);
}

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  // Opcional (Sprint de confiabilidad de emails/outbox) — cuando viene
  // presente, se manda como header Idempotency-Key a Resend (documentado:
  // hasta 256 caracteres, ventana de 24h). Quien llama es responsable de
  // que sea estable entre reintentos del MISMO envío (ver
  // lib/email/outbox.ts, computeIdempotencyKey) — sendEmail no genera ni
  // valida nada acá, solo lo reenvía tal cual si está presente. Los
  // llamadores existentes (avisos de newsletter, "avísame cuando vuelva")
  // no lo pasan y siguen funcionando exactamente igual.
  idempotencyKey?: string;
};
export type SendEmailResult = {
  success: boolean;
  error?: string;
  // true SOLO cuando el bloqueo fue la allowlist de staging (nunca por un
  // fallo real del proveedor) -- para que quien llame (o un test) pueda
  // distinguir "no se intentó a propósito" de "se intentó y falló".
  skipped?: boolean;
};

// Envío transaccional (Sprint 26) vía Resend (API HTTP simple, sin
// dependencia npm nueva). En DESARROLLO, sin RESEND_API_KEY configurada
// todavía (la fundadora tiene que crear la cuenta en resend.com ella misma,
// no puedo hacerlo por ella), degrada a loguear el contenido en la consola
// del servidor en vez de fallar — así ningún flujo (registro, login,
// recuperación de contraseña) queda bloqueado por no tener el proveedor de
// email conectado todavía en la máquina local. En PRODUCCIÓN (validación
// final de P2, Fase 2) esa degradación NUNCA aplica: si falta
// RESEND_API_KEY o EMAIL_FROM, sendEmail devuelve { success: false } de
// verdad — nunca simula un envío exitoso que nadie recibió. Para activar el
// envío real: crear cuenta en resend.com, verificar un dominio de envío, y
// setear RESEND_API_KEY + EMAIL_FROM en el entorno de Vercel (ver
// .env.example).
//
// Devuelve { success, error? } (Fase 2, P2) — todos los llamadores
// anteriores a esto lo seguían tratando como fire-and-forget (nunca leían
// el valor de retorno) y siguen funcionando igual; back-in-stock-
// notifications.ts es el primero que sí necesita saber si el envío
// realmente llegó, para no marcar una solicitud como "notified" cuando en
// realidad falló.
export async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}: EmailPayload): Promise<SendEmailResult> {
  const recipientHash = hashRecipientForLogs(to);
  logEmailEvent({ event: "email.attempt", severity: "info", recipientHash });

  // Fase 2A staging/pentest: ver el comentario largo junto a
  // isStagingEnvironment más arriba -- este chequeo va ANTES que
  // cualquier otra cosa, a propósito. Nunca reescribe `to` a otra
  // dirección en silencio: si no está permitido, simplemente no se manda,
  // y queda un rastro en consola (nunca el email real, mismo criterio que
  // el resto de este archivo).
  if (isStagingEnvironment() && !isRecipientAllowedInStaging(to)) {
    console.warn(
      "sendEmail: destinatario fuera de STAGING_EMAIL_ALLOWLIST -- no se envía (staging)",
      { recipientHash, subject },
    );
    logEmailEvent({
      event: "email.skipped_allowlist",
      severity: "warn",
      recipientHash,
    });
    return {
      success: false,
      skipped: true,
      error:
        "Destinatario no permitido en staging (fuera de STAGING_EMAIL_ALLOWLIST).",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const isProduction = process.env.NODE_ENV === "production";

  // Fase 2E: en staging, sin RESEND_API_KEY configurada, el email queda
  // DESHABILITADO de forma explícita y observable -- distinto del
  // fallback histórico de desarrollo (que simula éxito) y del rechazo
  // genérico de producción (más abajo): acá se nombra la causa exacta
  // (staging sin proveedor conectado) para que quede clara en SystemLog
  // como `email.disabled_staging`, nunca confundida con un fallo real del
  // proveedor ni con un bloqueo de la allowlist. Mismo resultado práctico
  // que el rechazo de producción (success:false, nunca simula un envío) --
  // ver docs/pentest-architecture.md para el tradeoff completo (el flujo
  // de recuperación de contraseña se puede seguir probando por el token/
  // la lógica del backend, no por el correo real).
  if (isStagingEnvironment() && !apiKey) {
    console.log(
      `sendEmail: staging sin RESEND_API_KEY -- email deshabilitado (SKIPPED_STAGING_EMAIL_DISABLED)`,
      { recipientHash, subject },
    );
    logEmailEvent({
      event: "email.disabled_staging",
      severity: "info",
      recipientHash,
    });
    return {
      success: false,
      skipped: true,
      error: "Email deshabilitado en staging (RESEND_API_KEY no configurada).",
    };
  }

  // Sin RESEND_API_KEY: en desarrollo se sigue tratando como "éxito" (no
  // hay proveedor real para fallar) — mismo criterio que ya usaban
  // registro/login/checkout, que nunca se bloquean por no tener Resend
  // conectado todavía en la máquina local. En PRODUCCIÓN esto ya no es
  // aceptable (validación final de P2, Fase 2): un "éxito" simulado ahí
  // podía marcar una solicitud de "Avísame cuando vuelva" como NOTIFIED sin
  // que el correo hubiera salido realmente. Nunca se loguea la clave (no
  // existe, es justo lo que falta) ni ninguna otra credencial.
  if (!apiKey) {
    if (isProduction) {
      console.error(
        "sendEmail: RESEND_API_KEY no está configurada en producción — no se envió el correo.",
        { recipientHash },
      );
      logEmailEvent({
        event: "email.provider_failed",
        severity: "error",
        recipientHash,
        reason: "RESEND_API_KEY no configurada",
      });
      return {
        success: false,
        error: "El proveedor de email no está configurado en producción.",
      };
    }
    console.log(
      `[email:modo-desarrollo, sin RESEND_API_KEY] Para: ${to} | Asunto: ${subject}\n${html}`,
    );
    return { success: true };
  }

  // Mismo criterio para EMAIL_FROM: en producción, con la API key puesta
  // pero sin remitente propio configurado, tampoco se simula éxito —
  // exigir ambas variables evita depender en silencio del remitente de
  // prueba de Resend (onboarding@resend.dev, con envío restringido) para
  // correos reales a clientas. En desarrollo sigue cayendo a ese remitente
  // de prueba si hay una API key real cargada localmente, sin cambiar ese
  // comportamiento existente.
  if (isProduction && !from) {
    console.error(
      "sendEmail: EMAIL_FROM no está configurada en producción — no se envió el correo.",
      { recipientHash },
    );
    logEmailEvent({
      event: "email.provider_failed",
      severity: "error",
      recipientHash,
      reason: "EMAIL_FROM no configurada",
    });
    return {
      success: false,
      error: "El proveedor de email no está configurado en producción.",
    };
  }

  const effectiveFrom = from || "Radaelli Swimwear <onboarding@resend.dev>";

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify({ from: effectiveFrom, to, subject, html }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`sendEmail: Resend respondió ${response.status}`, {
        recipientHash,
        body: sanitizeProviderErrorBody(body),
      });
      logEmailEvent({
        event: "email.provider_failed",
        severity: "error",
        recipientHash,
        reason: `Resend respondió ${response.status}`,
      });
      return { success: false, error: `Resend respondió ${response.status}` };
    }
    logEmailEvent({ event: "email.sent", severity: "info", recipientHash });
    return { success: true };
  } catch (error) {
    // Un correo transaccional que falla en enviarse nunca debe tumbar el
    // flujo que lo disparó (registro, login, checkout) — se loguea y listo;
    // el llamador decide si el resultado le importa.
    console.error("sendEmail: no se pudo enviar", {
      recipientHash,
      error,
    });
    logEmailEvent({
      event: "email.provider_failed",
      severity: "error",
      recipientHash,
      reason: "excepción de red al llamar a Resend",
    });
    return {
      success: false,
      error: "No se pudo conectar con el proveedor de email.",
    };
  }
}
