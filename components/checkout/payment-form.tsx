"use client";

import { CreditCardIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { ACTIVE_PAYMENT_PROVIDER, PAYMENT_PROVIDER_LABELS } from "lib/payments/config";
import type { CardErrors } from "lib/payments/validation";
import type { CardInput } from "lib/payments/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";
const errorInputClass = "border-red-400 focus:ring-red-300 dark:border-red-500";

export function PaymentForm({
  value,
  errors,
  onChange,
  disabled,
}: {
  value: CardInput;
  errors: CardErrors;
  onChange: (value: CardInput) => void;
  disabled?: boolean;
}) {
  function field(key: keyof CardInput, label: string, span2 = false) {
    return (
      <div className={span2 ? "sm:col-span-2" : undefined}>
        <input
          placeholder={label}
          value={value[key]}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, [key]: e.target.value })}
          className={clsx(inputClass, errors[key] && errorInputClass)}
        />
        {errors[key] ? (
          <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <LockClosedIcon className="h-3.5 w-3.5" />
        Pago simulado, procesado por {PAYMENT_PROVIDER_LABELS[ACTIVE_PAYMENT_PROVIDER]}.
        No se envían datos reales.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {field("cardholderName", "Nombre del titular", true)}
        {field("cardNumber", "Número de tarjeta", true)}
        {field("expiry", "MM/AA")}
        {field("cvc", "CVC")}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-neutral-400">
        <CreditCardIcon className="h-4 w-4" />
        Probá 4242 4242 4242 4242 (éxito) o 4000 0000 0000 0002 (rechazo) — cualquier
        fecha futura y CVC.
      </p>
    </div>
  );
}
