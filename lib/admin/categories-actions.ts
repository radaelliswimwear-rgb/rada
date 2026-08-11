"use server";

import { prisma } from "lib/prisma";
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
};

export async function listCategoriesWithCountsAction(): Promise<
  AdminCategory[]
> {
  try {
    const rows = await prisma.category.findMany({
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        active: true,
        _count: { select: { products: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      active: row.active,
      productCount: row._count.products,
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

export async function updateCategoryNameAction(
  id: string,
  name: string,
): Promise<AdminActionResult> {
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
