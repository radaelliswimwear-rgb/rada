"use client";

import {
  ArchiveBoxArrowDownIcon,
  ArchiveBoxXMarkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { adminProductsRepository } from "lib/admin/products-repository";
import type { AdminProduct } from "lib/admin/types";
import { formatPrice } from "lib/format";
import { Pagination } from "./pagination";
import { SearchInput } from "./search-input";

const PAGE_SIZE = 10;

export function ProductsTable({
  initialProducts,
}: {
  initialProducts: AdminProduct[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [pendingId, setPendingId] = useState<string | null>(null);
  // Confirmación en dos pasos dentro de la fila en vez de window.confirm():
  // ningún otro componente del proyecto usa diálogos nativos del navegador
  // (ver components/account/addresses-manager.tsx), así que se mantiene el
  // mismo criterio acá.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [
        product.name,
        product.slug,
        product.category,
        product.color,
        product.sku ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [products, query]);

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

  const onDelete = async (product: AdminProduct) => {
    if (confirmingId !== product.id) {
      setConfirmingId(product.id);
      return;
    }
    setConfirmingId(null);
    setPendingId(product.id);
    const result = await adminProductsRepository.remove(product.id);
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      if (result.error.includes("Se archivó")) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, active: false } : p)),
        );
      }
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    toast("Producto eliminado.");
  };

  const onToggleActive = async (product: AdminProduct) => {
    setPendingId(product.id);
    const result = await adminProductsRepository.toggleActive(
      product.id,
      !product.active,
    );
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)),
    );
    toast(product.active ? "Producto archivado." : "Producto reactivado.");
  };

  return (
    <div>
      <div className="mb-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={onSearch}
          placeholder="Buscar por nombre, slug, SKU, categoría o color..."
        />
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 dark:bg-white dark:text-black"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo producto
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            {products.length === 0
              ? "No hay productos todavía."
              : "Ningún producto coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Descuento</th>
                <th className="px-4 py-3">Tallas</th>
                <th className="px-4 py-3">Destacado</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-neutral-500">{product.slug}</p>
                    {product.sku ? (
                      <p className="text-xs text-neutral-400">
                        SKU: {product.sku}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{product.category}</td>
                  <td className="px-4 py-3">
                    {formatPrice(product.priceValue)}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {product.discountPercent > 0
                      ? `-${product.discountPercent}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {product.variants.map((v) => v.size).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    {product.featured ? "Sí" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.active
                          ? "rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500 dark:bg-neutral-800"
                      }
                    >
                      {product.active ? "Activo" : "Archivado"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        aria-label="Editar producto"
                        className="text-neutral-500 hover:text-black dark:hover:text-white"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onToggleActive(product)}
                        disabled={pendingId === product.id}
                        aria-label={
                          product.active ? "Archivar producto" : "Reactivar producto"
                        }
                        title={product.active ? "Archivar" : "Reactivar"}
                        className="text-neutral-500 hover:text-black disabled:opacity-50 dark:hover:text-white"
                      >
                        {product.active ? (
                          <ArchiveBoxArrowDownIcon className="h-4 w-4" />
                        ) : (
                          <ArchiveBoxXMarkIcon className="h-4 w-4" />
                        )}
                      </button>
                      {confirmingId === product.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onDelete(product)}
                            disabled={pendingId === product.id}
                            className="text-xs font-medium text-red-600 underline-offset-4 hover:underline disabled:opacity-50"
                          >
                            ¿Eliminar?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="text-xs text-neutral-500 hover:text-black dark:hover:text-white"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDelete(product)}
                          aria-label="Eliminar producto"
                          className="text-neutral-500 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
