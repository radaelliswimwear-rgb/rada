const RESEND_API_URL = "https://api.resend.com/emails";

type EmailPayload = { to: string; subject: string; html: string };

// Envío transaccional (Sprint 26) vía Resend (API HTTP simple, sin
// dependencia npm nueva). Sin RESEND_API_KEY configurada todavía (la
// fundadora tiene que crear la cuenta en resend.com ella misma, no puedo
// hacerlo por ella), degrada a loguear el contenido en la consola del
// servidor en vez de fallar — así ningún flujo (registro, login,
// recuperación de contraseña) queda bloqueado por no tener el proveedor de
// email conectado todavía. Para activar el envío real: crear cuenta en
// resend.com, verificar un dominio de envío, y setear RESEND_API_KEY +
// EMAIL_FROM en el entorno (ver .env.example).
export async function sendEmail({ to, subject, html }: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Radaelli Swimwear <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[email:modo-desarrollo, sin RESEND_API_KEY] Para: ${to} | Asunto: ${subject}\n${html}`,
    );
    return;
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
    }
  } catch (error) {
    // Un correo transaccional que falla en enviarse nunca debe tumbar el
    // flujo que lo disparó (registro, login, checkout) — se loguea y listo.
    console.error("sendEmail: no se pudo enviar", error);
  }
}
