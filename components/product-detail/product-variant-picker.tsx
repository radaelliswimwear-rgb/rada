"use client";

import { useLocalCart } from "components/cart-drawer/cart-store";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { formatShoeSize, usesShoeSizeSystem } from "lib/catalog/shoe-sizes";

export function ProductVariantPicker({
  product,
  onAdded,
  totalStock,
}: {
  product: PlaceholderProduct;
  onAdded?: () => void;
  // Si no se pasa explícitamente (p. ej. desde Quick View, que no siempre
  // trae el stock agregado a mano) se asume disponible — la fuente real
  // de verdad es product.totalStock cuando existe.
  totalStock?: number;
}) {
  const isSoldOut = (totalStock ?? product.totalStock ?? 1) <= 0;
  const hasMultipleSizes = product.sizes.length > 1;
  const isShoeSize = usesShoeSizeSystem(product.category, product.sizes);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    hasMultipleSizes ? null : product.sizes[0] ?? null,
  );
  const { addItem } = useLocalCart();

  return (
    <div>
      <p className="mb-6 text-xs uppercase tracking-[0.2em] text-neutral-500">
        Color — {product.color}
      </p>

      {hasMultipleSizes ? (
        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
            Talla
            {isShoeSize ? " (CO · US · UK · CM)" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const isActive = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={isActive}
                  className={clsx(
                    "flex min-w-[48px] items-center justify-center rounded-full border px-3 py-2 text-sm transition-colors duration-200",
                    isActive
                      ? "border-brand-crimson bg-brand-crimson text-white"
                      : "border-neutral-300 text-neutral-700 hover:border-brand-crimson",
                  )}
                >
                  {isShoeSize
                    ? formatShoeSize(size, product.category === "Niños")
                    : size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={isSoldOut}
        aria-disabled={isSoldOut}
        onClick={() => {
          if (isSoldOut) return;
          if (hasMultipleSizes && !selectedSize) {
            toast("Elegí una talla antes de continuar.");
            return;
          }
          addItem(product, selectedSize!, 1);
          onAdded?.();
        }}
        className="flex w-full items-center justify-center rounded-full bg-brand-coral p-4 text-sm font-medium tracking-wide text-white transition-colors duration-200 hover:bg-brand-crimson disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:hover:bg-neutral-300"
      >
        {isSoldOut ? "Producto agotado" : "Añadir al carrito"}
      </button>
    </div>
  );
}
