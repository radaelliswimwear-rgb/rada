// Datos compartidos por los escenarios unitarios de createOrderAction.
import type { CreateOrderInput } from "lib/orders/types";
import type {
  FakeOrderRow,
  FakePaymentRow,
  FakeProductRow,
} from "./fake-prisma";

export const PRODUCT_ID = "prod-bikini-lila";
export const PROVIDER_REF = "radaelli-ref-abc123";

export const product: FakeProductRow = {
  id: PRODUCT_ID,
  priceValue: 180000,
  discountPercent: 0,
  sku: "RAD-BL-001",
  color: "Lila",
  category: { name: "Bikinis", discountPercent: 0 },
};

export function makePayment(
  overrides: Partial<FakePaymentRow> = {},
): FakePaymentRow {
  return {
    id: "pay-1",
    orderId: null,
    provider: "WOMPI",
    providerRef: PROVIDER_REF,
    cardLast4: "4242",
    amount: 360000,
    currency: "COP",
    status: "SUCCEEDED",
    failureReason: null,
    reservedItems: [{ productId: PRODUCT_ID, size: "M", quantity: 2 }],
    stockReleased: false,
    lastEventTimestamp: null,
    couponCode: null,
    createdAt: new Date("2026-09-16T11:00:00.000Z"),
    updatedAt: new Date("2026-09-16T11:00:00.000Z"),
    ...overrides,
  };
}

export const input: CreateOrderInput = {
  items: [
    {
      productId: PRODUCT_ID,
      name: "Bikini Lila",
      image: "/bikini-lila.jpg",
      size: "M",
      quantity: 2,
      priceValue: 180000,
    },
  ],
  shippingAddress: {
    fullName: "Laura Gómez",
    email: "laura@example.com",
    street: "Calle 10 #20-30",
    neighborhood: "El Poblado",
    city: "Medellín",
    postalCode: "050021",
    province: "Antioquia",
    country: "Colombia",
    phone: "+573001112233",
  },
  shippingMethod: "standard",
  payment: {
    provider: "wompi",
    transactionId: PROVIDER_REF,
    last4: "4242",
  },
};

/** El pedido que "ya existía" en los escenarios de reintento/carrera. */
export function makeExistingOrder(id = "order-ganador"): FakeOrderRow {
  return {
    id,
    orderNumber: 991,
    userId: "guest",
    createdAt: new Date("2026-09-16T11:30:00.000Z"),
    updatedAt: new Date("2026-09-16T11:30:00.000Z"),
    status: "PROCESANDO",
    fulfillmentStatus: "PENDIENTE_POR_PREPARAR",
    subtotal: 360000,
    shippingCost: 0,
    tax: 0,
    total: 360000,
    shippingMethod: "STANDARD",
    shippingAddress: input.shippingAddress,
    couponCode: null,
    discountValue: 0,
    items: [
      {
        id: `${id}-item-0`,
        orderId: id,
        productId: PRODUCT_ID,
        name: "Bikini Lila",
        image: "/bikini-lila.jpg",
        size: "M",
        quantity: 2,
        priceValue: 180000,
        sku: "RAD-BL-001",
        color: "Lila",
        collection: "Bikinis",
      },
    ],
    payment: null,
    fulfillmentHistory: [],
  };
}
