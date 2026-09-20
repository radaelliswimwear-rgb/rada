export type CouponValidationResult =
  | { success: true; code: string; discount: number } // discount en COP
  | { success: false; error: string };
