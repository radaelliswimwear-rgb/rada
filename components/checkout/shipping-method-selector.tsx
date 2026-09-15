"use client";

import clsx from "clsx";
import { SHIPPING_METHODS } from "lib/checkout/shipping-methods";
import type { ShippingMethodId } from "lib/orders/types";

// La condición del envío (gratis desde cierto monto, o "por confirmar")
// vive en el resumen de costos (ver CostSummary) — acá solo se elige la
// velocidad de entrega preferida, sin repetir esa explicación dos veces.
export function ShippingMethodSelector({
  selected,
  onChange,
}: {
  selected: ShippingMethodId;
  onChange: (id: ShippingMethodId) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {SHIPPING_METHODS.map((method) => {
        const isSelected = selected === method.id;
        return (
          <label
            key={method.id}
            className={clsx(
              "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors duration-200",
              isSelected
                ? "border-black dark:border-white"
                : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600",
            )}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping-method"
                checked={isSelected}
                onChange={() => onChange(method.id)}
                className="h-4 w-4 border-neutral-300 text-black focus:ring-black dark:border-neutral-600"
              />
              <span>
                <span className="block text-sm font-medium">{method.name}</span>
                <span className="block text-xs text-neutral-500">
                  {method.description}
                </span>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
