import { baseUrl } from "lib/utils";

const BRAND = "Radaelli Swimwear";

function wrapper(bodyHtml: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f7f5f2;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
      <div style="background:#000000;padding:24px;text-align:center;">
        <span style="color:#ffffff;font-size:13px;letter-spacing:3px;text-transform:uppercase;">${BRAND}</span>
      </div>
      <div style="padding:32px 24px;color:#111111;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
    </div>
  </div>`;
}

function ctaButton(url: string, label: string): string {
  return `<p style="text-align:center;margin:28px 0;">
    <a href="${url}" style="background:#000000;color:#ffffff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">${label}</a>
  </p>`;
}

export function verificationEmail(name: string, token: string) {
  const url = `${baseUrl}/cuenta/verificar-email?token=${token}`;
  return {
    subject: "Confirmá tu correo — Radaelli Swimwear",
    html: wrapper(`
      <p>Hola ${name},</p>
      <p>Gracias por crear tu cuenta en ${BRAND}. Confirmá tu correo para activarla del todo:</p>
      ${ctaButton(url, "Confirmar correo")}
      <p style="color:#666666;font-size:12px;">Si no creaste esta cuenta, podés ignorar este correo.</p>
    `),
  };
}

export function passwordResetEmail(name: string, token: string) {
  const url = `${baseUrl}/cuenta/restablecer-contrasena?token=${token}`;
  return {
    subject: "Restablecé tu contraseña — Radaelli Swimwear",
    html: wrapper(`
      <p>Hola ${name},</p>
      <p>Pediste restablecer tu contraseña. Este enlace vale por 30 minutos y solo se puede usar una vez:</p>
      ${ctaButton(url, "Restablecer contraseña")}
      <p style="color:#666666;font-size:12px;">Si no lo pediste vos, ignorá este correo — tu contraseña actual sigue funcionando.</p>
    `),
  };
}

export function passwordChangedEmail(name: string) {
  return {
    subject: "Tu contraseña cambió — Radaelli Swimwear",
    html: wrapper(`
      <p>Hola ${name},</p>
      <p>Tu contraseña se actualizó correctamente y cerramos tu sesión en todos los dispositivos por seguridad.</p>
      <p style="color:#666666;font-size:12px;">Si no fuiste vos quien hizo este cambio, respondé este correo de inmediato.</p>
    `),
  };
}

export function welcomeEmail(name: string) {
  return {
    subject: `Bienvenida a ${BRAND}`,
    html: wrapper(`
      <p>Hola ${name},</p>
      <p>Tu cuenta ya está lista. Desde "Mi cuenta" vas a poder ver tus pedidos, guardar direcciones y más.</p>
    `),
  };
}
