"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-store";
import { getFreeShippingThresholdAction } from "lib/checkout/free-shipping-actions";
import { qualifiesForFreeShipping } from "lib/checkout/pricing";
import { SHIPPING_METHODS } from "lib/checkout/shipping-methods";
import { formatOrderDateTime } from "lib/format";
import { ordersRepository } from "lib/orders/orders-repository";
import type { Order } from "lib/orders/types";
import { PAYMENT_PROVIDER_LABELS } from "lib/payments/config";
import { isEligibleForMarketingPurchaseEvent } from "lib/analytics/purchase-eligibility";
import { buildGa4TransactionId, buildPurchaseEventId } from "lib/analytics/purchase-event-id";
import { buildProductPayload } from "lib/analytics/product-payload";
import { track } from "lib/analytics/client/track";
import { CostSummary } from "./cost-summary";
import { OrderSummary, type OrderSummaryLine } from "./order-summary";
import { ShippingNotice } from "./shipping-notice";

export function OrderConfirmation({ orderId }: { orderId: string }) {
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(299900);

  useEffect(() => {
    ordersRepository.getById(orderId).then((found) => {
      setOrder(found);
      setIsLoading(false);

      // Fase 2A de analytics (sección 17, "PURCHASE = pago real aprobado"):
      // este es el único lugar de todo el sitio donde se dispara -- llegan
      // acá los 3 flujos (WhatsApp, tarjeta simulada, Wompi hosted), y a
      // diferencia de wompi-return-content.tsx, vuelve a pedir el pedido al
      // servidor en vez de confiar en lo que trae la URL de retorno.
      if (
        found &&
        found.payment?.status === "succeeded" &&
        isEligibleForMarketingPurchaseEvent(found)
      ) {
        // Dedup ante recargas de esta misma página (sección 17/19-20): sin
        // esto, F5 en /checkout/confirmacion/[id] dispararía otro Purchase.
        const dedupeKey = `radaelli_purchase_tracked_${found.id}`;
        let alreadyTracked = false;
        try {
          alreadyTracked = window.sessionStorage.getItem(dedupeKey) === "1";
        } catch {
          // sessionStorage puede no estar disponible (navegación privada,
          // etc.) -- "ANALYTICS MUST FAIL OPEN FOR COMMERCE": nunca romper
          // la página de confirmación por esto, en el peor caso se manda de
          // nuevo, lo cual el propio event_id/transaction_id de Meta/GA4 ya
          // deduplica del lado del proveedor.
        }
        if (!alreadyTracked) {
          const products = found.items.map((item) =>
            buildProductPayload({
              id: item.productId,
              name: item.name,
              size: item.size,
              price: item.priceValue,
              quantity: item.quantity,
              sku: item.sku,
              color: item.color,
              collection: item.collection,
            }),
          );
          track(
            {
              name: "purchase",
              products,
              value: found.total,
              currency: found.payment.currency ?? "COP",
            },
            {
              eventId: buildPurchaseEventId(found.id),
              transactionId: buildGa4TransactionId(found.orderNumber),
            },
          );
          try {
            window.sessionStorage.setItem(dedupeKey, "1");
          } catch {
            // Sin storage no se puede recordar -- se acepta el riesgo de un
            // posible reenvío en vez de romper nada (mismo criterio de
            // arriba).
          }
        }
      }
    });
    getFreeShippingThresholdAction().then(setFreeShippingThreshold);
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

  const orderDateTime = formatOrderDateTime(order.date);
  const orderQualifiesForFreeShipping = qualifiesForFreeShipping(
    order.subtotal ?? order.total,
    order.discountValue ?? 0,
    freeShippingThreshold,
  );

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
          Pedido #{order.orderNumber} · {orderDateTime.date} ·{" "}
          {orderDateTime.time}
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
              {order.shippingAddress.email ? (
                <>
                  <br />
                  {order.shippingAddress.email}
                </>
              ) : null}
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
            {order.payment.provider === "whatsapp" ? (
              <p className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                <CheckCircleIcon className="h-4 w-4" />
                Pendiente de coordinar por WhatsApp
              </p>
            ) : order.payment.status === "succeeded" ? (
              <p className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-4 w-4" />
                Pago aprobado
              </p>
            ) : (
              // Estado en vivo (no un snapshot): un pago que se creó
              // aprobado puede terminar en FAILED/CANCELLED más tarde si un
              // webhook de Wompi lo revierte (ver applyWompiWebhookUpdateAction)
              // — nunca mostrar "aprobado" para eso, aunque el pedido se
              // haya creado en su momento con el pago en regla.
              <p className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                Este pago ya no está aprobado — contactanos si tenés dudas.
              </p>
            )}
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {PAYMENT_PROVIDER_LABELS[order.payment.provider]}
              {order.payment.last4 ? ` · Tarjeta terminada en ${order.payment.last4}` : ""}
              {" · "}
              {order.payment.transactionId}
            </p>
          </div>
        ) : null}

        <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <CostSummary
            subtotal={order.subtotal ?? order.total}
            discount={order.discountValue ?? 0}
            total={order.total}
            freeShippingThreshold={freeShippingThreshold}
            qualifiesForFreeShipping={orderQualifiesForFreeShipping}
          />
          <div className="mt-4">
            <ShippingNotice
              qualifiesForFreeShipping={orderQualifiesForFreeShipping}
              freeShippingThreshold={freeShippingThreshold}
            />
          </div>
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
