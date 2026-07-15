// Formato de precio compartido por carrito, pedidos y checkout. Euros con
// coma decimal (es-ES); cuando priceValue pase a centavos (ver DATABASE.md),
// este es el único punto a actualizar.
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}
