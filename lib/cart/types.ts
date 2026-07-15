// Forma pensada para mapear 1:1 a una futura tabla `CartLine` en Postgres/Prisma:
// productId -> CartLine.productId (FK a Product), size/quantity -> columnas propias.
// No se guarda nombre/imagen/precio del producto (evita datos denormalizados que
// quedarían obsoletos si el producto cambia) — se resuelven en vivo desde el catálogo.
export type CartLine = {
  id: string; // `${productId}-${size}`
  productId: string;
  size: string;
  quantity: number;
  createdAt: string;
};
