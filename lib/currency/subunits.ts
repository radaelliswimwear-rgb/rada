// Conversión entre el monto "de dominio" (lo que ve el usuario) y la
// subunidad que se guarda en Postgres (columnas `Int`: Product.priceValue,
// Order.total, Payment.amount, Coupon.value, etc).
//
// A diferencia del euro/dólar, el peso colombiano (COP) no tiene una
// subunidad de uso práctico (nadie cobra centavos) — por eso acá es la
// identidad, redondeando a entero, en vez de multiplicar/dividir por 100
// como haría con EUR/USD. Único lugar de esta conversión: antes estaba
// repetida como toCents()/toEuros() en seis archivos distintos, cada uno
// con su propio "* 100" — con eso, un precio de 9 cifras (999.999.999 COP)
// desbordaba el Int de Postgres al guardarse como centavos
// (99.999.999.900 > 2^31-1). Nunca reintroducir el *100 acá: la pasarela
// real de Wompi (lib/payments/providers/wompi-gateway.ts) sí necesita
// "amount_in_cents" para su API, pero esa conversión es un requisito de
// Wompi en el borde del adaptador, no de cómo guardamos internamente.
export function toSubunits(amount: number): number {
  return Math.round(amount);
}

export function fromSubunits(subunits: number): number {
  return subunits;
}
