"use server";

import { prisma } from "lib/prisma";

const SETTINGS_ID = "singleton";

// Lectura mínima a propósito: NO reusa getSettingsAction()
// (lib/currency/settings-actions.ts) porque esa función hace upsert + puede
// disparar un fetch a la TRM oficial si quedó desactualizada — costoso para
// algo que acá solo necesita un entero, y se llama una vez por cada listado
// de catálogo. Degrada a 0 (sin descuento) si la fila Settings no existe
// todavía o si falla la consulta.
export async function getSitewideDiscountPercentAction(): Promise<number> {
  try {
    const row = await prisma.settings.findUnique({
      where: { id: SETTINGS_ID },
      select: { discountPercent: true },
    });
    return row?.discountPercent ?? 0;
  } catch (error) {
    console.error(
      "getSitewideDiscountPercentAction: no se pudo leer el descuento del sitio",
      error,
    );
    return 0;
  }
}
