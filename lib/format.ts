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

// Fecha + hora en el huso horario real del negocio (Sprint 31) — antes vivía
// duplicado como función privada en lib/email/templates.ts, usado solo ahí.
// A diferencia de formatDate(), fija `timeZone: "America/Bogota"` a
// propósito: el pedido lo puede ver alguien en cualquier huso horario (o,
// para este helper, el propio servidor en un datacenter con otro huso), y
// la hora mostrada tiene que ser siempre la hora real de Colombia, nunca la
// del dispositivo o servidor que renderiza — mismo criterio que ya usan los
// emails transaccionales.
const BUSINESS_TIME_ZONE = "America/Bogota";

export function formatOrderDateTime(iso: string): {
  date: string;
  time: string;
} {
  const value = new Date(iso);
  return {
    date: value.toLocaleDateString(DEFAULT_LOCALE, {
      timeZone: BUSINESS_TIME_ZONE,
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: value.toLocaleTimeString(DEFAULT_LOCALE, {
      timeZone: BUSINESS_TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}
