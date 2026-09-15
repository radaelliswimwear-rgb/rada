// Único lugar donde viven los correos administrativos de Radaelli — nunca
// repetir estas direcciones sueltas en otro archivo (Sprint 30). Se pueden
// sobreescribir sin tocar código vía ADMIN_NOTIFICATION_EMAIL_1/_2 en el
// entorno; si no están seteadas, cae a las direcciones reales que la
// fundadora dio como oficiales, así el sistema funciona igual antes de que
// las agregue a Vercel.
const DEFAULT_ADMIN_EMAILS = [
  "radaelliswimwear@gmail.com",
  "info@radaelliswimwear.com",
];

export function getAdminNotificationEmails(): string[] {
  const fromEnv = [
    process.env.ADMIN_NOTIFICATION_EMAIL_1,
    process.env.ADMIN_NOTIFICATION_EMAIL_2,
  ].filter((value): value is string => Boolean(value?.trim()));

  const emails = fromEnv.length > 0 ? fromEnv : DEFAULT_ADMIN_EMAILS;

  // Sin duplicados ni espacios sueltos — por si algún día ADMIN_NOTIFICATION_EMAIL_1
  // y _2 terminan apuntando al mismo correo.
  return Array.from(new Set(emails.map((email) => email.trim().toLowerCase())));
}
