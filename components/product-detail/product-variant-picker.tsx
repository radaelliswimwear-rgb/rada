"use client";

import { useLocalCart } from "components/cart-drawer/cart-store";
import { BackInStockButton } from "components/product-detail/back-in-stock-button";
import { SizeGuideModal } from "components/product-detail/size-guide-modal";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import type { SizeGuideImage } from "lib/currency/settings-actions";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { formatShoeSize, usesShoeSizeSystem } from "lib/catalog/shoe-sizes";
import { trackCustom } from "lib/analytics/client/track";

export function ProductVariantPicker({
  product,
  onAdded,
  totalStock,
  sizeGuideImage,
  // Viene de ?talla= en la URL (ver app/producto/[slug]/page.tsx) — así el
  // link "Comprar ahora" del correo de "Avísame cuando vuelva" abre la
  // ficha con la talla que la clienta pidió ya seleccionada. Se ignora si
  // no es una talla real de este producto.
  initialSize,
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
  initialSize?: string;
}) {
  const isSoldOut = (totalStock ?? product.totalStock ?? 1) <= 0;
  const hasMultipleSizes = product.sizes.length > 1;
  const isShoeSize = usesShoeSizeSystem(product.category, product.sizes);
  const validInitialSize =
    initialSize && product.sizes.includes(initialSize) ? initialSize : null;
  const [selectedSize, setSelectedSize] = useState<string | null>(
    validInitialSize ?? (hasMultipleSizes ? null : product.sizes[0] ?? null),
  );
  const { addItem } = useLocalCart();

  // Stock de la talla elegida (o de la única talla, si el producto no
  // maneja varias) — es lo que decide si se muestra "Añadir al carrito" o
  // "Avísame cuando vuelva", no el stock agregado del producto.
  const selectedSizeStock = selectedSize
    ? product.sizeStock?.[selectedSize]
    : undefined;
  const isSelectedSizeOutOfStock =
    selectedSize !== null && selectedSizeStock !== undefined && selectedSizeStock <= 0;

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
                  // Las tallas agotadas SÍ se pueden elegir (a diferencia de
                  // antes) — es la única forma de que la clienta llegue al
                  // botón "Avísame cuando vuelva" para esa talla exacta. Lo
                  // que se bloquea es agregarla al carrito, no seleccionarla.
                  onClick={() => {
                    setSelectedSize(size);
                    trackCustom("select_size", {
                      product_id: product.id,
                      product_name: product.name,
                      size,
                      price: product.priceValue,
                      availability: isOutOfStock ? "out_of_stock" : "in_stock",
                    });
                  }}
                  aria-pressed={isActive}
                  aria-disabled={isOutOfStock}
                  title={isOutOfStock ? "Talla agotada" : undefined}
                  className={clsx(
                    "flex min-w-[48px] items-center justify-center rounded-full border px-3 py-2 text-sm transition-colors duration-200",
                    isOutOfStock
                      ? isActive
                        ? "border-neutral-400 text-neutral-400 line-through"
                        : "border-neutral-200 text-neutral-300 line-through hover:border-neutral-400"
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

      {selectedSize && isSelectedSizeOutOfStock ? (
        <BackInStockButton productId={product.id} size={selectedSize} />
      ) : (
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
      )}
    </div>
  );
}
