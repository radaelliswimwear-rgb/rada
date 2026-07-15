import {
  createProductAction,
  deleteProductAction,
  getAdminProductByIdAction,
  listAllProductsAction,
  updateProductAction,
} from "./products-actions";

// Adaptador Prisma/Postgres (Sprint 14). Separado de catalogRepository
// (solo lectura, para la tienda) a propósito: acá los errores se propagan
// tal cual al llamador en vez de degradar a un valor vacío — ver
// products-actions.ts.
export const adminProductsRepository = {
  listAll: listAllProductsAction,
  getById: getAdminProductByIdAction,
  create: createProductAction,
  update: updateProductAction,
  remove: deleteProductAction,
};
