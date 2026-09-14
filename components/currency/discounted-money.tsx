"use client";

import { useCurrency } from "./currency-store";

// Reemplazo drop-in de <Money> (mismo mecanismo: reacciona a la moneda
// elegida por el usuario) que además sabe mostrar un descuento activo —
// precio nuevo + precio de lista tachado + etiqueta "-X%". Sin descuento
// activo, se ve exactamente igual que <Money amountCop={amountCop} />.
export function DiscountedMoney({
  amountCop,
  originalAmountCop,
  discountPercent,
  className,
}: {
  amountCop: number;
  originalAmountCop: number;
  discountPercent: number;
  className?: string;
}) {
  const { format } = useCurrency();

  if (discountPercent <= 0 || originalAmountCop <= amountCop) {
    return <span className={className}>{format(amountCop)}</span>;
  }

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-1.5 ${className ?? ""}`}>
      <span>{format(amountCop)}</span>
      <span className="text-xs text-neutral-400 line-through">
        {format(originalAmountCop)}
      </span>
      <span className="rounded-full bg-brand-crimson px-1.5 py-0.5 text-[10px] font-medium text-white">
        -{discountPercent}%
      </span>
    </span>
  );
}
