import { DEFAULT_LOCALE } from "lib/region/config";
import type { CurrencyCode } from "./types";

// Único punto de formateo/conversión de moneda de toda la tienda — evita
// tasas o formatos de Intl repetidos por componente (Sprint 18).
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

// `amountCop` siempre es la moneda base (ver types.ts) — nunca conviertas
// un valor que ya pasó por acá una vez.
export function convertCopToUsd(amountCop: number, usdRate: number): number {
  if (usdRate <= 0) return 0;
  return amountCop / usdRate;
}

export function formatMoney(
  amountCop: number,
  currency: CurrencyCode,
  usdRate: number,
): string {
  if (currency === "USD") {
    return formatUSD(convertCopToUsd(amountCop, usdRate));
  }
  return formatCOP(amountCop);
}
