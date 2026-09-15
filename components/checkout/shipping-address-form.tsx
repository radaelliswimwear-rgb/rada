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
  email: "",
  street: "",
  neighborhood: "",
  apartmentDetails: "",
  deliveryNotes: "",
  city: "",
  postalCode: "",
  province: "",
  country: DEFAULT_COUNTRY,
  phone: "",
};

// Campos que no viven en una dirección guardada (lib/addresses) — son datos
// de contacto/pedido, no de la dirección en sí, así que elegir una
// dirección guardada nunca debe pisarlos (mismo criterio que ya regía para
// `email`).
type PreservedFields = "email" | "neighborhood" | "apartmentDetails" | "deliveryNotes";

function toShippingInput(address: Address): Omit<ShippingAddressInput, PreservedFields> {
  const { fullName, street, city, postalCode, province, country, phone } = address;
  return { fullName, street, city, postalCode, province, country, phone };
}

function preserveFields(value: ShippingAddressInput): Pick<ShippingAddressInput, PreservedFields> {
  return {
    email: value.email,
    neighborhood: value.neighborhood,
    apartmentDetails: value.apartmentDetails,
    deliveryNotes: value.deliveryNotes,
  };
}

export function ShippingAddressForm({
  value,
  errors,
  onChange,
  saveAddress,
  onSaveAddressChange,
  subscribeNewsletter,
  onSubscribeNewsletterChange,
}: {
  value: ShippingAddressInput;
  errors: ShippingAddressErrors;
  onChange: (value: ShippingAddressInput) => void;
  saveAddress: boolean;
  onSaveAddressChange: (checked: boolean) => void;
  subscribeNewsletter: boolean;
  onSubscribeNewsletterChange: (checked: boolean) => void;
}) {
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    if (!user) return;
    addressesRepository.listByUser().then(setSavedAddresses);
  }, [user]);

  // Prellena el correo con el de la cuenta apenas se sabe quién es — sigue
  // editable (puede querer que la confirmación llegue a otro correo).
  useEffect(() => {
    if (!user?.email || value.email) return;
    onChange({ ...value, email: user.email });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    if (hasAutoSelected || savedAddresses.length === 0) return;
    const defaultAddress =
      savedAddresses.find((address) => address.isDefault) ?? savedAddresses[0]!;
    setSelectedAddressId(defaultAddress.id);
    onChange({ ...toShippingInput(defaultAddress), ...preserveFields(value) });
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
      <div>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          className={clsx(inputClass, errors.email && errorInputClass)}
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        ) : (
          <p className="mt-1 text-xs text-neutral-500">
            Ahí te llega la confirmación de tu pedido.
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <input
            id="subscribe-newsletter"
            type="checkbox"
            checked={subscribeNewsletter}
            onChange={(e) => onSubscribeNewsletterChange(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-600"
          />
          <label
            htmlFor="subscribe-newsletter"
            className="text-sm text-neutral-600 dark:text-neutral-400"
          >
            Quiero recibir ofertas y novedades de Radaelli por correo
          </label>
        </div>
      </div>

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
                    onChange({ ...toShippingInput(address), ...preserveFields(value) });
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
                onChange({ ...EMPTY_ADDRESS, ...preserveFields(value) });
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
          {field("neighborhood", "Barrio")}
          {field("city", "Ciudad o municipio")}
          {field("province", "Departamento")}
          {field("postalCode", "Código postal (opcional)")}
          {field("country", "País")}
          {field("apartmentDetails", "Casa, apto, oficina (opcional)")}
          <div className="sm:col-span-2">
            <textarea
              placeholder="Indicaciones adicionales de entrega (opcional)"
              value={value.deliveryNotes ?? ""}
              onChange={(e) => onChange({ ...value, deliveryNotes: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <input
              placeholder="WhatsApp (ej. 3001234567)"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
              className={clsx(inputClass, errors.phone && errorInputClass)}
            />
            {errors.phone ? (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">
                Usaremos este número para coordinar tu entrega.
              </p>
            )}
          </div>

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
