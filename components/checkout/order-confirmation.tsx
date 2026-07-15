"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-store";
import { SHIPPING_METHODS } from "lib/checkout/shipping-methods";
import { ordersRepository } from "lib/orders/orders-repository";
import type { Order } from "lib/orders/types";
import { PAYMENT_PROVIDER_LABELS } from "lib/payments/config";
import { CostSummary } from "./cost-summary";
import { OrderSummary, type OrderSummaryLine } from "./order-summary";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function OrderConfirmation({ orderId }: { orderId: string }) {
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ordersRepository.getById(orderId).then((found) => {
      setOrder(found);
      setIsLoading(false);
    });
  }, [orderId]);

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Cargando pedido...</p>;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">No encontramos este pedido.</p>
        <Link href="/" className="text-sm underline underline-offset-4">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const summaryLines: OrderSummaryLine[] = order.items.map((item, index) => ({
    id: `${order.id}-${index}`,
    name: item.name,
    image: item.image,
    size: item.size,
    quantity: item.quantity,
    priceValue: item.priceValue,
  }));

  const methodLabel = SHIPPING_METHODS.find(
    (method) => method.id === order.shippingMethod,
  )?.name;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
        <h1 className="text-3xl font-semibold tracking-tight">
          ¡Pedido confirmado!
        </h1>
        <p className="text-sm text-neutral-500">
          Pedido {order.id} · {formatDate(order.date)}
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Productos
        </h2>
        <OrderSummary lines={summaryLines} />

        {order.shippingAddress ? (
          <div className="mt-6 border-t border-neutral-100 pt-4 text-sm dark:border-neutral-800">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Envío
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.postalCode} {order.shippingAddress.city},{" "}
              {order.shippingAddress.province}
              <br />
              {order.shippingAddress.country} · {order.shippingAddress.phone}
            </p>
            {methodLabel ? (
              <p className="mt-2 text-neutral-500">{methodLabel}</p>
            ) : null}
          </div>
        ) : null}

        {order.payment ? (
          <div className="mt-6 border-t border-neutral-100 pt-4 text-sm dark:border-neutral-800">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Pago
            </h2>
            <p className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-4 w-4" />
              Pago aprobado
            </p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {PAYMENT_PROVIDER_LABELS[order.payment.provider]} · Tarjeta terminada en{" "}
              {order.payment.last4} · {order.payment.transactionId}
            </p>
          </div>
        ) : null}

        <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <CostSummary
            subtotal={order.subtotal ?? order.total}
            shippingCost={order.shippingCost ?? 0}
            tax={order.tax ?? 0}
            total={order.total}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm text-black dark:border-neutral-700 dark:text-white"
        >
          Volver al inicio
        </Link>
        {isAuthenticated ? (
          <Link
            href="/cuenta/pedidos"
            className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Ver mis pedidos
          </Link>
        ) : null}
      </div>
    </div>
  );
}
