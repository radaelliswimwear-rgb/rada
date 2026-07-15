"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { adminCouponsRepository } from "lib/admin/coupons-repository";
import type { AdminCoupon, AdminCouponInput } from "lib/admin/coupons-actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

const EMPTY_FORM: AdminCouponInput = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  active: true,
  minSubtotal: 0,
  maxUses: null,
  expiresAt: null,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CouponsManager({
  initialCoupons,
}: {
  initialCoupons: AdminCoupon[];
}) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [form, setForm] = useState<AdminCouponInput>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await adminCouponsRepository.create(form);
    setIsSubmitting(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setForm(EMPTY_FORM);
    setCoupons(await adminCouponsRepository.listAll());
    toast("Cupón creado.");
  };

  const onToggle = async (coupon: AdminCoupon) => {
    setPendingId(coupon.id);
    const result = await adminCouponsRepository.toggleActive(
      coupon.id,
      !coupon.active,
    );
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)),
    );
  };

  const onDelete = async (coupon: AdminCoupon) => {
    setPendingId(coupon.id);
    const result = await adminCouponsRepository.remove(coupon.id);
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    toast("Cupón eliminado.");
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-3 text-lg font-medium">Nuevo cupón</h2>
        <form
          onSubmit={onCreate}
          className="grid max-w-xl gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2 dark:border-neutral-800"
        >
          <input
            required
            placeholder="Código (ej. VERANO10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className={`${inputClass} sm:col-span-2`}
          />
          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as AdminCouponInput["type"],
              })
            }
            className={inputClass}
          >
            <option value="PERCENTAGE">Porcentaje (%)</option>
            <option value="FIXED">Monto fijo (€)</option>
          </select>
          <input
            type="number"
            required
            min={0}
            step={form.type === "PERCENTAGE" ? 1 : 0.01}
            placeholder="Valor"
            value={form.value}
            onChange={(e) =>
              setForm({ ...form, value: Number(e.target.value) })
            }
            className={inputClass}
          />
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="Subtotal mínimo (€)"
            value={form.minSubtotal}
            onChange={(e) =>
              setForm({ ...form, minSubtotal: Number(e.target.value) })
            }
            className={inputClass}
          />
          <input
            type="number"
            min={0}
            placeholder="Usos máximos (opcional)"
            value={form.maxUses ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                maxUses: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={inputClass}
          />
          <input
            type="date"
            value={form.expiresAt ?? ""}
            onChange={(e) =>
              setForm({ ...form, expiresAt: e.target.value || null })
            }
            className={`${inputClass} sm:col-span-2`}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-fit rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 sm:col-span-2 dark:bg-white dark:text-black"
          >
            {isSubmitting ? "Creando..." : "Crear cupón"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Cupones</h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay cupones todavía.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Usos</th>
                  <th className="px-4 py-3">Vence</th>
                  <th className="px-4 py-3">Activo</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                  >
                    <td className="px-4 py-3 font-medium">{coupon.code}</td>
                    <td className="px-4 py-3">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : `${coupon.value.toFixed(2)} €`}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {coupon.usedCount}
                      {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {coupon.expiresAt
                        ? formatDate(coupon.expiresAt)
                        : "Sin límite"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onToggle(coupon)}
                        disabled={pendingId === coupon.id}
                        className="text-xs underline-offset-4 hover:underline disabled:opacity-50"
                      >
                        {coupon.active ? "Sí" : "No"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(coupon)}
                        disabled={pendingId === coupon.id}
                        className="text-xs text-neutral-500 underline-offset-4 hover:text-red-600 hover:underline disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
