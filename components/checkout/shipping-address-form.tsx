"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-store";
import { addressesRepository } from "lib/addresses/addresses-repository";
import type { Address } from "lib/addresses/types";
import type { ShippingAddressErrors, ShippingAddressInput } from "lib/checkout/types";
import { DEFAULT_COUNTRY } from "lib/region/config";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";
const errorInputClass = "border-red-400 focus:ring-red-300 dark:border-red-500";

const EMPTY_ADDRESS: ShippingAddressInput = {
  fullName: "",
  street: "",
  city: "",
  postalCode: "",
  province: "",
  country: DEFAULT_COUNTRY,
  phone: "",
};

function toShippingInput(address: Address): ShippingAddressInput {
  const { fullName, street, city, postalCode, province, country, phone } = address;
  return { fullName, street, city, postalCode, province, country, phone };
}

export function ShippingAddressForm({
  value,
  errors,
  onChange,
  saveAddress,
  onSaveAddressChange,
}: {
  value: ShippingAddressInput;
  errors: ShippingAddressErrors;
  onChange: (value: ShippingAddressInput) => void;
  saveAddress: boolean;
  onSaveAddressChange: (checked: boolean) => void;
}) {
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    if (!user) return;
    addressesRepository.listByUser(user.id).then(setSavedAddresses);
  }, [user]);

  useEffect(() => {
    if (hasAutoSelected || savedAddresses.length === 0) return;
    const defaultAddress =
      savedAddresses.find((address) => address.isDefault) ?? savedAddresses[0]!;
    setSelectedAddressId(defaultAddress.id);
    onChange(toShippingInput(defaultAddress));
    setHasAutoSelected(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses, hasAutoSelected]);

  function field(key: keyof ShippingAddressInput, label: string, span2 = false) {
    return (
      <div className={span2 ? "sm:col-span-2" : undefined}>
        <input
          placeholder={label}
          value={value[key]}
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
      {user && savedAddresses.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {savedAddresses.map((address) => (
            <label
              key={address.id}
              className={clsx(
                "cursor-pointer rounded-xl border p-4 text-sm transition-colors duration-200",
                selectedAddressId === address.id
                  ? "border-black dark:border-white"
                  : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <input
                  type="radio"
                  name="saved-address"
                  checked={selectedAddressId === address.id}
                  onChange={() => {
                    setSelectedAddressId(address.id);
                    onChange(toShippingInput(address));
                  }}
                  className="h-4 w-4 border-neutral-300 text-black focus:ring-black dark:border-neutral-600"
                />
                <span className="font-medium">{address.label}</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                {address.fullName}
                <br />
                {address.street}, {address.postalCode} {address.city}
              </p>
            </label>
          ))}
          <label
            className={clsx(
              "flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-4 text-sm transition-colors duration-200",
              selectedAddressId === "new"
                ? "border-black dark:border-white"
                : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600",
            )}
          >
            <input
              type="radio"
              name="saved-address"
              checked={selectedAddressId === "new"}
              onChange={() => {
                setSelectedAddressId("new");
                onChange(EMPTY_ADDRESS);
              }}
              className="sr-only"
            />
            + Usar una dirección nueva
          </label>
        </div>
      ) : null}

      {selectedAddressId === "new" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {field("fullName", "Nombre completo", true)}
          {field("street", "Dirección (calle, carrera, número)", true)}
          {field("city", "Ciudad o municipio")}
          {field("province", "Departamento")}
          {field("postalCode", "Código postal (opcional)")}
          {field("country", "País")}
          {field("phone", "Teléfono (ej. 3001234567)", true)}

          {user ? (
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="save-address"
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => onSaveAddressChange(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-600"
              />
              <label
                htmlFor="save-address"
                className="text-sm text-neutral-600 dark:text-neutral-400"
              >
                Guardar esta dirección para próximas compras
              </label>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
