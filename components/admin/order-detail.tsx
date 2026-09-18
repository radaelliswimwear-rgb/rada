"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { orderNeedsRefundReview } from "lib/admin/fulfillment-rules";
import { buildCancelConfirmationMessage } from "lib/admin/cancellation-copy";
import { adminOrdersRepository } from "lib/admin/orders-repository";
import { FULFILLMENT_STATUS_OPTIONS, type AdminOrder } from "lib/admin/types";
import { qualifiesForFreeShipping } from "lib/checkout/pricing";
import { buildCustomerWhatsappUrl } from "lib/checkout/whatsapp";
import { formatDate, formatOrderDateTime, formatPrice } from "lib/format";
import type { FulfillmentStatus } from "lib/orders/types";

const PAYMENT_STATE_LABEL: Record<string, string> = {
  succeeded: "Aprobado",
  pending: "Pendiente",
  failed: "Rechazado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right text-neutral-900 dark:text-neutral-100">
        {value}
      </span>
    </div>
  );
}

export function OrderDetail({ initialOrder }: { initialOrder: AdminOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    shippingCarrier: order.shippingCarrier ?? "",
    trackingNumber: order.trackingNumber ?? "",
    trackingUrl: order.trackingUrl ?? "",
    dispatchedAt: toDatetimeLocalValue(order.dispatchedAt),
    quotedShippingCost:
      order.quotedShippingCost != null ? String(order.quotedShippingCost) : "",
  });
  const address = order.shippingAddress;
  const payment = order.payment;
  const isWhatsapp = payment?.provider === "whatsapp";
  const paymentStateLabel = isWhatsapp
    ? "Pendiente de coordinar por WhatsApp"
    : (payment?.status && PAYMENT_STATE_LABEL[payment.status]) || "—";
  const paymentDateTime = payment?.createdAt
    ? formatOrderDateTime(payment.createdAt)
    : null;

  const needsRefundReview = orderNeedsRefundReview(
    order.fulfillmentStatus,
    payment?.status,
  );
  const refundedButUnconfirmed =
    order.fulfillmentStatus === "Reembolsado" && payment?.status === "succeeded";

  const freeShippingThreshold = order.freeShippingThresholdSnapshot;
  const isFreeShipping =
    freeShippingThreshold != null
      ? qualifiesForFreeShipping(
          order.subtotal ?? order.total,
          order.discountValue ?? 0,
          freeShippingThreshold,
        )
      : null;

  const whatsappUrl = address?.phone
    ? buildCustomerWhatsappUrl(
        address.phone,
        `Hola ${address.fullName.split(" ")[0] ?? ""}, somos Radaelli Swimwear 🤍. Recibimos correctamente tu pedido #${order.orderNumber}. Te contactamos para coordinar los detalles de tu entrega.`,
      )
    : null;

  const onStatusChange = async (status: FulfillmentStatus) => {
    if (status === "Cancelado") {
      const confirmed = window.confirm(
        buildCancelConfirmationMessage(payment?.status),
      );
      if (!confirmed) return;
    }
    setIsUpdating(true);
    const result = await adminOrdersRepository.updateFulfillmentStatus(
      order.id,
      status,
    );
    setIsUpdating(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setOrder((prev) => ({ ...prev, fulfillmentStatus: status }));
    toast("Estado del pedido actualizado.");
  };

  const onSaveShipping = async () => {
    setIsSavingShipping(true);
    const quotedShippingCost = shippingForm.quotedShippingCost.trim()
      ? Number(shippingForm.quotedShippingCost)
      : null;
    const dispatchedAt = shippingForm.dispatchedAt
      ? new Date(shippingForm.dispatchedAt).toISOString()
      : null;
    const result = await adminOrdersRepository.updateShippingDetails(order.id, {
      shippingCarrier: shippingForm.shippingCarrier || null,
      trackingNumber: shippingForm.trackingNumber || null,
      trackingUrl: shippingForm.trackingUrl || null,
      dispatchedAt,
      quotedShippingCost,
    });
    setIsSavingShipping(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setOrder((prev) => ({
      ...prev,
      shippingCarrier: shippingForm.shippingCarrier || null,
      trackingNumber: shippingForm.trackingNumber || null,
      trackingUrl: shippingForm.trackingUrl || null,
      dispatchedAt,
      quotedShippingCost,
    }));
    toast("Datos de envío guardados.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-neutral-500">
            {formatDate(order.date)} · {order.id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={order.fulfillmentStatus}
            disabled={isUpdating}
            onChange={(e) => onStatusChange(e.target.value as FulfillmentStatus)}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {FULFILLMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-700"
            >
              Contactar por WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      {needsRefundReview ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">Reembolso pendiente de resolver</p>
          <p className="mt-1">
            El pago de este pedido quedó aprobado (SUCCEEDED) y el pedido está{" "}
            {order.fulfillmentStatus.toLowerCase()}. El sistema no reembolsa
            automáticamente — hay que resolverlo directamente en Wompi.
          </p>
        </div>
      ) : null}
      {refundedButUnconfirmed ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">Sin confirmación del proveedor</p>
          <p className="mt-1">
            El pedido está marcado como reembolsado operativamente, pero el
            sistema no tiene confirmación de reembolso del proveedor.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Section title="Productos">
            <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-neutral-500">
                      {[
                        item.collection,
                        item.color,
                        `Talla ${item.size}`,
                        `Cant. ${item.quantity}`,
                        item.sku ? `SKU ${item.sku}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(item.priceValue * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Cliente y envío">
            <Row label="Nombre" value={address?.fullName} />
            <Row label="Correo" value={address?.email} />
            <Row label="WhatsApp" value={address?.phone} />
            <Row
              label="Dirección"
              value={
                address
                  ? `${address.street}${address.apartmentDetails ? `, ${address.apartmentDetails}` : ""}`
                  : undefined
              }
            />
            <Row label="Barrio" value={address?.neighborhood} />
            <Row
              label="Ciudad"
              value={address ? `${address.city}, ${address.province}` : undefined}
            />
            <Row label="País" value={address?.country} />
            <Row label="Indicaciones" value={address?.deliveryNotes} />
          </Section>

          <Section title="Envío">
            <Row
              label="Condición"
              value={
                isFreeShipping === null ? (
                  <span className="text-neutral-400">No se pudo determinar</span>
                ) : isFreeShipping ? (
                  <span className="font-medium text-green-700 dark:text-green-400">
                    ENVÍO ESTÁNDAR GRATIS
                  </span>
                ) : (
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    ENVÍO POR COORDINAR CON CLIENTA
                  </span>
                )
              }
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Transportadora
                <input
                  type="text"
                  maxLength={80}
                  value={shippingForm.shippingCarrier}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      shippingCarrier: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  placeholder="Ej. Servientrega"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                N° de guía
                <input
                  type="text"
                  maxLength={80}
                  value={shippingForm.trackingNumber}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      trackingNumber: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
                Link de seguimiento (opcional)
                <input
                  type="text"
                  value={shippingForm.trackingUrl}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      trackingUrl: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  placeholder="https://..."
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Fecha de despacho
                <input
                  type="datetime-local"
                  value={shippingForm.dispatchedAt}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      dispatchedAt: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Costo de envío cotizado (COP, opcional)
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={shippingForm.quotedShippingCost}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      quotedShippingCost: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={isSavingShipping}
              onClick={onSaveShipping}
              className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {isSavingShipping ? "Guardando..." : "Guardar datos de envío"}
            </button>
          </Section>

          {order.fulfillmentHistory && order.fulfillmentHistory.length > 0 ? (
            <Section title="Historial">
              <div className="flex flex-col gap-2">
                {order.fulfillmentHistory.map((event) => (
                  <div
                    key={event.id}
                    className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400"
                  >
                    <span>{event.status}</span>
                    <span className="text-xs text-neutral-400">
                      {formatDate(event.createdAt)}
                      {event.changedByEmail ? ` · ${event.changedByEmail}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Pago">
            <Row label="Estado del pago" value={paymentStateLabel} />
            {payment ? (
              <>
                <Row label="Proveedor" value={payment.provider} />
                <Row label="Referencia" value={payment.transactionId} />
                {payment.wompiTransactionId ? (
                  <Row
                    label="ID transacción Wompi"
                    value={payment.wompiTransactionId}
                  />
                ) : null}
                {payment.last4 ? (
                  <Row label="Tarjeta" value={`•••• ${payment.last4}`} />
                ) : null}
                {payment.amount != null ? (
                  <Row
                    label="Monto"
                    value={`${formatPrice(payment.amount)} ${payment.currency ?? ""}`}
                  />
                ) : null}
                {paymentDateTime ? (
                  <Row
                    label="Fecha del pago"
                    value={`${paymentDateTime.date} · ${paymentDateTime.time} (Colombia)`}
                  />
                ) : null}
              </>
            ) : null}
          </Section>

          <Section title="Resumen">
            <Row label="Subtotal" value={formatPrice(order.subtotal ?? order.total)} />
            {order.discountValue ? (
              <Row
                label={`Descuento${order.couponCode ? ` (${order.couponCode})` : ""}`}
                value={`-${formatPrice(order.discountValue)}`}
              />
            ) : null}
            <Row
              label="Total"
              value={
                <span className="font-semibold">{formatPrice(order.total)}</span>
              }
            />
          </Section>

          <Link
            href="/admin/pedidos"
            className="text-center text-sm text-neutral-500 underline-offset-4 hover:underline"
          >
            ← Volver a pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
