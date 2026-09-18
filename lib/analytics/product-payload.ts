// Mapper central de producto para analytics (Fase 2A, sección 5 del
// proceso) -- único lugar que arma el payload item_id/item_name/etc, usado
// por GA4/Meta/first-party por igual. Función pura: recibe datos ya
// resueltos (catálogo, línea de carrito, u OrderItem), nunca hace fetch.
//
// item_id: Product.id estable (nunca el slug, que puede cambiar).
import type { AnalyticsProductPayload } from "./types";

export type ProductPayloadInput = {
  id: string;
  name: string;
  category?: string | null;
  collection?: string | null;
  size?: string | null;
  price: number;
  basePrice?: number | null;
  quantity?: number;
  slug?: string | null;
  sku?: string | null;
  color?: string | null;
  currency?: string;
};

export function buildProductPayload(
  input: ProductPayloadInput,
): AnalyticsProductPayload {
  const currency = input.currency ?? "COP";
  const basePrice = input.basePrice ?? input.price;
  const discount = Math.max(0, basePrice - input.price);
  const discountPercent =
    basePrice > 0 ? Math.round((discount / basePrice) * 100) : 0;

  return {
    item_id: input.id,
    item_name: input.name,
    item_category: input.category ?? undefined,
    item_variant: input.size ?? undefined,
    price: input.price,
    quantity: input.quantity,
    discount: discount > 0 ? discount : undefined,
    currency,
    product_slug: input.slug ?? undefined,
    sku: input.sku ?? null,
    color: input.color ?? null,
    collection: input.collection ?? undefined,
    base_price: discount > 0 ? basePrice : undefined,
    final_price: input.price,
    discount_percent: discountPercent > 0 ? discountPercent : undefined,
  };
}
