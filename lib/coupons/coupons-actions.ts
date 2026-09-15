"use server";

import { fromSubunits, toSubunits } from "lib/currency/subunits";
import { formatPrice } from "lib/format";
import { prisma } from "lib/prisma";
import { checkRateLimit, RateLimitError } from "lib/auth/rate-limit";
import { getClientIp } from "lib/request/client-ip";
import type { CouponValidationResult } from "./types";

const toCents = toSubunits;
const toEuros = fromSubunits;

// Validación pública (Sprint 17), llamada desde el checkout — solo para
// mostrarle el descuento a la clienta al tipear el código; el cupón se
// vuelve a validar (y su usedCount se incrementa de forma atómica) recién
// cuando el pago se cobra de verdad, ver reserveAndPriceCheckout/
// createOrderAction. Rate limit por IP (Sprint 29) para que no se pueda
// usar este endpoint para adivinar códigos de cupón por fuerza bruta.
export async function validateCouponAction(
  code: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { success: false, error: "Ingresá un código de cupón." };
  }

  try {
    await checkRateLimit(await getClientIp(), "coupon");
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalized },
    });

    if (!coupon || !coupon.active) {
      return { success: false, error: "Cupón no válido." };
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { success: false, error: "Este cupón venció." };
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return {
        success: false,
        error: "Este cupón ya alcanzó su límite de usos.",
      };
    }
    const subtotalCents = toCents(subtotal);
    if (subtotalCents < coupon.minSubtotal) {
      return {
        success: false,
        error: `Este cupón requiere un mínimo de ${formatPrice(toEuros(coupon.minSubtotal))}.`,
      };
    }

    const discountCents =
      coupon.type === "PERCENTAGE"
        ? Math.round((subtotalCents * coupon.value) / 100)
        : Math.min(coupon.value, subtotalCents);

    return {
      success: true,
      code: coupon.code,
      discount: toEuros(discountCents),
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    console.error("validateCouponAction: no se pudo validar el cupón", error);
    return { success: false, error: "No se pudo validar el cupón." };
  }
}
