import { formatCOP } from "lib/currency/format";
import { DEFAULT_LOCALE } from "lib/region/config";

// Formato de precio compartido por carrito, pedidos, checkout y panel
// administrativo — siempre en la moneda base (COP, lib/currency/types.ts).
// Superficies con selector de moneda (catálogo, ficha de producto,
// carrito, checkout) usan en cambio <Money> (components/currency/money.tsx),
// que sí reacciona a COP/USD.
export function formatPrice(amount: number): string {
  return formatCOP(amount);
}

// Fecha compartida por historial de pedidos, panel admin y blog — antes
// duplicada en más de nueve archivos, cada uno con su propio "es-ES".
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(DEFAULT_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
