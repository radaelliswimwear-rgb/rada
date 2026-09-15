import { prisma } from "lib/prisma";

// Rate limiting simple (ventana deslizante) contra fuerza bruta en
// login/registro/recuperación de contraseña — sin servicio externo nuevo,
// solo cuenta filas recientes en AuthAttempt. No es lo más sofisticado
// (no usa Redis, no distingue ataques distribuidos por IP), pero cierra el
// hueco obvio de "probar miles de contraseñas seguidas contra un mismo
// email" que hoy no tiene ningún freno.
const LIMITS = {
  login: { max: 10, windowMinutes: 15 },
  register: { max: 5, windowMinutes: 60 },
  "password-reset-request": { max: 5, windowMinutes: 60 },
  // login-ip/register-ip: por IP, ADEMÁS del límite por email de arriba —
  // el límite por email por sí solo no frena a quien reparte los intentos
  // entre muchos correos distintos desde la misma IP (password spraying en
  // login; barrido de "¿este correo ya tiene cuenta?" en registro).
  "login-ip": { max: 30, windowMinutes: 15 },
  "register-ip": { max: 20, windowMinutes: 60 },
  // checkout: por IP — cubre intentos de pago con tarjeta (card testing) y
  // creación de intents. coupon: por IP — evita fuerza bruta de códigos de
  // cupón (lib/coupons/coupons-actions.ts).
  checkout: { max: 20, windowMinutes: 15 },
  coupon: { max: 30, windowMinutes: 15 },
  // webhook: por IP — Wompi reintenta como máximo 3 veces en 24h por
  // evento real; este límite es generoso a propósito para no arriesgarse a
  // bloquear esos reintentos legítimos, solo frena un flood directo al
  // endpoint.
  webhook: { max: 60, windowMinutes: 5 },
} as const satisfies Record<string, { max: number; windowMinutes: number }>;

type RateLimitAction = keyof typeof LIMITS;

export class RateLimitError extends Error {
  constructor(message = "Demasiados intentos. Probá de nuevo más tarde.") {
    super(message);
    this.name = "RateLimitError";
  }
}

// `identifier` es el email (login/registro) o una IP (cuando no hay email
// todavía) — quien llama decide cuál usar. Registra el intento SIEMPRE
// (incluso el que dispara el límite), así una ráfaga de intentos no
// "resetea" la ventana por no haberse contado a sí misma.
export async function checkRateLimit(
  identifier: string,
  action: RateLimitAction,
): Promise<void> {
  const { max, windowMinutes } = LIMITS[action];
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const recentCount = await prisma.authAttempt.count({
    where: { identifier, action, createdAt: { gte: windowStart } },
  });

  await prisma.authAttempt.create({ data: { identifier, action } });

  if (recentCount >= max) {
    throw new RateLimitError();
  }
}
