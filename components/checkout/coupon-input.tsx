"use client";

import { useState } from "react";
import { couponsRepository } from "lib/coupons/coupons-repository";

export type AppliedCoupon = { code: string; discount: number };

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

export function CouponInput({
  subtotal,
  applied,
  onApply,
  onRemove,
}: {
  subtotal: number;
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setIsChecking(true);
    const result = await couponsRepository.validate(code, subtotal);
    setIsChecking(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onApply({ code: result.code, discount: result.discount });
    setCode("");
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm dark:bg-green-950/30">
        <span className="text-green-800 dark:text-green-300">
          Cupón <strong>{applied.code}</strong> aplicado
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-neutral-500 underline-offset-4 hover:underline"
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de descuento"
          aria-label="Código de cupón"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={isChecking}
          className="shrink-0 rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
        >
          {isChecking ? "..." : "Aplicar"}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </form>
  );
}
