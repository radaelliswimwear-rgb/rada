"use client";

import { useCurrency } from "./currency-store";

// Envoltorio cliente para mostrar un monto (siempre en COP, la moneda base)
// reaccionando a la moneda elegida por el usuario — se puede usar dentro de
// Server Components sin convertirlos a "use client".
export function Money({
  amountCop,
  className,
}: {
  amountCop: number;
  className?: string;
}) {
  const { format } = useCurrency();
  return <span className={className}>{format(amountCop)}</span>;
}
