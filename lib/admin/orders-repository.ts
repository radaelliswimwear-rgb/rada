import {
  getAdminOrderByIdAction,
  listAllOrdersAction,
  updateFulfillmentStatusAction,
  updateOrderStatusAction,
} from "./orders-actions";

// Adaptador Prisma/Postgres (Sprint 14). Complementa a ordersRepository
// (lib/orders/orders-repository.ts) con las operaciones que solo tienen
// sentido desde el Panel Administrativo.
export const adminOrdersRepository = {
  listAll: listAllOrdersAction,
  getById: getAdminOrderByIdAction,
  updateStatus: updateOrderStatusAction,
  updateFulfillmentStatus: updateFulfillmentStatusAction,
};
