import type {
  OrderItem,
  ShippingAddressSnapshot,
  ShippingMethodId,
} from "lib/orders/types";

// Snapshot de "lo que falta para crear el pedido" cuando el pago se hace en
// el Checkout Web ALOJADO de Wompi (propuesta/checkout-wompi-alojado).
//
// Con el formulario de tarjeta propio (el flujo viejo), el pedido se creaba
// en el mismo request que confirmaba el pago: la dirección y las preferencias
// nunca salían de la memoria del componente. Con el checkout alojado, en
// cambio, el navegador SE VA del sitio (redirección completa a
// checkout.wompi.co) y puede no volver nunca — cierra la pestaña, vuelve en
// otro dispositivo, se le corta la red. Por eso esto se persiste, en el
// mismo paso en que se crea el intent, como un Json en Payment
// (`pendingOrderInput`, ver prisma/schema.prisma): es la única fuente de
// verdad RECUPERABLE sin navegador. El cliente además guarda una copia en
// sessionStorage para el camino feliz (volver a la misma pestaña, sin
// round-trip extra), pero esa copia es una optimización, no la fuente.
//
// Nunca incluye datos de tarjeta. No es solo una convención: el tipo no los
// declara y parsePendingOrderInput DESCARTA cualquier campo que no sea uno
// de los de abajo, así que aunque un cliente manipulado mande
// `cardNumber`/`cvc` en el mismo objeto, nunca llegan a la base de datos —
// el punto entero de mover el cobro al checkout alojado es que este servidor
// no vea nunca un PAN ni un CVV.
export type PendingOrderInput = {
  items: OrderItem[];
  shippingAddress: ShippingAddressSnapshot;
  shippingMethod: ShippingMethodId;
  saveAddress: boolean;
  subscribeNewsletter: boolean;
};

const MAX_ITEMS = 40; // mismo tope que MAX_LINES en server-order-totals.ts
const MAX_STRING = 500;
const SHIPPING_METHODS: ShippingMethodId[] = ["standard", "express"];

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_STRING) return null;
  return trimmed;
}

function optionalStr(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return str(value) ?? undefined;
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseItem(raw: unknown): OrderItem | null {
  const item = record(raw);
  if (!item) return null;
  const productId = str(item.productId);
  const name = str(item.name);
  const image = str(item.image);
  const size = str(item.size);
  if (!productId || !name || !image || !size) return null;
  if (
    !Number.isInteger(item.quantity) ||
    (item.quantity as number) <= 0 ||
    (item.quantity as number) > 20
  ) {
    return null;
  }
  if (
    typeof item.priceValue !== "number" ||
    !Number.isFinite(item.priceValue) ||
    item.priceValue < 0
  ) {
    return null;
  }
  // Solo los campos declarados: cualquier otra cosa que venga en el objeto
  // (incluido lo que un cliente manipulado quiera colar) se descarta acá.
  return {
    productId,
    name,
    image,
    size,
    quantity: item.quantity as number,
    priceValue: item.priceValue,
    sku: optionalStr(item.sku) ?? null,
    color: optionalStr(item.color) ?? null,
    collection: optionalStr(item.collection) ?? null,
  };
}

function parseAddress(raw: unknown): ShippingAddressSnapshot | null {
  const address = record(raw);
  if (!address) return null;
  const fullName = str(address.fullName);
  const email = str(address.email);
  const street = str(address.street);
  const neighborhood = str(address.neighborhood);
  const city = str(address.city);
  const province = str(address.province);
  const country = str(address.country);
  const phone = str(address.phone);
  if (
    !fullName ||
    !email ||
    !street ||
    !neighborhood ||
    !city ||
    !province ||
    !country ||
    !phone
  ) {
    return null;
  }
  return {
    fullName,
    email,
    street,
    neighborhood,
    // postalCode es opcional en la práctica (muchas ciudades colombianas no
    // lo usan) — el formulario lo valida, acá solo se normaliza a "".
    postalCode: optionalStr(address.postalCode) ?? "",
    apartmentDetails: optionalStr(address.apartmentDetails),
    deliveryNotes: optionalStr(address.deliveryNotes),
    city,
    province,
    country,
    phone,
  };
}

// Devuelve un objeto NUEVO con solo los campos conocidos (nunca el original)
// o null si falta algo imprescindible para armar el pedido. Se usa en los dos
// sentidos: al guardar (lo que manda el navegador antes de redirigir a Wompi)
// y al leer (el Json que quedó en Payment.pendingOrderInput, que puede venir
// de una versión anterior del checkout).
export function parsePendingOrderInput(raw: unknown): PendingOrderInput | null {
  const input = record(raw);
  if (!input) return null;

  if (!Array.isArray(input.items) || input.items.length === 0) return null;
  if (input.items.length > MAX_ITEMS) return null;
  const items: OrderItem[] = [];
  for (const rawItem of input.items) {
    const item = parseItem(rawItem);
    if (!item) return null;
    items.push(item);
  }

  const shippingAddress = parseAddress(input.shippingAddress);
  if (!shippingAddress) return null;

  const shippingMethod = SHIPPING_METHODS.find(
    (method) => method === input.shippingMethod,
  );
  if (!shippingMethod) return null;

  return {
    items,
    shippingAddress,
    shippingMethod,
    saveAddress: input.saveAddress === true,
    subscribeNewsletter: input.subscribeNewsletter === true,
  };
}
