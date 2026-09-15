const RESEND_API_URL = "https://api.resend.com/emails";

type EmailPayload = { to: string; subject: string; html: string };
export type SendEmailResult = { success: boolean; error?: string };

// Envío transaccional (Sprint 26) vía Resend (API HTTP simple, sin
// dependencia npm nueva). Sin RESEND_API_KEY configurada todavía (la
// fundadora tiene que crear la cuenta en resend.com ella misma, no puedo
// hacerlo por ella), degrada a loguear el contenido en la consola del
// servidor en vez de fallar — así ningún flujo (registro, login,
// recuperación de contraseña) queda bloqueado por no tener el proveedor de
// email conectado todavía. Para activar el envío real: crear cuenta en
// resend.com, verificar un dominio de envío, y setear RESEND_API_KEY +
// EMAIL_FROM en el entorno (ver .env.example).
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
  const from = process.env.EMAIL_FROM || "Radaelli Swimwear <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[email:modo-desarrollo, sin RESEND_API_KEY] Para: ${to} | Asunto: ${subject}\n${html}`,
    );
    // Modo desarrollo: se considera "éxito" (no hay proveedor real para
    // fallar) — mismo criterio que ya usaban registro/login/checkout, que
    // nunca se bloquean por no tener Resend conectado todavía.
    return { success: true };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
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
