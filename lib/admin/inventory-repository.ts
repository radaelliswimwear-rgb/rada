import {
  listVariantsAction,
  updateVariantStockAction,
} from "./inventory-actions";

export const adminInventoryRepository = {
  listAll: listVariantsAction,
  updateStock: updateVariantStockAction,
};
