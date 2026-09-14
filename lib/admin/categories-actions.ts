"use server";

import { prisma } from "lib/prisma";
import { clampDiscountPercent } from "lib/pricing/discount";
import { requireAdmin } from "lib/auth/authorize";
import type { AdminActionResult } from "./types";

// Gestión de categorías (Sprint 14, ampliación): a propósito solo permite
// renombrar, no crear ni eliminar. Las 3 categorías de catálogo están
// hardcodeadas como rutas estáticas (app/hombre, app/mujer, app/accesorios,
// CATEGORY_LABELS/CATEGORY_SLUG_BY_LABEL en lib/catalog/types.ts) — crear o
// borrar categorías desde acá exigiría rutas dinámicas y tocar esa
// arquitectura, fuera de "no modifiques la arquitectura existente". Ver
// docs/sprints/SPRINT-14.md.
export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  productCount: number;
  // 0-100; 0 = sin descuento de categoría. Ver lib/pricing/discount.ts.
  discountPercent: number;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  coverImagePosX: number;
  coverImagePosY: number;
  coverImageZoom: number;
  bannerImageUrl: string | null;
  bannerImagePublicId: string | null;
  bannerImageWidth: number | null;
  bannerImageHeight: number | null;
  bannerImagePosX: number;
  bannerImagePosY: number;
  bannerImageZoom: number;
  coverVideoUrl: string | null;
  coverVideoPublicId: string | null;
  bannerVideoUrl: string | null;
  bannerVideoPublicId: string | null;
};

export async function listCategoriesWithCountsAction(): Promise<
  AdminCategory[]
> {
  await requireAdmin();
  try {
    const rows = await prisma.category.findMany({
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        active: true,
        discountPercent: true,
        coverImageUrl: true,
        coverImagePublicId: true,
        coverImageWidth: true,
        coverImageHeight: true,
        coverImagePosX: true,
        coverImagePosY: true,
        coverImageZoom: true,
        bannerImageUrl: true,
        bannerImagePublicId: true,
        bannerImageWidth: true,
        bannerImageHeight: true,
        bannerImagePosX: true,
        bannerImagePosY: true,
        bannerImageZoom: true,
        coverVideoUrl: true,
        coverVideoPublicId: true,
        bannerVideoUrl: true,
        bannerVideoPublicId: true,
        _count: { select: { products: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      active: row.active,
      productCount: row._count.products,
      discountPercent: row.discountPercent,
      coverImageUrl: row.coverImageUrl,
      coverImagePublicId: row.coverImagePublicId,
      coverImageWidth: row.coverImageWidth,
      coverImageHeight: row.coverImageHeight,
      coverImagePosX: row.coverImagePosX,
      coverImagePosY: row.coverImagePosY,
      coverImageZoom: row.coverImageZoom,
      bannerImageUrl: row.bannerImageUrl,
      bannerImagePublicId: row.bannerImagePublicId,
      bannerImageWidth: row.bannerImageWidth,
      bannerImageHeight: row.bannerImageHeight,
      bannerImagePosX: row.bannerImagePosX,
      bannerImagePosY: row.bannerImagePosY,
      bannerImageZoom: row.bannerImageZoom,
      coverVideoUrl: row.coverVideoUrl,
      coverVideoPublicId: row.coverVideoPublicId,
      bannerVideoUrl: row.bannerVideoUrl,
      bannerVideoPublicId: row.bannerVideoPublicId,
    }));
  } catch (error) {
    console.error(
      "listCategoriesWithCountsAction: no se pudieron leer las categorías",
      error,
    );
    return [];
  }
}

// Interruptor de nav/footer/home (ver components/layout/navbar/index.tsx y
// components/categories/categories-section.tsx, que leen esto en cada
// request) — no borra ni renombra la categoría, solo su visibilidad.
export async function toggleCategoryActiveAction(
  id: string,
  active: boolean,
): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    await prisma.category.update({ where: { id }, data: { active } });
    return { success: true };
  } catch (error) {
    console.error(
      "toggleCategoryActiveAction: no se pudo cambiar el estado de la categoría",
      error,
    );
    return {
      success: false,
      error: "No se pudo cambiar el estado de la categoría.",
    };
  }
}

// Dos slots de imagen independientes por categoría — mismo mecanismo,
// distinto par de columnas. "cover" es la tarjeta vertical del home,
// "banner" el banner horizontal de /[slug] (ver comentario en schema.prisma
// sobre por qué no comparten una sola foto).
export type CategoryImageSlot = "cover" | "banner";

const IMAGE_SLOT_FIELDS = {
  cover: {
    url: "coverImageUrl",
    publicId: "coverImagePublicId",
    width: "coverImageWidth",
    height: "coverImageHeight",
    posX: "coverImagePosX",
    posY: "coverImagePosY",
    zoom: "coverImageZoom",
  },
  banner: {
    url: "bannerImageUrl",
    publicId: "bannerImagePublicId",
    width: "bannerImageWidth",
    height: "bannerImageHeight",
    posX: "bannerImagePosX",
    posY: "bannerImagePosY",
    zoom: "bannerImageZoom",
  },
} as const;

// Guarda la imagen (Cloudinary) recién subida para un slot de una
// categoría, junto con su ancho/alto reales (necesarios para el cálculo de
// zoom/encuadre — ver lib/image-framing.ts). El llamador (CategoriesTable)
// es responsable de borrar el asset viejo en Cloudinary si estaba
// reemplazando uno existente — ver deleteCloudinaryAssetAction en
// lib/cloudinary/upload-actions.ts. El encuadre vuelve a su default
// (centrado, sin zoom): no tiene sentido heredar el ajuste de la foto
// anterior sobre una foto nueva.
export async function updateCategoryImageAction(
  id: string,
  slot: CategoryImageSlot,
  imageUrl: string,
  imagePublicId: string,
  imageWidth: number,
  imageHeight: number,
): Promise<AdminActionResult> {
  await requireAdmin();
  const fields = IMAGE_SLOT_FIELDS[slot];
  try {
    await prisma.category.update({
      where: { id },
      data: {
        [fields.url]: imageUrl,
        [fields.publicId]: imagePublicId,
        [fields.width]: imageWidth,
        [fields.height]: imageHeight,
        [fields.posX]: 50,
        [fields.posY]: 50,
        [fields.zoom]: 1,
      },
    });
    return { success: true };
  } catch (error) {
    console.error(
      `updateCategoryImageAction: no se pudo guardar la imagen (${slot})`,
      error,
    );
    return { success: false, error: "No se pudo guardar la imagen." };
  }
}

export async function removeCategoryImageAction(
  id: string,
  slot: CategoryImageSlot,
): Promise<AdminActionResult> {
  await requireAdmin();
  const fields = IMAGE_SLOT_FIELDS[slot];
  try {
    await prisma.category.update({
      where: { id },
      data: {
        [fields.url]: null,
        [fields.publicId]: null,
        [fields.posX]: 50,
        [fields.posY]: 50,
        [fields.zoom]: 1,
      },
    });
    return { success: true };
  } catch (error) {
    console.error(
      `removeCategoryImageAction: no se pudo quitar la imagen (${slot})`,
      error,
    );
    return { success: false, error: "No se pudo quitar la imagen." };
  }
}

// Encuadre (arrastrar + zoom) sin tocar el archivo — ver comentario en
// schema.prisma. posX/posY en % (0-100), zoom como factor (1 = sin zoom,
// tope en 3x para no pixelar demasiado una imagen ya comprimida).
export async function updateCategoryImageFramingAction(
  id: string,
  slot: CategoryImageSlot,
  posX: number,
  posY: number,
  zoom: number,
): Promise<AdminActionResult> {
  await requireAdmin();
  const fields = IMAGE_SLOT_FIELDS[slot];
  const clampedPosX = Math.min(100, Math.max(0, posX));
  const clampedPosY = Math.min(100, Math.max(0, posY));
  const clampedZoom = Math.min(3, Math.max(1, zoom));
  try {
    await prisma.category.update({
      where: { id },
      data: {
        [fields.posX]: clampedPosX,
        [fields.posY]: clampedPosY,
        [fields.zoom]: clampedZoom,
      },
    });
    return { success: true };
  } catch (error) {
    console.error(
      `updateCategoryImageFramingAction: no se pudo guardar el encuadre (${slot})`,
      error,
    );
    return { success: false, error: "No se pudo guardar el encuadre." };
  }
}

// Video en loop opcional, por slot (Sprint 22/23) — mismo mecanismo que
// updateCategoryImageAction pero sin ancho/alto/encuadre: el video se sirve
// a pantalla completa vía object-fit:cover, sin zoom/pan ajustable (ver
// comentario en schema.prisma). La imagen del mismo slot sigue existiendo
// como poster del video y como diseño de respaldo si se lo quita.
export type CategoryVideoSlot = "cover" | "banner";

const VIDEO_SLOT_FIELDS = {
  cover: { url: "coverVideoUrl", publicId: "coverVideoPublicId" },
  banner: { url: "bannerVideoUrl", publicId: "bannerVideoPublicId" },
} as const;

export async function updateCategoryVideoAction(
  id: string,
  slot: CategoryVideoSlot,
  videoUrl: string,
  videoPublicId: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const fields = VIDEO_SLOT_FIELDS[slot];
  try {
    await prisma.category.update({
      where: { id },
      data: { [fields.url]: videoUrl, [fields.publicId]: videoPublicId },
    });
    return { success: true };
  } catch (error) {
    console.error(
      `updateCategoryVideoAction: no se pudo guardar el video (${slot})`,
      error,
    );
    return { success: false, error: "No se pudo guardar el video." };
  }
}

export async function removeCategoryVideoAction(
  id: string,
  slot: CategoryVideoSlot,
): Promise<AdminActionResult> {
  await requireAdmin();
  const fields = VIDEO_SLOT_FIELDS[slot];
  try {
    await prisma.category.update({
      where: { id },
      data: { [fields.url]: null, [fields.publicId]: null },
    });
    return { success: true };
  } catch (error) {
    console.error(
      `removeCategoryVideoAction: no se pudo quitar el video (${slot})`,
      error,
    );
    return { success: false, error: "No se pudo quitar el video." };
  }
}

export async function updateCategoryNameAction(
  id: string,
  name: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "El nombre no puede estar vacío." };
  }
  try {
    await prisma.category.update({ where: { id }, data: { name: trimmed } });
    return { success: true };
  } catch (error) {
    console.error(
      "updateCategoryNameAction: no se pudo renombrar la categoría",
      error,
    );
    return { success: false, error: "No se pudo renombrar la categoría." };
  }
}

// Descuento de la colección completa (0-100, 0 = sin descuento) — ver
// lib/pricing/discount.ts. Se aplica a todos los productos de la categoría
// que no tengan su propio descuento activo.
export async function updateCategoryDiscountAction(
  id: string,
  discountPercent: number,
): Promise<AdminActionResult> {
  await requireAdmin();
  const clamped = clampDiscountPercent(discountPercent);
  try {
    await prisma.category.update({
      where: { id },
      data: { discountPercent: clamped },
    });
    return { success: true };
  } catch (error) {
    console.error(
      "updateCategoryDiscountAction: no se pudo guardar el descuento",
      error,
    );
    return { success: false, error: "No se pudo guardar el descuento." };
  }
}
