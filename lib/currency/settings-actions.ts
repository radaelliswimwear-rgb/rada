"use server";

import { prisma } from "lib/prisma";
import { DEFAULT_COUNTRY } from "lib/region/config";
import type { AdminActionResult } from "lib/admin/types";
import { fetchOfficialTrm } from "./trm";
import type { CurrencyCode } from "./types";

export type UsdRateSource = "trm" | "manual";

export type StoreSettings = {
  defaultCountry: string;
  defaultCurrency: CurrencyCode;
  usdRate: number;
  usdRateSource: UsdRateSource;
  updatedAt: string;
};

const SETTINGS_ID = "singleton";
// La TRM colombiana se publica una vez por día hábil — refrescar más
// seguido no aporta nada y solo le pega a la API externa sin necesidad.
const TRM_STALE_AFTER_MS = 20 * 60 * 60 * 1000;

function toStoreSettings(row: {
  defaultCountry: string;
  defaultCurrency: string;
  usdRate: number;
  usdRateSource: string;
  updatedAt: Date;
}): StoreSettings {
  return {
    defaultCountry: row.defaultCountry,
    defaultCurrency: row.defaultCurrency as CurrencyCode,
    usdRate: row.usdRate,
    usdRateSource: row.usdRateSource === "manual" ? "manual" : "trm",
    updatedAt: row.updatedAt.toISOString(),
  };
}

// upsert en vez de find/create: garantiza que siempre exista exactamente
// una fila. Si el modo es "trm" y la última actualización ya quedó vieja
// (más de un día hábil), refresca sola contra la TRM oficial antes de
// devolver — así el selector de moneda del navbar siempre muestra una tasa
// vigente sin que nadie tenga que entrar al panel a actualizarla a mano.
export async function getSettingsAction(): Promise<StoreSettings> {
  try {
    const row = await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID, defaultCountry: DEFAULT_COUNTRY },
    });

    const isStale = Date.now() - row.updatedAt.getTime() > TRM_STALE_AFTER_MS;
    if (row.usdRateSource !== "manual" && isStale) {
      const trm = await fetchOfficialTrm();
      if (trm) {
        const updated = await prisma.settings.update({
          where: { id: SETTINGS_ID },
          data: { usdRate: trm, usdRateSource: "trm" },
        });
        return toStoreSettings(updated);
      }
    }
    return toStoreSettings(row);
  } catch (error) {
    console.error("getSettingsAction: no se pudo leer la configuración", error);
    return {
      defaultCountry: DEFAULT_COUNTRY,
      defaultCurrency: "COP",
      usdRate: 4000,
      usdRateSource: "trm",
      updatedAt: new Date().toISOString(),
    };
  }
}

// El admin fija un valor a mano — a partir de acá deja de autoactualizarse
// contra la TRM hasta que alguien vuelva a activar el modo automático
// (syncTrmRateAction).
export async function updateUsdRateAction(
  usdRate: number,
): Promise<AdminActionResult> {
  if (!Number.isFinite(usdRate) || usdRate <= 0) {
    return { success: false, error: "La tasa debe ser un número mayor a 0." };
  }
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: { usdRate, usdRateSource: "manual" },
      create: {
        id: SETTINGS_ID,
        defaultCountry: DEFAULT_COUNTRY,
        usdRate,
        usdRateSource: "manual",
      },
    });
    return { success: true };
  } catch (error) {
    console.error("updateUsdRateAction: no se pudo guardar la tasa", error);
    return { success: false, error: "No se pudo guardar la tasa." };
  }
}

// Vuelve a modo automático y trae la TRM oficial ya mismo (en vez de
// esperar a que se cumpla TRM_STALE_AFTER_MS) — usado por el botón
// "Actualizar ahora" del panel.
export async function syncTrmRateAction(): Promise<AdminActionResult> {
  const trm = await fetchOfficialTrm();
  if (!trm) {
    return {
      success: false,
      error: "No se pudo consultar la TRM oficial en este momento.",
    };
  }
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: { usdRate: trm, usdRateSource: "trm" },
      create: {
        id: SETTINGS_ID,
        defaultCountry: DEFAULT_COUNTRY,
        usdRate: trm,
        usdRateSource: "trm",
      },
    });
    return { success: true };
  } catch (error) {
    console.error("syncTrmRateAction: no se pudo guardar la tasa", error);
    return { success: false, error: "No se pudo guardar la tasa." };
  }
}
