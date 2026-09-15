const RESEND_API_URL = "https://api.resend.com/emails";

type EmailPayload = { to: string; subject: string; html: string };
export type SendEmailResult = { success: boolean; error?: string };

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
}: EmailPayload): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const isProduction = process.env.NODE_ENV === "production";

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
        `sendEmail: RESEND_API_KEY no está configurada en producción — no se envió el correo para ${to}.`,
      );
      return { success: false, error: "El proveedor de email no está configurado en producción." };
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
      `sendEmail: EMAIL_FROM no está configurada en producción — no se envió el correo para ${to}.`,
    );
    return { success: false, error: "El proveedor de email no está configurado en producción." };
  }

  const effectiveFrom = from || "Radaelli Swimwear <onboarding@resend.dev>";

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: effectiveFrom, to, subject, html }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`sendEmail: Resend respondió ${response.status}`, body);
      return { success: false, error: `Resend respondió ${response.status}` };
    }
    return { success: true };
  } catch (error) {
    // Un correo transaccional que falla en enviarse nunca debe tumbar el
    // flujo que lo disparó (registro, login, checkout) — se loguea y listo;
    // el llamador decide si el resultado le importa.
    console.error("sendEmail: no se pudo enviar", error);
    return { success: false, error: "No se pudo conectar con el proveedor de email." };
  }
}
