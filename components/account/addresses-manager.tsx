"use client";

import { MapPinIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "components/auth/auth-store";
import { addressesRepository } from "lib/addresses/addresses-repository";
import type { Address, AddressInput } from "lib/addresses/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

const EMPTY_FORM: AddressInput = {
  label: "",
  fullName: "",
  street: "",
  city: "",
  postalCode: "",
  province: "",
  country: "España",
  phone: "",
  isDefault: false,
};

export function AddressesManager() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);

  useEffect(() => {
    if (!user) return;
    addressesRepository.listByUser(user.id).then((list) => {
      setAddresses(list);
      setIsLoading(false);
    });
  }, [user]);

  if (!user) return null;

  const refresh = async () => {
    setAddresses(await addressesRepository.listByUser(user.id));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await addressesRepository.create(user.id, form);
    setForm(EMPTY_FORM);
    setShowForm(false);
    await refresh();
    toast("Dirección agregada.");
  };

  const onRemove = async (id: string) => {
    await addressesRepository.remove(id);
    await refresh();
    toast("Dirección eliminada.");
  };

  const onSetDefault = async (id: string) => {
    await addressesRepository.update(id, { isDefault: true });
    await refresh();
  };

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Cargando...</p>;
  }

  return (
    <div>
      {addresses.length === 0 ? (
        <div className="mb-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
          <MapPinIcon className="h-7 w-7 text-neutral-400" />
          <p className="text-sm text-neutral-500">
            No guardaste ninguna dirección todavía.
          </p>
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{address.label}</span>
                {address.isDefault ? (
                  <span className="rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-wide text-white dark:bg-white dark:text-black">
                    Predeterminada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetDefault(address.id)}
                    className="text-xs text-neutral-500 underline-offset-4 hover:underline"
                  >
                    Marcar predeterminada
                  </button>
                )}
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                {address.fullName}
                <br />
                {address.street}
                <br />
                {address.postalCode} {address.city}, {address.province}
                <br />
                {address.country} · {address.phone}
              </p>
              <button
                type="button"
                onClick={() => onRemove(address.id)}
                aria-label="Eliminar dirección"
                className="mt-3 flex items-center gap-1 text-xs text-neutral-500 hover:text-black dark:hover:text-white"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="grid max-w-2xl gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2 dark:border-neutral-800"
        >
          <input
            required
            placeholder="Etiqueta (Casa, Oficina...)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className={inputClass}
          />
          <input
            required
            placeholder="Nombre completo"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputClass}
          />
          <input
            required
            placeholder="Calle y número"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className={`${inputClass} sm:col-span-2`}
          />
          <input
            required
            placeholder="Código postal"
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            className={inputClass}
          />
          <input
            required
            placeholder="Ciudad"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputClass}
          />
          <input
            required
            placeholder="Provincia"
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
            className={inputClass}
          />
          <input
            required
            placeholder="País"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className={inputClass}
          />
          <input
            required
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={`${inputClass} sm:col-span-2`}
          />
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="isDefault"
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-600"
            />
            <label htmlFor="isDefault" className="text-sm text-neutral-600 dark:text-neutral-400">
              Usar como dirección predeterminada
            </label>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-black px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 dark:bg-white dark:text-black"
            >
              Guardar dirección
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm text-black dark:border-neutral-700 dark:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm text-black transition-colors duration-200 hover:border-black dark:border-neutral-700 dark:text-white dark:hover:border-white"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar dirección
        </button>
      )}
    </div>
  );
}
