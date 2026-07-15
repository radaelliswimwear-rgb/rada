import { products } from "lib/placeholder-data";
import type { Order, OrderStatus } from "./types";

// Repositorio de pedidos. Hoy genera datos simulados de forma determinística
// por usuario (mismo userId -> mismos pedidos, sin persistir nada). Pensado
// para reemplazarse por una consulta real (Prisma o API de Shopify Orders)
// sin tocar components/account/order-history.tsx — misma firma async.
const STATUSES: OrderStatus[] = ["Entregado", "Enviado", "Procesando"];

function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export const ordersRepository = {
  async listByUser(userId: string): Promise<Order[]> {
    const seed = seedFromId(userId);
    const orderCount = 1 + (seed % 3); // 1 a 3 pedidos
    const orders: Order[] = [];

    for (let i = 0; i < orderCount; i++) {
      const itemCount = 1 + ((seed + i) % 3);
      const items = Array.from({ length: itemCount }, (_, j) => {
        const product = products[(seed + i * 7 + j) % products.length]!;
        const size = product.sizes[(seed + j) % product.sizes.length]!;
        const quantity = 1 + ((seed + i + j) % 2);
        return {
          productId: product.id,
          name: product.name,
          image: product.images[0]!,
          size,
          quantity,
          priceValue: product.priceValue,
        };
      });

      const daysAgo = (i + 1) * 12 + (seed % 5);
      const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      orders.push({
        id: `LG-${seed.toString(36).toUpperCase().slice(0, 5)}-${i + 1}`,
        userId,
        date: date.toISOString(),
        status: STATUSES[(seed + i) % STATUSES.length]!,
        items,
        total: items.reduce(
          (sum, item) => sum + item.priceValue * item.quantity,
          0,
        ),
      });
    }

    return orders.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },
};
