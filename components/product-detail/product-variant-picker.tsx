"use client";

import { useLocalCart } from "components/cart-drawer/cart-store";
import { SizeGuideModal } from "components/product-detail/size-guide-modal";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import type { SizeGuideImage } from "lib/currency/settings-actions";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { formatShoeSize, usesShoeSizeSystem } from "lib/catalog/shoe-sizes";

export function ProductVariantPicker({
  product,
  onAdded,
  totalStock,
  sizeGuideImage,
}: {
  product: PlaceholderProduct;
  onAdded?: () => void;
  // Si no se pasa explícitamente (p. ej. desde Quick View, que no siempre
  // trae el stock agregado a mano) se asume disponible — la fuente real
  // de verdad es product.totalStock cuando existe.
  totalStock?: number;
  // Solo la ficha completa la trae (ver product-detail.tsx) — Quick View
  // no muestra el botón de guía de tallas para no saturar ese resumen
  // compacto. null mientras nadie la haya subido en /admin/configuracion.
  sizeGuideImage?: SizeGuideImage | null;
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
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Talla
              {isShoeSize ? " (CO · US · UK · CM)" : ""}
            </p>
            {sizeGuideImage ? <SizeGuideModal image={sizeGuideImage} /> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const isActive = selectedSize === size;
              // Sin dato de stock por talla (p. ej. catálogo demo estático)
              // se asume disponible — la fuente real siempre trae sizeStock.
              const stock = product.sizeStock?.[size];
              const isOutOfStock = stock !== undefined && stock <= 0;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => !isOutOfStock && setSelectedSize(size)}
                  disabled={isOutOfStock}
                  aria-pressed={isActive}
                  aria-disabled={isOutOfStock}
                  title={isOutOfStock ? "Talla agotada" : undefined}
                  className={clsx(
                    "flex min-w-[48px] items-center justify-center rounded-full border px-3 py-2 text-sm transition-colors duration-200",
                    isOutOfStock
                      ? "cursor-not-allowed border-neutral-200 text-neutral-300 line-through"
                      : isActive
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
        className="flex w-full items-center justify-center rounded-full bg-brand-crimson p-4 text-sm font-medium uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:hover:opacity-100"
      >
        {isSoldOut ? "Producto agotado" : "Añadir al carrito"}
      </button>
    </div>
  );
}
