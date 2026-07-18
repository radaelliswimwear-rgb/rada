"use client";

import { useCurrency } from "./currency-store";

// Selector compacto (COP/USD) para el navbar — la lista de monedas soportadas
// vive en lib/currency/types.ts, nunca hardcodeada acá.
export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as "COP" | "USD")}
      aria-label="Moneda"
      className="h-9 rounded-full border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-900 focus:outline-none"
    >
      <option value="COP">COP</option>
      <option value="USD">USD</option>
    </select>
  );
}
