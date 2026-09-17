// Doble de Prisma en memoria para las pruebas unitarias de
// createOrderAction (lib/orders/orders-actions.ts). No es un ORM completo:
// solo implementa las consultas exactas que hace esa función, y lo hace con
// dos propiedades que importan para lo que se está probando:
//
//  1) `$transaction` es de verdad todo-o-nada. Las escrituras del callback
//     van a un area de staging y solo se vuelcan al store si el callback
//     resuelve; si lanza, se descartan. Sin esto no se podría afirmar que
//     el perdedor de la carrera no deja un Order huérfano — que es
//     justamente el bug que se está cerrando.
//  2) `payment.updateMany` respeta el `where: { orderId: null }`, igual que
//     Postgres: si el pago ya está reclamado devuelve count 0 y no toca
//     nada. La atomicidad REAL a nivel de fila no se puede demostrar con un
//     mock (para eso está la prueba de concurrencia contra Postgres, en
//     tests/orders/concurrency-real-db.ts); acá solo se verifica la lógica
//     de decisión que cuelga de ese count.
//
// Nota sobre node:test: cada archivo .test.ts corre en su propio proceso,
// que es lo que permite que cada escenario instale su propio mock.module
// de "lib/prisma" — remockear el mismo módulo dos veces en un proceso no
// está soportado, por eso hay un archivo por escenario y no un solo
// archivo con varios `test(...)`.

export type FakePaymentRow = {
  id: string;
  orderId: string | null;
  provider: "STRIPE" | "WOMPI" | "WHATSAPP";
  providerRef: string;
  cardLast4: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED";
  failureReason: string | null;
  reservedItems: { productId: string; size: string; quantity: number }[] | null;
  stockReleased: boolean;
  lastEventTimestamp: number | null;
  couponCode: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FakeOrderRow = {
  id: string;
  orderNumber: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  fulfillmentStatus: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingMethod: string;
  shippingAddress: unknown;
  couponCode: string | null;
  discountValue: number;
  items: Record<string, unknown>[];
  payment: FakePaymentRow | null;
  fulfillmentHistory: Record<string, unknown>[];
};

export type FakeProductRow = {
  id: string;
  priceValue: number;
  discountPercent: number;
  sku: string | null;
  color: string | null;
  category: { name: string; discountPercent: number };
};

export type FakeEmailOutboxRow = {
  id: string;
  orderId: string;
  type: "ADMIN_NEW_ORDER" | "CUSTOMER_ORDER_CONFIRMATION";
  recipient: string;
  recipientNormalized: string;
  idempotencyKey: string;
  freeShippingThresholdSnapshot: number | null;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  attemptCount: number;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  lastError: string | null;
};

export type FakeCalls = {
  orderCreate: number;
  paymentUpdateMany: number;
  orderStatusEventCreate: number;
  executeRaw: number;
  transactionsCommitted: number;
  transactionsRolledBack: number;
  emailOutboxCreate: number;
};

export type FakePrismaOptions = {
  payment: FakePaymentRow | null;
  products?: FakeProductRow[];
  /** Pedidos que ya existen en la base antes de la llamada. */
  existingOrders?: FakeOrderRow[];
  /**
   * Simula que otra llamada concurrente reclamó el pago justo después de la
   * lectura inicial y justo antes del updateMany condicional. Recibe la fila
   * del pago para poder mutarla (es lo que hace Postgres cuando la ganadora
   * hace commit mientras la perdedora espera el lock de esa fila).
   */
  onBeforeClaim?: (payment: FakePaymentRow) => void;
  sitewideDiscountPercent?: number;
  freeShippingThreshold?: number;
};

export function makeFakePrisma(options: FakePrismaOptions) {
  const calls: FakeCalls = {
    orderCreate: 0,
    paymentUpdateMany: 0,
    orderStatusEventCreate: 0,
    executeRaw: 0,
    transactionsCommitted: 0,
    transactionsRolledBack: 0,
    emailOutboxCreate: 0,
  };

  const payment = options.payment;
  const orders = new Map<string, FakeOrderRow>();
  for (const order of options.existingOrders ?? []) orders.set(order.id, order);
  const emailOutboxRows = new Map<string, FakeEmailOutboxRow>();

  let nextOrderId = 1;
  let nextOrderNumber = 1000;
  let nextEmailOutboxId = 1;

  // Staging: lo que escribió la transacción en curso y todavía no commiteó.
  let staged: FakeOrderRow[] | null = null;
  let stagedPaymentOrderId: { value: string } | null = null;
  let stagedEmailOutbox: FakeEmailOutboxRow[] | null = null;

  function commitStaged() {
    for (const order of staged ?? []) orders.set(order.id, order);
    if (stagedPaymentOrderId && payment) {
      payment.orderId = stagedPaymentOrderId.value;
    }
    for (const job of stagedEmailOutbox ?? []) emailOutboxRows.set(job.id, job);
    staged = null;
    stagedPaymentOrderId = null;
    stagedEmailOutbox = null;
  }

  function discardStaged() {
    staged = null;
    stagedPaymentOrderId = null;
    stagedEmailOutbox = null;
  }

  function findOrder(id: string): FakeOrderRow | null {
    return orders.get(id) ?? null;
  }

  const tx = {
    order: {
      create: async (args: { data: Record<string, unknown> }) => {
        calls.orderCreate += 1;
        const data = args.data;
        const id = `order-nuevo-${nextOrderId++}`;
        const itemsWrapper = data["items"] as
          | { create: Record<string, unknown>[] }
          | undefined;
        const created: FakeOrderRow = {
          id,
          orderNumber: nextOrderNumber++,
          userId: String(data["userId"]),
          createdAt: new Date("2026-09-16T12:00:00.000Z"),
          updatedAt: new Date("2026-09-16T12:00:00.000Z"),
          status: String(data["status"]),
          fulfillmentStatus: "PENDIENTE_POR_PREPARAR",
          subtotal: Number(data["subtotal"]),
          shippingCost: Number(data["shippingCost"]),
          tax: Number(data["tax"]),
          total: Number(data["total"]),
          shippingMethod: String(data["shippingMethod"]),
          shippingAddress: data["shippingAddress"],
          couponCode: (data["couponCode"] as string | null) ?? null,
          discountValue: Number(data["discountValue"]),
          items: (itemsWrapper?.create ?? []).map((item, index) => ({
            ...item,
            id: `${id}-item-${index}`,
            orderId: id,
          })),
          // Igual que en Postgres: el include trae la relación Payment tal
          // como está AHORA, y el enlace todavía no se hizo — por eso
          // createOrderAction no puede confiar en row.payment acá.
          payment: null,
          fulfillmentHistory: [],
        };
        staged = [...(staged ?? []), created];
        return created;
      },
    },
    payment: {
      updateMany: async (args: {
        where: { id: string; orderId: string | null };
        data: { orderId: string };
      }) => {
        calls.paymentUpdateMany += 1;
        options.onBeforeClaim?.(payment!);
        const matches =
          payment !== null &&
          payment.id === args.where.id &&
          // El corazón del reclamo: solo enlaza si sigue sin pedido.
          payment.orderId === args.where.orderId;
        if (!matches) return { count: 0 };
        stagedPaymentOrderId = { value: args.data.orderId };
        return { count: 1 };
      },
    },
    orderStatusEvent: {
      create: async (args: { data: Record<string, unknown> }) => {
        calls.orderStatusEventCreate += 1;
        const orderId = String(args.data["orderId"]);
        const target = (staged ?? []).find((order) => order.id === orderId);
        target?.fulfillmentHistory.push({
          id: `${orderId}-event-0`,
          status: String(args.data["status"]),
          changedByEmail: null,
          createdAt: new Date("2026-09-16T12:00:00.000Z"),
        });
        return { id: `${orderId}-event-0` };
      },
    },
    $executeRaw: async () => {
      calls.executeRaw += 1;
      return 1;
    },
    emailOutbox: {
      create: async (args: {
        data: Record<string, unknown>;
        select?: { id: true };
      }) => {
        calls.emailOutboxCreate += 1;
        const data = args.data;
        const id = `email-outbox-${nextEmailOutboxId++}`;
        const created: FakeEmailOutboxRow = {
          id,
          orderId: String(data["orderId"]),
          type: data["type"] as FakeEmailOutboxRow["type"],
          recipient: String(data["recipient"]),
          recipientNormalized: String(data["recipientNormalized"]),
          idempotencyKey: String(data["idempotencyKey"]),
          freeShippingThresholdSnapshot:
            (data["freeShippingThresholdSnapshot"] as number | null) ?? null,
          status: "PENDING",
          attemptCount: 0,
          lastAttemptAt: null,
          sentAt: null,
          lastError: null,
        };
        stagedEmailOutbox = [...(stagedEmailOutbox ?? []), created];
        return { id };
      },
    },
  };

  const prisma = {
    payment: {
      findUnique: async (args: {
        where: { providerRef?: string; id?: string };
      }) => {
        if (!payment) return null;
        if (
          args.where.providerRef !== undefined &&
          args.where.providerRef !== payment.providerRef
        ) {
          return null;
        }
        if (args.where.id !== undefined && args.where.id !== payment.id) {
          return null;
        }
        // Copia: createOrderAction debe volver a consultar para ver el
        // orderId fresco, no quedarse con el objeto que ya tenía.
        return { ...payment };
      },
    },
    order: {
      findUnique: async (args: { where: { id: string } }) => {
        const found = findOrder(args.where.id);
        if (!found) return null;
        return { ...found, payment: payment ? { ...payment } : null };
      },
    },
    product: {
      findMany: async () => options.products ?? [],
    },
    settings: {
      findUnique: async () => ({
        discountPercent: options.sitewideDiscountPercent ?? 0,
        freeShippingThreshold: options.freeShippingThreshold ?? 299900,
      }),
    },
    // Usado por sendOutboxJob (lib/email/outbox.ts) para el intento
    // inmediato de después del commit -- reclamo atómico simplificado
    // (suficiente para estos tests de creación, que nunca compiten dos
    // workers reales sobre el mismo job; esa concurrencia real se prueba
    // en un harness dedicado, ver tests/email-outbox/*).
    emailOutbox: {
      updateMany: async (args: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const job = emailOutboxRows.get(args.where.id);
        if (!job || job.status === "SENT") return { count: 0 };
        Object.assign(job, {
          status: "PROCESSING",
          attemptCount: job.attemptCount + 1,
          lastAttemptAt: new Date(),
        });
        return { count: 1 };
      },
      findUnique: async (args: { where: { id: string } }) =>
        emailOutboxRows.get(args.where.id)
          ? { ...emailOutboxRows.get(args.where.id)! }
          : null,
      update: async (args: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const job = emailOutboxRows.get(args.where.id);
        if (!job) throw new Error("EmailOutbox no encontrado (fake)");
        Object.assign(job, args.data);
        return { ...job };
      },
    },
    $transaction: async <T>(fn: (client: typeof tx) => Promise<T>) => {
      staged = [];
      stagedPaymentOrderId = null;
      stagedEmailOutbox = [];
      try {
        const result = await fn(tx);
        commitStaged();
        calls.transactionsCommitted += 1;
        return result;
      } catch (error) {
        discardStaged();
        calls.transactionsRolledBack += 1;
        throw error;
      }
    },
  };

  return {
    prisma,
    calls,
    /** Pedidos realmente commiteados — sirve para detectar huérfanos. */
    committedOrders: () => [...orders.values()],
    /** EmailOutbox realmente commiteados — sirve para detectar huérfanos. */
    committedEmailOutbox: () => [...emailOutboxRows.values()],
  };
}
