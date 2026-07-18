"use server";

import { prisma } from "lib/prisma";
import type { Coupon as CouponRow } from "@prisma/client";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
import type { AdminActionResult } from "./types";

export type AdminCoupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number; // % o euros, ya convertido para la UI
  active: boolean;
  minSubtotal: number; // euros
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
};

export type AdminCouponInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  active: boolean;
  minSubtotal: number;
  maxUses: number | null;
  expiresAt: string | null; // ISO date o null
};

const toCents = toSubunits;
const toEuros = fromSubunits;

function toAdminCoupon(row: CouponRow): AdminCoupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.type === "PERCENTAGE" ? row.value : toEuros(row.value),
    active: row.active,
    minSubtotal: toEuros(row.minSubtotal),
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}

export async function listAllCouponsAction(): Promise<AdminCoupon[]> {
  try {
    const rows = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toAdminCoupon);
  } catch (error) {
    console.error(
      "listAllCouponsAction: no se pudieron leer los cupones",
      error,
    );
    return [];
  }
}

export async function createCouponAction(
  input: AdminCouponInput,
): Promise<AdminActionResult> {
  const code = input.code.trim().toUpperCase();
  if (!code)
    return { success: false, error: "El código no puede estar vacío." };

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return { success: false, error: "Ya existe un cupón con ese código." };
  }

  try {
    await prisma.coupon.create({
      data: {
        code,
        type: input.type,
        value: input.type === "PERCENTAGE" ? input.value : toCents(input.value),
        active: input.active,
        minSubtotal: toCents(input.minSubtotal),
        maxUses: input.maxUses,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("createCouponAction: no se pudo crear el cupón", error);
    return { success: false, error: "No se pudo crear el cupón." };
  }
}

export async function toggleCouponActiveAction(
  id: string,
  active: boolean,
): Promise<AdminActionResult> {
  try {
    await prisma.coupon.update({ where: { id }, data: { active } });
    return { success: true };
  } catch (error) {
    console.error("toggleCouponActiveAction: no se pudo actualizar", error);
    return { success: false, error: "No se pudo actualizar el cupón." };
  }
}

export async function deleteCouponAction(
  id: string,
): Promise<AdminActionResult> {
  try {
    await prisma.coupon.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteCouponAction: no se pudo eliminar el cupón", error);
    return { success: false, error: "No se pudo eliminar el cupón." };
  }
}
