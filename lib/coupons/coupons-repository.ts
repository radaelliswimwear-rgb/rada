import {
  incrementCouponUsageAction,
  validateCouponAction,
} from "./coupons-actions";

export const couponsRepository = {
  validate: validateCouponAction,
  incrementUsage: incrementCouponUsageAction,
};
