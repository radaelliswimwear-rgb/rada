"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminCategoriesRepository } from "lib/admin/categories-repository";
import type { AdminCategory } from "lib/admin/categories-actions";
import { CategoryCoverUploader } from "./category-cover-uploader";
import { CategoryVideoUploader } from "./category-video-uploader";

const inputClass =
  "w-full max-w-xs rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

export function CategoriesTable({
  initialCategories,
}: {
  initialCategories: AdminCategory[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(
    null,
  );
  const [draftDiscount, setDraftDiscount] = useState("");

  const startEdit = (category: AdminCategory) => {
    setEditingId(category.id);
    setDraftName(category.name);
  };

  const onSave = async (category: AdminCategory) => {
    if (!draftName.trim()) {
      toast("El nombre no puede estar vacío.");
      return;
    }
    setPendingId(category.id);
    const result = await adminCategoriesRepository.updateName(
      category.id,
      draftName,
    );
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id ? { ...c, name: draftName.trim() } : c,
      ),
    );
    setEditingId(null);
    toast("Categoría actualizada.");
  };

  const startEditDiscount = (category: AdminCategory) => {
    setEditingDiscountId(category.id);
    setDraftDiscount(String(category.discountPercent));
  };

  const onSaveDiscount = async (category: AdminCategory) => {
    const parsed = Math.min(100, Math.max(0, Math.trunc(Number(draftDiscount))));
    if (Number.isNaN(parsed)) {
      toast("El descuento debe ser un número entre 0 y 100.");
      return;
    }
    setPendingId(category.id);
    const result = await adminCategoriesRepository.updateDiscount(
      category.id,
      parsed,
    );
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id ? { ...c, discountPercent: parsed } : c,
      ),
    );
    setEditingDiscountId(null);
    toast(
      parsed > 0
        ? `Descuento de categoría actualizado a ${parsed}%.`
        : "Descuento de categoría desactivado.",
    );
  };

  const onToggleActive = async (category: AdminCategory) => {
    setPendingId(category.id);
    const result = await adminCategoriesRepository.toggleActive(
      category.id,
      !category.active,
    );
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id ? { ...c, active: !c.active } : c,
      ),
    );
    toast(
      category.active
        ? "Categoría desactivada: ya no aparece en el menú ni en el home."
        : "Categoría activada: ya aparece en el menú y en el home.",
    );
  };

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-500">
        El nombre visible se puede renombrar libremente. El slug y la ruta de
        catálogo son fijos y no se crean ni se borran desde acá. El interruptor
        "Activa" controla si la categoría aparece en el menú superior, el
        footer y "Categorías destacadas" del home — sus productos y su página
        de catálogo siguen existiendo aunque esté desactivada.
      </p>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Portada (home)</th>
              <th className="px-4 py-3">Video (home, opcional)</th>
              <th className="px-4 py-3">Banner (colección)</th>
              <th className="px-4 py-3">Video (banner, opcional)</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Descuento (%)</th>
              <th className="px-4 py-3">Activa</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr
                key={category.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
              >
                <td className="px-4 py-3">
                  {editingId === category.id ? (
                    <input
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-medium">{category.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <CategoryCoverUploader
                    slot="cover"
                    category={category}
                    onUpdated={(next) =>
                      setCategories((prev) =>
                        prev.map((c) =>
                          c.id === category.id ? { ...c, ...next } : c,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <CategoryVideoUploader
                    slot="cover"
                    category={category}
                    onUpdated={(next) =>
                      setCategories((prev) =>
                        prev.map((c) =>
                          c.id === category.id ? { ...c, ...next } : c,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <CategoryCoverUploader
                    slot="banner"
                    category={category}
                    onUpdated={(next) =>
                      setCategories((prev) =>
                        prev.map((c) =>
                          c.id === category.id ? { ...c, ...next } : c,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <CategoryVideoUploader
                    slot="banner"
                    category={category}
                    onUpdated={(next) =>
                      setCategories((prev) =>
                        prev.map((c) =>
                          c.id === category.id ? { ...c, ...next } : c,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3 text-neutral-500">{category.slug}</td>
                <td className="px-4 py-3">{category.productCount}</td>
                <td className="px-4 py-3">
                  {editingDiscountId === category.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={draftDiscount}
                        onChange={(e) => setDraftDiscount(e.target.value)}
                        className={`${inputClass} max-w-[80px]`}
                      />
                      <button
                        type="button"
                        onClick={() => onSaveDiscount(category)}
                        disabled={pendingId === category.id}
                        className="text-xs font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDiscountId(null)}
                        className="text-xs text-neutral-500 hover:text-black dark:hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditDiscount(category)}
                      className="text-left underline-offset-4 hover:underline"
                    >
                      {category.discountPercent > 0
                        ? `-${category.discountPercent}%`
                        : "—"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={category.active}
                    onClick={() => onToggleActive(category)}
                    disabled={pendingId === category.id}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                      category.active
                        ? "bg-black dark:bg-white"
                        : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 dark:bg-black ${
                        category.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === category.id ? (
                    <div className="flex justify-end gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => onSave(category)}
                        disabled={pendingId === category.id}
                        className="font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-neutral-500 hover:text-black dark:hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="text-xs text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:hover:text-white"
                    >
                      Renombrar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
