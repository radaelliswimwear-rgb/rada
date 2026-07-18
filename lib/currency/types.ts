export type CurrencyCode = "COP" | "USD";

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ["COP", "USD"];

// COP es la única moneda que de verdad se cobra: la pasarela (Wompi) opera
// en pesos colombianos. USD es solo una conversión de referencia para
// mostrar precios — el checkout siempre cobra en BASE_CURRENCY, sin
// importar qué moneda esté eligiendo el usuario para navegar el catálogo
// (ver components/checkout/checkout-content.tsx).
export const BASE_CURRENCY: CurrencyCode = "COP";
