import {
  createCouponAction,
  deleteCouponAction,
  listAllCouponsAction,
  toggleCouponActiveAction,
} from "./coupons-actions";

export const adminCouponsRepository = {
  listAll: listAllCouponsAction,
  create: createCouponAction,
  toggleActive: toggleCouponActiveAction,
  remove: deleteCouponAction,
};
