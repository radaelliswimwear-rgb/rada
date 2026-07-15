"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminCategoriesRepository } from "lib/admin/categories-repository";
import type { AdminCategory } from "lib/admin/categories-actions";

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

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-500">
        Las 3 categorías de catálogo (Hombre, Mujer, Accesorios) son rutas fijas
        de la tienda — acá solo se puede renombrar el nombre visible, no crear
        ni eliminar categorías.
      </p>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Productos</th>
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
                <td className="px-4 py-3 text-neutral-500">{category.slug}</td>
                <td className="px-4 py-3">{category.productCount}</td>
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
