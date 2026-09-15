import {
  listBackInStockDemandAction,
  listBackInStockRequestsForVariantAction,
  retryBackInStockNotificationAction,
} from "./back-in-stock-actions";

export const adminBackInStockRepository = {
  listDemand: listBackInStockDemandAction,
  listRequestsForVariant: listBackInStockRequestsForVariantAction,
  retryNotification: retryBackInStockNotificationAction,
};
