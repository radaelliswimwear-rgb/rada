import {
  listBackInStockDemandAction,
  listBackInStockRequestsForVariantAction,
} from "./back-in-stock-actions";

export const adminBackInStockRepository = {
  listDemand: listBackInStockDemandAction,
  listRequestsForVariant: listBackInStockRequestsForVariantAction,
};
