export type OrderStatus = "Procesando" | "Enviado" | "Entregado" | "Cancelado";

// A diferencia de CartLine (lib/cart/types.ts), un pedido SÍ guarda una copia
// (snapshot) de nombre/precio: es un registro histórico e inmutable, debe
// reflejar lo que se cobró en su momento, no el precio actual del catálogo.
export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  priceValue: number;
};

export type Order = {
  id: string;
  userId: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
};
