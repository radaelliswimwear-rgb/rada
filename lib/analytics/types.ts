// Fase 2A de analytics -- tipos compartidos por toda la capa (event layer,
// adapters, first-party store, outbox). Ver prisma/schema.prisma
// (AnalyticsEventName) para el enum persistido -- este archivo es la
// contraparte de dominio, sin ningún import de Prisma/next.

export type AnalyticsEventName =
  | "page_view"
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "add_to_wishlist"
  | "add_to_cart"
  | "view_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase"
  | "search"
  | "select_size"
  | "click_whatsapp"
  | "filter_use"
  | "coupon_apply"
  | "payment_failed";

// Traduce el nombre de evento de dominio (string, usado por GA4/Meta con
// sus propios nombres) al valor del enum de Prisma AnalyticsEventName
// (SCREAMING_CASE) -- una sola tabla, para que store.ts nunca tenga que
// adivinar el mapeo.
export const ANALYTICS_EVENT_NAME_TO_DB: Record<AnalyticsEventName, string> = {
  page_view: "PAGE_VIEW",
  view_item_list: "VIEW_ITEM_LIST",
  select_item: "SELECT_ITEM",
  view_item: "VIEW_ITEM",
  add_to_wishlist: "ADD_TO_WISHLIST",
  add_to_cart: "ADD_TO_CART",
  view_cart: "VIEW_CART",
  remove_from_cart: "REMOVE_FROM_CART",
  begin_checkout: "BEGIN_CHECKOUT",
  add_shipping_info: "ADD_SHIPPING_INFO",
  add_payment_info: "ADD_PAYMENT_INFO",
  purchase: "PURCHASE",
  search: "SEARCH",
  select_size: "SELECT_SIZE",
  click_whatsapp: "CLICK_WHATSAPP",
  filter_use: "FILTER_USE",
  coupon_apply: "COUPON_APPLY",
  payment_failed: "PAYMENT_FAILED",
};

export type DeviceCategory = "MOBILE" | "DESKTOP" | "TABLET" | "UNKNOWN";

// Payload de producto compartido por GA4/Meta/first-party -- ver
// lib/analytics/product-payload.ts (buildProductPayload) para el mapper.
export type AnalyticsProductPayload = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity?: number;
  discount?: number;
  currency: string;
  product_slug?: string;
  sku?: string | null;
  color?: string | null;
  collection?: string | null;
  base_price?: number;
  final_price?: number;
  discount_percent?: number;
};

// Input generico que cualquier call site arma para track()/trackCommerce().
// value/currency son el total de la interaccion (ej. subtotal del carrito en
// begin_checkout, order.total en purchase) -- no siempre aplica, por eso es
// opcional.
export type AnalyticsEventInput = {
  name: AnalyticsEventName;
  products?: AnalyticsProductPayload[];
  value?: number;
  currency?: string;
  path?: string;
  orderId?: string;
  // Payload custom LIMITADO -- nunca un blob grande, nunca HTML crudo (ver
  // lib/analytics/sanitize.ts). Claves esperadas por evento custom:
  // search_term/result_count (search), filter_name/filter_value/result_count
  // (filter_use), coupon/success/discount (coupon_apply), size/availability
  // (select_size), list_name/list_id/position (view_item_list/select_item),
  // context (click_whatsapp).
  custom?: Record<string, string | number | boolean | null>;
};
