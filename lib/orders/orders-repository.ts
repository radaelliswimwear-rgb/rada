import {
  createOrderAction,
  getOrderByIdAction,
  listOrdersByUserAction,
} from "./orders-actions";

// Adaptador Prisma/Postgres (Sprint 12). Mismo contrato público que antes
// (Sprint 10/11) — components/checkout y components/account no cambian. El
// generador de pedidos simulados desaparece: ahora hay datos reales
// (prisma/seed.ts + pedidos creados desde /checkout).
export const ordersRepository = {
  listByUser: listOrdersByUserAction,
  create: createOrderAction,
  getById: getOrderByIdAction,
};
