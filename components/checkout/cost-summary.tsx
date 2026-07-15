import { formatPrice } from "lib/format";

export function CostSummary({
  subtotal,
  shippingCost,
  tax,
  total,
}: {
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">Envío</span>
        <span>{shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">Impuestos (IVA 21%)</span>
        <span>{formatPrice(tax)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-neutral-800">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
