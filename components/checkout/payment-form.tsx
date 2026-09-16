"use client";

import { CreditCardIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  ACTIVE_PAYMENT_PROVIDER,
  IS_SIMULATED_PROVIDER,
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDER_TEST_CARDS_HINT,
} from "lib/payments/config";
import type { CardErrors } from "lib/payments/validation";
import type { CardInput } from "lib/payments/types";
import type { WompiAcceptanceInfo } from "lib/payments/providers/wompi-gateway";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";
const errorInputClass = "border-red-400 focus:ring-red-300 dark:border-red-500";

export type WompiAcceptedState = { privacy: boolean; personalAuth: boolean };

export function PaymentForm({
  value,
  errors,
  onChange,
  disabled,
  wompiAcceptanceInfo,
  wompiAccepted,
  onWompiAcceptedChange,
  hostedCheckout = false,
}: {
  value: CardInput;
  errors: CardErrors;
  onChange: (value: CardInput) => void;
  disabled?: boolean;
  // Solo viene poblado con Wompi activo — ver checkout-content.tsx. Sin
  // esto, ninguna pasarela cambia de comportamiento.
  wompiAcceptanceInfo?: WompiAcceptanceInfo | null;
  wompiAccepted?: WompiAcceptedState;
  onWompiAcceptedChange?: (next: WompiAcceptedState) => void;
  // true con el Checkout Web alojado de Wompi: no se muestra NINGÚN campo de
  // tarjeta porque esta aplicación ya no los recibe. Ver abajo.
  hostedCheckout?: boolean;
}) {
  // Checkout Web alojado (propuesta/checkout-wompi-alojado): la clienta
  // escribe su tarjeta en checkout.wompi.co, no acá. No es que los campos se
  // "escondan": no existen en este camino, y la Server Action que inicia el
  // pago ni siquiera acepta datos de tarjeta en su firma. Tampoco se
  // muestran los checkboxes de aceptación de contratos de Wompi: los pide su
  // propia página, que es la que crea la transacción.
  if (hostedCheckout) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-sm font-medium">
          <LockClosedIcon className="h-4 w-4" />
          Pago seguro en {PAYMENT_PROVIDER_LABELS.wompi}
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Al confirmar te llevamos a la página segura de Wompi para completar
          el pago (tarjeta, PSE, Nequi o Bancolombia). Los datos de tu tarjeta
          se escriben allá: no pasan por esta tienda ni quedan guardados acá.
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Cuando termines, Wompi te devuelve a esta tienda para confirmar tu
          pedido. No cierres la pestaña hasta que veas la confirmación.
        </p>
        {PAYMENT_PROVIDER_TEST_CARDS_HINT.wompi ? (
          <p className="flex items-center gap-1.5 text-xs text-neutral-400">
            <CreditCardIcon className="h-4 w-4" />
            {PAYMENT_PROVIDER_TEST_CARDS_HINT.wompi}
          </p>
        ) : null}
      </div>
    );
  }

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

  // Autoformatea mientras se escribe: solo dígitos, inserta el "/" solo
  // después de los dos primeros y corta en 5 caracteres (MM/AA) — así nunca
  // hace falta que el usuario tipee el slash a mano.
  const onExpiryChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    const formatted =
      digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    onChange({ ...value, expiry: formatted });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <LockClosedIcon className="h-3.5 w-3.5" />
        {IS_SIMULATED_PROVIDER[ACTIVE_PAYMENT_PROVIDER] ? (
          <>
            Pago simulado, procesado por{" "}
            {PAYMENT_PROVIDER_LABELS[ACTIVE_PAYMENT_PROVIDER]}. No se envían
            datos reales.
          </>
        ) : (
          <>Pago procesado por {PAYMENT_PROVIDER_LABELS[ACTIVE_PAYMENT_PROVIDER]}.</>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {field("cardholderName", "Nombre del titular", true)}
        {field("cardNumber", "Número de tarjeta", true)}
        <div>
          <input
            placeholder="MM/AA"
            inputMode="numeric"
            autoComplete="cc-exp"
            maxLength={5}
            value={value.expiry}
            disabled={disabled}
            onChange={(e) => onExpiryChange(e.target.value)}
            className={clsx(inputClass, errors.expiry && errorInputClass)}
          />
          {errors.expiry ? (
            <p className="mt-1 text-xs text-red-500">{errors.expiry}</p>
          ) : null}
        </div>
        {field("cvc", "CVC")}
      </div>

      {PAYMENT_PROVIDER_TEST_CARDS_HINT[ACTIVE_PAYMENT_PROVIDER] ? (
        <p className="flex items-center gap-1.5 text-xs text-neutral-400">
          <CreditCardIcon className="h-4 w-4" />
          {PAYMENT_PROVIDER_TEST_CARDS_HINT[ACTIVE_PAYMENT_PROVIDER]}
        </p>
      ) : null}

      {wompiAcceptanceInfo && wompiAccepted && onWompiAcceptedChange ? (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={wompiAccepted.privacy}
              disabled={disabled}
              onChange={(e) =>
                onWompiAcceptedChange({
                  ...wompiAccepted,
                  privacy: e.target.checked,
                })
              }
              className="mt-0.5"
            />
            <span>
              Acepto haber leído{" "}
              <a
                href={wompiAcceptanceInfo.acceptancePermalink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                los reglamentos y la política de privacidad
              </a>{" "}
              para hacer este pago.
            </span>
          </label>
          {wompiAcceptanceInfo.personalAuthToken ? (
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={wompiAccepted.personalAuth}
                disabled={disabled}
                onChange={(e) =>
                  onWompiAcceptedChange({
                    ...wompiAccepted,
                    personalAuth: e.target.checked,
                  })
                }
                className="mt-0.5"
              />
              <span>
                Acepto la{" "}
                <a
                  href={wompiAcceptanceInfo.personalAuthPermalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  autorización para la administración de datos personales
                </a>
                .
              </span>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
