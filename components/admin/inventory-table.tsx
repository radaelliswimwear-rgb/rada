"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { adminInventoryRepository } from "lib/admin/inventory-repository";
import type { AdminVariantRow } from "lib/admin/inventory-actions";
import { Pagination } from "./pagination";
import { SearchInput } from "./search-input";

const PAGE_SIZE = 15;
const LOW_STOCK_THRESHOLD = 5;

export function InventoryTable({
  initialVariants,
}: {
  initialVariants: AdminVariantRow[];
}) {
  const [variants, setVariants] = useState(initialVariants);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return variants;
    return variants.filter((variant) =>
      [variant.productName, variant.productSlug, variant.size]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [variants, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const onSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const onSave = async (variant: AdminVariantRow) => {
    const draft = drafts[variant.id];
    const stock = Number(draft);
    if (draft === undefined || !Number.isInteger(stock) || stock < 0) {
      toast("El stock debe ser un entero mayor o igual a 0.");
      return;
    }
    setPendingId(variant.id);
    const result = await adminInventoryRepository.updateStock(
      variant.id,
      stock,
    );
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setVariants((prev) =>
      prev.map((v) => (v.id === variant.id ? { ...v, stock } : v)),
    );
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[variant.id];
      return next;
    });
    toast("Stock actualizado.");
  };

  if (variants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">
          No hay tallas cargadas todavía.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={onSearch}
          placeholder="Buscar por producto o talla..."
        />
        <p className="text-xs text-neutral-500">
          Ordenado por stock ascendente — lo que menos hay aparece primero.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            Ninguna talla coincide con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Talla</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((variant) => {
                const draft = drafts[variant.id];
                const hasDraft = draft !== undefined && draft !== "";
                return (
                  <tr
                    key={variant.id}
                    className={clsx(
                      "border-b border-neutral-100 last:border-0 dark:border-neutral-900",
                      variant.stock <= LOW_STOCK_THRESHOLD &&
                        "bg-red-50 dark:bg-red-950/20",
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{variant.productName}</p>
                      <p className="text-xs text-neutral-500">
                        {variant.productSlug}
                      </p>
                    </td>
                    <td className="px-4 py-3">{variant.size}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={draft ?? variant.stock}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [variant.id]: e.target.value,
                          }))
                        }
                        className="w-20 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:focus:ring-white/20"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSave(variant)}
                        disabled={!hasDraft || pendingId === variant.id}
                        className="text-xs font-medium text-black underline-offset-4 hover:underline disabled:opacity-30 dark:text-white"
                      >
                        Guardar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
