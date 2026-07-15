export type CouponValidationResult =
  | { success: true; code: string; discount: number } // discount en euros
  | { success: false; error: string };
