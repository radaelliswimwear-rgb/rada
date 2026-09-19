import { prisma } from "lib/prisma";
import { sendEmail } from "lib/email/send";
import { getAdminNotificationEmails } from "lib/email/admin-recipients";

// Observabilidad (sep. 2026) -- ver el comentario largo junto a SystemLog
// en prisma/schema.prisma para el diseño completo. Dos capas en un único
// punto de entrada (logEvent):
//   1. LOGGING ESTRUCTURADO: siempre loguea a consola (Vercel Runtime Logs,
//      señal inmediata) Y persiste una fila en SystemLog (sobrevive más
//      allá de la ventana de retención de Vercel, consultable sin abrir
//      ningún dashboard).
//   2. ALERTAS: solo para eventos marcados `alert: true` -- manda un correo
//      a los admins (reusa lib/email/send.ts + lib/email/admin-recipients.ts,
//      ya existentes, sin cuenta/proveedor nuevo) con cooldown/dedupe para
//      no generar alert fatigue.
//
// MUY IMPORTANTE (regla explícita del proceso que originó este módulo):
// logEvent NUNCA debe poder bloquear ni hacer fallar una operación
// financiera. Cada paso que toca la base de datos o la red (persistir en
// SystemLog, mandar el correo de alerta) está envuelto en try/catch propio
// -- un fallo acá se loguea a consola y se ignora, nunca se propaga a quien
// llamó a logEvent.

export type LogSeverity = "info" | "warn" | "error" | "critical";

export type LogEventInput = {
  // Nombre corto y estable, en snake_case con puntos como namespace (ej.
  // "payment.webhook_amount_mismatch") -- es la clave que se usa para
  // buscar/filtrar en SystemLog y, salvo que se pase `dedupeKey`, también
  // agrupa el cooldown de alertas.
  event: string;
  severity: LogSeverity;
  requestId?: string;
  paymentId?: string;
  orderId?: string;
  userId?: string;
  provider?: string;
  outcome?: string;
  // Mensaje corto de diagnóstico -- responsabilidad de quien llama: nunca
  // debe contener email/teléfono/dirección/token/payload crudo (mismo
  // criterio que EmailOutbox.lastError). Se trunca acá como red de
  // seguridad adicional, no como único mecanismo de sanitización.
  reason?: string;
  // Sobre qué mutó una acción de admin (ej. targetType="Product",
  // targetId=<cuid>) -- ver logAdminMutation más abajo, el helper que
  // debería usar cualquier acción admin nueva en vez de armar estos campos
  // a mano.
  targetType?: string;
  targetId?: string;
  // Agrupa el cooldown de alertas cuando `alert: true` -- por defecto es
  // `event` (todas las alertas de un mismo tipo comparten cooldown). Pasar
  // uno propio (ej. `payment:${paymentId}:flagged`) cuando cada recurso
  // afectado debe poder alertar independientemente del resto.
  dedupeKey?: string;
  // true = este evento es accionable y, si no hay una alerta reciente con
  // el mismo dedupeKey dentro de la ventana de cooldown, dispara un correo
  // a los admins. false/ausente = se persiste y se loguea, nunca alerta.
  alert?: boolean;
};

const ALERT_COOLDOWN_MINUTES = 60;
const MAX_REASON_LENGTH = 300;

function sanitizeReason(reason: string | undefined): string | undefined {
  if (!reason) return undefined;
  return reason.slice(0, MAX_REASON_LENGTH);
}

function consoleFn(severity: LogSeverity): (...args: unknown[]) => void {
  if (severity === "info") return console.log;
  if (severity === "warn") return console.warn;
  return console.error; // error y critical -- Vercel los marca como Error
}

async function maybeSendAlert(
  input: LogEventInput,
  createdId: string | null,
): Promise<void> {
  const dedupeKey = input.dedupeKey ?? input.event;
  const cooldownStart = new Date(
    Date.now() - ALERT_COOLDOWN_MINUTES * 60 * 1000,
  );

  let recentlyAlerted = false;
  try {
    const recent = await prisma.systemLog.findFirst({
      where: { dedupeKey, alertedAt: { gte: cooldownStart } },
      select: { id: true },
    });
    recentlyAlerted = Boolean(recent);
  } catch (error) {
    // Si no se puede chequear el cooldown (DB caída, etc.), mejor mandar la
    // alerta de más que quedarse callado sobre algo accionable.
    console.error(
      "logEvent: no se pudo chequear el cooldown de alertas, se manda igual",
      error,
    );
  }
  if (recentlyAlerted) return;

  const recipients = getAdminNotificationEmails();
  const subject = `[Radaelli · alerta ${input.severity}] ${input.event}`;
  const html = buildAlertHtml(input);

  for (const to of recipients) {
    await sendEmail({ to, subject, html }).catch((error) => {
      console.error("logEvent: no se pudo enviar el correo de alerta", error);
    });
  }

  if (createdId) {
    await prisma.systemLog
      .update({ where: { id: createdId }, data: { alertedAt: new Date() } })
      .catch(() => undefined);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildAlertHtml(input: LogEventInput): string {
  const rows: [string, string | undefined][] = [
    ["Evento", input.event],
    ["Severidad", input.severity],
    ["Payment", input.paymentId],
    ["Order", input.orderId],
    ["Usuario", input.userId],
    ["Proveedor", input.provider],
    ["Resultado", input.outcome],
    ["Motivo", sanitizeReason(input.reason)],
  ];
  const rowsHtml = rows
    .filter(([, value]) => Boolean(value))
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(label)}</td><td>${escapeHtml(String(value))}</td></tr>`,
    )
    .join("");
  return `
    <div style="font-family:sans-serif;font-size:14px;color:#111;">
      <p>Se disparó una alerta operativa en Radaelli Swimwear.</p>
      <table>${rowsHtml}</table>
      <p style="color:#666;margin-top:16px;">Revisar el panel de administración o los logs de Vercel para más contexto. Este correo se agrupa por evento durante ${ALERT_COOLDOWN_MINUTES} minutos -- no se repite si el mismo problema sigue ocurriendo dentro de esa ventana.</p>
    </div>
  `;
}

export async function logEvent(input: LogEventInput): Promise<void> {
  const environment =
    process.env.APP_ENVIRONMENT ?? process.env.NODE_ENV ?? "unknown";
  const reason = sanitizeReason(input.reason);
  const timestamp = new Date().toISOString();

  consoleFn(input.severity)(`[${input.severity}] ${input.event}`, {
    severity: input.severity,
    environment,
    requestId: input.requestId,
    paymentId: input.paymentId,
    orderId: input.orderId,
    userId: input.userId,
    provider: input.provider,
    outcome: input.outcome,
    reason,
    targetType: input.targetType,
    targetId: input.targetId,
    timestamp,
  });

  let createdId: string | null = null;
  try {
    const created = await prisma.systemLog.create({
      data: {
        event: input.event,
        severity: input.severity.toUpperCase() as
          | "INFO"
          | "WARN"
          | "ERROR"
          | "CRITICAL",
        environment,
        requestId: input.requestId ?? null,
        paymentId: input.paymentId ?? null,
        orderId: input.orderId ?? null,
        userId: input.userId ?? null,
        provider: input.provider ?? null,
        outcome: input.outcome ?? null,
        reason: reason ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        dedupeKey: input.alert ? (input.dedupeKey ?? input.event) : null,
      },
      select: { id: true },
    });
    createdId = created.id;
  } catch (error) {
    console.error(
      "logEvent: no se pudo persistir en SystemLog (no bloquea la operación)",
      error,
    );
  }

  if (input.alert) {
    try {
      await maybeSendAlert(input, createdId);
    } catch (error) {
      console.error(
        "logEvent: no se pudo procesar la alerta (no bloquea la operación)",
        error,
      );
    }
  }
}

// Hardening P2/P3 (sep. 2026): punto de entrada único para instrumentar
// mutaciones de /admin/* -- pensado para llamarse SIN await (fire and
// forget, como el resto de las llamadas a logEvent de este proyecto en
// flujos donde la observabilidad nunca debe poder demorar ni romper la
// operación real) justo después de que la mutación de verdad ya haya
// pasado. `action` es corto y snake_case sin el prefijo "admin." (ej.
// "product_delete") -- este helper arma el nombre completo del evento
// (`admin.product_delete`) para que todas las mutaciones admin queden
// agrupadas bajo el mismo namespace de forma consistente.
export function logAdminMutation(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  outcome: "success" | "failure";
  // Nunca un email/dirección/payload -- un motivo corto y seguro (mismo
  // criterio que el resto de `reason` en este archivo). Ej.: el motivo de
  // un fallo, o "role: USER -> ADMIN" para un cambio de rol.
  reason?: string;
  // true SOLO para lo explícitamente accionable: cambio de rol, borrado
  // destructivo importante, fallo repetido -- el resto se persiste para
  // auditoría pero nunca manda correo (evita alert fatigue).
  alert?: boolean;
}): void {
  logEvent({
    event: `admin.${params.action}`,
    severity: params.outcome === "failure" ? "warn" : "info",
    userId: params.adminId,
    targetType: params.targetType,
    targetId: params.targetId,
    outcome: params.outcome,
    reason: params.reason,
    dedupeKey: params.alert
      ? `admin.${params.action}:${params.targetId ?? params.adminId}`
      : undefined,
    alert: params.alert ?? false,
  }).catch(() => undefined);
}
