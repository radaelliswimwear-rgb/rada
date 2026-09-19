import { createHash } from "node:crypto";
import { prisma } from "lib/prisma";
import { logEvent } from "lib/observability/log";

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
  // password-reset-request-ip: mismo motivo que login-ip/register-ip
  // (auditoría de seguridad, sep. 2026) -- el límite por email por sí solo
  // no frena a quien prueba MUCHOS emails distintos desde la misma IP
  // (barrido de enumeración de cuentas, o simple abuso para spamear la
  // bandeja de entrada de terceros con correos de "recuperación" que nunca
  // pidieron). Más estricto que login-ip/register-ip a propósito: a
  // diferencia de esos, cada intento acá SÍ puede terminar mandándole un
  // correo real a una tercera persona.
  "password-reset-request-ip": { max: 10, windowMinutes: 15 },
  // checkout: por IP — cubre intentos de pago con tarjeta (card testing) y
  // creación de intents. coupon: por IP — evita fuerza bruta de códigos de
  // cupón (lib/coupons/coupons-actions.ts).
  checkout: { max: 20, windowMinutes: 15 },
  // checkout-return: por IP — confirmación del regreso desde el Checkout Web
  // alojado de Wompi (confirmHostedCheckoutReturnAction). Bucket propio y no
  // el de "checkout" porque la página de retorno hace polling mientras el
  // pago sigue PENDING: con el límite de creación de intents, un solo pago
  // lento ya lo agotaría y la clienta se quedaría sin poder confirmar. Igual
  // tiene freno propio porque cada llamada dispara consultas a la API de
  // Wompi.
  "checkout-return": { max: 60, windowMinutes: 15 },
  coupon: { max: 30, windowMinutes: 15 },
  // webhook: por IP — Wompi reintenta como máximo 3 veces en 24h por
  // evento real; este límite es generoso a propósito para no arriesgarse a
  // bloquear esos reintentos legítimos, solo frena un flood directo al
  // endpoint.
  webhook: { max: 60, windowMinutes: 5 },
  // newsletter: por IP — subscribeToNewsletterAction era la única Server
  // Action pública de escritura sin ningún freno (podía llamarse sin límite
  // para hacer upsert masivo sobre NewsletterSubscriber).
  newsletter: { max: 20, windowMinutes: 15 },
  // back-in-stock: por IP — requestBackInStockAction (lib/back-in-stock/
  // back-in-stock-actions.ts) es pública y de escritura; sin esto, un bot
  // podría generar miles de filas BackInStockRequest sin freno.
  "back-in-stock": { max: 20, windowMinutes: 15 },
  // cart-save/wishlist-save: hardening P2/P3 (sep. 2026) -- saveCartLinesAction/
  // saveWishlistItemsAction eran las últimas Server Actions públicas de
  // escritura sin ningún freno (auditoría de seguridad). Por identificador
  // de dueño (userId con sesión, o el id de invitado de la cookie -- ver
  // resolveCartOwner/resolveWishlistOwner), no por IP: así no castiga a
  // varias clientas legítimas detrás de la misma IP/red. Límite generoso a
  // propósito -- cada click de "agregar"/"quitar"/cambiar cantidad dispara
  // un guardado, y una sesión de compra activa real puede hacer eso muchas
  // veces sin ser abuso.
  "cart-save": { max: 100, windowMinutes: 15 },
  "wishlist-save": { max: 100, windowMinutes: 15 },
} as const satisfies Record<string, { max: number; windowMinutes: number }>;

type RateLimitAction = keyof typeof LIMITS;

export class RateLimitError extends Error {
  constructor(message = "Demasiados intentos. Probá de nuevo más tarde.") {
    super(message);
    this.name = "RateLimitError";
  }
}

// Acciones sensibles (auth/pagos) cuyo límite disparado vale una alerta por
// correo -- indica un posible ataque de fuerza bruta/card testing en curso,
// algo accionable. Las demás (cupón, newsletter, "avísame cuando vuelva",
// webhook) se siguen registrando en SystemLog para tener el dato, pero no
// alertan: son blancos mucho más comunes de tráfico de bots genérico y
// alertar por cada uno sería ruido, no señal (observabilidad, sep. 2026).
const ALERT_WORTHY_ACTIONS: ReadonlySet<RateLimitAction> = new Set([
  "login",
  "login-ip",
  "register",
  "register-ip",
  "password-reset-request",
  "password-reset-request-ip",
  "checkout",
  "checkout-return",
]);

// `identifier` es un email o una IP -- nunca va en texto plano a SystemLog
// (que persiste todo lo que recibe): se hashea siempre antes de usarse en
// un dedupeKey, igual que EmailOutbox.idempotencyKey nunca guarda el email
// real, solo su hash (lib/email/outbox.ts, computeIdempotencyKey). Un solo
// helper para que cualquier otro módulo que necesite el mismo criterio
// (ver requestPasswordResetAction, lib/auth/users-actions.ts) no lo
// reimplemente ni lo desalinee sin querer.
export function hashRateLimitIdentifier(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex").slice(0, 16);
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
    await logEvent({
      event: "rate_limit.triggered",
      severity: "warn",
      outcome: action,
      reason: `Límite de ${max} intentos en ${windowMinutes} min superado`,
      dedupeKey: `rate_limit:${action}:${hashRateLimitIdentifier(identifier)}`,
      alert: ALERT_WORTHY_ACTIONS.has(action),
    });
    throw new RateLimitError();
  }
}
