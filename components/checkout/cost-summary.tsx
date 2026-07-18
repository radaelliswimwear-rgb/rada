import { Money } from "components/currency/money";
import { TAX_RATE } from "lib/checkout/pricing";

const TAX_RATE_LABEL = `${Math.round(TAX_RATE * 100)}%`;

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
        <Money amountCop={subtotal} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">Envío</span>
        {shippingCost === 0 ? <span>Gratis</span> : <Money amountCop={shippingCost} />}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">Impuestos (IVA {TAX_RATE_LABEL})</span>
        <Money amountCop={tax} />
      </div>
      {discount > 0 ? (
        <div className="flex items-center justify-between text-green-700 dark:text-green-400">
          <span>Descuento</span>
          <span>-<Money amountCop={discount} /></span>
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-neutral-800">
        <span>Total</span>
        <Money amountCop={total} />
      </div>
    </div>
  );
}
