"use server";

import { prisma } from "lib/prisma";

const SETTINGS_ID = "singleton";
const DEFAULT_FREE_SHIPPING_THRESHOLD = 299900;

// Lectura mínima a propósito — mismo criterio que
// getSitewideDiscountPercentAction (lib/pricing/discount-actions.ts): no
// reusa getSettingsAction() para no disparar su refresco de TRM en cada
// carga del checkout o del carrito. Degrada al valor por defecto si la fila
// Settings no existe todavía o si falla la consulta.
export async function getFreeShippingThresholdAction(): Promise<number> {
  try {
    const row = await prisma.settings.findUnique({
      where: { id: SETTINGS_ID },
      select: { freeShippingThreshold: true },
    });
    return row?.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD;
  } catch (error) {
    console.error(
      "getFreeShippingThresholdAction: no se pudo leer el monto",
      error,
    );
    return DEFAULT_FREE_SHIPPING_THRESHOLD;
  }
}
