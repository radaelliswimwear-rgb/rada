"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { adminProductsRepository } from "lib/admin/products-repository";
import type { AdminProductImage, AdminProductInput } from "lib/admin/types";
import { CATEGORY_LABELS } from "lib/catalog/types";
import { ProductImageManager } from "./product-image-manager";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";
const labelClass =
  "mb-1.5 block text-xs uppercase tracking-[0.15em] text-neutral-500";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_FORM: AdminProductInput = {
  slug: "",
  name: "",
  category: "Hombre",
  priceValue: 0,
  color: "",
  description: "",
  featured: false,
  images: [],
  sizes: [],
};

export function ProductForm({
  productId,
  initialValues,
}: {
  productId?: string;
  initialValues?: AdminProductInput;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdminProductInput>(
    initialValues ?? EMPTY_FORM,
  );
  const [images, setImages] = useState<AdminProductImage[]>(
    initialValues?.images ?? [],
  );
  const [sizesText, setSizesText] = useState(
    (initialValues?.sizes ?? []).join(", "),
  );
  // En edición el slug ya está fijado por el producto existente; en creación
  // se auto-genera desde el nombre hasta que el usuario lo toque a mano.
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const sizes = sizesText
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean);

    if (images.length === 0) {
      setError("Agregá al menos una imagen.");
      return;
    }
    if (sizes.length === 0) {
      setError("Agregá al menos una talla (separadas por coma).");
      return;
    }

    const input: AdminProductInput = { ...form, images, sizes };

    setIsSubmitting(true);
    try {
      const result = productId
        ? await adminProductsRepository.update(productId, input)
        : await adminProductsRepository.create(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast(productId ? "Producto actualizado." : "Producto creado.");
      router.push("/admin/productos");
      router.refresh();
    } catch {
      setError("No se pudo guardar el producto. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid max-w-2xl gap-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
    >
      <div>
        <label htmlFor="name" className={labelClass}>
          Nombre
        </label>
        <input
          id="name"
          required
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            setForm((prev) => ({
              ...prev,
              name,
              slug: slugTouched ? prev.slug : slugify(name),
            }));
          }}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="slug" className={labelClass}>
          Slug (URL)
        </label>
        <input
          id="slug"
          required
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm({ ...form, slug: e.target.value });
          }}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={labelClass}>
            Categoría
          </label>
          <select
            id="category"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as typeof form.category,
              })
            }
            className={inputClass}
          >
            {CATEGORY_LABELS.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priceValue" className={labelClass}>
            Precio (€)
          </label>
          <input
            id="priceValue"
            type="number"
            required
            min={0}
            step={0.01}
            value={form.priceValue}
            onChange={(e) =>
              setForm({ ...form, priceValue: Number(e.target.value) })
            }
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="color" className={labelClass}>
          Color
        </label>
        <input
          id="color"
          required
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="sizes" className={labelClass}>
          Tallas (separadas por coma)
        </label>
        <input
          id="sizes"
          required
          placeholder="S, M, L"
          value={sizesText}
          onChange={(e) => setSizesText(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <p className={labelClass}>Imágenes</p>
        <ProductImageManager value={images} onChange={setImages} />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="featured"
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-600"
        />
        <label
          htmlFor="featured"
          className="text-sm text-neutral-600 dark:text-neutral-400"
        >
          Mostrar en "Productos destacados" de la Home
        </label>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {isSubmitting
            ? "Guardando..."
            : productId
              ? "Guardar cambios"
              : "Crear producto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/productos")}
          className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm text-black dark:border-neutral-700 dark:text-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
