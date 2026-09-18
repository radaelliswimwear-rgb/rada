"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { track } from "lib/analytics/client/track";
import { buildProductPayload } from "lib/analytics/product-payload";
import { CatalogProductCard } from "./catalog-product-card";
import { QuickViewModal } from "./quick-view-modal";

const GRID_CLASSES: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
};

export function CatalogGrid({
  products,
  columns,
}: {
  products: PlaceholderProduct[];
  columns: number;
}) {
  const [quickViewProduct, setQuickViewProduct] = useState<PlaceholderProduct | null>(
    null,
  );

  // Fase 2A de analytics (sección 6): view_item_list una vez por lista real
  // (cambia de verdad cuando cambian filtros/página, no en cada re-render) --
  // se usa la firma de ids+orden como dependencia, no la referencia del
  // array, que React Query/fetch podría recrear sin que el contenido cambie.
  const productIdsSignature = products.map((p) => p.id).join(",");
  useEffect(() => {
    if (products.length === 0) return;
    track({
      name: "view_item_list",
      products: products.slice(0, 50).map((product) =>
        buildProductPayload({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.priceValue,
          basePrice: product.originalPriceValue,
          slug: product.slug,
          sku: product.sku,
          color: product.color,
        }),
      ),
      custom: { item_list_length: products.length },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIdsSignature]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 text-center dark:border-neutral-700">
        <MagnifyingGlassIcon className="h-8 w-8 text-neutral-400" />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          No hay productos que coincidan con estos filtros.
        </p>
        <p className="text-xs text-neutral-500">
          Probá quitando algún filtro para ver más resultados.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div layout className={`grid gap-4 sm:gap-6 ${GRID_CLASSES[columns] ?? GRID_CLASSES[3]}`}>
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <CatalogProductCard
              key={product.id}
              product={product}
              index={index}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}
