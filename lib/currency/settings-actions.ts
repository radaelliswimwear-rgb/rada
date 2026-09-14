"use server";

import { prisma } from "lib/prisma";
import { DEFAULT_COUNTRY } from "lib/region/config";
import type { AdminActionResult } from "lib/admin/types";
import { clampDiscountPercent } from "lib/pricing/discount";
import { fetchOfficialTrm } from "./trm";
import type { CurrencyCode } from "./types";

export type UsdRateSource = "trm" | "manual";

export type SizeGuideImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

export type HeroMedia = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

// Todos opcionales: el Hero cae al texto de marca fijo actual para
// cualquier campo que la fundadora deje vacío, así nunca queda una portada
// con huecos de texto mientras arma el mensaje de la colección del momento.
export type HeroText = {
  eyebrow: string | null;
  headline: string | null;
  subheadline: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export type StoreSettings = {
  defaultCountry: string;
  defaultCurrency: CurrencyCode;
  usdRate: number;
  usdRateSource: UsdRateSource;
  sizeGuideImage: SizeGuideImage | null;
  heroVideo: HeroMedia | null;
  heroPoster: HeroMedia | null;
  heroText: HeroText;
  // 0-100; 0 = sin descuento del sitio. Último nivel de la cascada
  // producto > categoría > sitio — ver lib/pricing/discount.ts.
  discountPercent: number;
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
  sizeGuideImageUrl: string | null;
  sizeGuideImagePublicId: string | null;
  sizeGuideImageWidth: number | null;
  sizeGuideImageHeight: number | null;
  heroVideoUrl: string | null;
  heroVideoPublicId: string | null;
  heroPosterUrl: string | null;
  heroPosterPublicId: string | null;
  heroPosterWidth: number | null;
  heroPosterHeight: number | null;
  heroEyebrow: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  heroCtaLabel: string | null;
  heroCtaHref: string | null;
  discountPercent: number;
  updatedAt: Date;
}): StoreSettings {
  return {
    defaultCountry: row.defaultCountry,
    defaultCurrency: row.defaultCurrency as CurrencyCode,
    usdRate: row.usdRate,
    usdRateSource: row.usdRateSource === "manual" ? "manual" : "trm",
    sizeGuideImage:
      row.sizeGuideImageUrl &&
      row.sizeGuideImagePublicId &&
      row.sizeGuideImageWidth &&
      row.sizeGuideImageHeight
        ? {
            url: row.sizeGuideImageUrl,
            publicId: row.sizeGuideImagePublicId,
            width: row.sizeGuideImageWidth,
            height: row.sizeGuideImageHeight,
          }
        : null,
    // El video no tiene columnas de ancho/alto propias (no hace falta un
    // framing especial, se muestra a pantalla completa vía object-fit) —
    // basta con url + publicId para considerarlo "configurado".
    heroVideo:
      row.heroVideoUrl && row.heroVideoPublicId
        ? { url: row.heroVideoUrl, publicId: row.heroVideoPublicId, width: 0, height: 0 }
        : null,
    heroPoster:
      row.heroPosterUrl &&
      row.heroPosterPublicId &&
      row.heroPosterWidth &&
      row.heroPosterHeight
        ? {
            url: row.heroPosterUrl,
            publicId: row.heroPosterPublicId,
            width: row.heroPosterWidth,
            height: row.heroPosterHeight,
          }
        : null,
    heroText: {
      eyebrow: row.heroEyebrow,
      headline: row.heroHeadline,
      subheadline: row.heroSubheadline,
      ctaLabel: row.heroCtaLabel,
      ctaHref: row.heroCtaHref,
    },
    discountPercent: row.discountPercent,
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
      sizeGuideImage: null,
      heroVideo: null,
      heroPoster: null,
      heroText: {
        eyebrow: null,
        headline: null,
        subheadline: null,
        ctaLabel: null,
        ctaHref: null,
      },
      discountPercent: 0,
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

// Guía de tallas única para toda la tienda — se sube una sola vez acá y se
// reutiliza en la ficha de cada producto (ver SizeGuideModal), en vez de
// subirla como una foto más dentro de la galería de cada prenda.
export async function updateSizeGuideImageAction(
  url: string,
  publicId: string,
  width: number,
  height: number,
): Promise<AdminActionResult> {
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        sizeGuideImageUrl: url,
        sizeGuideImagePublicId: publicId,
        sizeGuideImageWidth: width,
        sizeGuideImageHeight: height,
      },
      create: {
        id: SETTINGS_ID,
        defaultCountry: DEFAULT_COUNTRY,
        sizeGuideImageUrl: url,
        sizeGuideImagePublicId: publicId,
        sizeGuideImageWidth: width,
        sizeGuideImageHeight: height,
      },
    });
    return { success: true };
  } catch (error) {
    console.error(
      "updateSizeGuideImageAction: no se pudo guardar la guía de tallas",
      error,
    );
    return { success: false, error: "No se pudo guardar la guía de tallas." };
  }
}

export async function removeSizeGuideImageAction(): Promise<AdminActionResult> {
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        sizeGuideImageUrl: null,
        sizeGuideImagePublicId: null,
        sizeGuideImageWidth: null,
        sizeGuideImageHeight: null,
      },
      create: { id: SETTINGS_ID, defaultCountry: DEFAULT_COUNTRY },
    });
    return { success: true };
  } catch (error) {
    console.error(
      "removeSizeGuideImageAction: no se pudo quitar la guía de tallas",
      error,
    );
    return { success: false, error: "No se pudo quitar la guía de tallas." };
  }
}

// Video de portada del home — igual criterio que la guía de tallas: se sube
// una sola vez acá y components/home/hero.tsx lo usa como fondo en vez del
// diseño de manchas pastel + texto fijo.
export async function updateHeroVideoAction(
  url: string,
  publicId: string,
): Promise<AdminActionResult> {
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: { heroVideoUrl: url, heroVideoPublicId: publicId },
      create: {
        id: SETTINGS_ID,
        defaultCountry: DEFAULT_COUNTRY,
        heroVideoUrl: url,
        heroVideoPublicId: publicId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("updateHeroVideoAction: no se pudo guardar el video", error);
    return { success: false, error: "No se pudo guardar el video." };
  }
}

export async function removeHeroVideoAction(): Promise<AdminActionResult> {
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: { heroVideoUrl: null, heroVideoPublicId: null },
      create: { id: SETTINGS_ID, defaultCountry: DEFAULT_COUNTRY },
    });
    return { success: true };
  } catch (error) {
    console.error("removeHeroVideoAction: no se pudo quitar el video", error);
    return { success: false, error: "No se pudo quitar el video." };
  }
}

// Imagen de respaldo que se ve mientras el video carga (o si el navegador
// no puede reproducirlo) — opcional, si no se sube ninguna el <video> usa
// su propio primer cuadro.
export async function updateHeroPosterAction(
  url: string,
  publicId: string,
  width: number,
  height: number,
): Promise<AdminActionResult> {
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        heroPosterUrl: url,
        heroPosterPublicId: publicId,
        heroPosterWidth: width,
        heroPosterHeight: height,
      },
      create: {
        id: SETTINGS_ID,
        defaultCountry: DEFAULT_COUNTRY,
        heroPosterUrl: url,
        heroPosterPublicId: publicId,
        heroPosterWidth: width,
        heroPosterHeight: height,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("updateHeroPosterAction: no se pudo guardar el póster", error);
    return { success: false, error: "No se pudo guardar la imagen." };
  }
}

export async function removeHeroPosterAction(): Promise<AdminActionResult> {
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        heroPosterUrl: null,
        heroPosterPublicId: null,
        heroPosterWidth: null,
        heroPosterHeight: null,
      },
      create: { id: SETTINGS_ID, defaultCountry: DEFAULT_COUNTRY },
    });
    return { success: true };
  } catch (error) {
    console.error("removeHeroPosterAction: no se pudo quitar el póster", error);
    return { success: false, error: "No se pudo quitar la imagen." };
  }
}

// Texto superpuesto de la portada — cada campo es independiente y opcional;
// un string vacío se guarda como null para que el Hero caiga a su texto de
// marca fijo en vez de mostrar un hueco vacío.
export async function updateHeroTextAction(input: {
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
}): Promise<AdminActionResult> {
  const toNullable = (value: string) => value.trim() || null;
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        heroEyebrow: toNullable(input.eyebrow),
        heroHeadline: toNullable(input.headline),
        heroSubheadline: toNullable(input.subheadline),
        heroCtaLabel: toNullable(input.ctaLabel),
        heroCtaHref: toNullable(input.ctaHref),
      },
      create: {
        id: SETTINGS_ID,
        defaultCountry: DEFAULT_COUNTRY,
        heroEyebrow: toNullable(input.eyebrow),
        heroHeadline: toNullable(input.headline),
        heroSubheadline: toNullable(input.subheadline),
        heroCtaLabel: toNullable(input.ctaLabel),
        heroCtaHref: toNullable(input.ctaHref),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("updateHeroTextAction: no se pudo guardar el texto", error);
    return { success: false, error: "No se pudo guardar el texto." };
  }
}

// Descuento de todo el sitio (0-100, 0 = sin descuento) — último nivel de
// la cascada producto > categoría > sitio, ver lib/pricing/discount.ts.
export async function updateSitewideDiscountAction(
  discountPercent: number,
): Promise<AdminActionResult> {
  if (
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    return {
      success: false,
      error: "El descuento debe ser un número entre 0 y 100.",
    };
  }
  const clamped = clampDiscountPercent(discountPercent);
  try {
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: { discountPercent: clamped },
      create: {
        id: SETTINGS_ID,
        defaultCountry: DEFAULT_COUNTRY,
        discountPercent: clamped,
      },
    });
    return { success: true };
  } catch (error) {
    console.error(
      "updateSitewideDiscountAction: no se pudo guardar el descuento",
      error,
    );
    return { success: false, error: "No se pudo guardar el descuento." };
  }
}
