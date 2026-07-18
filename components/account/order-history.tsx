"use client";

import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-store";
import { formatDate, formatPrice } from "lib/format";
import { ordersRepository } from "lib/orders/orders-repository";
import type { Order, OrderStatus } from "lib/orders/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Entregado: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Enviado: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Procesando: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
  Cancelado: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  "Pendiente de pago":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

export function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    ordersRepository.listByUser(user.id).then((list) => {
      setOrders(list);
      setIsLoading(false);
    });
  }, [user]);

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Cargando pedidos...</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
        <ClipboardDocumentListIcon className="h-7 w-7 text-neutral-400" />
        <p className="text-sm text-neutral-500">Todavía no hiciste ningún pedido.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <div>
              <p className="text-sm font-medium">Pedido {order.id}</p>
              <p className="text-xs text-neutral-500">{formatDate(order.date)}</p>
            </div>
            <span
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium",
                STATUS_STYLES[order.status],
              )}
            >
              {order.status}
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {order.items.map((item, index) => (
              <li key={`${order.id}-${index}`} className="flex items-center gap-3">
                <div className="relative h-14 w-12 flex-none overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-900">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-sm">
                  <p>{item.name}</p>
                  <p className="text-xs text-neutral-500">
                    Talla {item.size} · x{item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  {formatPrice(item.priceValue * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm dark:border-neutral-800">
            <span className="text-neutral-500">Total</span>
            <span className="font-medium">{formatPrice(order.total)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
