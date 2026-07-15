"use server";

import { prisma } from "lib/prisma";
import type { CouponValidationResult } from "./types";

function toCents(euros: number): number {
  return Math.round(euros * 100);
}
function toEuros(cents: number): number {
  return cents / 100;
}

// Validación pública (Sprint 17), llamada desde el checkout. No incrementa
// `usedCount` acá — eso pasa recién cuando el pedido se crea de verdad
// (applyCouponUsageAction), para no descontar un uso de un cupón que el
// usuario probó pero nunca terminó de pagar.
export async function validateCouponAction(
  code: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { success: false, error: "Ingresá un código de cupón." };
  }

  try {
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
        error: `Este cupón requiere un mínimo de ${toEuros(coupon.minSubtotal).toFixed(2)} €.`,
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
    console.error("validateCouponAction: no se pudo validar el cupón", error);
    return { success: false, error: "No se pudo validar el cupón." };
  }
}

// Llamada desde ordersRepository.create (lib/orders/orders-actions.ts) justo
// después de crear el pedido con éxito — best-effort, un fallo acá no debe
// revertir un pedido ya pagado.
export async function incrementCouponUsageAction(code: string): Promise<void> {
  try {
    await prisma.coupon.updateMany({
      where: { code: code.trim().toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  } catch (error) {
    console.error(
      "incrementCouponUsageAction: no se pudo incrementar el uso",
      error,
    );
  }
}
