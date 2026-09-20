"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  buildCancelConfirmationMessage,
  buildRefundConfirmationMessage,
} from "lib/admin/cancellation-copy";
import { adminOrdersRepository } from "lib/admin/orders-repository";
import { FULFILLMENT_STATUS_OPTIONS, type AdminOrder } from "lib/admin/types";
import { qualifiesForFreeShipping } from "lib/checkout/pricing";
import { formatDate, formatPrice } from "lib/format";
import type { FulfillmentStatus } from "lib/orders/types";

const PAYMENT_STATE_LABEL: Record<string, string> = {
  succeeded: "Aprobado",
  pending: "Pendiente",
  failed: "Rechazado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const PAYMENT_STATE_STYLES: Record<string, string> = {
  succeeded:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  cancelled:
    "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
  refunded:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};
import { Pagination } from "./pagination";
import { SearchInput } from "./search-input";

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<FulfillmentStatus, string> = {
  "Pendiente por preparar":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Preparando pedido":
    "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
  "Cliente contactado":
    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  "Entrega coordinada":
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  Despachado:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Entregado:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Cancelado: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  Reembolsado:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

export function OrdersTable({
  initialOrders,
}: {
  initialOrders: AdminOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orders;
    return orders.filter((order) =>
      [
        order.id,
        String(order.orderNumber),
        order.userEmail,
        order.fulfillmentStatus,
        order.shippingAddress?.fullName,
        order.shippingAddress?.phone,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [orders, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const onSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const onStatusChange = async (
    order: AdminOrder,
    fulfillmentStatus: FulfillmentStatus,
  ) => {
    if (fulfillmentStatus === "Cancelado") {
      const confirmed = window.confirm(
        buildCancelConfirmationMessage(order.payment?.status),
      );
      if (!confirmed) return;
    }
    if (fulfillmentStatus === "Reembolsado") {
      const confirmed = window.confirm(
        buildRefundConfirmationMessage(order.payment?.status),
      );
      if (!confirmed) return;
    }
    setPendingId(order.id);
    const result = await adminOrdersRepository.updateFulfillmentStatus(
      order.id,
      fulfillmentStatus,
    );
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, fulfillmentStatus } : o)),
    );
    toast("Estado del pedido actualizado.");
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">Todavía no hay pedidos.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={onSearch}
          placeholder="Buscar por N° de pedido, email o estado..."
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            Ningún pedido coincide con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Envío</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {order.shippingAddress?.fullName ?? order.userEmail}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {order.shippingAddress?.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    {order.payment?.status ? (
                      <span
                        className={clsx(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          PAYMENT_STATE_STYLES[order.payment.status],
                        )}
                      >
                        {PAYMENT_STATE_LABEL[order.payment.status]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                    {order.freeShippingThresholdSnapshot != null
                      ? qualifiesForFreeShipping(
                          order.subtotal ?? order.total,
                          order.discountValue ?? 0,
                          order.freeShippingThresholdSnapshot,
                        )
                        ? "Gratis"
                        : "Por coordinar"
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.fulfillmentStatus}
                      disabled={pendingId === order.id}
                      onChange={(e) =>
                        onStatusChange(
                          order,
                          e.target.value as FulfillmentStatus,
                        )
                      }
                      className={clsx(
                        "rounded-full border-0 px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50 dark:focus:ring-white/20",
                        STATUS_STYLES[order.fulfillmentStatus],
                      )}
                    >
                      {FULFILLMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
