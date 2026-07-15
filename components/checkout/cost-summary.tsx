import { formatPrice } from "lib/format";

export function CostSummary({
  subtotal,
  shippingCost,
  tax,
  discount = 0,
  total,
}: {
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount?: number;
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
      {discount > 0 ? (
        <div className="flex items-center justify-between text-green-700 dark:text-green-400">
          <span>Descuento</span>
          <span>-{formatPrice(discount)}</span>
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-neutral-800">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
